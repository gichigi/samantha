# Contributing to Samantha

Thanks for your interest in contributing! Samantha is inspired by the movie "Her" and aims to create a warm, empathetic reading experience with a zero-text UI.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/samantha.git`
3. Install dependencies: `pnpm install`
4. Create a `.env.local` file with your OpenAI API key
5. Start the dev server: `pnpm dev`

## Development Philosophy

### Zero-Text UI
Samantha uses only icons and numbers in its interface. When adding features:
- Use universal icons that transcend language
- Add comprehensive `aria-label` attributes for accessibility
- Let interactions feel natural and intuitive
- Think: "Would someone understand this without reading anything?"

### Brand Voice
Keep Samantha's personality in mind:
- Warm and empathetic
- Present but not intrusive
- Celebrates the joy of reading
- Patient and understanding

See `BRAND_VOICE.md` for detailed guidelines.

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Test thoroughly (zero-text UI should remain usable)
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

### PR Guidelines
- Describe what you changed and why
- Include screenshots for UI changes
- Ensure accessibility (screen reader compatibility)
- Keep the zero-text philosophy intact
- Add comments to complex code

## Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Add clear comments for complex logic
- Keep components small and focused
- Use meaningful variable names

## Testing

Before submitting:
- [ ] Test with sample articles
- [ ] Test URL extraction with various websites
- [ ] Verify daily limit (3 articles) works
- [ ] Check localStorage persistence
- [ ] Test UI is usable without reading text
- [ ] Verify screen reader accessibility

## Issues

Found a bug or have an idea?
- Check existing issues first
- Use issue templates when available
- Provide clear reproduction steps for bugs
- Be respectful and constructive

## Questions?

Open an issue with the "question" label or start a discussion.

---

*She reads the internet, out loud, just for you.*

