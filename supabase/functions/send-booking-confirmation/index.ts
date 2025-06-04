
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";
import { jsPDF } from "npm:jspdf@2.5.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingConfirmationRequest {
  bookingId: string;
  name: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  quoteNumber?: string;
  quoteTitle?: string;
}

// Helper function to convert ArrayBuffer to base64 (Deno compatible)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const generateQuotePDF = async (supabase: any, quoteId: string) => {
  try {
    console.log('Starting PDF generation for quote:', quoteId);
    
    // Fetch quote data with items
    const { data: quoteData, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          id,
          service,
          description,
          price
        )
      `)
      .eq('id', quoteId)
      .single();

    if (error || !quoteData) {
      console.error('Error fetching quote data:', error);
      return null;
    }

    console.log('Quote data fetched successfully:', quoteData.quote_number);

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('DigitalWert', 20, 20);
    doc.setFontSize(16);
    doc.text('Angebot', 20, 35);
    
    // Quote info
    doc.setFontSize(12);
    doc.text(`Angebotsnummer: ${quoteData.quote_number}`, 20, 50);
    doc.text(`Titel: ${quoteData.title}`, 20, 60);
    doc.text(`Datum: ${new Date(quoteData.created_at).toLocaleDateString('de-DE')}`, 20, 70);
    
    // Items header
    doc.setFontSize(14);
    doc.text('Positionen:', 20, 90);
    
    let yPos = 105;
    doc.setFontSize(10);
    
    // Table header
    doc.text('Leistung', 20, yPos);
    doc.text('Beschreibung', 80, yPos);
    doc.text('Preis', 150, yPos);
    yPos += 10;
    
    // Draw line under header
    doc.line(20, yPos - 5, 190, yPos - 5);
    
    // Items
    quoteData.quote_items?.forEach((item: any) => {
      doc.text(item.service, 20, yPos);
      doc.text(item.description || '-', 80, yPos);
      doc.text(`${Number(item.price).toLocaleString('de-DE')} €`, 150, yPos);
      yPos += 10;
    });
    
    // Total
    yPos += 10;
    doc.line(20, yPos - 5, 190, yPos - 5);
    doc.setFontSize(12);
    const totalNet = Number(quoteData.total_amount);
    const vat = Math.round(totalNet * 0.19);
    const totalGross = totalNet + vat;
    
    doc.text(`Nettobetrag: ${totalNet.toLocaleString('de-DE')} €`, 20, yPos);
    yPos += 10;
    doc.text(`MwSt. (19%): ${vat.toLocaleString('de-DE')} €`, 20, yPos);
    yPos += 10;
    doc.setFontSize(14);
    doc.text(`Gesamtbetrag: ${totalGross.toLocaleString('de-DE')} €`, 20, yPos);
    
    // Generate PDF as ArrayBuffer and convert to base64
    const pdfArrayBuffer = doc.output('arraybuffer');
    const base64String = arrayBufferToBase64(pdfArrayBuffer);
    
    console.log('PDF generated successfully, size:', base64String.length);
    return base64String;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, name, email, preferredDate, preferredTime, quoteNumber, quoteTitle }: BookingConfirmationRequest = await req.json();

    console.log('Processing booking confirmation for:', email, 'Booking ID:', bookingId);

    const formattedDate = new Date(preferredDate).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Initialize Supabase client for PDF generation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get quote ID from booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('quote_id')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking data:', bookingError);
    }

    // Generate PDF attachment if quote exists
    let pdfAttachment = null;
    if (bookingData?.quote_id) {
      console.log('Generating PDF for quote ID:', bookingData.quote_id);
      const pdfBase64 = await generateQuotePDF(supabase, bookingData.quote_id);
      if (pdfBase64) {
        pdfAttachment = {
          filename: `Angebot_${quoteNumber || 'Unbekannt'}.pdf`,
          content: pdfBase64,
        };
        console.log('PDF attachment created successfully');
      } else {
        console.log('PDF generation failed, proceeding without attachment');
      }
    }

    // Send customer confirmation email
    console.log('Sending customer confirmation email...');
    const customerEmailResponse = await resend.emails.send({
      from: "DigitalWert <onboarding@resend.dev>",
      to: [email],
      subject: "Bestätigung Ihres Beratungstermins - DigitalWert",
      html: `
        <div style="font-family: 'Titillium Web', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap');
          </style>
          
          <h1 style="color: #1a365d; text-align: center; font-family: 'Titillium Web', Arial, sans-serif; font-weight: 700;">Terminbestätigung</h1>
          
          <p style="font-family: 'Titillium Web', Arial, sans-serif;">Liebe(r) ${name},</p>
          
          <p style="font-family: 'Titillium Web', Arial, sans-serif;">vielen Dank für Ihre Terminanfrage! Wir haben Ihren gewünschten Beratungstermin erhalten und werden uns schnellstmöglich bei Ihnen melden, um den Termin zu bestätigen.</p>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: 'Titillium Web', Arial, sans-serif;">
            <h3 style="color: #2d3748; margin-top: 0; font-family: 'Titillium Web', Arial, sans-serif; font-weight: 600;">Ihre Termindetails:</h3>
            <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Datum:</strong> ${formattedDate}</p>
            <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Uhrzeit:</strong> ${preferredTime} Uhr</p>
            <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Dauer:</strong> ca. 60 Minuten</p>
            ${quoteNumber && quoteTitle ? `
              <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Bezugnahme auf Angebot:</strong> ${quoteTitle} (${quoteNumber})</p>
            ` : ''}
          </div>
          
          <p style="font-family: 'Titillium Web', Arial, sans-serif;">Wir werden Sie in Kürze kontaktieren, um den Termin zu bestätigen und weitere Details zu besprechen.</p>
          
          <p style="font-family: 'Titillium Web', Arial, sans-serif;">Bei Fragen oder Änderungen können Sie uns jederzeit kontaktieren.</p>
          
          <p style="font-family: 'Titillium Web', Arial, sans-serif;">Freundliche Grüße,<br>
          Ihr DigitalWert Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #718096; text-align: center; font-family: 'Titillium Web', Arial, sans-serif;">
            DigitalWert - Ihr Partner für digitale Lösungen<br>
            Diese E-Mail wurde automatisch generiert.
          </p>
        </div>
      `,
    });

    if (customerEmailResponse.error) {
      console.error("Error sending customer email:", customerEmailResponse.error);
    } else {
      console.log("Customer email sent successfully:", customerEmailResponse.data?.id);
    }

    // Prepare internal notification email
    const internalEmailData: any = {
      from: "DigitalWert <onboarding@resend.dev>",
      to: ["97samisalih@gmail.com"],
      subject: `Neue Terminbuchung - ${name}`,
      html: `
        <div style="font-family: 'Titillium Web', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap');
          </style>
          
          <h1 style="color: #1a365d; text-align: center; font-family: 'Titillium Web', Arial, sans-serif; font-weight: 700;">Neue Terminbuchung</h1>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: 'Titillium Web', Arial, sans-serif;">
            <h3 style="color: #2d3748; margin-top: 0; font-family: 'Titillium Web', Arial, sans-serif; font-weight: 600;">Kundendaten:</h3>
            <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Name:</strong> ${name}</p>
            <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>E-Mail:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: 'Titillium Web', Arial, sans-serif;">
            <h3 style="color: #2d3748; margin-top: 0; font-family: 'Titillium Web', Arial, sans-serif; font-weight: 600;">Termindetails:</h3>
            <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Datum:</strong> ${formattedDate}</p>
            <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Uhrzeit:</strong> ${preferredTime} Uhr</p>
            ${quoteNumber && quoteTitle ? `
              <p style="font-family: 'Titillium Web', Arial, sans-serif;"><strong>Zugehöriges Angebot:</strong> ${quoteTitle} (${quoteNumber})</p>
            ` : ''}
          </div>
          
          <p style="font-family: 'Titillium Web', Arial, sans-serif;">Bitte bestätigen Sie den Termin zeitnah beim Kunden.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #718096; text-align: center; font-family: 'Titillium Web', Arial, sans-serif;">
            DigitalWert - Automatische Benachrichtigung
          </p>
        </div>
      `,
    };

    // Add PDF attachment if available
    if (pdfAttachment) {
      internalEmailData.attachments = [pdfAttachment];
      console.log('Added PDF attachment to internal email');
    }

    // Send internal notification email
    console.log('Sending internal notification email to 97samisalih@gmail.com...');
    const internalEmailResponse = await resend.emails.send(internalEmailData);

    if (internalEmailResponse.error) {
      console.error("Error sending internal email:", internalEmailResponse.error);
    } else {
      console.log("Internal email sent successfully:", internalEmailResponse.data?.id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      customerEmailId: customerEmailResponse.data?.id,
      internalEmailId: internalEmailResponse.data?.id,
      pdfAttached: !!pdfAttachment,
      customerEmailError: customerEmailResponse.error,
      internalEmailError: internalEmailResponse.error
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
