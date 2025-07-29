# RoastBot API Interfaces

## Core Data Types

### GameState
```typescript
interface GameState {
  currentRound: number;        // Current round (1-3)
  maxRounds: number;          // Maximum rounds (3)
  topic: string;              // Current round's roast topic
  humanRoast: string;         // Human's roast (empty - humans roast out loud)
  aiRoast: string;           // AI-generated roast
  votes: {
    human: number;           // Vote count for human
    ai: number;             // Vote count for AI
  };
  roundWinners: string[];    // Array of round winners ['human', 'ai', 'ai']
  isVotingOpen: boolean;     // Whether voting is currently open
  gameStarted: boolean;      // Whether the game has begun
}
```

## API Endpoints

### GET /api/get-votes
Returns current game state
```typescript
Response: {
  success: boolean;
  gameState: GameState;
  message?: string;
}
```

### POST /api/submit-vote
Submit a vote for human or AI
```typescript
Request: {
  vote: 'human' | 'ai';
}

Response: {
  success: boolean;
  gameState: GameState;
  message?: string;
}
```

### POST /api/start-game
Start a new game with a topic
```typescript
Request: {
  topic: string;
}

Response: {
  success: boolean;
  gameState: GameState;
  message?: string;
}
```

### POST /api/generate-ai-roast
Generate AI roast for current topic
```typescript
Request: {
  topic: string;
}

Response: {
  success: boolean;
  aiRoast: string;
  gameState: GameState;
  message?: string;
}
```

### POST /api/next-round
Advance to next round or end game
```typescript
Request: {
  winner: 'human' | 'ai';
  newTopic?: string;  // Required if not final round
}

Response: {
  success: boolean;
  gameState: GameState;
  finalWinner?: string;  // Only present if game is complete
  message?: string;
}
```

### POST /api/open-voting
Open voting for current round
```typescript
Response: {
  success: boolean;
  gameState: GameState;
  message?: string;
}
```

### POST /api/close-voting
Close voting and get results
```typescript
Response: {
  success: boolean;
  gameState: GameState;
  roundWinner: 'human' | 'ai';
  message?: string;
}
```

### POST /api/reset-game
Reset the entire game state
```typescript
Response: {
  success: boolean;
  gameState: GameState;
  message?: string;
}
```

## Component Props

### GameScreen
```typescript
interface GameScreenProps {
  initialGameState: GameState;
  voteUrl: string;
}
```

### VotingBar
```typescript
interface VotingBarProps {
  votes: { human: number; ai: number };
  isVotingOpen: boolean;
}
```

### QRCodeDisplay
```typescript
interface QRCodeDisplayProps {
  url: string;
  size?: number;
}
```

### WinnerBanner
```typescript
interface WinnerBannerProps {
  winner: 'human' | 'ai' | null;
  roundNumber: number;
  finalWinner?: 'human' | 'ai';
}
```

## Key Implementation Notes

1. **No Human Text Input**: Humans roast out loud - no text entry needed
2. **Real-time Updates**: Use polling (3-second intervals) for live updates
3. **QR Code Voting**: Generate QR codes for audience voting via mobile
4. **Round Management**: 3 rounds total, track winners per round
5. **AI Integration**: OpenAI GPT-4o for roast generation
6. **Vote Storage**: In-memory store (no database required)
7. **UI Framework**: Daisy UI components for beautiful interface

## Agent Responsibilities

- **UIAgent**: Create beautiful Daisy UI components
- **APIAgent**: Implement all API endpoints
- **AIAgent**: Handle OpenAI integration and prompt engineering
- **GameLogicAgent**: Implement game flow and state management
