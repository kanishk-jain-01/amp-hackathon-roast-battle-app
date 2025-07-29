import { NextApiRequest, NextApiResponse } from 'next'

interface TTSRequest {
  text: string
  voiceId: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, voiceId }: TTSRequest = req.body

    if (!text || !voiceId) {
      return res.status(400).json({ error: 'Text and voiceId are required' })
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY

    if (!elevenLabsKey) {
      // Return mock response for development
      return res.status(200).json({
        audioUrl: null, // No audio in development mode
        text,
        voiceId,
        message: 'Text-to-speech disabled in development mode',
        timestamp: Date.now(),
      })
    }

    const audioBuffer = await generateElevenLabsAudio(text, voiceId, elevenLabsKey)
    
    // Convert buffer to base64 data URL for immediate use
    const base64Audio = audioBuffer.toString('base64')
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

    return res.status(200).json({
      audioUrl,
      text,
      voiceId,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Error generating speech:', error)
    return res.status(500).json({ 
      error: 'Failed to generate speech',
      audioUrl: null,
      text: req.body.text,
      voiceId: req.body.voiceId,
    })
  }
}

async function generateElevenLabsAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<Buffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

// Available voices endpoint
export async function getAvailableVoices(apiKey: string) {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`)
  }

  return response.json()
}
