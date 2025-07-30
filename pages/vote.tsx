import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { GameState } from '@/lib/voteStore';

export default function Vote() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteResult, setVoteResult] = useState<'human' | 'ai' | null>(null);

  useEffect(() => {
    // Clear any stale state on mount
    setGameState(null);
    setVoteStats(null);
    setHasVoted(false);
    setVoteResult(null);
    setVoting(false);
    
    // Force immediate fetch
    fetchGameState();
    const interval = setInterval(fetchGameState, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Add timeout failsafe for voting state
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (voting) {
      // Reset voting state after 10 seconds to prevent permanent stuck state
      timeout = setTimeout(() => {
        console.log('Vote timeout - resetting voting state');
        setVoting(false);
      }, 10000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [voting]);

  // Helper function to check if voting is actually allowed
  const isVotingAllowed = () => {
    if (!gameState) {
      console.log('Voting not allowed: No game state');
      return false;
    }
    if (!gameState.gameStarted) {
      console.log('Voting not allowed: Game not started');
      return false;
    }
    if (!gameState.topic) {
      console.log('Voting not allowed: No topic');
      return false;
    }
    if (!gameState.aiRoast) {
      console.log('Voting not allowed: No AI roast');
      return false;
    }
    if (!gameState.isVotingOpen) {
      console.log('Voting not allowed: Voting closed');
      return false;
    }
    if (hasVoted) {
      console.log('Voting not allowed: Already voted');
      return false;
    }
    if (voting) {
      console.log('Voting not allowed: Currently submitting');
      return false;
    }
    console.log('Voting allowed!');
    return true;
  };

  // Reset hasVoted when game state changes (new round, game reset, etc.)
  useEffect(() => {
    if (gameState) {
      // Reset voting state when round changes or game resets
      const currentRoundKey = `${gameState.currentRound}-${gameState.topic}`;
      const storedRoundKey = localStorage.getItem('currentRound');
      
      if (currentRoundKey !== storedRoundKey) {
        setHasVoted(false);
        setVoteResult(null);
        setVoting(false); // Also reset voting state
        localStorage.setItem('currentRound', currentRoundKey);
      }
    }
  }, [gameState?.currentRound, gameState?.topic]);

  const fetchGameState = async () => {
    try {
      const response = await fetch('/api/get-votes');
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched game state:', {
          gameStarted: data.gameState.gameStarted,
          isVotingOpen: data.gameState.isVotingOpen,
          topic: data.gameState.topic,
          hasAiRoast: !!data.gameState.aiRoast,
          currentRound: data.gameState.currentRound
        });
        
        setGameState(data.gameState);
        setVoteStats(data.voteStats);
        
        // If voting is closed, reset voting state to prevent stuck buttons
        if (!data.gameState.isVotingOpen && voting) {
          console.log('Voting closed, resetting voting state');
          setVoting(false);
        }
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitVote = async (vote: 'human' | 'ai') => {
    console.log('submitVote called with:', vote);
    
    // Use the comprehensive validation function
    if (!isVotingAllowed()) {
      console.log('Vote submission blocked by validation');
      return;
    }
    
    console.log('Submitting vote:', vote, 'Game state:', {
      gameStarted: gameState!.gameStarted,
      isVotingOpen: gameState!.isVotingOpen,
      topic: gameState!.topic,
      hasAiRoast: !!gameState!.aiRoast
    });
    
    setVoting(true);

    try {
      const response = await fetch('/api/submit-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote })
      });

      const data = await response.json();
      
      if (data.success) {
        setHasVoted(true);
        setVoteResult(vote);
        setGameState(data.gameState);
        setVoteStats(data.voteStats);
        console.log('Vote submitted successfully');
      } else {
        console.error('Vote submission failed:', data);
        // Better error message based on the specific error
        if (data.message?.includes('Voting is not open')) {
          alert('Voting is currently closed. Please wait for the host to open voting.');
        } else {
          alert(data.message || 'Failed to submit vote');
        }
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      alert('Error submitting vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const getVotePercentage = (voteType: 'human' | 'ai') => {
    if (!gameState || !gameState.votes.human && !gameState.votes.ai) return 0;
    const total = gameState.votes.human + gameState.votes.ai;
    const votes = voteType === 'human' ? gameState.votes.human : gameState.votes.ai;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-orange-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎭</div>
          <div className="text-white text-xl font-semibold">Loading roast battle...</div>
        </div>
      </div>
    );
  }

  if (!gameState || !gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-orange-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-white text-2xl font-bold mb-4">Battle Not Started</div>
          <div className="text-gray-300 text-lg">The roast battle hasn't begun yet!</div>
          <div className="text-gray-400 text-sm mt-4">This page will update automatically when the battle starts</div>
        </div>
      </div>
    );
  }

  if (!gameState.topic || !gameState.aiRoast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-orange-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="text-6xl mb-4 animate-bounce">🎤</div>
          <div className="text-white text-2xl font-bold mb-4">Round {gameState.currentRound}</div>
          <div className="text-gray-300 text-lg mb-4">Roasts are being prepared...</div>
          <div className="text-gray-400 text-sm">Get ready to vote!</div>
        </div>
      </div>
    );
  }

  if (!gameState.isVotingOpen && !hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-orange-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">🗳️</div>
          <div className="text-white text-2xl font-bold mb-4">Voting Closed</div>
          <div className="text-orange-300 text-lg mb-6">Round {gameState.currentRound}: {gameState.topic}</div>
          
          {/* Show roasts */}
          <div className="space-y-4 text-left">
            <div className="bg-blue-900/50 p-4 rounded-xl border border-blue-500">
              <div className="text-blue-300 font-semibold mb-2">🔊 Human:</div>
              <div className="text-white italic">"{gameState.humanRoast}"</div>
            </div>
            <div className="bg-orange-900/50 p-4 rounded-xl border border-orange-500">
              <div className="text-orange-300 font-semibold mb-2">🤖 AI:</div>
              <div className="text-white italic">"{gameState.aiRoast}"</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Vote - RoastBot Battle</title>
        <meta name="description" content="Cast your vote in the epic roast battle!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#7c3aed" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-orange-900 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6 pt-4">
            <h1 className="text-3xl font-bold text-white mb-2">
              🗳️ <span className="text-orange-400">VOTE NOW!</span>
            </h1>
            <div className="bg-purple-800/50 px-4 py-2 rounded-full inline-block">
              <span className="text-white font-semibold">
                Round {gameState.currentRound} of {gameState.maxRounds}
              </span>
            </div>
            
            {/* Voting Status Indicator */}
            <div className={`mt-3 px-4 py-2 rounded-lg ${
              gameState.isVotingOpen 
                ? 'bg-green-600/20 border border-green-500' 
                : 'bg-red-600/20 border border-red-500'
            }`}>
              <span className={`font-medium ${
                gameState.isVotingOpen ? 'text-green-300' : 'text-red-300'
              }`}>
                {gameState.isVotingOpen ? '🟢 Voting Open' : '🔴 Voting Closed'}
              </span>
            </div>
            
            <div className="mt-3 bg-orange-600/20 px-4 py-2 rounded-lg">
              <span className="text-orange-200 font-medium text-lg">
                🎯 {gameState.topic}
              </span>
            </div>
          </div>

          {/* AI Roast Context */}
          <div className="mb-6">
            <div className="bg-orange-900/30 p-4 rounded-xl border border-orange-500/30">
              <div className="flex items-center justify-center mb-3">
                <span className="text-2xl mr-2">🤖</span>
                <h2 className="text-lg font-bold text-orange-300">AI Roast</h2>
              </div>
              <div className="bg-black/20 p-3 rounded-lg">
                <p className="text-white text-center italic">
                  "{gameState.aiRoast}"
                </p>
              </div>
            </div>
          </div>

          {/* Thank You State */}
          {hasVoted ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-green-600/20 border border-green-500 text-green-300 px-6 py-4 rounded-xl mb-4">
                  <span className="text-3xl mr-2">✅</span>
                  <span className="font-bold text-lg">Vote Submitted!</span>
                </div>
                
                <div className="text-white text-lg mb-4">
                  You voted for: <span className="font-bold text-orange-300">
                    {voteResult === 'human' ? '🔊 Human' : '🤖 AI'}
                  </span>
                </div>
              </div>

              {/* Current Vote Tally */}
              <div className="bg-black/30 p-4 rounded-xl">
                <h3 className="text-white text-center font-semibold mb-4">Current Results</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300 font-medium">🔊 Human</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold">{gameState.votes.human}</span>
                      <span className="text-blue-300">({getVotePercentage('human')}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getVotePercentage('human')}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-orange-300 font-medium">🤖 AI</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold">{gameState.votes.ai}</span>
                      <span className="text-orange-300">({getVotePercentage('ai')}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getVotePercentage('ai')}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center mt-4 text-gray-300">
                  Total Votes: {gameState.votes.human + gameState.votes.ai}
                </div>
              </div>

              <div className="text-center text-gray-300 text-sm">
                <p>🎭 Thanks for participating!</p>
                <p className="mt-1">Watch the main screen for live updates</p>
              </div>
            </div>
          ) : (
            /* Voting Buttons */
            <div className="space-y-4">
              <div className="text-center text-white text-lg font-semibold mb-6">
                Which roast was funnier? 🤔
              </div>
              
              <button
                onClick={() => submitVote('human')}
                disabled={!isVotingAllowed()}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-6 px-6 rounded-2xl font-bold text-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg border-2 border-blue-500"
                style={{ minHeight: '80px', touchAction: 'manipulation' }}
              >
                {voting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Submitting...
                  </div>
                ) : !gameState?.isVotingOpen ? (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">⏳</span>
                    Voting Closed
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-3xl mr-3">🔊</span>
                    Vote for Human
                  </div>
                )}
              </button>

              <button
                onClick={() => submitVote('ai')}
                disabled={!isVotingAllowed()}
                className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white py-6 px-6 rounded-2xl font-bold text-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg border-2 border-orange-500"
                style={{ minHeight: '80px', touchAction: 'manipulation' }}
              >
                {voting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Submitting...
                  </div>
                ) : !gameState?.isVotingOpen ? (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">⏳</span>
                    Voting Closed
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-3xl mr-3">🤖</span>
                    Vote for AI
                  </div>
                )}
              </button>
              
              {/* Guidance text */}
              {!isVotingAllowed() && gameState && (
                <div className="text-center mt-6 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
                  <p className="text-yellow-300 font-medium">
                    {!gameState.gameStarted ? '⏳ Game not started yet' :
                     !gameState.topic ? '⏳ Waiting for topic' :
                     !gameState.aiRoast ? '⏳ Waiting for AI roast' :
                     !gameState.isVotingOpen ? '⏳ Waiting for host to open voting' :
                     hasVoted ? '✅ Vote submitted' :
                     voting ? '⏳ Submitting vote...' :
                     '⏳ Waiting for host to open voting'}
                  </p>
                  <p className="text-yellow-200 text-sm mt-1">
                    This page will update automatically
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
