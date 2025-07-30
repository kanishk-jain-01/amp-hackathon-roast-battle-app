import { useBattleStore } from '@/store/battleStore'
import { useConnectionStore } from '@/store/connectionStore'
import { formatTimer } from '@roast-battle/ui'
import { TopicStepper } from './TopicStepper'
import { VoteBar } from './VoteBar'
import { RoastCard } from './RoastCard'
import { QRDisplay } from './QRDisplay'
import { useEffect } from 'react'

interface StageLayoutProps {
  battleId: string
}

export function StageLayout({ battleId }: StageLayoutProps) {
  const { battle, roasts, totalTally, audienceCount } = useBattleStore()
  const { wsStatus } = useConnectionStore()

  // Debug logging to track state changes
  useEffect(() => {
    console.log('[StageLayout] Battle state changed:', {
      timer: battle?.timer,
      round: battle?.currentRound,
      turn: battle?.turn,
      status: battle?.status,
      totalTally,
      audienceCount
    })
  }, [battle?.timer, battle?.currentRound, battle?.turn, battle?.status, totalTally, audienceCount])

  if (!battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading battle...</div>
      </div>
    )
  }

  const currentRoundRoasts = roasts.filter(roast => roast.round === battle.currentRound)
  const currentTopic = battle.topics[battle.currentRound - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold text-white">🔥 ROAST BATTLE</h1>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {wsStatus === 'connected' ? '🟢 LIVE' : '🔴 OFFLINE'}
          </div>
        </div>

        <div className="text-white text-right">
          <div className="text-sm opacity-75">Battle ID</div>
          <div className="font-mono text-lg">{battleId}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {/* Main Stage Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Topic & Progress */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <TopicStepper currentRound={battle.currentRound} topics={battle.topics} />

            <div className="mt-4 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                Round {battle.currentRound}: {currentTopic}
              </h2>
              {battle.status === 'live' && (
                <div className="text-6xl font-mono text-yellow-400">
                  {formatTimer(battle.timer)}
                </div>
              )}
            </div>
          </div>

          {/* Current Turn Indicator */}
          {battle.status === 'live' && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-center">
                <div className="text-lg text-gray-300 mb-2">Now Roasting</div>
                <div className="text-4xl font-bold text-white">
                  {battle.turn === 'human' ? '🧑 HUMAN' : '🤖 AI AGENT'}
                </div>
                <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      battle.turn === 'human' ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(battle.timer / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Roasts Display */}
          <div className="space-y-4">
            {currentRoundRoasts.length === 0 ? (
              <div className="bg-white/5 backdrop-blur rounded-lg p-8 text-center">
                <div className="text-gray-400 text-xl">
                  {battle.status === 'pending'
                    ? 'Waiting for battle to start...'
                    : 'No roasts yet this round'}
                </div>
              </div>
            ) : (
              currentRoundRoasts.map(roast => <RoastCard key={roast.id} roast={roast} />)
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vote Tally */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Live Votes</h3>
            <VoteBar
              humanVotes={totalTally.human}
              aiVotes={totalTally.ai}
              audienceCount={audienceCount}
            />
          </div>

          {/* QR Code */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Vote Here</h3>
            <QRDisplay battleId={battleId} />
            <div className="mt-4 text-center">
              <div className="text-gray-300 text-sm">{audienceCount} people connected</div>
            </div>
          </div>

          {/* Battle Status */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Battle Info</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="capitalize text-white">{battle.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Round:</span>
                <span className="text-white">{battle.currentRound} / 3</span>
              </div>
              <div className="flex justify-between">
                <span>First Turn:</span>
                <span className="text-white">
                  {battle.coinFlipResult === 'human' ? '🧑 Human' : '🤖 AI'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
