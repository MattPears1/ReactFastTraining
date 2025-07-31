import React, { useState } from "react";
import { Send, Clock, AlertCircle } from "lucide-react";
import { EmailTemplate, EmailRecipient } from "../types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const emailComposeSchema = z.object({
  template: z.string().min(1, "Please select a template"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Email content is required"),
  scheduledFor: z.string().optional(),
});

type EmailComposeForm = z.infer<typeof emailComposeSchema>;

interface EmailComposeProps {
  templates: EmailTemplate[];
  recipients: EmailRecipient[];
  onSend: (data: EmailComposeForm, recipientIds: string[]) => void;
  onToggleRecipient: (id: string) => void;
  onSelectAllRecipients: (selected: boolean) => void;
}

export const EmailCompose: React.FC<EmailComposeProps> = ({
  templates,
  recipients,
  onSend,
  onToggleRecipient,
  onSelectAllRecipients,
}) => {
  const [sending, setSending] = useState(false);
  const selectedRecipients = recipients.filter(r => r.selected);
  const allSelected = recipients.length > 0 && selectedRecipients.length === recipients.length;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmailComposeForm>({
    resolver: zodResolver(emailComposeSchema),
  });

  const selectedTemplate = watch("template");

  React.useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setValue("subject", template.subject);
        // In a real app, this would load the template content
        setValue("content", `Template content for: ${template.name}`);
      }
    }
  }, [selectedTemplate, templates, setValue]);

  const onSubmit = async (data: EmailComposeForm) => {
    if (selectedRecipients.length === 0) {
      alert("Please select at least one recipient");
      return;
    }

    setSending(true);
    try {
      await onSend(data, selectedRecipients.map(r => r.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Email Form */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Compose Email
          </h3>

          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template
            </label>
            <select
              {...register("template")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a template</option>
              {templates
                .filter(t => t.status === "active")
                .map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
            </select>
            {errors.template && (
              <p className="mt-1 text-sm text-red-600">{errors.template.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              {...register("subject")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content
            </label>
            <textarea
              {...register("content")}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schedule Send (Optional)
            </label>
            <input
              type="datetime-local"
              {...register("scheduledFor")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} selected
            </div>
            <button
              type="submit"
              disabled={sending || selectedRecipients.length === 0}
              className="btn btn-primary flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recipients */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recipients
          </h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAllRecipients(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Select All
            </span>
          </label>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recipients.map((recipient) => (
            <label
              key={recipient.id}
              className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={recipient.selected}
                onChange={() => onToggleRecipient(recipient.id)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {recipient.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {recipient.email}
                </div>
              </div>
            </label>
          ))}
        </div>

        {recipients.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recipients available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};