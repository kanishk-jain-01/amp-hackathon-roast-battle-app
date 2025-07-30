import { useEffect, useCallback, useState, useRef } from 'react'
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

  // Use ref to maintain stable callback reference
  const handleRealtimeUpdateRef = useRef<(data: any) => void>()

  // Real-time event handler
  const handleRealtimeUpdate = useCallback((data: any) => {
    console.log('[BattleController] Processing SSE message:', data.type, data)
    switch (data.type) {
      case 'initial':
      case 'battle_updated':
        console.log('[BattleController] Updating battle state:', data.battle)
        setBattle(data.battle)
        // Update vote tallies for all rounds
        if (data.voteTallies) {
          Object.entries(data.voteTallies).forEach(([round, tally]) => {
            updateVoteTally(parseInt(round), tally as any)
          })
        }
        if (data.audienceCount !== undefined) {
          setAudienceCount(data.audienceCount)
        }
        break
      case 'vote_update':
        console.log('📈 Vote update received:', data)
        // Update all round tallies from the received data
        if (data.voteTallies) {
          Object.entries(data.voteTallies).forEach(([round, tally]) => {
            if (tally) { // Only update if tally exists
              updateVoteTally(parseInt(round), tally as any)
            }
          })
        }
        setAudienceCount(data.audienceCount || 0)
        break
      case 'timer_update':
        console.log('⏰ Timer update received:', data.timer)
        updateTimer(data.timer)
        break
      case 'roast_ready':
        addRoast(data.roast)
        break
      case 'heartbeat':
        // Keep connection alive
        break
      case 'test':
        console.log('🧪 Test message received:', data.message)
        break
      default:
        console.warn('[BattleController] Unknown SSE message type:', data.type)
    }
  }, [updateVoteTally, setAudienceCount, addRoast, setBattle, updateTimer])

  // Update ref when callback changes
  useEffect(() => {
    handleRealtimeUpdateRef.current = handleRealtimeUpdate
  }, [handleRealtimeUpdate])

  // Initialize battle
  const initializeBattle = useCallback(async () => {
    console.log('🟡 initializeBattle called:', { battleId, isInitialized, topics: topics.length })
    if (!battleId || isInitialized) return

    try {
      // First try to fetch existing battle from server
      console.log('🔍 Trying to fetch existing battle:', battleId)
      const existingBattle = await apiService.getBattle(battleId)
      console.log('✅ Found existing battle:', existingBattle)
      setBattle(existingBattle)
      setIsInitialized(true)
      return
    } catch (error) {
      // Battle doesn't exist, create it
      console.log('❌ Battle not found, creating new battle...', error)
    }

    try {
      // Use default topics if none selected
      const battleTopics = topics.length === 3 ? topics : ['New York City', 'Gen Z', 'Social Media Influencers']
      console.log('🔨 Creating battle with topics:', battleTopics)
      
      // Create battle on server with specific ID
      const newBattle = await apiService.createBattle(battleTopics, coinFlipResult, battleId)
      console.log('✅ Created battle:', newBattle)
      setBattle(newBattle)
      setIsInitialized(true)
    } catch (error) {
      console.error('💥 Failed to create battle:', error)
      // Fallback to local state only
      const battleTopics = topics.length === 3 ? topics : ['New York City', 'Gen Z', 'Social Media Influencers']
      const newBattle: Battle = {
        id: battleId,
        topics: battleTopics,
        currentRound: 1,
        status: 'pending',
        turn: coinFlipResult || 'human',
        timer: 0,
        coinFlipResult,
        timestamp: Date.now(),
      }
      console.log('🚨 Using fallback battle:', newBattle)
      setBattle(newBattle)
      setIsInitialized(true)
    }
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
  const startBattle = useCallback(async () => {
    console.log('🚀 startBattle called:', { battle: battle?.id, status: battle?.status })
    if (!battle) {
      console.log('❌ No battle to start!')
      return
    }

    try {
      setLoading(true)
      console.log('⚡ Updating battle to live status:', battle.id)
      
      // Update existing battle to live status
      const updatedBattle = await apiService.updateBattle(battle.id, {
        status: 'live',
        timer: 60,
      })
      console.log('✅ Battle updated:', updatedBattle)
      setBattle(updatedBattle)

      // Start real-time events
      console.log('🔌 Connecting to events:', battle.id)
      const stableHandler = (data: any) => {
        if (handleRealtimeUpdateRef.current) {
          handleRealtimeUpdateRef.current(data)
        }
      }
      const eventsource = apiService.connectToEvents(battle.id, stableHandler)
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
      // Server handles timer and turn switching automatically
    } catch (error) {
      console.error('AI roast failed:', error)
      // Server will handle turn switching after timeout
    } finally {
      setLoading(false)
    }
  }, [battle, aiModel.id, voice.id, setLoading, addRoast])

  // Server-side timer handles timing automatically
  // AI turn trigger based on server state
  useEffect(() => {
    if (battle?.turn === 'ai' && battle?.timer === 60) {
      // Server just switched to AI turn, trigger AI roast
      handleAITurn()
    }
  }, [battle?.turn, battle?.timer, handleAITurn])

  // Server handles round progression automatically
  // End battle logic
  const endBattle = useCallback(() => {
    if (!battle) return

    setBattle({
      ...battle,
      status: 'finished',
      timer: 0,
    })
  }, [battle, setBattle])

  // Auto-initialize on mount
  useEffect(() => {
    if (battleId && !isInitialized) {
      initializeBattle().catch(console.error)
    }
  }, [battleId, initializeBattle, isInitialized])

  // Ensure we stay subscribed to live battle updates (handles page refresh & dropped connections)
  useEffect(() => {
    if (battle && battle.status === 'live' && !eventSource) {
      console.log('[BattleController] Establishing SSE connection for live battle:', battle.id)
      try {
        // Create wrapper function that uses the ref
        const stableHandler = (data: any) => {
          if (handleRealtimeUpdateRef.current) {
            handleRealtimeUpdateRef.current(data)
          }
        }
        
        const es = apiService.connectToEvents(battle.id, stableHandler)
        setEventSource(es)
        setWSStatus('connected')
      } catch (err) {
        console.error('Failed to establish SSE connection:', err)
        setWSStatus('error')
      }
    }
  }, [battle?.id, battle?.status, eventSource, setWSStatus])

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
      case 'initial':
      case 'battle_updated':
        setBattle(data.battle)
        // Update vote tallies for all rounds
        if (data.voteTallies) {
          Object.entries(data.voteTallies).forEach(([round, tally]) => {
            updateVoteTally(parseInt(round), tally as any)
          })
        }
        if (data.audienceCount !== undefined) {
          setAudienceCount(data.audienceCount)
        }
        break
      case 'vote_update':
        console.log('📈 Vote update received:', data)
        // Update all round tallies from the received data
        if (data.voteTallies) {
          Object.entries(data.voteTallies).forEach(([round, tally]) => {
            if (tally) { // Only update if tally exists
              updateVoteTally(parseInt(round), tally as any)
            }
          })
        }
        setAudienceCount(data.audienceCount || 0)
        break
      case 'timer_update':
        updateTimer(data.timer)
        break
      case 'roast_ready':
        addRoast(data.roast)
        break
      case 'heartbeat':
        // Keep connection alive
        break
    }
  }, [updateVoteTally, setAudienceCount, addRoast, setBattle, updateTimer])

  const startBattle = useCallback(async () => {
    if (!battle) return

    try {
      setLoading(true)
      
      // Update existing battle to live status
      const updatedBattle = await apiService.updateBattle(battle.id, {
        status: 'live',
        timer: 60,
      })
      setBattle(updatedBattle)

      const eventSource = apiService.connectToEvents(battle.id, handleRealtimeUpdate)
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
      // Server handles timer and turn switching automatically
    } catch (error) {
      console.error('AI roast failed:', error)
      // Server will handle turn switching after timeout
    } finally {
      setLoading(false)
    }
  }, [battle, aiModel.id, voice.id, setLoading, addRoast])

  // Server handles round progression automatically

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
    endBattle,
    handleAITurn,
  }
}
