import { Battle, Roast, Vote, VoteTally, Speaker } from '@roast-battle/ui'

class APIService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : 'http://localhost:3003'
  }

  // Battle operations
  async createBattle(topics: string[], coinFlipResult?: Speaker): Promise<Battle> {
    const response = await fetch(`${this.baseUrl}/api/battle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics, coinFlipResult }),
    })

    if (!response.ok) {
      throw new Error('Failed to create battle')
    }

    const data = await response.json()
    return data.battle
  }

  async getBattle(battleId: string) {
    const response = await fetch(`${this.baseUrl}/api/battle/${battleId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch battle')
    }

    return response.json()
  }

  async updateBattle(battleId: string, updates: Partial<Battle>): Promise<Battle> {
    const response = await fetch(`${this.baseUrl}/api/battle/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update battle')
    }

    const data = await response.json()
    return data.battle
  }

  // Roast operations
  async createRoast(battleId: string, roast: {
    speaker: Speaker
    round: number
    text: string
    audioUrl?: string
  }): Promise<Roast> {
    const response = await fetch(`${this.baseUrl}/api/battle/${battleId}/roasts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roast),
    })

    if (!response.ok) {
      throw new Error('Failed to create roast')
    }

    const data = await response.json()
    return data.roast
  }

  async generateAIRoast(battleId: string, {
    topic,
    model,
    voice,
    round,
  }: {
    topic: string
    model: string
    voice: string
    round: number
  }): Promise<Roast> {
    const response = await fetch(`${this.baseUrl}/api/battle/${battleId}/ai-roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, model, voice, round }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate AI roast')
    }

    const data = await response.json()
    return data.roast
  }

  // Voting operations
  async castVote(battleId: string, vote: {
    voterHash: string
    round: number
    voteFor: Speaker
  }) {
    const response = await fetch(`${this.baseUrl}/api/battle/${battleId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vote),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cast vote')
    }

    return response.json()
  }

  async getVotes(battleId: string, round?: number) {
    const url = round 
      ? `${this.baseUrl}/api/battle/${battleId}/vote?round=${round}`
      : `${this.baseUrl}/api/battle/${battleId}/vote`
    
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch votes')
    }

    return response.json()
  }

  // AI services
  async generateRoast(topic: string, model: string, previousRoasts?: string[]) {
    const response = await fetch(`${this.baseUrl}/api/ai-roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, model, previousRoasts }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate roast')
    }

    return response.json()
  }

  async generateSpeech(text: string, voiceId: string) {
    const response = await fetch(`${this.baseUrl}/api/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate speech')
    }

    return response.json()
  }

  async getVoices() {
    const response = await fetch(`${this.baseUrl}/api/voices`)

    if (!response.ok) {
      throw new Error('Failed to fetch voices')
    }

    return response.json()
  }

  // Real-time events
  connectToEvents(battleId: string, onMessage: (data: any) => void): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/api/battle/${battleId}/events`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
    }

    return eventSource
  }
}

export const apiService = new APIService()
