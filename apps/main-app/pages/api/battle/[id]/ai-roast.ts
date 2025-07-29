import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'

interface AIRoastRequest {
  topic: string
  model: string
  voice: string
  round: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const battleId = id as string

  if (!battleId) {
    return res.status(400).json({ error: 'Battle ID is required' })
  }

  try {
    const { topic, model, voice, round }: AIRoastRequest = req.body

    if (!topic || !model || !voice || !round) {
      return res.status(400).json({ error: 'Topic, model, voice, and round are required' })
    }

    // Verify battle exists and is active
    const battle = dataStore.getBattle(battleId)
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    if (battle.status !== 'live') {
      return res.status(400).json({ error: 'Battle is not active' })
    }

    // Get previous roasts to avoid repetition
    const existingRoasts = dataStore.getRoasts(battleId)
    const previousRoasts = existingRoasts
      .filter(roast => roast.speaker === 'ai')
      .map(roast => roast.text)

    // Generate AI roast
    const roastResponse = await fetch(`${getBaseUrl(req)}/api/ai-roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        model,
        previousRoasts,
      }),
    })

    if (!roastResponse.ok) {
      throw new Error('Failed to generate roast')
    }

    const roastData = await roastResponse.json()
    let audioUrl = null

    // Generate speech if we have the roast text
    if (roastData.roast) {
      try {
        const ttsResponse = await fetch(`${getBaseUrl(req)}/api/text-to-speech`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: roastData.roast,
            voiceId: voice,
          }),
        })

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json()
          audioUrl = ttsData.audioUrl
        }
      } catch (ttsError) {
        console.error('TTS generation failed:', ttsError)
        // Continue without audio
      }
    }

    // Save the roast to the battle
    const roast = {
      id: Math.random().toString(36).substring(2, 15),
      battleId,
      speaker: 'ai' as const,
      round,
      text: roastData.roast,
      audioUrl,
      timestamp: Date.now(),
    }

    const savedRoast = dataStore.addRoast(roast)

    return res.status(201).json({
      success: true,
      roast: savedRoast,
      model: roastData.model,
      voice,
      hasAudio: !!audioUrl,
    })
  } catch (error) {
    console.error('Error generating AI roast:', error)
    return res.status(500).json({ error: 'Failed to generate AI roast' })
  }
}

function getBaseUrl(req: NextApiRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host
  return `${protocol}://${host}`
}
