# Samantha

A modern web application for enhanced reading experience with built-in text tracking and audio features.

## Features

- **Multiple View States**: Home, Loading, and Reader views
- **Text Tracking**: Track reading progress across articles
- **Audio Support**: Listen to text content with audio playback
- **User Authentication**: Secure login with Supabase authentication
- **Responsive Design**: Smooth experience across devices

## Tech Stack

- **Frontend**: Next.js 15.2.4, React 19
- **UI Components**: Radix UI, Tailwind CSS
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/gichigi/samantha.git
   cd samantha
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file with your environment variables
   ```
   # Example environment variables
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   pnpm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- **Home View**: Browse and select content to read
- **Reader View**: Enjoy distraction-free reading with progress tracking
- **Audio Playback**: Convert articles to audio for hands-free consumption

## License

[MIT](LICENSE)

## Contact

For any inquiries, please open an issue in this repository. 