# AGENT.md - RoastBot

## Build/Test Commands
- Dev server: `npm run dev` (Next.js)
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`

## Architecture 
Interactive 3-round roast battle: Human vs AI with live audience voting
- Frontend: React + Next.js 
- Backend: Next.js API routes
- AI: OpenAI GPT-4o for roast generation
- Storage: In-memory JavaScript store (no database)
- Real-time: Polling-based vote updates

## Key Components
- `/pages/index.tsx` - Main game screen
- `/pages/vote.tsx` - QR audience voting page
- `/lib/voteStore.ts` - In-memory game state
- `/components/` - GameScreen, VotingBar, QRCodeDisplay, WinnerBanner

## Code Style Guidelines
- Use TypeScript with strict types
- camelCase for JS/TS variables and functions
- React functional components with hooks
- Handle API errors gracefully
- External imports first, then internal modules
- Keep API routes focused and single-purpose
