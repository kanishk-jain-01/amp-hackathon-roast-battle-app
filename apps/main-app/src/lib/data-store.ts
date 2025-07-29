import { Battle, Roast, Vote, VoteTally } from '@roast-battle/ui'

// In-memory data store
class DataStore {
  private battles = new Map<string, Battle>()
  private roasts = new Map<string, Roast[]>() // battleId -> roasts
  private votes = new Map<string, Map<string, Vote>>() // battleId -> voterHash -> vote
  private connections = new Map<string, { battleId: string; timestamp: number }>() // socketId -> connection data

  // Battle operations
  createBattle(battle: Battle): Battle {
    this.battles.set(battle.id, battle)
    this.roasts.set(battle.id, [])
    this.votes.set(battle.id, new Map())
    return battle
  }

  getBattle(battleId: string): Battle | null {
    return this.battles.get(battleId) || null
  }

  updateBattle(battleId: string, updates: Partial<Battle>): Battle | null {
    const battle = this.battles.get(battleId)
    if (!battle) return null

    const updatedBattle = { ...battle, ...updates }
    this.battles.set(battleId, updatedBattle)
    return updatedBattle
  }

  deleteBattle(battleId: string): boolean {
    const deleted = this.battles.delete(battleId)
    if (deleted) {
      this.roasts.delete(battleId)
      this.votes.delete(battleId)
    }
    return deleted
  }

  getAllBattles(): Battle[] {
    return Array.from(this.battles.values())
  }

  // Roast operations
  addRoast(roast: Roast): Roast {
    const battleRoasts = this.roasts.get(roast.battleId) || []
    battleRoasts.push(roast)
    this.roasts.set(roast.battleId, battleRoasts)
    return roast
  }

  getRoasts(battleId: string): Roast[] {
    return this.roasts.get(battleId) || []
  }

  getRoastsByRound(battleId: string, round: number): Roast[] {
    const battleRoasts = this.roasts.get(battleId) || []
    return battleRoasts.filter(roast => roast.round === round)
  }

  // Vote operations
  addVote(vote: Vote): boolean {
    const battleVotes = this.votes.get(vote.battleId) || new Map()
    
    // Check if voter already voted in this round
    const existingVote = battleVotes.get(vote.voterHash)
    if (existingVote && existingVote.round === vote.round) {
      return false // Already voted this round
    }

    battleVotes.set(vote.voterHash, vote)
    this.votes.set(vote.battleId, battleVotes)
    return true
  }

  getVotes(battleId: string): Vote[] {
    const battleVotes = this.votes.get(battleId) || new Map()
    return Array.from(battleVotes.values())
  }

  getVoteTally(battleId: string, round?: number): VoteTally {
    const votes = this.getVotes(battleId)
    const filteredVotes = round ? votes.filter(v => v.round === round) : votes

    return filteredVotes.reduce(
      (tally, vote) => {
        if (vote.voteFor === 'human') {
          tally.human++
        } else {
          tally.ai++
        }
        return tally
      },
      { human: 0, ai: 0 }
    )
  }

  // Connection operations
  addConnection(socketId: string, battleId: string): void {
    this.connections.set(socketId, { battleId, timestamp: Date.now() })
  }

  removeConnection(socketId: string): void {
    this.connections.delete(socketId)
  }

  getAudienceCount(battleId: string): number {
    let count = 0
    const connections = Array.from(this.connections.values())
    for (const connection of connections) {
      if (connection.battleId === battleId) {
        count++
      }
    }
    return count
  }

  // Cleanup operations
  cleanup(): void {
    const now = Date.now()
    const HOUR = 60 * 60 * 1000

    // Remove battles older than 1 hour
    const battles = Array.from(this.battles.entries())
    for (const [battleId, battle] of battles) {
      if (now - battle.timestamp > HOUR) {
        this.deleteBattle(battleId)
      }
    }

    // Remove stale connections (older than 5 minutes)
    const FIVE_MINUTES = 5 * 60 * 1000
    const connections = Array.from(this.connections.entries())
    for (const [socketId, connection] of connections) {
      if (now - connection.timestamp > FIVE_MINUTES) {
        this.removeConnection(socketId)
      }
    }
  }
}

// Global singleton instance
export const dataStore = new DataStore()

// Cleanup every 10 minutes
setInterval(() => {
  dataStore.cleanup()
}, 10 * 60 * 1000)
