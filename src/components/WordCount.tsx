import React, { useState, useEffect } from 'react';
import { countWords } from '@/utils/scrabble';
import { Button } from '@/components/ui/button';

const WordCount: React.FC = () => {
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWordCount = async () => {
    setIsLoading(true);
    try {
      const count = await countWords();
      setWordCount(count);
    } catch (error) {
      console.error('Error fetching word count:', error);
      setWordCount(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWordCount();
  }, []);

  return (
    <div className="flex items-center space-x-4">
      <Button onClick={fetchWordCount} disabled={isLoading}>
        {isLoading ? 'Counting...' : 'Count Words'}
      </Button>
      {wordCount !== null && (
        <span className="text-lg font-semibold">
          Total Words: {wordCount}
        </span>
      )}
    </div>
  );
};

export default WordCount;