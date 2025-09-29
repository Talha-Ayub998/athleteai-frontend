// components/OneTimeCard.tsx
import { Loader2, Check } from "lucide-react";

interface OneTimeCardProps {
  isLoading: boolean;
  onSelect: (planId: string) => void;
}

const OneTimeCard: React.FC<OneTimeCardProps> = ({ isLoading, onSelect }) => {
  const features = [
    {
      text: "Minimum 4 Matches Required",
      isWarning: true,
    },
    {
      text: "Detailed Match Analysis Report",
      isWarning: false,
    },
    {
      text: "PDF Format for Easy Sharing",
      isWarning: false,
    },
    {
      text: "Email Delivery",
      isWarning: false,
    },
    {
      text: "Basic Performance Insights",
      isWarning: false,
    },
    {
      text: "Technique Breakdown",
      isWarning: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300 hover:scale-105">
      <div className="p-8">
        {/* Plan Header */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              $2.99
            </span>
            <span className="text-gray-600 dark:text-slate-400 ml-1">
              /report
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            PDF Report
          </h3>
          <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
            One time PDF Analysis report emailed directly to grappler
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect("one-time")}
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 mb-8 bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 ${
            isLoading ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Select"
          )}
        </button>

        {/* Features List */}
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                  feature.isWarning
                    ? "text-red-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {feature.isWarning ? (
                  <span className="text-xl font-bold">*</span>
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </div>
              <span
                className={`text-sm leading-relaxed ${
                  feature.isWarning
                    ? "text-red-400 font-medium"
                    : "text-gray-700 dark:text-slate-300"
                }`}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OneTimeCard;
