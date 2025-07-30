import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'
import { Roast } from '@roast-battle/ui'

interface CreateRoastRequest {
  speaker: 'human' | 'ai'
  round: number
  text: string
  audioUrl?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const battleId = id as string

  if (!battleId) {
    return res.status(400).json({ error: 'Battle ID is required' })
  }

  if (req.method === 'POST') {
    return createRoast(battleId, req, res)
  } else if (req.method === 'GET') {
    return getRoasts(battleId, req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function createRoast(battleId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { speaker, round, text, audioUrl }: CreateRoastRequest = req.body

    if (!speaker || !round || !text) {
      return res.status(400).json({ error: 'Speaker, round, and text are required' })
    }

    // Verify battle exists
    const battle = dataStore.getBattle(battleId)
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    // Generate roast ID
    const roastId = Math.random().toString(36).substring(2, 15)

    const roast: Roast = {
      id: roastId,
      battleId,
      speaker,
      round,
      text,
      audioUrl,
      timestamp: Date.now(),
    }

    const createdRoast = dataStore.addRoast(roast)

    // Broadcast roast to all connected clients
    dataStore.broadcastToBattle(battleId, {
      type: 'roast_ready',
      roast: createdRoast,
    })

    return res.status(201).json({
      success: true,
      roast: createdRoast,
    })
  } catch (error) {
    console.error('Error creating roast:', error)
    return res.status(500).json({ error: 'Failed to create roast' })
  }
}

async function getRoasts(battleId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { round } = req.query
    
    // Verify battle exists
    const battle = dataStore.getBattle(battleId)
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    let roasts
    if (round && typeof round === 'string') {
      const roundNumber = parseInt(round)
      roasts = dataStore.getRoastsByRound(battleId, roundNumber)
    } else {
      roasts = dataStore.getRoasts(battleId)
    }

    return res.status(200).json({
      success: true,
      roasts,
      count: roasts.length,
    })
  } catch (error) {
    console.error('Error fetching roasts:', error)
    return res.status(500).json({ error: 'Failed to fetch roasts' })
  }
}
