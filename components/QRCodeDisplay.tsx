import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  voteUrl: string;
  isVotingOpen: boolean;
}

export default function QRCodeDisplay({ voteUrl, isVotingOpen }: QRCodeDisplayProps) {
  // Placeholder component - to be enhanced by UIAgent with Daisy UI
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body items-center text-center">
        <h2 className="card-title">📱 Vote Here!</h2>
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG 
            value={voteUrl} 
            size={160}
            className={`transition-opacity ${isVotingOpen ? 'opacity-100' : 'opacity-50'}`}
          />
        </div>
        <p className="text-sm text-base-content">
          Scan to vote on mobile
        </p>
        <div className="badge badge-secondary">
          {isVotingOpen ? 'VOTING OPEN' : 'VOTING CLOSED'}
        </div>
      </div>
    </div>
  );
}
