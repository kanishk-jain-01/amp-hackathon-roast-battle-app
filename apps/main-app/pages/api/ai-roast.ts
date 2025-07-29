import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

// Mock response for development when API keys aren't available
const MOCK_ROASTS = [
  "Well, well, well... if it isn't the topic that thinks it's more relevant than it actually is!",
  "I've seen more personality in a Windows error message than in this topic right here.",
  "This topic is like a participation trophy - everyone gets one, but nobody really wants it.",
  "If this topic was a movie, it would be straight to DVD... in the bargain bin.",
  "I'd roast this topic harder, but I don't want to waste good material on something so basic.",
  "This topic has the same energy as elevator music - technically present but nobody's paying attention.",
  "I've met houseplants with more depth than this topic we're discussing today.",
]

interface RoastRequest {
  topic: string
  model: string
  previousRoasts?: string[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { topic, model, previousRoasts = [] }: RoastRequest = req.body

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' })
    }

    // Check if API key is available
    const openaiKey = process.env.OPENAI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!openaiKey && !anthropicKey) {
      // Return mock response for development
      const mockRoast = MOCK_ROASTS[Math.floor(Math.random() * MOCK_ROASTS.length)]
      return res.status(200).json({
        roast: mockRoast,
        model: 'mock-ai',
        topic,
        timestamp: Date.now(),
      })
    }

    let roast: string

    if (model.startsWith('gpt') && openaiKey) {
      roast = await generateOpenAIRoast(topic, model, previousRoasts, openaiKey)
    } else if (model.startsWith('claude') && anthropicKey) {
      roast = await generateAnthropicRoast(topic, model, previousRoasts, anthropicKey)
    } else {
      // Fallback to mock
      roast = MOCK_ROASTS[Math.floor(Math.random() * MOCK_ROASTS.length)]
    }

    return res.status(200).json({
      roast,
      model,
      topic,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Error generating roast:', error)
    
    // Fallback to mock roast on error
    const mockRoast = MOCK_ROASTS[Math.floor(Math.random() * MOCK_ROASTS.length)]
    return res.status(200).json({
      roast: mockRoast,
      model: 'fallback-ai',
      topic: req.body.topic,
      timestamp: Date.now(),
    })
  }
}

async function generateOpenAIRoast(
  topic: string,
  model: string,
  previousRoasts: string[],
  apiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey })

  const systemPrompt = `You are a professional roast comedian performing in a comedy battle. Your job is to create witty, clever, and entertaining roasts about the given topic. 

Rules:
- Keep it PG-13 appropriate 
- Be clever and witty, not mean-spirited
- Focus on the topic, not individuals
- Make it punchy and quotable (2-3 sentences max)
- Avoid repeating previous roasts
- Channel the energy of Comedy Central Roasts

Previous roasts to avoid repeating: ${previousRoasts.join(', ')}`

  const userPrompt = `Create a hilarious roast about: ${topic}`

  const completion = await openai.chat.completions.create({
    model: model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 150,
    temperature: 0.9,
  })

  return completion.choices[0]?.message?.content?.trim() || 'I got nothing... which says a lot about this topic.'
}

async function generateAnthropicRoast(
  topic: string,
  model: string,
  previousRoasts: string[],
  apiKey: string
): Promise<string> {
  // Note: You'd need to install @anthropic-ai/sdk for this to work
  // For now, return a placeholder since we don't have the SDK installed
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model.includes('opus') ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229',
      max_tokens: 150,
      temperature: 0.9,
      messages: [{
        role: 'user',
        content: `You are a professional roast comedian. Create a witty, PG-13 roast about: ${topic}. 
        
        Keep it clever and entertaining (2-3 sentences max). 
        
        Previous roasts to avoid: ${previousRoasts.join(', ')}`
      }]
    })
  })

  const data = await response.json()
  return data.content?.[0]?.text || 'Even Claude is speechless about this topic.'
}
