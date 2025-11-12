/**
 * Conversation Memory System
 * Manages conversation history for multi-turn interactions with the Digital Twin
 */

export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ConversationSession {
  sessionId: string
  history: ConversationTurn[]
  createdAt: number
  lastAccessedAt: number
}

// In-memory storage (for production, consider Redis or database)
const conversations = new Map<string, ConversationSession>()

// Configuration
const MAX_HISTORY_LENGTH = 10 // Keep last 10 turns
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const MAX_CONTEXT_TOKENS = 2000 // Approximate token limit for context

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a new conversation session
 */
export function createSession(sessionId?: string): ConversationSession {
  const id = sessionId || generateSessionId()
  const session: ConversationSession = {
    sessionId: id,
    history: [],
    createdAt: Date.now(),
    lastAccessedAt: Date.now()
  }
  conversations.set(id, session)
  return session
}

/**
 * Get an existing session or create a new one
 */
export function getSession(sessionId: string): ConversationSession | null {
  cleanupExpiredSessions()
  const session = conversations.get(sessionId)
  
  if (!session) {
    return null
  }
  
  // Check if session has expired
  const isExpired = Date.now() - session.lastAccessedAt > SESSION_TIMEOUT_MS
  if (isExpired) {
    conversations.delete(sessionId)
    return null
  }
  
  // Update last accessed time
  session.lastAccessedAt = Date.now()
  return session
}

/**
 * Add a conversation turn to the session
 */
export function addTurn(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): ConversationSession {
  let session = getSession(sessionId)
  
  if (!session) {
    session = createSession(sessionId)
  }
  
  const turn: ConversationTurn = {
    role,
    content,
    timestamp: Date.now()
  }
  
  session.history.push(turn)
  
  // Trim history if it exceeds max length
  if (session.history.length > MAX_HISTORY_LENGTH * 2) {
    // Keep last MAX_HISTORY_LENGTH pairs (user + assistant)
    session.history = session.history.slice(-MAX_HISTORY_LENGTH * 2)
  }
  
  session.lastAccessedAt = Date.now()
  conversations.set(sessionId, session)
  
  return session
}

/**
 * Get conversation history as a formatted string for RAG context
 */
export function getConversationContext(sessionId: string): string {
  const session = getSession(sessionId)
  
  if (!session || session.history.length === 0) {
    return ''
  }
  
  // Build context from recent conversation history
  const contextParts: string[] = ['Previous conversation:']
  
  for (const turn of session.history) {
    const prefix = turn.role === 'user' ? 'User' : 'Assistant'
    contextParts.push(`${prefix}: ${turn.content}`)
  }
  
  const fullContext = contextParts.join('\n')
  
  // Rough token estimation (1 token ≈ 4 characters)
  const estimatedTokens = fullContext.length / 4
  
  if (estimatedTokens <= MAX_CONTEXT_TOKENS) {
    return fullContext
  }
  
  // Trim older messages if context is too long
  const recentHistory = session.history.slice(-6) // Last 3 pairs
  const trimmedParts: string[] = ['Recent conversation:']
  
  for (const turn of recentHistory) {
    const prefix = turn.role === 'user' ? 'User' : 'Assistant'
    trimmedParts.push(`${prefix}: ${turn.content}`)
  }
  
  return trimmedParts.join('\n')
}

/**
 * Get conversation history as structured array
 */
export function getConversationHistory(sessionId: string): ConversationTurn[] {
  const session = getSession(sessionId)
  return session?.history || []
}

/**
 * Clear conversation history for a session
 */
export function clearSession(sessionId: string): boolean {
  return conversations.delete(sessionId)
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  const expiredSessions: string[] = []
  
  for (const [sessionId, session] of conversations.entries()) {
    if (now - session.lastAccessedAt > SESSION_TIMEOUT_MS) {
      expiredSessions.push(sessionId)
    }
  }
  
  for (const sessionId of expiredSessions) {
    conversations.delete(sessionId)
  }
}

/**
 * Get all active sessions (for debugging/admin)
 */
export function getActiveSessions(): ConversationSession[] {
  cleanupExpiredSessions()
  return Array.from(conversations.values())
}

/**
 * Get session stats
 */
export function getSessionStats(sessionId: string): {
  turnCount: number
  sessionAge: number
  lastActive: number
} | null {
  const session = getSession(sessionId)
  
  if (!session) {
    return null
  }
  
  return {
    turnCount: session.history.length,
    sessionAge: Date.now() - session.createdAt,
    lastActive: Date.now() - session.lastAccessedAt
  }
}
