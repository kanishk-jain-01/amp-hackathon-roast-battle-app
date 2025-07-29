import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'
import { Battle } from '@roast-battle/ui'

interface CreateBattleRequest {
  topics: string[]
  coinFlipResult?: 'human' | 'ai'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return createBattle(req, res)
  } else if (req.method === 'GET') {
    return getAllBattles(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function createBattle(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { topics, coinFlipResult }: CreateBattleRequest = req.body

    if (!topics || !Array.isArray(topics) || topics.length !== 3) {
      return res.status(400).json({ error: 'Exactly 3 topics are required' })
    }

    // Generate battle ID
    const battleId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    const battle: Battle = {
      id: battleId,
      topics,
      currentRound: 1,
      status: 'pending',
      turn: coinFlipResult || 'human',
      timer: 0,
      coinFlipResult,
      timestamp: Date.now(),
    }

    const createdBattle = dataStore.createBattle(battle)

    return res.status(201).json({
      success: true,
      battle: createdBattle,
    })
  } catch (error) {
    console.error('Error creating battle:', error)
    return res.status(500).json({ error: 'Failed to create battle' })
  }
}

async function getAllBattles(req: NextApiRequest, res: NextApiResponse) {
  try {
    const battles = dataStore.getAllBattles()
    
    // Only return active battles (not ended and less than 1 hour old)
    const activeBattles = battles.filter(battle => {
      const oneHour = 60 * 60 * 1000
      return battle.status !== 'ended' && (Date.now() - battle.timestamp) < oneHour
    })

    return res.status(200).json({
      success: true,
      battles: activeBattles,
      count: activeBattles.length,
    })
  } catch (error) {
    console.error('Error fetching battles:', error)
    return res.status(500).json({ error: 'Failed to fetch battles' })
  }
}
