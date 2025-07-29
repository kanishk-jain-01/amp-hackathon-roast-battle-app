import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'

// Simple Server-Sent Events implementation for real-time updates
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const battleId = id as string

  if (!battleId) {
    return res.status(400).json({ error: 'Battle ID is required' })
  }

  // Verify battle exists
  const battle = dataStore.getBattle(battleId)
  if (!battle) {
    return res.status(404).json({ error: 'Battle not found' })
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Generate connection ID
  const connectionId = Math.random().toString(36).substring(2, 15)
  
  // Add connection to store
  dataStore.addConnection(connectionId, battleId)

  // Send initial data
  const initialData = {
    type: 'initial',
    battle: dataStore.getBattle(battleId),
    roasts: dataStore.getRoasts(battleId),
    voteTallies: {
      1: dataStore.getVoteTally(battleId, 1),
      2: dataStore.getVoteTally(battleId, 2),
      3: dataStore.getVoteTally(battleId, 3),
    },
    totalTally: dataStore.getVoteTally(battleId),
    audienceCount: dataStore.getAudienceCount(battleId),
  }

  res.write(`data: ${JSON.stringify(initialData)}\n\n`)

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
  }, 30000) // 30 seconds

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat)
    dataStore.removeConnection(connectionId)
    res.end()
  })

  req.on('error', () => {
    clearInterval(heartbeat)
    dataStore.removeConnection(connectionId)
    res.end()
  })

  // Send periodic updates (simplified - in production you'd use proper pub/sub)
  const updateInterval = setInterval(() => {
    try {
      const currentBattle = dataStore.getBattle(battleId)
      if (!currentBattle) {
        clearInterval(updateInterval)
        res.end()
        return
      }

      const updateData = {
        type: 'update',
        battle: currentBattle,
        voteTallies: {
          1: dataStore.getVoteTally(battleId, 1),
          2: dataStore.getVoteTally(battleId, 2),
          3: dataStore.getVoteTally(battleId, 3),
        },
        totalTally: dataStore.getVoteTally(battleId),
        audienceCount: dataStore.getAudienceCount(battleId),
      }

      res.write(`data: ${JSON.stringify(updateData)}\n\n`)
    } catch (error) {
      console.error('Error sending update:', error)
      clearInterval(updateInterval)
      res.end()
    }
  }, 2000) // Update every 2 seconds

  // Cleanup interval on disconnect
  req.on('close', () => {
    clearInterval(updateInterval)
  })
}
