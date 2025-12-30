'use client';

/**
 * ChatInterface Component
 * Main chat interface with message history and input
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Volume2, VolumeX, Loader2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore, usePersonaStore, useSettingsStore, useMemoryStore } from '@/stores';
import { buildSystemPromptWithMemories } from '@/lib/memory';
import { buildSystemPrompt } from '@/lib/persona';
import { summarizeMessages } from '@/lib/memory';
import { MessageList } from './MessageList';
import { MemoryIndicator } from './MemoryIndicator';
import { clsx } from 'clsx';
import type { Memory } from '@/types';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [activeMemories, setActiveMemories] = useState<Memory[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    getActiveConversation,
    addMessage,
    updateMessage,
    streaming,
    startStreaming,
    updateStreamingContent,
    stopStreaming,
    createConversation,
    setLoading,
    isLoading,
    needsSummarization,
    getMessagesToSummarize,
    markMessagesSummarized,
    removeSummarizedMessages,
  } = useChatStore();

  const { getActivePersona } = usePersonaStore();
  const settings = useSettingsStore();
  const { findRelevantMemories, addMemory, config: memoryConfig } = useMemoryStore();

  const activeConversation = getActiveConversation();
  const activePersona = getActivePersona();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming.isStreaming) return;

    let conversation = activeConversation;

    // Create conversation if none exists
    if (!conversation) {
      conversation = createConversation({
        personaId: activePersona?.id,
        title: input.slice(0, 50),
      });
    }

    // Add user message
    addMessage(conversation.id, {
      role: 'user',
      content: input.trim(),
    });

    const userInput = input.trim();
    setInput('');

    // Add placeholder for assistant response
    const assistantMessage = addMessage(conversation.id, {
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    startStreaming(assistantMessage.id);
    setLoading(true);

    // Retrieve relevant memories for context
    let relevantMemories: Memory[] = [];
    if (activePersona) {
      const recentMsgs = conversation.messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const memoryResults = findRelevantMemories(activePersona.id, recentMsgs);
      relevantMemories = memoryResults.map((r) => r.memory);
      setActiveMemories(relevantMemories);
    }

    // Build system prompt with memories
    const systemPrompt = activePersona
      ? relevantMemories.length > 0
        ? buildSystemPromptWithMemories(activePersona, relevantMemories)
        : buildSystemPrompt(activePersona)
      : undefined;

    // Get messages for API
    const messages = conversation.messages
      .filter((m) => m.id !== assistantMessage.id)
      .concat({ ...assistantMessage, content: '', role: 'user' as const })
      .slice(-20) // Keep last 20 messages for context
      .map((m) => ({
        role: m.role,
        content: m.content || userInput,
      }));

    // Fix: replace the last message with actual user input
    messages[messages.length - 1] = { role: 'user', content: userInput };

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          provider: settings.provider,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.startsWith('data:'));

          for (const line of lines) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                updateStreamingContent(parsed.content);
                updateMessage(conversation!.id, assistantMessage.id, fullContent);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Generate TTS if enabled
      if (settings.voiceEnabled && activePersona?.voice.voiceId && fullContent) {
        setIsGeneratingAudio(true);
        try {
          const audioResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: fullContent,
              voiceId: activePersona.voice.voiceId,
              voiceSettings: {
                stability: activePersona.voice.stability,
                similarityBoost: activePersona.voice.similarityBoost,
                style: activePersona.voice.style,
              },
            }),
          });

          if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            updateMessage(conversation!.id, assistantMessage.id, fullContent);

            if (settings.autoPlayResponses) {
              const audio = new Audio(audioUrl);
              audio.play().catch(console.error);
            }
          }
        } catch (error) {
          console.error('TTS error:', error);
        } finally {
          setIsGeneratingAudio(false);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error);
        updateMessage(
          conversation!.id,
          assistantMessage.id,
          'Sorry, there was an error generating a response.'
        );
      }
    } finally {
      stopStreaming();
      setLoading(false);
      abortControllerRef.current = null;

      // Check if we need to summarize old messages (async, fire-and-forget)
      if (conversation && activePersona && needsSummarization(conversation.id, memoryConfig)) {
        const messagesToSummarize = getMessagesToSummarize(conversation.id, memoryConfig);
        if (messagesToSummarize.length > 0) {
          // Run summarization in background
          summarizeMessages({
            messages: messagesToSummarize.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            provider: settings.provider,
            model: settings.model,
            personaContext: activePersona.description,
          })
            .then((result) => {
              const memory = addMemory({
                personaId: activePersona.id,
                conversationId: conversation.id,
                summary: result.summary,
                topics: result.topics,
                messageRange: {
                  startId: messagesToSummarize[0].id,
                  endId: messagesToSummarize[messagesToSummarize.length - 1].id,
                  count: messagesToSummarize.length,
                },
              });
              markMessagesSummarized(
                conversation.id,
                messagesToSummarize[messagesToSummarize.length - 1].id,
                memory.id
              );
              // Optionally remove summarized messages to save space
              removeSummarizedMessages(
                conversation.id,
                messagesToSummarize.map((m) => m.id)
              );
              console.log('Memory created:', memory.summary);
            })
            .catch((error) => {
              console.error('Failed to summarize messages:', error);
            });
        }
      }
    }
  }, [
    input,
    streaming.isStreaming,
    activeConversation,
    activePersona,
    settings,
    createConversation,
    addMessage,
    startStreaming,
    updateStreamingContent,
    updateMessage,
    stopStreaming,
    setLoading,
    findRelevantMemories,
    needsSummarization,
    getMessagesToSummarize,
    addMemory,
    markMessagesSummarized,
    removeSummarizedMessages,
    memoryConfig,
  ]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopStreaming();
  }, [stopStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={activeConversation?.messages ?? []}
          streamingContent={streaming.isStreaming ? streaming.partialContent : undefined}
          streamingMessageId={streaming.currentMessageId}
        />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activePersona
                    ? `Message ${activePersona.name}...`
                    : 'Type a message...'
                }
                className="min-h-[52px] max-h-[200px] pr-12 resize-none"
                disabled={streaming.isStreaming}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 bottom-2"
                onClick={() => settings.setVoiceEnabled(!settings.voiceEnabled)}
                title={settings.voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
              >
                {settings.voiceEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {streaming.isStreaming ? (
              <Button
                size="icon"
                variant="destructive"
                onClick={handleStop}
                className="h-[52px] w-[52px]"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={clsx(
                  'h-[52px] w-[52px]',
                  isGeneratingAudio && 'animate-pulse'
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-2">
            {activeMemories.length > 0 && (
              <MemoryIndicator memories={activeMemories} />
            )}
            {activePersona && (
              <p className="text-xs text-muted-foreground">
                Chatting with {activePersona.name} • {settings.provider} / {settings.model}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
