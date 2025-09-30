// PlansPage.tsx
import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import BillingToggle from "./components/BillingToggle";
import PlanCard from "./components/PlanCard";
import OneTimeCard from "./components/OneTimeCard";

interface SubscriptionData {
  plan: string;
  interval: string | null;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  remaining_report_credits?: number;

  // new fields from API
  trial_active?: boolean;
  trial_start?: string;
  trial_end?: string;
  period_start?: string;
  period_end?: string;
  used?: number;
  limit?: number;
  remaining?: number;
}

const PlansPage = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await axiosInstance.get("/users/limits/");
        setSubscription(response.data);

        // Set the current plan and billing cycle based on subscription
        if (response.data.plan) {
          setSelectedPlan(response.data.plan);
          setBillingCycle(
            response.data.interval === "year" ? "annual" : "monthly"
          );
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
        // If no subscription exists, user stays on free plan
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscription();
  }, []);

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
    // if (planId === "free") {
    //   setSelectedPlan(planId);
    //   console.log(`Selected plan: ${planId} - ${billingCycle}`);
    //   return;
    // }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loadingSubscription) {
    return (
      <div className="min-h-screen px-4 py-16 bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">
            Loading subscription...
          </p>
        </div>
      </div>
    );
  }

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

        {/* Current Subscription Status */}
        {subscription && subscription.plan !== "free" && (
          <div className="mx-auto mb-12">
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-300 p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Current Subscription:{" "}
                    {subscription.plan.charAt(0).toUpperCase() +
                      subscription.plan.slice(1)}{" "}
                    Plan
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-slate-400">
                        Status:
                      </span>
                      <span
                        className={
                          subscription.status === "active"
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : "text-yellow-600 dark:text-yellow-400 font-semibold"
                        }
                      >
                        {subscription.status.charAt(0).toUpperCase() +
                          subscription.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-slate-400">
                        Billing Cycle:
                      </span>
                      <span className="text-gray-900 dark:text-slate-200">
                        {subscription.interval === "year"
                          ? "Annual"
                          : subscription.interval === "month"
                          ? "Monthly"
                          : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-slate-400">
                        Renews on:
                      </span>
                      <span className="text-gray-900 dark:text-slate-200">
                        {subscription.current_period_end
                          ? formatDate(subscription.current_period_end)
                          : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-slate-400">
                        Usage:
                      </span>
                      <span className="text-gray-900 dark:text-slate-200 font-semibold">
                        {subscription.used}/{subscription.limit} analyses used
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-slate-400">
                        Remaining:
                      </span>
                      <span className="text-gray-900 dark:text-slate-200 font-semibold">
                        {subscription.remaining} analyses left
                      </span>
                    </div>

                    {subscription.cancel_at_period_end && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          Subscription will cancel at period end
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handlePlanSelect(subscription.plan)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg whitespace-nowrap"
                  >
                    Manage Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
