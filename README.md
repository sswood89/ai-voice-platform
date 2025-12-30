# AI Voice Platform

A Next.js LLM playground with persona-based conversations, multi-provider support, and long-term memory.

## Features

- **Multi-Provider LLM Support** - Anthropic Claude, OpenAI GPT, and Ollama (local)
- **Persona System** - Create custom AI personas with unique personalities, voices, and behaviors
- **Long-Term Memory** - Automatic conversation summarization and context injection
- **Voice Integration** - Text-to-speech with ElevenLabs and voice cloning
- **Auto-Fallback** - Automatically uses Ollama if no cloud API keys configured

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript 5
- **State**: Zustand with localStorage persistence
- **UI**: Tailwind CSS 4, Shadcn components
- **LLM**: Anthropic SDK, OpenAI SDK, Ollama
- **Voice**: ElevenLabs API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Ollama (for local LLM) - [Install Ollama](https://ollama.ai)

### Installation

```bash
# Clone the repository
git clone https://github.com/sswood89/ai-voice-platform.git
cd ai-voice-platform

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start the development server
pnpm dev
```

### Environment Variables

```env
# LLM Providers (at least one required)
ANTHROPIC_API_KEY=     # For Claude models
OPENAI_API_KEY=        # For GPT models
OLLAMA_BASE_URL=http://localhost:11434  # For local Ollama

# Voice (optional)
ELEVENLABS_API_KEY=    # For TTS and voice cloning
```

## Usage

### 1. Create a Persona

Navigate to `/personas/new` and configure:
- **Basic Info**: Name, description, avatar
- **Personality**: Traits, tone, communication style
- **Knowledge**: Domain expertise, context
- **Behavior**: Response length, emoji usage, mode
- **Voice**: Select or clone a voice

### 2. Start Chatting

Go to `/chat`, select your persona, and start a conversation. The system will:
- Stream responses in real-time
- Optionally generate voice audio
- Automatically summarize old messages into memories

### 3. Long-Term Memory

After 35+ messages in a conversation:
- Older messages are summarized by the LLM
- Summaries stored per-persona in localStorage
- Relevant memories injected into future conversations
- Visual indicator shows active memories

## Project Structure

```
ai-voice-platform/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/         # LLM streaming endpoint
│   │   ├── memory/       # Summarization endpoint
│   │   ├── tts/          # Text-to-speech
│   │   └── voices/       # Voice management
│   ├── chat/             # Chat page
│   ├── personas/         # Persona management
│   ├── settings/         # Configuration
│   └── voices/           # Voice library
├── components/            # React components
│   ├── chat/             # Chat UI
│   ├── persona/          # Persona editors
│   ├── layout/           # Navigation
│   └── ui/               # Shadcn components
├── lib/                   # Business logic
│   ├── llm/              # LLM provider abstraction
│   ├── memory/           # Memory system
│   ├── persona/          # Prompt building
│   └── voice/            # TTS engine
├── stores/               # Zustand state
└── types/                # TypeScript definitions
```

## Memory System

The memory system provides context continuity across conversations:

| Config | Default | Description |
|--------|---------|-------------|
| `triggerMessageCount` | 15 | Messages before summarization triggers |
| `contextWindowMessages` | 20 | Messages kept in active context |
| `maxMemoriesPerPersona` | 50 | Max stored memories per persona |
| `maxInjectedMemories` | 3 | Memories injected per request |
| `memoryTokenBudget` | 1000 | Token budget for memory injection |

## Persona Templates

6 built-in templates to get started:
- **Helpful Assistant** - General-purpose AI helper
- **Creative Writer** - Content creation specialist
- **Code Mentor** - Programming tutor
- **Support Agent** - Customer service representative
- **Professional Coach** - Career and productivity advisor
- **Social Media Manager** - Content strategist

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Stream LLM responses |
| `/api/memory/summarize` | POST | Generate conversation summaries |
| `/api/tts` | POST | Generate speech audio |
| `/api/voices` | GET | List available voices |
| `/api/voices/clone` | POST | Clone a voice |

## Development

```bash
# Run development server
pnpm dev

# Type check
pnpm type-check

# Build for production
pnpm build

# Start production server
pnpm start
```

## License

MIT
