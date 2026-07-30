import React, { useState, useEffect } from 'react';

interface AITypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export const AITypingText: React.FC<AITypingTextProps> = ({ text, speed = 15, onComplete, className }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && <span className="inline-block w-1.5 h-4 ml-0.5 bg-indigo-400 animate-pulse align-middle" />}
    </span>
  );
};
