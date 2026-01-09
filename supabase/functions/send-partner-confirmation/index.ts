import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface PartnerConfirmationRequest {
  fullName: string;
  email: string;
  phone: string;
  state: string;
  city?: string;
}

async function sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
  const client = new SmtpClient();
  
  await client.connectTLS({
    hostname: "smtp.gmail.com",
    port: 465,
    username: Deno.env.get("SMTP_EMAIL")!,
    password: Deno.env.get("SMTP_PASSWORD")!,
  });

  await client.send({
    from: Deno.env.get("SMTP_EMAIL")!,
    to: to,
    subject: subject,
    content: htmlBody,
    html: htmlBody,
  });

  await client.close();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, phone, state, city }: PartnerConfirmationRequest = await req.json();

    if (!fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Full name and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const firstName = fullName.split(" ")[0];
    const location = city ? `${city}, ${state}` : state;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #2563eb); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0; opacity: 0.9; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .highlight-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .next-steps { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .step { display: flex; align-items: flex-start; margin-bottom: 15px; }
          .step-number { background: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #dc2626; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
          .emoji { font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Application Received!</h1>
            <p>Welcome to MeriGarage Partners</p>
          </div>
          <div class="content">
            <p>Dear <strong>${escapeHtml(firstName)}</strong>,</p>
            
            <p>Thank you for applying to become a <strong>MeriGarage Partner</strong>! We're thrilled to receive your application and are excited about the possibility of having you join our growing network.</p>
            
            <div class="highlight-box">
              <p style="margin: 0;"><strong>📋 Application Details:</strong></p>
              <ul style="margin: 10px 0 0; padding-left: 20px;">
                <li><strong>Name:</strong> ${escapeHtml(fullName)}</li>
                <li><strong>Email:</strong> ${escapeHtml(email)}</li>
                <li><strong>Phone:</strong> ${escapeHtml(phone)}</li>
                <li><strong>Location:</strong> ${escapeHtml(location)}</li>
              </ul>
            </div>
            
            <div class="next-steps">
              <p style="margin: 0 0 15px;"><strong>📅 What Happens Next?</strong></p>
              
              <div class="step">
                <div class="step-number">1</div>
                <div>
                  <strong>Application Review</strong><br>
                  <span style="color: #666;">Our team will review your application within the next few days.</span>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div>
                  <strong>Partner Webinar Invite</strong><br>
                  <span style="color: #666;">Selected candidates will receive an invitation to our Partner Orientation Webinar planned in the coming weeks.</span>
                </div>
              </div>
              
              <div class="step" style="margin-bottom: 0;">
                <div class="step-number">3</div>
                <div>
                  <strong>Onboarding & Start Earning</strong><br>
                  <span style="color: #666;">Complete onboarding and begin your journey to earn ₹10,000 - ₹50,000+ monthly!</span>
                </div>
              </div>
            </div>
            
            <p>We appreciate your interest in joining the MeriGarage Partner network. Our team will be in touch soon with the next steps.</p>
            
            <p>If you have any questions in the meantime, feel free to reply to this email or contact us at <a href="mailto:info@merigarage.com">info@merigarage.com</a>.</p>
            
            <p>Best regards,<br><strong>The MeriGarage Team</strong></p>
            
            <center>
              <a href="https://merigarage.com/partners" class="button">Learn More About the Program</a>
            </center>
          </div>
          <div class="footer">
            <p>© 2024 MeriGarage. All rights reserved.</p>
            <p>📞 +91 9582051155 | ✉️ info@merigarage.com</p>
            <p style="margin-top: 10px;">
              <a href="https://merigarage.com" style="color: #2563eb; text-decoration: none;">www.merigarage.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      email,
      "🎉 Application Received - Welcome to MeriGarage Partners!",
      htmlBody
    );

    console.log("Partner confirmation email sent to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending partner confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
