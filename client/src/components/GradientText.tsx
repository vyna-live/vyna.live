import { useEffect, useState } from 'react';

interface GradientTextProps {
  text: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
  typingSpeed?: number;
  showCursor?: boolean;
  preset?: 'earthy' | 'warm' | 'cool' | 'default';
}

export default function GradientText({
  text,
  className = '',
  gradientFrom,
  gradientTo,
  gradientVia,
  typingSpeed = 100,
  showCursor = true,
  preset = 'default'
}: GradientTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  
  // Define preset gradients based on the color palette provided
  const presetGradients = {
    earthy: {
      from: 'from-[#5D1C34]', // Maroon
      via: 'via-[#A67D44]',   // Golden
      to: 'to-[#899481]'      // Sage
    },
    warm: {
      from: 'from-[#A67D44]', // Golden
      via: 'via-[#CDBCAB]',   // Taupe
      to: 'to-[#EFE9E1]'      // Cream
    },
    cool: {
      from: 'from-[#11100F]', // Dark
      via: 'via-[#5D1C34]',   // Maroon
      to: 'to-[#899481]'      // Sage
    },
    default: {
      from: 'from-blue-500',
      via: undefined,
      to: 'to-pink-500'
    }
  };
  
  // Use preset or custom gradient values
  const finalFrom = gradientFrom || presetGradients[preset].from;
  const finalVia = gradientVia || presetGradients[preset].via;
  const finalTo = gradientTo || presetGradients[preset].to;
  
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
  
  const gradientClass = finalVia 
    ? `bg-gradient-to-r ${finalFrom} ${finalVia} ${finalTo}`
    : `bg-gradient-to-r ${finalFrom} ${finalTo}`;
    
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