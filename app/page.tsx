'use client';

import { useState, useEffect } from 'react';

// Mock Components - Replace with actual implementations
const EmailGenerator = ({ email, timeLeft, onExtend, onUpgrade }: any) => (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Temporary Email</h2>
        <div className="text-3xl font-mono p-4 bg-white border rounded mb-4">{email}</div>
        <div className="flex justify-between items-center">
            <div>Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <div>
                <button onClick={onExtend} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Extend</button>
                <button onClick={onUpgrade} className="bg-green-500 text-white px-4 py-2 rounded">Upgrade</button>
            </div>
        </div>
    </div>
);

const ConversionOptimizer = ({ user, messageCount, timeLeft, onUpgrade }: any) => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between">
            <div>
                <p className="font-semibold text-yellow-800">Conversion Optimizer</p>
                <p className="text-yellow-700">
                    User: {user ? user.isPremium ? 'Premium' : 'Free' : 'Guest'}, 
                    Messages: {messageCount}, 
                    Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
            </div>
            <button 
                onClick={onUpgrade} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
                Upgrade Now
            </button>
        </div>
    </div>
);

const AdBanner = ({ slot, className }: any) => (
    <div className={`bg-gray-200 p-4 text-center ${className}`}>Ad Banner: {slot}</div>
);

const InboxView = ({ messages }: any) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">Inbox</h2>
        {messages.length === 0 ? (
            <p>No messages yet.</p>
        ) : (
            messages.map((msg: any) => (
                <div key={msg.id} className="border p-4 mb-2 rounded">
                    <p><strong>From:</strong> {msg.from}</p>
                    <p><strong>Subject:</strong> {msg.subject}</p>
                    <p>{msg.body}</p>
                </div>
            ))
        )}
    </div>
);

export default function HomePage() {
  const [email, setEmail] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);

  // Auto-generate email on page load
  useEffect(() => {
    generateEmail();
  }, []);

  // Real-time inbox updates with smart polling
  useEffect(() => {
    if (!email) return;
    
    const pollInterval = user?.isPremium ? 1000 : 3000;
    const interval = setInterval(fetchMessages, pollInterval);
    
    return () => clearInterval(interval);
  }, [email, user]);

  const generateEmail = () => {
      // Mock email generation
      setEmail(`test${Math.floor(Math.random() * 1000)}@example.com`);
  }

  const fetchMessages = () => {
      // Mock message fetching
      setMessages([
          { id: 1, from: 'sender@example.com', subject: 'Test Email', body: 'This is a test email.'}
      ]);
  }

  const handleExtend = () => {
      setTimeLeft(prev => prev + 300);
  }

  const handleUpgrade = () => {
      alert("Redirecting to upgrade page...");
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Instant Temporary Email
      </h1>
      
      <EmailGenerator 
        email={email}
        timeLeft={timeLeft}
        onExtend={handleExtend}
        onUpgrade={handleUpgrade}
      />
      
      <ConversionOptimizer 
        user={user}
        messageCount={messages.length}
        timeLeft={timeLeft}
        onUpgrade={handleUpgrade}
      />
      
      {/* Strategic ad placement */}
      {!user?.isPremium && (
        <AdBanner slot="inbox-top" className="my-4" />
      )}
      
      <InboxView messages={messages} />
    </div>
  );
}