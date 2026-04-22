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

    // FIX: Use an AbortController with a timeout so the fetch never hangs
    // indefinitely when Render's proxy silently drops the SSE connection.
    const controller = new AbortController()
    // 90s total timeout — generous enough for long responses, short enough to recover
    const streamTimeout = setTimeout(() => controller.abort(), 90_000)

    try {
      // Use absolute URL in production, relative in dev
      const streamUrl = `${BASE_URL}/api/chat/stream`

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
      // fullText accumulates ALL tokens as they arrive from the network.
      // streamingContent in the store is what's been rendered so far (drip effect).
      // finalize() always uses fullText so it never depends on drip timing.
      let fullText = ''
      let doneEvent = null

      const finalize = (event) => {
        // Snap the final message into place using the complete text we accumulated,
        // not whatever streamingContent managed to render before drip finished.
        set((s) => ({
          messages: [...s.messages, {
            id: event.message_id || Date.now(),
            role: 'assistant',
            content: fullText || get().streamingContent || '',
            token_count: event.tokens || 0,
            created_at: new Date().toISOString(),
          }],
          streamingContent: '',
          isStreaming: false,
          totalTokens: event.tokens || 0,
        }))
        get().loadSessions()
      }

      // Drip renders characters one batch at a time for the typing effect.
      // It reads from fullText so it always has the latest content even if
      // new tokens arrived while it was mid-render.
      let dripPos = 0
      let dripRunning = false
      let dripFinished = false

      const runDrip = () => {
        if (dripRunning) return
        dripRunning = true
        const tick = () => {
          // Render up to 4 chars per tick from fullText
          const end = Math.min(dripPos + 4, fullText.length)
          if (end > dripPos) {
            const slice = fullText.slice(0, end)
            dripPos = end
            set({ streamingContent: slice })
          }
          if (dripPos < fullText.length) {
            // More text to render
            setTimeout(tick, STREAM_DELAY_MS)
          } else if (doneEvent) {
            // Stream finished AND drip caught up — finalize now
            dripRunning = false
            dripFinished = true
            finalize(doneEvent)
          } else {
            // Drip caught up but stream still ongoing — wait for more tokens
            dripRunning = false
          }
        }
        tick()
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
              if (typeof token !== 'string') token = JSON.stringify(token)
              fullText += token
              // Restart drip if it paused waiting for more tokens
              runDrip()
            } else if (event.type === 'done') {
              doneEvent = event
              // If drip already finished rendering everything, finalize immediately.
              // Otherwise drip's tick() will call finalize when it catches up.
              if (dripFinished || dripPos >= fullText.length) {
                finalize(event)
              }
            } else if (event.type === 'error') {
              doneEvent = { message_id: Date.now(), tokens: 0 } // stop drip
              set((s) => ({
                messages: [...s.messages, {
                  id: Date.now(), role: 'assistant',
                  content: 'Error: ' + event.content,
                  token_count: 0, created_at: new Date().toISOString(),
                }],
                isStreaming: false, streamingContent: '',
              }))
            }
          } catch {}
        }
      }

      // FIX: Stream closed (done=true). If we never got a 'done' SSE event,
      // isStreaming would stay true forever - the core cause of the hang.
      // Stream reader finished. If we never got a 'done' SSE event, clean up.
      if (!doneEvent) {
        if (fullText) {
          // Got tokens but stream closed without done event - finalize what we have
          finalize({ tokens: 0, message_id: Date.now() })
        } else {
          set((s) => ({
            messages: [...s.messages, {
              id: Date.now(), role: 'assistant',
              content: 'Stream closed with no response. Make sure GROQ_API_KEY is set in Render environment variables.',
              token_count: 0, created_at: new Date().toISOString(),
            }],
            isStreaming: false, streamingContent: '',
          }))
        }
      }
    } catch (err) {
      clearTimeout(streamTimeout)
      const isTimeout = err.name === 'AbortError'
      const partialContent = get().streamingContent
      if (partialContent) {
        // Finalize whatever we received before the connection dropped
        set((s) => ({
          messages: [...s.messages, {
            id: Date.now(), role: 'assistant',
            content: partialContent + (isTimeout ? '\n\n⚠️ Response timed out.' : ''),
            token_count: 0, created_at: new Date().toISOString(),
          }],
          isStreaming: false, streamingContent: '',
        }))
      } else {
        set((s) => ({
          messages: [...s.messages, {
            id: Date.now(), role: 'assistant',
            content: isTimeout
              ? '⚠️ Request timed out — the server may be starting up (Render cold start takes ~30s). Please try again.'
              : `⚠️ Connection error: ${err.message}`,
            token_count: 0, created_at: new Date().toISOString(),
          }],
          isStreaming: false, streamingContent: '',
        }))
      }
      console.error('Stream error:', err)
    } finally {
      clearTimeout(streamTimeout)
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
