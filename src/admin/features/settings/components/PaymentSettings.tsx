import React from "react";
import { AlertCircle } from "lucide-react";
import { PaymentSettings as PaymentSettingsType } from "../types";

interface PaymentSettingsProps {
  settings: PaymentSettingsType;
  onChange: (updates: Partial<PaymentSettingsType>) => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Changes to payment settings may
              affect live transactions. Test thoroughly before saving.
            </p>
          </div>
        </div>
      </div>

      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
        <div>
          <div className="font-medium text-gray-900">Stripe Payments</div>
          <div className="admin-text-small admin-text-muted">
            Enable Stripe payment processing
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.stripeEnabled}
          onChange={(e) => onChange({ stripeEnabled: e.target.checked })}
          className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
        />
      </label>

      {settings.stripeEnabled && (
        <div className="space-y-4 ml-8">
          <div>
            <label className="admin-label">Stripe Public Key</label>
            <input
              type="text"
              value={settings.stripePublicKey}
              onChange={(e) => onChange({ stripePublicKey: e.target.value })}
              className="admin-input font-mono text-sm"
              placeholder="pk_test_..."
            />
          </div>
          <div>
            <label className="admin-label">Stripe Secret Key</label>
            <input
              type="password"
              value={settings.stripeSecretKey}
              onChange={(e) => onChange({ stripeSecretKey: e.target.value })}
              className="admin-input font-mono text-sm"
              placeholder="sk_test_..."
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enableTestMode}
              onChange={(e) => onChange({ enableTestMode: e.target.checked })}
              className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Enable test mode
            </span>
          </label>
        </div>
      )}
    </div>
  );
};