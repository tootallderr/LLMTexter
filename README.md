# ✅ Tampermonkey Smart Text Rewriter

A userscript that enhances all text fields with rewrite functionality using LLMs, customizable modes, and a slick UI.

---

## 📌 Core Features

- [x] Detect all text input areas (`textarea`, `input[type="text"]`, `contenteditable`)
- [x] Inject a small rewrite button next to each text box
- [x] Add a toggleable settings panel UI
- [x] Select rewrite mode from UI dropdown
- [x] Rewrite text in the selected style using LLM API
- [x] Save last-used mode per text box (persistent)
- [x] Hide/show rewrite button based on settings
- [x] Include LLM status indicator (e.g., Connected / Error)
- [x] Display debug info (API logs, errors, etc.)
- [x] Allow user to enable/disable the whole script on a page

---

## 🎭 Rewrite Modes

- [x] 🧑‍💼 Donald Trump (Bold, self-assured, uses superlatives, simple language, often repeats phrases for emphasis, adds humor with exaggeration)
- [x] 🎤 Theo Von (Southern charm, quirky analogies, offbeat humor, conversational, uses unexpected metaphors)
- [x] 🔥 Joey Diaz (Raw, energetic, uses strong language, streetwise humor, direct and unfiltered, often includes personal anecdotes)
- [x] 📚 Academic (clean, professional, formal tone, precise vocabulary, well-structured sentences)
- [x] 😎 Casual Millennial (relaxed, uses slang and emojis, conversational, friendly, pop culture references)
- [x] ❤️ Guy looking for a girlfriend (flirty, lighthearted, sincere, a bit self-deprecating, playful compliments)
- [x] 🌶️ Adult / Explicit (mature themes, direct, uses explicit language, not suitable for all audiences)
- [x] 🕵️ Fact Check / Correct Misinformation (objective, cites sources, corrects errors, neutral and informative)
- [x] 🤡 Make Opponent's Point Look Silly (sarcastic, uses irony, highlights flaws humorously, playful ridicule)
- [x] 🌟 Overshadow with a Stronger Argument (confident, assertive, presents superior logic, persuasive tone)
- [x] 🤝 Diplomatic / Neutral Tone (balanced, non-confrontational, seeks common ground, respectful)
- [x] 🧑‍🎨 Creative / Playful Rewrite (imaginative, uses wordplay, whimsical, fun and engaging)
- [x] 🧑‍🏫 Simplify for Kids (simple words, short sentences, clear explanations, friendly tone)
- [x] 🧑‍🔬 Technical / Jargon-heavy (uses domain-specific terminology, detailed, assumes expert audience)
- [x] 🧑‍🎤 Sarcastic / Satirical (mocking, uses irony and exaggeration, witty, exposes absurdities)
- [x] ➕ Add Custom Mode (via settings)

---

## 💾 Data & Persistence

- [x] Save user-selected mode for each input
- [x] Store settings in `GM_setValue` / `localStorage`
- [x] Load and apply saved config on script init

---

## 🔧 Developer Tools

- [x] Enable "debug mode" via settings
- [x] Show logs for rewrite requests/responses
- [x] Toggle verbose/error-only logging
- [x] Developer-only panel toggle

---

## 🧪 Integration & Compatibility

- [x] Works with static pages
- [x] Supports dynamically loaded inputs (via MutationObserver)
- [x] Compatible with major sites (Twitter, Reddit, Gmail, etc.)
- [x] Lightweight and non-intrusive

---

## 🚀 Dev Environment

- [x] Develop using **VS Code** (Agent Mode)
- [x] Modular script architecture (UI, detection, rewrite logic)
- [x] Easy API integration (OpenAI / Local LLM / Proxy server)

---

## 🧱 Stretch Goals

- [x] Enable custom rewrite prompt templates per mode
- [x] Keyboard shortcut for quick rewrite
- [x] Allow tagging of inputs to exclude/include
- [x] Cloud sync for user settings (optional)
- [x] Support for local LLMs via Ollama

---

> Built with ❤️ for fun, productivity, and questionable humor.

## 📝 Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click [here](https://raw.githubusercontent.com/yourusername/smart-text-rewriter/main/src/smart-text-rewriter.user.js) to install the script
3. Configure your API key in the Tampermonkey settings

## 🚀 Usage

### Basic Usage
1. Click the ✍️ button next to any text field
2. Select a rewrite mode from the dropdown
3. Watch your text transform to the selected style!

### Keyboard Shortcuts
- **Alt+R**: Rewrite with last used mode
- **Alt+Shift+R**: Open mode selection dropdown
- **Alt+Shift+S**: Open settings panel

### LLM Requirements
- **Ollama**: Use local LLM models running on your own machine (free and private)
- Make sure Ollama is running on your machine (default: http://localhost:11434)

## ⚙️ Configuration

Access the settings panel through the Tampermonkey menu or by clicking the "Smart Text Rewriter Settings" option.

### Ollama Settings
- Endpoint URL: Your Ollama server URL (default: http://localhost:11434/api/generate)
- Model: Select from available models on your Ollama server
- Refresh Models: Fetch the latest available models from your Ollama server

### General Settings
- Default Mode: The rewrite style to use by default
- Show/Hide button: Toggle visibility of the rewrite buttons
- Debug mode: Show detailed logs for development

## 🧠 Creating Custom Modes

1. Open the settings panel
2. Fill in the "Custom Rewrite Mode" section
3. Click "Add Custom Mode"
4. Your new mode will appear in the dropdown!
