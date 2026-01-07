<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--5.2-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/CodeMirror-6-D30707?style=for-the-badge&logo=codemirror&logoColor=white" alt="CodeMirror" />
</p>

<h1 align="center">✨ Markdown AI Editor</h1>

<p align="center">
  <strong>A beautiful, modern markdown editor with AI-powered enhancements</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

<p align="center">
  <img src="demo.png" alt="Markdown AI Editor Demo" width="900" />
</p>

---

## 🚀 Features

- **✍️ Rich Markdown Editing** - Full-featured CodeMirror 6 editor with syntax highlighting
- **👁️ Live Preview** - Real-time rendered preview with synchronized scrolling
- **🤖 AI Enhancement** - GPT-5.2 powered text improvements for selections or entire documents
- **🎨 Beautiful UI** - Modern glassmorphism design with dark/light theme support
- **⚡ Lightning Fast** - Built with Vite for instant hot reload
- **📱 Responsive** - Works seamlessly on desktop and mobile
- **💾 Auto-save** - Never lose your work with local storage persistence
- **📤 Export** - Export to PDF with custom styling options

## 🎯 AI Capabilities

| Feature | Description |
|---------|-------------|
| ✨ **Enhance Selection** | Improve clarity, grammar, and style of selected text |
| 📄 **Enhance Document** | AI-powered improvements for your entire document |
| 🎯 **Quick Actions** | One-click prompts for common improvements |
| 💬 **Custom Instructions** | Tell the AI exactly what you want |

## 📸 Preview

The editor features a split-pane layout with:
- **Left**: CodeMirror editor with line numbers, syntax highlighting, and formatting toolbar
- **Right**: Live rendered markdown preview with GFM support
- **Floating toolbar**: Quick formatting when text is selected

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **OpenAI API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/markdown-ai-editor.git
   cd markdown-ai-editor
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Configure environment**
   ```bash
   # In backend/, set your OpenAI API key
   export OPENAI_API_KEY=your_api_key_here
   ```

### Running the App

You'll need **two terminals** to run both the frontend and backend:

**Terminal 1 - Backend Server:**
```bash
cd backend
node server.js
```
> 🚀 Backend runs on `http://localhost:3001`

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```
> ✨ Frontend runs on `http://localhost:5173`

### Quick Start (One-liner)

```bash
# From project root - run both servers
cd backend && node server.js & cd frontend && npm run dev
```

---

## 📁 Project Structure

```
MarkdownEditor/
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Editor.tsx           # CodeMirror editor
│   │   │   ├── Preview.tsx          # Markdown preview
│   │   │   ├── AIEnhanceDialog.tsx  # AI enhancement modal
│   │   │   ├── Toolbar.tsx          # Formatting toolbar
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   ├── styles/          # Global CSS
│   │   └── App.tsx          # Main app component
│   └── package.json
│
├── backend/                 # Express.js API server
│   ├── server.js           # API endpoints & OpenAI integration
│   └── package.json
│
└── README.md
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + K` | Insert link |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Save |
| `Escape` | Close dialogs |

---

## 🎨 Themes

Toggle between **Dark** and **Light** themes using the theme button in the toolbar. The editor automatically adapts:

- 🌙 **Dark Mode** - Easy on the eyes for late-night writing
- ☀️ **Light Mode** - Clean and bright for daytime use

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Editor** | CodeMirror 6 |
| **Markdown** | react-markdown, remark-gfm |
| **Styling** | CSS3 with CSS Variables |
| **Backend** | Express.js, Node.js |
| **AI** | OpenAI GPT-5.2 |

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/enhance-smart` | POST | AI enhancement (selection or document mode) |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ and ✨ AI magic by <a href="https://optimalversion.io">OptimalVersion.io</a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a>
</p>
