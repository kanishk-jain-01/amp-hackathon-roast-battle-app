interface TopicStepperProps {
  currentRound: number
  topics: string[]
}

export function TopicStepper({ currentRound, topics }: TopicStepperProps) {
  return (
    <div className="flex justify-center space-x-4">
      {topics.map((topic, index) => {
        const roundNumber = index + 1
        const isActive = roundNumber === currentRound
        const isCompleted = roundNumber < currentRound

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-yellow-500 text-black ring-4 ring-yellow-300'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                }`}
              >
                {isCompleted ? '✓' : roundNumber}
              </div>
              <div
                className={`mt-2 text-xs text-center max-w-20 ${
                  isActive ? 'text-yellow-300 font-medium' : 'text-gray-400'
                }`}
              >
                {topic}
              </div>
            </div>

            {index < topics.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
