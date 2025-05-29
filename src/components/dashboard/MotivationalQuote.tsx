import React, { useState, useEffect } from 'react';
import Card, { CardBody } from '../ui/Card';
import { Quote } from 'lucide-react';

interface QuoteData {
  text: string;
  author: string;
}

// Fallback quotes in case local storage is empty
const fallbackQuotes: QuoteData[] = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    text: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi"
  }
];

const MotivationalQuote: React.FC = () => {
  const [quote, setQuote] = useState<QuoteData>({ text: '', author: '' });
  const [fadeIn, setFadeIn] = useState(true);
  
  // Get a random quote from the available quotes
  const getRandomQuote = (): QuoteData => {
    // Try to get quotes from localStorage first
    const storedQuotes = localStorage.getItem('motivationalQuotes');
    const quotes = storedQuotes ? JSON.parse(storedQuotes) : fallbackQuotes;
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  };
  
  // Initialize quote on component mount
  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);
  
  // Change quote every day
  useEffect(() => {
    const today = new Date().toDateString();
    const lastQuoteDate = localStorage.getItem('lastQuoteDate');
    
    if (lastQuoteDate !== today) {
      setQuote(getRandomQuote());
      localStorage.setItem('lastQuoteDate', today);
    }
  }, []);
  
  // New quote button handler
  const handleNewQuote = () => {
    setFadeIn(false);
    setTimeout(() => {
      setQuote(getRandomQuote());
      setFadeIn(true);
    }, 500);
  };

  return (
    <Card>
      <CardBody className="text-center py-6">
        <Quote className="h-8 w-8 mx-auto mb-4 text-purple-500 opacity-70" />
        
        <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-2 italic">
            "{quote.text}"
          </blockquote>
          
          <cite className="text-sm text-gray-600 dark:text-gray-400 block">
            — {quote.author}
          </cite>
        </div>
        
        <button
          onClick={handleNewQuote}
          className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          New Quote
        </button>
      </CardBody>
    </Card>
  );
};

export default MotivationalQuote;