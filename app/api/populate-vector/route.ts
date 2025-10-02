import { NextResponse } from 'next/server'
import { populateVectorDatabase } from '@/lib/digital-twin'

export async function POST() {
  try {
    console.log('Populating vector database...')
    
    await populateVectorDatabase()
    
    console.log('Vector database populated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Vector database populated successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Vector database population error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to populate vector database',
    endpoint: '/api/populate-vector',
    method: 'POST'
  })
}