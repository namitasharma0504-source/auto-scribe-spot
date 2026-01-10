import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_SLOTS = ["2026-01-17", "2026-01-18"];

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, slot } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Lookup action - find application by email
    if (action === "lookup") {
      const { data: application, error } = await supabase
        .from("partner_applications")
        .select("id, full_name, email, webinar_slot, webinar_booked_at")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (error) {
        console.error("Error looking up application:", error);
        throw new Error("Failed to lookup application");
      }

      if (!application) {
        return new Response(
          JSON.stringify({ found: false }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({
          found: true,
          application: {
            id: application.id,
            full_name: application.full_name,
            email: application.email,
            webinar_slot: application.webinar_slot,
            webinar_booked_at: application.webinar_booked_at,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Book action - update webinar slot
    if (action === "book") {
      if (!slot) {
        return new Response(
          JSON.stringify({ error: "Slot is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!VALID_SLOTS.includes(slot)) {
        return new Response(
          JSON.stringify({ error: "Invalid slot selected" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Find the application
      const { data: application, error: lookupError } = await supabase
        .from("partner_applications")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (lookupError) {
        console.error("Error looking up application:", lookupError);
        throw new Error("Failed to lookup application");
      }

      if (!application) {
        return new Response(
          JSON.stringify({ error: "Application not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Update the webinar slot
      const { error: updateError } = await supabase
        .from("partner_applications")
        .update({
          webinar_slot: slot,
          webinar_booked_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) {
        console.error("Error updating webinar slot:", updateError);
        throw new Error("Failed to book webinar slot");
      }

      console.log(`Webinar slot ${slot} booked for ${normalizedEmail}`);

      return new Response(
        JSON.stringify({ success: true, slot }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in book-webinar function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
