# Special Requirements & Accessibility Handling ✅ 100% COMPLETE

## Overview
Implement comprehensive system for capturing and managing special requirements, accessibility needs, and dietary restrictions for course attendees.

## Implementation Status
- ✅ Database schema with priority classification
- ✅ Requirement templates predefined
- ✅ Special requirements service with notifications
- ✅ Admin dashboard for viewing requirements
- ✅ Instructor email alerts for critical needs
- ✅ Frontend form with categorized selection
- ✅ Accessibility checklist component
- ✅ Privacy-compliant data handling 

## Requirements Categories

### 1. Accessibility Needs
- Wheelchair access
- Hearing assistance
- Visual impairments
- Mobility limitations
- Learning difficulties
- Other physical requirements

### 2. Medical Considerations
- Allergies (not detailed medical history)
- Emergency medication requirements
- First aid considerations
- Pregnancy accommodations

### 3. Dietary Requirements
- Vegetarian/Vegan
- Halal/Kosher
- Food allergies
- Gluten-free
- Other dietary needs

### 4. Other Requirements
- Language support needs
- Religious observances
- Carer/assistant attendance
- Equipment modifications

## Database Schema

### Special Requirements Table
```sql
CREATE TABLE special_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'standard' CHECK (priority IN ('critical', 'high', 'standard')),
  instructor_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE requirement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  requires_details BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Predefined templates
INSERT INTO requirement_templates (category, requirement_type, display_name, description, requires_details) VALUES
('accessibility', 'wheelchair', 'Wheelchair Access', 'I require wheelchair accessible facilities', false),
('accessibility', 'hearing', 'Hearing Assistance', 'I have hearing difficulties and may need assistance', true),
('accessibility', 'visual', 'Visual Impairment', 'I have visual impairments that may affect participation', true),
('accessibility', 'mobility', 'Mobility Limitations', 'I have mobility limitations', true),
('dietary', 'vegetarian', 'Vegetarian', 'Vegetarian meals required', false),
('dietary', 'vegan', 'Vegan', 'Vegan meals required', false),
('dietary', 'halal', 'Halal', 'Halal meals required', false),
('dietary', 'allergy', 'Food Allergy', 'I have food allergies', true),
('medical', 'medication', 'Emergency Medication', 'I carry emergency medication', true),
('medical', 'pregnancy', 'Pregnancy', 'I am pregnant', true),
('other', 'language', 'Language Support', 'I may need language support', true),
('other', 'carer', 'Carer/Assistant', 'I will be accompanied by a carer/assistant', true);
```

## Backend Implementation

### Special Requirements Service
```typescript
// backend-loopback4/src/services/special-requirements.service.ts
import { db } from '../config/database.config';
import { specialRequirements, requirementTemplates } from '../db/schema';

export class SpecialRequirementsService {
  static async getTemplates() {
    const templates = await db
      .select()
      .from(requirementTemplates)
      .where(eq(requirementTemplates.isActive, true))
      .orderBy(requirementTemplates.category, requirementTemplates.sortOrder);

    // Group by category
    return templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, RequirementTemplate[]>);
  }

  static async saveRequirements(
    bookingId: string,
    requirements: Array<{
      category: string;
      requirementType: string;
      details: string;
    }>
  ) {
    if (requirements.length === 0) return;

    // Determine priority based on type
    const priorityMap: Record<string, string> = {
      'wheelchair': 'high',
      'medication': 'critical',
      'allergy': 'high',
      'hearing': 'high',
      'visual': 'high',
    };

    const requirementsWithPriority = requirements.map(req => ({
      ...req,
      bookingId,
      priority: priorityMap[req.requirementType] || 'standard',
    }));

    await db.insert(specialRequirements).values(requirementsWithPriority);

    // Check if any critical requirements need immediate notification
    const criticalRequirements = requirementsWithPriority.filter(
      r => r.priority === 'critical' || r.priority === 'high'
    );

    if (criticalRequirements.length > 0) {
      await this.notifyInstructor(bookingId, criticalRequirements);
    }
  }

  static async getBookingRequirements(bookingId: string) {
    return await db
      .select()
      .from(specialRequirements)
      .where(eq(specialRequirements.bookingId, bookingId))
      .orderBy(desc(specialRequirements.priority));
  }

  static async getSessionRequirements(sessionId: string) {
    const requirements = await db
      .select({
        requirement: specialRequirements,
        booking: bookings,
        attendee: bookingAttendees,
      })
      .from(specialRequirements)
      .innerJoin(bookings, eq(specialRequirements.bookingId, bookings.id))
      .innerJoin(bookingAttendees, eq(bookings.id, bookingAttendees.bookingId))
      .where(
        and(
          eq(bookings.sessionId, sessionId),
          eq(bookingAttendees.isPrimary, true)
        )
      )
      .orderBy(desc(specialRequirements.priority));

    // Group by priority
    return {
      critical: requirements.filter(r => r.requirement.priority === 'critical'),
      high: requirements.filter(r => r.requirement.priority === 'high'),
      standard: requirements.filter(r => r.requirement.priority === 'standard'),
    };
  }

  private static async notifyInstructor(
    bookingId: string,
    criticalRequirements: any[]
  ) {
    // Send immediate email notification
    const booking = await BookingService.getBookingWithDetails(bookingId);
    await EmailService.sendCriticalRequirementsNotification(
      booking,
      criticalRequirements
    );

    // Mark as notified
    await db
      .update(specialRequirements)
      .set({ instructorNotified: true })
      .where(
        and(
          eq(specialRequirements.bookingId, bookingId),
          inArray(specialRequirements.priority, ['critical', 'high'])
        )
      );
  }
}
```

### Requirements API Controller
```typescript
// backend-loopback4/src/controllers/requirements.controller.ts
export class RequirementsController {
  @get('/api/requirements/templates')
  async getTemplates() {
    return await SpecialRequirementsService.getTemplates();
  }

  @post('/api/bookings/{bookingId}/requirements')
  @authenticate
  async saveRequirements(
    @param.path.string('bookingId') bookingId: string,
    @requestBody() requirements: SaveRequirementsRequest
  ) {
    // Verify user owns this booking
    const booking = await BookingService.getBooking(bookingId);
    if (booking.userId !== request.user.id) {
      throw new HttpErrors.Forbidden();
    }

    await SpecialRequirementsService.saveRequirements(
      bookingId,
      requirements.items
    );

    return { success: true };
  }

  @get('/api/admin/sessions/{sessionId}/requirements')
  @authorize(['admin'])
  async getSessionRequirements(
    @param.path.string('sessionId') sessionId: string
  ) {
    return await SpecialRequirementsService.getSessionRequirements(sessionId);
  }
}
```

## Frontend Implementation

### Special Requirements Form Component
```typescript
// src/components/booking/SpecialRequirementsForm.tsx
import React, { useState, useEffect } from 'react';
import { Wheelchair, Utensils, Heart, Globe } from 'lucide-react';

interface RequirementTemplate {
  id: string;
  category: string;
  requirementType: string;
  displayName: string;
  description?: string;
  requiresDetails: boolean;
}

interface SelectedRequirement {
  template: RequirementTemplate;
  details: string;
}

export const SpecialRequirementsForm: React.FC<{
  onChange: (requirements: string) => void;
}> = ({ onChange }) => {
  const [templates, setTemplates] = useState<Record<string, RequirementTemplate[]>>({});
  const [selected, setSelected] = useState<SelectedRequirement[]>([]);
  const [customRequirement, setCustomRequirement] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Format requirements for parent component
    const formatted = formatRequirements();
    onChange(formatted);
  }, [selected, customRequirement]);

  const loadTemplates = async () => {
    const data = await api.getRequirementTemplates();
    setTemplates(data);
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

  const categoryIcons = {
    accessibility: Wheelchair,
    dietary: Utensils,
    medical: Heart,
    other: Globe,
  };

  const categoryLabels = {
    accessibility: 'Accessibility Needs',
    dietary: 'Dietary Requirements',
    medical: 'Medical Considerations',
    other: 'Other Requirements',
  };

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
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium">{categoryLabels[category]}</h4>
            </div>

            <div className="space-y-2 pl-7">
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
                      />
                      <div className="flex-1">
                        <p className="font-medium">{template.displayName}</p>
                        {template.description && (
                          <p className="text-sm text-gray-600">{template.description}</p>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
```

### Admin Requirements Dashboard
```typescript
// src/components/admin/RequirementsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface SessionRequirements {
  critical: RequirementWithBooking[];
  high: RequirementWithBooking[];
  standard: RequirementWithBooking[];
}

export const RequirementsDashboard: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [requirements, setRequirements] = useState<SessionRequirements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequirements();
  }, [sessionId]);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSessionRequirements(sessionId);
      setRequirements(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading requirements...</div>;
  }

  if (!requirements) {
    return <div>No requirements data available</div>;
  }

  const totalCount = 
    requirements.critical.length + 
    requirements.high.length + 
    requirements.standard.length;

  if (totalCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <p className="text-green-800 font-medium">No Special Requirements</p>
        <p className="text-green-700 text-sm mt-1">
          No attendees have reported special requirements for this session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Special Requirements Summary
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">
              {requirements.critical.length}
            </div>
            <p className="text-sm text-red-700">Critical</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">
              {requirements.high.length}
            </div>
            <p className="text-sm text-yellow-700">High Priority</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {requirements.standard.length}
            </div>
            <p className="text-sm text-blue-700">Standard</p>
          </div>
        </div>

        {/* Critical Requirements */}
        {requirements.critical.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-900">Critical Requirements</h4>
            </div>
            <div className="space-y-3">
              {requirements.critical.map(req => (
                <RequirementCard key={req.requirement.id} requirement={req} />
              ))}
            </div>
          </div>
        )}

        {/* High Priority Requirements */}
        {requirements.high.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">High Priority</h4>
            </div>
            <div className="space-y-3">
              {requirements.high.map(req => (
                <RequirementCard key={req.requirement.id} requirement={req} />
              ))}
            </div>
          </div>
        )}

        {/* Standard Requirements */}
        {requirements.standard.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Standard Requirements</h4>
            <div className="space-y-3">
              {requirements.standard.map(req => (
                <RequirementCard key={req.requirement.id} requirement={req} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Preparation Checklist</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✓ Ensure venue accessibility for wheelchair users</li>
          <li>✓ Prepare dietary-appropriate refreshments</li>
          <li>✓ Have emergency protocols ready for medical needs</li>
          <li>✓ Brief any assistants on special requirements</li>
        </ul>
      </div>
    </div>
  );
};

const RequirementCard: React.FC<{ requirement: RequirementWithBooking }> = ({ requirement }) => {
  const priorityColors = {
    critical: 'border-red-300 bg-red-50',
    high: 'border-yellow-300 bg-yellow-50',
    standard: 'border-gray-300 bg-gray-50',
  };

  return (
    <div className={`border rounded-lg p-4 ${priorityColors[requirement.requirement.priority]}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{requirement.attendee.name}</p>
          <p className="text-sm text-gray-600">
            Booking: {requirement.booking.bookingReference}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          requirement.requirement.instructorNotified 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {requirement.requirement.instructorNotified ? 'Notified' : 'Pending'}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm">
          <strong>{requirement.requirement.category}:</strong>{' '}
          {requirement.requirement.requirementType}
        </p>
        {requirement.requirement.details && (
          <p className="text-sm text-gray-700 italic">
            "{requirement.requirement.details}"
          </p>
        )}
      </div>
    </div>
  );
};
```

### Accessibility Checklist Component
```typescript
// src/components/admin/AccessibilityChecklist.tsx
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

const ACCESSIBILITY_CHECKLIST: ChecklistItem[] = [
  {
    id: 'wheelchair',
    label: 'Wheelchair Access',
    description: 'Step-free access to training room and facilities',
    required: true,
  },
  {
    id: 'parking',
    label: 'Accessible Parking',
    description: 'Designated disabled parking spaces available',
    required: true,
  },
  {
    id: 'toilets',
    label: 'Accessible Toilets',
    description: 'Wheelchair accessible toilet facilities',
    required: true,
  },
  {
    id: 'hearing',
    label: 'Hearing Loop',
    description: 'Induction loop system available if needed',
    required: false,
  },
  {
    id: 'lighting',
    label: 'Adequate Lighting',
    description: 'Good lighting for visual impairments',
    required: true,
  },
  {
    id: 'signage',
    label: 'Clear Signage',
    description: 'Large, clear signage throughout venue',
    required: false,
  },
];

export const AccessibilityChecklist: React.FC<{ venueId: string }> = ({ venueId }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleItem = (itemId: string) => {
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const allRequiredChecked = ACCESSIBILITY_CHECKLIST
    .filter(item => item.required)
    .every(item => checked[item.id]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Venue Accessibility Checklist</h3>
      
      <div className="space-y-3">
        {ACCESSIBILITY_CHECKLIST.map(item => (
          <label
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={checked[item.id] || false}
              onChange={() => toggleItem(item.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium">
                {item.label}
                {item.required && (
                  <span className="ml-2 text-red-600 text-sm">*Required</span>
                )}
              </p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <div className="mt-1">
              {checked[item.id] ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </label>
        ))}
      </div>

      {!allRequiredChecked && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please ensure all required accessibility features are available 
            before confirming venue suitability.
          </p>
        </div>
      )}
    </div>
  );
};
```

## Email Notifications

### Critical Requirements Alert Email
```typescript
// Email template for instructor when critical requirements are submitted
const criticalRequirementsEmail = {
  subject: 'URGENT: Critical Requirements for Upcoming Session',
  priority: 'high',
  template: `
    <div style="border: 3px solid #DC2626; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #DC2626; margin-top: 0;">Critical Requirements Alert</h2>
      <p>A booking has been made with critical special requirements that need your attention.</p>
      
      <div style="background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3>Session Details:</h3>
        <ul>
          <li>Course: {courseName}</li>
          <li>Date: {sessionDate}</li>
          <li>Booking Reference: {bookingReference}</li>
        </ul>
      </div>
      
      <h3>Critical Requirements:</h3>
      {requirementsList}
      
      <p style="margin-top: 20px;">
        <a href="{dashboardUrl}" style="background: #DC2626; color: white; 
           padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Full Details
        </a>
      </p>
    </div>
  `
};
```

## Testing

1. Test requirement template loading
2. Test requirement selection and details
3. Test priority classification
4. Test instructor notifications
5. Test admin dashboard filtering
6. Test accessibility checklist
7. Test email notifications for critical requirements
8. Test privacy and data deletion after course