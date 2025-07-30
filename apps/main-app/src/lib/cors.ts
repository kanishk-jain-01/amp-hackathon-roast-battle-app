import { NextApiRequest, NextApiResponse } from 'next'

// CORS middleware for cross-origin requests from voter app
export function enableCors(req: NextApiRequest, res: NextApiResponse) {
  // Allow requests from voter app
  const allowedOrigins = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    process.env.VOTER_APP_URL,
  ].filter(Boolean)

  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (!origin) {
    // Allow same-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }

  return false
}
