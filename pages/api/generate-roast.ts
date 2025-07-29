import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { voteStore } from '@/lib/voteStore';
import { createRoastPrompt, createThemedRoastPrompt } from '@/utils/gptPrompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { topic, theme } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ message: 'Topic is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    // Create the appropriate prompt based on whether theme is provided
    const prompt = theme 
      ? createThemedRoastPrompt(topic, theme)
      : createRoastPrompt(topic);

    // Generate roast using GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional roast comedian. Create funny, clever roasts that would get laughs from a live audience. Keep them clean and focus on being witty rather than mean."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.9, // High creativity
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const aiRoast = completion.choices[0]?.message?.content?.trim();

    if (!aiRoast) {
      return res.status(500).json({ message: 'Failed to generate roast' });
    }

    // Update the vote store with the AI roast
    const gameState = voteStore.setAIRoast(aiRoast);

    res.status(200).json({
      success: true,
      roast: aiRoast,
      gameState
    });

  } catch (error: any) {
    console.error('Error generating roast:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        message: 'OpenAI quota exceeded. Please check your billing.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        message: 'Invalid OpenAI API key' 
      });
    }

    res.status(500).json({ 
      message: 'Failed to generate roast',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 