import { Speaker } from '@roast-battle/ui'
import { Trophy, Share2, RotateCcw } from 'lucide-react'

interface WinnerModalProps {
  isOpen: boolean
  winner: Speaker
  humanVotes: number
  aiVotes: number
  onClose: () => void
  onNewBattle: () => void
  onShare: () => void
}

export function WinnerModal({
  isOpen,
  winner,
  humanVotes,
  aiVotes,
  onClose,
  onNewBattle,
  onShare,
}: WinnerModalProps) {
  if (!isOpen) return null

  const totalVotes = humanVotes + aiVotes
  const winnerVotes = winner === 'human' ? humanVotes : aiVotes
  const winnerPercentage = totalVotes > 0 ? Math.round((winnerVotes / totalVotes) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-8 text-center max-w-lg w-full mx-4 border border-yellow-500/50">
        {/* Trophy Animation */}
        <div className="mb-6">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <div className="text-6xl mb-4">{winner === 'human' ? '🧑' : '🤖'}</div>
        </div>

        {/* Winner Announcement */}
        <h2 className="text-4xl font-bold text-yellow-400 mb-2">
          {winner === 'human' ? 'HUMAN WINS!' : 'AI WINS!'}
        </h2>

        <div className="text-xl text-white mb-6">
          {winner === 'human' ? 'Humanity prevails!' : 'The machines have won!'}
        </div>

        {/* Final Score */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Final Score</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div
              className={`p-4 rounded-lg ${
                winner === 'human' ? 'bg-blue-600/50 ring-2 ring-blue-400' : 'bg-gray-600/50'
              }`}
            >
              <div className="text-2xl font-bold text-white">{humanVotes}</div>
              <div className="text-sm text-gray-300">🧑 Human</div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                winner === 'ai' ? 'bg-red-600/50 ring-2 ring-red-400' : 'bg-gray-600/50'
              }`}
            >
              <div className="text-2xl font-bold text-white">{aiVotes}</div>
              <div className="text-sm text-gray-300">🤖 AI</div>
            </div>
          </div>

          <div className="text-yellow-400 font-bold">
            Winner by {winnerPercentage}% ({winnerVotes} out of {totalVotes} votes)
          </div>
        </div>

        {/* Battle Stats */}
        <div className="bg-white/5 backdrop-blur rounded-lg p-4 mb-6 text-sm text-gray-300">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="font-bold text-white">3</div>
              <div>Rounds</div>
            </div>
            <div>
              <div className="font-bold text-white">{totalVotes}</div>
              <div>Total Votes</div>
            </div>
            <div>
              <div className="font-bold text-white">🔥</div>
              <div>Epic Battle</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onShare}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Results</span>
          </button>

          <button
            onClick={onNewBattle}
            className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Battle</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-gray-400 hover:text-white transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}
