import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@radix-ui/react-dialog'
import { Speaker } from '@roast-battle/ui'

interface CoinFlipModalProps {
  isOpen: boolean
  onResult: (result: Speaker) => void
  onClose: () => void
}

export function CoinFlipModal({ isOpen, onResult, onClose }: CoinFlipModalProps) {
  const [isFlipping, setIsFlipping] = useState(false)
  const [result, setResult] = useState<Speaker | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (isOpen && !isFlipping) {
      startCoinFlip()
    }
  }, [isOpen])

  const startCoinFlip = () => {
    setIsFlipping(true)
    setResult(null)
    setShowResult(false)

    // Simulate coin flip
    setTimeout(() => {
      const flipResult: Speaker = Math.random() > 0.5 ? 'human' : 'ai'
      setResult(flipResult)
      setIsFlipping(false)
      setShowResult(true)

      // Auto close after showing result
      setTimeout(() => {
        onResult(flipResult)
        onClose()
      }, 2000)
    }, 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur rounded-lg p-8 text-center max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-white mb-8">Who Goes First?</h2>

        <div className="mb-8">
          {isFlipping ? (
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl animate-coin-flip">
                🪙
              </div>
              <div className="mt-4 text-white text-lg">Flipping...</div>
            </div>
          ) : showResult ? (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-6xl">
                {result === 'human' ? '🧑' : '🤖'}
              </div>
              <div className="text-2xl font-bold text-white">
                {result === 'human' ? 'HUMAN GOES FIRST!' : 'AI GOES FIRST!'}
              </div>
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-6xl">
              🪙
            </div>
          )}
        </div>

        {!isFlipping && !showResult && (
          <button
            onClick={startCoinFlip}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Flip Coin
          </button>
        )}

        {isFlipping && <div className="text-gray-300">The coin is spinning through the air...</div>}
      </div>
    </div>
  )
}
