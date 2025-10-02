'use server'

import { ragQuery, digitalTwinQuerySchema, populateVectorDatabase } from '@/lib/digital-twin'

// Server action to test the digital twin query functionality
export async function queryDigitalTwin(
  question: string,
  options?: {
    topK?: number
    includeMetadata?: boolean
    filterByType?: string
  }
) {
  try {
    // Validate input
    const validatedQuery = digitalTwinQuerySchema.parse({
      question,
      topK: options?.topK || 3,
      includeMetadata: options?.includeMetadata ?? true,
      filterByType: options?.filterByType
    })

    console.log('Server action: Processing digital twin query:', question)
    
    // Execute RAG query
    const result = await ragQuery(validatedQuery)
    
    console.log('Server action: Digital twin query successful')
    
    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error('Server action error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Server action to populate Upstash Vector database
export async function populateVectorDatabaseAction() {
  try {
    console.log('Server action: Populating vector database...')
    
    await populateVectorDatabase()
    
    console.log('Server action: Vector database population successful')
    
    return {
      success: true,
      message: 'Vector database populated successfully with updated profile data!'
    }
    
  } catch (error) {
    console.error('Vector database population error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to populate vector database'
    }
  }
}

// Server action to test basic connectivity
export async function testConnectivity() {
  try {
    console.log('Testing digital twin connectivity...')
    
    const testResult = await queryDigitalTwin('Tell me about your background')
    
    return {
      success: true,
      message: 'Digital twin is ready and operational!',
      testResult
    }
    
  } catch (error) {
    console.error('Connectivity test failed:', error)
    
    return {
      success: false,
      message: 'Digital twin connectivity test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}