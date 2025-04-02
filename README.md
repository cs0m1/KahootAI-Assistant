# KahootAI Assistant 🎯

A Chrome extension that enhances your Kahoot experience by providing AI-powered answer suggestions through a minimalistic, non-intrusive floating indicator.

<div align="center">
  <img src="icon128.png" alt="KahootAI Assistant Logo" width="128" height="128">
</div>

## 🌟 Features

- **Smart Answer Indicator**: A subtle floating circle that shows likely correct answers through color coding
- **AI-Powered Analysis**: Utilizes Google's Gemini API for intelligent answer suggestions
- **Non-Intrusive Design**: Minimal interface that won't disrupt your Kahoot experience
- **Highly Customizable**:
  - Position (6 different locations)
  - Size (Small, Medium, Large)
  - Opacity control
  - Auto-hide with customizable delay
- **Universal Compatibility**: Works in both regular Kahoot games and challenge modes
- **Privacy Focused**: All processing happens locally, no data collection

## 🚀 Installation

### From Chrome Web Store
1. Visit the Chrome Web Store page (coming soon)
2. Click "Add to Chrome"
3. Follow the setup instructions

### Manual Installation
1. Download the latest release from the [Releases page](../../releases)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted directory

## ⚙️ Setup

1. After installation, the extension will automatically open the settings page
2. Get a Gemini API key:
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a new API key
   - Copy the key
3. Enter your API key in the extension settings
4. Customize display settings to your preference

## 📖 Usage

1. Join a Kahoot game or challenge
2. The extension automatically activates and shows the indicator
3. Color coding for answers:
   - 4-answer mode:
     - Red = Option 1
     - Blue = Option 2
     - Yellow = Option 3
     - Green = Option 4
   - 2-answer mode:
     - Blue = Option 1
     - Red = Option 2

## 🛠️ Development

### Prerequisites
- Node.js and npm
- Git
- Chrome browser

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/cs0m1/KahootAI-Assistant.git
   cd KahootAI-Assistant
   ```

2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project directory

3. Make your changes
   - The extension will automatically reload when you modify files
   - Test thoroughly with real Kahoot games

### Creating a Release
1. Update version in `manifest.json`
2. Push your changes to the main branch:
   ```bash
   git add .
   git commit -m "Update version to X.Y.Z"
   git push origin main
   ```
3. Create and push a new tag:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```
4. GitHub Actions will automatically:
   - Generate extension icons
   - Create a ZIP file
   - Create a GitHub release with the ZIP attached
   - Upload the ZIP as a workflow artifact

You can also manually trigger a build from the Actions tab on GitHub without creating a release.

## 🔒 Privacy & Security

- **Limited Scope**: Only activates on Kahoot.it domains
- **Local Storage**: API keys and settings stored locally in Chrome
- **Transparent Processing**: Uses Google's Gemini API for question analysis
- **No Data Collection**: We don't collect or store any user data
- **Open Source**: All code is open for review

## 💡 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
