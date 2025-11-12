import { NextRequest, NextResponse } from 'next/server'
import { getActiveConversationSessions } from '@/app/actions/digital-twin-actions'

/**
 * GET /api/conversation/sessions
 * Get all active conversation sessions
 */
export async function GET(request: NextRequest) {
  try {
    const result = await getActiveConversationSessions()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        sessions: result.sessions
      }, { status: 200 })
    }
    
    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 500 })
    
  } catch (error) {
    console.error('Error in sessions list endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sessions'
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
