import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

const PlansPage = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState("");

  const plans = {
    monthly: [
      {
        id: "free",
        name: "Free",
        price: 0,
        period: "/mo",
        description: "Basic match analysis - 14 days free trial",
        features: [
          { name: "1 Match Analysis on free trial", included: true },
          { name: "Historical Dashboard", included: true },
          { name: "Basic Performance Metrics", included: true },
          { name: "Email Support", included: true },
          { name: "AI Chatbot", included: false },
          { name: "Advanced Analytics", included: false },
          { name: "Priority Support", included: false },
        ],
      },
      {
        id: "essentials",
        name: "Essentials",
        price: 3.99,
        period: "/mo",
        description: "Essential match analysis for recreational grapplers",
        features: [
          { name: "Up to 6 Match Analysis per Month", included: true },
          { name: "Historical Dashboard", included: true },
          { name: "Basic Performance Metrics", included: true },
          { name: "Email Support", included: true },
          { name: "AI Chatbot", included: false },
          { name: "Priority Support", included: false },
        ],
      },
      {
        id: "precision",
        name: "Precision",
        price: 7.99,
        period: "/mo",
        description:
          "Enhanced analysis with AI insights for serious competitors",
        features: [
          { name: "Up to 12 Match Analysis per Month", included: true },
          { name: "AI Chatbot", included: true },
          { name: "Historical Dashboard", included: true },
          { name: "Advanced Performance Metrics", included: true },
          { name: "Detailed Technique Breakdown", included: true },
          { name: "Priority Email Support", included: true },
        ],
      },
    ],
    annual: [
      {
        id: "free",
        name: "Free",
        price: 0,
        period: "/yr",
        description: "Basic match analysis - 14 days free trial",
        features: [
          { name: "1 Match Analysis on free trial", included: true },
          { name: "Historical Dashboard", included: true },
          { name: "Basic Performance Metrics", included: true },
          { name: "Email Support", included: true },
          { name: "AI Chatbot", included: false },
          { name: "Advanced Analytics", included: false },
          { name: "Priority Support", included: false },
        ],
      },
      
      {
        id: "essentials",
        name: "Essentials",
        price: 38.4,
        period: "/yr",
        description: "Essential match analysis for recreational grapplers",
        features: [
          { name: "Up to 6 Match Analysis per Month", included: true },
          { name: "Historical Dashboard", included: true },
          { name: "Basic Performance Metrics", included: true },
          { name: "Email Support", included: true },
          { name: "AI Chatbot", included: false },
          { name: "Priority Support", included: false },
        ],
      },
      {
        id: "precision",
        name: "Precision",
        price: 76.7,
        period: "/yr",
        description:
          "Enhanced analysis with AI insights for serious competitors",
        features: [
          { name: "Up to 12 Match Analysis per Month", included: true },
          { name: "AI Chatbot", included: true },
          { name: "Historical Dashboard", included: true },
          { name: "Advanced Performance Metrics", included: true },
          { name: "Detailed Technique Breakdown", included: true },
          { name: "Priority Email Support", included: true },
        ],
      },
    ],
  };

  const currentPlans = plans[billingCycle];

  const handlePlanSelect = async (planId) => {
    // Don't process free plan
    if (planId === "free") {
      setSelectedPlan(planId);
      console.log(`Selected plan: ${planId} - ${billingCycle}`);
      return;
    }

    setLoadingPlan(planId);

    try {
      let requestBody;

      if (planId === "one-time") {
        requestBody = {
          type: "one_time",
          plan: "pdf_report",
        };
      } else {
        const interval = billingCycle === "monthly" ? "month" : "year";
        requestBody = {
          type: "subscription",
          plan: planId,
          interval: interval,
        };
      }

      const response = await axiosInstance.post(
        "/users/create-checkout-session/",
        requestBody
      );

      // Redirect to payment page
      if (response.data && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        console.error("No checkout URL received");
        alert("Payment session could not be created. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to create payment session. Please try again.");
    } finally {
      setLoadingPlan("");
    }
  };

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase">
            UPGRADE YOUR PLAN
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Individual Grappler Portal - For hobbyists, local competitors, or
            anyone wanting detailed match insights
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-slate-800/50 rounded-full p-1 border border-slate-700">
            <div className="flex items-center">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
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

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border transition-all duration-300 hover:scale-105 ${
                selectedPlan === plan.id
                  ? "border-blue-500 bg-slate-800/80 shadow-2xl shadow-blue-500/20"
                  : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
              }`}
            >
              {/* Active Plan Badge */}
              {selectedPlan === plan.id && (
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
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    <span className="text-slate-400 ml-1">{plan.period}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loadingPlan === plan.id || selectedPlan === plan.id}
                  className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 mb-8 flex items-center justify-center gap-2 ${
                    selectedPlan === plan.id
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                  } ${
                    loadingPlan === plan.id
                      ? "opacity-75 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : selectedPlan === plan.id ? (
                    "Selected"
                  ) : (
                    "Select"
                  )}
                </button>

                {/* Features List */}
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
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
                          feature.included ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* One-Time Analysis Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              One-Time Analysis
            </h2>
            <p className="text-slate-300 text-lg">
              Perfect for occasional analysis needs
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/40 hover:border-slate-600 transition-all duration-300 hover:scale-105">
              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-white">$2.99</span>
                    <span className="text-slate-400 ml-1">/report</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    PDF Report
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    One time PDF Analysis report emailed directly to grappler
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect("one-time")}
                  disabled={loadingPlan === "one-time"}
                  className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 mb-8 bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 ${
                    loadingPlan === "one-time"
                      ? "opacity-75 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loadingPlan === "one-time" ? (
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
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-red-400 ">
                      <span className="text-xl font-bold ">*</span>
                    </div>
                    <span className="text-sm leading-relaxed text-red-400 font-medium">
                      Minimum 4 Matches Required
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-green-500/20 text-green-400">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm leading-relaxed text-slate-300">
                      Detailed Match Analysis Report
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-green-500/20 text-green-400">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm leading-relaxed text-slate-300">
                      PDF Format for Easy Sharing
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-green-500/20 text-green-400">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm leading-relaxed text-slate-300">
                      Email Delivery
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-green-500/20 text-green-400">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm leading-relaxed text-slate-300">
                      Basic Performance Insights
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-green-500/20 text-green-400">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm leading-relaxed text-slate-300">
                      Technique Breakdown
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-slate-400 text-sm">
            All plans include access to our core grappling analysis tools.
            <br />
            Upgrade or downgrade anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
