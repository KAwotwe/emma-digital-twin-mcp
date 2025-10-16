/**
 * ElevenLabs Voice Integration for Digital Twin MCP Server
 * 
 * Features:
 * - Speech-to-Text (Transcription)
 * - Text-to-Speech (Voice synthesis)
 * - Speech-to-Speech (Voice conversion)
 */

interface ElevenLabsConfig {
  apiKey: string
  voiceId?: string // Default voice ID
}

interface TranscriptionResult {
  text: string
  duration: number
  language?: string
}

interface SpeechResult {
  audioBuffer: ArrayBuffer
  duration: number
  charactersUsed: number
}

export class ElevenLabsVoice {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'
  private defaultVoiceId: string

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey
    // Default to 'Adam' voice - professional male voice
    this.defaultVoiceId = config.voiceId || '21m00Tcm4TlvDq8ikWAM'
  }

  /**
   * Speech-to-Text: Transcribe audio to text
   * https://elevenlabs.io/docs/api-reference/speech-to-text
   */
  async transcribeAudio(
    audioBlob: Blob,
    options?: {
      language?: string
      model?: string
    }
  ): Promise<TranscriptionResult> {
    const formData = new FormData()
    formData.append('audio', audioBlob)
    
    if (options?.language) {
      formData.append('language', options.language)
    }
    if (options?.model) {
      formData.append('model_id', options.model)
    }

    const response = await fetch(`${this.baseUrl}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs transcription failed: ${error}`)
    }

    const result = await response.json()
    
    return {
      text: result.text,
      duration: result.duration || 0,
      language: result.language
    }
  }

  /**
   * Text-to-Speech: Convert text to audio
   * https://elevenlabs.io/docs/api-reference/text-to-speech
   */
  async textToSpeech(
    text: string,
    options?: {
      voiceId?: string
      modelId?: string
      stability?: number // 0-1
      similarityBoost?: number // 0-1
      style?: number // 0-1
      speakerBoost?: boolean
    }
  ): Promise<SpeechResult> {
    const voiceId = options?.voiceId || this.defaultVoiceId
    
    const requestBody = {
      text: text,
      model_id: options?.modelId || 'eleven_monolingual_v1',
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
        style: options?.style ?? 0.0,
        use_speaker_boost: options?.speakerBoost ?? true
      }
    }

    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs TTS failed: ${error}`)
    }

    const audioBuffer = await response.arrayBuffer()

    return {
      audioBuffer,
      duration: this.estimateAudioDuration(text),
      charactersUsed: text.length
    }
  }

  /**
   * Speech-to-Speech: Convert audio to different voice
   * https://elevenlabs.io/docs/api-reference/speech-to-speech
   */
  async speechToSpeech(
    audioBlob: Blob,
    options?: {
      voiceId?: string
      modelId?: string
      stability?: number
      similarityBoost?: number
    }
  ): Promise<SpeechResult> {
    const voiceId = options?.voiceId || this.defaultVoiceId
    
    const formData = new FormData()
    formData.append('audio', audioBlob)
    formData.append('model_id', options?.modelId || 'eleven_english_sts_v2')
    
    const voiceSettings = {
      stability: options?.stability ?? 0.5,
      similarity_boost: options?.similarityBoost ?? 0.75
    }
    formData.append('voice_settings', JSON.stringify(voiceSettings))

    const response = await fetch(
      `${this.baseUrl}/speech-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': this.apiKey
        },
        body: formData
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs STS failed: ${error}`)
    }

    const audioBuffer = await response.arrayBuffer()

    return {
      audioBuffer,
      duration: 0, // Can't estimate without knowing input duration
      charactersUsed: 0
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Array<{
    voice_id: string
    name: string
    category: string
    description?: string
    preview_url?: string
    labels?: Record<string, string>
  }>> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch voices')
    }

    const data = await response.json()
    return data.voices
  }

  /**
   * Estimate audio duration (rough calculation)
   */
  private estimateAudioDuration(text: string): number {
    // Average speaking rate: ~150 words per minute
    const words = text.split(/\s+/).length
    const minutes = words / 150
    return Math.ceil(minutes * 60) // seconds
  }
}

// Singleton instance
let elevenLabsInstance: ElevenLabsVoice | null = null

export function getElevenLabsVoice(): ElevenLabsVoice {
  if (!elevenLabsInstance) {
    const apiKey = process.env.ELEVENLABS_API_KEY
    
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured')
    }

    elevenLabsInstance = new ElevenLabsVoice({
      apiKey,
      voiceId: '21m00Tcm4TlvDq8ikWAM' // Adam voice - professional male
    })
  }

  return elevenLabsInstance
}
