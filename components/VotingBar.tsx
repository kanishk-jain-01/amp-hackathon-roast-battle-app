import React, { useState, useEffect, useRef } from 'react';

interface VotingBarProps {
  human: number;
  ai: number;
  isLive?: boolean;
}

interface ApiResponse {
  success: boolean;
  voteStats: {
    human: number;
    ai: number;
    total: number;
  };
  gameState: any;
  finalWinner?: string;
  timestamp: number;
}

export default function VotingBar({ human: initialHuman, ai: initialAi, isLive = false }: VotingBarProps) {
  const [humanVotes, setHumanVotes] = useState(initialHuman);
  const [aiVotes, setAiVotes] = useState(initialAi);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate derived values
  const totalVotes = humanVotes + aiVotes;
  const humanPercentage = totalVotes > 0 ? (humanVotes / totalVotes) * 100 : 50;
  const aiPercentage = totalVotes > 0 ? (aiVotes / totalVotes) * 100 : 50;

  // Real-time polling for live updates
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const response = await fetch('/api/get-votes');
        if (response.ok) {
          const data: ApiResponse = await response.json();
          if (data.success && data.voteStats) {
            setHumanVotes(data.voteStats.human);
            setAiVotes(data.voteStats.ai);
          }
        }
      } catch (error) {
        console.error('Failed to fetch votes:', error);
      }
    };

    if (isLive) {
      fetchVotes(); // Initial fetch
      intervalRef.current = setInterval(fetchVotes, 1500); // Poll every 1.5 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLive]);

  // Update votes when props change (for non-live mode)
  useEffect(() => {
    if (!isLive) {
      setHumanVotes(initialHuman);
      setAiVotes(initialAi);
    }
  }, [initialHuman, initialAi, isLive]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Vote Counts Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-left">
          <div className="text-4xl font-bold text-blue-400 transition-all duration-500 ease-out">
            {humanVotes}
          </div>
          <div className="text-lg text-blue-300 font-semibold">🔊 HUMAN</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {totalVotes === 0 ? 'No votes yet' : `${totalVotes} votes`}
          </div>
          {isLive && (
            <div className="inline-flex items-center space-x-2 bg-green-600 px-3 py-1 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-ping"></div>
              <span className="text-white text-sm font-semibold">LIVE</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-4xl font-bold text-orange-400 transition-all duration-500 ease-out">
            {aiVotes}
          </div>
          <div className="text-lg text-orange-300 font-semibold">🤖 AI</div>
        </div>
      </div>

      {/* Progress Bar using Daisy UI */}
      <div className="relative mb-4">
        <div className="w-full h-20 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600 relative">
          {/* Human Progress */}
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out flex items-center justify-start px-4"
            style={{ width: `${humanPercentage}%` }}
          >
            {humanPercentage >= 15 && (
              <span className="text-white font-bold text-lg flex items-center">
                🔊 HUMAN
              </span>
            )}
          </div>
          
          {/* AI Progress */}
          <div 
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-orange-500 to-red-500 transition-all duration-1000 ease-out flex items-center justify-end px-4"
            style={{ width: `${aiPercentage}%` }}
          >
            {aiPercentage >= 15 && (
              <span className="text-white font-bold text-lg flex items-center">
                AI 🤖
              </span>
            )}
          </div>

          {/* Center divider */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white opacity-30"></div>
        </div>
      </div>

      {/* Percentage Labels */}
      <div className="flex justify-between items-center text-lg font-mono">
        <div className="text-blue-400 font-bold">
          {humanPercentage.toFixed(1)}%
        </div>
        
        <div className="text-center">
          {/* Winner indicator */}
          {totalVotes > 0 && (
            <div className={`px-4 py-2 rounded-full text-white font-bold transition-all duration-500 ${
              humanVotes > aiVotes 
                ? 'bg-blue-600' 
                : humanVotes < aiVotes 
                  ? 'bg-orange-600' 
                  : 'bg-gray-600'
            }`}>
              {humanVotes > aiVotes ? (
                <>🏆 HUMAN LEADS</>
              ) : humanVotes < aiVotes ? (
                <>🏆 AI LEADS</>
              ) : (
                <>🤝 TIED</>
              )}
            </div>
          )}
        </div>

        <div className="text-orange-400 font-bold">
          {aiPercentage.toFixed(1)}%
        </div>
      </div>

      {/* Vote Now Indicator for Live Mode */}
      {isLive && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-green-600 px-4 py-2 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-green-300 rounded-full animate-ping"></div>
            <span className="text-white font-semibold">Scan QR to vote!</span>
          </div>
        </div>
      )}
    </div>
  );
}
