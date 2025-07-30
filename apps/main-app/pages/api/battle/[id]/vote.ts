import { NextApiRequest, NextApiResponse } from 'next'
import { dataStore } from '@/lib/data-store'
import { Vote } from '@roast-battle/ui'
import { enableCors } from '@/lib/cors'

interface VoteRequest {
  voterHash: string
  round: number
  voteFor: 'human' | 'ai'
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

  if (req.method === 'POST') {
    return castVote(battleId, req, res)
  } else if (req.method === 'GET') {
    return getVotes(battleId, req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function castVote(battleId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { voterHash, round, voteFor }: VoteRequest = req.body

    if (!voterHash || !round || !voteFor) {
      return res.status(400).json({ error: 'VoterHash, round, and voteFor are required' })
    }

    // Verify battle exists
    const battle = dataStore.getBattle(battleId)
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    // Check if battle is active
    if (battle.status !== 'live') {
      return res.status(400).json({ error: 'Battle is not active' })
    }

    // Validate round
    if (round < 1 || round > 3) {
      return res.status(400).json({ error: 'Round must be between 1 and 3' })
    }

    // Generate vote ID
    const voteId = Math.random().toString(36).substring(2, 15)

    const vote: Vote = {
      id: voteId,
      battleId,
      voterHash,
      round,
      voteFor,
      timestamp: Date.now(),
    }

    // Add vote to in-memory store
    const voteAdded = dataStore.addVote(vote)
    console.log(`[VOTE] Battle ${battleId} | Round ${round} | ${voteFor} | voterHash=${voterHash} | accepted=${voteAdded}`)

    if (!voteAdded) {
      return res.status(409).json({ error: 'You have already voted in this round' })
    }

    // Update battle timestamp to trigger polling detection
    dataStore.updateBattleQuiet(battleId, { timestamp: Date.now() })

    // Get updated vote tallies
    const roundTally = dataStore.getVoteTally(battleId, round)
    const totalTally = dataStore.getVoteTally(battleId)
    const audienceCount = dataStore.getAudienceCount(battleId)

    // Broadcast vote update to all connected clients (SSE)
    console.log(`[VOTE] Broadcasting update to battle ${battleId} — Human: ${roundTally.human}, AI: ${roundTally.ai}, Audience: ${audienceCount}`)
    dataStore.broadcastToBattle(battleId, {
      type: 'vote_update',
      round,
      roundTally,
      totalTally,
      audienceCount,
    })

    return res.status(201).json({
      success: true,
      vote,
      roundTally,
      totalTally,
      audienceCount,
    })
  } catch (error) {
    console.error('Error casting vote:', error)
    return res.status(500).json({ error: 'Failed to cast vote' })
  }
}

async function getVotes(battleId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { round } = req.query
    
    // Verify battle exists
    const battle = dataStore.getBattle(battleId)
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' })
    }

    const votes = dataStore.getVotes(battleId)
    
    let filteredVotes = votes
    if (round && typeof round === 'string') {
      const roundNumber = parseInt(round)
      filteredVotes = votes.filter(vote => vote.round === roundNumber)
    }

    // Calculate tallies
    const voteTallies: Record<number, { human: number; ai: number }> = {}
    const totalTally = { human: 0, ai: 0 }
    
    for (let r = 1; r <= 3; r++) {
      const roundTally = dataStore.getVoteTally(battleId, r)
      voteTallies[r] = roundTally
      totalTally.human += roundTally.human
      totalTally.ai += roundTally.ai
    }

    const audienceCount = dataStore.getAudienceCount(battleId)

    return res.status(200).json({
      success: true,
      votes: filteredVotes,
      voteTallies,
      totalTally,
      audienceCount,
      count: filteredVotes.length,
    })
  } catch (error) {
    console.error('Error fetching votes:', error)
    return res.status(500).json({ error: 'Failed to fetch votes' })
  }
}
