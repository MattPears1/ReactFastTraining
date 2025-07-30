import React from "react";
import { Building2, Mail, Phone, MapPin, Globe, FileText } from "lucide-react";
import { BusinessSettings } from "../types";

interface BusinessSettingsFormProps {
  settings: BusinessSettings;
  onChange: (settings: BusinessSettings) => void;
  editMode: boolean;
}

export const BusinessSettingsForm: React.FC<BusinessSettingsFormProps> = ({
  settings,
  onChange,
  editMode,
}) => {
  const handleChange = (field: keyof BusinessSettings, value: string) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Building2 className="h-4 w-4" />
              Business Name
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4" />
              Registration Number
            </label>
            <input
              type="text"
              value={settings.registrationNumber}
              onChange={(e) =>
                handleChange("registrationNumber", e.target.value)
              }
              disabled={!editMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Phone className="h-4 w-4" />
              Phone
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4" />
              Address
            </label>
            <textarea
              value={settings.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={!editMode}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Globe className="h-4 w-4" />
              Website
            </label>
            <input
              type="url"
              value={settings.website}
              onChange={(e) => handleChange("website", e.target.value)}
              disabled={!editMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
