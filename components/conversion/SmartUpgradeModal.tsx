
// Mock Modal component
const Modal = ({ children }: any) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg">
            {children}
        </div>
    </div>
);

export function SmartUpgradeModal({ trigger, user }: {
  trigger: 'limit_hit' | 'time_expiring' | 'feature_request';
  user: any;
}) {
  const getUpgradeMessage = () => {
    switch (trigger) {
      case 'limit_hit':
        return {
          title: "🚀 You're actively using temp emails!",
          subtitle: "Upgrade to generate unlimited emails and keep them longer",
          cta: "Upgrade for $0.99",
          urgency: "Join 1,000+ users who upgraded today"
        };
      case 'time_expiring':
        return {
          title: "⏰ Your email expires in 5 minutes",
          subtitle: "Upgrade now to extend retention to 24 hours",
          cta: "Save my emails - $0.99",
          urgency: "Don't lose important messages"
        };
      case 'feature_request':
        return {
          title: "🎯 Unlock Premium Features",
          subtitle: "Custom domains, API access, and priority support",
          cta: "Start Pro Trial",
          urgency: "50% off first month for new users"
        };
    }
  };

  const message = getUpgradeMessage();

  return (
    <Modal>
      <div className="text-center p-6">
        <h3 className="text-2xl font-bold mb-2">{message.title}</h3>
        <p className="text-gray-600 mb-4">{message.subtitle}</p>
        <p className="text-sm text-blue-600 mb-6">{message.urgency}</p>
        
        <div className="space-y-3">
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg">
            {message.cta}
          </button>
          <button className="w-full text-gray-500">
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
