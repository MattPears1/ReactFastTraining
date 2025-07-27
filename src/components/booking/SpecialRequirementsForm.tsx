import React, { useState, useEffect } from 'react';
import { Wheelchair, Utensils, Heart, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/services/api.service';

interface RequirementTemplate {
  id: string;
  category: string;
  requirementType: string;
  displayName: string;
  description?: string;
  requiresDetails: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface SelectedRequirement {
  template: RequirementTemplate;
  details: string;
}

interface SpecialRequirementsFormProps {
  onChange: (requirements: string) => void;
  value?: string;
}

export const SpecialRequirementsForm: React.FC<SpecialRequirementsFormProps> = ({ 
  onChange, 
  value = '' 
}) => {
  const [templates, setTemplates] = useState<Record<string, RequirementTemplate[]>>({});
  const [selected, setSelected] = useState<SelectedRequirement[]>([]);
  const [customRequirement, setCustomRequirement] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Parse existing value if provided
    if (value && selected.length === 0) {
      // Parse the value to restore state
      const parts = value.split('; ');
      const customPart = parts.find(p => p.startsWith('Other: '));
      if (customPart) {
        setCustomRequirement(customPart.replace('Other: ', ''));
      }
    }
  }, [value]);

  useEffect(() => {
    // Format requirements for parent component
    const formatted = formatRequirements();
    onChange(formatted);
  }, [selected, customRequirement]);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/requirements/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load requirement templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleRequirement = (template: RequirementTemplate) => {
    const index = selected.findIndex(s => s.template.id === template.id);
    
    if (index >= 0) {
      // Remove
      setSelected(selected.filter((_, i) => i !== index));
    } else {
      // Add
      setSelected([...selected, { template, details: '' }]);
    }
  };

  const updateDetails = (templateId: string, details: string) => {
    setSelected(selected.map(s => 
      s.template.id === templateId ? { ...s, details } : s
    ));
  };

  const formatRequirements = (): string => {
    const parts: string[] = [];

    // Add selected requirements
    selected.forEach(s => {
      if (s.template.requiresDetails && s.details) {
        parts.push(`${s.template.displayName}: ${s.details}`);
      } else if (!s.template.requiresDetails) {
        parts.push(s.template.displayName);
      }
    });

    // Add custom requirement
    if (customRequirement.trim()) {
      parts.push(`Other: ${customRequirement}`);
    }

    return parts.join('; ');
  };

  const categoryIcons: Record<string, any> = {
    accessibility: Wheelchair,
    dietary: Utensils,
    medical: Heart,
    other: Globe,
  };

  const categoryLabels: Record<string, string> = {
    accessibility: 'Accessibility Needs',
    dietary: 'Dietary Requirements',
    medical: 'Medical Considerations',
    other: 'Other Requirements',
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Special Requirements</h3>
        <p className="text-sm text-gray-600">
          Please let us know about any special requirements or accommodations needed.
          We'll do our best to ensure everyone can fully participate.
        </p>
      </div>

      {Object.entries(templates).map(([category, items]) => {
        const Icon = categoryIcons[category];
        const isExpanded = expandedCategories.has(category);
        const hasSelected = selected.some(s => s.template.category === category);

        return (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors
                         flex items-center justify-between"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium">{categoryLabels[category]}</span>
                {hasSelected && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                    {selected.filter(s => s.template.category === category).length} selected
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4 space-y-3">
                {items.map(template => {
                  const isSelected = selected.some(s => s.template.id === template.id);
                  const selectedItem = selected.find(s => s.template.id === template.id);

                  return (
                    <div key={template.id} className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRequirement(template)}
                          className="mt-1"
                          aria-describedby={`desc-${template.id}`}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{template.displayName}</p>
                          {template.description && (
                            <p id={`desc-${template.id}`} className="text-sm text-gray-600">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </label>

                      {isSelected && template.requiresDetails && (
                        <div className="ml-6">
                          <textarea
                            value={selectedItem?.details || ''}
                            onChange={(e) => updateDetails(template.id, e.target.value)}
                            placeholder="Please provide more details..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            aria-label={`Details for ${template.displayName}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Custom Requirements */}
      <div>
        <label className="block font-medium mb-2">
          Other Requirements
        </label>
        <textarea
          value={customRequirement}
          onChange={(e) => setCustomRequirement(e.target.value)}
          placeholder="Please describe any other requirements or needs..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Privacy Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Privacy Note:</strong> This information will only be used to ensure 
          we can accommodate your needs during the training. It will be shared only 
          with the instructor and deleted after the course completion.
        </p>
      </div>
    </div>
  );
};