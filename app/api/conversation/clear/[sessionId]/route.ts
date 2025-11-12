import { NextRequest, NextResponse } from 'next/server'
import { clearConversationHistoryAction } from '@/app/actions/digital-twin-actions'

/**
 * DELETE /api/conversation/[sessionId]
 * Clear conversation history for a session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }
    
    const result = await clearConversationHistoryAction(sessionId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      }, { status: 200 })
    }
    
    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 404 })
    
  } catch (error) {
    console.error('Error in conversation clear endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear history'
    }, { status: 500 })
  }
}

// Enable CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
