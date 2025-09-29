import { Loader2 } from "lucide-react";
import FeaturesList from "./FeaturesList";

interface Feature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: Feature[];
}

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected,
  isLoading,
  onSelect,
}) => {
  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 hover:scale-105 ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-slate-800/80 shadow-2xl shadow-blue-500/20"
          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-gray-300 dark:hover:border-slate-600"
      }`}
    >
      {/* Active Plan Badge */}
      {isSelected && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">
            Current Plan
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Plan Header */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              ${plan.price}
            </span>
            <span className="text-gray-600 dark:text-slate-400 ml-1">
              {plan.period}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(plan.id)}
          disabled={isLoading || isSelected}
          className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 mb-8 flex items-center justify-center gap-2 ${
            isSelected
              ? "bg-gray-400 dark:bg-gray-500 text-gray-200 dark:text-gray-300 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
          } ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : isSelected ? (
            "Selected"
          ) : (
            "Select"
          )}
        </button>

        {/* Features List */}
        <FeaturesList features={plan.features} />
      </div>
    </div>
  );
};

export default PlanCard;
