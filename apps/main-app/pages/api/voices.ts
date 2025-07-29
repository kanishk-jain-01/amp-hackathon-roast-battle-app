import { NextApiRequest, NextApiResponse } from 'next'

// Default voices when ElevenLabs API is not available
const DEFAULT_VOICES = [
  { id: 'adam', name: 'Adam', description: 'Deep, authoritative' },
  { id: 'antoni', name: 'Antoni', description: 'Well-rounded' },
  { id: 'arnold', name: 'Arnold', description: 'Crisp, dynamic' },
  { id: 'bella', name: 'Bella', description: 'Soft, pleasant' },
  { id: 'domi', name: 'Domi', description: 'Strong, confident' },
  { id: 'elli', name: 'Elli', description: 'Emotional, expressive' },
  { id: 'josh', name: 'Josh', description: 'Warm, friendly' },
  { id: 'rachel', name: 'Rachel', description: 'Calm, professional' },
  { id: 'sam', name: 'Sam', description: 'Energetic, enthusiastic' },
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY

    if (!elevenLabsKey) {
      // Return default voices for development
      return res.status(200).json({
        success: true,
        voices: DEFAULT_VOICES,
        source: 'default',
      })
    }

    // Fetch from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': elevenLabsKey,
      },
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform ElevenLabs response to our format
    const voices = data.voices?.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.labels?.description || voice.category || 'AI generated voice',
    })) || DEFAULT_VOICES

    return res.status(200).json({
      success: true,
      voices,
      source: 'elevenlabs',
    })
  } catch (error) {
    console.error('Error fetching voices:', error)
    
    // Fallback to default voices
    return res.status(200).json({
      success: true,
      voices: DEFAULT_VOICES,
      source: 'default',
      error: 'Failed to fetch from ElevenLabs, using default voices',
    })
  }
}
