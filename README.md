# Vyna.live: AI-Enhanced Livestreaming Platform

![Vyna.live Logo](/public/logo.png)

Vyna.live is a cutting-edge livestreaming platform with built-in AI-powered teleprompter and content generation. It provides streamers with real-time AI assistance during live broadcasts while offering viewers an enhanced interactive experience.

## 🚀 Features

### AI-Powered Streaming

- **Dual-Mode AI Teleprompter**: Generate content in two distinct styles:
  - Play-by-play commentary for dynamic narration
  - Color commentary for in-depth analysis
- **Rich Content Formats**: Support for text, tables, graphs, cards, images, and audio
- **Data Visualization**: Enhanced visual representation of information
- **Contextual Awareness**: AI responses that understand the streaming context

### Video Streaming

- **Agora SDK Integration**: Professional-grade video, audio, and livestreaming
- **Dual View Options**:
  - Full-screen view for viewers
  - Split view with teleprompter panel for streamers
- **Real-time Interaction**: Built-in chat and audience engagement tools

### Notes & Research

- **Smart Notepad**: AI-enhanced note-taking with rich text capabilities
- **Research Assistant**: AI-powered research tools to help prepare content
- **File Upload**: Support for documents, images, and other reference materials
- **Collaboration**: Share and collaborate on notes and research

### Authentication & User Management

- **Secure Login**: Email/password authentication with password reset
- **User Profiles**: Customizable profiles for streamers and viewers
- **Cross-Platform**: Consistent experience across web, browser extension, and mobile

### Subscription System

- **Blockchain-Based Payments**: USDC token support on Solana blockchain
- **QR Code Payments**: Easy wallet-to-wallet transfers using QR codes
- **Transaction Verification**: Real-time blockchain transaction verification
- **Tiered Subscription Plans**:
  - **Free**: Basic AI model, limited rich formatting, one chat session, up to 5 saved notes
  - **Pro ($15/month)**: Advanced AI models, unlimited messages, rich formatting, up to 10 chat sessions, unlimited notes
  - **Max ($75/month)**: Exclusive AI models, premium response quality, advanced visualization, collaborative notes

### Loyalty Program

- **Verxio Protocol Integration**: AI Research Rewards using blockchain technology
- **Research-Focused Tiers**: Researcher, Scholar, Expert, Luminary
- **XP Points System**: Earn points through platform engagement and research activities

## 🔧 Technical Stack

### Frontend
- React with TypeScript
- Tailwind CSS with shadcn UI components
- TanStack React Query for state management
- Wouter for lightweight routing

### Backend
- Express.js server with TypeScript
- PostgreSQL database with Drizzle ORM
- Socket-based real-time communications
- Multer for file uploads

### AI & Blockchain
- OpenAI, Anthropic, and Gemini AI integration
- Solana blockchain integration for payments
- Verxio Protocol for blockchain-based loyalty
- Agora SDK for livestreaming

### Authentication & Security
- JWT-based authentication
- Password hashing with scrypt
- Secure password reset flows
- Email verification

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Solana-compatible wallet (Phantom, Solflare)

### Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-org/vyna-live.git
   cd vyna-live
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables (create a `.env` file):
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/vyna
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GEMINI_API_KEY=your_gemini_key
   AGORA_APP_ID=your_agora_app_id
   AGORA_APP_CERTIFICATE=your_agora_certificate
   GETSTREAM_API_KEY=your_getstream_key
   GETSTREAM_API_SECRET=your_getstream_secret
   ```

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## 🔐 Blockchain Integration

### USDC Payments
The platform uses USDC tokens on the Solana blockchain for subscription payments:

- **Testnet USDC**: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`
- **Mainnet USDC**: `EPjFWdd5AufqSSqeM2qN1xzybAPX3ovGdTAbS1ZC1nQjL`

### Payment Verification
All subscription payments are verified on-chain before activation:

1. **Transaction Verification**: Validates the transaction signature on the blockchain
2. **Amount Validation**: Ensures the correct amount was transferred
3. **Payment Tracking**: Records payment details in the database

## 📱 Browser Extension

Vyna.live includes a browser extension for Chrome, Firefox, and Edge that provides:

- AI chat assistance directly in the browser
- Quick note-taking with AI enhancements
- Content research without leaving your current page
- Seamless integration with the main platform

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Agora for livestreaming capabilities
- OpenAI, Anthropic, and Google for AI services
- Solana for blockchain infrastructure
- Verxio Protocol for loyalty program infrastructure