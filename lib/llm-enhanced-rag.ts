/**
 * LLM-Enhanced RAG Module
 * 
 * Provides query preprocessing functionality using Groq LLM to improve
 * vector search accuracy for the Digital Twin MCP server.
 * 
 * This module enhances user queries by:
 * - Adding relevant synonyms and related terms
 * - Expanding context for interview scenarios
 * - Including technical and soft skill variations
 * - Focusing on achievements and quantifiable results
 * 
 * @module lib/llm-enhanced-rag
 */

import Groq from 'groq-sdk'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

/**
 * Enhances a user query using LLM to improve vector search accuracy
 * 
 * @param originalQuery - The user's original question
 * @returns Enhanced search query optimized for vector database retrieval
 * 
 * @example
 * ```typescript
 * const enhanced = await enhanceQuery("Tell me about my projects")
 * // Returns: "software development projects, technical achievements, leadership roles, 
 * //          problem-solving examples, measurable outcomes, project management, 
 * //          team collaboration, technical challenges overcome"
 * ```
 */
export async function enhanceQuery(originalQuery: string): Promise<string> {
  const enhancementPrompt = `
You are an interview preparation assistant that improves search queries.

Original question: "${originalQuery}"

Enhance this query to better search professional profile data by:
- Adding relevant synonyms and related terms
- Expanding context for interview scenarios
- Including technical and soft skill variations
- Focusing on achievements and quantifiable results

Return only the enhanced search query (no explanation):
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: enhancementPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Lower temperature for consistent query enhancement
      max_tokens: 150,
    })

    const enhancedQuery = completion.choices[0]?.message?.content?.trim() || originalQuery
    
    // Log the enhancement for debugging
    console.log('🔍 Query Enhancement:')
    console.log(`   Original: "${originalQuery}"`)
    console.log(`   Enhanced: "${enhancedQuery}"`)
    
    return enhancedQuery
    
  } catch (error) {
    console.error('❌ Query enhancement failed:', error)
    return originalQuery // Fallback to original query on error
  }
}

/**
 * Enhances multiple queries in parallel for batch processing
 * 
 * @param queries - Array of user questions to enhance
 * @returns Array of enhanced queries in the same order
 * 
 * @example
 * ```typescript
 * const enhanced = await enhanceQueriesBatch([
 *   "Tell me about my projects",
 *   "What are my technical skills?"
 * ])
 * ```
 */
export async function enhanceQueriesBatch(queries: string[]): Promise<string[]> {
  try {
    const enhancedQueries = await Promise.all(
      queries.map(query => enhanceQuery(query))
    )
    return enhancedQueries
  } catch (error) {
    console.error('❌ Batch query enhancement failed:', error)
    return queries // Fallback to original queries
  }
}

/**
 * Query enhancement with custom configuration
 * 
 * @param originalQuery - The user's original question
 * @param options - Configuration options for enhancement
 * @returns Enhanced search query
 * 
 * @example
 * ```typescript
 * const enhanced = await enhanceQueryWithOptions("Tell me about my projects", {
 *   temperature: 0.5,
 *   maxTokens: 200,
 *   model: 'llama-3.1-70b-versatile'
 * })
 * ```
 */
export async function enhanceQueryWithOptions(
  originalQuery: string,
  options: {
    temperature?: number
    maxTokens?: number
    model?: string
    focusArea?: 'technical' | 'leadership' | 'achievements' | 'general'
  } = {}
): Promise<string> {
  const {
    temperature = 0.3,
    maxTokens = 150,
    model = 'llama-3.1-8b-instant',
    focusArea = 'general'
  } = options

  // Customize prompt based on focus area
  let focusInstructions = ''
  switch (focusArea) {
    case 'technical':
      focusInstructions = 'Focus on technical skills, programming languages, frameworks, and technical problem-solving.'
      break
    case 'leadership':
      focusInstructions = 'Focus on leadership experiences, team management, mentoring, and organizational impact.'
      break
    case 'achievements':
      focusInstructions = 'Focus on quantifiable achievements, metrics, awards, and measurable results.'
      break
    default:
      focusInstructions = 'Balance technical skills, leadership, and achievements comprehensively.'
  }

  const enhancementPrompt = `
You are an interview preparation assistant that improves search queries.

Original question: "${originalQuery}"

Enhance this query to better search professional profile data by:
- Adding relevant synonyms and related terms
- Expanding context for interview scenarios
- Including technical and soft skill variations
- Focusing on achievements and quantifiable results

${focusInstructions}

Return only the enhanced search query (no explanation):
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: enhancementPrompt }],
      model,
      temperature,
      max_tokens: maxTokens,
    })

    const enhancedQuery = completion.choices[0]?.message?.content?.trim() || originalQuery
    
    console.log(`🔍 Query Enhancement (${focusArea}):`)
    console.log(`   Original: "${originalQuery}"`)
    console.log(`   Enhanced: "${enhancedQuery}"`)
    
    return enhancedQuery
    
  } catch (error) {
    console.error('❌ Query enhancement failed:', error)
    return originalQuery
  }
}

/**
 * Example query transformations demonstrating the enhancement capabilities
 * 
 * These examples show how the LLM transforms simple questions into
 * comprehensive search queries that yield better vector search results.
 */
export const EXAMPLE_TRANSFORMATIONS = [
  {
    original: 'Tell me about my projects',
    enhanced: 'software development projects, technical achievements, leadership roles, problem-solving examples, measurable outcomes, project management, team collaboration, technical challenges overcome'
  },
  {
    original: 'What are my technical skills?',
    enhanced: 'programming languages, frameworks, technical expertise, software development skills, tools, technologies, coding proficiency, technical stack, development experience'
  },
  {
    original: 'Describe my leadership experience',
    enhanced: 'team leadership, management roles, mentoring, coaching, team building, organizational impact, people management, leadership achievements, team growth, project oversight'
  },
  {
    original: 'What achievements am I most proud of?',
    enhanced: 'career achievements, measurable outcomes, success metrics, performance improvements, delivery rates, efficiency gains, awards, recognition, quantifiable results, business impact'
  },
  {
    original: 'Tell me about working at AUSbiz',
    enhanced: 'AUSbiz experience, employment history, role responsibilities, project contributions, team collaboration, achievements at AUSbiz, technical work, business outcomes, company projects'
  }
]

/**
 * Utility function to test query enhancement with example queries
 * Useful for debugging and validation during development
 */
export async function testQueryEnhancement(): Promise<void> {
  console.log('\n🧪 Testing Query Enhancement...\n')
  
  for (const example of EXAMPLE_TRANSFORMATIONS) {
    console.log(`📝 Testing: "${example.original}"`)
    const enhanced = await enhanceQuery(example.original)
    console.log(`✅ Enhanced: "${enhanced}"\n`)
  }
}

/**
 * Export types for TypeScript support
 */
export interface QueryEnhancementOptions {
  temperature?: number
  maxTokens?: number
  model?: string
  focusArea?: 'technical' | 'leadership' | 'achievements' | 'general'
}

export interface QueryEnhancementResult {
  originalQuery: string
  enhancedQuery: string
  model: string
  timestamp: string
}

/**
 * Enhanced query function that returns detailed results
 * Useful for debugging and tracking enhancement performance
 */
export async function enhanceQueryWithDetails(
  originalQuery: string,
  options: QueryEnhancementOptions = {}
): Promise<QueryEnhancementResult> {
  const enhancedQuery = await enhanceQueryWithOptions(originalQuery, options)
  
  return {
    originalQuery,
    enhancedQuery,
    model: options.model || 'llama-3.1-8b-instant',
    timestamp: new Date().toISOString()
  }
}

/**
 * ========================================================================
 * RESPONSE POST-PROCESSING: Interview-Ready Answer Formatting
 * ========================================================================
 */

/**
 * RAG result interface for type safety
 */
export interface RAGResult {
  data?: string
  text?: string
  content?: string
  metadata?: Record<string, unknown>
  score?: number
}

/**
 * Interview response formatting options
 */
export interface InterviewFormattingOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  emphasizeSTAR?: boolean  // Emphasize STAR format
  includeMetrics?: boolean // Focus on quantifiable achievements
  tone?: 'confident' | 'humble' | 'balanced'
}

/**
 * Interview response result with metadata
 */
export interface InterviewResponseResult {
  originalQuestion: string
  formattedResponse: string
  rawContext: string
  model: string
  timestamp: string
}

/**
 * Formats RAG results into interview-ready responses
 * 
 * Takes raw vector search results and transforms them into polished,
 * interview-appropriate answers using LLM post-processing.
 * 
 * @param ragResults - Array of results from vector search
 * @param originalQuestion - The interview question being answered
 * @returns Formatted interview response using STAR format and highlighting achievements
 * 
 * @example
 * ```typescript
 * const results = await vectorSearch("Tell me about React experience")
 * const response = await formatForInterview(results, "Tell me about your React experience")
 * 
 * // Input (RAG): "React experience: 2 years, e-commerce platform, performance optimization"
 * // Output (Interview): "I have 2 years of production React experience where I was the 
 * //                     lead developer on our e-commerce platform. One of my key achievements 
 * //                     was optimizing our component architecture, which reduced page load 
 * //                     times by 40% and improved our conversion rate by 15%..."
 * ```
 */
export async function formatForInterview(
  ragResults: RAGResult[],
  originalQuestion: string
): Promise<string> {
  // Extract text content from various RAG result formats
  const context = ragResults
    .map(result => result.data || result.text || result.content || '')
    .filter(text => text.length > 0)
    .join('\n\n')

  // Fallback if no context available
  if (!context || context.trim().length === 0) {
    return "I don't have specific information to answer that question based on my professional background."
  }

  const formattingPrompt = `
You are Emmanuel Awotwe answering an interview question. Provide a factual, structured response that combines clarity with natural conversation.

Question: "${originalQuestion}"

Your Professional Background:
${context}

Instructions:
- Start with a brief 1-2 sentence introduction that directly answers the question
- Then organize the detailed information using clear bullet points for each major responsibility or phase
- Each bullet point should be a complete thought with specific actions, technologies, and outcomes
- Include concrete metrics and achievements (numbers, percentages, time saved)
- Use first person ("I", "my", "we") throughout
- Keep bullet points focused and factual - avoid vague statements
- End with a quantified result or impact statement when applicable

Structure your response as:
1. Opening statement (1-2 sentences establishing context)
2. Key responsibilities or phases (3-5 focused bullet points with specifics)
3. Closing impact statement (1 sentence highlighting the measurable outcome)

Example format:
"I worked as a Business & AI/RAG Data Analyst Intern at AUSBIZ Consulting on a 20-week project that had two distinct phases.

In the first phase as Business Analyst:
* Practiced Scrum methodology including sprint planning, estimates, and Agile ceremonies (stand-ups, reviews, retros)
* Wrote high-quality User Stories using INVEST, SMART, and SCQA frameworks with MoSCoW prioritization
* Set up Jira projects with boards, backlogs, sprints, and dashboards, plus Confluence spaces for documentation

In the second phase as AI Data Analyst:
* Built analytics workflows in Python and SQL, automating data pipelines with AWS Lambda and API Gateway
* Managed AWS RDS PostgreSQL via pgAdmin and performed analysis with pandas and Matplotlib
* Applied Generative AI (AWS Bedrock/Anthropic) to create synthetic data for testing

The project resulted in production-grade RAG solutions saving approximately 1,200 hours per year."

Your answer following this structure:
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: formattingPrompt }],
      model: 'llama-3.1-8b-instant', // Faster, more precise for direct answers
      temperature: 0.4, // Balanced between factual consistency and natural flow
      max_tokens: 400, // Increased for structured bullet-point responses
    })

    const formattedResponse = completion.choices[0]?.message?.content?.trim() || 'Unable to generate response'
    
    // Log the formatting for debugging
    console.log('💬 Interview Response Formatted:')
    console.log(`   Question: "${originalQuestion}"`)
    console.log(`   Response Length: ${formattedResponse.length} characters`)
    
    return formattedResponse
    
  } catch (error) {
    console.error('❌ Response formatting failed:', error)
    return context // Fallback to raw RAG results
  }
}

/**
 * Formats interview response with custom options
 * 
 * @param ragResults - Array of results from vector search
 * @param originalQuestion - The interview question being answered
 * @param options - Customization options for response formatting
 * @returns Formatted interview response
 * 
 * @example
 * ```typescript
 * const response = await formatForInterviewWithOptions(results, question, {
 *   model: 'llama-3.1-70b-versatile',
 *   tone: 'confident',
 *   emphasizeSTAR: true,
 *   includeMetrics: true
 * })
 * ```
 */
export async function formatForInterviewWithOptions(
  ragResults: RAGResult[],
  originalQuestion: string,
  options: InterviewFormattingOptions = {}
): Promise<string> {
  const {
    model = 'llama-3.1-70b-versatile',
    temperature = 0.7,
    maxTokens = 500,
    emphasizeSTAR = true,
    includeMetrics = true,
    tone = 'balanced'
  } = options

  // Extract context from RAG results
  const context = ragResults
    .map(result => result.data || result.text || result.content || '')
    .filter(text => text.length > 0)
    .join('\n\n')

  if (!context || context.trim().length === 0) {
    return "I don't have specific information to answer that question based on my professional background."
  }

  // Customize prompt based on options
  let toneInstructions = ''
  switch (tone) {
    case 'confident':
      toneInstructions = 'Use a confident, assertive tone that demonstrates expertise and leadership.'
      break
    case 'humble':
      toneInstructions = 'Use a humble, collaborative tone that emphasizes team contributions.'
      break
    default:
      toneInstructions = 'Use a balanced tone that is confident but not arrogant, highlighting both individual and team achievements.'
  }

  const starInstructions = emphasizeSTAR
    ? 'IMPORTANT: Use STAR thinking (Situation-Task-Action-Result) but present it naturally as a flowing narrative. DO NOT label sections with "Situation:", "Task:", "Action:", "Result:". Instead, weave the story naturally: set the context, explain your role and objectives, describe what you did, and emphasize the measurable impact.'
    : 'Include specific examples and outcomes where relevant.'

  const metricsInstructions = includeMetrics
    ? 'Weave quantifiable achievements naturally into your narrative: percentages, time saved, efficiency gains, user numbers, revenue impact, etc. Don\'t just list them - incorporate them into the story.'
    : 'Include achievements and impact.'

  const formattingPrompt = `
You are Emmanuel Awotwe preparing a natural, conversational interview response.

Question: "${originalQuestion}"

Professional Background Data:
${context}

Create a response that:
- Tells a compelling story naturally - NO labeled sections like "Situation:", "Task:", etc.
- ${starInstructions}
- ${metricsInstructions}
- ${toneInstructions}
- Sounds natural and conversational, as you would speak in an actual interview
- Flows smoothly from context → your actions → impact/results
- Highlights unique value and differentiators
- Includes relevant technical details woven into the narrative

Example of natural STAR flow (DO THIS):
"During my 10-week project at AUSBIZ, I handled both Business Analyst and AI Data Analyst responsibilities. I set up our entire Agile infrastructure - Jira boards, sprint planning, and wrote user stories using INVEST and SMART frameworks. On the technical side, I built automated data pipelines with AWS Lambda and API Gateway, and deployed production RAG applications that ended up saving about 1,200 hours annually."

DO NOT do this (avoid labeled sections):
"Situation: At AUSBIZ... Task: I needed to... Action: I did... Result: This achieved..."

Your natural interview response:
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: formattingPrompt }],
      model,
      temperature,
      max_tokens: maxTokens,
    })

    const formattedResponse = completion.choices[0]?.message?.content?.trim() || 'Unable to generate response'
    
    console.log(`💬 Interview Response Formatted (${tone} tone):`)
    console.log(`   Question: "${originalQuestion}"`)
    console.log(`   Response Length: ${formattedResponse.length} characters`)
    
    return formattedResponse
    
  } catch (error) {
    console.error('❌ Response formatting failed:', error)
    return context
  }
}

/**
 * Formats interview response with detailed metadata
 * 
 * @param ragResults - Array of results from vector search
 * @param originalQuestion - The interview question being answered
 * @param options - Customization options
 * @returns Interview response with metadata
 * 
 * @example
 * ```typescript
 * const result = await formatForInterviewWithDetails(results, question)
 * console.log(result.formattedResponse)
 * console.log(result.model, result.timestamp)
 * ```
 */
export async function formatForInterviewWithDetails(
  ragResults: RAGResult[],
  originalQuestion: string,
  options: InterviewFormattingOptions = {}
): Promise<InterviewResponseResult> {
  const context = ragResults
    .map(result => result.data || result.text || result.content || '')
    .filter(text => text.length > 0)
    .join('\n\n')

  const formattedResponse = await formatForInterviewWithOptions(
    ragResults,
    originalQuestion,
    options
  )

  return {
    originalQuestion,
    formattedResponse,
    rawContext: context,
    model: options.model || 'llama-3.1-70b-versatile',
    timestamp: new Date().toISOString()
  }
}

/**
 * Batch format multiple interview responses
 * 
 * @param items - Array of {ragResults, question} pairs
 * @returns Array of formatted responses
 * 
 * @example
 * ```typescript
 * const formatted = await formatForInterviewBatch([
 *   { ragResults: results1, question: "Tell me about your projects" },
 *   { ragResults: results2, question: "Describe your leadership experience" }
 * ])
 * ```
 */
export async function formatForInterviewBatch(
  items: Array<{ ragResults: RAGResult[]; question: string }>
): Promise<string[]> {
  try {
    const formattedResponses = await Promise.all(
      items.map(item => formatForInterview(item.ragResults, item.question))
    )
    return formattedResponses
  } catch (error) {
    console.error('❌ Batch interview formatting failed:', error)
    return items.map(item => {
      const context = item.ragResults
        .map(result => result.data || result.text || result.content || '')
        .join('\n\n')
      return context
    })
  }
}

/**
 * Example transformations showing the power of interview formatting
 */
export const INTERVIEW_FORMATTING_EXAMPLES = [
  {
    rawRAG: 'React experience: 2 years, e-commerce platform, performance optimization',
    interviewResponse: `I have 2 years of production React experience where I was the lead developer on our e-commerce platform. One of my key achievements was optimizing our component architecture, which reduced page load times by 40% and improved our conversion rate by 15%. I'm particularly proud of implementing a custom caching strategy that handled our Black Friday traffic surge of 50,000 concurrent users without any downtime.`
  },
  {
    rawRAG: 'Team leadership: managed 3 developers, agile methodology, sprint planning',
    interviewResponse: `I led a team of 3 developers using agile methodology, where I was responsible for sprint planning, code reviews, and mentoring. During my time as team lead, we improved our sprint velocity by 35% and reduced bug counts by 50% through implementation of better testing practices. I also established a mentorship program that helped two junior developers advance to mid-level positions within 6 months.`
  },
  {
    rawRAG: 'Problem solving: API integration issues, debugging, system architecture',
    interviewResponse: `I faced a critical challenge when our third-party API integration started failing intermittently, affecting 25% of our users. I took ownership of debugging the issue, discovered it was related to rate limiting and retry logic, and implemented a robust queuing system with exponential backoff. This solution not only fixed the immediate problem but also improved our overall system reliability, reducing API-related errors by 90% and saving the company approximately $50,000 in potential lost revenue.`
  }
]

/**
 * Test interview formatting with example data
 */
export async function testInterviewFormatting(): Promise<void> {
  console.log('\n🎭 Testing Interview Response Formatting...\n')
  
  for (const example of INTERVIEW_FORMATTING_EXAMPLES) {
    console.log(`📝 Raw RAG Result: "${example.rawRAG}"`)
    
    const mockResults = [{ data: example.rawRAG }]
    const formatted = await formatForInterview(
      mockResults,
      "Tell me about your experience"
    )
    
    console.log(`✨ Formatted Response: "${formatted}"`)
    console.log('')
  }
}
