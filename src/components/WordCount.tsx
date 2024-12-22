import React, { useState, useEffect } from 'react';
import { countWords } from '@/utils/scrabble';

const WordCount: React.FC = () => {
  const [wordCount, setWordCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchWordCount = async () => {
      try {
        const count = await countWords();
        setWordCount(count);
      } catch (error) {
        console.error('Error fetching word count:', error);
        setWordCount(null);
      }
    };

    fetchWordCount();
  }, []);

  if (wordCount === null) return null;

  return (
    <div className="text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
      {wordCount.toLocaleString()} palabras disponibles
    </div>
  );
};

export default WordCount;