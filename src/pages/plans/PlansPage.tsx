// PlansPage.tsx
import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import BillingToggle from "./components/BillingToggle";
import PlanCard from "./components/PlanCard";
import OneTimeCard from "./components/OneTimeCard";
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

      if (response.data) {
        if (
          response.data.action === "new_subscription" &&
          response.data.checkout_url
        ) {
          window.location.href = response.data.checkout_url;
        } else if (
          response.data.action === "manage_existing" &&
          response.data.billing_portal_url
        ) {
          window.location.href = response.data.billing_portal_url;
        } else {
          console.error("No valid URL received");
          alert("Payment session could not be created. Please try again.");
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to create payment session. Please try again.");
    } finally {
      setLoadingPlan("");
    }
  };

  return (
    <div className="min-h-screen px-4 py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 uppercase">
            MANAGE YOUR PLAN
          </h1>
          <p className="text-gray-600 dark:text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Individual Grappler Portal - For hobbyists, local competitors, or
            anyone wanting detailed match insights
          </p>
        </div>

        {/* Billing Toggle */}
        <BillingToggle billingCycle={billingCycle} onToggle={setBillingCycle} />

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {currentPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              isLoading={loadingPlan === plan.id}
              onSelect={handlePlanSelect}
            />
          ))}
        </div>

        {/* One-Time Analysis Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              One-Time Analysis
            </h2>
            <p className="text-gray-600 dark:text-slate-300 text-lg">
              Perfect for occasional analysis needs
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <OneTimeCard
              isLoading={loadingPlan === "one-time"}
              onSelect={handlePlanSelect}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-gray-600 dark:text-slate-400 text-sm">
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
