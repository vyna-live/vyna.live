import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key"
});

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
    const prompt = `
      You are Vyna, an AI research assistant designed specifically for livestreamers.
      Your goal is to provide concise, informative responses that can be easily communicated during a livestream.
      
      Focus on being:
      1. Clear and direct - Get to the point quickly
      2. Factual and well-researched
      3. Structured with proper formatting (use bullet points or numbered lists when appropriate)
      4. Helpful for someone who needs to communicate this information to an audience
      5. Focused on providing context and depth to topics for educational livestreams
      
      Respond to the following query from a livestreamer who needs information during their stream:
      "${message}"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    const hasInfoGraphic = shouldHaveInfoGraphic(message);
    
    return {
      text,
      hasInfoGraphic,
      infoGraphicData: hasInfoGraphic ? generateInfoGraphicData(message, text) : null
    };
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}
