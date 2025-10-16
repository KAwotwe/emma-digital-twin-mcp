import { NextRequest, NextResponse } from 'next/server'
import { getElevenLabsVoice } from '@/lib/elevenlabs-voice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/voice/transcribe
 * 
 * Transcribe audio to text using ElevenLabs
 * 
 * Body: FormData with 'audio' file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    console.log('🎤 Transcribing audio:', audioFile.name, audioFile.type)

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type
    })

    const elevenLabs = getElevenLabsVoice()
    
    const result = await elevenLabs.transcribeAudio(audioBlob, {
      language: 'en'
    })

    console.log('✅ Audio transcribed:', result.text.substring(0, 100))

    return NextResponse.json({
      success: true,
      text: result.text,
      duration: result.duration,
      language: result.language
    })

  } catch (error) {
    console.error('❌ Transcription error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/voice/transcribe',
    method: 'POST',
    description: 'Transcribe audio to text using ElevenLabs',
    accepts: 'multipart/form-data',
    fields: {
      audio: 'Audio file (required)'
    }
  })
}
