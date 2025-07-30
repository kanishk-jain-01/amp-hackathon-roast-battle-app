import { Battle, Roast, Vote, VoteTally } from '@roast-battle/ui'
import { NextApiResponse } from 'next'

interface SSEConnection {
  battleId: string
  timestamp: number
  response: NextApiResponse
}

// In-memory data store
class DataStore {
  private battles = new Map<string, Battle>()
  private roasts = new Map<string, Roast[]>() // battleId -> roasts
  private votes = new Map<string, Map<string, Vote>>() // battleId -> voterHash -> vote
  private connections = new Map<string, SSEConnection>() // socketId -> connection data
  private timers = new Map<string, NodeJS.Timeout>() // battleId -> timer interval

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

    const updatedBattle = { 
      ...battle, 
      ...updates,
      timestamp: Date.now() // Update timestamp for polling detection
    }
    this.battles.set(battleId, updatedBattle)
    
    // Auto-start timer when battle goes live
    if (updates.status === 'live' && battle.status !== 'live') {
      this.startTimer(battleId)
    }
    
    // Auto-stop timer when battle ends
    if (updates.status === 'finished' && battle.status === 'live') {
      this.stopTimer(battleId)
    }
    
    // Broadcast battle update
    this.broadcastToBattle(battleId, {
      type: 'battle_updated',
      battle: updatedBattle,
      voteTallies: {
        1: this.getVoteTally(battleId, 1),
        2: this.getVoteTally(battleId, 2),
        3: this.getVoteTally(battleId, 3),
      },
      totalTally: this.getVoteTally(battleId),
      audienceCount: this.getAudienceCount(battleId),
    })
    
    return updatedBattle
  }

  // Update battle without triggering broadcasts (for timer updates)
  updateBattleQuiet(battleId: string, updates: Partial<Battle>): Battle | null {
    const battle = this.battles.get(battleId)
    if (!battle) return null

    const updatedBattle = { 
      ...battle, 
      ...updates,
      timestamp: Date.now() // Still update timestamp for polling
    }
    this.battles.set(battleId, updatedBattle)
    return updatedBattle
  }

  deleteBattle(battleId: string): boolean {
    const deleted = this.battles.delete(battleId)
    if (deleted) {
      this.roasts.delete(battleId)
      this.votes.delete(battleId)
      this.stopTimer(battleId)
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
  addConnection(socketId: string, battleId: string, response?: NextApiResponse): void {
    this.connections.set(socketId, { 
      battleId, 
      timestamp: Date.now(),
      response: response as NextApiResponse
    })
  }

  removeConnection(socketId: string): void {
    this.connections.delete(socketId)
  }

  getAudienceCount(battleId: string): number {
    let count = 0
    const connections = Array.from(this.connections.entries())
    const deadConnections: string[] = []
    
    for (const [socketId, connection] of connections) {
      if (connection.battleId === battleId) {
        // Check if the connection is still alive
        if (connection.response && !connection.response.destroyed && connection.response.writable) {
          count++
        } else {
          // Mark dead connection for cleanup
          deadConnections.push(socketId)
        }
      }
    }
    
    // Clean up dead connections
    deadConnections.forEach(socketId => this.removeConnection(socketId))
    
    return count
  }

  // Broadcasting
  broadcastToBattle(battleId: string, data: any): void {
    const connections = Array.from(this.connections.entries())
    const deadConnections: string[] = []
    const activeConnections = connections.filter(([_, conn]) => conn.battleId === battleId)
    
    console.log(`[BROADCAST] Sending ${data.type} to ${activeConnections.length} connections for battle ${battleId}`)
    
    for (const [socketId, connection] of connections) {
      if (connection.battleId === battleId && connection.response) {
        try {
          // Check if connection is still alive before writing
          if (!connection.response.destroyed && connection.response.writable) {
            console.log(`[BROADCAST] Writing to connection ${socketId}:`, data.type)
            connection.response.write(`data: ${JSON.stringify(data)}\n\n`)
          } else {
            deadConnections.push(socketId)
          }
        } catch (error) {
          console.error('Error broadcasting to connection:', socketId, error)
          // Mark connection as dead for cleanup
          deadConnections.push(socketId)
        }
      }
    }
    
    // Clean up dead connections
    deadConnections.forEach(socketId => this.removeConnection(socketId))
    
    if (deadConnections.length > 0) {
      console.log(`[BROADCAST] Cleaned up ${deadConnections.length} dead connections`)
    }
  }

  // Timer operations
  startTimer(battleId: string): void {
    this.stopTimer(battleId) // Clear any existing timer
    
    let tickCount = 0
    const timer = setInterval(() => {
      const battle = this.getBattle(battleId)
      if (!battle || battle.status !== 'live') {
        this.stopTimer(battleId)
        return
      }

      const newTimer = Math.max(0, battle.timer - 1)
      tickCount++
      
      if (newTimer === 0) {
        // Timer expired - handle turn logic
        if (battle.turn === 'human') {
          // Switch to AI turn
          this.updateBattle(battleId, { turn: 'ai', timer: 60 })
        } else {
          // AI turn expired - advance round or end battle
          if (battle.currentRound >= 3) {
            this.updateBattle(battleId, { status: 'finished' })
            this.stopTimer(battleId)
          } else {
            this.updateBattle(battleId, { 
              currentRound: battle.currentRound + 1, 
              turn: 'human', // Reset to human for new round
              timer: 60 
            })
          }
        }
      } else {
        // Just update timer (quietly)
        this.updateBattleQuiet(battleId, { timer: newTimer })
        
        // Broadcast timer updates every 5 seconds
        if (tickCount % 5 === 0) {
          this.broadcastToBattle(battleId, {
            type: 'timer_update',
            timer: newTimer,
            battleId
          })
        }
      }
    }, 1000)

    this.timers.set(battleId, timer)
  }

  stopTimer(battleId: string): void {
    const timer = this.timers.get(battleId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(battleId)
    }
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

// Reuse the same instance across Next.js API route hot reloads or in serverless
// environments where the module might be evaluated multiple times in the same
// process. This does NOT fix the limitation that memory is not shared across
// isolated serverless functions in production, but it prevents duplicate
// instances during development and within a single lambda container.
declare global {
  // eslint-disable-next-line no-var
  var __roastBattleDataStore__: DataStore | undefined
}

export const dataStore: DataStore = global.__roastBattleDataStore__ || (global.__roastBattleDataStore__ = new DataStore())

// Cleanup every 10 minutes
setInterval(() => {
  dataStore.cleanup()
}, 10 * 60 * 1000)
