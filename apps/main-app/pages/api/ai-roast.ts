import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

// Mock response for development when API keys aren't available
const MOCK_ROASTS = [
  "This topic is so painfully boring, it makes watching paint dry seem like a Marvel movie marathon. I've seen more excitement at a tax seminar, and at least those people are getting paid to suffer through it. This is the kind of topic that makes people fake emergencies just to leave the conversation.",
  "I've seen more depth in a puddle after a light drizzle and more personality in a Windows 95 error message. This topic has the same energy as that one friend who still thinks Minion memes are peak comedy - technically present but actively making everything worse.",
  "This topic has the same energy as a grocery store self-checkout that never works, but somehow it's even more frustrating because at least the self-checkout eventually calls for help. This thing just sits there being aggressively mediocre while everyone pretends it's worth discussing.",
  "If this topic was a person, it would be the guy who still uses Internet Explorer, thinks NFTs are coming back, and unironically says 'that's what she said' in 2024. It's not just outdated - it's actively embarrassing to be associated with.",
  "This topic is like a participation trophy that nobody even bothered to engrave properly. It's technically an achievement, but it's the kind that makes your parents lie to their friends about what you're doing with your life. Even Wikipedia would mark this as 'citation needed.'",
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

  const systemPrompt = `You are a Kill Tony style roast comedian - sharp, quick-witted, and absolutely ruthless but clever. Your job is to absolutely demolish the given topic with surgical precision and dark humor.

Rules:
- Channel the energy of Kill Tony roasters - edgy but not overly crude
- Be brutally honest and hilariously savage, but clever above all
- Focus entirely on roasting the topic to smithereens
- Make it lengthy, elaborate, and devastating (3-5 sentences, really build the roast)
- Use modern references, pop culture, and relatable comparisons
- Think like you're performing at the Comedy Store for comics who've heard everything
- DO NOT use em dashes (—) in your response
- Avoid repeating previous roasts - be fresh and original

Previous roasts to avoid repeating: ${previousRoasts.join(', ')}`

  const userPrompt = `Absolutely destroy this topic with a savage roast: ${topic}`

  const completion = await openai.chat.completions.create({
    model: model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 300,
    temperature: 0.9,
  })

  return completion.choices[0]?.message?.content?.trim() || 'This topic is so bad, even AI refuses to waste compute cycles on it.'
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
      max_tokens: 300,
      temperature: 0.9,
      messages: [{
        role: 'user',
        content: `You are a Kill Tony style roast comedian - savage, quick-witted, and absolutely merciless. Completely obliterate this topic: ${topic}. 
        
        Be brutally funny and devastating but clever (3-5 sentences, really elaborate and build the destruction). Channel that Comedy Store energy where comics destroy everything.
        
        DO NOT use em dashes (—) in your response.
        
        Previous roasts to avoid: ${previousRoasts.join(', ')}`
      }]
    })
  })

  const data = await response.json()
  return data.content?.[0]?.text || 'This topic broke Claude so hard it went into therapy.'
}
