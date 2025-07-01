
export function TrialProgressWidget({ trialStatus }: { trialStatus: any }) {
  if (!trialStatus.isActive) return null;

  const progressPercentage = ((14 - trialStatus.daysRemaining) / 14) * 100;

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Premium Trial</h3>
        <span className="text-sm text-gray-500">
          {trialStatus.daysRemaining} days left
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="space-y-1">
        {trialStatus.features.slice(0, 3).map((feature, index) => (
          <div key={index} className="flex items-center text-sm text-gray-600">
            import { Star } from 'lucide-react';
            {feature}
          </div>
        ))}
        {trialStatus.features.length > 3 && (
          <p className="text-xs text-gray-500">
            +{trialStatus.features.length - 3} more features
          </p>
        )}
      </div>
    </div>
  );
}
