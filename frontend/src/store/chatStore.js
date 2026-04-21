import { create } from 'zustand'
import api from '../utils/api'

// Throttle streaming so tokens render visibly (~30ms between batches)
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
    set({ sessions: data })
  },

  createSession: async (systemPrompt = 'assistant') => {
    const { data } = await api.post('/sessions', { system_prompt: systemPrompt })
    set((s) => ({ sessions: [data, ...s.sessions], activeSessionId: data.id, messages: [] }))
    return data
  },

  setActiveSession: async (id) => {
    set({ activeSessionId: id, messages: [], streamingContent: '' })
    const { data } = await api.get(`/chat/${id}/messages`)
    set({ messages: data })
  },

  renameSession: async (id, title) => {
    await api.patch(`/sessions/${id}`, { title })
    set((s) => ({
      sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, title } : sess)
    }))
  },

  deleteSession: async (id) => {
    await api.delete(`/sessions/${id}`)
    const { activeSessionId, sessions } = get()
    const remaining = sessions.filter((s) => s.id !== id)
    const next = activeSessionId === id ? (remaining[0]?.id || null) : activeSessionId
    set({ sessions: remaining, activeSessionId: next, messages: next ? get().messages : [] })
    if (next && activeSessionId === id) {
      const { data } = await api.get(`/chat/${next}/messages`)
      set({ messages: data })
    }
  },

  sendMessage: async (content, images = []) => {
    const { activeSessionId, model } = get()
    if (!activeSessionId) return

    const userMsg = { id: Date.now(), role: 'user', content, images, created_at: new Date().toISOString() }
    set((s) => ({ messages: [...s.messages, userMsg], isStreaming: true, streamingContent: '' }))

    try {
      const response = await fetch(`/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId, message: content, model }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let tokenQueue = []
      let rendering = false

      // Drip tokens out with a small delay for visible streaming effect
      const drip = () => {
        rendering = true
        const flush = () => {
          if (tokenQueue.length === 0) { rendering = false; return }
          const batch = tokenQueue.splice(0, 3).join('')  // render 3 chars at a time
          set((s) => ({ streamingContent: s.streamingContent + batch }))
          setTimeout(flush, STREAM_DELAY_MS)
        }
        flush()
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
              // Push each character individually for character-level drip
              for (const ch of event.content) tokenQueue.push(ch)
              if (!rendering) drip()
            } else if (event.type === 'done') {
              console.log('Received done event:', event)
              // Wait for drip queue to finish before finalizing
              const waitForDrip = () => {
                if (tokenQueue.length > 0 || rendering) {
                  setTimeout(waitForDrip, 50)
                  return
                }
                const finalContent = get().streamingContent
                console.log('Finalizing message with content length:', finalContent.length)
                const assistantMsg = {
                  id: event.message_id,
                  role: 'assistant',
                  content: finalContent,
                  token_count: event.tokens,
                  created_at: new Date().toISOString(),
                }
                set((s) => ({
                  messages: [...s.messages, assistantMsg],
                  streamingContent: '',
                  isStreaming: false,
                  totalTokens: event.tokens,
                }))
                // Defer so it doesn't cascade into the same render cycle
                setTimeout(() => get().loadSessions(), 100)
              }
              waitForDrip()
            } else if (event.type === 'error') {
              set({ isStreaming: false, streamingContent: '' })
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e, line)
          }
        }
      }
    } catch (err) {
      set({ isStreaming: false, streamingContent: '' })
      console.error(err)
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
