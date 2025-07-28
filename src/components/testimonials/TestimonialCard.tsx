import React from "react";
import { Star, Quote, MapPin, CheckCircle } from "lucide-react";

export interface TestimonialData {
  id: number;
  authorName: string;
  authorLocation?: string;
  courseTaken: string;
  courseDate?: string;
  content: string;
  rating: number;
  photoUrl?: string;
  showFullName: boolean;
  verifiedBooking: boolean;
  createdAt: string;
}

interface TestimonialCardProps {
  testimonial: TestimonialData;
  variant?: "default" | "featured" | "compact";
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  variant = "default",
}) => {
  const displayName = testimonial.showFullName
    ? testimonial.authorName
    : `${testimonial.authorName.split(" ")[0]} ${testimonial.authorName.split(" ").slice(-1)[0][0]}.`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  if (variant === "compact") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <p className="text-gray-700 text-sm line-clamp-3 mb-3">
          "{testimonial.content}"
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">{testimonial.courseTaken}</p>
          </div>
          {testimonial.verifiedBooking && (
            <CheckCircle className="w-4 h-4 text-green-600" title="Verified" />
          )}
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg border border-primary-200 p-8 relative overflow-hidden">
        <Quote className="absolute top-4 right-4 w-24 h-24 text-primary-100" />

        <div className="relative z-10">
          <div className="flex items-start gap-6 mb-6">
            {testimonial.photoUrl && (
              <img
                src={testimonial.photoUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            )}

            <div className="flex-1">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonial.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              <p className="text-lg text-gray-800 italic leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-primary-100 pt-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{displayName}</p>
                {testimonial.verifiedBooking && (
                  <CheckCircle
                    className="w-5 h-5 text-green-600"
                    title="Verified Customer"
                  />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>{testimonial.courseTaken}</span>
                {testimonial.authorLocation && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.authorLocation}
                    </div>
                  </>
                )}
              </div>
            </div>

            {testimonial.courseDate && (
              <p className="text-sm text-gray-500">
                {formatDate(testimonial.courseDate)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex items-start gap-4 mb-4">
        {testimonial.photoUrl && (
          <img
            src={testimonial.photoUrl}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover"
          />
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                {testimonial.verifiedBooking && (
                  <CheckCircle
                    className="w-4 h-4 text-green-600"
                    title="Verified Customer"
                  />
                )}
              </div>
              {testimonial.authorLocation && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {testimonial.authorLocation}
                </p>
              )}
            </div>

            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < testimonial.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-600 font-medium mb-3">
            {testimonial.courseTaken}
          </p>

          <blockquote className="text-gray-700 italic relative">
            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-gray-200" />
            <p className="pl-6">{testimonial.content}</p>
          </blockquote>

          {testimonial.courseDate && (
            <p className="text-sm text-gray-400 mt-3">
              Completed {formatDate(testimonial.courseDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
