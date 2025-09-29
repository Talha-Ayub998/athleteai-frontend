import { Check, X } from "lucide-react";

interface Feature {
  name: string;
  included: boolean;
}

interface FeaturesListProps {
  features: Feature[];
}

const FeaturesList: React.FC<FeaturesListProps> = ({ features }) => {
  return (
    <ul className="space-y-4">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              feature.included
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {feature.included ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
          </div>
          <span
            className={`text-sm leading-relaxed ${
              feature.included
                ? "text-gray-700 dark:text-slate-300"
                : "text-gray-400 dark:text-slate-500"
            }`}
          >
            {feature.name}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default FeaturesList;
