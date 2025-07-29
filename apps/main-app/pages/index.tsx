import Head from 'next/head'
import { useRouter } from 'next/router'
import { generateBattleId } from '@roast-battle/ui'

export default function Home() {
  const router = useRouter()

  const createNewBattle = () => {
    const newBattleId = generateBattleId()
    router.push(`/battle/${newBattleId}`)
  }

  return (
    <>
      <Head>
        <title>Roast Battle Arena</title>
        <meta name="description" content="Live AI vs Human roast battles" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">🔥 ROAST BATTLE 🔥</h1>
          <p className="text-xl text-gray-300 mb-12">
            Where AI meets human wit in the ultimate comedy showdown
          </p>

          <div className="space-y-6">
            <button
              onClick={createNewBattle}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              Start New Battle
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
