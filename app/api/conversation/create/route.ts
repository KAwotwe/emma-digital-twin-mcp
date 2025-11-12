import { NextRequest, NextResponse } from 'next/server'
import { createConversationSession } from '@/app/actions/digital-twin-actions'

/**
 * POST /api/conversation/create
 * Create a new conversation session
 */
export async function POST(request: NextRequest) {
  try {
    const result = await createConversationSession()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
        createdAt: result.createdAt
      }, { status: 201 })
    }
    
    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 500 })
    
  } catch (error) {
    console.error('Error in conversation create endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session'
    }, { status: 500 })
  }
}

// Enable CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
