import { NextResponse } from 'next/server'
import { ragQuery } from '@/lib/digital-twin'

export async function GET(request: Request) {
  try {
    console.log('Testing RAG query directly...')
    
    // Test RAG query directly first
    const directResult = await ragQuery({
      question: "Tell me about Emmanuel's education",
      topK: 3,
      includeMetadata: true
    })
    
    console.log('Direct RAG query successful')
    
    // Get the base URL from the request
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    
    // Test the MCP endpoint with a tool call
    const mcpResponse = await fetch(`${baseUrl}/api/sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'query_digital_twin',
          arguments: {
            question: 'Tell me about your education'
          }
        }
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
      console.log('MCP Response Text:', text.substring(0, 500) + '...')
      mcpData = { responseText: text.substring(0, 1000) }
    }
    
    console.log('MCP Tool Call Result:', mcpData)
    
    return NextResponse.json({
      success: true,
      directRAGResult: directResult,
      mcpStatus: mcpResponse.status,
      mcpContentType: contentType,
      mcpResponse: mcpData,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('RAG/MCP tool call test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}