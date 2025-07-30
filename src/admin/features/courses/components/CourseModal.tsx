import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { AdminCard } from "../../../components/ui/AdminCard";
import { AdminBadge } from "../../../components/ui/AdminBadge";
import { adminApi } from "../../../utils/api";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  course?: any;
  mode: "create" | "edit";
}

const COURSE_TYPES = [
  { value: "EFAW", label: "Emergency First Aid at Work" },
  { value: "FAW", label: "First Aid at Work (3 Day)" },
  { value: "EFAW_REQUALIFICATION", label: "EFAW Requalification" },
  { value: "FAW_REQUALIFICATION", label: "FAW Requalification" },
  { value: "PAEDIATRIC", label: "Paediatric First Aid" },
  { value: "BESPOKE", label: "Bespoke Course" },
];

const CATEGORIES = [
  { value: "workplace", label: "Workplace" },
  { value: "paediatric", label: "Paediatric" },
  { value: "specialist", label: "Specialist" },
  { value: "requalification", label: "Requalification" },
];

const ACCREDITATION_BODIES = [
  { value: "HSE", label: "HSE Approved" },
  { value: "OFQUAL", label: "Ofqual Regulated" },
  { value: "QCF", label: "QCF Level 3" },
];

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  course,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    courseType: "EFAW",
    category: "workplace",
    duration: "1 Day",
    durationHours: 6,
    price: 75,
    maxCapacity: 12,
    minAttendees: 1,
    certificationValidityYears: 3,
    learningOutcomes: [""],
    prerequisites: "",
    includedMaterials: [""],
    targetAudience: "",
    accreditationBody: "HSE",
    accreditationNumber: "",
    isActive: true,
    isFeatured: false,
    earlyBirdDiscountPercentage: 0,
    earlyBirdDaysBefore: 7,
    groupDiscountPercentage: 10,
    groupSizeMinimum: 4,
    cancellationPolicy:
      "Cancellations must be made at least 48 hours before the course start time for a full refund.",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (course && mode === "edit") {
      setFormData({
        ...formData,
        ...course,
        learningOutcomes: course.learningOutcomes || [""],
        includedMaterials: course.includedMaterials || [""],
      });
    }
  }, [course, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleArrayFieldChange = (
    field: string,
    index: number,
    value: string,
  ) => {
    const newArray = [
      ...(formData[field as keyof typeof formData] as string[]),
    ];
    newArray[index] = value;
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof formData] as string[]), ""],
    }));
  };

  const removeArrayField = (field: string, index: number) => {
    const newArray = [
      ...(formData[field as keyof typeof formData] as string[]),
    ];
    newArray.splice(index, 1);
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Course name is required";
    if (!formData.description)
      newErrors.description = "Description is required";
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0";
    if (formData.maxCapacity <= 0)
      newErrors.maxCapacity = "Max capacity must be greater than 0";
    if (formData.durationHours <= 0)
      newErrors.durationHours = "Duration hours must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      // Filter out empty learning outcomes and materials
      const submitData = {
        ...formData,
        learningOutcomes: formData.learningOutcomes.filter((lo) => lo.trim()),
        includedMaterials: formData.includedMaterials.filter((im) => im.trim()),
      };

      if (mode === "create") {
        await adminApi.post("/api/admin/courses", submitData);
      } else {
        await adminApi.put(`/api/admin/courses/${course.id}`, submitData);
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving course:", error);
      setErrors({ submit: error.message || "Failed to save course" });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Create New Course" : "Edit Course"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`admin-input ${errors.name ? "border-red-500" : ""}`}
                    placeholder="e.g., Emergency First Aid at Work"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Type *
                  </label>
                  <select
                    value={formData.courseType}
                    onChange={(e) =>
                      handleInputChange("courseType", e.target.value)
                    }
                    className="admin-select"
                  >
                    {COURSE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className="admin-select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (£) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      handleInputChange(
                        "price",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className={`admin-input ${errors.price ? "border-red-500" : ""}`}
                    min="0"
                    step="0.01"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className={`admin-input h-32 ${errors.description ? "border-red-500" : ""}`}
                placeholder="Provide a detailed description of the course..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Duration and Capacity */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Duration & Capacity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    className="admin-input"
                    placeholder="e.g., 1 Day"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Hours) *
                  </label>
                  <input
                    type="number"
                    value={formData.durationHours}
                    onChange={(e) =>
                      handleInputChange(
                        "durationHours",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className={`admin-input ${errors.durationHours ? "border-red-500" : ""}`}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) =>
                      handleInputChange(
                        "maxCapacity",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className={`admin-input ${errors.maxCapacity ? "border-red-500" : ""}`}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Attendees
                  </label>
                  <input
                    type="number"
                    value={formData.minAttendees}
                    onChange={(e) =>
                      handleInputChange(
                        "minAttendees",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="admin-input"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Accreditation */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Accreditation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accreditation Body
                  </label>
                  <select
                    value={formData.accreditationBody}
                    onChange={(e) =>
                      handleInputChange("accreditationBody", e.target.value)
                    }
                    className="admin-select"
                  >
                    <option value="">None</option>
                    {ACCREDITATION_BODIES.map((body) => (
                      <option key={body.value} value={body.value}>
                        {body.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accreditation Number
                  </label>
                  <input
                    type="text"
                    value={formData.accreditationNumber}
                    onChange={(e) =>
                      handleInputChange("accreditationNumber", e.target.value)
                    }
                    className="admin-input"
                    placeholder="e.g., HSE123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate Validity (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.certificationValidityYears}
                    onChange={(e) =>
                      handleInputChange(
                        "certificationValidityYears",
                        parseInt(e.target.value) || 3,
                      )
                    }
                    className="admin-input"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Learning Outcomes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Learning Outcomes</h3>
              {formData.learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "learningOutcomes",
                        index,
                        e.target.value,
                      )
                    }
                    className="admin-input flex-1"
                    placeholder="e.g., Understand the role of a first aider"
                  />
                  {formData.learningOutcomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeArrayField("learningOutcomes", index)
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField("learningOutcomes")}
                className="admin-btn admin-btn-secondary admin-btn-sm mt-2"
              >
                <Plus className="w-4 h-4" />
                Add Learning Outcome
              </button>
            </div>

            {/* Included Materials */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Included Materials</h3>
              {formData.includedMaterials.map((material, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={material}
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "includedMaterials",
                        index,
                        e.target.value,
                      )
                    }
                    className="admin-input flex-1"
                    placeholder="e.g., Course manual and certificate"
                  />
                  {formData.includedMaterials.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeArrayField("includedMaterials", index)
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField("includedMaterials")}
                className="admin-btn admin-btn-secondary admin-btn-sm mt-2"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </button>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Additional Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prerequisites
                  </label>
                  <textarea
                    value={formData.prerequisites}
                    onChange={(e) =>
                      handleInputChange("prerequisites", e.target.value)
                    }
                    className="admin-input h-24"
                    placeholder="List any prerequisites or requirements..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) =>
                      handleInputChange("targetAudience", e.target.value)
                    }
                    className="admin-input"
                    placeholder="e.g., Workplace first aiders, managers, supervisors"
                  />
                </div>
              </div>
            </div>

            {/* Discounts */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Discounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Early Bird Discount</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        value={formData.earlyBirdDiscountPercentage}
                        onChange={(e) =>
                          handleInputChange(
                            "earlyBirdDiscountPercentage",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="admin-input"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Days Before
                      </label>
                      <input
                        type="number"
                        value={formData.earlyBirdDaysBefore}
                        onChange={(e) =>
                          handleInputChange(
                            "earlyBirdDaysBefore",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="admin-input"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Group Discount</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        value={formData.groupDiscountPercentage}
                        onChange={(e) =>
                          handleInputChange(
                            "groupDiscountPercentage",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="admin-input"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Min Group Size
                      </label>
                      <input
                        type="number"
                        value={formData.groupSizeMinimum}
                        onChange={(e) =>
                          handleInputChange(
                            "groupSizeMinimum",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="admin-input"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium">
                    Active (Course is available for booking)
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      handleInputChange("isFeatured", e.target.checked)
                    }
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium">
                    Featured (Show prominently on website)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === "create" ? "Create Course" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
