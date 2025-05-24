
# 🧠 Tampermonkey LLM Assistant Roadmap

## 🎯 Project Goal

Enhance browsing and writing with automatic text rewriting using selected LLMs (via Ollama), activated contextually on textboxes. Provide user-friendly UI to configure and control behavior, including:

* Rewriting modes (grammar, factuality, persona mimicry, etc.)
* Bionic Reading Mode
* Persistent model and settings storage
* Light/Dark theme toggle

---

## 📁 Project Structure

```
tampermonkey-llm-assistant/
├── script.user.js         # Main Tampermonkey script
├── ui.html                # Settings/config HTML
├── styles.css             # Custom styles
├── utils.js               # Utilities for storage, DOM, debounce, etc.
├── ollama.js              # Ollama API interfacing
├── config.json            # Optional remote defaults
└── README.md              # Project docs
```

---

## 🛠️ Development Phases

### Phase 1: 📦 Basic Setup

* [ ] Initialize Tampermonkey script
* [ ] Inject custom UI into page (fixed icon/button bottom right)
* [ ] Toggle UI open/close

---

### Phase 2: ⚙️ Settings Panel (Persistent)

* [ ] Save & load settings to `localStorage`
* [ ] Select Ollama model (dropdown w/ examples: `mistral`, `llama2`, `llava`)
* [ ] Toggle switches:

  * [ ] "Auto Rewrite Input"
  * [ ] "Bionic Reading Mode"
  * [ ] "Dark Mode"

---

### Phase 3: ✍️ Rewrite Engine

* [ ] Detect focus on `<input>` or `<textarea>`
* [ ] Monitor and intercept user text before sending
* [ ] Apply selected LLM rewrite mode:

  * [ ] ✅ Spelling & Grammar
  * [ ] ✅ Don’t Lie Mode (filter exaggeration)
  * [ ] ✅ Only Facts Mode (informational tone)
  * [ ] ✅ Imitate Persona (e.g., Trump, Elon Musk, Obama)

    * Use prompt formatting:
      `"Rewrite this as if spoken by {persona}, keeping same tone/length"`
* [ ] Enforce length limits (e.g., +10-15% max)
* [ ] Replace input field text with modified version

---

### Phase 4: 🧠 Ollama LLM Integration

* [ ] Interface with local Ollama API
* [ ] Allow model selection via UI
* [ ] Inject prompt & input to Ollama, receive response
* [ ] Handle timeouts/errors gracefully
* [ ] Optionally queue prompts

---

### Phase 5: 👓 Bionic Reading Mode

* [ ] Toggle Bionic Reading via CSS: `<b>bold</b> first part of each word`
* [ ] Apply on page load or on-demand
* [ ] Respect user's dark/light preference

---

### Phase 6: 🌙 Dark/Light Mode

* [ ] Add dark/light toggle in settings
* [ ] Store preference in `localStorage`
* [ ] Apply corresponding CSS themes

---

### Phase 7: 🚀 Usability Polish

* [ ] Add hotkey support (e.g., `Ctrl+Shift+R` to manually rewrite)
* [ ] Optionally add toolbar tooltip on hover
* [ ] Support feedback log (for debugging/usage)

---

## 💡 Sample LLM Prompts

```markdown
## Persona Prompt
"Rewrite the following text in the voice of {persona}. Match tone and length. Be concise."
Input: "Hey, let’s catch up later!"
→ "Believe me, we’re gonna have a fantastic time—later!"

## Don't Lie Mode
"Remove exaggerations, hyperbole or speculation from this statement."

## Only Facts Mode
"Convert the following statement into an objective factual tone."

## Grammar Fix
"Fix grammar, spelling, and punctuation. Retain meaning and voice."
```

---

## 🧰 Persistent Storage Schema (`localStorage`)

```json
{
  "ollama_model": "llama2",
  "rewrite_mode": "persona",
  "persona_name": "Donald Trump",
  "bionic_mode": true,
  "dark_mode": false,
  "auto_rewrite": true
}
```

---

## 🔐 Privacy and Ethics Notes

* No data is sent externally without user config
* Rewrites should always preserve meaning and tone unless configured otherwise
* Avoid impersonation of real people unless used responsibly (e.g., parody)

---

## 📝 TODO List

* [ ] Create base UI
* [ ] Build Ollama prompt formatter
* [ ] Connect textarea watcher
* [ ] Integrate rewrite + LLM
* [ ] Style everything with Tailwind/CSS
* [ ] Add settings backup/export

---
