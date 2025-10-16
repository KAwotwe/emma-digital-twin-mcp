import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check with environment variable status
    const envStatus = {
      GROQ_API_KEY: process.env.GROQ_API_KEY ? 'SET' : 'MISSING',
      UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL ? 'SET' : 'MISSING',
      UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN ? 'SET' : 'MISSING',
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'unknown'
    }
    
    console.log('Health check - Environment status:', envStatus)
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      message: 'MCP Digital Twin Server is running'
    })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}