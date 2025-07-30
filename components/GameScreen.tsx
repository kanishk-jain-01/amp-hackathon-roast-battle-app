import React, { useState, useEffect } from 'react';
import VotingBar from './VotingBar';
import QRCodeDisplay from './QRCodeDisplay';
import WinnerBanner from './WinnerBanner';
import { GameState } from '@/lib/voteStore';
import { getRandomTopic } from '@/utils/gptPrompt';

interface GameScreenProps {
  initialGameState?: GameState;
  voteUrl: string;
}

export default function GameScreen({ initialGameState, voteUrl }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(() => 
    initialGameState || {
      currentRound: 1,
      maxRounds: 3,
      topic: '',
      humanRoast: '',
      aiRoast: '',
      votes: { human: 0, ai: 0 },
      roundWinners: [],
      isVotingOpen: false,
      gameStarted: false
    }
  );

  const [voteStats, setVoteStats] = useState({
    total: 0,
    humanPercentage: 50,
    aiPercentage: 50,
    humanVotes: 0,
    aiVotes: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('');

  // Poll for vote updates
  useEffect(() => {
    if (gameState.isVotingOpen) {
      const interval = setInterval(fetchVotes, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [gameState.isVotingOpen]);

  const fetchVotes = async () => {
    try {
      const response = await fetch('/api/get-votes');
      const data = await response.json();
      
      if (data.success) {
        setGameState(data.gameState);
        setVoteStats(data.voteStats);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const startRound = async () => {
    if (!topic.trim()) {
      setMessage('Please enter a topic!');
      return;
    }

    setLoading(true);
    setMessage('Starting round...');

    try {
      const response = await fetch('/api/game-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-round',
          data: { topic: topic.trim() }
        })
      });

      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setMessage(data.message);
        setTopic(''); // Clear the input
      } else {
        setMessage(data.message || 'Failed to start round');
      }
    } catch (error) {
      setMessage('Error starting round');
    } finally {
      setLoading(false);
    }
  };



  const generateAIRoast = async () => {
    if (!gameState.topic) {
      setMessage('Please start a round first!');
      return;
    }

    setLoading(true);
    setMessage('AI is crafting a roast...');

    try {
      const response = await fetch('/api/generate-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: gameState.topic
        })
      });

      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setMessage('AI roast generated!');
      } else {
        setMessage(data.message || 'Failed to generate AI roast');
      }
    } catch (error) {
      setMessage('Error generating AI roast');
    } finally {
      setLoading(false);
    }
  };

  const openVoting = async () => {
    setLoading(true);
    setMessage('Opening voting...');

    try {
      const response = await fetch('/api/game-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open-voting' })
      });

      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setMessage('Voting is now open!');
      } else {
        setMessage(data.message || 'Failed to open voting');
      }
    } catch (error) {
      setMessage('Error opening voting');
    } finally {
      setLoading(false);
    }
  };

  const closeVoting = async () => {
    setLoading(true);
    setMessage('Closing voting...');

    try {
      const response = await fetch('/api/game-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close-voting' })
      });

      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setMessage('Voting closed');
        fetchVotes(); // Get final vote count
      } else {
        setMessage(data.message || 'Failed to close voting');
      }
    } catch (error) {
      setMessage('Error closing voting');
    } finally {
      setLoading(false);
    }
  };

  const nextRound = async () => {
    setLoading(true);
    setMessage('Moving to next round...');

    try {
      const response = await fetch('/api/game-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next-round' })
      });

      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setMessage(data.message);
        setVoteStats({ total: 0, humanPercentage: 50, aiPercentage: 50, humanVotes: 0, aiVotes: 0 });
      } else {
        setMessage(data.message || 'Failed to move to next round');
      }
    } catch (error) {
      setMessage('Error moving to next round');
    } finally {
      setLoading(false);
    }
  };

  const resetGame = async () => {
    setLoading(true);
    setMessage('Resetting game...');

    try {
      const response = await fetch('/api/game-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-game' })
      });

      const data = await response.json();
      if (data.success) {
        setGameState(data.gameState);
        setMessage('Game reset!');
        setVoteStats({ total: 0, humanPercentage: 50, aiPercentage: 50, humanVotes: 0, aiVotes: 0 });
        setTopic('');
      } else {
        setMessage(data.message || 'Failed to reset game');
      }
    } catch (error) {
      setMessage('Error resetting game');
    } finally {
      setLoading(false);
    }
  };

  const getRandomTopicSuggestion = () => {
    setTopic(getRandomTopic());
  };

  const humanWins = gameState.roundWinners.filter((w: string) => w === 'human').length;
  const aiWins = gameState.roundWinners.filter((w: string) => w === 'ai').length;
  const isGameComplete = gameState.roundWinners.length === gameState.maxRounds;
  const finalWinner = isGameComplete ? (humanWins > aiWins ? 'human' : aiWins > humanWins ? 'ai' : 'tie') : null;

  // Show final winner banner
  if (isGameComplete && finalWinner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-roast-dark via-gray-900 to-roast-purple p-8">
        <WinnerBanner
          winner={finalWinner}
          isFinalWinner={true}
          humanWins={humanWins}
          aiWins={aiWins}
          onResetGame={resetGame}
          className="mt-20"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-roast-dark via-gray-900 to-roast-purple p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎭 <span className="text-roast-orange">ROAST</span>BOT 🤖
          </h1>
          <p className="text-xl text-gray-300">
            Round {gameState.currentRound} of {gameState.maxRounds} | 
            Human: {humanWins} - AI: {aiWins}
          </p>
          {gameState.topic && (
            <div className="mt-4 bg-roast-purple px-6 py-3 rounded-full inline-block">
              <span className="text-white font-semibold">
                🎯 Topic: {gameState.topic}
              </span>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">
              {message}
            </div>
          </div>
        )}

        {/* Game Setup */}
        {(!gameState.gameStarted || (gameState.gameStarted && !gameState.topic)) && (
          <div className="max-w-2xl mx-auto mb-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              {!gameState.gameStarted ? 'Start the Battle! 🥊' : `Start Round ${gameState.currentRound}! 🥊`}
            </h2>
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a topic to roast..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && startRound()}
                />
                <button
                  onClick={getRandomTopicSuggestion}
                  className="px-4 py-2 bg-roast-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🎲 Random
                </button>
              </div>
              <button
                onClick={startRound}
                disabled={loading || !topic.trim()}
                className="w-full bg-roast-orange text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? '⏳ Starting...' : '🚀 Start Round!'}
              </button>
            </div>
          </div>
        )}

        {/* Roast Battle Arena */}
        {gameState.gameStarted && gameState.topic && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Human Roast */}
            <div className="bg-blue-900 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                🔊 HUMAN ROAST
              </h3>
              <div className="bg-white p-8 rounded-lg text-center">
                <p className="text-gray-600 text-xl font-semibold mb-2">
                  Human Roast:
                </p>
                <p className="text-gray-800 text-2xl italic">
                  (Spoken aloud)
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  🎤 Human contestant delivers their roast live to the audience
                </div>
              </div>
            </div>

            {/* AI Roast */}
            <div className="bg-orange-900 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                🤖 AI ROAST
              </h3>
              {!gameState.aiRoast ? (
                <div className="text-center">
                  <button
                    onClick={generateAIRoast}
                    disabled={loading}
                    className="w-full bg-roast-orange text-white py-8 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-xl"
                  >
                    {loading ? '🧠 AI is thinking...' : '🎭 Generate AI Roast'}
                  </button>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-gray-800 text-lg italic">
                    "{gameState.aiRoast}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voting Controls */}
        {gameState.gameStarted && gameState.aiRoast && (
          <div className="mb-8">
            <div className="text-center mb-6">
              {!gameState.isVotingOpen ? (
                <button
                  onClick={openVoting}
                  disabled={loading}
                  className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ Opening...' : '🗳️ Open Voting'}
                </button>
              ) : (
                <button
                  onClick={closeVoting}
                  disabled={loading}
                  className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ Closing...' : '🛑 Close Voting'}
                </button>
              )}
            </div>

            {/* QR Code and Voting Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <VotingBar
                  human={voteStats.humanVotes}
                  ai={voteStats.aiVotes}
                  isLive={gameState.isVotingOpen}
                />
              </div>
              <div>
                <QRCodeDisplay
                  voteUrl={voteUrl}
                  isVotingOpen={gameState.isVotingOpen}
                />
              </div>
            </div>
          </div>
        )}

        {/* Round Winner and Next Round */}
        {!gameState.isVotingOpen && voteStats.total > 0 && gameState.gameStarted && gameState.aiRoast && (
          <div className="mb-8">
            <WinnerBanner
              winner={voteStats.humanVotes > voteStats.aiVotes ? 'human' : voteStats.aiVotes > voteStats.humanVotes ? 'ai' : 'tie'}
              isRoundWinner={true}
              currentRound={gameState.currentRound}
              humanWins={humanWins}
              aiWins={aiWins}
              onNextRound={gameState.currentRound < gameState.maxRounds ? nextRound : undefined}
            />
          </div>
        )}

        {/* Game Controls */}
        <div className="text-center">
          <button
            onClick={resetGame}
            disabled={loading}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Resetting...' : '🔄 Reset Game'}
          </button>
        </div>
      </div>
    </div>
  );
} 