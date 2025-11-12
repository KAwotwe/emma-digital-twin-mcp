import { NextRequest, NextResponse } from 'next/server'
import { getConversationHistoryAction } from '@/app/actions/digital-twin-actions'

/**
 * GET /api/conversation/[sessionId]
 * Get conversation history for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }
    
    const result = await getConversationHistoryAction(sessionId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
        history: result.history,
        stats: result.stats
      }, { status: 200 })
    }
    
    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 404 })
    
  } catch (error) {
    console.error('Error in conversation history endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history'
    }, { status: 500 })
  }
}

// Enable CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
