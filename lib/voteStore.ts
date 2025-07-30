// Core state management for RoastBot
// In-memory singleton store for game state and voting

export interface GameState {
  gameStarted: boolean;
  currentRound: number;
  maxRounds: number;
  topic: string;
  humanRoast: string;
  aiRoast: string;
  isVotingOpen: boolean;
  votes: {
    human: number;
    ai: number;
  };
  roundWinners: string[];
}

export interface VoteStats {
  total: number;
  humanPercentage: number;
  aiPercentage: number;
  humanVotes: number;
  aiVotes: number;
}

// Singleton store
class VoteStore {
  private gameState: GameState = {
    gameStarted: false,
    currentRound: 1,
    maxRounds: 3,
    topic: '',
    humanRoast: '',
    aiRoast: '',
    isVotingOpen: false,
    votes: {
      human: 0,
      ai: 0
    },
    roundWinners: []
  };

  getGameState(): GameState {
    return { ...this.gameState };
  }

  startRound(topic: string): GameState {
    this.gameState.topic = topic;
    this.gameState.gameStarted = true;
    this.gameState.aiRoast = '';
    this.gameState.humanRoast = '';
    this.gameState.votes = { human: 0, ai: 0 };
    this.gameState.isVotingOpen = false;
    return this.getGameState();
  }

  setAIRoast(roast: string): GameState {
    this.gameState.aiRoast = roast;
    return this.getGameState();
  }

  setHumanRoast(roast: string): GameState {
    this.gameState.humanRoast = roast;
    return this.getGameState();
  }

  openVoting(): GameState {
    this.gameState.isVotingOpen = true;
    return this.getGameState();
  }

  closeVoting(): GameState {
    this.gameState.isVotingOpen = false;
    
    // Determine round winner
    const { human, ai } = this.gameState.votes;
    let winner = 'tie';
    if (human > ai) {
      winner = 'human';
    } else if (ai > human) {
      winner = 'ai';
    }
    
    this.gameState.roundWinners.push(winner);
    
    return this.getGameState();
  }

  submitVote(isAI: boolean): GameState {
    if (!this.gameState.isVotingOpen) {
      throw new Error('Voting is not open');
    }
    
    if (isAI) {
      this.gameState.votes.ai++;
    } else {
      this.gameState.votes.human++;
    }
    
    return this.getGameState();
  }

  getVotes(): { gameState: GameState; voteStats: VoteStats } {
    const { human, ai } = this.gameState.votes;
    const total = human + ai;
    
    const voteStats: VoteStats = {
      total,
      humanVotes: human,
      aiVotes: ai,
      humanPercentage: total > 0 ? Math.round((human / total) * 100) : 50,
      aiPercentage: total > 0 ? Math.round((ai / total) * 100) : 50
    };
    
    return {
      gameState: this.getGameState(),
      voteStats
    };
  }

  nextRound(): GameState {
    if (this.gameState.currentRound >= this.gameState.maxRounds) {
      throw new Error('Game already completed');
    }
    
    this.gameState.currentRound++;
    this.gameState.topic = '';
    this.gameState.humanRoast = '';
    this.gameState.aiRoast = '';
    this.gameState.votes = { human: 0, ai: 0 };
    this.gameState.isVotingOpen = false;
    // Keep the game in started state so the UI flow continues
    this.gameState.gameStarted = true;
    
    return this.getGameState();
  }

  resetGame(): GameState {
    this.gameState = {
      gameStarted: false,
      currentRound: 1,
      maxRounds: 3,
      topic: '',
      humanRoast: '',
      aiRoast: '',
      isVotingOpen: false,
      votes: {
        human: 0,
        ai: 0
      },
      roundWinners: []
    };
    
    return this.getGameState();
  }

  getFinalWinner(): 'ai' | 'human' | 'tie' | null {
    if (this.gameState.roundWinners.length < this.gameState.maxRounds) {
      return null;
    }
    
    const humanWins = this.gameState.roundWinners.filter(w => w === 'human').length;
    const aiWins = this.gameState.roundWinners.filter(w => w === 'ai').length;
    
    if (humanWins > aiWins) {
      return 'human';
    } else if (aiWins > humanWins) {
      return 'ai';
    } else {
      return 'tie';
    }
  }
}

// Export singleton instance
export const voteStore = new VoteStore();
