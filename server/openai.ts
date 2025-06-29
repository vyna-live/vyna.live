import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key" 
});

// Rate limiting mechanism
const rateLimiter = {
  tokens: 100000,  // Token budget per hour (conservative estimate)
  lastReset: Date.now(),
  resetInterval: 60 * 60 * 1000, // 1 hour in milliseconds
  tokensUsed: 0,
  
  canMakeRequest(estimatedTokens: number = 1000): boolean {
    // Temporarily disabled rate limiting - always return true
    // Original implementation:
    // if (Date.now() - this.lastReset > this.resetInterval) {
    //   this.tokensUsed = 0;
    //   this.lastReset = Date.now();
    // }
    // return (this.tokensUsed + estimatedTokens) <= this.tokens;
    
    return true; // Always allow requests
  },
  
  trackUsage(tokens: number): void {
    this.tokensUsed += tokens;
    console.log(`Rate limiter: ${this.tokensUsed}/${this.tokens} tokens used this hour`);
  }
};

// Use GPT-3.5 for less important queries to save tokens
function chooseModel(message: string): string {
  // Keywords that might indicate a complex query that needs GPT-4
  const complexQueryIndicators = [
    'explain', 'analyze', 'compare', 'research',
    'statistics', 'data', 'in-depth', 'details'
  ];
  
  const isComplex = complexQueryIndicators.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  // Conservative approach - use GPT-3.5 by default to save tokens
  // Until we know the actual rate limit constraints, we can comment this out and use gpt-4o
  // return isComplex ? "gpt-4o" : "gpt-3.5-turbo";
  
  return "gpt-4o";
}

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
    // Check if we can make a request based on our rate limiting
    const estimatedTokens = message.length * 2; // Rough estimate: input tokens + expected output tokens
    
    if (!rateLimiter.canMakeRequest(estimatedTokens)) {
      console.log("Rate limit reached, returning fallback response");
      return {
        text: "I apologize, but I'm currently handling a lot of requests. To prevent hitting OpenAI's rate limits, I'm taking a short break. Please try again in a little while.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        error: "RATE_LIMITED"
      };
    }
    
    // Select appropriate model based on the query complexity
    const model = chooseModel(message);
    
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

    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500, // Limit token usage for each response
    });

    // Track usage for rate limiting
    const tokensUsed = response.usage?.total_tokens || estimatedTokens;
    rateLimiter.trackUsage(tokensUsed);

    const text = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    const hasInfoGraphic = shouldHaveInfoGraphic(message);
    
    return {
      text,
      hasInfoGraphic,
      infoGraphicData: hasInfoGraphic ? generateInfoGraphicData(message, text) : null
    };
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    
    // Check for specific error types
    if (error?.error?.type === "insufficient_quota" || 
        (error?.status === 429 && error?.error?.code === "insufficient_quota")) {
      return {
        text: "I'm unable to generate a response because the OpenAI API quota has been exceeded. This typically happens with free OpenAI accounts. Please try again later when the quota resets.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        error: "API_QUOTA_EXCEEDED"
      };
    }
    
    // Handle rate limit errors specifically
    if (error?.error?.type === "rate_limit_exceeded" ||
        (error?.status === 429 && error?.error?.code === "rate_limit_exceeded")) {
      return {
        text: "I'm receiving too many requests at the moment. OpenAI has rate limits in place to ensure fair usage. Please try again in a few moments.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        error: "RATE_LIMITED"
      };
    }
    
    // General error fallback
    return {
      text: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
      hasInfoGraphic: false,
      infoGraphicData: null,
      error: "API_ERROR"
    };
  }
}
