'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'What are Shanmuga\'s core skills?',
  'Show me your featured projects',
  'Are you looking for internships?',
  'How can I contact Shanmuga?',
];

let msgIdCounter = 0;
const generateMessageId = () => {
  return `msg-${Date.now()}-${msgIdCounter++}`;
};

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi there! 👋 I'm Shanmuga's AI Portfolio Assistant. Ask me anything about his skills, projects, experience, or availability!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Format history for the backend API
      const history = messages
        .filter((m) => m.id !== 'welcome') // exclude welcome message
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          sender: 'bot',
          text: data.reply || "I'm sorry, I couldn't process that request right now.",
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          sender: 'bot',
          text: "⚠️ System offline or Gemini API error. (Demo Mode: Shanmuga is a Full-Stack developer skilled in Next.js, React, Node.js, and Supabase. You can find his projects on the page!)",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="ai-chat-container">
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`ai-chat-bubble ${isOpen ? 'active' : ''}`}
        aria-label="Toggle AI Assistant Chat"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          // Close Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ai-chat-btn-icon rotate"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Robot/Chat Bubble Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ai-chat-btn-icon"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13a3 3 0 0 1-6 0" />
          </svg>
        )}
      </button>

      {/* Expandable Chat Card */}
      {isOpen && (
        <div className="ai-chat-card">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-avatar">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M15 13a3 3 0 0 1-6 0" />
              </svg>
            </div>
            <div className="ai-chat-header-info">
              <h4 className="ai-chat-title">Portfolio Assistant</h4>
              <span className="ai-chat-status">
                <span className="ai-chat-status-dot" /> Powered by Gemini
              </span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="ai-chat-body">
            <div className="ai-chat-messages">
              {messages.map((m) => (
                <div key={m.id} className={`ai-message-wrapper ${m.sender}`}>
                  {m.sender === 'bot' && (
                    <div className="ai-message-avatar">🤖</div>
                  )}
                  <div className={`ai-message-bubble ${m.sender}`}>
                    <p className="ai-message-text">{m.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="ai-message-wrapper bot">
                  <div className="ai-message-avatar">🤖</div>
                  <div className="ai-message-bubble bot typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="ai-chat-suggestions">
            <div className="ai-chat-suggestions-scroll">
              {SUGGESTIONS.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(text)}
                  className="ai-suggestion-chip"
                  disabled={isLoading}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form onSubmit={handleFormSubmit} className="ai-chat-footer">
            <input
              type="text"
              placeholder="Ask me something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="ai-chat-input"
              maxLength={200}
              disabled={isLoading}
              aria-label="Type message for AI assistant"
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
