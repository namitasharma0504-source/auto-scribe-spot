import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, garage_id, credentials, offer_id } = await req.json();

    console.log(`Meta Ads action: ${action} for garage: ${garage_id}`);

    if (action === 'verify') {
      // Verify Meta credentials by making a test API call
      const { meta_access_token, meta_ad_account_id } = credentials;

      if (!meta_access_token || !meta_ad_account_id) {
        throw new Error('Missing Meta credentials');
      }

      // Test the credentials by fetching ad account info
      const metaResponse = await fetch(
        `https://graph.facebook.com/v18.0/act_${meta_ad_account_id}?access_token=${meta_access_token}&fields=name,account_status,currency`
      );

      const metaData = await metaResponse.json();

      if (metaData.error) {
        console.error('Meta API error:', metaData.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: metaData.error.message || 'Invalid Meta credentials' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Credentials are valid, save them
      const { error: saveError } = await supabase
        .from('garage_meta_credentials')
        .upsert({
          garage_id,
          meta_access_token: credentials.meta_access_token,
          meta_ad_account_id: credentials.meta_ad_account_id,
          meta_page_id: credentials.meta_page_id,
          is_verified: true,
          last_verified_at: new Date().toISOString()
        }, { onConflict: 'garage_id' });

      if (saveError) {
        console.error('Error saving credentials:', saveError);
        throw new Error('Failed to save credentials');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          account_name: metaData.name,
          account_status: metaData.account_status,
          currency: metaData.currency
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'push_ad') {
      // Get garage's Meta credentials
      const { data: metaCreds, error: credsError } = await supabase
        .from('garage_meta_credentials')
        .select('*')
        .eq('garage_id', garage_id)
        .single();

      if (credsError || !metaCreds || !metaCreds.is_verified) {
        throw new Error('Meta credentials not configured or not verified');
      }

      // Get the offer details
      const { data: offer, error: offerError } = await supabase
        .from('garage_offers')
        .select('*')
        .eq('id', offer_id)
        .single();

      if (offerError || !offer) {
        throw new Error('Offer not found');
      }

      // Get garage details for the ad
      const { data: garage, error: garageError } = await supabase
        .from('garages')
        .select('name, city, address, photo_url')
        .eq('id', garage_id)
        .single();

      if (garageError || !garage) {
        throw new Error('Garage not found');
      }

      // Create ad creative
      const adCreativeResponse = await fetch(
        `https://graph.facebook.com/v18.0/act_${metaCreds.meta_ad_account_id}/adcreatives`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: metaCreds.meta_access_token,
            name: `${garage.name} - ${offer.title}`,
            object_story_spec: {
              page_id: metaCreds.meta_page_id,
              link_data: {
                message: `🔥 ${offer.title}\n\n${offer.description}\n\n💰 ${offer.discount_value}\n\n📍 ${garage.name}, ${garage.city}`,
                link: `https://merigaragereviews.com/garage/${garage_id}`,
                name: offer.title,
                description: offer.description,
                image_url: garage.photo_url || 'https://merigaragereviews.com/default-garage.jpg'
              }
            }
          })
        }
      );

      const creativeData = await adCreativeResponse.json();

      if (creativeData.error) {
        console.error('Meta Ad Creative error:', creativeData.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: creativeData.error.message || 'Failed to create ad creative' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Update the offer with Meta ad info
      await supabase
        .from('garage_offers')
        .update({ 
          is_promoted_to_meta: true,
          meta_ad_id: creativeData.id
        })
        .eq('id', offer_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          ad_id: creativeData.id,
          message: 'Ad creative created successfully. Go to Meta Ads Manager to complete campaign setup.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect') {
      // Remove Meta credentials
      const { error: deleteError } = await supabase
        .from('garage_meta_credentials')
        .delete()
        .eq('garage_id', garage_id);

      if (deleteError) {
        throw new Error('Failed to disconnect Meta account');
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Meta account disconnected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in meta-ads function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
