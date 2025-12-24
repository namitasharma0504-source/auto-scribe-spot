const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedLocation {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  fullUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing Google Maps URL:', url);

    // Follow redirects to get the final URL
    let finalUrl = url;
    
    // Check if it's a short link that needs to be resolved
    if (url.includes('share.google') || url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
        });
        finalUrl = response.url;
        console.log('Resolved URL:', finalUrl);
      } catch (e) {
        // Try GET if HEAD fails
        try {
          const response = await fetch(url, {
            redirect: 'follow',
          });
          finalUrl = response.url;
          console.log('Resolved URL via GET:', finalUrl);
        } catch (e2) {
          console.error('Failed to resolve URL:', e2);
        }
      }
    }

    const result: ParsedLocation = {
      fullUrl: finalUrl,
    };

    // Parse coordinates from URL
    // Format: @lat,lng,zoom or !3d{lat}!4d{lng}
    const coordMatch = finalUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      result.latitude = parseFloat(coordMatch[1]);
      result.longitude = parseFloat(coordMatch[2]);
    } else {
      // Try alternate format !3d{lat}!4d{lng}
      const altCoordMatch = finalUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
      if (altCoordMatch) {
        result.latitude = parseFloat(altCoordMatch[1]);
        result.longitude = parseFloat(altCoordMatch[2]);
      }
    }

    // Extract place name from URL path
    // Format: /place/Place+Name/ or /place/Place%20Name/
    const placeMatch = finalUrl.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      result.name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // Try to extract from search query if no place name
    if (!result.name) {
      const searchMatch = finalUrl.match(/[?&]q=([^&]+)/);
      if (searchMatch) {
        result.name = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      }
    }

    // Extract address from data parameter if available
    const dataMatch = finalUrl.match(/!1s([^!]+)/);
    if (dataMatch) {
      try {
        const decoded = decodeURIComponent(dataMatch[1]);
        if (decoded && !decoded.startsWith('0x')) {
          result.address = decoded;
        }
      } catch (e) {
        // Ignore decode errors
      }
    }

    console.log('Parsed result:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse URL';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
