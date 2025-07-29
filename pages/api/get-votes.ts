import { NextApiRequest, NextApiResponse } from 'next';
import { voteStore } from '@/lib/voteStore';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get current game state and vote statistics
    const { gameState, voteStats } = voteStore.getVotes();
    const finalWinner = voteStore.getFinalWinner();

    res.status(200).json({
      success: true,
      gameState,
      voteStats,
      finalWinner,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('Error getting votes:', error);
    
    res.status(500).json({ 
      message: 'Failed to get vote data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 