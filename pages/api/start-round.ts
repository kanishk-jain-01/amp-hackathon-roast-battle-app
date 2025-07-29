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
        const { topic } = req.body;

        // Validate topic input
        if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
            return res.status(400).json({
                message: 'Topic is required and must be a non-empty string'
            });
        }

        // Topic length validation
        if (topic.trim().length > 100) {
            return res.status(400).json({
                message: 'Topic must be 100 characters or less'
            });
        }

        // Start the new round
        const gameState = voteStore.startRound(topic.trim());

        res.status(200).json({
            success: true,
            message: `Round ${gameState.currentRound} started with topic: ${topic.trim()}`,
            gameState,
            finalWinner: voteStore.getFinalWinner()
        });

    } catch (error: any) {
        console.error('Error starting round:', error);

        res.status(500).json({
            message: 'Failed to start round',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
