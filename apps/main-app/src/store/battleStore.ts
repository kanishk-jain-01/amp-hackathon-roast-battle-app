import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Battle, Roast, VoteTally, Speaker } from '@roast-battle/ui'

interface BattleState {
  battle: Battle | null
  roasts: Roast[]
  voteTallies: Record<number, VoteTally>
  totalTally: VoteTally
  audienceCount: number
  winner?: Speaker
  isLoading: boolean
}

interface BattleActions {
  setBattle: (battle: Battle) => void
  addRoast: (roast: Roast) => void
  updateVoteTally: (round: number, tally: VoteTally) => void
  setAudienceCount: (count: number) => void
  nextRound: () => void
  setTurn: (speaker: Speaker) => void
  updateTimer: (seconds: number) => void
  setWinner: (speaker: Speaker) => void
  resetBattle: () => void
  setLoading: (loading: boolean) => void
}

const initialState: BattleState = {
  battle: null,
  roasts: [],
  voteTallies: {},
  totalTally: { human: 0, ai: 0 },
  audienceCount: 0,
  isLoading: false,
}

export const useBattleStore = create<BattleState & BattleActions>()(
  immer((set, get) => ({
    ...initialState,

    setBattle: battle =>
      set(state => {
        state.battle = battle
      }),

    addRoast: roast =>
      set(state => {
        state.roasts.push(roast)
      }),

    updateVoteTally: (round, tally) =>
      set(state => {
        state.voteTallies[round] = tally
        // Recalculate total with null checks
        state.totalTally = Object.values(state.voteTallies).reduce(
          (total, roundTally) => {
            // Handle undefined or null roundTally
            if (!roundTally) return total
            
            return {
              human: total.human + (roundTally.human || 0),
              ai: total.ai + (roundTally.ai || 0),
            }
          },
          { human: 0, ai: 0 }
        )
      }),

    setAudienceCount: count =>
      set(state => {
        state.audienceCount = count
      }),

    nextRound: () =>
      set(state => {
        if (state.battle) {
          state.battle.currentRound += 1
          state.battle.timer = 0
        }
      }),

    setTurn: speaker =>
      set(state => {
        if (state.battle) {
          state.battle.turn = speaker
        }
      }),

    updateTimer: seconds =>
      set(state => {
        if (state.battle) {
          state.battle.timer = seconds
        }
      }),

    setWinner: speaker =>
      set(state => {
        state.winner = speaker
      }),

    setLoading: loading =>
      set(state => {
        state.isLoading = loading
      }),

    resetBattle: () => set(() => ({ ...initialState })),
  }))
)
