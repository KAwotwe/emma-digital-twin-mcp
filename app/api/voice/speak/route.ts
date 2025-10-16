import { NextRequest, NextResponse } from 'next/server'
import { getElevenLabsVoice } from '@/lib/elevenlabs-voice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/voice/speak
 * 
 * Convert text to speech using ElevenLabs
 * 
 * Body: { text: string, voiceId?: string, stability?: number, similarityBoost?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId, stability, similarityBoost, style } = body

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    console.log('🔊 Converting text to speech:', text.substring(0, 100))

    const elevenLabs = getElevenLabsVoice()
    
    const result = await elevenLabs.textToSpeech(text, {
      voiceId,
      stability,
      similarityBoost,
      style,
      modelId: 'eleven_monolingual_v1' // High quality
    })

    console.log(`✅ Text converted to speech: ${result.charactersUsed} chars, ~${result.duration}s`)

    // Return audio as binary response
    return new NextResponse(result.audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': result.audioBuffer.byteLength.toString(),
        'X-Characters-Used': result.charactersUsed.toString(),
        'X-Duration-Estimate': result.duration.toString()
      }
    })

  } catch (error) {
    console.error('❌ Text-to-speech error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Text-to-speech failed'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/voice/speak',
    method: 'POST',
    description: 'Convert text to speech using ElevenLabs',
    accepts: 'application/json',
    body: {
      text: 'string (required)',
      voiceId: 'string (optional)',
      stability: 'number 0-1 (optional, default: 0.5)',
      similarityBoost: 'number 0-1 (optional, default: 0.75)',
      style: 'number 0-1 (optional, default: 0.0)'
    }
  })
}
