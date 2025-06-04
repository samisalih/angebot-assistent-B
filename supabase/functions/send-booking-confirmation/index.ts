
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
}

// Input validation and sanitization
const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>\"'&]/g, '').substring(0, maxLength);
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
};

const validateBookingData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  console.log('Validating booking data:', JSON.stringify(data, null, 2));
  
  if (!data.customerName || typeof data.customerName !== 'string' || data.customerName.trim().length < 2) {
    errors.push('Customer name is required and must be at least 2 characters');
  }
  
  if (!data.customerEmail || !validateEmail(data.customerEmail)) {
    errors.push('Valid customer email is required');
  }
  
  // Phone is optional, but if provided should be valid
  if (data.customerPhone && typeof data.customerPhone === 'string' && data.customerPhone.trim().length < 5) {
    errors.push('Customer phone must be at least 5 characters if provided');
  }
  
  if (!data.service || typeof data.service !== 'string' || data.service.trim().length < 2) {
    errors.push('Service is required');
  }
  
  if (!data.preferredDate) {
    errors.push('Preferred date is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  // Rate limiting - simple in-memory store (in production, use Redis or similar)
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const requestData = await req.json();
    console.log('Received booking request from IP:', clientIP);
    console.log('Raw request data:', JSON.stringify(requestData, null, 2));
    
    // Validate and sanitize input data
    const validation = validateBookingData(requestData);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: validation.errors 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Sanitize all input data
    const sanitizedData = {
      customerName: sanitizeInput(requestData.customerName, 100),
      customerEmail: sanitizeInput(requestData.customerEmail, 100),
      customerPhone: sanitizeInput(requestData.customerPhone || '', 20),
      service: sanitizeInput(requestData.service, 200),
      preferredDate: sanitizeInput(requestData.preferredDate, 50),
      preferredTime: sanitizeInput(requestData.preferredTime || '', 50),
      message: sanitizeInput(requestData.message || '', 2000),
      totalAmount: requestData.totalAmount || 0,
      items: Array.isArray(requestData.items) ? requestData.items.slice(0, 20) : [] // Limit items
    };

    console.log('Processing sanitized booking data for:', sanitizedData.customerEmail);

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Email service configuration error' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const resend = {
      emails: {
        send: async (emailData: any) => {
          console.log('Sending email with data:', JSON.stringify(emailData, null, 2));
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
          });
          
          const data = await response.json();
          console.log('Resend API response:', response.status, data);
          return { 
            data: response.ok ? data : null, 
            error: response.ok ? null : data 
          };
        }
      }
    };

    // Generate unique booking reference
    const bookingRef = `DW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Format items for email display
    const itemsHtml = sanitizedData.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${sanitizeInput(item.service || '', 200)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">${sanitizeInput(item.description || '', 500)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right; font-weight: 600;">${(Number(item.price) || 0).toLocaleString('de-DE')} €</td>
      </tr>
    `).join('');

    // Send customer confirmation email using verified resend.dev domain
    console.log('Sending customer confirmation email...');
    const customerEmailResponse = await resend.emails.send({
      from: 'Digitalwert <onboarding@resend.dev>',
      to: [sanitizedData.customerEmail],
      subject: `Terminbestätigung - ${sanitizedData.service}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Terminbestätigung</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Digitalwert</h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Terminbestätigung</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <h2 style="color: #111827; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">Hallo ${sanitizedData.customerName},</h2>
              
              <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
                vielen Dank für Ihre Terminanfrage! Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden, um den Termin zu bestätigen.
              </p>
              
              <!-- Booking Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Ihre Termindetails:</h3>
                <div style="space-y: 8px;">
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Buchungsreferenz:</strong> ${bookingRef}</p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Service:</strong> ${sanitizedData.service}</p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Gewünschter Termin:</strong> ${sanitizedData.preferredDate}${sanitizedData.preferredTime ? ` um ${sanitizedData.preferredTime}` : ''}</p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Kontakt:</strong> ${sanitizedData.customerPhone}</p>
                  ${sanitizedData.message ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Ihre Nachricht:</strong> ${sanitizedData.message}</p>` : ''}
                </div>
              </div>
              
              ${sanitizedData.items.length > 0 ? `
              <!-- Quote Items -->
              <div style="margin: 24px 0;">
                <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Angefragte Leistungen:</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Leistung</th>
                      <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Beschreibung</th>
                      <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Preis</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  ${sanitizedData.totalAmount > 0 ? `
                  <tfoot>
                    <tr style="background-color: #f9fafb;">
                      <td colspan="2" style="padding: 12px; font-weight: 600; color: #374151;">Gesamtsumme:</td>
                      <td style="padding: 12px; text-align: right; font-weight: 700; color: #111827; font-size: 18px;">${Number(sanitizedData.totalAmount).toLocaleString('de-DE')} €</td>
                    </tr>
                  </tfoot>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              
              <p style="color: #374151; line-height: 1.6; margin: 24px 0; font-size: 16px;">
                Wir werden Ihren Terminwunsch prüfen und Ihnen innerhalb von 24 Stunden eine Bestätigung zusenden. Falls Sie Fragen haben, können Sie uns jederzeit kontaktieren.
              </p>
              
              <!-- Contact Info -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
                <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Kontakt:</h4>
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                  E-Mail: info@digitalwert.de<br>
                  Telefon: +49 (0) 123 456 789
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Mit freundlichen Grüßen,<br>
                Ihr Digitalwert Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (customerEmailResponse.error) {
      console.error("Error sending customer email:", customerEmailResponse.error);
    } else {
      console.log("Customer email sent successfully:", customerEmailResponse.data?.id);
    }

    // Prepare internal notification email using verified resend.dev domain
    const internalEmailData: any = {
      from: 'Digitalwert Booking System <onboarding@resend.dev>',
      to: ['97samisalih@gmail.com'],
      subject: `🔔 Neue Terminanfrage - ${sanitizedData.service}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Neue Terminanfrage</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Digitalwert Admin</h1>
              <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 16px;">Neue Terminanfrage eingegangen</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 0 0 24px 0;">
                <h2 style="color: #dc2626; margin: 0; font-size: 20px; font-weight: 600;">⚡ Aktion erforderlich</h2>
                <p style="color: #7f1d1d; margin: 8px 0 0 0;">Eine neue Terminanfrage ist eingegangen und wartet auf Ihre Bearbeitung.</p>
              </div>
              
              <!-- Customer Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Kundeninformationen:</h3>
                <div style="space-y: 8px;">
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Buchungsreferenz:</strong> ${bookingRef}</p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Name:</strong> ${sanitizedData.customerName}</p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>E-Mail:</strong> <a href="mailto:${sanitizedData.customerEmail}" style="color: #3b82f6;">${sanitizedData.customerEmail}</a></p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Telefon:</strong> <a href="tel:${sanitizedData.customerPhone}" style="color: #3b82f6;">${sanitizedData.customerPhone}</a></p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Service:</strong> ${sanitizedData.service}</p>
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Gewünschter Termin:</strong> ${sanitizedData.preferredDate}${sanitizedData.preferredTime ? ` um ${sanitizedData.preferredTime}` : ''}</p>
                  ${sanitizedData.message ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Nachricht:</strong> ${sanitizedData.message}</p>` : ''}
                  <p style="margin: 0 0 8px 0; color: #374151;"><strong>Angefragt am:</strong> ${new Date().toLocaleString('de-DE')}</p>
                </div>
              </div>
              
              ${sanitizedData.items.length > 0 ? `
              <!-- Quote Items -->
              <div style="margin: 24px 0;">
                <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Angefragte Leistungen:</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Leistung</th>
                      <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Beschreibung</th>
                      <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Preis</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  ${sanitizedData.totalAmount > 0 ? `
                  <tfoot>
                    <tr style="background-color: #f9fafb;">
                      <td colspan="2" style="padding: 12px; font-weight: 600; color: #374151;">Gesamtsumme:</td>
                      <td style="padding: 12px; text-align: right; font-weight: 700; color: #111827; font-size: 18px;">${Number(sanitizedData.totalAmount).toLocaleString('de-DE')} €</td>
                    </tr>
                  </tfoot>
                  ` : ''}
                </table>
              </div>
              ` : ''}
              
              <!-- Action Buttons -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="mailto:${sanitizedData.customerEmail}?subject=Terminbestätigung%20-%20${encodeURIComponent(sanitizedData.service)}" 
                   style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 8px;">
                  ✅ Termin bestätigen
                </a>
                <a href="mailto:${sanitizedData.customerEmail}?subject=Rückfrage%20zu%20Ihrem%20Terminwunsch" 
                   style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 8px;">
                  ❓ Rückfrage stellen
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Digitalwert Admin Panel<br>
                Automatisch generiert am ${new Date().toLocaleString('de-DE')}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send internal notification email
    console.log('Sending internal notification email to 97samisalih@gmail.com...');
    const internalEmailResponse = await resend.emails.send(internalEmailData);

    if (internalEmailResponse.error) {
      console.error("Error sending internal email:", internalEmailResponse.error);
    } else {
      console.log("Internal email sent successfully:", internalEmailResponse.data?.id);
    }

    console.log('Email sending completed. Customer:', customerEmailResponse.error ? 'FAILED' : 'SUCCESS', 'Internal:', internalEmailResponse.error ? 'FAILED' : 'SUCCESS');

    return new Response(JSON.stringify({ 
      success: true, 
      bookingReference: bookingRef,
      customerEmailId: customerEmailResponse.data?.id,
      internalEmailId: internalEmailResponse.data?.id,
      customerEmailError: customerEmailResponse.error,
      internalEmailError: internalEmailResponse.error
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in booking confirmation function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your booking request'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
})
