// components/BillingToggle.tsx
interface BillingToggleProps {
  billingCycle: string;
  onToggle: (cycle: string) => void;
}

const BillingToggle: React.FC<BillingToggleProps> = ({
  billingCycle,
  onToggle,
}) => {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="bg-gray-100 dark:bg-slate-800/50 rounded-full p-1 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center">
          <button
            onClick={() => onToggle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              billingCycle === "monthly"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onToggle("annual")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              billingCycle === "annual"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Annual
            <span className="bg-green-500 text-green-50 text-xs px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingToggle;
