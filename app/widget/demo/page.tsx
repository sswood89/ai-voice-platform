'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Volume2, VolumeX } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Demo widget page - works without Supabase for testing
 * Access at: /widget/demo
 */
export default function DemoWidgetPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm a demo AI assistant. This widget works without Supabase - try sending a message!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const primaryColor = '#6366f1';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount and after loading completes
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Refocus when loading completes
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Request focus from parent when window receives focus (for iframe embedding)
  useEffect(() => {
    const handleWindowFocus = () => {
      inputRef.current?.focus();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'focus-widget') {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the main chat API directly (works with local LLM providers)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider: 'ollama', // Use Ollama for demo (no API key needed)
          model: 'llama3.2',
          maxTokens: 1024,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      const assistantMessage: Message = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: '',
      };
      setMessages((prev) => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullResponse }
                      : m
                  )
                );
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-error',
          role: 'assistant',
          content: 'Sorry, I encountered an error. Make sure Ollama is running with llama3.2 model.',
        },
      ]);
    } finally {
      setIsLoading(false);
      // Refocus input after response
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
            D
          </div>
          <div>
            <h1 className="font-semibold text-white">Demo Assistant</h1>
            <p className="text-xs text-white/70">Widget Preview</p>
          </div>
        </div>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className="p-2 rounded-full hover:bg-white/10 text-white"
        >
          {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user' ? 'text-white' : 'bg-gray-100'
              }`}
              style={message.role === 'user' ? { backgroundColor: primaryColor } : undefined}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-end gap-2 rounded-2xl border bg-gray-50 p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => !isLoading && setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isLoading ? "Thinking..." : "Type a message..."}
            rows={1}
            autoFocus
            className={`flex-1 resize-none bg-transparent outline-none text-sm px-2 py-1 ${isLoading ? 'opacity-50' : ''}`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            className="p-2 rounded-full transition-colors disabled:opacity-50"
            style={{
              backgroundColor: input.trim() && !isLoading ? primaryColor : 'transparent',
              color: input.trim() && !isLoading ? 'white' : '#6b7280',
            }}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs mt-2 text-center text-gray-400">
          Demo Mode - Using Ollama
        </p>
      </form>
    </div>
  );
}
