export type Speaker = 'human' | 'ai'

export type BattleStatus = 'pending' | 'live' | 'ended'

export interface Battle {
  id: string
  topics: string[]
  currentRound: number
  status: BattleStatus
  turn: Speaker
  timer: number
  coinFlipResult?: Speaker
  timestamp: number
}

export interface Roast {
  id: string
  battleId: string
  speaker: Speaker
  round: number
  text: string
  audioUrl?: string
  timestamp: number
}

export interface Vote {
  id: string
  battleId: string
  voterHash: string
  round: number
  voteFor: Speaker
  timestamp: number
}

export interface VoteTally {
  human: number
  ai: number
}

export interface BattleState {
  battle: Battle | null
  roasts: Roast[]
  voteTallies: Record<number, VoteTally>
  totalTally: VoteTally
  audienceCount: number
  winner?: Speaker
}

export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic'
}

export interface Voice {
  id: string
  name: string
  description?: string
}

export interface Settings {
  aiModel: AIModel
  voice: Voice
}

export interface WSMessage {
  type: 'vote_update' | 'roast_ready' | 'round_change' | 'battle_end' | 'audience_update'
  data: any
}
