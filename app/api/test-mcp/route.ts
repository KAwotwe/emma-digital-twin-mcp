import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('Testing MCP endpoint...')
    
    // Environment variable check
    const envVars = {
      UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
      UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN ? '[SET]' : '[MISSING]',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? '[SET]' : '[MISSING]'
    }
    
    console.log('Environment variables:', envVars)
    
    // Get the base URL from the request
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    console.log('Base URL:', baseUrl)
    
    // Test the MCP endpoint with proper headers
    const mcpResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    })
    
    console.log('MCP Response Status:', mcpResponse.status)
    console.log('MCP Response Headers:', Object.fromEntries(mcpResponse.headers.entries()))
    
    let mcpData: unknown
    const contentType = mcpResponse.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      mcpData = await mcpResponse.json()
    } else {
      // Handle text/event-stream or other formats
      const text = await mcpResponse.text()
      console.log('MCP Response Text:', text.substring(0, 200) + '...')
      mcpData = { responseText: text.substring(0, 500) }
    }
    
    console.log('MCP Response Data:', mcpData)
    
    return NextResponse.json({
      success: true,
      baseUrl,
      envVars,
      mcpStatus: mcpResponse.status,
      mcpContentType: contentType,
      mcpResponse: mcpData,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('MCP test error:', error)
    
    // Environment variable check for error context
    const envVars = {
      UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
      UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN ? '[SET]' : '[MISSING]',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? '[SET]' : '[MISSING]'
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      envVars,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}