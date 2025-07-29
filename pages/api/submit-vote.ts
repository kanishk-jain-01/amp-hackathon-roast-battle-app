import { NextApiRequest, NextApiResponse } from 'next';
import { voteStore } from '@/lib/voteStore';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { vote } = req.body;

    // Validate vote input
    if (!vote || (vote !== 'human' && vote !== 'ai')) {
      return res.status(400).json({ 
        message: 'Invalid vote. Must be either "human" or "ai"' 
      });
    }

    // Submit the vote
    const isAI = vote === 'ai';
    const gameState = voteStore.submitVote(isAI);
    const { voteStats } = voteStore.getVotes();

    // Return success response with updated game state
    res.status(200).json({
      success: true,
      message: 'Vote submitted successfully!',
      gameState,
      voteStats
    });

  } catch (error: any) {
    console.error('Error submitting vote:', error);
    
    res.status(500).json({ 
      message: 'Failed to submit vote',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 