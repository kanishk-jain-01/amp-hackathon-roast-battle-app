# Live Roast Battle – Implementation Plan

(Next.js + React, Zustand, Tailwind CSS / ShadCN, Vercel)

---

## 1. Project Structure & Architecture

```
/roast-battle
├── apps
│   ├── main-app/          # Stage & host screen
│   │   ├── pages/
│   │   │   ├── index.tsx
│   │   │   ├── battle.tsx
│   │   │   ├── admin.tsx
│   │   │   └── api/
│   │   │       ├── ai-roast.ts      # OpenAI/Anthropic proxy
│   │   │       ├── voices.ts        # Eleven Labs TTS proxy
│   │   │       ├── poll.ts          # Voting endpoints
│   │   │       └── pusher-auth.ts   # WS auth
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── styles/
│   └── voter-app/         # Audience voting PWA (can be `/vote`)
│       ├── pages/
│       │   └── index.tsx
│       ├── components/
│       └── store/
├── packages
│   └── ui/                # Shared ShadCN components, icons, utils
├── prisma/                # Schema & migrations
├── turbo.json             # Optional monorepo orchestration
└── .vercel/               # Environments, analytics
```

• Monorepo (Turborepo) keeps main stage app and lightweight voter app isolated but share UI & state utilities.  
• API routes live inside `pages/api` and deploy as Vercel Edge Functions (low latency).  
• Real-time layer via Pusher Channels / Ably / Supabase Realtime; thin wrapper in `/lib/realtime.ts`.

---

## 2. Component Breakdown (Main App)

| Component          | Responsibility                                                                        |
| ------------------ | ------------------------------------------------------------------------------------- |
| `BattleController` | Orchestrates rounds, timers, coin flip, requests AI roasts, dispatches events to WS.  |
| `StageLayout`      | Host/stage viewport, displays current speaker, topic, timer, audio wave, vote counts. |
| `RoastCard`        | Renders individual roast text + optional audio play controls.                         |
| `TopicStepper`     | Visual progress through 3 rounds.                                                     |
| `CoinFlipModal`    | Animated coin toss; sets initial turn.                                                |
| `QRDisplay`        | Generates QR via `next-qrcode`, holds voting URL w/ battleId.                         |
| `VoteBar`          | Real-time bar or donut chart; updates via WS.                                         |
| `WinnerModal`      | Announces winner at end.                                                              |
| `SettingsDrawer`   | Select AI model (GPT-4o, Claude 3, etc.) and Eleven Labs voice.                       |

Voter App Components
| Component | Responsibility |
|-----------|----------------|
| `VotePage` | Connect to battle room; display speaker A/B buttons and live bar. |
| `WaitingScreen` | Pre-battle or between rounds. |
| `ResultScreen` | Final winner & share link. |

---

## 3. State Management Strategy (Zustand + Immer)

Global store slices:

1. `battleSlice`
   • battleId, topics[], currentRound, turn, timer  
   • roasts[{speaker, text, audioUrl}]  
   • winner
2. `settingsSlice`
   • aiModel, voiceId, coinFlipResult
3. `votesSlice` (mirrors server snapshot)
   • audienceCount  
   • tallies: {human: number, ai: number}
4. `connectionSlice`
   • wsStatus, latency, errors

Persistences:  
– LocalStorage for settings slice (admin machine) using `createJSONStorage`.  
– InMemory for rest, hydrated by `/api/battle/:id` on load.

Cross-app sync:  
– Server is source of truth; Zustands listen to WS (`onVoteUpdate`, `onRoastReady`, `onRoundChange`) and update.  
– Actions dispatched from UI call `/api/*` and/or push events to WS.

---

## 4. API Integrations

1. AI Roast Generation  
   Endpoint: `POST /api/ai-roast`  
   • Body: { prompt, model }  
   • Uses OpenAI / Anthropic SDK (streaming).  
   • Returns roast text.

2. Eleven Labs TTS  
   Endpoint: `POST /api/voices`  
   • Body: { text, voiceId }  
   • Server-side fetch to Eleven Labs; store mp3 in S3 / R2; return signed URL.

3. Realtime Pub/Sub  
   • Pusher Channels (`battle-${id}`) events:  
    − `roast_ready`, `vote_update`, `round_change`, `battle_end`  
   • Server auth route for private channels.

4. Voting  
   • `POST /api/poll/vote` – records vote, triggers `vote_update`.  
   • Rate-limited by IP + session cookie.

5. Battle CRUD  
   • `POST /api/battle` – create new battle (topics etc.)  
   • `GET /api/battle/:id` – initial state snapshot.

---

## 5. In-Memory Storage Strategy

**No Persistent Database** - Everything stored in memory/real-time:

In-Memory Data Structures:

```
battles: Map<battleId, BattleState>
votes: Map<battleId, Map<voterHash, VoteData>>
roasts: Map<battleId, RoastData[]>
connections: Map<socketId, ConnectionData>
```

Storage Strategy:
• All battle data exists only during the live session
• Audio files – temporary storage in Vercel blob with TTL or in-memory base64
• QR codes generated client-side; not stored
• Vote tallies aggregated real-time via WebSocket events
• Battle state synced across all connected clients via real-time updates

Session Management:
• Battles exist only while host is connected
• Automatic cleanup when all participants disconnect
• Ephemeral battle IDs that reset on server restart

---

## 6. Implementation Phases

1. Foundation  
   a. Scaffold Next.js monorepo, Tailwind, ShadCN.  
   b. Setup Zustand store slices.  
   c. Implement routing for `/`, `/battle/[id]`, `/vote/[id]`.  
   d. Setup in-memory data structures and real-time connections.

2. Core Gameplay (Offline)  
   a. Coin flip logic.  
   b. Round/timer controller.  
   c. AI roast fetch + on-screen rendering.  
   d. Local vote dummy UI.

3. Realtime Layer  
   a. Integrate Pusher/Ably; establish presence channel.  
   b. Wire vote events + optimistic UI.  
   c. Test concurrency with >100 simulated clients.

4. Audience Voting App  
   a. Build minimal PWA; offline fallback.  
   b. QR code generation and deep-linking.

5. Audio & Voice  
   a. Eleven Labs proxy + caching.  
   b. `<AudioPlayer>` component (lazy preload, single-instance policy).  
   c. Add voice/model selection UI.

6. Admin / Settings  
   a. Hidden drawer or `/admin` with toggles.  
   b. Persist selections; pass to Generation API.

7. Polishing & Responsive  
   a. Tailwind breakpoints for large display vs phone.  
   b. Accessibility (aria-live for screen readers).  
   c. Dark mode support via ShadCN theming.

8. Deployment & Observability  
   a. Vercel projects: main + voter; env vars for keys.  
   b. Logging (Vercel Analytics, Sentry).  
   c. Load test; tweak WS limits.

9. Launch & Feedback loop  
   a. Collect engagement metrics per battle.  
   b. Iterate on AI prompt templates and moderation.

---

## 7. Technical Considerations & Challenges

Realtime Scale  
• Pusher free tier tops at 100 concurrent; use Ably/Supabase for larger crowds.  
• Consider fallback to Server-Sent Events if WS blocked.

Vote Integrity  
• Avoid duplicate votes by fingerprint + cookie.  
• Implement exponential backoff & CAPTCHA after N votes/IP.  
• For auditorium Wi-Fi (single IP) rely on WebSocket connection IDs instead.

Latency  
• Vercel Edge for vote endpoints; in-memory aggregation for real-time tallies.  
• Sync every X votes instead of every request to reduce WS spam.

Audio Delays  
• Eleven Labs TTS ~1-2 s. Pre-request voice intro lines before showtime.  
• Play audio only on host device; mirror transcript on projector to avoid multi-device echo.

Prompt Safety  
• Use OpenAI Moderation; fallback roast if violation.

State Consistency  
• Round progresses only on server (BattleController API) to avoid divergent client timers.  
• Clients treat server as authoritative; local timers drift tolerated ±200 ms.

SEO / Shareability  
• `/battle/:id/replay` static generation for post-event recap.

Cost Management  
• Cache TTS outputs by hash(text+voice) to avoid re-billing.  
• Upfront token budget per battle.

---

Happy roasting!
