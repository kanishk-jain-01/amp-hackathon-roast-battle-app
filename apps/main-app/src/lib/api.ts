import { Battle, Roast, Vote, VoteTally, Speaker } from '@roast-battle/ui'

class APIService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : 'http://localhost:3000'
  }

  // Battle operations
  async createBattle(topics: string[], coinFlipResult?: Speaker, battleId?: string): Promise<Battle> {
    const response = await fetch(`${this.baseUrl}/api/battle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: battleId, topics, coinFlipResult }),
    })

    if (!response.ok) {
      throw new Error('Failed to create battle')
    }

    const data = await response.json()
    return data.battle
  }

  async getBattle(battleId: string): Promise<Battle> {
    const response = await fetch(`${this.baseUrl}/api/battle/${battleId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch battle')
    }

    const data = await response.json()
    return data.battle
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

  // Real-time events - with polling fallback for dev server issues
  connectToEvents(battleId: string, onMessage: (data: any) => void): EventSource {
    const isDev = process.env.NODE_ENV === 'development'
    
    if (isDev) {
      // Use polling for development due to Next.js SSE limitations
      console.log('[API] Using polling fallback for development')
      return this.createPollingConnection(battleId, onMessage)
    }
    
    // Use SSE for production
    const eventSource = new EventSource(`${this.baseUrl}/api/battle/${battleId}/events`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[SSE Client] Received:', data.type, data)
        onMessage(data)
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
    }

    eventSource.onopen = () => {
      console.log('[SSE Client] Connection opened for battle:', battleId)
    }

    return eventSource
  }

  // Polling-based connection for development
  private createPollingConnection(battleId: string, onMessage: (data: any) => void): EventSource {
    let lastUpdateTime = 0
    let lastVoteCount = 0
    let pollInterval: NodeJS.Timeout
    
    // Create a mock EventSource for API compatibility
    const mockEventSource = {
      close: () => {
        if (pollInterval) {
          clearInterval(pollInterval)
        }
      },
      readyState: 1, // OPEN
      url: `${this.baseUrl}/api/battle/${battleId}`,
      withCredentials: false,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2,
      onopen: null,
      onmessage: null,
      onerror: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    } as EventSource

    const poll = async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/battle/${battleId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Send initial data on first poll
          if (lastUpdateTime === 0) {
            onMessage({
              type: 'initial',
              battle: data.battle,
              roasts: data.roasts || [],
              voteTallies: data.voteTallies || {},
              totalTally: data.totalTally || { human: 0, ai: 0 },
              audienceCount: data.audienceCount || 0
            })
            lastUpdateTime = data.battle?.timestamp || Date.now()
            lastVoteCount = (data.totalTally?.human || 0) + (data.totalTally?.ai || 0)
          } else {
            // Check for any changes
            const currentTime = data.battle?.timestamp || Date.now()
            const currentVoteCount = (data.totalTally?.human || 0) + (data.totalTally?.ai || 0)
            const hasVoteChanges = currentVoteCount !== lastVoteCount
            const hasTimeChanges = currentTime > lastUpdateTime
            
            if (hasVoteChanges || hasTimeChanges) {
              console.log('[Polling] Detected changes - votes:', hasVoteChanges, 'time:', hasTimeChanges)
              
              if (hasVoteChanges) {
                // Send vote update
                onMessage({
                  type: 'vote_update',
                  voteTallies: data.voteTallies || {},
                  totalTally: data.totalTally || { human: 0, ai: 0 },
                  audienceCount: data.audienceCount || 0
                })
              }
              
              // Send battle update
              onMessage({
                type: 'battle_updated',
                battle: data.battle,
                voteTallies: data.voteTallies,
                totalTally: data.totalTally,
                audienceCount: data.audienceCount
              })
              
              lastUpdateTime = currentTime
              lastVoteCount = currentVoteCount
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Start polling immediately and then every 1 second for responsive updates
    poll()
    pollInterval = setInterval(poll, 1000)

    console.log('[Polling] Started polling for battle:', battleId)
    
    return mockEventSource
  }
}

export const apiService = new APIService()
