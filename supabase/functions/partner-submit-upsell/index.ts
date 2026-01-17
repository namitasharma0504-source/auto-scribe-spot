import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("partner-submit-upsell: Request received");

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("partner-submit-upsell: No authorization header");
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("partner-submit-upsell: Invalid token", userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("partner-submit-upsell: User authenticated:", user.id);

    // Parse request body
    const body = await req.json();
    const { listingId, reputationSold, gmsSold, paymentProofPath } = body;

    console.log("partner-submit-upsell: Request body:", { listingId, reputationSold, gmsSold, paymentProofPath });

    // Validate inputs
    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'Missing listingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reputationSold && !gmsSold) {
      return new Response(
        JSON.stringify({ error: 'At least one upsell must be selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!paymentProofPath) {
      return new Response(
        JSON.stringify({ error: 'Payment proof is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get partner record for this user
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      console.error("partner-submit-upsell: Partner not found", partnerError);
      return new Response(
        JSON.stringify({ error: 'Partner profile not found for this user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("partner-submit-upsell: Partner found:", partner.id);

    // Verify listing exists and belongs to this partner
    const { data: listing, error: listingError } = await supabase
      .from('partner_listings')
      .select('id, partner_id, gin, status')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      console.error("partner-submit-upsell: Listing not found", listingError);
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (listing.partner_id !== partner.id) {
      console.error("partner-submit-upsell: Listing does not belong to partner", { 
        listingPartnerId: listing.partner_id, 
        partnerId: partner.id 
      });
      return new Response(
        JSON.stringify({ error: 'This listing does not belong to you' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("partner-submit-upsell: Listing verified:", listing.gin);

    // Build update object - NEVER include total_earning (it's generated)
    const updates: Record<string, unknown> = {
      payment_proof_url: paymentProofPath,
    };

    if (reputationSold) {
      updates.reputation_upsell = true;
      updates.reputation_verified = false; // Pending admin verification
      updates.reputation_payment_id = `REP-${listing.gin}`;
      // Note: reputation_earning stays at 0 until admin verifies
    }

    if (gmsSold) {
      updates.gms_upsell = true;
      updates.gms_verified = false; // Pending admin verification
      updates.gms_payment_id = `GMS-${listing.gin}`;
      // Note: gms_earning stays at 0 until admin verifies
    }

    console.log("partner-submit-upsell: Updating listing with:", updates);

    // Perform the update
    const { data: updatedListing, error: updateError } = await supabase
      .from('partner_listings')
      .update(updates)
      .eq('id', listingId)
      .select()
      .single();

    if (updateError) {
      console.error("partner-submit-upsell: Update failed", updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit upsell: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("partner-submit-upsell: Update successful", updatedListing);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Upsell submitted for verification',
        listing: updatedListing 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("partner-submit-upsell: Unexpected error", error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
