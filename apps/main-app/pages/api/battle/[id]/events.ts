import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'
import { enableCors } from '@/lib/cors'

// Simple Server-Sent Events implementation for real-time updates
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for cross-origin requests
  if (enableCors(req, res)) {
    return // Preflight request handled
  }

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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET',
  })

  // Generate connection ID
  const connectionId = Math.random().toString(36).substring(2, 15)
  
  console.log(`[SSE] New connection ${connectionId} for battle ${battleId}`)
  
  // Add connection to store
  dataStore.addConnection(connectionId, battleId, res)

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

  console.log(`[SSE] Sending initial data to connection ${connectionId}:`, initialData.type)
  res.write(`data: ${JSON.stringify(initialData)}\n\n`)

  // Send a test message to verify SSE is working
  setTimeout(() => {
    console.log(`[SSE] Sending test message to connection ${connectionId}`)
    res.write(`data: ${JSON.stringify({ type: 'test', message: 'SSE connection working', timestamp: Date.now() })}\n\n`)
  }, 1000)

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    if (!res.destroyed && res.writable) {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
    } else {
      clearInterval(heartbeat)
      dataStore.removeConnection(connectionId)
    }
  }, 30000) // 30 seconds

  // Cleanup function
  const cleanup = () => {
    console.log(`[SSE] Cleaning up connection ${connectionId} for battle ${battleId}`)
    clearInterval(heartbeat)
    dataStore.removeConnection(connectionId)
    if (!res.destroyed) {
      res.end()
    }
  }

  // Cleanup on client disconnect
  req.on('close', cleanup)
  req.on('error', cleanup)

  // Remove the conflicting periodic update interval that interferes with real-time broadcasts
  // The broadcastToBattle calls from vote.ts and other endpoints handle real-time updates
}
