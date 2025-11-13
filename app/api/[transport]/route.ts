import { createMcpHandler } from 'mcp-handler'
import { ragQuery, enhancedRAGQuery } from '@/lib/digital-twin'
import { 
  enhancedDigitalTwinQuery, 
  compareRAGApproaches, 
  batchCompareRAGApproaches,
  contextAwareRAG,
  getInterviewTypes,
  testContextAwareRAG,
  batchTestContextAware,
  memoryAwareDigitalTwinQuery,
  createConversationSession,
  getConversationHistoryAction,
  clearConversationHistoryAction,
  getActiveConversationSessions
} from '@/app/actions/digital-twin-actions'
import { type InterviewType } from '@/lib/rag-config'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

console.log('MCP Server: Loading route handler...')

// MCP server handler
const handler = createMcpHandler(
  (server) => {
    console.log('MCP Server: Registering tools...')
    
    // Register the digital twin query tool with automatic conversation memory
    // This tool now maintains conversation context automatically like the V0 app
    let defaultSessionId: string | null = null
    
    server.tool(
      'query_digital_twin',
      'Ask questions about Emmanuel Awotwe\'s professional background, experience, skills, and career journey. Automatically maintains conversation context across multiple questions.',
      {
        question: z.string(),
        useMemory: z.boolean().optional().describe('Enable conversation memory (default: true)')
      },
      async ({ question, useMemory = true }) => {
        try {
          console.log('MCP Tool Called: query_digital_twin')
          console.log('Parameters:', { question, useMemory })
          
          // If memory is disabled, use the basic RAG query
          if (!useMemory) {
            const queryParams = {
              question,
              topK: 3,
              includeMetadata: true,
              filterByType: undefined
            }
            
            const result = await ragQuery(queryParams)
            
            const responseText = `**Question:** ${result.question}\n\n**Answer:** ${result.answer}${
              queryParams.includeMetadata && result.sources.length > 0
                ? `\n\n**Sources:**\n${result.sources
                    .map(s => `- ${s.title} (${s.category}) - Relevance: ${s.relevance}`)
                    .join('\n')}`
                : ''
            }`
            
            return {
              content: [{ type: 'text', text: responseText }]
            }
          }
          
          // Create a default session if none exists
          if (!defaultSessionId) {
            const sessionResult = await createConversationSession()
            if (sessionResult.success) {
              defaultSessionId = sessionResult.sessionId
              console.log('✅ Created default conversation session:', defaultSessionId)
            }
          }
          
          // Use memory-aware query (same as V0 app)
          const result = await memoryAwareDigitalTwinQuery(question, defaultSessionId!, {
            interviewType: 'auto'
          })
          
          console.log('MCP Tool: Memory-aware query successful')
          
          // Format response with conversation context
          const responseText = `**Answer:** ${result.response}\n\n---\n💬 **Conversation Mode Active**\n📊 Total Turns: ${result.conversationHistory.length}\n🔍 Interview Type: ${result.interviewType || 'auto'}\n\n💡 *Follow-up questions will maintain context automatically*`
          
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
    
    // ============================================
    // ENHANCED MCP TOOL - STEP 2
    // Query with LLM preprocessing and interview-ready formatting
    // ============================================
    
    server.tool(
      'query_digital_twin_enhanced',
      'Ask questions about Emmanuel Awotwe\'s professional background with LLM-enhanced search and interview-ready responses. This tool uses query preprocessing to improve search accuracy and post-processes responses with STAR format and metric highlighting.',
      {
        question: z.string().describe('The question to ask about Emmanuel\'s professional background'),
        enableQueryEnhancement: z.boolean().optional().describe('Enable LLM query preprocessing for better search (default: true)'),
        enableInterviewMode: z.boolean().optional().describe('Format response for interview context with STAR format (default: true)'),
        includeDebugInfo: z.boolean().optional().describe('Include timing and processing step information (default: false)'),
        topK: z.number().optional().describe('Number of relevant sources to retrieve (default: 3)')
      },
      async ({ question, enableQueryEnhancement, enableInterviewMode, includeDebugInfo, topK }) => {
        try {
          console.log('MCP Tool Called: query_digital_twin_enhanced')
          console.log('Parameters:', { 
            question, 
            enableQueryEnhancement: enableQueryEnhancement ?? true,
            enableInterviewMode: enableInterviewMode ?? true,
            includeDebugInfo: includeDebugInfo ?? false
          })
          
          // Execute enhanced RAG query with preprocessing and postprocessing
          const result = await enhancedRAGQuery({
            question,
            topK: topK ?? 3,
            includeMetadata: true,
            filterByType: undefined,
            enableQueryEnhancement: enableQueryEnhancement ?? true,
            enableInterviewMode: enableInterviewMode ?? true,
            includeDebugInfo: includeDebugInfo ?? false
          })
          
          console.log('MCP Tool: Enhanced RAG query successful')
          
          // Build comprehensive response
          let responseText = `**Question:** ${result.question}\n\n**Answer:**\n${result.answer}`
          
          // Add enhanced query info if available
          if (result.enhancedQuery) {
            responseText += `\n\n**Enhanced Query:** ${result.enhancedQuery}`
          }
          
          // Add processing steps info
          if (result.processingSteps) {
            responseText += `\n\n**Processing:**\n- Query Enhancement: ${result.processingSteps.queryEnhancement ? '✅' : '❌'}\n- Interview Formatting: ${result.processingSteps.interviewFormatting ? '✅' : '❌'}`
          }
          
          // Add sources
          if (result.sources.length > 0) {
            responseText += `\n\n**Sources:**\n${result.sources
              .map(s => `- ${s.title} (${s.category}) - Relevance: ${s.relevance}`)
              .join('\n')}`
          }
          
          // Add debug info if requested
          if (result.debugInfo && includeDebugInfo) {
            responseText += `\n\n**Performance Metrics:**\n- Query Enhancement: ${result.debugInfo.enhancementTime}ms\n- Vector Search: ${result.debugInfo.searchTime}ms\n- Response Generation: ${result.debugInfo.generationTime}ms\n- Interview Formatting: ${result.debugInfo.formattingTime}ms\n- Total Time: ${result.debugInfo.totalTime}ms`
          }
          
          console.log('MCP Tool: Returning enhanced formatted response')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Enhanced):', error)
          
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
    
    // ============================================
    // STEP 6: MODULAR MCP TOOL
    // Using standalone server action with full pipeline control
    // ============================================
    
    server.tool(
      'query_digital_twin_modular',
      'Ask questions about Emmanuel Awotwe with full control over the LLM enhancement pipeline. This modular approach allows you to enable/disable query enhancement and interview formatting independently, and customize the response tone.',
      {
        question: z.string().describe('The question to ask about Emmanuel\'s professional background'),
        enableQueryEnhancement: z.boolean().optional().describe('Enable LLM query preprocessing for better search (default: true)'),
        enableInterviewFormatting: z.boolean().optional().describe('Format response for interview context with STAR format (default: true)'),
        tone: z.enum(['confident', 'humble', 'balanced']).optional().describe('Response tone for interview formatting (default: balanced)'),
        topK: z.number().optional().describe('Number of relevant sources to retrieve (default: 5)')
      },
      async ({ question, enableQueryEnhancement, enableInterviewFormatting, tone, topK }) => {
        try {
          console.log('MCP Tool Called: query_digital_twin_modular')
          console.log('Parameters:', { 
            question, 
            enableQueryEnhancement: enableQueryEnhancement ?? true,
            enableInterviewFormatting: enableInterviewFormatting ?? true,
            tone: tone ?? 'balanced',
            topK: topK ?? 5
          })
          
          // Execute modular enhanced query
          const result = await enhancedDigitalTwinQuery(question, {
            topK: topK ?? 5,
            enableQueryEnhancement: enableQueryEnhancement ?? true,
            enableInterviewFormatting: enableInterviewFormatting ?? true,
            tone: tone ?? 'balanced'
          })
          
          if (!result.success) {
            const errorMsg = 'error' in result ? result.error : 'Query failed'
            throw new Error(errorMsg)
          }
          
          console.log('MCP Tool: Modular query successful')
          
          // Build response
          let responseText = `**Question:** ${question}\n\n**Answer:**\n${result.response}`
          
          // Add metadata
          if (result.metadata) {
            responseText += `\n\n**Pipeline Configuration:**\n`
            responseText += `- Query Enhancement: ${result.metadata.queryEnhanced ? '✅ Enabled' : '❌ Disabled'}\n`
            responseText += `- Interview Formatting: ${result.metadata.responseFormatted ? '✅ Enabled' : '❌ Disabled'}\n`
            responseText += `- Results Found: ${result.metadata.resultsFound}\n`
            
            if ('processingTimeMs' in result.metadata) {
              responseText += `- Processing Time: ${result.metadata.processingTimeMs}ms`
            }
            
            if ('enhancedQuery' in result.metadata && result.metadata.enhancedQuery !== question) {
              responseText += `\n\n**Enhanced Query:**\n${result.metadata.enhancedQuery}`
            }
          }
          
          console.log('MCP Tool: Returning modular response')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Modular):', error)
          
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
    
    // Register A/B Testing comparison tool
    server.tool(
      'compare_rag_approaches',
      'Compare basic RAG vs LLM-enhanced RAG side-by-side to measure improvements. Evaluates response quality, specificity, interview relevance, and processing time. Perfect for analyzing the effectiveness of LLM enhancements.',
      {
        question: z.string().describe('The question to test with both RAG approaches'),
        tone: z.enum(['confident', 'humble', 'balanced']).optional().describe('Tone for enhanced response (default: balanced)')
      },
      async ({ question, tone }) => {
        try {
          console.log('MCP Tool Called: compare_rag_approaches')
          console.log('Parameters:', { question, tone })
          
          const result = await compareRAGApproaches(question, tone)
          
          // Format comparison response
          let responseText = `# A/B Testing Results\n\n`
          responseText += `**Question:** ${result.question}\n\n`
          responseText += `---\n\n`
          
          // Basic RAG Results
          responseText += `## 📊 Basic RAG (No LLM Enhancement)\n\n`
          responseText += `**Processing Time:** ${result.results.basic.processingTime}ms\n\n`
          responseText += `**Response:**\n${result.results.basic.response}\n\n`
          responseText += `**Metadata:**\n`
          responseText += `- Results Found: ${result.results.basic.metadata?.resultsFound || 'N/A'}\n`
          responseText += `- Query Enhanced: ${result.results.basic.metadata?.queryEnhanced ? 'Yes' : 'No'}\n`
          responseText += `- Response Formatted: ${result.results.basic.metadata?.responseFormatted ? 'Yes' : 'No'}\n\n`
          responseText += `---\n\n`
          
          // Enhanced RAG Results
          responseText += `## 🚀 LLM-Enhanced RAG\n\n`
          responseText += `**Processing Time:** ${result.results.enhanced.processingTime}ms\n\n`
          if (result.results.enhanced.enhancedQuery && result.results.enhanced.enhancedQuery !== question) {
            responseText += `**Enhanced Query:**\n\`${result.results.enhanced.enhancedQuery}\`\n\n`
          }
          responseText += `**Response:**\n${result.results.enhanced.response}\n\n`
          responseText += `**Metadata:**\n`
          responseText += `- Results Found: ${result.results.enhanced.metadata?.resultsFound || 'N/A'}\n`
          responseText += `- Query Enhanced: ${result.results.enhanced.metadata?.queryEnhanced ? 'Yes ✅' : 'No'}\n`
          responseText += `- Response Formatted: ${result.results.enhanced.metadata?.responseFormatted ? 'Yes ✅' : 'No'}\n\n`
          responseText += `---\n\n`
          
          // Comparison Metrics
          if (result.comparison) {
            responseText += `## 📈 Comparison Metrics\n\n`
            responseText += `| Metric | Value |\n`
            responseText += `|--------|-------|\n`
            responseText += `| **Total Comparison Time** | ${result.comparison.totalComparisonTime}ms |\n`
            responseText += `| **Time Overhead** | +${result.comparison.timeOverhead}ms (+${result.comparison.timeOverheadPercent}%) |\n`
            responseText += `| **Length Improvement** | +${result.comparison.lengthImprovement} chars (+${result.comparison.lengthImprovementPercent}%) |\n`
            responseText += `| **Query Enhanced** | ${result.comparison.queryEnhanced ? 'Yes ✅' : 'No'} |\n`
            responseText += `| **Query Preprocessing** | ${result.comparison.enhancementApplied?.queryPreprocessing ? 'Enabled ✅' : 'Disabled'} |\n`
            responseText += `| **Response Formatting** | ${result.comparison.enhancementApplied?.responseFormatting ? 'Enabled ✅' : 'Disabled'} |\n\n`
          }
          
          // Evaluation
          if (result.evaluation) {
            responseText += `## 🏆 Evaluation\n\n`
            responseText += `**Winner:** ${result.evaluation.winner === 'enhanced' ? '🚀 Enhanced RAG' : '📊 Basic RAG'}\n\n`
            responseText += `**Analysis:**\n`
            result.evaluation.notes.forEach(note => {
              responseText += `- ${note}\n`
            })
          }
          
          console.log('MCP Tool: Comparison successful')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Compare RAG):', error)
          
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
    
    // Register Batch A/B Testing tool
    server.tool(
      'batch_compare_rag_approaches',
      'Run comprehensive A/B testing with multiple recommended interview questions. Tests: "What are my key strengths?", "Tell me about a challenging project", "Why should we hire you?", and "Describe your leadership experience". Provides aggregate metrics and success rates.',
      {},
      async () => {
        try {
          console.log('MCP Tool Called: batch_compare_rag_approaches')
          
          const result = await batchCompareRAGApproaches()
          
          // Format batch comparison response
          let responseText = `# Batch A/B Testing Results\n\n`
          responseText += `**Test Date:** ${new Date().toISOString()}\n\n`
          responseText += `---\n\n`
          
          // Summary
          if (result.summary) {
            responseText += `## 📊 Summary\n\n`
            responseText += `| Metric | Value |\n`
            responseText += `|--------|-------|\n`
            responseText += `| **Total Questions Tested** | ${result.summary.totalQuestions} |\n`
            responseText += `| **Avg Basic RAG Time** | ${result.summary.avgBasicTime.toFixed(0)}ms |\n`
            responseText += `| **Avg Enhanced RAG Time** | ${result.summary.avgEnhancedTime.toFixed(0)}ms |\n`
            responseText += `| **Avg Time Overhead** | +${result.summary.avgTimeOverhead.toFixed(0)}ms |\n`
            responseText += `| **Query Enhancement Success Rate** | ${result.summary.queryEnhancementSuccessRate}% |\n`
            responseText += `| **Total Batch Time** | ${result.summary.totalBatchTime}ms (${(result.summary.totalBatchTime / 1000).toFixed(1)}s) |\n\n`
            responseText += `---\n\n`
          }
          
          // Evaluation Criteria
          if (result.evaluationCriteria) {
            responseText += `## 📋 Evaluation Criteria\n\n`
            Object.entries(result.evaluationCriteria).forEach(([key, value]) => {
              const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
              const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)
              responseText += `- **${capitalizedKey}:** ${value}\n`
            })
            responseText += `\n---\n\n`
          }
          
          // Individual Results
          responseText += `## 🧪 Individual Test Results\n\n`
          
          if (result.batchResults && result.batchResults.length > 0) {
            result.batchResults.forEach((testResult: Record<string, unknown>, index: number) => {
              const category = testResult.category as string || 'Unknown'
              const question = testResult.question as string || ''
              const comparison = testResult.comparison as Record<string, unknown> | undefined
              const evaluation = testResult.evaluation as Record<string, unknown> | undefined
              
              responseText += `### Test ${index + 1}: ${category}\n\n`
              responseText += `**Question:** "${question}"\n\n`
              
              if (comparison) {
                responseText += `**Metrics:**\n`
                responseText += `- Time Overhead: +${comparison.timeOverhead}ms (+${comparison.timeOverheadPercent}%)\n`
                responseText += `- Length Improvement: +${comparison.lengthImprovement} chars (+${comparison.lengthImprovementPercent}%)\n`
                responseText += `- Query Enhanced: ${comparison.queryEnhanced ? 'Yes ✅' : 'No'}\n\n`
              }
              
              if (evaluation) {
                responseText += `**Winner:** ${evaluation.winner === 'enhanced' ? '🚀 Enhanced' : '📊 Basic'}\n\n`
              }
              
              responseText += `---\n\n`
            })
          }
          
          // Recommendations
          responseText += `## 💡 Recommendations\n\n`
          responseText += `Based on the batch testing results:\n\n`
          
          if (result.summary) {
            const successRate = parseFloat(result.summary.queryEnhancementSuccessRate)
            const avgOverhead = result.summary.avgTimeOverhead
            
            if (successRate >= 75 && avgOverhead < 3000) {
              responseText += `- ✅ **Use Enhanced RAG:** High success rate (${successRate}%) with acceptable overhead\n`
              responseText += `- ✅ Enable both query enhancement and response formatting for production\n`
            } else if (successRate >= 50) {
              responseText += `- ⚠️ **Use Enhanced RAG Selectively:** Moderate success rate (${successRate}%)\n`
              responseText += `- ⚠️ Consider enabling only for important questions\n`
            } else {
              responseText += `- ❌ **Review Enhancement Logic:** Low success rate (${successRate}%)\n`
              responseText += `- ❌ Consider using basic RAG until enhancements are improved\n`
            }
            
            if (avgOverhead > 3000) {
              responseText += `- ⚠️ **Performance Concern:** Average overhead is ${(avgOverhead / 1000).toFixed(1)}s\n`
              responseText += `- ⚠️ Consider optimizing LLM calls or using async processing\n`
            } else {
              responseText += `- ✅ **Performance Acceptable:** Average overhead is ${(avgOverhead / 1000).toFixed(1)}s\n`
            }
          }
          
          console.log('MCP Tool: Batch comparison successful')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Batch Compare):', error)
          
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
    
    // Register Context-Aware RAG tool
    server.tool(
      'context_aware_query',
      'Ask questions with automatic interview context detection and optimization. Automatically adapts response style, temperature, and focus areas based on question type (technical, behavioral, executive, cultural fit, system design, or quick response). Use "auto" for automatic detection or specify interview type.',
      {
        question: z.string().describe('The question to answer'),
        interviewType: z.enum(['auto', 'technical_interview', 'behavioral_interview', 'executive_interview', 'cultural_fit', 'system_design', 'quick_response']).optional().default('auto').describe('Interview context type (auto for automatic detection)')
      },
      async ({ question, interviewType }) => {
        try {
          console.log('MCP Tool Called: context_aware_query')
          console.log('Parameters:', { question, interviewType })
          
          const result = await contextAwareRAG(question, interviewType as InterviewType | 'auto')
          
          // Format response
          let responseText = `# Context-Aware RAG Response\n\n`
          responseText += `**Question:** ${question}\n\n`
          
          if (result.metadata) {
            responseText += `## 🎯 Interview Context\n\n`
            responseText += `**Detected Type:** ${result.metadata.interviewType?.replace(/_/g, ' ').toUpperCase() || 'N/A'}\n`
            responseText += `**Auto-Detected:** ${result.metadata.autoDetected ? 'Yes ✅' : 'No (Manual)'}\n\n`
            
            if (result.metadata.configuration) {
              const config = result.metadata.configuration
              responseText += `**Configuration:**\n`
              responseText += `- Query Model: ${config.queryModel}\n`
              responseText += `- Response Model: ${config.responseModel}\n`
              responseText += `- Temperature: ${config.temperature}\n`
              responseText += `- Max Tokens: ${config.maxTokens}\n`
              responseText += `- Top K: ${config.topK}\n`
              responseText += `- Tone: ${config.tone}\n`
              responseText += `- Focus Areas: ${config.focusAreas?.join(', ')}\n`
              responseText += `- Response Style: ${config.responseStyle}\n\n`
            }
            
            if (result.metadata.performance) {
              responseText += `**Performance:**\n`
              responseText += `- Expected Time: ${result.metadata.performance.expectedTime}\n`
              responseText += `- Cost Estimate: ${result.metadata.performance.costEstimate}\n`
              responseText += `- Quality Level: ${result.metadata.performance.qualityLevel}\n`
              responseText += `- Enhancement Level: ${result.metadata.performance.enhancementLevel}\n\n`
            }
            
            responseText += `---\n\n`
          }
          
          responseText += `## 💬 Response\n\n${result.response}\n\n`
          
          if (result.metadata?.processingTimeMs) {
            responseText += `---\n\n`
            responseText += `**Processing Time:** ${result.metadata.processingTimeMs}ms\n`
            responseText += `**Results Found:** ${result.metadata.resultsFound || 'N/A'}\n`
            responseText += `**Query Enhanced:** ${result.metadata.queryEnhanced ? 'Yes ✅' : 'No'}\n`
            responseText += `**Response Formatted:** ${result.metadata.responseFormatted ? 'Yes ✅' : 'No'}\n`
          }
          
          console.log('MCP Tool: Context-aware query successful')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Context-Aware):', error)
          
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
    
    // Register Interview Types Listing tool
    server.tool(
      'list_interview_types',
      'Get all available interview types with their configurations, descriptions, and performance expectations. Useful for understanding which interview context to use.',
      {},
      async () => {
        try {
          console.log('MCP Tool Called: list_interview_types')
          
          const types = await getInterviewTypes()
          
          let responseText = `# Available Interview Types\n\n`
          responseText += `Total configurations: ${types.length}\n\n`
          responseText += `---\n\n`
          
          types.forEach((type, index) => {
            responseText += `## ${index + 1}. ${type.name}\n\n`
            responseText += `**ID:** \`${type.id}\`\n\n`
            responseText += `**Description:**\n${type.description}\n\n`
            responseText += `**Configuration:**\n`
            responseText += `- Query Model: ${type.config.queryModel}\n`
            responseText += `- Response Model: ${type.config.responseModel}\n`
            responseText += `- Temperature: ${type.config.temperature}\n`
            responseText += `- Max Tokens: ${type.config.maxTokens}\n`
            responseText += `- Top K: ${type.config.topK}\n`
            responseText += `- Tone: ${type.config.tone}\n`
            responseText += `- Query Enhancement: ${type.config.enableQueryEnhancement ? 'Enabled ✅' : 'Disabled ❌'}\n`
            responseText += `- Response Formatting: ${type.config.enableInterviewFormatting ? 'Enabled ✅' : 'Disabled ❌'}\n\n`
            responseText += `**Focus Areas:**\n`
            type.config.focusAreas.forEach((area: string) => {
              responseText += `- ${area}\n`
            })
            responseText += `\n**Response Style:**\n${type.config.responseStyle}\n\n`
            responseText += `**Performance Expectations:**\n`
            responseText += `- Expected Time: ${type.performance.expectedTime}\n`
            responseText += `- Cost Estimate: ${type.performance.costEstimate}\n`
            responseText += `- Quality Level: ${type.performance.qualityLevel}\n`
            responseText += `- Enhancement Level: ${type.performance.enhancementLevel}\n\n`
            responseText += `---\n\n`
          })
          
          responseText += `## Usage Examples\n\n`
          responseText += `\`\`\`json\n`
          responseText += `// Auto-detect interview type\n`
          responseText += `{\n`
          responseText += `  "name": "context_aware_query",\n`
          responseText += `  "arguments": {\n`
          responseText += `    "question": "Your question here",\n`
          responseText += `    "interviewType": "auto"\n`
          responseText += `  }\n`
          responseText += `}\n\n`
          responseText += `// Specify interview type\n`
          responseText += `{\n`
          responseText += `  "name": "context_aware_query",\n`
          responseText += `  "arguments": {\n`
          responseText += `    "question": "Your question here",\n`
          responseText += `    "interviewType": "technical_interview"\n`
          responseText += `  }\n`
          responseText += `}\n`
          responseText += `\`\`\`\n`
          
          console.log('MCP Tool: List interview types successful')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (List Interview Types):', error)
          
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
    
    // Register Context Testing tool
    server.tool(
      'test_context_aware_rag',
      'Test how the same question gets different responses across multiple interview contexts. Demonstrates the power of context-aware configuration.',
      {
        question: z.string().describe('The question to test across different contexts')
      },
      async ({ question }) => {
        try {
          console.log('MCP Tool Called: test_context_aware_rag')
          console.log('Parameters:', { question })
          
          const result = await testContextAwareRAG(question)
          
          let responseText = `# Context-Aware RAG Testing\n\n`
          responseText += `**Test Question:** "${question}"\n\n`
          responseText += `**Total Tests:** ${result.summary?.totalTests || 0}\n`
          responseText += `**Successful Tests:** ${result.summary?.successfulTests || 0}\n`
          responseText += `**Total Time:** ${result.summary?.totalTime}ms (${((result.summary?.totalTime || 0) / 1000).toFixed(1)}s)\n\n`
          responseText += `---\n\n`
          
          if (result.results && result.results.length > 0) {
            result.results.forEach((testResult: Record<string, unknown>, index: number) => {
              const interviewType = testResult.interviewType as string || 'Unknown'
              const success = testResult.success as boolean || false
              const response = testResult.response as string || ''
              const metadata = testResult.metadata as Record<string, unknown> | undefined
              
              responseText += `## Test ${index + 1}: ${interviewType.replace(/_/g, ' ').toUpperCase()}\n\n`
              
              if (metadata?.configuration) {
                const config = metadata.configuration as Record<string, unknown>
                const focusAreas = config.focusAreas as string[] | readonly string[] || []
                const responseStyle = config.responseStyle as string || ''
                
                responseText += `**Focus Areas:** ${Array.from(focusAreas).join(', ')}\n`
                responseText += `**Response Style:** ${responseStyle}\n\n`
              }
              
              responseText += `**Response:**\n${response.substring(0, 500)}${response.length > 500 ? '...' : ''}\n\n`
              responseText += `**Processing Time:** ${metadata?.processingTimeMs || 'N/A'}ms\n`
              responseText += `**Success:** ${success ? 'Yes ✅' : 'No ❌'}\n\n`
              responseText += `---\n\n`
            })
          }
          
          if (result.summary?.responseLengths) {
            responseText += `## 📊 Response Comparison\n\n`
            responseText += `| Interview Type | Length (chars) | Processing Time (ms) |\n`
            responseText += `|----------------|----------------|----------------------|\n`
            result.summary.responseLengths.forEach((item: { type: string; length: number; processingTime: number }) => {
              responseText += `| ${item.type.replace(/_/g, ' ')} | ${item.length} | ${item.processingTime} |\n`
            })
          }
          
          console.log('MCP Tool: Context testing successful')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Test Context-Aware):', error)
          
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
    
    // ========================================================================
    // STEP 9: PERFORMANCE MONITORING AND OPTIMIZATION TOOLS
    // ========================================================================
    
    // Register Monitored Query tool
    server.tool(
      'monitored_query',
      'Execute a digital twin query with full performance monitoring and caching. Returns detailed metrics including timing, token usage, and cost estimates.',
      {
        question: z.string().describe('The question to ask about the professional background'),
        interviewType: z.enum([
          'auto', 
          'technical_interview', 
          'behavioral_interview', 
          'executive_interview', 
          'cultural_fit', 
          'system_design', 
          'quick_response'
        ]).optional().describe('Interview context (auto-detect if not specified)'),
        enableCache: z.boolean().optional().describe('Enable caching (default: true)'),
        cacheTTL: z.number().optional().describe('Cache TTL in milliseconds (default: 3600000 = 1 hour)')
      },
      async ({ question, interviewType, enableCache, cacheTTL }) => {
        try {
          console.log('MCP Tool Called: monitored_query')
          console.log('Parameters:', { question, interviewType, enableCache, cacheTTL })
          
          const { monitoredDigitalTwinQuery } = await import('@/app/actions/digital-twin-actions')
          
          const result = await monitoredDigitalTwinQuery(question, {
            interviewType: interviewType || 'auto',
            enableCache: enableCache !== false,
            cacheTTL
          })
          
          let responseText = `# Monitored RAG Query Results\n\n`
          responseText += `**Question:** "${question}"\n`
          responseText += `**Interview Type:** ${result.interviewType || 'auto'}\n`
          responseText += `**Cache Hit:** ${result.cacheHit ? '✅ Yes (instant response)' : '❌ No (computed)'}\n\n`
          
          if (result.metrics) {
            responseText += `## 📊 Performance Metrics\n\n`
            responseText += `- **Total Time:** ${result.metrics.totalTime}ms\n`
            responseText += `- **Query Enhancement:** ${result.metrics.queryEnhancementTime.toFixed(0)}ms\n`
            responseText += `- **Vector Search:** ${result.metrics.vectorSearchTime.toFixed(0)}ms\n`
            responseText += `- **Response Formatting:** ${result.metrics.responseFormattingTime.toFixed(0)}ms\n`
            responseText += `- **Tokens Used:** ${result.metrics.tokensUsed}\n`
            responseText += `- **Cost Estimate:** $${result.metrics.costEstimate.toFixed(6)}\n`
            responseText += `- **Cache Hit Rate:** ${(result.metrics.cacheHitRate * 100).toFixed(1)}%\n`
            responseText += `- **Vector Results:** ${result.metrics.vectorResults}\n\n`
            
            if (result.metrics.modelUsed) {
              responseText += `## 🤖 Models Used\n\n`
              responseText += `- **Query Model:** ${result.metrics.modelUsed.queryModel}\n`
              responseText += `- **Response Model:** ${result.metrics.modelUsed.responseModel}\n\n`
            }
          }
          
          responseText += `## 💬 Response\n\n${result.response}\n`
          
          console.log('MCP Tool: Monitored query successful')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Monitored Query):', error)
          
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
    
    // Register Performance Statistics tool
    server.tool(
      'get_performance_stats',
      'Get comprehensive performance statistics for the RAG system including cache metrics, query times, token usage, and cost tracking.',
      {},
      async () => {
        try {
          console.log('MCP Tool Called: get_performance_stats')
          
          const { getPerformanceStatistics } = await import('@/app/actions/digital-twin-actions')
          
          const result = await getPerformanceStatistics()
          
          if (!result.success || !result.stats) {
            throw new Error('Failed to retrieve performance statistics')
          }
          
          const stats = result.stats
          
          let responseText = `# 📊 Performance Statistics\n\n`
          
          responseText += `## Overall Metrics\n\n`
          responseText += `- **Total Queries:** ${stats.totalQueries}\n`
          responseText += `- **Cache Hits:** ${stats.cacheHits}\n`
          responseText += `- **Cache Misses:** ${stats.cacheMisses}\n`
          responseText += `- **Cache Hit Rate:** ${(stats.cacheHitRate * 100).toFixed(1)}%\n`
          responseText += `- **Avg Query Time:** ${stats.avgQueryTime.toFixed(0)}ms\n`
          responseText += `- **Avg Tokens Used:** ${stats.avgTokensUsed.toFixed(0)}\n`
          responseText += `- **Total Cost:** $${stats.totalCost.toFixed(6)}\n\n`
          
          if (Object.keys(stats.queriesByType).length > 0) {
            responseText += `## Queries by Interview Type\n\n`
            responseText += `| Interview Type | Count | Avg Time (ms) |\n`
            responseText += `|----------------|-------|---------------|\n`
            Object.entries(stats.queriesByType).forEach(([type, count]) => {
              const avgTime = stats.avgTimeByType[type] || 0
              responseText += `| ${type.replace(/_/g, ' ')} | ${count} | ${avgTime.toFixed(0)} |\n`
            })
            responseText += `\n`
          }
          
          // Add cache efficiency insights
          if (stats.totalQueries > 0) {
            const cacheEfficiency = stats.cacheHitRate
            let efficiencyRating = ''
            
            if (cacheEfficiency >= 0.7) {
              efficiencyRating = '🟢 Excellent'
            } else if (cacheEfficiency >= 0.4) {
              efficiencyRating = '🟡 Good'
            } else if (cacheEfficiency >= 0.2) {
              efficiencyRating = '🟠 Fair'
            } else {
              efficiencyRating = '🔴 Needs Improvement'
            }
            
            responseText += `## Cache Efficiency: ${efficiencyRating}\n\n`
            
            if (cacheEfficiency < 0.3) {
              responseText += `💡 **Tip:** Low cache hit rate. Consider:\n`
              responseText += `- Increasing cache size\n`
              responseText += `- Extending cache TTL\n`
              responseText += `- Normalizing similar questions\n\n`
            }
          }
          
          console.log('MCP Tool: Performance stats retrieved successfully')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Performance Stats):', error)
          
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
    
    // Register Cache Management tool
    server.tool(
      'manage_cache',
      'Manage the RAG query cache. Get cache information or clear the cache.',
      {
        action: z.enum(['info', 'clear']).describe('Action to perform: get info or clear cache')
      },
      async ({ action }) => {
        try {
          console.log('MCP Tool Called: manage_cache')
          console.log('Parameters:', { action })
          
          if (action === 'info') {
            const { getCacheInformation } = await import('@/app/actions/digital-twin-actions')
            
            const result = await getCacheInformation()
            
            if (!result.success || !result.cacheInfo) {
              throw new Error('Failed to retrieve cache information')
            }
            
            const info = result.cacheInfo
            
            let responseText = `# 💾 Cache Information\n\n`
            responseText += `## Capacity\n\n`
            responseText += `- **Size:** ${info.size}/${info.maxSize} entries\n`
            responseText += `- **Utilization:** ${(info.utilization * 100).toFixed(1)}%\n`
            responseText += `- **Hit Rate:** ${(info.hitRate * 100).toFixed(1)}%\n\n`
            
            // Add utilization visualization
            const barLength = 20
            const filledBars = Math.round(info.utilization * barLength)
            const emptyBars = barLength - filledBars
            const utilizationBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars)
            
            responseText += `## Utilization Visualization\n\n`
            responseText += `\`${utilizationBar}\` ${(info.utilization * 100).toFixed(1)}%\n\n`
            
            if (info.utilization > 0.9) {
              responseText += `⚠️ **Warning:** Cache is nearly full. Consider clearing old entries or increasing cache size.\n\n`
            }
            
            responseText += `## Overall Statistics\n\n`
            responseText += `- **Total Queries:** ${info.stats.totalQueries}\n`
            responseText += `- **Cache Hits:** ${info.stats.cacheHits}\n`
            responseText += `- **Cache Misses:** ${info.stats.cacheMisses}\n`
            responseText += `- **Avg Query Time:** ${info.stats.avgQueryTime.toFixed(0)}ms\n`
            responseText += `- **Total Cost:** $${info.stats.totalCost.toFixed(6)}\n`
            
            console.log('MCP Tool: Cache info retrieved successfully')
            return {
              content: [
                {
                  type: 'text',
                  text: responseText
                }
              ]
            }
            
          } else if (action === 'clear') {
            const { clearPerformanceCache } = await import('@/app/actions/digital-twin-actions')
            
            const result = await clearPerformanceCache()
            
            if (!result.success) {
              throw new Error(result.message || 'Failed to clear cache')
            }
            
            const responseText = `# ✅ Cache Cleared\n\n${result.message}\n\nAll cached queries have been removed. Subsequent queries will be computed fresh.`
            
            console.log('MCP Tool: Cache cleared successfully')
            return {
              content: [
                {
                  type: 'text',
                  text: responseText
                }
              ]
            }
          }
          
          throw new Error(`Unknown action: ${action}`)
          
        } catch (error) {
          console.error('MCP Tool Error (Manage Cache):', error)
          
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
    
    // Register Performance Analysis tool
    server.tool(
      'analyze_performance',
      'Analyze system performance and get optimization recommendations based on usage patterns.',
      {},
      async () => {
        try {
          console.log('MCP Tool Called: analyze_performance')
          
          const { analyzeSystemPerformance } = await import('@/app/actions/digital-twin-actions')
          
          const result = await analyzeSystemPerformance()
          
          if (!result.success || !result.analysis) {
            throw new Error('Failed to analyze performance')
          }
          
          const analysis = result.analysis
          
          let responseText = `# 🔍 Performance Analysis\n\n`
          
          responseText += `## 📊 Current Performance\n\n`
          responseText += `- **Total Queries:** ${analysis.stats.totalQueries}\n`
          responseText += `- **Cache Hit Rate:** ${(analysis.stats.cacheHitRate * 100).toFixed(1)}%\n`
          responseText += `- **Avg Query Time:** ${analysis.stats.avgQueryTime.toFixed(0)}ms\n`
          responseText += `- **Avg Tokens Used:** ${analysis.stats.avgTokensUsed.toFixed(0)}\n`
          responseText += `- **Total Cost:** $${analysis.stats.totalCost.toFixed(6)}\n\n`
          
          responseText += `## 💾 Cache Status\n\n`
          responseText += `- **Size:** ${analysis.cacheInfo.size}/${analysis.cacheInfo.maxSize}\n`
          responseText += `- **Utilization:** ${(analysis.cacheInfo.utilization * 100).toFixed(1)}%\n`
          responseText += `- **Hit Rate:** ${(analysis.cacheInfo.hitRate * 100).toFixed(1)}%\n\n`
          
          if (analysis.recommendations.length > 0) {
            responseText += `## 💡 Optimization Recommendations\n\n`
            
            analysis.recommendations.forEach((rec, idx) => {
              const icon = rec.severity === 'critical' ? '🔴' : rec.severity === 'warning' ? '⚠️' : 'ℹ️'
              
              responseText += `### ${icon} ${idx + 1}. ${rec.message}\n\n`
              responseText += `**Type:** ${rec.type}\n`
              responseText += `**Severity:** ${rec.severity}\n`
              responseText += `**Suggestion:** ${rec.suggestion}\n`
              responseText += `**Potential Improvement:** ${rec.potentialImprovement}\n\n`
            })
          } else {
            responseText += `## ✅ System Health\n\n`
            responseText += `No optimization recommendations at this time. System is performing optimally.\n`
          }
          
          console.log('MCP Tool: Performance analysis completed successfully')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Analyze Performance):', error)
          
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
    
    // Register Benchmark tool
    server.tool(
      'run_benchmark',
      'Run a performance benchmark with test questions to measure system performance under load.',
      {
        customQuestions: z.array(z.string()).optional().describe('Custom questions to test (uses defaults if not provided)')
      },
      async ({ customQuestions }) => {
        try {
          console.log('MCP Tool Called: run_benchmark')
          console.log('Parameters:', { customQuestions: customQuestions?.length || 'default' })
          
          const { runPerformanceBenchmark } = await import('@/app/actions/digital-twin-actions')
          
          const result = await runPerformanceBenchmark(customQuestions)
          
          if (!result.success || !result.benchmark) {
            throw new Error('Failed to run benchmark')
          }
          
          const bench = result.benchmark
          
          let responseText = `# 🏁 Performance Benchmark Results\n\n`
          
          responseText += `## Summary\n\n`
          responseText += `- **Total Tests:** ${bench.totalTests}\n`
          responseText += `- **Average Time:** ${bench.avgTime.toFixed(0)}ms\n`
          responseText += `- **Average Tokens:** ${bench.avgTokens.toFixed(0)}\n`
          responseText += `- **Total Cost:** $${bench.totalCost.toFixed(6)}\n\n`
          
          responseText += `## Individual Results\n\n`
          
          bench.results.forEach((result, idx) => {
            const icon = result.success ? '✅' : '❌'
            
            responseText += `### ${icon} Test ${idx + 1}: "${result.question}"\n\n`
            
            if (result.success && result.metrics) {
              responseText += `- **Total Time:** ${result.metrics.totalTime}ms\n`
              responseText += `- **Tokens Used:** ${result.metrics.tokensUsed}\n`
              responseText += `- **Cost:** $${result.metrics.costEstimate.toFixed(6)}\n`
              responseText += `- **Vector Results:** ${result.metrics.vectorResults}\n\n`
            } else {
              responseText += `- **Status:** Failed\n\n`
            }
          })
          
          // Add performance rating
          const avgTime = bench.avgTime
          let performanceRating = ''
          
          if (avgTime < 1000) {
            performanceRating = '🟢 Excellent (< 1s)'
          } else if (avgTime < 2000) {
            performanceRating = '🟡 Good (1-2s)'
          } else if (avgTime < 3000) {
            performanceRating = '🟠 Fair (2-3s)'
          } else {
            performanceRating = '🔴 Slow (> 3s)'
          }
          
          responseText += `## Performance Rating: ${performanceRating}\n`
          
          console.log('MCP Tool: Benchmark completed successfully')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Benchmark):', error)
          
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
    
    // Register Cache Test tool
    server.tool(
      'test_cache',
      'Test cache functionality by running the same query multiple times and measuring cache performance.',
      {
        question: z.string().optional().describe('Question to test (uses default if not provided)')
      },
      async ({ question }) => {
        try {
          console.log('MCP Tool Called: test_cache')
          console.log('Parameters:', { question: question || 'default' })
          
          const { testCacheFunctionality } = await import('@/app/actions/digital-twin-actions')
          
          const result = await testCacheFunctionality(question)
          
          if (!result.success) {
            throw new Error(result.message || 'Cache test failed')
          }
          
          let responseText = `# 🧪 Cache Functionality Test\n\n`
          responseText += `**Test Question:** "${question || 'What are your main technical skills?'}"\n\n`
          
          responseText += `## Results\n\n`
          
          if (result.queries) {
            result.queries.forEach((query, idx) => {
              const icon = query.cacheHit ? '✅' : '❌'
              const time = query.metrics?.totalTime || 0
              
              responseText += `### ${icon} Query ${idx + 1}\n\n`
              responseText += `- **Cache Hit:** ${query.cacheHit ? 'Yes' : 'No'}\n`
              responseText += `- **Time:** ${time}ms\n`
              
              if (idx === 0 && query.metrics) {
                responseText += `- **Tokens Used:** ${query.metrics.tokensUsed}\n`
                responseText += `- **Cost:** $${query.metrics.costEstimate.toFixed(6)}\n`
              }
              
              responseText += `\n`
            })
          }
          
          responseText += `## Summary\n\n`
          responseText += `- **Cache Hits:** ${result.cacheHits || 0}/3\n`
          responseText += `- **Speed Improvement:** ${result.speedImprovement}%\n\n`
          
          if ((result.cacheHits || 0) >= 2) {
            responseText += `✅ **Cache Working Correctly:** Subsequent queries are being served from cache.\n`
          } else {
            responseText += `⚠️ **Cache Issue:** Expected more cache hits. Check cache configuration.\n`
          }
          
          console.log('MCP Tool: Cache test completed successfully')
          return {
            content: [
              {
                type: 'text',
                text: responseText
              }
            ]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Test Cache):', error)
          
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
    
    // ========================================================================
    // STEP 10: VOICE-ENABLED MCP TOOLS
    // ElevenLabs Speech-to-Text, Text-to-Speech, Speech-to-Speech
    // ========================================================================

    // Tool 15: Get Available Voices
    server.tool(
      'get_available_voices',
      'Get list of available ElevenLabs voices for text-to-speech. Returns voice IDs, names, categories, and preview URLs.',
      {},
      async () => {
        try {
          console.log('MCP Tool Called: get_available_voices')
          
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const response = await fetch(`${baseUrl}/api/voice/voices`)
          const data = await response.json()
          
          if (!data.success) {
            throw new Error('Failed to fetch voices')
          }
          
          interface VoiceInfo {
            voiceId: string
            name: string
            category: string
            description?: string
            previewUrl?: string
          }

          let responseText = `# 🎙️ Available ElevenLabs Voices\n\n`
          responseText += `Total voices: ${data.voices.length}\n\n`
          
          data.voices.forEach((voice: VoiceInfo, idx: number) => {
            responseText += `## ${idx + 1}. ${voice.name}\n\n`
            responseText += `- **Voice ID:** \`${voice.voiceId}\`\n`
            responseText += `- **Category:** ${voice.category}\n`
            if (voice.description) {
              responseText += `- **Description:** ${voice.description}\n`
            }
            if (voice.previewUrl) {
              responseText += `- **Preview:** ${voice.previewUrl}\n`
            }
            responseText += `\n`
          })
          
          return {
            content: [{ type: 'text', text: responseText }]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Get Voices):', error)
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Failed to get voices'}`
            }]
          }
        }
      }
    )

    // Tool 16: Text-to-Speech
    server.tool(
      'text_to_speech',
      'Convert text to speech using ElevenLabs. Returns information about the generated audio.',
      {
        text: z.string().describe('Text to convert to speech'),
        voiceId: z.string().optional().describe('ElevenLabs voice ID (optional, uses default Adam voice)'),
        stability: z.number().min(0).max(1).optional().describe('Voice stability 0-1 (default: 0.5)'),
        similarityBoost: z.number().min(0).max(1).optional().describe('Similarity boost 0-1 (default: 0.75)')
      },
      async ({ text, voiceId, stability, similarityBoost }) => {
        try {
          console.log('MCP Tool Called: text_to_speech')
          console.log(`Text length: ${text.length} chars`)
          
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const response = await fetch(
            `${baseUrl}/api/voice/speak`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, voiceId, stability, similarityBoost })
            }
          )
          
          if (!response.ok) {
            throw new Error('Text-to-speech conversion failed')
          }
          
          const charactersUsed = response.headers.get('X-Characters-Used') || '0'
          const duration = response.headers.get('X-Duration-Estimate') || '0'
          
          let responseText = `# 🔊 Text-to-Speech Conversion\n\n`
          responseText += `**Status:** ✅ Success\n\n`
          responseText += `**Input Text:** "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\n`
          responseText += `**Metrics:**\n`
          responseText += `- Characters Used: ${charactersUsed}\n`
          responseText += `- Estimated Duration: ~${duration} seconds\n`
          responseText += `- Voice ID: ${voiceId || 'Default (Adam)'}\n\n`
          responseText += `**Note:** Audio file has been generated and is available via the API endpoint.\n`
          responseText += `To play the audio, access: \`/api/voice/speak\` with the same parameters.\n`
          
          return {
            content: [{ type: 'text', text: responseText }]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (TTS):', error)
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Text-to-speech failed'}`
            }]
          }
        }
      }
    )
    
    // ============================================
    // CONVERSATION MEMORY TOOLS (4 TOOLS)
    // ============================================
    
    // Tool 17: Create Conversation Session
    server.tool(
      'create_conversation',
      'Create a new conversation session for maintaining context across multiple queries',
      {},
      async () => {
        try {
          console.log('MCP Tool Called: create_conversation')
          
          const result = await createConversationSession()
          
          if (!result.success) {
            throw new Error(result.error)
          }
          
          let responseText = `# ✅ New Conversation Session Created\n\n`
          responseText += `**Session ID:** \`${result.sessionId}\`\n\n`
          responseText += `**Created At:** ${result.createdAt ? new Date(result.createdAt).toISOString() : 'N/A'}\n\n`
          responseText += `**Usage:** Use this session ID for \`query_with_memory\` to maintain conversation context.\n`
          
          return {
            content: [{ type: 'text', text: responseText }]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Create Conversation):', error)
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Failed to create conversation'}`
            }]
          }
        }
      }
    )
    
    // Tool 18: Query with Memory
    server.tool(
      'query_with_memory',
      'Ask a question with conversation memory. This maintains context across multiple questions in the same session.',
      {
        question: z.string().describe('Question to ask the digital twin'),
        sessionId: z.string().describe('Conversation session ID from create_conversation'),
        interviewType: z.enum([
          'auto',
          'technical_interview',
          'behavioral_interview',
          'executive_interview',
          'cultural_fit',
          'system_design',
          'quick_response'
        ]).optional().describe('Type of interview context (default: auto-detect)')
      },
      async ({ question, sessionId, interviewType }) => {
        try {
          console.log('MCP Tool Called: query_with_memory')
          console.log(`Session: ${sessionId}, Question: ${question}`)
          
          const result = await memoryAwareDigitalTwinQuery(question, sessionId, {
            interviewType: (interviewType as InterviewType | 'auto') || 'auto'
          })
          
          if (!result.success) {
            throw new Error('Memory-aware query failed')
          }
          
          let responseText = `# 💬 Digital Twin Response (with Memory)\n\n`
          responseText += `**Question:** ${question}\n\n`
          responseText += `**Answer:** ${result.response}\n\n`
          responseText += `---\n\n`
          responseText += `**Session ID:** \`${result.sessionId}\`\n`
          responseText += `**Conversation Turns:** ${result.conversationHistory.length}\n`
          responseText += `**Interview Type:** ${result.interviewType}\n`
          
          if (result.cacheHit) {
            responseText += `**Cache:** ✅ Hit (faster response)\n`
          }
          
          if (result.metrics) {
            responseText += `**Processing Time:** ${result.metrics.totalTime}ms\n`
          }
          
          return {
            content: [{ type: 'text', text: responseText }]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Query with Memory):', error)
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Memory-aware query failed'}`
            }]
          }
        }
      }
    )
    
    // Tool 19: Get Conversation History
    server.tool(
      'get_conversation_history',
      'Get the conversation history for a session, including all previous questions and answers',
      {
        sessionId: z.string().describe('Conversation session ID')
      },
      async ({ sessionId }) => {
        try {
          console.log('MCP Tool Called: get_conversation_history')
          console.log(`Session: ${sessionId}`)
          
          const result = await getConversationHistoryAction(sessionId)
          
          if (!result.success) {
            throw new Error(result.error)
          }
          
          let responseText = `# 📜 Conversation History\n\n`
          responseText += `**Session ID:** \`${sessionId}\`\n`
          
          if (result.stats) {
            responseText += `**Total Turns:** ${result.stats.turnCount}\n`
            responseText += `**Session Age:** ${Math.floor(result.stats.sessionAge / 1000)}s\n`
            responseText += `**Last Active:** ${Math.floor(result.stats.lastActive / 1000)}s ago\n`
          }
          
          responseText += `\n---\n\n`
          
          if (result.history && result.history.length > 0) {
            responseText += `## Conversation:\n\n`
            
            result.history.forEach((turn, index) => {
              const icon = turn.role === 'user' ? '👤' : '🤖'
              const role = turn.role === 'user' ? 'User' : 'Assistant'
              responseText += `### ${icon} ${role} (Turn ${index + 1})\n`
              responseText += `${turn.content}\n\n`
            })
          } else {
            responseText += `*No conversation history yet.*\n`
          }
          
          return {
            content: [{ type: 'text', text: responseText }]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Get History):', error)
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Failed to get history'}`
            }]
          }
        }
      }
    )
    
    // Tool 20: Clear Conversation
    server.tool(
      'clear_conversation',
      'Clear the conversation history for a session and start fresh',
      {
        sessionId: z.string().describe('Conversation session ID to clear')
      },
      async ({ sessionId }) => {
        try {
          console.log('MCP Tool Called: clear_conversation')
          console.log(`Session: ${sessionId}`)
          
          const result = await clearConversationHistoryAction(sessionId)
          
          if (!result.success) {
            throw new Error(result.error)
          }
          
          let responseText = `# 🗑️ Conversation Cleared\n\n`
          responseText += `**Session ID:** \`${sessionId}\`\n\n`
          responseText += `**Status:** ✅ ${result.message}\n\n`
          responseText += `You can now start a fresh conversation with this session ID.\n`
          
          return {
            content: [{ type: 'text', text: responseText }]
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Clear Conversation):', error)
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Failed to clear conversation'}`
            }]
          }
        }
      }
    )
    
    // Tool 21: Reset Default Conversation
    server.tool(
      'reset_conversation_memory',
      'Reset the default conversation memory used by query_digital_twin. Use this to start a fresh conversation when the context gets too long or confused.',
      {},
      async () => {
        try {
          console.log('MCP Tool Called: reset_conversation_memory')
          
          if (defaultSessionId) {
            await clearConversationHistoryAction(defaultSessionId)
            const oldSessionId = defaultSessionId
            defaultSessionId = null
            
            return {
              content: [{
                type: 'text',
                text: `# 🔄 Conversation Memory Reset\n\n✅ Previous session cleared: \`${oldSessionId}\`\n\n💡 Next question will start a fresh conversation with a new session.`
              }]
            }
          } else {
            return {
              content: [{
                type: 'text',
                text: `# ℹ️ No Active Session\n\nNo conversation session was active. Your next question will start a new session automatically.`
              }]
            }
          }
          
        } catch (error) {
          console.error('MCP Tool Error (Reset Memory):', error)
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Failed to reset memory'}`
            }]
          }
        }
      }
    )
    
    console.log('MCP Server: Tool registration complete (21 tools registered)')
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