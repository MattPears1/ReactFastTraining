import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('certificate_templates').del();
  
  // Insert certificate templates for each course type
  await knex('certificate_templates').insert([
    {
      name: 'Emergency First Aid at Work Certificate',
      course_type: 'EFAW',
      certification_body: 'HSE',
      validity_years: 3,
      template_variables: JSON.stringify({
        logo_path: '/assets/logos/hse-approved.png',
        trainer_signature: '/assets/signatures/lex-richardson.png',
        accreditation_numbers: ['HSE123456', 'OFQUAL789']
      }),
      template_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .certificate { 
      border: 2px solid #0EA5E9; 
      padding: 40px; 
      max-width: 800px; 
      margin: 0 auto;
      text-align: center;
      background: white;
    }
    .header { color: #0EA5E9; margin-bottom: 30px; }
    .title { font-size: 32px; font-weight: bold; margin: 20px 0; }
    .recipient { font-size: 24px; margin: 30px 0; font-weight: bold; }
    .course-name { font-size: 20px; color: #0369A1; margin: 20px 0; }
    .details { margin: 20px 0; line-height: 1.8; }
    .footer { margin-top: 40px; font-size: 14px; }
    .signature { margin: 30px 0; }
    .qr-code { margin-top: 20px; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>CERTIFICATE OF ACHIEVEMENT</h1>
      <p>This is to certify that</p>
    </div>
    
    <div class="recipient">{{certificate_name}}</div>
    
    <div class="details">
      <p>has successfully completed the</p>
      <div class="course-name">{{course_name}}</div>
      <p>on {{completion_date}}</p>
      <p>This certificate is valid until {{expiry_date}}</p>
    </div>
    
    <div class="signature">
      <p>_____________________</p>
      <p>{{trainer_name}}</p>
      <p>Qualified First Aid Instructor</p>
    </div>
    
    <div class="footer">
      <p>Certificate Number: {{certificate_number}}</p>
      <p>HSE Approved • Ofqual Regulated</p>
      <p>React Fast Training • Yorkshire</p>
    </div>
  </div>
</body>
</html>
      `,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'First Aid at Work Certificate',
      course_type: 'FAW',
      certification_body: 'HSE',
      validity_years: 3,
      template_variables: JSON.stringify({
        logo_path: '/assets/logos/hse-approved.png',
        trainer_signature: '/assets/signatures/lex-richardson.png',
        accreditation_numbers: ['HSE123456', 'OFQUAL789']
      }),
      template_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .certificate { 
      border: 3px solid #0284C7; 
      padding: 50px; 
      max-width: 800px; 
      margin: 0 auto;
      text-align: center;
      background: white;
    }
    .header { color: #0284C7; margin-bottom: 30px; }
    .title { font-size: 36px; font-weight: bold; margin: 20px 0; }
    .recipient { font-size: 28px; margin: 30px 0; font-weight: bold; }
    .course-name { font-size: 22px; color: #0369A1; margin: 20px 0; font-weight: bold; }
    .details { margin: 20px 0; line-height: 1.8; font-size: 18px; }
    .footer { margin-top: 40px; font-size: 14px; }
    .signature { margin: 30px 0; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>CERTIFICATE OF ACHIEVEMENT</h1>
      <p>This is to certify that</p>
    </div>
    
    <div class="recipient">{{certificate_name}}</div>
    
    <div class="details">
      <p>has successfully completed the comprehensive</p>
      <div class="course-name">{{course_name}}</div>
      <p>on {{completion_date}}</p>
      <p>This certificate is valid until {{expiry_date}}</p>
    </div>
    
    <div class="signature">
      <p>_____________________</p>
      <p>{{trainer_name}}</p>
      <p>Qualified First Aid Instructor</p>
    </div>
    
    <div class="footer">
      <p>Certificate Number: {{certificate_number}}</p>
      <p>HSE Approved • Ofqual Regulated</p>
      <p>React Fast Training • Yorkshire</p>
    </div>
  </div>
</body>
</html>
      `,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Paediatric First Aid Certificate',
      course_type: 'PFA',
      certification_body: 'Ofqual',
      validity_years: 3,
      template_variables: JSON.stringify({
        logo_path: '/assets/logos/ofqual-regulated.png',
        trainer_signature: '/assets/signatures/lex-richardson.png',
        accreditation_numbers: ['OFQUAL789', 'EYFS456']
      }),
      template_html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .certificate { 
      border: 2px solid #10B981; 
      padding: 40px; 
      max-width: 800px; 
      margin: 0 auto;
      text-align: center;
      background: white;
    }
    .header { color: #10B981; margin-bottom: 30px; }
    .title { font-size: 32px; font-weight: bold; margin: 20px 0; }
    .recipient { font-size: 24px; margin: 30px 0; font-weight: bold; }
    .course-name { font-size: 20px; color: #059669; margin: 20px 0; }
    .details { margin: 20px 0; line-height: 1.8; }
    .footer { margin-top: 40px; font-size: 14px; }
    .signature { margin: 30px 0; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>CERTIFICATE OF ACHIEVEMENT</h1>
      <p>This is to certify that</p>
    </div>
    
    <div class="recipient">{{certificate_name}}</div>
    
    <div class="details">
      <p>has successfully completed the</p>
      <div class="course-name">{{course_name}}</div>
      <p>on {{completion_date}}</p>
      <p>This certificate is valid until {{expiry_date}}</p>
      <p style="margin-top: 20px;"><strong>EYFS Compliant</strong></p>
    </div>
    
    <div class="signature">
      <p>_____________________</p>
      <p>{{trainer_name}}</p>
      <p>Qualified First Aid Instructor</p>
    </div>
    
    <div class="footer">
      <p>Certificate Number: {{certificate_number}}</p>
      <p>Ofqual Regulated • EYFS Compliant</p>
      <p>React Fast Training • Yorkshire</p>
    </div>
  </div>
</body>
</html>
      `,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('Certificate templates seeded successfully');
}