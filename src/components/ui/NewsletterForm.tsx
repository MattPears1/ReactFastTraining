import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { useToast } from "@contexts/ToastContext";
import { cn } from "@utils/cn";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

interface NewsletterFormProps {
  variant?: "default" | "inline";
  className?: string;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({
  variant = "inline",
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      showToast("success", "Successfully subscribed to newsletter!");
      reset();
    } catch (error) {
      showToast("error", "Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "default") {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
      >
        <div>
          <label htmlFor="newsletter-email" className="form-label">
            Email Address
          </label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Enter your email"
            className="form-input"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Subscribing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Subscribe
            </span>
          )}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col sm:flex-row gap-3", className)}
    >
      <div className="flex-1">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all duration-200"
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-white/90">{errors.email.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
            <span className="sr-only">Subscribing...</span>
          </span>
        ) : (
          "Subscribe"
        )}
      </button>
    </form>
  );
};

export default NewsletterForm;
