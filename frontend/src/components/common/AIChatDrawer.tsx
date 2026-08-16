import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react'
import { llmAPI } from '../../services/api'

interface Message {
  role: 'user' | 'model'
  content: string
}

interface AIChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  module: string
  contextData: any
}

export default function AIChatDrawer({ isOpen, onClose, module, contextData }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'model',
          content: `Hello! I'm your Industry 4.0 AI Assistant for the ${module} module. I've received the latest data context. How can I help you analyze it?`
        }
      ])
    }
  }, [isOpen, module, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const response = await llmAPI.chat(contextData, [...messages, { role: 'user', content: userMsg }])
      setMessages(prev => [...prev, { role: 'model', content: response.reply }])
    } catch (err: any) {
      setError('AI Service Temporarily Unavailable')
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again later.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Floating Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-6 right-6 z-[1000] w-full max-w-[calc(100vw-48px)] sm:w-[360px] h-[520px] max-h-[calc(100vh-48px)] shadow-2xl flex flex-col rounded-xl border border-slate-700/50 overflow-hidden"
            style={{ background: 'rgba(11,20,35,0.95)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.1)' }}>
                  <Bot size={18} style={{ color: '#06B6D4' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">AI Assistant</h3>
                  <p className="text-[10px] text-slate-400 capitalize">{module} Context Active</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} className="text-slate-400 hover:text-slate-200" />
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 mx-4 mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    {msg.role === 'user' ? (
                      <div className="p-1.5 rounded-full bg-blue-500/20">
                        <User size={14} className="text-blue-400" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-full bg-cyan-500/20">
                        <Bot size={14} className="text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg text-sm leading-relaxed max-w-[85%] ${
                    msg.role === 'user' 
                      ? 'bg-blue-600/20 text-blue-100 border border-blue-500/20' 
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1 p-1.5 rounded-full bg-cyan-500/20">
                    <Bot size={14} className="text-cyan-400" />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center gap-2">
                    <Loader2 size={14} className="text-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-400">Analyzing data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question about the results..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                AI can make mistakes. Verify critical industrial parameters.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
