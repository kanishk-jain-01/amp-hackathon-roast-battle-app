import React from 'react';

interface WinnerBannerProps {
  winner: 'human' | 'ai' | 'tie' | null;
  isRoundWinner?: boolean;
  isFinalWinner?: boolean;
  currentRound?: number;
  humanWins?: number;
  aiWins?: number;
  onNextRound?: () => void;
  onResetGame?: () => void;
  className?: string;
}

export default function WinnerBanner({ 
  winner, 
  isRoundWinner, 
  isFinalWinner, 
  currentRound,
  humanWins = 0,
  aiWins = 0,
  onNextRound,
  onResetGame,
  className = ""
}: WinnerBannerProps) {
  // Placeholder component - to be enhanced by UIAgent with Daisy UI animations
  
  if (!winner) return null;

  const getEmoji = () => {
    if (winner === 'human') return '🔊';
    if (winner === 'ai') return '🤖';
    return '🤝';
  };

  const getWinnerText = () => {
    if (isFinalWinner) {
      if (winner === 'tie') return '🤝 EPIC TIE GAME! 🤝';
      return `🏆 ${winner.toUpperCase()} WINS THE BATTLE! 🏆`;
    }
    if (isRoundWinner) {
      if (winner === 'tie') return '🤝 Round Tie!';
      return `${getEmoji()} ${winner.toUpperCase()} WINS ROUND ${currentRound}!`;
    }
    return `${getEmoji()} ${winner.toUpperCase()} LEADING!`;
  };

  return (
    <div className={`alert alert-success ${className}`}>
      <div className="flex-1 text-center">
        <h2 className="text-2xl font-bold">{getWinnerText()}</h2>
        {(humanWins > 0 || aiWins > 0) && (
          <p className="mt-2">Score: Human {humanWins} - {aiWins} AI</p>
        )}
        <div className="mt-4 space-x-4">
          {onNextRound && (
            <button className="btn btn-primary" onClick={onNextRound}>
              ➡️ Next Round
            </button>
          )}
          {onResetGame && (
            <button className="btn btn-outline" onClick={onResetGame}>
              🔄 New Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
