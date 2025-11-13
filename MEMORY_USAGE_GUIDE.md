# 💬 Conversation Memory Usage Guide

## Problem: Digital Twin "Lost Memory"

The Digital Twin has **TWO different query tools**:

1. **`query_digital_twin`** - ❌ **NO MEMORY** (stateless, each question is independent)
2. **`query_with_memory`** - ✅ **WITH MEMORY** (maintains conversation context)

## Why Memory Was "Lost"

If you were using the basic `query_digital_twin` tool, it **never had memory to begin with**. Each question is answered independently without any context from previous questions.

## ✅ Solution: Use Memory-Aware Queries

### Step 1: Create a Conversation Session

Before asking questions with memory, create a session:

```typescript
// MCP Tool: create_conversation
// No parameters needed - returns a sessionId
```

**Response:**
```
Session ID: `session_1731511234567_abc123`
Created At: 2025-11-13T...
```

### Step 2: Ask Questions with Memory

Use the `query_with_memory` tool with your session ID:

```typescript
// MCP Tool: query_with_memory
{
  "question": "What did you do at AUSBIZ Consulting?",
  "sessionId": "session_1731511234567_abc123"
}
```

### Step 3: Follow-up Questions (Context-Aware)

Now ask follow-up questions using the SAME session ID:

```typescript
// Follow-up question - remembers the previous context
{
  "question": "What technologies did you use there?",
  "sessionId": "session_1731511234567_abc123"  // ← Same session!
}
```

The Digital Twin will understand "there" refers to AUSBIZ Consulting because it remembers the previous conversation.

## 📊 Available Memory Tools

### Tool 1: `create_conversation`
- **Purpose**: Create a new conversation session
- **Parameters**: None
- **Returns**: Session ID to use for memory-aware queries

### Tool 2: `query_with_memory` ⭐ **PRIMARY TOOL FOR CONVERSATIONS**
- **Purpose**: Ask questions with conversation context
- **Parameters**:
  - `question` (string) - Your question
  - `sessionId` (string) - Session ID from `create_conversation`
  - `interviewType` (optional) - Context type (auto-detect if not specified)

### Tool 3: `get_conversation_history`
- **Purpose**: View all previous questions and answers in a session
- **Parameters**:
  - `sessionId` (string) - Session ID to retrieve

### Tool 4: `clear_conversation_history`
- **Purpose**: Clear/reset a conversation session
- **Parameters**:
  - `sessionId` (string) - Session ID to clear

### Tool 5: `get_all_sessions`
- **Purpose**: List all active conversation sessions
- **Parameters**: None

## 🔄 Complete Workflow Example

### Scenario: Multi-turn Interview Practice

```bash
# Step 1: Create session
Tool: create_conversation
Response: sessionId = "session_xyz"

# Step 2: First question
Tool: query_with_memory
{
  "question": "Tell me about your RAG project experience",
  "sessionId": "session_xyz"
}
Response: "I built a production Food RAG system at AUSBIZ Consulting..."

# Step 3: Follow-up (context-aware)
Tool: query_with_memory
{
  "question": "What specific technologies did you use?",
  "sessionId": "session_xyz"
}
Response: "For the Food RAG project, I used Ollama for embeddings, Upstash Vector..."

# Step 4: Another follow-up
Tool: query_with_memory
{
  "question": "How long did it take to build?",
  "sessionId": "session_xyz"
}
Response: "The Food RAG project took approximately 4 weeks from prototyping to production..."

# Step 5: View history
Tool: get_conversation_history
{ "sessionId": "session_xyz" }
Response: Shows all 3 question-answer pairs with timestamps

# Step 6: Clear when done
Tool: clear_conversation_history
{ "sessionId": "session_xyz" }
```

## ⚙️ Technical Implementation

### Memory Storage
- **Type**: In-memory Map (server-side)
- **Duration**: 30 minutes timeout from last activity
- **Capacity**: Last 10 conversation turns per session

### Context Building
The memory system:
1. Stores each user question and assistant response
2. Automatically includes recent conversation history in RAG queries
3. Enhances search by understanding pronouns ("it", "that", "there")
4. Maintains interview context across multiple questions

### Performance
- **With Memory**: ~200-400ms (includes context lookup)
- **Without Memory**: ~150-300ms
- **Memory Overhead**: Minimal (~10-20ms)

## 🚨 Common Issues & Fixes

### Issue 1: "Session not found"
**Cause**: Session expired (30 min timeout) or invalid session ID
**Fix**: Create a new session with `create_conversation`

### Issue 2: "No context in follow-up questions"
**Cause**: Using `query_digital_twin` instead of `query_with_memory`
**Fix**: Switch to `query_with_memory` with a session ID

### Issue 3: "Context seems wrong"
**Cause**: Using the wrong session ID or sessions got mixed up
**Fix**: Check session ID matches, or create a new session

### Issue 4: "Too much context / responses too long"
**Cause**: Long conversation history overwhelming the RAG system
**Fix**: Clear the session and start fresh:
```
Tool: clear_conversation_history
{ "sessionId": "your_session_id" }
```

## 📝 Best Practices

### ✅ DO:
- Create a new session for each distinct conversation topic
- Use `query_with_memory` for multi-turn conversations
- Clear sessions when switching topics
- Check conversation history if confused about context

### ❌ DON'T:
- Mix `query_digital_twin` and `query_with_memory` for the same conversation
- Reuse session IDs across completely different topics
- Keep sessions alive indefinitely (they auto-expire after 30 min)
- Use basic `query_digital_twin` when you need conversation context

## 🎯 When to Use Which Tool?

### Use `query_digital_twin` (NO MEMORY) when:
- Single, standalone questions
- Testing or quick lookups
- No need for follow-up context
- Examples:
  - "What are your technical skills?"
  - "Where did you study?"
  - "What's your email?"

### Use `query_with_memory` (WITH MEMORY) when:
- Multi-turn conversations
- Interview practice (behavioral questions with follow-ups)
- Complex topics requiring context
- Examples:
  - "Tell me about your AUSBIZ experience" → "What technologies?" → "How long?"
  - "Describe a challenging project" → "How did you overcome it?" → "What was the outcome?"

## 🔧 Testing Memory

Quick test to verify memory is working:

```bash
# 1. Create session
create_conversation → Get sessionId

# 2. First question (establishes context)
query_with_memory: "I'm interviewing for a data analyst role"
sessionId: <your_session_id>

# 3. Follow-up (should remember the role)
query_with_memory: "What makes me a good fit?"
sessionId: <same_session_id>

# 4. Check history
get_conversation_history
sessionId: <same_session_id>

# Expected: Should show both questions and responses
```

## 📚 Additional Resources

- **Full Implementation**: `lib/conversation-memory.ts`
- **Memory-Aware Actions**: `app/actions/digital-twin-actions.ts` (line 1221)
- **API Endpoints**: `app/api/conversation/` directory
- **MCP Tool Definitions**: `app/api/[transport]/route.ts` (tools 17-21)

---

**Status**: ✅ Conversation memory is working correctly
**Issue**: Using the wrong tool (`query_digital_twin` vs `query_with_memory`)
**Solution**: Follow this guide to use memory-aware queries properly
