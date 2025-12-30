/**
 * Chat Store
 * Manages chat conversations and messages
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Conversation,
  ChatMessage,
  CreateConversationInput,
  StreamingState,
  MemoryConfig,
} from '@/types';
import { DEFAULT_MEMORY_CONFIG } from '@/types';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  streaming: StreamingState;

  // Getters
  getConversation: (id: string) => Conversation | undefined;
  getActiveConversation: () => Conversation | undefined;
  getMessages: (conversationId: string) => ChatMessage[];

  // Actions
  createConversation: (input?: CreateConversationInput) => Conversation;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  updateConversationTitle: (id: string, title: string) => void;

  // Message actions
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>) => ChatMessage;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  clearMessages: (conversationId: string) => void;

  // Streaming actions
  startStreaming: (messageId: string) => void;
  updateStreamingContent: (content: string) => void;
  stopStreaming: () => void;

  // State actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Memory actions
  needsSummarization: (conversationId: string, config?: Partial<MemoryConfig>) => boolean;
  getMessagesToSummarize: (conversationId: string, config?: Partial<MemoryConfig>) => ChatMessage[];
  markMessagesSummarized: (conversationId: string, lastMessageId: string, memoryId: string) => void;
  removeSummarizedMessages: (conversationId: string, messageIds: string[]) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

const initialStreamingState: StreamingState = {
  isStreaming: false,
  currentMessageId: undefined,
  partialContent: '',
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      error: null,
      streaming: initialStreamingState,

      getConversation: (id) => {
        return get().conversations.find((c) => c.id === id);
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        if (!activeConversationId) return undefined;
        return conversations.find((c) => c.id === activeConversationId);
      },

      getMessages: (conversationId) => {
        const conversation = get().getConversation(conversationId);
        return conversation?.messages ?? [];
      },

      createConversation: (input) => {
        const now = new Date();
        const conversation: Conversation = {
          id: generateId(),
          userId: '', // Will be set by auth context
          personaId: input?.personaId,
          title: input?.title ?? 'New Conversation',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
        }));

        return conversation;
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          const newActiveId =
            state.activeConversationId === id
              ? newConversations[0]?.id ?? null
              : state.activeConversationId;

          return {
            conversations: newConversations,
            activeConversationId: newActiveId,
          };
        });
      },

      setActiveConversation: (activeConversationId) =>
        set({ activeConversationId }),

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date() } : c
          ),
        }));
      },

      addMessage: (conversationId, messageInput) => {
        const message: ChatMessage = {
          ...messageInput,
          id: generateId(),
          conversationId,
          createdAt: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date(),
                }
              : c
          ),
        }));

        return message;
      },

      updateMessage: (conversationId, messageId, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content, isStreaming: false } : m
                  ),
                  updatedAt: new Date(),
                }
              : c
          ),
        }));
      },

      deleteMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== messageId),
                  updatedAt: new Date(),
                }
              : c
          ),
        }));
      },

      clearMessages: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [], updatedAt: new Date() }
              : c
          ),
        }));
      },

      startStreaming: (currentMessageId) =>
        set({
          streaming: {
            isStreaming: true,
            currentMessageId,
            partialContent: '',
          },
        }),

      updateStreamingContent: (content) =>
        set((state) => ({
          streaming: {
            ...state.streaming,
            partialContent: state.streaming.partialContent + content,
          },
        })),

      stopStreaming: () => set({ streaming: initialStreamingState }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Memory actions
      needsSummarization: (conversationId, config) => {
        const mergedConfig = { ...DEFAULT_MEMORY_CONFIG, ...config };
        const conversation = get().getConversation(conversationId);
        if (!conversation) return false;

        const threshold =
          mergedConfig.contextWindowMessages + mergedConfig.triggerMessageCount;
        return conversation.messages.length > threshold;
      },

      getMessagesToSummarize: (conversationId, config) => {
        const mergedConfig = { ...DEFAULT_MEMORY_CONFIG, ...config };
        const conversation = get().getConversation(conversationId);
        if (!conversation) return [];

        const { messages, lastSummarizedMessageId } = conversation;

        // Find where to start
        let startIndex = 0;
        if (lastSummarizedMessageId) {
          const lastIndex = messages.findIndex(
            (m) => m.id === lastSummarizedMessageId
          );
          if (lastIndex !== -1) {
            startIndex = lastIndex + 1;
          }
        }

        // Calculate how many messages exceed the context window
        const excessMessages =
          messages.length - mergedConfig.contextWindowMessages;

        if (excessMessages <= 0) {
          return [];
        }

        // Get the batch of messages to summarize
        const endIndex = Math.min(
          startIndex + mergedConfig.triggerMessageCount,
          messages.length - mergedConfig.contextWindowMessages
        );

        if (endIndex <= startIndex) {
          return [];
        }

        return messages.slice(startIndex, endIndex);
      },

      markMessagesSummarized: (conversationId, lastMessageId, memoryId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastSummarizedMessageId: lastMessageId,
                  memoryIds: [...(c.memoryIds ?? []), memoryId],
                  updatedAt: new Date(),
                }
              : c
          ),
        }));
      },

      removeSummarizedMessages: (conversationId, messageIds) => {
        const messageIdSet = new Set(messageIds);
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => !messageIdSet.has(m.id)),
                  updatedAt: new Date(),
                }
              : c
          ),
        }));
      },
    }),
    {
      name: 'ai-voice-platform-chat',
      partialize: (state) => ({
        conversations: state.conversations.map((c) => ({
          ...c,
          // Limit stored messages to last 100 per conversation
          messages: c.messages.slice(-100),
        })),
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
