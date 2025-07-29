import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRDisplayProps {
  battleId: string
}

export function QRDisplay({ battleId }: QRDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const voteUrl = `http://localhost:3001/vote/${battleId}`

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(voteUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQR()
  }, [voteUrl])

  return (
    <div className="text-center">
      {qrCodeUrl ? (
        <div className="bg-white p-4 rounded-lg inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeUrl} alt={`QR Code for battle ${battleId}`} className="w-48 h-48" />
        </div>
      ) : (
        <div className="bg-white/20 rounded-lg p-8 flex items-center justify-center">
          <div className="text-white">Generating QR code...</div>
        </div>
      )}

      <div className="mt-3 text-gray-300 text-sm break-all">{voteUrl}</div>

      <div className="mt-2 text-gray-400 text-xs">Scan to vote on your phone</div>
    </div>
  )
}
