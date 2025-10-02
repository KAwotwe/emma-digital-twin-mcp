import { createMcpHandler } from 'mcp-handler'
import { ragQuery } from '@/lib/digital-twin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

console.log('MCP Server: Loading route handler...')

// MCP server handler
const handler = createMcpHandler(
  (server) => {
    console.log('MCP Server: Registering tools...')
    
    // Register the digital twin query tool with minimal configuration
    server.tool(
      'query_digital_twin',
      'Ask questions about Emmanuel Awotwe\'s professional background, experience, skills, and career journey.',
      {
        question: z.string()
      },
      async ({ question }) => {
        try {
          console.log('MCP Tool Called: query_digital_twin')
          console.log('Parameters:', { question })
          
          // Provide defaults for parameters
          const queryParams = {
            question,
            topK: 3,
            includeMetadata: true,
            filterByType: undefined
          }
          
          // Execute RAG query
          const result = await ragQuery(queryParams)
          
          console.log('MCP Tool: RAG query successful')
          
          // Format response for MCP
          const responseText = `**Question:** ${result.question}\n\n**Answer:** ${result.answer}${
            queryParams.includeMetadata && result.sources.length > 0
              ? `\n\n**Sources:**\n${result.sources
                  .map(s => `- ${s.title} (${s.category}) - Relevance: ${s.relevance}`)
                  .join('\n')}`
              : ''
          }`
          
          console.log('MCP Tool: Returning formatted response')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error:', error)
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${errorMessage}`
              }
            ]
          }
        }
      }
    )
    
    console.log('MCP Server: Tool registration complete')
  },
  {
    serverInfo: {
      name: 'digital-twin-mcp-server',
      version: '1.0.0'
    }
  },
  {
    basePath: '/api',
    verboseLogs: true
  }
)

console.log('MCP Server: Handler created successfully')

// Export handler for all HTTP methods
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as HEAD, handler as OPTIONS }