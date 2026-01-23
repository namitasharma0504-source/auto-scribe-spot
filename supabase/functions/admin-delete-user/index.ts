import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from deleting themselves
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First, get the partner ID if this user is a partner (needed for cleaning up partner-related data)
    const { data: partnerData } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("user_id", user_id)
      .single();

    const partnerId = partnerData?.id;

    // Delete partner-related data if user is a partner
    if (partnerId) {
      // Delete partner_listings
      const { error: listingsError } = await supabaseAdmin
        .from("partner_listings")
        .delete()
        .eq("partner_id", partnerId);
      if (listingsError) console.error("Error deleting partner_listings:", listingsError);

      // Delete disputes
      const { error: disputesError } = await supabaseAdmin
        .from("disputes")
        .delete()
        .eq("partner_id", partnerId);
      if (disputesError) console.error("Error deleting disputes:", disputesError);

      // Delete payouts
      const { error: payoutsError } = await supabaseAdmin
        .from("payouts")
        .delete()
        .eq("partner_id", partnerId);
      if (payoutsError) console.error("Error deleting payouts:", payoutsError);

      // Delete partner_feedback
      const { error: feedbackError } = await supabaseAdmin
        .from("partner_feedback")
        .delete()
        .eq("partner_id", partnerId);
      if (feedbackError) console.error("Error deleting partner_feedback:", feedbackError);
    }

    // Delete user reviews
    const { error: reviewsError } = await supabaseAdmin
      .from("user_reviews")
      .delete()
      .eq("user_id", user_id);
    if (reviewsError) console.error("Error deleting user_reviews:", reviewsError);

    // Delete rewards history
    const { error: rewardsError } = await supabaseAdmin
      .from("rewards_history")
      .delete()
      .eq("user_id", user_id);
    if (rewardsError) console.error("Error deleting rewards_history:", rewardsError);

    // Delete redemptions
    const { error: redemptionsError } = await supabaseAdmin
      .from("redemptions")
      .delete()
      .eq("user_id", user_id);
    if (redemptionsError) console.error("Error deleting redemptions:", redemptionsError);

    // Delete garage claim requests
    const { error: claimsError } = await supabaseAdmin
      .from("garage_claim_requests")
      .delete()
      .eq("claimant_user_id", user_id);
    if (claimsError) console.error("Error deleting garage_claim_requests:", claimsError);

    // Delete verification requests
    const { error: verificationError } = await supabaseAdmin
      .from("verification_requests")
      .delete()
      .eq("requested_by", user_id);
    if (verificationError) console.error("Error deleting verification_requests:", verificationError);

    // Delete from user_roles table
    const { error: roleDeleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", user_id);
    if (roleDeleteError) console.error("Error deleting user role:", roleDeleteError);

    // Delete from profiles table
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", user_id);
    if (profileDeleteError) console.error("Error deleting profile:", profileDeleteError);

    // Delete from partners table (if partner)
    const { error: partnerDeleteError } = await supabaseAdmin
      .from("partners")
      .delete()
      .eq("user_id", user_id);
    if (partnerDeleteError) console.error("Error deleting partner:", partnerDeleteError);

    // Delete from garage_owners
    const { error: ownerDeleteError } = await supabaseAdmin
      .from("garage_owners")
      .delete()
      .eq("user_id", user_id);
    if (ownerDeleteError) console.error("Error removing garage owner:", ownerDeleteError);

    // Finally, delete from auth.users (this is the key step!)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user from auth: " + authDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user_id} fully deleted with all history by admin ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User completely deleted with all history. Email can now be used for new signup." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in admin-delete-user:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
