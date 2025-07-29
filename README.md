# 🎭 RoastBot - AI vs Human Roast Battle

An interactive 3-round roast battle game where humans and AI compete to create the funniest roasts, with live audience voting via QR codes. Built for hackathons and live events!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd RoastBot
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
# Edit .env.local and add your OpenAI API key
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open the app:**
- Main game screen: http://localhost:3000
- Voting page: http://localhost:3000/vote

## 🎮 How to Play

### For the Host:
1. **Start a Round**: Enter a topic to roast (or use random topic)
2. **Human Roast**: Type in the human contestant's roast
3. **AI Roast**: Click to generate an AI roast using GPT-4o
4. **Open Voting**: Allow audience to vote via QR code
5. **Close Voting**: End voting and see results
6. **Next Round**: Continue to next round (3 rounds total)

### For the Audience:
1. **Scan QR Code**: Use phone camera to scan the QR code
2. **Read Roasts**: Compare the human vs AI roasts
3. **Vote**: Choose which roast was funnier
4. **Watch Results**: See live vote tallies on the main screen

## 🏗️ Architecture

- **Frontend**: React + Next.js + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes
- **AI**: OpenAI GPT-4o for roast generation
- **State**: In-memory JavaScript store (no database required)
- **Real-time**: Polling-based vote updates
- **QR Codes**: `qrcode.react` library

## 📁 Project Structure

```
RoastBot/
├── components/           # React components
│   ├── GameScreen.tsx   # Main game interface
│   ├── VotingBar.tsx    # Vote visualization
│   ├── QRCodeDisplay.tsx # QR code component
│   └── WinnerBanner.tsx # Winner announcements
├── lib/
│   └── voteStore.ts     # In-memory game state
├── pages/
│   ├── index.tsx        # Main game screen
│   ├── vote.tsx         # Audience voting page
│   └── api/             # API endpoints
├── utils/
│   └── gptPrompt.ts     # AI prompt utilities
└── styles/
    └── globals.css      # Global styles
```

## 🛠️ Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check
```

## 🎯 Game Features

### ✅ Core Features
- ✅ 3-round roast battle system
- ✅ Human vs AI roast competition
- ✅ GPT-4o powered AI roasts
- ✅ QR code audience voting
- ✅ Real-time vote visualization
- ✅ Round winners and final winner
- ✅ Mobile-optimized voting interface

### 🚀 Stretch Goals (If Time Allows)
- 🎙️ Text-to-speech for AI roasts (Eleven Labs)
- 🎉 Confetti animations for winners
- 🧠 Themed roast rounds (pirate, Shakespeare, etc.)
- 👤 Vote deduplication per device
- 📊 Vote history and analytics

## 🎨 Design System

### Colors
- **Roast Orange**: `#FF6B35` - Primary brand color
- **Roast Purple**: `#7209B7` - Secondary accent
- **Roast Dark**: `#1A1A1A` - Background dark

### Components
- **VotingBar**: Real-time vote spectrum visualization
- **QRCodeDisplay**: Mobile-friendly QR code with instructions
- **WinnerBanner**: Animated winner announcements
- **GameScreen**: Main orchestration component

## 🔧 API Endpoints

- `POST /api/generate-roast` - Generate AI roast using GPT-4o
- `POST /api/submit-vote` - Submit audience vote
- `GET /api/get-votes` - Get current vote tallies and game state  
- `POST /api/game-control` - Control game flow (start/next/reset)

## 📱 Mobile Experience

The voting page is optimized for mobile devices:
- Touch-friendly large buttons
- Responsive design for all screen sizes
- Auto-updating content without refresh
- Offline-first QR code scanning

## 🎭 Roast Topics

Built-in random topics include:
- Pineapple on pizza
- WiFi that's always slow
- Meetings that could be emails
- People who don't use turn signals
- And many more...

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Other Platforms
- Netlify: `npm run build` then deploy `/out` folder
- Railway: Connect GitHub repo
- Heroku: Add Node.js buildpack

### Environment Variables
Make sure to set `OPENAI_API_KEY` in your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🎉 Hackathon Ready!

This project is specifically designed for hackathons:
- ⚡ **Fast setup**: Get running in under 5 minutes
- 🎯 **Demo ready**: Perfect for presentations
- 📱 **Audience interactive**: Everyone can participate
- 🤖 **AI powered**: Uses cutting-edge GPT-4o
- 🏆 **Competition format**: Built-in winner system

## 🙏 Acknowledgments

- OpenAI for GPT-4o API
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling
- React QR Code library
- The entire open source community

---

**Made with ❤️ for hackathons and live events!**

🎭 May the best roast win! 🤖 