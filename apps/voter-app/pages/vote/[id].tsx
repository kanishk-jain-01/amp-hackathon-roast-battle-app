import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function VotePage() {
  const router = useRouter()
  const { id } = router.query
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedVote, setSelectedVote] = useState<'human' | 'ai' | null>(null)

  const handleVote = (voteFor: 'human' | 'ai') => {
    if (hasVoted) return
    
    setSelectedVote(voteFor)
    setHasVoted(true)
    
    // TODO: Send vote to API
    console.log(`Voted for ${voteFor} in battle ${id}`)
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
            <h1 className="text-3xl font-bold text-white mb-2">
              🗳️ Cast Your Vote
            </h1>
            <p className="text-gray-300">
              Battle ID: {id}
            </p>
          </div>
          
          {!hasVoted ? (
            <div className="space-y-4">
              <button 
                onClick={() => handleVote('human')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-6 rounded-lg text-xl transition-all transform hover:scale-105"
              >
                Vote for Human 🧑
              </button>
              
              <button 
                onClick={() => handleVote('ai')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-6 rounded-lg text-xl transition-all transform hover:scale-105"
              >
                Vote for AI 🤖
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
                <span className="font-bold">0 votes</span>
              </div>
              <div className="flex justify-between">
                <span>AI 🤖</span>
                <span className="font-bold">0 votes</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Round 1 of 3 • Topic: Coming Soon
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
