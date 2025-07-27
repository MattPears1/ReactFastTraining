import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  category: 'access' | 'facilities' | 'equipment' | 'safety';
}

const ACCESSIBILITY_CHECKLIST: ChecklistItem[] = [
  // Access
  {
    id: 'wheelchair',
    label: 'Wheelchair Access',
    description: 'Step-free access to training room and facilities',
    required: true,
    category: 'access',
  },
  {
    id: 'parking',
    label: 'Accessible Parking',
    description: 'Designated disabled parking spaces available',
    required: true,
    category: 'access',
  },
  {
    id: 'entrance',
    label: 'Accessible Entrance',
    description: 'Wide doorways (min 36") and automatic doors if available',
    required: true,
    category: 'access',
  },
  // Facilities
  {
    id: 'toilets',
    label: 'Accessible Toilets',
    description: 'Wheelchair accessible toilet facilities with grab rails',
    required: true,
    category: 'facilities',
  },
  {
    id: 'lift',
    label: 'Lift Access',
    description: 'Working lift if training room is not on ground floor',
    required: false,
    category: 'facilities',
  },
  {
    id: 'breakroom',
    label: 'Accessible Break Area',
    description: 'Accessible space for lunch and refreshments',
    required: false,
    category: 'facilities',
  },
  // Equipment
  {
    id: 'hearing',
    label: 'Hearing Loop',
    description: 'Induction loop system available if needed',
    required: false,
    category: 'equipment',
  },
  {
    id: 'lighting',
    label: 'Adequate Lighting',
    description: 'Good lighting for visual impairments (min 500 lux)',
    required: true,
    category: 'equipment',
  },
  {
    id: 'adjustable',
    label: 'Adjustable Furniture',
    description: 'Height-adjustable tables and chairs available',
    required: false,
    category: 'equipment',
  },
  // Safety
  {
    id: 'evacuation',
    label: 'Emergency Evacuation',
    description: 'Clear evacuation plan for disabled attendees',
    required: true,
    category: 'safety',
  },
  {
    id: 'signage',
    label: 'Clear Signage',
    description: 'Large, clear signage throughout venue with braille where possible',
    required: false,
    category: 'safety',
  },
  {
    id: 'firstaid',
    label: 'Accessibility-Aware First Aid',
    description: 'First aiders briefed on accessibility needs',
    required: true,
    category: 'safety',
  },
];

interface AccessibilityChecklistProps {
  venueId?: string;
  venueName?: string;
  onSave?: (checkedItems: Record<string, boolean>) => void;
}

export const AccessibilityChecklist: React.FC<AccessibilityChecklistProps> = ({ 
  venueId, 
  venueName = 'Venue',
  onSave 
}) => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved checklist if venueId provided
    if (venueId) {
      loadSavedChecklist();
    }
  }, [venueId]);

  const loadSavedChecklist = async () => {
    // TODO: Load from API
    // For now, start with empty state
  };

  const toggleItem = (itemId: string) => {
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const updateNote = (itemId: string, note: string) => {
    setNotes(prev => ({ ...prev, [itemId]: note }));
  };

  const allRequiredChecked = ACCESSIBILITY_CHECKLIST
    .filter(item => item.required)
    .every(item => checked[item.id]);

  const completionPercentage = Math.round(
    (Object.values(checked).filter(Boolean).length / ACCESSIBILITY_CHECKLIST.length) * 100
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        onSave(checked);
      }
      // TODO: Save to API
    } finally {
      setSaving(false);
    }
  };

  const categories = {
    access: { label: 'Access', icon: '🚪' },
    facilities: { label: 'Facilities', icon: '🚻' },
    equipment: { label: 'Equipment', icon: '⚙️' },
    safety: { label: 'Safety', icon: '🚨' },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Venue Accessibility Checklist</h3>
          <p className="text-sm text-gray-600 mt-1">{venueName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">{completionPercentage}%</div>
          <p className="text-sm text-gray-600">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            allRequiredChecked ? 'bg-green-500' : 'bg-primary-600'
          }`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Categories */}
      {Object.entries(categories).map(([category, config]) => {
        const items = ACCESSIBILITY_CHECKLIST.filter(item => item.category === category);
        const checkedCount = items.filter(item => checked[item.id]).length;

        return (
          <div key={category} className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              {config.label}
              <span className="text-sm text-gray-500">
                ({checkedCount}/{items.length})
              </span>
            </h4>

            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-all ${
                    checked[item.id] 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked[item.id] || false}
                      onChange={() => toggleItem(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {item.label}
                          {item.required && (
                            <span className="ml-2 text-red-600 text-sm">*Required</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      
                      {checked[item.id] && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Add notes (optional)..."
                            value={notes[item.id] || ''}
                            onChange={(e) => updateNote(item.id, e.target.value)}
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-1">
                      {checked[item.id] ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Warning if not all required items checked */}
      {!allRequiredChecked && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                Required items incomplete
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Please ensure all required accessibility features are available 
                before confirming venue suitability.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !allRequiredChecked}
          variant="primary"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Checklist'}
        </Button>
      </div>
    </div>
  );
};