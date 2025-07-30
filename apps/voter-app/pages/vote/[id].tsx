import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'

// Generate a unique voter hash for duplicate prevention
function generateVoterHash(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
  return btoa(`${timestamp}-${random}-${userAgent.slice(0, 20)}`).slice(0, 16)
}

export default function VotePage() {
  const router = useRouter()
  const { id } = router.query
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedVote, setSelectedVote] = useState<'human' | 'ai' | null>(null)
  const [battleInfo, setBattleInfo] = useState<any>(null)
  const [votes, setVotes] = useState<any>({ human: 0, ai: 0 })
  const [currentRound, setCurrentRound] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load battle info and votes
  useEffect(() => {
    if (!id) return

    const loadBattleData = async () => {
      try {
        // Fetch battle info
        const battleResponse = await fetch(`http://localhost:3000/api/battle/${id}`)
        if (battleResponse.ok) {
          const battleData = await battleResponse.json()
          setBattleInfo(battleData.battle)
          setCurrentRound(battleData.battle?.currentRound || 1)
        }

        // Fetch current votes
        const votesResponse = await fetch(`http://localhost:3000/api/battle/${id}/vote`)
        if (votesResponse.ok) {
          const votesData = await votesResponse.json()
          setVotes(votesData.roundTally || { human: 0, ai: 0 })
        }
      } catch (error) {
        console.error('Failed to load battle data:', error)
      }
    }

    loadBattleData()
    
    // Set up real-time updates
    const eventSource = new EventSource(`http://localhost:3000/api/battle/${id}/events`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'vote_update') {
          setVotes(data.roundTally)
          setCurrentRound(data.round)
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [id])

  const handleVote = async (voteFor: 'human' | 'ai') => {
    if (hasVoted || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:3000/api/battle/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterHash: generateVoterHash(),
          round: currentRound,
          voteFor
        })
      })

      if (response.ok) {
        setSelectedVote(voteFor)
        setHasVoted(true)
        const voteData = await response.json()
        setVotes(voteData.roundTally)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to cast vote')
      }
    } catch (error) {
      console.error('Vote failed:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Vote - Battle {id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🗳️ Cast Your Vote</h1>
            <p className="text-gray-300">Battle ID: {id}</p>
          </div>

          {error && (
            <div className="bg-red-600 text-white font-bold py-4 px-4 rounded-lg text-center mb-4">
              ❌ {error}
            </div>
          )}

          {!hasVoted ? (
            <div className="space-y-4">
              <button
                onClick={() => handleVote('human')}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-6 px-6 rounded-lg text-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Voting...' : 'Vote for Human 🧑'}
              </button>

              <button
                onClick={() => handleVote('ai')}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-6 px-6 rounded-lg text-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Voting...' : 'Vote for AI 🤖'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-600 text-white font-bold py-6 px-6 rounded-lg text-xl mb-4">
                ✅ Vote Submitted!
              </div>
              <p className="text-gray-300">
                You voted for {selectedVote === 'human' ? 'Human 🧑' : 'AI 🤖'}
              </p>
            </div>
          )}

          <div className="mt-8 bg-white/10 backdrop-blur rounded-lg p-4">
            <h3 className="text-white font-bold mb-2">Live Scores</h3>
            <div className="text-white space-y-1">
              <div className="flex justify-between">
                <span>Human 🧑</span>
                <span className="font-bold">{votes.human || 0} votes</span>
              </div>
              <div className="flex justify-between">
                <span>AI 🤖</span>
                <span className="font-bold">{votes.ai || 0} votes</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Round {currentRound} of 3 • Topic: {battleInfo?.topics?.[currentRound - 1] || 'Loading...'}
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
