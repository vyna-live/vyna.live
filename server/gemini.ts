import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting mechanism
const rateLimiter = {
  tokens: 60000,  // Token budget per minute (conservative estimate)
  lastReset: Date.now(),
  resetInterval: 60 * 1000, // 1 minute in milliseconds
  tokensUsed: 0,
  
  canMakeRequest(estimatedTokens: number = 1000): boolean {
    // Reset counter if it's been more than resetInterval
    if (Date.now() - this.lastReset > this.resetInterval) {
      this.tokensUsed = 0;
      this.lastReset = Date.now();
    }
    
    return (this.tokensUsed + estimatedTokens) <= this.tokens;
  },
  
  trackUsage(tokens: number): void {
    this.tokensUsed += tokens;
    console.log(`Rate limiter: ${this.tokensUsed}/${this.tokens} tokens used this minute`);
  }
};

// Sample stock images for infographics
const STOCK_IMAGES = {
  livestreamer: [
    "https://images.unsplash.com/photo-1603481546579-65d935ba9cdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598550476439-6847785fcea6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  ],
  infographics: [
    "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  ],
  workspace: [
    "https://images.unsplash.com/photo-1593062096033-9a26b09da705?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  ]
};

// Get a random image from a category
function getRandomImage(category: 'livestreamer' | 'infographics' | 'workspace'): string {
  const images = STOCK_IMAGES[category];
  return images[Math.floor(Math.random() * images.length)];
}

// Helper function to determine if response should include an infographic
function shouldHaveInfoGraphic(message: string): boolean {
  // Include an infographic for research/data-heavy questions
  const infoGraphicKeywords = [
    'research', 'data', 'statistics', 'compare', 'best practices',
    'steps', 'how to', 'tutorial', 'guide', 'tips', 'setup',
    'explain', 'information', 'facts', 'study', 'analysis',
    'breakdown', 'list', 'methods', 'procedure', 'process',
    'livestream', 'streaming', 'broadcast', 'content creation'
  ];
  
  return infoGraphicKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Generate infographic data based on user query and AI response
function generateInfoGraphicData(userQuery: string, aiResponse: string) {
  let category: 'livestreamer' | 'infographics' | 'workspace';
  let title = '';
  
  if (userQuery.toLowerCase().includes('setup') || 
      userQuery.toLowerCase().includes('equipment') ||
      userQuery.toLowerCase().includes('livestream')) {
    category = 'livestreamer';
    title = 'Livestreamer Setup';
  } else if (userQuery.toLowerCase().includes('workspace') || 
             userQuery.toLowerCase().includes('environment')) {
    category = 'workspace';
    title = 'Optimal Research Environment';
  } else {
    category = 'infographics';
    title = 'Research Insights';
  }
  
  // Extract a concise summary for the infographic (first 150 chars)
  const content = aiResponse.length > 150 
    ? aiResponse.substring(0, 150) + '...' 
    : aiResponse;
  
  return {
    title,
    content,
    imageUrl: getRandomImage(category)
  };
}

export async function getAIResponse(message: string) {
  try {
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("No GEMINI_API_KEY environment variable found");
      return {
        text: "I need a Google Gemini API key to function. Please provide one in the environment variables.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        error: "NO_API_KEY"
      };
    }

    // Check if we can make a request based on our rate limiting
    const estimatedTokens = message.length * 2; // Rough estimate: input tokens + expected output tokens
    
    if (!rateLimiter.canMakeRequest(estimatedTokens)) {
      console.log("Rate limit reached, returning fallback response");
      return {
        text: "I apologize, but I'm currently handling a lot of requests. To prevent hitting rate limits, I'm taking a short break. Please try again in a little while.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        error: "RATE_LIMITED"
      };
    }
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `
      You are Vyna, an AI research assistant designed specifically for livestreamers.
      Your goal is to provide concise, informative responses that can be easily communicated during a livestream.
      
      Focus on being:
      1. Clear and direct - Get to the point quickly (use at most 150 words)
      2. Factual and well-researched
      3. Structured with proper formatting (use bullet points or numbered lists when appropriate)
      4. Helpful for someone who needs to communicate this information to an audience
      5. Focused on providing context and depth to topics for educational livestreams
      
      Keep your response under 150 words to be easily readable on a teleprompter.
      
      Respond to the following query from a livestreamer who needs information during their stream:
      "${message}"
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Estimate tokens used (this is an approximation)
    rateLimiter.trackUsage(estimatedTokens);

    const hasInfoGraphic = shouldHaveInfoGraphic(message);
    
    return {
      text,
      hasInfoGraphic,
      infoGraphicData: hasInfoGraphic ? generateInfoGraphicData(message, text) : null
    };
  } catch (error: any) {
    console.error("Error generating AI response with Gemini:", error);
    
    if (error.message && error.message.includes("PERMISSION_DENIED")) {
      return {
        text: "There's an issue with the Gemini API key. It might be invalid or might not have the necessary permissions.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        error: "API_PERMISSION_DENIED"
      };
    }
    
    if (error.message && error.message.includes("RESOURCE_EXHAUSTED")) {
      return {
        text: "The Gemini API quota has been exceeded. Please try again later when the quota resets.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        error: "API_QUOTA_EXCEEDED"
      };
    }
    
    return {
      text: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
      hasInfoGraphic: false,
      infoGraphicData: null,
      error: "API_ERROR"
    };
  }
}