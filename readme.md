# LLMTexter - Smart Text Rewriter

> A powerful browser extension that enhances text fields with AI-powered rewriting capabilities using local LLMs via Ollama.

## Features

- 🪄 **Instant AI Rewriting**: Add AI rewriting capabilities to any text input on any website
- 🏠 **Local Privacy**: Uses your local Ollama instance - no data sent to 3rd party services
- 🎭 **Multiple Styles**: Choose from various writing styles or create your own
- ⌨️ **Keyboard Shortcuts**: Quick access with customizable shortcuts
- 🔍 **Context Aware**: Understands context on supported sites (Twitter, Reddit, Gmail)
- 🛡️ **Site-Specific Handling**: Special optimizations for popular websites

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Install [Ollama](https://ollama.ai/) on your computer
3. Download a language model in Ollama (recommended: `llama3`)
4. Install the Smart Text Rewriter script
5. Make sure Ollama is running before using the script

## Usage

### Basic Usage

1. Click in any text field on any website
2. Look for the ✍️ button that appears next to the field
3. Click the button to rewrite your text using the last selected style
4. Right-click the button to choose a different writing style

### Keyboard Shortcuts

- `Alt+R`: Open settings panel
- `Alt+Shift+R`: Quick rewrite with last used style
- `Alt+1` through `Alt+9`: Quickly cycle through rewrite modes

### Available Rewrite Styles

- 🧑‍💼 Donald Trump
- 🎤 Theo Von
- 🔥 Joey Diaz
- 📚 Academic
- 😎 Casual Millennial
- ❤️ Guy looking for a girlfriend
- 🌶️ Adult / Explicit
- + Custom styles you create

## Configuration

Access the settings panel by pressing `Alt+R` or through the Tampermonkey menu.

### Settings Options

- Enable/Disable the script
- Select your Ollama model
- Configure the Ollama API endpoint
- Choose default rewrite mode
- Add custom rewrite modes
- Enable debug mode

## Creating Custom Rewrite Modes

1. Open the settings panel (`Alt+R`)
2. Click the "+ Add Custom Mode" button
3. Enter a name with an emoji (e.g., "🎸 Rock Star")
4. Write a prompt template that describes the style
5. Click "Save Mode"

## Troubleshooting

- **No rewrite button appears**: Make sure the script is enabled in Tampermonkey
- **Rewriting fails**: Check if Ollama is running at the configured endpoint
- **Slow responses**: Try using a smaller language model in Ollama

## Roadmap

See the [Roadmap](Roadmap.md) file for planned features and improvements including:
- UI Improvements (Dark Mode, Accessibility)
- Performance Optimizations
- Advanced LLM Integration
- Content Creation Tools

## Privacy

This extension processes all text locally on your machine using Ollama. No text is sent to any external servers besides your local Ollama instance.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.