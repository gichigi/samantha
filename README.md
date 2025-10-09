# Samantha

> _She reads the internet, out loud, just for you._

A text-to-speech reading app inspired by the movie "Her." Samantha converts web articles into natural-sounding audio using OpenAI's advanced neural voices. With a zero-text UI and no authentication required, it's designed to be universal, intuitive, and delightful.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

- 🎯 **Zero-Text UI** - Universal interface using only icons and numbers
- 🎙️ **Natural Voice** - Powered by OpenAI's advanced text-to-speech
- 🎭 **Enhanced Reading Experience** - Samantha adds warmth and personality to make articles more engaging
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
- **Text Preprocessing**: GPT-4o-mini for personality enhancement
- **Content Extraction**: Firecrawl API + Cheerio fallback
- **Storage**: localStorage (no database required)

## 🏗️ Architecture

Samantha is built on a simple, local-first architecture:

- **Next.js 15 App Router** - Modern React framework
- **No Authentication** - Completely open, no sign-ups
- **Local Storage** - Usage tracking and history stored in browser
- **OpenAI TTS** - Neural voice generation
- **GPT-4o-mini** - Preprocessing for natural, personality-rich speech
- **Firecrawl** - Reliable content extraction with fallback

All user data stays on their device. The only external API calls are to OpenAI for TTS generation and Firecrawl for content extraction.

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

### 🎭 The Samantha Experience

Samantha doesn't just read articles—she enhances them for a better listening experience:

- **Warm Introductions**: Every article starts with a friendly, engaging introduction
- **Natural Transitions**: Smooth conversational bridges between sections
- **Content-Aware Tone**: Adapts her personality based on the type of content (news, guides, essays)
- **Preserved Meaning**: All original facts and information remain unchanged
- **Enhanced Flow**: Complex sentences are broken down for better audio comprehension

*Think of it as having a thoughtful friend read to you, making even dry content feel engaging and worthwhile.*

## 🔍 Content Extraction

Samantha uses a sophisticated content extraction system to reliably read articles from any URL.

### Smart Extraction Strategy

- **Firecrawl Integration** - Premium extraction service for high-quality content
- **Automatic Fallback** - Basic extraction when Firecrawl unavailable
- **Markdown Processing** - Clean, readable text format

### Content Protection

- **URL Validation** - Client and server-side validation
- **File Type Blocking** - Prevents PDFs, documents, and archives (too expensive to process)
- **Word Limit** - Maximum 10,000 words per article with clear feedback
- **Smart Errors** - Helpful messages with actionable suggestions

### Blocked File Types

For cost and performance reasons, these file types are not supported:
- PDFs (`.pdf`)
- Documents (`.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`)
- Archives (`.zip`, `.rar`, `.tar`, `.gz`, `.7z`)

## 🔧 Configuration

### Environment Variables

Only one environment variable is required:

```env
OPENAI_API_KEY=your_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### Personality & Voice

Samantha's warm, curious personality is defined in:
- [`BRAND_VOICE.md`](./BRAND_VOICE.md) - Overall design and UX personality
- [`BRAND_VOICE_TTS.md`](./BRAND_VOICE_TTS.md) - Text-to-speech specific personality

The preprocessing system uses GPT-4o-mini to enhance articles with natural transitions, warm introductions, and content-aware adaptations. All enhancements preserve the original meaning while making content more engaging to listen to.

### Daily Limits

To change the daily article limit, edit `/services/local-usage-service.ts`:

```typescript
private static readonly DAILY_LIMIT = 3  // Change this number
```


## 🚀 Future Enhancements

Samantha is designed to be extensible and community-friendly. Here are some exciting directions for future development:

### 🎭 Dynamic Personality Features

**Content-Aware Personality Variations**
- Automatically adjust Samantha's tone based on article type (news vs essays vs tutorials)
- Seasonal personality touches (warmer in winter, more energetic in spring)
- Reading mood detection and adaptation

**Contextual Personality Elements**
- Time-of-day awareness (gentle morning voice, relaxed evening tone)
- User preference learning (remembers if you like more/less personality)

**Advanced Voice Customization**
- Multiple personality presets (Professional Samantha, Cozy Samantha, Energetic Samantha)
- Voice emotion matching content sentiment
- Dynamic pacing based on content complexity

### 🎯 Smart Features

**Intelligent Content Processing**
- Auto-summarization for long articles
- Key point highlighting and emphasis

**Enhanced Accessibility**
- Visual reading progress indicators
- Customizable playback controls
- Voice-controlled navigation

**Social & Sharing**
- Reading lists and collections
- Article recommendations from friends
- Community-curated reading lists

### 🛠️ Technical Improvements

**Performance & Reliability**
- Offline reading mode with pre-downloaded articles
- Background article processing
- Smart caching and prefetching

**Platform Expansion**
- Mobile app versions (iOS/Android)
- Browser extension for one-click reading
- Desktop app with system integration

**Developer Experience**
- Plugin system for custom personality modules
- API for third-party integrations
- Comprehensive testing suite

### 🌍 Community Features

**Localization**
- Multi-language support with native personality adaptations
- Cultural context awareness
- Regional voice preferences

**Open Source Ecosystem**
- Community-contributed personality modules
- Shared article collections
- Plugin marketplace

---

**Want to contribute?** Pick any feature above and start building! See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines on getting started.

## 🤝 Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines.

Quick tips:
- Keep the zero-text UI intact
- Add comprehensive `aria-label` attributes
- Follow Samantha's warm, empathetic personality (see [`BRAND_VOICE.md`](./BRAND_VOICE.md) and [`BRAND_VOICE_TTS.md`](./BRAND_VOICE_TTS.md))
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
