import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing MCP endpoint with tool call...')
    
    // Test the MCP endpoint with a tool call
    const mcpResponse = await fetch('http://localhost:3000/api/mcp', {
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
      mcpStatus: mcpResponse.status,
      mcpContentType: contentType,
      mcpResponse: mcpData,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('MCP tool call test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}