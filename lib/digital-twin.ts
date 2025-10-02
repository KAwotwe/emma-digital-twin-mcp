import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { Index } from '@upstash/vector'
import Groq from 'groq-sdk'

export interface DigitalTwinResponse {
  question: string
  answer: string
  sources: Array<{
    title: string
    category: string
    relevance: number
  }>
  timestamp: string
}

export const digitalTwinQuerySchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(500, 'Question too long'),
  topK: z.number().min(1).max(10).optional().default(3),
  includeMetadata: z.boolean().optional().default(true),
  filterByType: z.string().optional()
})

export type DigitalTwinQuery = z.infer<typeof digitalTwinQuerySchema>

// Environment variable validation
const requiredEnvVars = {
  UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
  UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
  GROQ_API_KEY: process.env.GROQ_API_KEY
}

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars)
  console.error('Please ensure all variables are set in .env.local file')
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`)
}

console.log('✅ All required environment variables loaded successfully')

// Initialize Upstash Vector index
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Type definitions for profile data
interface ProfileData {
  personal?: {
    name: string
    title: string
    summary: string
    elevator_pitch: string
    location: string
  }
  projects_star_format?: Array<{
    project_name: string
    situation: string
    task: string
    action: string
    result: string
    technologies?: string[]
    duration?: string
  }>
  experience?: Array<{
    title: string
    company: string
    duration: string
    company_context?: string
    achievements_star?: Array<{
      situation: string
      task: string
      action: string
      result: string
    }>
  }>
  skills?: {
    technical?: {
      programming_languages?: Array<{
        language: string
        proficiency_1to5: number
        years: string
      }>
      ai_ml?: string[]
      cloud_platforms?: string[]
      business_tools?: string[]
    }
  }
  education?: {
    degrees?: Array<{
      program: string
      institution: string
      timeline: string
      projects_highlights?: string[]
    }>
  }
  salary_location?: {
    salary_expectations: string
    location_preferences?: string[]
    work_authorization: string
    remote_experience: string
  }
  portfolio_evidence?: {
    dashboards?: Array<{
      title: string
      tool: string
      kpis?: Record<string, string>
      insights?: string[]
    }>
  }
}

interface SearchableChunk {
  id: string
  title: string
  content: string
  type: string
  metadata: {
    category: string
    tags: string[]
    importance: string
    [key: string]: unknown
  }
}

// Load profile data
let profileData: ProfileData | null = null
function loadProfileData(): ProfileData {
  if (!profileData) {
    try {
      const profilePath = path.join(process.cwd(), 'digitaltwin.json')
      const rawData = fs.readFileSync(profilePath, 'utf-8')
      profileData = JSON.parse(rawData) as ProfileData
      console.log('Profile data loaded successfully')
    } catch (error) {
      console.error('Error loading profile data:', error)
      throw new Error('Failed to load profile data')
    }
  }
  return profileData
}

// Intent classification
function classifyIntent(question: string): string {
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes('experience') || lowerQuestion.includes('work') || lowerQuestion.includes('job') || lowerQuestion.includes('ausbiz')) {
    return 'experience'
  }
  if (lowerQuestion.includes('skill') || lowerQuestion.includes('python') || lowerQuestion.includes('ai') || lowerQuestion.includes('ml') || lowerQuestion.includes('technology') || lowerQuestion.includes('programming')) {
    return 'skills'
  }
  if (lowerQuestion.includes('project') || lowerQuestion.includes('food rag') || lowerQuestion.includes('build') || lowerQuestion.includes('built')) {
    return 'projects'
  }
  if (lowerQuestion.includes('education') || lowerQuestion.includes('degree') || lowerQuestion.includes('university') || lowerQuestion.includes('certification')) {
    return 'education'
  }
  if (lowerQuestion.includes('salary') || lowerQuestion.includes('career') || lowerQuestion.includes('goal') || lowerQuestion.includes('remote') || lowerQuestion.includes('location')) {
    return 'career_goals'
  }
  
  return 'personal'
}

// Content search and relevance scoring (fallback for when vector search fails)
function searchContent(question: string, filterByType?: string): Array<{chunk: SearchableChunk, relevance: number}> {
  const profile = loadProfileData()
  const intent = classifyIntent(question)
  const lowerQuestion = question.toLowerCase()
  
  console.log(`Query intent classified as: ${intent}`)
  
  const results: Array<{chunk: SearchableChunk, relevance: number}> = []
  
  // Create searchable chunks from the new profile structure
  const searchableChunks: SearchableChunk[] = []
  
  // Personal information
  if (profile.personal) {
    searchableChunks.push({
      id: 'personal',
      title: 'Personal Information',
      content: `${profile.personal.name} - ${profile.personal.title}. ${profile.personal.summary}. ${profile.personal.elevator_pitch}`,
      type: 'personal',
      metadata: { category: 'personal', tags: ['personal', 'summary'], importance: 'high' }
    })
  }
  
  // Projects
  if (profile.projects_star_format) {
    profile.projects_star_format.forEach((project, index: number) => {
      searchableChunks.push({
        id: `project_${index}`,
        title: `Project: ${project.project_name}`,
        content: `${project.situation} ${project.task} ${project.action} ${project.result} Technologies: ${project.technologies?.join(', ')}`,
        type: 'projects',
        metadata: { category: 'projects', tags: ['project', 'portfolio'], importance: 'high' }
      })
    })
  }
  
  // Experience
  if (profile.experience) {
    profile.experience.forEach((exp, index: number) => {
      const achievements = exp.achievements_star?.map((a) => `${a.situation} ${a.task} ${a.action} ${a.result}`).join(' ') || ''
      searchableChunks.push({
        id: `experience_${index}`,
        title: `${exp.title} at ${exp.company}`,
        content: `${exp.title} at ${exp.company} (${exp.duration}). ${achievements}`,
        type: 'experience',
        metadata: { category: 'work_experience', tags: ['work', 'experience'], importance: 'high' }
      })
    })
  }
  
  // Skills
  if (profile.skills?.technical) {
    const techSkills = profile.skills.technical
    const skillsContent = `Programming languages: ${techSkills.programming_languages?.map((p) => `${p.language} (${p.proficiency_1to5}/5)`).join(', ')}. AI/ML: ${techSkills.ai_ml?.join(', ')}. Cloud platforms: ${techSkills.cloud_platforms?.join(', ')}.`
    searchableChunks.push({
      id: 'technical_skills',
      title: 'Technical Skills',
      content: skillsContent,
      type: 'skills',
      metadata: { category: 'technical_skills', tags: ['skills', 'technical'], importance: 'high' }
    })
  }
  
  // Education
  if (profile.education?.degrees) {
    profile.education.degrees.forEach((degree, index: number) => {
      searchableChunks.push({
        id: `education_${index}`,
        title: `Education: ${degree.program}`,
        content: `${degree.program} at ${degree.institution} (${degree.timeline}). Projects: ${degree.projects_highlights?.join(', ')}`,
        type: 'education',
        metadata: { category: 'education', tags: ['education', 'degree'], importance: 'high' }
      })
    })
  }
  
  // Search through created chunks
  for (const chunk of searchableChunks) {
    if (filterByType && chunk.type !== filterByType) continue
    
    let relevance = 0
    const chunkContent = chunk.content.toLowerCase()
    const chunkTitle = chunk.title.toLowerCase()
    
    // Intent-based scoring
    if (chunk.type === intent) relevance += 0.5
    
    // Keyword matching in content
    const questionWords = lowerQuestion.split(' ').filter(word => word.length > 2)
    for (const word of questionWords) {
      if (chunkContent.includes(word)) relevance += 0.1
      if (chunkTitle.includes(word)) relevance += 0.2
      if (chunk.metadata.tags.some((tag) => tag.toLowerCase().includes(word))) relevance += 0.15
    }
    
    // Importance boost
    if (chunk.metadata.importance === 'high') relevance += 0.1
    
    if (relevance > 0.2) {
      results.push({ chunk, relevance })
    }
  }
  
  // Sort by relevance and return top results
  return results.sort((a, b) => b.relevance - a.relevance)
}

// Vector search using Upstash
async function vectorSearch(question: string, topK: number = 3): Promise<Array<{chunk: Record<string, unknown>, relevance: number}>> {
  try {
    console.log('Performing vector search with Upstash...')
    const results = await vectorIndex.query({
      data: question,
      topK: topK,
      includeMetadata: true
    })
    
    if (!results || results.length === 0) {
      console.log('Vector search returned empty results')
      return []
    }
    
    return results.map(result => ({
      chunk: (result.metadata as Record<string, unknown>) || result,
      relevance: result.score || 0
    }))
  } catch (error) {
    console.log('Vector search failed, falling back to keyword search:', error)
    return []
  }
}

// Populate Upstash Vector with content chunks from new profile structure
export async function populateVectorDatabase(): Promise<void> {
  try {
    const profile = loadProfileData()
    console.log('Populating vector database with updated profile structure...')
    
    const vectors = []
    
    // Add personal information
    if (profile.personal) {
      vectors.push({
        id: 'personal_overview',
        data: `${profile.personal.name} - ${profile.personal.title}. ${profile.personal.summary}. ${profile.personal.elevator_pitch}`,
        metadata: {
          title: 'Personal Information',
          type: 'personal',
          category: 'personal_info',
          tags: ['personal', 'summary', 'overview'],
          importance: 'high',
          profileName: profile.personal.name,
          profileTitle: profile.personal.title,
          profileLocation: profile.personal.location
        }
      })
    }
    
    // Add salary and location info
    if (profile.salary_location) {
      const salaryInfo = profile.salary_location
      vectors.push({
        id: 'salary_location',
        data: `Salary expectations: ${salaryInfo.salary_expectations}. Location preferences: ${salaryInfo.location_preferences?.join(', ')}. Work authorization: ${salaryInfo.work_authorization}. Remote experience: ${salaryInfo.remote_experience}`,
        metadata: {
          title: 'Salary & Location Information',
          type: 'salary_location',
          category: 'employment_details',
          tags: ['salary', 'location', 'visa', 'remote'],
          importance: 'high'
        }
      })
    }
    
    // Add projects
    if (profile.projects_star_format) {
      profile.projects_star_format.forEach((project, index: number) => {
        vectors.push({
          id: `project_${index}`,
          data: `Project: ${project.project_name}. Situation: ${project.situation}. Task: ${project.task}. Action: ${project.action}. Result: ${project.result}. Technologies: ${project.technologies?.join(', ')}. Duration: ${project.duration}.`,
          metadata: {
            title: `Project: ${project.project_name}`,
            type: 'project',
            category: 'projects',
            tags: ['project', 'portfolio'].concat(project.technologies || []),
            importance: 'high'
          }
        })
      })
    }
    
    // Add experience
    if (profile.experience) {
      profile.experience.forEach((exp, index: number) => {
        const achievements = exp.achievements_star?.map((a) => 
          `Achievement: Situation: ${a.situation}. Task: ${a.task}. Action: ${a.action}. Result: ${a.result}.`
        ).join(' ') || ''
        
        vectors.push({
          id: `experience_${index}`,
          data: `Work Experience: ${exp.title} at ${exp.company} (${exp.duration}). ${exp.company_context || ''}. ${achievements}`,
          metadata: {
            title: `${exp.title} at ${exp.company}`,
            type: 'experience',
            category: 'work_experience',
            tags: ['work', 'experience', 'employment'],
            importance: 'high'
          }
        })
      })
    }
    
    // Add technical skills
    if (profile.skills?.technical) {
      const techSkills = profile.skills.technical
      const skillsData = `Programming Languages: ${techSkills.programming_languages?.map((p) => `${p.language} (proficiency ${p.proficiency_1to5}/5, ${p.years} years)`).join(', ')}. AI/ML: ${techSkills.ai_ml?.join(', ')}. Cloud platforms: ${techSkills.cloud_platforms?.join(', ')}. Business tools: ${techSkills.business_tools?.join(', ')}.`
      
      vectors.push({
        id: 'technical_skills',
        data: skillsData,
        metadata: {
          title: 'Technical Skills',
          type: 'skills',
          category: 'technical_skills',
          tags: ['skills', 'technical', 'programming', 'ai', 'ml'],
          importance: 'high'
        }
      })
    }
    
    // Add education
    if (profile.education?.degrees) {
      profile.education.degrees.forEach((degree, index: number) => {
        vectors.push({
          id: `education_${index}`,
          data: `Education: ${degree.program} at ${degree.institution} (${degree.timeline}). Key projects: ${degree.projects_highlights?.join(', ')}.`,
          metadata: {
            title: `Education: ${degree.program}`,
            type: 'education',
            category: 'education',
            tags: ['education', 'degree', 'university'],
            importance: 'high'
          }
        })
      })
    }
    
    // Add portfolio evidence
    if (profile.portfolio_evidence?.dashboards) {
      profile.portfolio_evidence.dashboards.forEach((dashboard, index: number) => {
        const kpiText = dashboard.kpis ? Object.entries(dashboard.kpis).map(([k, v]) => `${k}: ${v}`).join(', ') : ''
        vectors.push({
          id: `portfolio_${index}`,
          data: `Dashboard Portfolio: ${dashboard.title} using ${dashboard.tool}. Key metrics: ${kpiText}. Insights: ${dashboard.insights?.join('; ')}.`,
          metadata: {
            title: `Portfolio: ${dashboard.title}`,
            type: 'portfolio',
            category: 'portfolio_evidence',
            tags: ['portfolio', 'dashboard', dashboard.tool?.toLowerCase()],
            importance: 'high'
          }
        })
      })
    }
    
    if (vectors.length === 0) {
      throw new Error('No content found to populate vector database')
    }
    
    await vectorIndex.upsert(vectors)
    console.log(`Successfully upserted ${vectors.length} content chunks to vector database`)
  } catch (error) {
    console.error('Error populating vector database:', error)
    throw error
  }
}

// Generate personalized response using Groq LLM
async function generateResponse(question: string, relevantChunks: Array<{chunk: Record<string, unknown>, relevance: number}>): Promise<string> {
  const intent = classifyIntent(question)
  
  if (relevantChunks.length === 0) {
    return `Hello! I'm Emmanuel Awotwe, an AI/RAG Developer & Data Analyst (Graduate) based in Australia. I recently completed an internship at AUSBIZ Consulting where I built a production Food RAG system that saves ~1,200 hours/year. I'd be happy to tell you more about my experience, projects, technical skills, or career goals.`
  }
  
  // Create context from relevant chunks
  const context = relevantChunks
    .map((item, index) => `${index + 1}. ${item.chunk.title || 'Information'}: ${item.chunk.content}`)
    .join('\n\n')
  
  // Create intent-specific system prompt
  let intentContext = ""
  switch (intent) {
    case 'experience':
      intentContext = "Focus on work experience, achievements in STAR format, and professional accomplishments with quantified results."
      break
    case 'skills':
      intentContext = "Emphasize technical skills with proficiency levels (1-5 scale), programming languages with years of experience, tools, and specific expertise areas."
      break
    case 'projects':
      intentContext = "Describe specific projects using STAR format (Situation, Task, Action, Result), technologies used, quantified outcomes, and business impact."
      break
    case 'education':
      intentContext = "Highlight educational background, degrees with timelines, certifications, and key academic projects with outcomes."
      break
    case 'career_goals':
      intentContext = "Discuss career aspirations, learning goals, and industry interests with specific examples."
      break
    default:
      intentContext = "Provide comprehensive information about the topic."
  }
  
  const systemPrompt = `You are Emmanuel Awotwe's AI digital twin. Answer questions as if you are Emmanuel, speaking in first person about your background, skills, and experience.

Key Personal Info:
- Name: Emmanuel Awotwe
- Title: AI/RAG Developer & Data Analyst (Graduate)
- Location: Australia
- Summary: Graduate data analyst who shipped a production-quality RAG assistant in 4 weeks and improved finance/advisory delivery with measurable outcomes.

${intentContext}

Always respond professionally and authentically as Emmanuel. Be specific about your experience and achievements. Use quantified metrics when available.`

  const userPrompt = `Based on the following information about yourself, answer the question.

Your Professional Information:
${context}

Question: ${question}

Provide a helpful, professional response in first person:`

  try {
    console.log('Generating response with Groq LLM...')
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 500
    })
    
    return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.'
  } catch (error) {
    console.error('Error generating response with Groq:', error)
    // Fallback to simple response
    const topChunk = relevantChunks[0].chunk
    return `Hello! I'm Emmanuel Awotwe. ${(topChunk.content as string) || 'I\'m an AI/RAG Developer & Data Analyst.'}`
  }
}

export async function ragQuery(query: DigitalTwinQuery): Promise<DigitalTwinResponse> {
  try {
    console.log('Processing digital twin query:', query.question)
    
    // Try vector search first, fall back to keyword search
    let relevantChunks = await vectorSearch(query.question, query.topK)
    
    if (relevantChunks.length === 0) {
      console.log('Vector search returned no results, using keyword search fallback')
      // Convert SearchableChunk to Record<string, unknown> for compatibility
      const searchResults = searchContent(query.question, query.filterByType)
      relevantChunks = searchResults.map(result => ({
        chunk: {
          title: result.chunk.title,
          content: result.chunk.content,
          type: result.chunk.type,
          metadata: result.chunk.metadata
        } as Record<string, unknown>,
        relevance: result.relevance
      }))
    }
    
    console.log(`Found ${relevantChunks.length} relevant content chunks`)
    
    // Log top results with structure info
    relevantChunks.slice(0, query.topK).forEach((result, index) => {
      const title = (result.chunk.title as string) || 'No title'
      console.log(`${index + 1}. ${title} (Relevance: ${result.relevance.toFixed(3)})`)
      console.log(`   Chunk structure:`, {
        hasMetadata: !!result.chunk.metadata,
        hasType: !!result.chunk.type,
        category: ((result.chunk.metadata as Record<string, unknown>)?.category as string) || (result.chunk.type as string) || 'unknown'
      })
    })
    
    // Generate response using Groq LLM
    const answer = await generateResponse(query.question, relevantChunks.slice(0, query.topK))
    
    // Format sources with safe property access
    const sources = relevantChunks.slice(0, query.topK).map(result => {
      const chunk = result.chunk
      const metadata = chunk.metadata as Record<string, unknown> | undefined
      return {
        title: (chunk.title as string) || 'Unknown Source',
        category: (metadata?.category as string) || (chunk.type as string) || 'general',
        relevance: Math.round(result.relevance * 1000) / 1000
      }
    })
    
    console.log('Digital twin query completed successfully')
    
    return {
      question: query.question,
      answer,
      sources,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error during RAG query:', error)
    throw new Error('Failed to process query: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}
