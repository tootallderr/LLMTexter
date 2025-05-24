# 🧠 Tampermonkey LLM Assistant

A powerful Tampermonkey userscript that enhances your browsing and writing experience with automatic text rewriting using local LLMs via Ollama.

## ✨ Features

- **🎯 Smart Text Rewriting**: Multiple rewrite modes including grammar correction, fact-checking, and persona imitation
- **🧠 Local LLM Integration**: Works with Ollama models (Llama 2, Mistral, LLaVA, Code Llama)
- **👁️ Bionic Reading Mode**: Enhances reading speed by bolding the first part of each word
- **🌙 Dark/Light Theme**: Toggle between themes for comfortable usage
- **⚡ Auto & Manual Modes**: Automatic rewriting on text entry or manual activation
- **🎭 Persona Imitation**: Write in the style of famous personalities
- **💾 Persistent Settings**: All preferences saved locally
- **⌨️ Keyboard Shortcuts**: Quick access with Ctrl+Shift+R

## 🚀 Installation

### Prerequisites

1. **Install Ollama**: Download and install [Ollama](https://ollama.ai/) on your local machine
2. **Pull Models**: Run these commands in your terminal:
   ```bash
   ollama pull llama2
   ollama pull mistral
   ollama pull llava
   ```
3. **Start Ollama**: Ensure Ollama is running (`ollama serve`)

### Install the Userscript

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Copy the contents of `script.user.js`
3. Open Tampermonkey Dashboard → Create new script
4. Paste the code and save
5. The script will automatically run on all websites

## 🎮 Usage

### Getting Started

1. **Activate**: Click the 🧠 brain icon in the bottom-right corner of any webpage
2. **Configure**: Set your preferred Ollama model and rewrite mode
3. **Use**: Focus on any text input, textarea, or contenteditable element

### Rewrite Modes

- **Grammar & Spelling**: Fixes grammatical errors and typos while preserving meaning
- **Don't Lie Mode**: Removes exaggerations, hyperbole, and speculation
- **Facts Only**: Converts text to objective, factual tone
- **Persona Imitation**: Rewrites in the style of selected personalities

### Available Personas

- Donald Trump
- Elon Musk
- Barack Obama
- Shakespeare
- Yoda

### Controls

- **Auto Rewrite**: Automatically processes text when you press Enter or Tab
- **Manual Rewrite**: Click the "Rewrite Selected Text" button or use Ctrl+Shift+R
- **Bionic Reading**: Toggle enhanced reading mode for the entire page
- **Dark Mode**: Switch between light and dark themes

## ⚙️ Settings

All settings are automatically saved to your browser's localStorage:

```json
{
  "ollama_model": "llama2",
  "rewrite_mode": "grammar",
  "persona_name": "Donald Trump",
  "bionic_mode": false,
  "dark_mode": false,
  "auto_rewrite": false,
  "ollama_url": "http://localhost:11434"
}
```

## 🔧 Configuration

### Ollama Models

The script supports any Ollama model. Default options include:
- **llama2**: General purpose, good balance of speed and quality
- **mistral**: Fast and efficient for most tasks
- **llava**: Vision-language model (experimental)
- **codellama**: Optimized for code and technical writing

### Custom Ollama URL

If your Ollama instance runs on a different port or host, you can modify the `ollama_url` in the settings.

## 🎯 Examples

### Grammar Correction
**Input**: "this is a example of bad grammer and spelling mistaks"
**Output**: "This is an example of bad grammar and spelling mistakes"

### Don't Lie Mode
**Input**: "This is literally the best product ever created in human history!"
**Output**: "This is a high-quality product that performs well"

### Persona Imitation (Trump)
**Input**: "The meeting went well and we accomplished our goals"
**Output**: "Believe me, the meeting was tremendous - we got so much done, more than anyone thought possible!"

## 🛠️ Technical Details

### Architecture

The script uses a modular design with these key components:

- **LLMAssistant Class**: Main controller managing state and UI
- **Settings Management**: Persistent storage with localStorage
- **UI System**: Dynamic panel with real-time updates
- **Text Processing**: Smart text detection and replacement
- **Ollama Integration**: RESTful API communication
- **Theme System**: CSS-based dark/light mode switching

### Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Edge
- ✅ Safari (with Tampermonkey)

### Performance

- Minimal impact on page load
- Efficient text processing with debouncing
- Non-blocking API calls
- Smart text node detection

## 🔒 Privacy & Security

- **No External Data**: All processing happens locally via Ollama
- **No Tracking**: No analytics or data collection
- **Secure Storage**: Settings stored only in browser localStorage
- **Optional Processing**: Manual control over what text gets processed

## 🐛 Troubleshooting

### Common Issues

1. **"Ollama API error"**: Ensure Ollama is running (`ollama serve`)
2. **"No text field selected"**: Click in a text input before rewriting
3. **Slow processing**: Try a smaller/faster model like Mistral
4. **Settings not saving**: Check browser localStorage permissions

### Debug Mode

Open browser console and type `window.LLMAssistant` to inspect the assistant instance.

## 🚧 Development

### Project Structure
```
tampermonkey-llm-assistant/
├── script.user.js         # Complete Tampermonkey script
├── README.md              # This documentation
└── config.json            # Default configuration
```

### Adding New Features

The script is designed to be easily extensible:

1. **New Rewrite Modes**: Add to `buildPrompt()` method
2. **New Personas**: Extend the persona dropdown options
3. **New Models**: Add to the model selection dropdown
4. **UI Enhancements**: Modify the `createUI()` and `injectStyles()` methods

## 📝 Changelog

### v1.0 (Initial Release)
- Complete implementation of all roadmap features
- Grammar, fact-checking, and persona rewrite modes
- Bionic reading mode with dynamic text processing
- Dark/light theme switching
- Persistent settings storage
- Keyboard shortcuts and auto-rewrite functionality
- Comprehensive error handling and user feedback

## 🤝 Contributing

This is a self-contained Tampermonkey script. To contribute:

1. Fork and modify the script
2. Test thoroughly across different websites
3. Submit improvements via pull request

## 📄 License

This project is open source. Use responsibly and respect website terms of service.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local LLM infrastructure
- [Tampermonkey](https://www.tampermonkey.net/) for userscript platform
- The open source AI community for model development
