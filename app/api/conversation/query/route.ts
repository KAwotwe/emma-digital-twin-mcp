import { NextRequest, NextResponse } from 'next/server'
import { memoryAwareDigitalTwinQuery } from '@/app/actions/digital-twin-actions'
import type { InterviewType } from '@/lib/rag-config'

/**
 * POST /api/conversation/query
 * Execute a memory-aware RAG query
 * 
 * Body: {
 *   question: string
 *   sessionId: string
 *   interviewType?: InterviewType | 'auto'
 *   enableCache?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, sessionId, interviewType, enableCache } = body
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Question is required and must be a string'
      }, { status: 400 })
    }
    
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required and must be a string'
      }, { status: 400 })
    }
    
    const result = await memoryAwareDigitalTwinQuery(question, sessionId, {
      interviewType: interviewType as InterviewType | 'auto',
      enableCache
    })
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        response: result.response,
        sessionId: result.sessionId,
        conversationHistory: result.conversationHistory,
        metrics: result.metrics,
        cacheHit: result.cacheHit,
        interviewType: result.interviewType
      }, { status: 200 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Query failed',
      response: result.response
    }, { status: 500 })
    
  } catch (error) {
    console.error('Error in conversation query endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Query failed'
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
