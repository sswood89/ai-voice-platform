'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Send, X, Loader2, Volume2, VolumeX } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface EmbedConfig {
  name: string;
  personaName: string;
  personaAvatar?: string;
  welcomeMessage?: string;
  primaryColor: string;
  theme: 'light' | 'dark' | 'auto';
}

export default function WidgetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const embedId = params.embedId as string;

  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Determine theme
  useEffect(() => {
    const themeParam = searchParams.get('theme') || 'auto';
    if (themeParam === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(themeParam as 'light' | 'dark');
    }
  }, [searchParams]);

  // Load embed config
  useEffect(() => {
    async function loadConfig() {
      try {
        const origin = searchParams.get('origin') || window.location.origin;
        const res = await fetch(`/api/widget/config?embedId=${embedId}&origin=${encodeURIComponent(origin)}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load widget');
        }

        const data = await res.json();
        setConfig(data.config);
        setSessionId(data.sessionId);

        // Add welcome message if configured
        if (data.config.welcomeMessage) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: data.config.welcomeMessage,
          }]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load widget');
      }
    }

    loadConfig();
  }, [embedId, searchParams]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notify parent when ready
  useEffect(() => {
    window.parent.postMessage({ type: 'ai-voice-widget-ready' }, '*');
  }, []);

  const handleClose = useCallback(() => {
    window.parent.postMessage({ type: 'ai-voice-widget-close' }, '*');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedId,
          sessionId,
          message: userMessage.content,
          voiceEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Play audio if available
      if (data.audioUrl && voiceEnabled) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const primaryColor = searchParams.get('color') || config?.primaryColor || '#6366f1';

  // Error state
  if (error && !config) {
    return (
      <div className={`h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Please check your embed configuration.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!config) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: primaryColor,
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          {config.personaAvatar ? (
            <img
              src={config.personaAvatar}
              alt={config.personaName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
              {config.personaName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-semibold text-white">{config.personaName}</h1>
            <p className="text-xs text-white/70">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
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
                message.role === 'user'
                  ? 'text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800'
                  : 'bg-gray-100'
              }`}
              style={message.role === 'user' ? { backgroundColor: primaryColor } : undefined}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl px-4 py-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}
      >
        <div className={`flex items-end gap-2 rounded-2xl border p-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={`flex-1 resize-none bg-transparent outline-none text-sm px-2 py-1 max-h-32 ${theme === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full transition-colors disabled:opacity-50"
            style={{
              backgroundColor: input.trim() && !isLoading ? primaryColor : 'transparent',
              color: input.trim() && !isLoading ? 'white' : theme === 'dark' ? '#9ca3af' : '#6b7280',
            }}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
          Powered by AI Voice Platform
        </p>
      </form>
    </div>
  );
}
