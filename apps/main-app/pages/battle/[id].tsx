import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Settings, Play, RotateCcw } from 'lucide-react'
import { BattleController, useBattleController } from '@/components/BattleController'
import { StageLayout } from '@/components/StageLayout'
import { CoinFlipModal } from '@/components/CoinFlipModal'
import { WinnerModal } from '@/components/WinnerModal'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { useBattleStore } from '@/store/battleStore'
import { useSettingsStore } from '@/store/settingsStore'
import { generateBattleId } from '@roast-battle/ui'

export default function BattlePage() {
  const router = useRouter()
  const { id } = router.query
  const battleId = id as string

  const [showCoinFlip, setShowCoinFlip] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { battle, totalTally, winner } = useBattleStore()
  const { coinFlipResult, setCoinFlipResult } = useSettingsStore()
  const { performCoinFlip, startBattle, endBattle } = useBattleController()

  // Check if battle is ready to start
  const canStartBattle = battle && battle.status === 'pending' && coinFlipResult

  // Handle coin flip
  const handleCoinFlip = () => {
    setShowCoinFlip(true)
    performCoinFlip()
  }

  const handleCoinFlipResult = (result: 'human' | 'ai') => {
    setCoinFlipResult(result)
    setShowCoinFlip(false)
  }

  // Handle battle start
  const handleStartBattle = () => {
    if (canStartBattle) {
      startBattle()
    }
  }

  // Handle new battle
  const handleNewBattle = () => {
    const newBattleId = generateBattleId()
    // Clear previous coin flip so the new battle starts fresh
    setCoinFlipResult(undefined)
    router.push(`/battle/${newBattleId}`)
    setShowWinner(false)
  }

  // Handle share results
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Roast Battle Results',
        text: `${winner === 'human' ? 'Human' : 'AI'} won the roast battle! ${totalTally.human} vs ${totalTally.ai}`,
        url: window.location.href,
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Battle link copied to clipboard!')
    }
  }

  // Check for winner
  useEffect(() => {
    if (battle && battle.status === 'ended' && winner) {
      setShowWinner(true)
    }
  }, [battle, winner])

  if (!battleId) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>Roast Battle - {battleId}</title>
        <meta name="description" content="Live AI vs Human roast battle" />
      </Head>

      <BattleController battleId={battleId}>
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-4 right-4 z-40 bg-white/10 backdrop-blur rounded-full p-3 text-white hover:bg-white/20 transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>

        {/* Control Panel */}
        {battle && battle.status === 'pending' && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 flex items-center space-x-4">
              {!coinFlipResult ? (
                <button
                  onClick={handleCoinFlip}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>🪙</span>
                  <span>Flip Coin</span>
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-white">
                    First turn: {coinFlipResult === 'human' ? '🧑 Human' : '🤖 AI'}
                  </div>
                  <button
                    onClick={handleStartBattle}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Battle</span>
                  </button>
                  <button
                    onClick={handleCoinFlip}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Re-flip</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Stage */}
        <StageLayout battleId={battleId} />

        {/* Modals */}
        <CoinFlipModal
          isOpen={showCoinFlip}
          onResult={handleCoinFlipResult}
          onClose={() => setShowCoinFlip(false)}
        />

        <WinnerModal
          isOpen={showWinner}
          winner={winner || 'human'}
          humanVotes={totalTally.human}
          aiVotes={totalTally.ai}
          onClose={() => setShowWinner(false)}
          onNewBattle={handleNewBattle}
          onShare={handleShare}
        />

        <SettingsDrawer isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </BattleController>
    </>
  )
}
