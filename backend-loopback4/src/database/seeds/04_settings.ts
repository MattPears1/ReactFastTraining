import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Check if settings already exist
  const existingSettings = await knex('settings').count('* as count');
  
  if (Number(existingSettings[0].count) === 0) {
    // Insert default system settings
    await knex('settings').insert([
      // Business Settings
      {
        key: 'business_name',
        value: 'React Fast Training',
        value_type: 'string',
        category: 'business',
        display_name: 'Business Name',
        description: 'Company name displayed throughout the site',
        is_public: true,
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'business_email',
        value: 'info@reactfasttraining.co.uk',
        value_type: 'string',
        category: 'business',
        display_name: 'Business Email',
        description: 'Primary contact email for the business',
        is_public: true,
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'business_phone',
        value: '0800 123 4567',
        value_type: 'string',
        category: 'business',
        display_name: 'Business Phone',
        description: 'Primary contact phone number',
        is_public: true,
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Booking Settings
      {
        key: 'booking_buffer_days',
        value: '3',
        value_type: 'number',
        category: 'booking',
        display_name: 'Booking Buffer Days',
        description: 'Minimum days before course date that bookings close',
        is_public: false,
        is_editable: true,
        default_value: '3',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'max_bookings_per_session',
        value: '12',
        value_type: 'number',
        category: 'booking',
        display_name: 'Maximum Bookings Per Session',
        description: 'Default maximum number of participants per training session',
        is_public: false,
        is_editable: true,
        default_value: '12',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'booking_auto_confirm',
        value: 'true',
        value_type: 'boolean',
        category: 'booking',
        display_name: 'Auto-confirm Bookings',
        description: 'Automatically confirm bookings when payment is successful',
        is_public: false,
        is_editable: true,
        default_value: 'true',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Email Settings
      {
        key: 'email_from_name',
        value: 'React Fast Training',
        value_type: 'string',
        category: 'email',
        display_name: 'Email From Name',
        description: 'Name shown in From field of system emails',
        is_public: false,
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'email_from_address',
        value: 'noreply@reactfasttraining.co.uk',
        value_type: 'string',
        category: 'email',
        display_name: 'Email From Address',
        description: 'Email address used for system notifications',
        is_public: false,
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'send_booking_reminders',
        value: 'true',
        value_type: 'boolean',
        category: 'email',
        display_name: 'Send Booking Reminders',
        description: 'Send email reminders before course dates',
        is_public: false,
        is_editable: true,
        default_value: 'true',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'reminder_days_before',
        value: '2',
        value_type: 'number',
        category: 'email',
        display_name: 'Reminder Days Before Course',
        description: 'How many days before course to send reminder',
        is_public: false,
        is_editable: true,
        default_value: '2',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Payment Settings
      {
        key: 'payment_provider',
        value: 'stripe',
        value_type: 'string',
        category: 'payment',
        display_name: 'Payment Provider',
        description: 'Payment gateway provider',
        is_public: false,
        is_editable: false,
        allowed_values: JSON.stringify(['stripe', 'paypal']),
        default_value: 'stripe',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'accept_online_payments',
        value: 'true',
        value_type: 'boolean',
        category: 'payment',
        display_name: 'Accept Online Payments',
        description: 'Allow customers to pay online',
        is_public: false,
        is_editable: true,
        default_value: 'true',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'refund_policy_days',
        value: '14',
        value_type: 'number',
        category: 'payment',
        display_name: 'Refund Policy Days',
        description: 'Number of days before course for full refund',
        is_public: true,
        is_editable: true,
        default_value: '14',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Certificate Settings
      {
        key: 'certificate_validity_years',
        value: '3',
        value_type: 'number',
        category: 'certificate',
        display_name: 'Certificate Validity Years',
        description: 'How long certificates are valid for',
        is_public: true,
        is_editable: true,
        default_value: '3',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'auto_issue_certificates',
        value: 'true',
        value_type: 'boolean',
        category: 'certificate',
        display_name: 'Auto-issue Certificates',
        description: 'Automatically issue certificates on course completion',
        is_public: false,
        is_editable: true,
        default_value: 'true',
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // System Settings
      {
        key: 'maintenance_mode',
        value: 'false',
        value_type: 'boolean',
        category: 'system',
        display_name: 'Maintenance Mode',
        description: 'Put site in maintenance mode',
        is_public: false,
        is_editable: true,
        requires_restart: false,
        default_value: 'false',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'session_timeout_minutes',
        value: '60',
        value_type: 'number',
        category: 'system',
        display_name: 'Session Timeout (minutes)',
        description: 'Admin session timeout in minutes',
        is_public: false,
        is_editable: true,
        default_value: '60',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
    
    console.log('System settings seeded successfully');
  } else {
    console.log('Settings already exist, skipping seed');
  }
}