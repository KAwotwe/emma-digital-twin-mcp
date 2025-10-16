import { NextResponse } from 'next/server'
import { getElevenLabsVoice } from '@/lib/elevenlabs-voice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/voice/voices
 * 
 * Get available ElevenLabs voices
 */
export async function GET() {
  try {
    console.log('🎙️ Fetching available voices')

    const elevenLabs = getElevenLabsVoice()
    const voices = await elevenLabs.getVoices()

    console.log(`✅ Retrieved ${voices.length} voices`)

    interface ElevenLabsVoice {
      voice_id: string
      name: string
      category: string
      description?: string
      preview_url?: string
      labels?: Record<string, string>
    }

    return NextResponse.json({
      success: true,
      voices: voices.map((v: ElevenLabsVoice) => ({
        voiceId: v.voice_id,
        name: v.name,
        category: v.category,
        description: v.description,
        previewUrl: v.preview_url,
        labels: v.labels
      }))
    })

  } catch (error) {
    console.error('❌ Get voices error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get voices'
      },
      { status: 500 }
    )
  }
}
