import { create } from 'zustand'
import api, { BASE_URL } from '../utils/api'

const STREAM_DELAY_MS = 28

const getToken = () => localStorage.getItem('token')

// ── Persist active session + model across refreshes ───────────────────────────
const SESSION_KEY = 'edulens_active_session'
const MODEL_KEY   = 'edulens_model'

const persistedSessionId = localStorage.getItem(SESSION_KEY) || null
const persistedModel     = localStorage.getItem(MODEL_KEY) || 'llama-3.1-8b-instant'

export const useChatStore = create((set, get) => ({
  sessions: [],
  activeSessionId: persistedSessionId,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  model: persistedModel,
  totalTokens: 0,

  setModel: (model) => {
    localStorage.setItem(MODEL_KEY, model)
    set({ model })
  },

  loadSessions: async () => {
    const token = getToken()
    if (!token) { set({ sessions: [] }); return }
    try {
      const { data } = await api.get('/sessions', { headers: { Authorization: `Bearer ${token}` } })
      const sessions = Array.isArray(data) ? data : data.sessions || []
      set({ sessions })

      // Auto-restore the last active session if it still exists
      const { activeSessionId } = get()
      if (activeSessionId && sessions.find(s => s.id === activeSessionId)) {
        // Session still valid — load its messages
        get().setActiveSession(activeSessionId)
      } else if (activeSessionId && !sessions.find(s => s.id === activeSessionId)) {
        // Stored session no longer exists (deleted) — clear it
        localStorage.removeItem(SESSION_KEY)
        set({ activeSessionId: null, messages: [] })
      }
    } catch {
      set({ sessions: [] })
    }
  },

  createSession: async (systemPrompt = 'assistant') => {
    const token = getToken()
    const { data } = await api.post('/sessions',
      { system_prompt: systemPrompt },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    localStorage.setItem(SESSION_KEY, data.id)
    set((s) => ({ sessions: [data, ...s.sessions], activeSessionId: data.id, messages: [] }))
    return data
  },

  setActiveSession: async (id) => {
    localStorage.setItem(SESSION_KEY, id)
    set({ activeSessionId: id, messages: [], streamingContent: '' })
    const token = getToken()
    try {
      const { data } = await api.get(`/chat/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      set({ messages: Array.isArray(data) ? data : data.messages || [] })
    } catch {
      set({ messages: [] })
    }
  },

  renameSession: async (id, title) => {
    const token = getToken()
    await api.patch(`/sessions/${id}`, { title }, { headers: { Authorization: `Bearer ${token}` } })
    set((s) => ({ sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, title } : sess) }))
  },

  deleteSession: async (id) => {
    const token = getToken()
    await api.delete(`/sessions/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const { activeSessionId, sessions } = get()
    const remaining = sessions.filter((s) => s.id !== id)
    const next = activeSessionId === id ? (remaining[0]?.id || null) : activeSessionId

    if (next) {
      localStorage.setItem(SESSION_KEY, next)
    } else {
      localStorage.removeItem(SESSION_KEY)
    }

    set({ sessions: remaining, activeSessionId: next, messages: next ? get().messages : [] })

    if (next && activeSessionId === id) {
      try {
        const { data } = await api.get(`/chat/${next}/messages`, { headers: { Authorization: `Bearer ${token}` } })
        set({ messages: Array.isArray(data) ? data : data.messages || [] })
      } catch {
        set({ messages: [] })
      }
    }
  },

  sendMessage: async (content, images = []) => {
    const { activeSessionId, model } = get()
    if (!activeSessionId) return

    const token = getToken()
    const userMsg = {
      id: Date.now(), role: 'user', content: content || '',
      images, created_at: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], isStreaming: true, streamingContent: '' }))

    const controller = new AbortController()
    const streamTimeout = setTimeout(() => controller.abort(), 90_000)

    try {
      const response = await fetch(`${BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        signal: controller.signal,
        body: JSON.stringify({
          session_id: activeSessionId, message: content, model,
          images: images.map((img) => ({ data_url: img.dataUrl, media_type: img.type || img.mediaType || 'image/jpeg' })),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Request failed' }))
        set((s) => ({
          messages: [...s.messages, { id: Date.now(), role: 'assistant', content: `⚠️ Error: ${err.detail || 'Something went wrong'}`, token_count: 0, created_at: new Date().toISOString() }],
          isStreaming: false, streamingContent: '',
        }))
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = '', fullText = '', doneEvent = null

      const finalize = (event) => {
        set((s) => ({
          messages: [...s.messages, { id: event.message_id || Date.now(), role: 'assistant', content: fullText || get().streamingContent || '', token_count: event.tokens || 0, created_at: new Date().toISOString() }],
          streamingContent: '', isStreaming: false, totalTokens: event.tokens || 0,
        }))
        get().loadSessions()
      }

      let dripPos = 0, dripRunning = false, dripFinished = false
      const runDrip = () => {
        if (dripRunning) return
        dripRunning = true
        const tick = () => {
          const end = Math.min(dripPos + 4, fullText.length)
          if (end > dripPos) { dripPos = end; set({ streamingContent: fullText.slice(0, end) }) }
          if (dripPos < fullText.length) { setTimeout(tick, STREAM_DELAY_MS) }
          else if (doneEvent) { dripRunning = false; dripFinished = true; finalize(doneEvent) }
          else { dripRunning = false }
        }
        tick()
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'token') { fullText += (typeof event.content === 'string' ? event.content : JSON.stringify(event.content)); runDrip() }
            else if (event.type === 'done') { doneEvent = event; if (dripFinished || dripPos >= fullText.length) finalize(event) }
            else if (event.type === 'error') {
              doneEvent = { message_id: Date.now(), tokens: 0 }
              set((s) => ({ messages: [...s.messages, { id: Date.now(), role: 'assistant', content: 'Error: ' + event.content, token_count: 0, created_at: new Date().toISOString() }], isStreaming: false, streamingContent: '' }))
            }
          } catch {}
        }
      }
      if (!doneEvent) finalize({ tokens: 0, message_id: Date.now() })
    } catch (err) {
      clearTimeout(streamTimeout)
      const isTimeout = err.name === 'AbortError'
      const partialContent = get().streamingContent
      set((s) => ({
        messages: [...s.messages, { id: Date.now(), role: 'assistant', content: partialContent || (isTimeout ? '⚠️ Request timed out.' : `⚠️ Connection error: ${err.message}`), token_count: 0, created_at: new Date().toISOString() }],
        isStreaming: false, streamingContent: '',
      }))
    } finally { clearTimeout(streamTimeout) }
  },

  exportChat: async () => {
    const { activeSessionId } = get()
    if (!activeSessionId) return
    const token = getToken()
    const { data } = await api.get(`/chat/${activeSessionId}/export`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `chat-${activeSessionId.slice(0, 8)}.json`; a.click()
    URL.revokeObjectURL(url)
  },

  clearActiveSession: () => {
    localStorage.removeItem(SESSION_KEY)
    set({ activeSessionId: null, messages: [], streamingContent: '', totalTokens: 0 })
  },

  clearSessionState: () => {
    localStorage.removeItem(SESSION_KEY)
    set({ sessions: [], activeSessionId: null, messages: [], streamingContent: '', totalTokens: 0 })
  },
}))
