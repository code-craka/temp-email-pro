import '@/app/globals.css';

// Mock Components
const AdBanner = ({ slot, className }: { slot: string, className?: string }) => <div className={`bg-gray-200 p-4 text-center ${className}`}>Ad Banner: {slot}</div>;
const ActiveUsersCounter = () => <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded">Active Users: 123</div>;
const ExitIntentModal = () => null; // Implement this later

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXX"></script>
      </head>
      <body>
        <div className="min-h-screen bg-white">
          {/* Header Ad */}
          <AdBanner slot="header" />
          
          <main className="container mx-auto px-4">
            {children}
          </main>
          
          {/* Footer Ad */}
          <AdBanner slot="footer" />
        </div>
        
        {/* Real-time user counter for social proof */}
        <ActiveUsersCounter />
        
        {/* Exit intent popup */}
        <ExitIntentModal />
      </body>
    </html>
  );
}