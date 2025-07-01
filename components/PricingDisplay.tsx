
import { useState, useEffect } from 'react';

// Mock components and data
const PricingCard = ({ tier, isPopular, showSurgeIndicator }: any) => (
    <div className={`border-2 rounded-lg p-6 ${isPopular ? 'border-blue-500' : 'border-gray-300'}`}>
        <h3 className="text-xl font-bold">{tier.name}</h3>
        <p className="text-4xl font-bold">${tier.price}</p>
        {showSurgeIndicator && <p className="text-red-500">Surge Pricing Active!</p>}
    </div>
);

export function PricingDisplay() {
  const [pricing, setPricing] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    // Real-time pricing updates
    const fetchPricing = async () => {
      // const response = await fetch('/api/pricing/current');
      // const data = await response.json();
      const data = { tiers: [{id: 'extended', name: 'Extended', price: 2.99}], activeUsers: 1234 }; // Mock data
      setPricing(data.tiers);
      setActiveUsers(data.activeUsers);
    };

    fetchPricing();
    const interval = setInterval(fetchPricing, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {pricing.map((tier) => (
        <PricingCard 
          key={tier.id}
          tier={tier}
          isPopular={tier.id === 'extended'}
          showSurgeIndicator={activeUsers > 1000}
        />
      ))}
    </div>
  );
}
