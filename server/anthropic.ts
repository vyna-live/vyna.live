import Anthropic from '@anthropic-ai/sdk';
import { enhanceResponse } from './services/responseEnhancer';

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Rate limiting mechanism
const rateLimiter = {
  tokens: 100000,  // Token budget per hour (conservative estimate)
  lastReset: Date.now(),
  resetInterval: 60 * 60 * 1000, // 1 hour in milliseconds
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
    console.log(`Claude Rate limiter: ${this.tokensUsed}/${this.tokens} tokens used this hour`);
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

// Detect the preferred commentary style from user input
function detectCommentaryStyle(message: string): 'play-by-play' | 'color' {
  const playByPlayIndicators = [
    'play-by-play', 'play by play', 'step by step', 'walkthrough', 
    'describe what', 'happening now', 'real-time', 'real time',
    'action', 'moment', 'what is going on', 'current', 'right now',
    'live', 'action-by-action', 'move by move', 'second by second',
    'as it happens', 'running commentary', 'narrate'
  ];
  
  // Check for explicit requests for a particular style
  if (message.toLowerCase().includes('play-by-play style') || 
      message.toLowerCase().includes('play by play style') ||
      message.toLowerCase().includes('use play-by-play') ||
      message.toLowerCase().includes('use play by play')) {
    return 'play-by-play';
  }
  
  if (message.toLowerCase().includes('color commentary') ||
      message.toLowerCase().includes('use color commentary') ||
      message.toLowerCase().includes('color style') ||
      message.toLowerCase().includes('analytical style')) {
    return 'color';
  }
  
  // Check for implicit indicators
  for (const indicator of playByPlayIndicators) {
    if (message.toLowerCase().includes(indicator)) {
      return 'play-by-play';
    }
  }
  
  return 'color'; // Default to color commentary if no explicit indicator
}

export async function getAIResponse(message: string, commentaryStyle?: 'play-by-play' | 'color', previousMessages: { role: 'user' | 'assistant', content: string }[] = []) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("No ANTHROPIC_API_KEY environment variable found");
      return {
        text: "I need an Anthropic Claude API key to function. Please provide one in the environment variables.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        visualizations: [],
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
        visualizations: [],
        error: "RATE_LIMITED"
      };
    }
    
    // If commentaryStyle is not provided, try to detect it from the message
    const style = commentaryStyle || detectCommentaryStyle(message);
    
    // Determine commentary style-specific instructions
    let styleInstructions = '';
    if (style === 'play-by-play') {
      styleInstructions = `
        🕹 Play-by-Play Commentary Style:
        - Help the streamer describe what's happening right now in real time
        - Provide clear, quick, action-oriented, and immersive responses to the streamer
        - Prioritize moment-to-moment details that the streamer can use immediately
        - Only include generated visuals if they help clarify what's being discussed
        - Your content will assist the streamer in guiding their viewers through the action
      `;
    } else {
      styleInstructions = `
        🎨 Color Commentary Style:
        - Help the streamer add personality, depth, backstory, emotion, and broader insight
        - Provide analysis, historical comparisons, behind-the-scenes trivia, and light humor when the streamer asks
        - Suggest custom visuals or statistics when relevant to the streamer's needs
        - Use a natural and engaging style that the streamer can build upon, not rushed
      `;
    }
    
    // Create the system prompt with Vyna's persona
    const systemPrompt = 
      "You are Vyna, an advanced AI assistant built for live streaming. Your role is to provide engaging, intelligent, and expressive commentary that will be teleprompted on screen during the user's live stream.\n\n" +
      styleInstructions + "\n\n" +
      "🧠 General Rules for Vyna:\n" +
      "- You are assisting the streamer who is messaging you directly - respond directly to them\n" +
      "- When greeted, respond to the streamer personally, not as if you're addressing an audience\n" +
      "- Always address the streamer as an assistant would address their user, not as if you are the streamer\n" +
      "- Your responses will be teleprompted, so be expressive but readable\n" +
      "- Make your responses rich and not short—we want immersion, not summaries\n" +
      "- You can reference generated images or data if allowed\n" +
      "- Adjust tone to match the stream type: gaming, music, art, tech, education, etc.\n" +
      "- Do not repeat ideas; evolve the commentary as the stream progresses\n" +
      "- Be creative, intelligent, and helpful. You're not just reporting — you're enhancing the experience\n\n" +
      
      "RICH CONTENT CAPABILITIES:\n" +
      "You can use markdown formatting in your responses. Additionally, you can create rich content like charts, tables, and cards by including JSON blocks in your response.\n\n" +
      
      "For charts, use this format:\n" +
      "```json\n" +
      "{\n" +
      "  \"type\": \"chart\",\n" +
      "  \"chartType\": \"bar\",\n" + 
      "  \"data\": [{\"name\": \"Item 1\", \"value\": 10}, {\"name\": \"Item 2\", \"value\": 20}],\n" +
      "  \"xKey\": \"name\",\n" +
      "  \"yKeys\": [\"value\"],\n" +
      "  \"colors\": [\"#8884d8\", \"#82ca9d\"]\n" +
      "}\n" +
      "```\n\n" +
      
      "For tables, use this format:\n" +
      "```json\n" +
      "{\n" +
      "  \"type\": \"table\",\n" +
      "  \"data\": [{\"column1\": \"value1\", \"column2\": \"value2\"}, {\"column1\": \"value3\", \"column2\": \"value4\"}]\n" +
      "}\n" +
      "```\n\n" +
      
      "For info cards, use this format:\n" +
      "```json\n" +
      "{\n" +
      "  \"type\": \"card\",\n" +
      "  \"title\": \"Important Information\",\n" +
      "  \"content\": \"This is the content of the card\",\n" +
      "  \"cardType\": \"info\"\n" + 
      "}\n" +
      "```\n\n" +
      
      "When asked for data visualization or statistical information, ALWAYS include either a chart or table in addition to your textual explanation.\n\n" +
      
      "💡 You are Vyna. The assistant to the streamer. Be vivid. Be responsive. Be alive. Use rich content whenever appropriate.";

    // Construct messages array with conversation history
    const messages = [...previousMessages];
    
    // Add the current message
    messages.push({ role: "user", content: message });
    
    // Log conversation for debugging
    console.log(`Sending ${messages.length} messages to Claude:`, 
      messages.length <= 3 ? JSON.stringify(messages) : `${messages.length} messages (too many to log)`);
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
    });

    // Track usage for rate limiting
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    rateLimiter.trackUsage(tokensUsed);

    // Safely extract text from the response
    let responseText = "I'm sorry, I couldn't generate a response.";
    if (response.content[0].type === 'text') {
      responseText = response.content[0].text;
    }
    
    // Enhance the response with visualizations using our response enhancer service
    console.log("Enhancing Claude response with visualizations...");
    const { enhancedText, visualizations } = enhanceResponse(responseText);
    console.log(`Enhanced response: ${visualizations.length} visualizations added`);
    
    const hasInfoGraphic = shouldHaveInfoGraphic(message);
    
    return {
      text: enhancedText, // Return the enhanced text instead of original
      hasInfoGraphic,
      infoGraphicData: hasInfoGraphic ? generateInfoGraphicData(message, responseText) : null,
      commentaryStyle: style, // Include the commentary style in the response
      visualizations // Include any visualizations for debugging
    };
  } catch (error: any) {
    console.error("Error generating AI response with Claude:", error);
    
    if (error.status === 401) {
      return {
        text: "There's an issue with the Claude API key. It might be invalid or might not have the necessary permissions.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        visualizations: [],
        error: "API_AUTHENTICATION_ERROR"
      };
    }
    
    if (error.status === 429) {
      return {
        text: "The Claude API rate limit has been exceeded. Please try again later when the quota resets.",
        hasInfoGraphic: false,
        infoGraphicData: null,
        visualizations: [],
        error: "API_RATE_LIMIT_EXCEEDED"
      };
    }
    
    return {
      text: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
      hasInfoGraphic: false,
      infoGraphicData: null,
      visualizations: [],
      error: "API_ERROR"
    };
  }
}
