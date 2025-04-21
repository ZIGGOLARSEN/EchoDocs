"use client";

import React from "react";

interface SubscriptionCardProps {
  planName: string;
  price: number;
  frequency?: string;
  features: string[];
  ctaText?: string;
  isPopular?: boolean;
  popularBadgeText?: string;
}

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M5 13l4 4L19 7"></path>
  </svg>
);

const SubscriptionCard = ({
  planName,
  price,
  frequency = "/month",
  features,
  ctaText = "Choose Plan",
  isPopular = false,
  popularBadgeText = "Most Popular",
}: SubscriptionCardProps) => {
  return (
    <div
      className={`
        bg-dark-200 rounded-lg shadow-md p-6 border flex flex-col w-full max-w-[375px] h-[450px]
        ${isPopular ? "border-purple-500 border-2 relative" : "border-dark-300"}
      `}
    >
      {isPopular && (
        <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full absolute -top-3 right-3">{popularBadgeText}</span>
      )}

      <h3 className="text-xl font-semibold text-blue-100 mb-4">{planName}</h3>

      <div className="mb-6">
        <span className="text-4xl font-bold text-white">${price}</span>
        <span className="text-lg text-blue-200">{frequency}</span>
      </div>

      <ul className="space-y-3 text-blue-200 mb-8 flex flex-col flex-grow justify-center items-start">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start">
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => console.log(`You chose Plan ${planName}`)}
        className={`
          w-full py-2 px-4 rounded-md font-semibold text-center transition duration-300
          ${isPopular ? "bg-purple-500 text-white hover:bg-purple-600" : "bg-dark-300 text-blue-100 hover:bg-dark-400"}
        `}
      >
        {ctaText}
      </button>
    </div>
  );
};

export default SubscriptionCard;
