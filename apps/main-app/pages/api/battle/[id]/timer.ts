import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'

interface TimerRequest {
  action: 'start' | 'stop' | 'reset'
  seconds?: number
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
    const { action, seconds }: TimerRequest = req.body

    if (!action) {
      return res.status(400).json({ error: 'Action is required' })
    }

    // Verify battle exists
    const battle = dataStore.getBattle(battleId)
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    switch (action) {
      case 'start':
        if (battle.status !== 'live') {
          return res.status(400).json({ error: 'Battle must be live to start timer' })
        }
        dataStore.startTimer(battleId)
        break

      case 'stop':
        dataStore.stopTimer(battleId)
        break

      case 'reset':
        const resetSeconds = seconds || 60
        dataStore.updateBattle(battleId, { timer: resetSeconds })
        if (battle.status === 'live') {
          dataStore.startTimer(battleId)
        }
        break

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

    const updatedBattle = dataStore.getBattle(battleId)

    return res.status(200).json({
      success: true,
      battle: updatedBattle,
      action,
    })
  } catch (error) {
    console.error('Error managing timer:', error)
    return res.status(500).json({ error: 'Failed to manage timer' })
  }
}
