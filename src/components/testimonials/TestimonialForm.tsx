import React, { useState } from "react";
import { Star, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@contexts/ToastContext";
import { testimonialApi } from "@services/api.service";

interface TestimonialFormProps {
  onSuccess?: () => void;
  bookingReference?: string;
}

export const TestimonialForm: React.FC<TestimonialFormProps> = ({
  onSuccess,
  bookingReference,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    authorLocation: "",
    courseTaken: "",
    courseDate: "",
    content: "",
    showFullName: true,
    photoConsent: "not_given",
    bookingReference: bookingReference || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: "Photo must be less than 5MB",
        }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          photo: "Please upload an image file",
        }));
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear photo error
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.authorName.trim()) {
      newErrors.authorName = "Name is required";
    }

    if (!formData.authorEmail.trim()) {
      newErrors.authorEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorEmail)) {
      newErrors.authorEmail = "Invalid email format";
    }

    if (!formData.courseTaken) {
      newErrors.courseTaken = "Please select a course";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Testimonial content is required";
    } else if (formData.content.trim().length < 50) {
      newErrors.content = "Please write at least 50 characters";
    } else if (formData.content.length > 1000) {
      newErrors.content = "Testimonial must be less than 1000 characters";
    }

    if (photoFile && formData.photoConsent === "not_given") {
      newErrors.photoConsent = "Please give consent to use your photo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await testimonialApi.submitForm({
        authorName: formData.authorName,
        authorEmail: formData.authorEmail,
        authorLocation: formData.authorLocation,
        courseTaken: formData.courseTaken,
        courseDate: formData.courseDate,
        content: formData.content,
        rating: rating,
        showFullName: formData.showFullName,
        photoConsent: formData.photoConsent,
        bookingReference: formData.bookingReference,
        photo: photoFile || undefined,
      });

      showToast(
        "success",
        response.message || "Thank you for your testimonial! We appreciate your feedback and will review it shortly.",
      );

      // Reset form
      setFormData({
        authorName: "",
        authorEmail: "",
        authorLocation: "",
        courseTaken: "",
        courseDate: "",
        content: "",
        showFullName: true,
        photoConsent: "not_given",
        bookingReference: "",
      });
      setRating(5);
      setPhotoFile(null);
      setPhotoPreview("");

      onSuccess?.();
    } catch (error: any) {
      console.error("Testimonial submission error:", error);
      showToast(
        "error",
        error.response?.data?.message ||
          "There was an error submitting your testimonial. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const courses = [
    "Emergency First Aid at Work",
    "First Aid at Work",
    "Paediatric First Aid",
    "Mental Health First Aid",
    "Fire Safety Training",
    "Basic Life Support",
    "First Aid at Work Requalification",
    "Emergency First Aid at Work Requalification",
    "Paediatric First Aid Requalification",
    "Emergency Paediatric First Aid",
    "Activity First Aid",
    "CPR & AED Training",
    "Annual Skills Refresher",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you rate your experience?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-colors"
            >
              <Star
                className={`w-8 h-8 ${
                  value <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="authorName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="authorName"
            name="authorName"
            value={formData.authorName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.authorName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="John Smith"
          />
          {errors.authorName && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.authorName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="authorEmail"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="authorEmail"
            name="authorEmail"
            value={formData.authorEmail}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.authorEmail ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="john.smith@example.com"
          />
          {errors.authorEmail && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.authorEmail}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="authorLocation"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location (Optional)
          </label>
          <input
            type="text"
            id="authorLocation"
            name="authorLocation"
            value={formData.authorLocation}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Leeds, Yorkshire"
          />
        </div>

        <div>
          <label
            htmlFor="bookingReference"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Booking Reference (Optional)
          </label>
          <input
            type="text"
            id="bookingReference"
            name="bookingReference"
            value={formData.bookingReference}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="RFT-2025-XXXX"
          />
          <p className="text-xs text-gray-500 mt-1">
            Providing your booking reference helps us verify your testimonial
          </p>
        </div>
      </div>

      {/* Course Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="courseTaken"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Course Taken <span className="text-red-500">*</span>
          </label>
          <select
            id="courseTaken"
            name="courseTaken"
            value={formData.courseTaken}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.courseTaken ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
          {errors.courseTaken && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.courseTaken}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="courseDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Course Date (Optional)
          </label>
          <input
            type="date"
            id="courseDate"
            name="courseDate"
            value={formData.courseDate}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Testimonial Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Your Testimonial <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={5}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.content ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Tell us about your experience with React Fast Training..."
        />
        <div className="flex justify-between mt-1">
          <div>
            {errors.content && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.content}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formData.content.length}/1000 characters
          </p>
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Your Photo (Optional)
        </label>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label
              htmlFor="photo"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5" />
              Choose Photo
            </label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoFile && (
              <span className="text-sm text-gray-600">{photoFile.name}</span>
            )}
          </div>

          {photoPreview && (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview("");
                  setFormData((prev) => ({
                    ...prev,
                    photoConsent: "not_given",
                  }));
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}

          {photoFile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.photoConsent === "given"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      photoConsent: e.target.checked ? "given" : "not_given",
                    }))
                  }
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I give permission for React Fast Training to use my photo on
                  their website and marketing materials
                </span>
              </label>
              {errors.photoConsent && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.photoConsent}
                </p>
              )}
            </div>
          )}

          {errors.photo && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.photo}
            </p>
          )}
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-gray-900">Display Preferences</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="showFullName"
            checked={formData.showFullName}
            onChange={handleChange}
            className="rounded"
          />
          <span className="text-sm text-gray-700">
            Display my full name (unchecked will show first name and last
            initial only)
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-3 bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isSubmitting
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-primary-700"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit Testimonial
            </>
          )}
        </button>
      </div>
    </form>
  );
};
