# Vyna.AI: Multi-Browser AI Assistant & Notes Platform

![Vyna.AI Logo](/public/logo.png)

Vyna.AI is a cutting-edge browser extension and web application that provides an AI-powered assistant for capturing, organizing, and managing digital notes across different platforms. The platform offers intelligent note-taking with AI enhancement, helping users research and organize information more effectively.

## 🚀 Features

### AI-Powered Assistant

- **Multi-Model AI Integration**: Access to multiple AI models:
  - OpenAI's GPT models
  - Anthropic's Claude models
  - Google's Gemini models
- **Rich Content Formats**: Support for text, tables, graphs, cards, images, and audio
- **Data Visualization**: Enhanced visual representation of information
- **Contextual Analysis**: AI responses that understand the context of your research

### Smart Note-Taking

- **Intelligent Organization**: Automatic categorization and tagging
- **Rich Media Support**: Embed images, links, and formatted content 
- **Searchable Archive**: Full-text search across all your saved notes
- **Cross-Platform Sync**: Access your notes from any device

### Browser Extension

- **Cross-Browser Support**: Works on Chrome, Firefox, and Edge
- **Instant Access**: AI assistant right in your browser window
- **Research Helper**: Get AI insights while browsing the web
- **Quick Notes**: Capture and organize thoughts without switching contexts

### Authentication & User Management

- **Secure Login**: Email/password authentication with password reset
- **User Profiles**: Customizable user settings and preferences
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
- RESTful API architecture
- Multer for file uploads

### AI & Blockchain
- OpenAI, Anthropic, and Gemini AI integration
- Solana blockchain integration for payments
- Verxio Protocol for blockchain-based loyalty
- Secure file storage and processing

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

- OpenAI, Anthropic, and Google for AI services
- Solana for blockchain infrastructure
- Verxio Protocol for loyalty program infrastructure