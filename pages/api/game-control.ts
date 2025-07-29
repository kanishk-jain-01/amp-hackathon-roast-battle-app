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
    const { action, data } = req.body;

    let gameState;
    let message = '';

    switch (action) {
      case 'start-round':
        if (!data?.topic) {
          return res.status(400).json({ message: 'Topic is required to start round' });
        }
        gameState = voteStore.startRound(data.topic);
        message = `Round ${gameState.currentRound} started with topic: ${data.topic}`;
        break;

      case 'set-human-roast':
        if (!data?.roast) {
          return res.status(400).json({ message: 'Roast text is required' });
        }
        gameState = voteStore.setHumanRoast(data.roast);
        message = 'Human roast set successfully';
        break;

      case 'open-voting':
        gameState = voteStore.openVoting();
        message = 'Voting is now open!';
        break;

      case 'close-voting':
        gameState = voteStore.closeVoting();
        message = 'Voting closed';
        break;

      case 'next-round':
        gameState = voteStore.nextRound();
        message = gameState.currentRound <= gameState.maxRounds 
          ? `Moved to round ${gameState.currentRound}` 
          : 'Game completed!';
        break;

      case 'reset-game':
        gameState = voteStore.resetGame();
        message = 'Game reset successfully';
        break;

      default:
        return res.status(400).json({ 
          message: 'Invalid action. Valid actions: start-round, set-human-roast, open-voting, close-voting, next-round, reset-game' 
        });
    }

    res.status(200).json({
      success: true,
      message,
      gameState,
      finalWinner: voteStore.getFinalWinner()
    });

  } catch (error: any) {
    console.error('Error handling game control:', error);
    
    res.status(500).json({ 
      message: 'Failed to handle game control action',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 