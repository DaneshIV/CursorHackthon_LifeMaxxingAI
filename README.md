# 🧠 AdultingOS — Your AI Life Admin Co-Pilot

<div align="center">
  <img src="public/og-image.png" alt="AdultingOS Banner" width="800" />
  
  **Stop dreading the boring stuff. Let AI handle your life admin.**
  
  [Live Demo](#) • [Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack)
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
git clone https://github.com/yourusername/adulting-os.git
cd adulting-os

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

### Frontend
- **Next.js 16** — React framework with App Router
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Utility-first styling
- **Framer Motion** — Smooth animations
- **ShadCN UI** — Beautiful, accessible components
- **Lucide Icons** — Clean iconography

### Backend
- **Vercel Serverless Functions** — API routes
- **Claude AI (claude-sonnet-4-20250514)** — Language model
- **pdf-parse** — PDF text extraction

### Features
- **Streaming responses** — Real-time chat feedback
- **LocalStorage persistence** — Insights survive refresh
- **Vision API** — Extract text from images
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

This project was built for a 24-hour hackathon and integrates:

- ✅ **Vercel** — Hosting + Serverless functions
- ✅ **Claude AI** — Core LLM for chat and analysis
- 🔄 **Groq** — (Optional) Fast embeddings for memory
- 🔄 **ElevenLabs** — (Optional) Voice-to-task feature

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
</div>
