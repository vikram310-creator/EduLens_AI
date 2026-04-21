import { create } from 'zustand'
import api, { BASE_URL } from '../utils/api'

const STREAM_DELAY_MS = 28

export const useChatStore = create((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  model: 'llama-3.1-8b-instant',
  totalTokens: 0,

  setModel: (model) => set({ model }),

  loadSessions: async () => {
    const { data } = await api.get('/sessions')
    set({ sessions: Array.isArray(data) ? data : data.sessions || [] })
  },

  createSession: async (systemPrompt = 'assistant') => {
    const { data } = await api.post('/sessions', { system_prompt: systemPrompt })
    set((s) => ({ sessions: [data, ...s.sessions], activeSessionId: data.id, messages: [] }))
    return data
  },

  setActiveSession: async (id) => {
    set({ activeSessionId: id, messages: [], streamingContent: '' })
    const { data } = await api.get(`/chat/${id}/messages`)
    set({ messages: Array.isArray(data) ? data : data.messages || [] })
  },

  renameSession: async (id, title) => {
    await api.patch(`/sessions/${id}`, { title })
    set((s) => ({ sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, title } : sess) }))
  },

  deleteSession: async (id) => {
    await api.delete(`/sessions/${id}`)
    const { activeSessionId, sessions } = get()
    const remaining = sessions.filter((s) => s.id !== id)
    const next = activeSessionId === id ? (remaining[0]?.id || null) : activeSessionId
    set({ sessions: remaining, activeSessionId: next, messages: next ? get().messages : [] })
    if (next && activeSessionId === id) {
      const { data } = await api.get(`/chat/${next}/messages`)
      set({ messages: Array.isArray(data) ? data : data.messages || [] })
    }
  },

  sendMessage: async (content, images = []) => {
    const { activeSessionId, model } = get()
    if (!activeSessionId) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: content || '',
      _images: images,
      created_at: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], isStreaming: true, streamingContent: '' }))

    try {
      // Use absolute URL in production, relative in dev
      const streamUrl = `${BASE_URL}/api/chat/stream`

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          message: content,
          model,
          images: images.map((img) => ({ data_url: img.dataUrl, media_type: img.mediaType })),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Request failed' }))
        set((s) => ({
          messages: [...s.messages, {
            id: Date.now(), role: 'assistant',
            content: `⚠️ Error: ${err.detail || 'Something went wrong'}`,
            token_count: 0, created_at: new Date().toISOString(),
          }],
          isStreaming: false, streamingContent: '',
        }))
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const state = { queue: [], rendering: false, stopped: false, doneEvent: null }

      const drip = () => {
        state.rendering = true
        const flush = () => {
          if (state.stopped) { state.rendering = false; return }
          if (state.queue.length === 0) {
            state.rendering = false
            if (state.doneEvent) finalize(state.doneEvent)
            return
          }
          const batch = state.queue.splice(0, 3).join('')
          set((s) => ({ streamingContent: s.streamingContent + batch }))
          setTimeout(flush, STREAM_DELAY_MS)
        }
        flush()
      }

      const finalize = (event) => {
        if (state.stopped) return
        state.stopped = true
        const finalContent = get().streamingContent
        set((s) => ({
          messages: [...s.messages, {
            id: event.message_id,
            role: 'assistant',
            content: String(finalContent || ''),
            token_count: event.tokens || 0,
            created_at: new Date().toISOString(),
          }],
          streamingContent: '',
          isStreaming: false,
          totalTokens: event.tokens || 0,
        }))
        get().loadSessions()
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'token') {
              let token = event.content
              if (typeof token !== 'string') {
                token = JSON.stringify(token)
              }
              for (const ch of token) tokenQueue.push(ch)
              if (!state.rendering) drip()
            } else if (event.type === 'done') {
              if (state.rendering || state.queue.length > 0) state.doneEvent = event
              else finalize(event)
            } else if (event.type === 'error') {
              state.stopped = true
              set((s) => ({
                messages: [...s.messages, {
                  id: Date.now(), role: 'assistant',
                  content: `⚠️ ${event.content}`,
                  token_count: 0, created_at: new Date().toISOString(),
                }],
                isStreaming: false, streamingContent: '',
              }))
            }
          } catch {}
        }
      }
    } catch (err) {
      set({ isStreaming: false, streamingContent: '' })
      console.error('Stream error:', err)
    }
  },

  exportChat: async () => {
    const { activeSessionId } = get()
    if (!activeSessionId) return
    const { data } = await api.get(`/chat/${activeSessionId}/export`)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${activeSessionId.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },
}))
