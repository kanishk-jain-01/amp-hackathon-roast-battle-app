import { NextApiRequest, NextApiResponse } from 'next'

// Proxy votes to the main app
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { battleId, ...voteData } = req.body

    if (!battleId) {
      return res.status(400).json({ error: 'Battle ID is required' })
    }

    // Forward to main app
    const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${mainAppUrl}/api/battle/${battleId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('Error proxying vote:', error)
    return res.status(500).json({ error: 'Failed to cast vote' })
  }
}
