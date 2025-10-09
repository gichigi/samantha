# Samantha

> _She reads the internet, out loud, just for you._

A text-to-speech reading app inspired by the movie "Her." Samantha converts web articles into natural-sounding audio using OpenAI's advanced neural voices. With a zero-text UI and no authentication required, it's designed to be universal, intuitive, and delightful.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

- 🎯 **Zero-Text UI** - Universal interface using only icons and numbers
- 🎙️ **Natural Voice** - Powered by OpenAI's advanced text-to-speech
- 🌐 **Any Article** - Extract and read content from any URL
- 🔓 **No Authentication** - No sign-ups, no tracking, just reading
- 📊 **Local Storage** - Everything stored locally, 3 articles per day
- 🎨 **Beautiful Design** - Warm, empathetic interface inspired by "Her"
- ♿ **Accessible** - Full screen reader support with ARIA labels

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (or npm)
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/gichigi/samantha.git
cd samantha

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key to .env.local

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start listening!

## 🎭 The Zero-Text Philosophy

Samantha's interface uses **no text** - only icons, numbers, and interactions. This isn't minimalism for its own sake. It's about:

- **Universal Design** - Works for everyone, regardless of language
- **Natural Interaction** - Like using a musical instrument
- **Focus on Content** - The article matters, not the UI
- **Pure Simplicity** - Removing complexity reveals clarity

Every icon, every number, every animation is carefully chosen to transcend words. Hover states and `aria-labels` provide context for those who need it, but the core experience speaks in a universal language.

## 🎨 Design Inspiration

Samantha's personality comes from the AI character in "Her" (2013):
- Warm and empathetic
- Present but not intrusive  
- Curious and genuinely interested
- Subtly witty, never sarcastic
- Patient and understanding

See [`BRAND_VOICE.md`](./BRAND_VOICE.md) for detailed design principles.

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Text-to-Speech**: OpenAI TTS API
- **Content Extraction**: Cheerio + Turndown
- **Storage**: localStorage (no database required)

## 📖 Usage

### Reading Sample Articles

Click any sample article card on the homepage. Each shows:
- An icon representing the topic
- A number (reading time in minutes)

Audio is generated on-demand and doesn't count toward your daily limit.

### Reading Custom Articles

1. Paste any article URL in the input field
2. Click the arrow button (→)
3. Wait for extraction and TTS generation
4. Listen!

**Daily Limit**: 3 custom articles per day (resets at midnight). Sample articles are unlimited.

### Viewing History

Click the clock icon in the navbar to see your reading history. All stored locally in your browser.

## 🔧 Configuration

### Environment Variables

Only one environment variable is required:

```env
OPENAI_API_KEY=your_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### Daily Limits

To change the daily article limit, edit `/services/local-usage-service.ts`:

```typescript
private static readonly DAILY_LIMIT = 3  // Change this number
```

### Voice Settings

Samantha uses OpenAI's `nova` voice by default. To change it, edit `/app/api/tts/route.ts`:

```typescript
const voice = body.voice || "nova"  // Options: alloy, echo, fable, onyx, nova, shimmer
```

## 🤝 Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines.

Quick tips:
- Keep the zero-text UI intact
- Add comprehensive `aria-label` attributes
- Follow Samantha's warm, empathetic personality
- Test with screen readers
- Write clear code comments

## 🐛 Troubleshooting

### "Daily limit reached"
Your local usage resets at midnight. To reset manually, open DevTools console:
```javascript
localStorage.removeItem('samantha_usage')
```

### TTS not working
Check that your OpenAI API key is set correctly in `.env.local` and you have credits in your account.

### Article extraction fails
Some websites block scraping. Try a different article or check the URL is accessible.

### No audio on mobile
Some mobile browsers require user interaction before playing audio. Tap the play button after loading.

## 📄 License

This project is licensed under the MIT License - see the [`LICENSE`](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the movie "Her" (2013)
- Powered by OpenAI's TTS API
- Built with Next.js and React
- UI components from Radix UI
- Icons from Lucide

## 🌟 Support

If you like Samantha, please:
- ⭐ Star this repository
- 🐛 Report bugs via [GitHub Issues](https://github.com/gichigi/samantha/issues)
- 💡 Suggest features via [GitHub Discussions](https://github.com/gichigi/samantha/discussions)
- 🤝 Contribute via Pull Requests

---

**Built with ❤️ for everyone who loves listening to the internet**

*"Sometimes I think I have felt everything I'm ever gonna feel. And from here on out, I'm not gonna feel anything new. Just lesser versions of what I've already felt." - Theodore Twombly, "Her"*
