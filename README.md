# 🧠 LifeKit.AI — Your AI Life Admin Co-Pilot

<div align="center">
  
  **[🚀 Try Live Demo →](https://cursor-hackthon-life-maxxing-ai.vercel.app/)**
  
  **Stop dreading the boring stuff. Let AI handle your life admin.**
  
  [![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cursor-hackthon-life-maxxing-ai.vercel.app/)
  
  [Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [GitHub](https://github.com/DaneshIV/CursorHackthon_LifeMaxxingAI)
  
</div>

---

## 🏆 Sponsor Tracks

<div align="center">
  
  [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
  [![Anthropic Claude](https://img.shields.io/badge/Anthropic_Claude-FF6B6B?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
  [![Mobbin](https://img.shields.io/badge/Mobbin-000000?style=for-the-badge&logo=mobbin&logoColor=white)](https://mobbin.com)
  [![Convex](https://img.shields.io/badge/Convex-FF6B6B?style=for-the-badge&logo=convex&logoColor=white)](https://convex.dev)
  [![Rytbank](https://img.shields.io/badge/Rytbank-0066CC?style=for-the-badge&logo=bank&logoColor=white)](https://rytbank.com)
  [![CodeRabbit](https://img.shields.io/badge/CodeRabbit-FF6B6B?style=for-the-badge&logo=github&logoColor=white)](https://coderabbit.ai)
  [![Cursor](https://img.shields.io/badge/Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white)](https://cursor.sh)
  
</div>

---

## ✨ Features

### 💬 Smart Life-Admin Chat Assistant
- Natural language conversations powered by **Claude AI**
- Get help with bills, taxes, emails, budgets, and more
- Quick prompts for common tasks
- Category-based suggestions (Finances, Housing, Career, Health)
- **Streaming responses** for real-time feedback

### 📄 Document Scanner + AI Insights
- Upload bills, contracts, receipts, letters
- **Automatic text extraction** (PDF, images, text files)
- AI-powered analysis returns:
  - 📝 Summary
  - ✅ Action items
  - 📅 Important dates
  - ⚠️ Urgency level (urgent/important/low-risk/informational)
  - 💡 Recommended next steps

### 📊 Insights Dashboard
- All analyzed documents in one place
- Filter by urgency level
- Search across all documents
- **Export insights** to markdown
- **Share** action items
- **Persistent storage** (survives page refresh)

### 🎨 Beautiful, Modern UI
- Warm, approachable design (terracotta + cream palette)
- Smooth animations with Framer Motion
- Fully responsive (mobile-first)
- Glassmorphism effects
- Micro-interactions throughout

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lifekit-ai.git
cd lifekit-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude | Yes |

---

## 🛠 Tech Stack

### 🖼️ Tech Stack Preview

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Convex-FF6B6B?style=for-the-badge&logo=convex&logoColor=white" alt="Convex" />
  <img src="https://img.shields.io/badge/Anthropic_Claude-FF6B6B?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic Claude" />
  <img src="https://img.shields.io/badge/FramerMotion-EA4C89?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Radix_UI-000000?style=for-the-badge&logo=radixui&logoColor=white" alt="Radix UI" />
  <img src="https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

### Frontend
- **Next.js 16** — React framework with App Router
- **React 19** — Latest React with modern features
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Utility-first styling
- **Framer Motion** — Smooth animations
- **Radix UI** — Accessible, unstyled components
- **shadcn/ui** — Beautiful component library
- **Lucide Icons** — Clean iconography

### Backend
- **Convex** — Real-time database and backend functions
- **Next.js API Routes** — Serverless endpoints
- **Anthropic Claude (claude-sonnet-4-20250514)** — AI language model
- **Claude Vision API** — Document and image analysis

### Features
- **Streaming responses** — Real-time chat feedback
- **Real-time synchronization** — Data syncs instantly via Convex
- **Vision API** — Extract text from PDFs and images
- **Mobile-responsive** — Works on all devices

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Streaming chat endpoint
│   │   └── analyze-document/  # Document analysis endpoint
│   ├── page.tsx           # Main app with tabs
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles + theme
├── components/
│   ├── chat-assistant.tsx # Chat interface
│   ├── document-scanner.tsx # File upload + results
│   ├── insights-panel.tsx # Dashboard view
│   └── ui/               # ShadCN components
├── hooks/
│   └── use-local-storage.ts # Persistence hook
└── lib/
    └── utils.ts          # Utility functions
```

---

## 🎯 Hackathon Tracks

This project was built for a 24-hour hackathon and integrates the following sponsor tracks:

- ✅ **Vercel** — Hosting + Serverless functions
- ✅ **Anthropic Claude** — Core LLM for chat and document analysis
- ✅ **Convex** — Real-time database and backend infrastructure
- ✅ **Mobbin** — UI/UX design inspiration
- ✅ **Rytbank** — Financial services integration
- ✅ **CodeRabbit** — Code review and quality assurance
- ✅ **Cursor** — AI-powered development environment

---

## 🔮 Future Enhancements

- [ ] Voice input with ElevenLabs
- [ ] Task reminders with notifications
- [ ] Email integration (send drafted emails)
- [ ] Calendar sync for important dates
- [ ] Multi-document analysis
- [ ] Memory/context across sessions with Groq embeddings

---

## 👩‍💻 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## 📄 License

MIT License — feel free to use this for your own projects!

---

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [Vercel](https://vercel.com) for hosting
- [ShadCN](https://ui.shadcn.com) for beautiful components
- Built with ♥ during a 24-hour hackathon

---

<div align="center">
  <strong>Made with ☕ and determination</strong>
  <br />
  <sub>Because adulting is hard, but it doesn't have to be.</sub>
  <sub> UWU </sub>
</div>
