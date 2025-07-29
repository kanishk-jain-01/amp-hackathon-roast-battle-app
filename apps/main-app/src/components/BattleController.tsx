import { useEffect, useCallback, useState } from 'react'
import { useBattleStore } from '@/store/battleStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useConnectionStore } from '@/store/connectionStore'
import { generateBattleId } from '@roast-battle/ui'
import { Battle, Speaker } from '@roast-battle/ui'
import { apiService } from '@/lib/api'

interface BattleControllerProps {
  battleId?: string
  children: React.ReactNode
}

export function BattleController({ battleId, children }: BattleControllerProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const { battle, setBattle, setLoading, nextRound, setTurn, updateTimer, addRoast, updateVoteTally, setAudienceCount } = useBattleStore()
  const { topics, coinFlipResult, setCoinFlipResult, aiModel, voice } = useSettingsStore()
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

  // Real-time event handler
  const handleRealtimeUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'vote_update':
        updateVoteTally(data.round, data.roundTally)
        setAudienceCount(data.audienceCount)
        break
      case 'roast_ready':
        addRoast(data.roast)
        break
      case 'battle_updated':
        setBattle(data.battle)
        break
    }
  }, [updateVoteTally, setAudienceCount, addRoast, setBattle])

  // Start battle
  const startBattle = useCallback(async () => {
    if (!battle) return

    try {
      setLoading(true)
      
      // Create battle via API
      const createdBattle = await apiService.createBattle(topics, coinFlipResult)
      setBattle({
        ...createdBattle,
        status: 'live',
        timer: 60,
      })

      // Start real-time events
      const eventsource = apiService.connectToEvents(createdBattle.id, handleRealtimeUpdate)
      setEventSource(eventsource)
      setWSStatus('connected')
      
    } catch (error) {
      console.error('Failed to start battle:', error)
      setWSStatus('disconnected')
    } finally {
      setLoading(false)
    }
  }, [battle, topics, coinFlipResult, setBattle, setWSStatus, setLoading, handleRealtimeUpdate])

  // AI turn handler
  const handleAITurn = useCallback(async () => {
    if (!battle || battle.turn !== 'ai') return
    
    const currentTopic = battle.topics[battle.currentRound - 1]
    
    try {
      setLoading(true)
      const aiRoast = await apiService.generateAIRoast(battle.id, {
        topic: currentTopic,
        model: aiModel.id,
        voice: voice.id,
        round: battle.currentRound
      })
      
      addRoast(aiRoast)
      setTurn('human') // Switch to human
      updateTimer(60) // Reset timer
    } catch (error) {
      console.error('AI roast failed:', error)
      // Switch turns anyway to keep game moving
      setTurn('human')
      updateTimer(60)
    } finally {
      setLoading(false)
    }
  }, [battle, aiModel.id, voice.id, setLoading, addRoast, setTurn, updateTimer])

  // Timer logic
  useEffect(() => {
    if (!battle || battle.status !== 'live' || battle.timer <= 0) return

    const interval = setInterval(() => {
      updateTimer(battle.timer - 1)

      if (battle.timer <= 1) {
        // Auto-trigger AI turn when it's AI's turn and timer expires
        if (battle.turn === 'ai') {
          handleAITurn()
        } else {
          // Switch to AI turn
          setTurn('ai')
          updateTimer(60)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [battle, updateTimer, setTurn, handleAITurn])

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

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [eventSource])

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
  const { setLoading, nextRound, setTurn, updateTimer, setBattle, addRoast, updateVoteTally, setAudienceCount } = useBattleStore()
  const { topics, coinFlipResult, setCoinFlipResult, aiModel, voice } = useSettingsStore()
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

  const handleRealtimeUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'vote_update':
        updateVoteTally(data.round, data.roundTally)
        setAudienceCount(data.audienceCount)
        break
      case 'roast_ready':
        addRoast(data.roast)
        break
      case 'battle_updated':
        setBattle(data.battle)
        break
    }
  }, [updateVoteTally, setAudienceCount, addRoast, setBattle])

  const startBattle = useCallback(async () => {
    if (!battle) return

    try {
      setLoading(true)
      
      const createdBattle = await apiService.createBattle(topics, coinFlipResult)
      setBattle({
        ...createdBattle,
        status: 'live',
        timer: 60,
      })

      const eventSource = apiService.connectToEvents(createdBattle.id, handleRealtimeUpdate)
      setWSStatus('connected')
      
    } catch (error) {
      console.error('Failed to start battle:', error)
      setWSStatus('disconnected')
    } finally {
      setLoading(false)
    }
  }, [battle, topics, coinFlipResult, setBattle, setWSStatus, setLoading, handleRealtimeUpdate])

  const handleAITurn = useCallback(async () => {
    if (!battle || battle.turn !== 'ai') return
    
    const currentTopic = battle.topics[battle.currentRound - 1]
    
    try {
      setLoading(true)
      const aiRoast = await apiService.generateAIRoast(battle.id, {
        topic: currentTopic,
        model: aiModel.id,
        voice: voice.id,
        round: battle.currentRound
      })
      
      addRoast(aiRoast)
      setTurn('human')
      updateTimer(60)
    } catch (error) {
      console.error('AI roast failed:', error)
      setTurn('human')
      updateTimer(60)
    } finally {
      setLoading(false)
    }
  }, [battle, aiModel.id, voice.id, setLoading, addRoast, setTurn, updateTimer])

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
    handleAITurn,
  }
}
