import { useEffect, useCallback, useState } from 'react'
import { useBattleStore } from '@/store/battleStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useConnectionStore } from '@/store/connectionStore'
import { generateBattleId } from '@roast-battle/ui'
import { Battle, Speaker } from '@roast-battle/ui'

interface BattleControllerProps {
  battleId?: string
  children: React.ReactNode
}

export function BattleController({ battleId, children }: BattleControllerProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const { battle, setBattle, setLoading, nextRound, setTurn, updateTimer } = useBattleStore()
  const { topics, coinFlipResult, setCoinFlipResult } = useSettingsStore()
  const { setWSStatus } = useConnectionStore()

  // Initialize battle
  const initializeBattle = useCallback(() => {
    if (!battleId || isInitialized) return

    const newBattle: Battle = {
      id: battleId,
      topics: topics,
      currentRound: 1,
      status: 'pending',
      turn: coinFlipResult || 'human',
      timer: 0,
      coinFlipResult,
      timestamp: Date.now(),
    }

    setBattle(newBattle)
    setIsInitialized(true)
  }, [battleId, topics, coinFlipResult, setBattle, isInitialized])

  // Coin flip logic
  const performCoinFlip = useCallback(() => {
    setLoading(true)

    // Simulate coin flip animation delay
    setTimeout(() => {
      const result: Speaker = Math.random() > 0.5 ? 'human' : 'ai'
      setCoinFlipResult(result)
      setTurn(result)
      setLoading(false)
    }, 3000) // 3 second animation
  }, [setCoinFlipResult, setTurn, setLoading])

  // Start battle
  const startBattle = useCallback(() => {
    if (!battle) return

    setBattle({
      ...battle,
      status: 'live',
      timer: 60, // 60 seconds per turn
    })
    setWSStatus('connected') // Mock connection
  }, [battle, setBattle, setWSStatus])

  // Timer logic
  useEffect(() => {
    if (!battle || battle.status !== 'live' || battle.timer <= 0) return

    const interval = setInterval(() => {
      updateTimer(battle.timer - 1)

      if (battle.timer <= 1) {
        // Switch turns when timer expires
        const nextSpeaker: Speaker = battle.turn === 'human' ? 'ai' : 'human'
        setTurn(nextSpeaker)
        updateTimer(60) // Reset timer
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [battle, updateTimer, setTurn])

  // Round progression logic
  const advanceRound = useCallback(() => {
    if (!battle || battle.currentRound >= 3) return

    nextRound()
    setTurn(coinFlipResult || 'human') // Reset to coin flip winner
    updateTimer(60)
  }, [battle, nextRound, setTurn, coinFlipResult, updateTimer])

  // End battle logic
  const endBattle = useCallback(() => {
    if (!battle) return

    setBattle({
      ...battle,
      status: 'ended',
      timer: 0,
    })
  }, [battle, setBattle])

  // Auto-initialize on mount
  useEffect(() => {
    if (battleId && !isInitialized) {
      initializeBattle()
    }
  }, [battleId, initializeBattle, isInitialized])

  // Expose controller methods through context or props
  const controllerMethods = {
    initializeBattle,
    performCoinFlip,
    startBattle,
    advanceRound,
    endBattle,
    isInitialized,
  }

  return (
    <div data-testid="battle-controller">
      {children}
      {/* Pass controller methods to children through context if needed */}
    </div>
  )
}

// Custom hook to access battle controller methods
export function useBattleController() {
  const battle = useBattleStore(state => state.battle)
  const { setLoading, nextRound, setTurn, updateTimer, setBattle } = useBattleStore()
  const { coinFlipResult, setCoinFlipResult } = useSettingsStore()
  const { setWSStatus } = useConnectionStore()

  const performCoinFlip = useCallback(() => {
    setLoading(true)

    setTimeout(() => {
      const result: Speaker = Math.random() > 0.5 ? 'human' : 'ai'
      setCoinFlipResult(result)
      setTurn(result)
      setLoading(false)
    }, 3000)
  }, [setCoinFlipResult, setTurn, setLoading])

  const startBattle = useCallback(() => {
    if (!battle) return

    setBattle({
      ...battle,
      status: 'live',
      timer: 60,
    })
    setWSStatus('connected')
  }, [battle, setBattle, setWSStatus])

  const advanceRound = useCallback(() => {
    if (!battle || battle.currentRound >= 3) return

    nextRound()
    setTurn(coinFlipResult || 'human')
    updateTimer(60)
  }, [battle, nextRound, setTurn, coinFlipResult, updateTimer])

  const endBattle = useCallback(() => {
    if (!battle) return

    setBattle({
      ...battle,
      status: 'ended',
      timer: 0,
    })
  }, [battle, setBattle])

  return {
    performCoinFlip,
    startBattle,
    advanceRound,
    endBattle,
  }
}
