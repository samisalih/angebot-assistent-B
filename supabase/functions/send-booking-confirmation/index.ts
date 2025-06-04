
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, name, email, preferredDate, preferredTime, quoteNumber, quoteTitle }: BookingConfirmationRequest = await req.json();

    console.log('Sending booking confirmation email to:', email);

    const formattedDate = new Date(preferredDate).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResponse = await resend.emails.send({
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
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
