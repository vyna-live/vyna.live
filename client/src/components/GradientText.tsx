import { useEffect, useState } from 'react';

interface GradientTextProps {
  text: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
  typingSpeed?: number;
  showCursor?: boolean;
}

export default function GradientText({
  text,
  className = '',
  gradientFrom = 'from-blue-500',
  gradientTo = 'to-pink-500',
  gradientVia,
  typingSpeed = 100,
  showCursor = true
}: GradientTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  
  useEffect(() => {
    let currentIndex = 0;
    setDisplayText('');
    setTypingComplete(false);
    
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTypingComplete(true);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [text, typingSpeed]);
  
  const gradientClass = gradientVia 
    ? `bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo}`
    : `bg-gradient-to-r ${gradientFrom} ${gradientTo}`;
    
  return (
    <span className={`${className} relative`}>
      <span className={`${gradientClass} text-transparent bg-clip-text`}>
        {displayText}
      </span>
      {showCursor && !typingComplete && (
        <span className="border-r-2 border-[hsl(var(--ai-accent))] ml-0.5 animate-blink h-full absolute right-[-4px] top-0"></span>
      )}
    </span>
  );
}