import { useRouter } from 'next/router'
import Head from 'next/head'

export default function BattlePage() {
  const router = useRouter()
  const { id } = router.query

  return (
    <>
      <Head>
        <title>Roast Battle - {id}</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            Battle Arena: {id}
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Battle Stage */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4">🚀 Battle Coming Soon</h2>
                <p>This is where the magic happens!</p>
              </div>
            </div>
            
            {/* Vote Display & QR */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Live Votes</h3>
                <div className="text-white">
                  <p>Human: 0</p>
                  <p>AI: 0</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Vote Here</h3>
                <div className="bg-white h-48 rounded flex items-center justify-center">
                  <p className="text-gray-600">QR Code will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
