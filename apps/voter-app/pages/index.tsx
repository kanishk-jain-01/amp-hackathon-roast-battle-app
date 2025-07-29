import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'

export default function VoterHome() {
  const router = useRouter()

  useEffect(() => {
    // If no battle ID in URL, redirect to home page
    const { b } = router.query
    if (b && typeof b === 'string') {
      router.push(`/vote/${b}`)
    }
  }, [router])

  return (
    <>
      <Head>
        <title>Roast Battle Voting</title>
        <meta name="description" content="Vote in live roast battles" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-white mb-6">🗳️ Roast Battle Voting</h1>
          <p className="text-gray-300 mb-8">
            Use the QR code from the main screen to join a battle and vote!
          </p>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <p className="text-white">Waiting for battle invitation...</p>
          </div>
        </div>
      </main>
    </>
  )
}
