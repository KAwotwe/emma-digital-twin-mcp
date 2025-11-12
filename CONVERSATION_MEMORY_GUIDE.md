# Conversation Memory Implementation Guide

## Overview

The Digital Twin now supports **conversation memory** across multi-turn interactions. This feature maintains context throughout a conversation session, allowing for natural follow-up questions and contextual responses.

## Architecture

### Components

1. **`lib/conversation-memory.ts`**: Core memory management library
   - Session creation and management
   - Conversation history tracking
   - Context building for RAG queries
   - Automatic cleanup of expired sessions

2. **Server Actions** (`app/actions/digital-twin-actions.ts`):
   - `memoryAwareDigitalTwinQuery()`: RAG query with conversation context
   - `createConversationSession()`: Create new conversation session
   - `getConversationHistoryAction()`: Retrieve conversation history
   - `clearConversationHistoryAction()`: Clear session history
   - `getActiveConversationSessions()`: List all active sessions

3. **API Routes** (`app/api/conversation/`):
   - `POST /api/conversation/create`: Create session
   - `POST /api/conversation/query`: Query with memory
   - `GET /api/conversation/[sessionId]`: Get history
   - `DELETE /api/conversation/clear/[sessionId]`: Clear history
   - `GET /api/conversation/sessions`: List active sessions

4. **MCP Tools** (`app/api/[transport]/route.ts`):
   - `create_conversation`: Create new session
   - `query_with_memory`: Ask question with context
   - `get_conversation_history`: View conversation
   - `clear_conversation`: Reset session

## Configuration

### Memory Settings

```typescript
const MAX_HISTORY_LENGTH = 10        // Keep last 10 turns (20 messages)
const SESSION_TIMEOUT_MS = 1800000   // 30 minutes
const MAX_CONTEXT_TOKENS = 2000      // Context size limit
```

### Session Management

- **In-Memory Storage**: Sessions stored in-memory (suitable for single-instance deployment)
- **Auto-Cleanup**: Expired sessions automatically removed
- **Session Timeout**: 30 minutes of inactivity

## Usage

### 1. API Usage

#### Create Session
```bash
POST /api/conversation/create

Response:
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "createdAt": 1234567890000
}
```

#### Query with Memory
```bash
POST /api/conversation/query

Body:
{
  "question": "What programming languages do you know?",
  "sessionId": "session_1234567890_abc123",
  "interviewType": "auto",
  "enableCache": true
}

Response:
{
  "success": true,
  "response": "I have extensive experience with...",
  "sessionId": "session_1234567890_abc123",
  "conversationHistory": [
    { "role": "user", "content": "...", "timestamp": 123 },
    { "role": "assistant", "content": "...", "timestamp": 124 }
  ],
  "metrics": { ... },
  "cacheHit": false,
  "interviewType": "technical_interview"
}
```

#### Get History
```bash
GET /api/conversation/[sessionId]

Response:
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "history": [ ... ],
  "stats": {
    "turnCount": 4,
    "sessionAge": 120000,
    "lastActive": 5000
  }
}
```

#### Clear History
```bash
DELETE /api/conversation/clear/[sessionId]

Response:
{
  "success": true,
  "message": "Conversation history cleared"
}
```

### 2. MCP Tools Usage

#### Create Conversation
```typescript
// In VS Code with MCP extension
create_conversation()

// Returns:
// Session ID: session_1234567890_abc123
// Created At: 2024-01-01T12:00:00.000Z
```

#### Query with Memory
```typescript
query_with_memory({
  question: "What programming languages do you know?",
  sessionId: "session_1234567890_abc123",
  interviewType: "auto"
})

// Returns formatted response with conversation context
```

#### Get History
```typescript
get_conversation_history({
  sessionId: "session_1234567890_abc123"
})

// Returns:
// - Session stats
// - Full conversation history
```

#### Clear Conversation
```typescript
clear_conversation({
  sessionId: "session_1234567890_abc123"
})

// Clears all history for the session
```

### 3. Server Actions Usage

```typescript
import {
  memoryAwareDigitalTwinQuery,
  createConversationSession,
  getConversationHistoryAction,
  clearConversationHistoryAction
} from '@/app/actions/digital-twin-actions'

// Create session
const session = await createConversationSession()
const sessionId = session.sessionId

// Query with memory
const result = await memoryAwareDigitalTwinQuery(
  "What programming languages do you know?",
  sessionId,
  { interviewType: 'auto' }
)

// Follow-up question (maintains context)
const followUp = await memoryAwareDigitalTwinQuery(
  "Which one is your favorite?",
  sessionId
)

// Get history
const history = await getConversationHistoryAction(sessionId)

// Clear history
await clearConversationHistoryAction(sessionId)
```

## How It Works

### Context Building

1. **User asks question** → Stored as 'user' turn in session
2. **Context retrieved** → Previous conversation formatted:
   ```
   Previous conversation:
   User: What programming languages do you know?
   Assistant: I have experience with Python, JavaScript, TypeScript...
   User: Which one is your favorite?
   ```
3. **Enhanced query** → Context + current question sent to RAG
4. **Assistant responds** → Response stored as 'assistant' turn
5. **History maintained** → Last 10 turns kept (older trimmed)

### Memory Limitations

- **Token Limit**: Context trimmed if > 2000 tokens (~8000 chars)
- **Turn Limit**: Last 10 question-answer pairs kept
- **Session Timeout**: 30 minutes of inactivity
- **Storage**: In-memory (lost on server restart)

## Testing

Run the test script:

```powershell
.\test-conversation-memory.ps1
```

This tests:
1. ✅ Session creation
2. ✅ First question (no context)
3. ✅ Follow-up question (with context)
4. ✅ Get conversation history
5. ✅ Third question (extended context)
6. ✅ Clear conversation
7. ✅ Verify cleared history

## Integration with V0.dev

### Frontend Implementation

You'll need to update your V0.dev app to:

1. **Create session on mount**:
```typescript
const [sessionId, setSessionId] = useState<string | null>(null)

useEffect(() => {
  async function initSession() {
    const response = await fetch('/api/conversation/create', {
      method: 'POST'
    })
    const data = await response.json()
    setSessionId(data.sessionId)
  }
  initSession()
}, [])
```

2. **Use memory-aware queries**:
```typescript
async function askQuestion(question: string) {
  const response = await fetch('/api/conversation/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      sessionId,
      enableCache: true
    })
  })
  const data = await response.json()
  return data
}
```

3. **Display conversation history**:
```typescript
const [messages, setMessages] = useState<Message[]>([])

// After each query, add to messages
setMessages(prev => [...prev, 
  { role: 'user', content: question },
  { role: 'assistant', content: data.response }
])
```

4. **Clear conversation**:
```typescript
async function clearConversation() {
  await fetch(`/api/conversation/clear/${sessionId}`, {
    method: 'DELETE'
  })
  setMessages([])
}
```

## V0.dev Prompt

Use this prompt with V0.dev to integrate conversation memory:

```
Add conversation memory to the digital twin RAG chat interface:

1. On component mount, call POST /api/conversation/create to get a sessionId
2. Store sessionId in state
3. For each question, call POST /api/conversation/query with:
   - question (user input)
   - sessionId (from state)
   - enableCache: true
4. Display conversation history in a chat interface:
   - User messages on the right (blue bubble)
   - Assistant messages on the left (gray bubble)
   - Auto-scroll to bottom on new messages
5. Add "Clear Conversation" button that:
   - Calls DELETE /api/conversation/clear/[sessionId]
   - Clears the messages array
   - Creates a new session
6. Show session info (turn count, session age) in a subtle footer
7. Handle loading states during queries
8. Add error handling for failed API calls

Design: Modern chat UI with smooth animations, clear message separation, and responsive layout.
```

## Production Considerations

### For Production Deployment:

1. **Replace In-Memory Storage**:
   - Use Redis for distributed sessions
   - Or PostgreSQL for persistent storage
   - Or Upstash Redis for serverless

2. **Add Session Persistence**:
   ```typescript
   // Example with Redis
   import { Redis } from '@upstash/redis'
   
   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_URL!,
     token: process.env.UPSTASH_REDIS_TOKEN!
   })
   
   export async function getSession(sessionId: string) {
     const session = await redis.get(`session:${sessionId}`)
     return session as ConversationSession
   }
   ```

3. **Add User Authentication**:
   - Associate sessions with user IDs
   - Implement session ownership checks
   - Add rate limiting per user

4. **Monitoring**:
   - Track active sessions
   - Monitor memory usage
   - Log conversation metrics

## MCP Server Update

The MCP server now has **20 tools** (up from 16):

1-14. Original tools (RAG queries, interview types, performance, etc.)
15-16. Voice tools (text-to-speech, get voices)
17-20. **NEW Memory tools**:
   - `create_conversation`: Create session
   - `query_with_memory`: Query with context
   - `get_conversation_history`: View history
   - `clear_conversation`: Clear session

## Performance

- **Cache Integration**: Memory-aware queries use Step 9 performance cache
- **Context Overhead**: ~200-500ms for context building
- **Memory Efficiency**: Automatic cleanup prevents memory leaks
- **Token Optimization**: Context trimmed to fit within limits

## Next Steps

1. ✅ Test locally with `test-conversation-memory.ps1`
2. ⏳ Update V0.dev frontend with conversation UI
3. ⏳ Deploy to Vercel (existing deployment will work)
4. ⏳ Consider Redis for production persistence
5. ⏳ Add user authentication for multi-user support

## Support

If you need help integrating conversation memory:
1. Test the API endpoints first
2. Use the PowerShell test script to verify functionality
3. Check the MCP tools in VS Code
4. Review the conversation history to debug context issues
