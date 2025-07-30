import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'
import { Battle, BattleStatus } from '@roast-battle/ui'
import { enableCors } from '@/lib/cors'

interface UpdateBattleRequest {
  status?: BattleStatus
  currentRound?: number
  turn?: 'human' | 'ai'
  timer?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for cross-origin requests
  if (enableCors(req, res)) {
    return // Preflight request handled
  }

  const { id } = req.query
  const battleId = id as string

  if (!battleId) {
    return res.status(400).json({ error: 'Battle ID is required' })
  }

  if (req.method === 'GET') {
    return getBattle(battleId, res)
  } else if (req.method === 'PUT') {
    return updateBattle(battleId, req, res)
  } else if (req.method === 'DELETE') {
    return deleteBattle(battleId, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function getBattle(battleId: string, res: NextApiResponse) {
  try {
    const battle = dataStore.getBattle(battleId)
    
    if (!battle) {
      // Debug: Log available battles
      const allBattles = dataStore.getAllBattles()
      console.log(`Battle ${battleId} not found. Available battles:`, allBattles.map(b => ({ id: b.id, status: b.status })))
      return res.status(404).json({ 
        error: 'Battle not found',
        availableBattles: allBattles.map(b => b.id)
      })
    }

    const roasts = dataStore.getRoasts(battleId)
    const votes = dataStore.getVotes(battleId)
    const audienceCount = dataStore.getAudienceCount(battleId)
    
    // Calculate vote tallies
    const voteTallies: Record<number, { human: number; ai: number }> = {}
    const totalTally = { human: 0, ai: 0 }
    
    for (let round = 1; round <= 3; round++) {
      const roundTally = dataStore.getVoteTally(battleId, round)
      voteTallies[round] = roundTally
      totalTally.human += roundTally.human
      totalTally.ai += roundTally.ai
    }

    // Determine winner if battle is ended
    let winner: 'human' | 'ai' | undefined
    if (battle.status === 'ended') {
      winner = totalTally.human > totalTally.ai ? 'human' : 
               totalTally.ai > totalTally.human ? 'ai' : undefined
    }

    return res.status(200).json({
      success: true,
      battle,
      roasts,
      votes,
      voteTallies,
      totalTally,
      audienceCount,
      winner,
    })
  } catch (error) {
    console.error('Error fetching battle:', error)
    return res.status(500).json({ error: 'Failed to fetch battle' })
  }
}

async function updateBattle(battleId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const updates: UpdateBattleRequest = req.body
    
    const updatedBattle = dataStore.updateBattle(battleId, updates)
    
    if (!updatedBattle) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    return res.status(200).json({
      success: true,
      battle: updatedBattle,
    })
  } catch (error) {
    console.error('Error updating battle:', error)
    return res.status(500).json({ error: 'Failed to update battle' })
  }
}

async function deleteBattle(battleId: string, res: NextApiResponse) {
  try {
    const deleted = dataStore.deleteBattle(battleId)
    
    if (!deleted) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Battle deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting battle:', error)
    return res.status(500).json({ error: 'Failed to delete battle' })
  }
}
