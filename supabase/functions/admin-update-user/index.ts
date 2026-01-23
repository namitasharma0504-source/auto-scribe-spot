import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !callerRoles) {
      console.log("Caller is not an admin:", caller.id);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { userId, email, fullName, phone, state, role, isActive } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${caller.id} updating user ${userId}`);

    // Update email in auth.users if provided
    if (email !== undefined) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (emailError) {
        console.error("Error updating email:", emailError);
        return new Response(
          JSON.stringify({ error: `Failed to update email: ${emailError.message}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Email updated for user ${userId}`);
    }

    // Update profile fields
    const profileUpdates: Record<string, any> = {};
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (state !== undefined) profileUpdates.state = state;
    if (isActive !== undefined) profileUpdates.is_active = isActive;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return new Response(
          JSON.stringify({ error: `Failed to update profile: ${profileError.message}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Profile updated for user ${userId}`);
    }

    // Update role if provided
    if (role !== undefined) {
      // Get current role
      const { data: currentRole } = await supabaseAdmin
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentRole && currentRole.role !== role) {
        // Delete old role and insert new one
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        const { error: roleInsertError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (roleInsertError) {
          console.error("Error updating role:", roleInsertError);
          return new Response(
            JSON.stringify({ error: `Failed to update role: ${roleInsertError.message}` }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log(`Role updated for user ${userId} to ${role}`);

        // If changing to partner, ensure partner record exists
        if (role === "partner") {
          const { data: existingPartner } = await supabaseAdmin
            .from("partners")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!existingPartner) {
            // Get user email for partner record
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
            const userEmail = userData?.user?.email || "";
            const username = userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + 
              Math.floor(Math.random() * 1000);
            
            const { data: partnerIdResult } = await supabaseAdmin.rpc('generate_partner_id');
            const partnerId = partnerIdResult || `MG${new Date().getFullYear()}P${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
            
            const partnerPhone = phone?.trim() || `TEMP_${userId.slice(0, 8)}_${Date.now()}`;

            await supabaseAdmin
              .from("partners")
              .insert({
                id: partnerId,
                user_id: userId,
                username,
                full_name: fullName || userEmail.split("@")[0],
                email: userEmail,
                phone: partnerPhone,
                status: "active",
                kyc_status: "pending",
              });
            console.log(`Partner record created for user ${userId}`);
          }
        }
      }
    }

    // Also update partner table if user is a partner
    if (phone !== undefined || fullName !== undefined || email !== undefined) {
      const { data: partnerRecord } = await supabaseAdmin
        .from("partners")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (partnerRecord) {
        const partnerUpdates: Record<string, any> = {};
        if (fullName !== undefined) partnerUpdates.full_name = fullName;
        if (phone !== undefined) partnerUpdates.phone = phone;
        if (email !== undefined) partnerUpdates.email = email;

        if (Object.keys(partnerUpdates).length > 0) {
          await supabaseAdmin
            .from("partners")
            .update(partnerUpdates)
            .eq("user_id", userId);
          console.log(`Partner record updated for user ${userId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User updated successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
