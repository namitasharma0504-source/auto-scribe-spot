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
  city?: string;
  state?: string;
  country?: string;
}

// Reverse geocode using OpenStreetMap Nominatim (free, no API key needed)
async function reverseGeocode(lat: number, lon: number): Promise<{ city?: string; state?: string; country?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MeriGarageReviews/1.0',
        },
      }
    );
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return {};
    }
    
    const data = await response.json();
    const address = data.address || {};
    
    // Extract city (try multiple fields as Nominatim varies by location)
    const city = address.city || address.town || address.village || address.municipality || 
                 address.suburb || address.district || address.county || '';
    
    // Extract state
    const state = address.state || address.state_district || address.province || '';
    
    // Extract country
    const country = address.country || '';
    
    console.log('Reverse geocode result:', { city, state, country });
    
    return { city, state, country };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, latitude, longitude } = await req.json();

    // If lat/long provided directly (for live location), just reverse geocode
    if (latitude !== undefined && longitude !== undefined) {
      console.log('Reverse geocoding coordinates:', latitude, longitude);
      const geoResult = await reverseGeocode(latitude, longitude);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            latitude,
            longitude,
            ...geoResult,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL or coordinates required' }),
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

    // If we have coordinates, reverse geocode to get city/state
    if (result.latitude && result.longitude) {
      const geoResult = await reverseGeocode(result.latitude, result.longitude);
      result.city = geoResult.city;
      result.state = geoResult.state;
      result.country = geoResult.country;
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
