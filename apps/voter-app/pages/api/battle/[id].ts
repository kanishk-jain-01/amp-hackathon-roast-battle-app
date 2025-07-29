import { NextApiRequest, NextApiResponse } from 'next'

// Proxy battle data from the main app
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const battleId = id as string

    if (!battleId) {
      return res.status(400).json({ error: 'Battle ID is required' })
    }

    // Forward to main app
    const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${mainAppUrl}/api/battle/${battleId}`)

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('Error proxying battle data:', error)
    return res.status(500).json({ error: 'Failed to fetch battle data' })
  }
}
