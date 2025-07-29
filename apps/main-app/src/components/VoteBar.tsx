interface VoteBarProps {
  humanVotes: number
  aiVotes: number
  audienceCount: number
}

export function VoteBar({ humanVotes, aiVotes, audienceCount }: VoteBarProps) {
  const totalVotes = humanVotes + aiVotes
  const humanPercent = totalVotes > 0 ? (humanVotes / totalVotes) * 100 : 50
  const aiPercent = totalVotes > 0 ? (aiVotes / totalVotes) * 100 : 50

  return (
    <div className="space-y-4">
      {/* Vote counts */}
      <div className="flex justify-between text-white">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{humanVotes}</div>
          <div className="text-sm">🧑 Human</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{aiVotes}</div>
          <div className="text-sm">🤖 AI</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
          <div className="flex h-full">
            <div
              className="bg-blue-500 transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${humanPercent}%` }}
            >
              {humanPercent > 15 && `${Math.round(humanPercent)}%`}
            </div>
            <div
              className="bg-red-500 transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${aiPercent}%` }}
            >
              {aiPercent > 15 && `${Math.round(aiPercent)}%`}
            </div>
          </div>
        </div>

        {/* Center divider */}
        <div className="absolute top-0 left-1/2 transform -translate-x-0.5 w-0.5 h-6 bg-white/50" />
      </div>

      {/* Stats */}
      <div className="text-center text-gray-400 text-sm">
        <div>{totalVotes} total votes</div>
        <div>{audienceCount} audience members</div>
      </div>

      {/* Leading indicator */}
      {totalVotes > 0 && (
        <div className="text-center">
          {humanVotes > aiVotes ? (
            <div className="text-blue-400 font-medium">🧑 Human Leading!</div>
          ) : aiVotes > humanVotes ? (
            <div className="text-red-400 font-medium">🤖 AI Leading!</div>
          ) : (
            <div className="text-yellow-400 font-medium">🔥 It&apos;s a tie!</div>
          )}
        </div>
      )}
    </div>
  )
}
