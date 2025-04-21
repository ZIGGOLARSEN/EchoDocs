import React from "react";
import SubscriptionCard from "../../../components/SubscriptionCard";
import { subscriptionPlans } from "@/lib/utils";

const PricingPage = () => {
  return (
    <div className="py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-blue-100 text-center mb-4">Choose Your Plan</h2>
        <p className="text-center text-lg text-blue-100 mb-12">Simple, transparent pricing for teams of all sizes.</p>

        <div className="grid grid-cols-1 gap-8 min-[1250px]:grid-cols-3 place-items-center">
          {subscriptionPlans.map((plan, index) => (
            <SubscriptionCard key={index} {...plan} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
