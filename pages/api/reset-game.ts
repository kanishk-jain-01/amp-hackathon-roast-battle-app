import { NextApiRequest, NextApiResponse } from 'next';
import { voteStore } from '@/lib/voteStore';

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Reset the entire game state
        const gameState = voteStore.resetGame();

        res.status(200).json({
            success: true,
            message: 'Game reset successfully - ready for a new battle!',
            gameState,
            finalWinner: null // Always null after reset
        });

    } catch (error: any) {
        console.error('Error resetting game:', error);

        res.status(500).json({
            message: 'Failed to reset game',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
