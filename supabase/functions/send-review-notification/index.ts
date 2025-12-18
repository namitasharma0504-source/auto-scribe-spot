import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS/HTML injection in emails
function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
}

async function sendEmail({ to, subject, htmlBody }: EmailRequest): Promise<void> {
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
    // Verify JWT and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Invalid token or user not found:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError || !hasAdminRole) {
      console.error("User is not an admin:", user.id, roleError);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin verified:", user.id);

    const { type, reviewData } = await req.json();

    if (type === "customer_approval") {
      // Email to customer when their review is approved
      await sendEmail({
        to: reviewData.customerEmail,
        subject: "Your Review Has Been Approved! - MeriGarageReviews",
        htmlBody: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #2563eb); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .review-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Review Approved!</h1>
              </div>
              <div class="content">
                <p>Dear Customer,</p>
                <p>Great news! Your review for <strong>${escapeHtml(reviewData.garageName)}</strong> has been approved and is now live on MeriGarageReviews.</p>
                
                <div class="review-box">
                  <p><strong>Garage:</strong> ${escapeHtml(reviewData.garageName)}</p>
                  <p><strong>Rating:</strong> ${"⭐".repeat(Math.min(Math.max(Number(reviewData.rating) || 0, 0), 5))}</p>
                  <p><strong>Your Review:</strong> ${escapeHtml(reviewData.reviewText) || "No text provided"}</p>
                </div>
                
                <p>Thank you for helping others make informed decisions about their garage visits!</p>
                <p>You've earned <strong>${reviewData.pointsEarned || 50} points</strong> for this review.</p>
                
                <p>Best regards,<br>The MeriGarageReviews Team</p>
              </div>
              <div class="footer">
                <p>© 2024 MeriGarageReviews. All rights reserved.</p>
                <p>Phone: +91 9582051155 | Email: info@merigarage.com</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log("Customer approval email sent to:", reviewData.customerEmail);
    } else if (type === "garage_notification") {
      // Email to garage owner when a new review is approved for their garage
      await sendEmail({
        to: reviewData.garageEmail,
        subject: `New Review for ${escapeHtml(reviewData.garageName)} - MeriGarageReviews`,
        htmlBody: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #2563eb); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .review-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📝 New Customer Review</h1>
              </div>
              <div class="content">
                <p>Dear ${escapeHtml(reviewData.garageName)} Team,</p>
                <p>A new customer review has been posted for your garage on MeriGarageReviews!</p>
                
                <div class="review-box">
                  <p><strong>Rating:</strong> ${"⭐".repeat(Math.min(Math.max(Number(reviewData.rating) || 0, 0), 5))}</p>
                  <p><strong>Review:</strong> ${escapeHtml(reviewData.reviewText) || "No text provided"}</p>
                </div>
                
                <p>Keep up the great work! Positive reviews help attract more customers to your business.</p>
                
                <p>Best regards,<br>The MeriGarageReviews Team</p>
              </div>
              <div class="footer">
                <p>© 2024 MeriGarageReviews. All rights reserved.</p>
                <p>Upgrade your garage with MeriGarage Management Software: <a href="https://merigarage.com/GarageAdmin/login.php">Try Free</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log("Garage notification email sent to:", reviewData.garageEmail);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
