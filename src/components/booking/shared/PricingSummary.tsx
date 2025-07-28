import React from "react";
import { motion } from "framer-motion";
import { Info, Tag } from "lucide-react";
import { cn } from "@utils/cn";

interface PricingSummaryProps {
  pricePerPerson: number;
  numberOfParticipants: number;
  discountPercentage?: number;
  additionalFees?: Array<{ label: string; amount: number }>;
  showBreakdown?: boolean;
  className?: string;
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({
  pricePerPerson,
  numberOfParticipants,
  discountPercentage = 0,
  additionalFees = [],
  showBreakdown = true,
  className,
}) => {
  const subtotal = pricePerPerson * numberOfParticipants;
  const discountAmount = subtotal * (discountPercentage / 100);
  const feesTotal = additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
  const total = subtotal - discountAmount + feesTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3",
        className,
      )}
    >
      <h3 className="font-semibold text-lg mb-4">Pricing Summary</h3>

      {showBreakdown && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Price per person:
            </span>
            <span className="font-medium">£{pricePerPerson.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Number of participants:
            </span>
            <span className="font-medium">{numberOfParticipants}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium">£{subtotal.toFixed(2)}</span>
          </div>

          {discountPercentage > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between text-green-600 dark:text-green-400"
            >
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Group discount ({discountPercentage}%):
              </span>
              <span className="font-medium">-£{discountAmount.toFixed(2)}</span>
            </motion.div>
          )}

          {additionalFees.map((fee, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {fee.label}:
              </span>
              <span className="font-medium">£{fee.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t dark:border-gray-700 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total:</span>
          <motion.span
            key={total}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-primary-600 dark:text-primary-400"
          >
            £{total.toFixed(2)}
          </motion.span>
        </div>
      </div>

      {discountPercentage > 0 && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">Group Booking Discount Applied!</p>
              <p className="mt-1">
                You're saving £{discountAmount.toFixed(2)} with our group
                booking discount.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
