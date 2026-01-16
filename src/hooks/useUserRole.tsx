import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "admin" | "customer" | "garage_owner" | "partner";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking user role:", error);
          setRole(null);
        } else {
          setRole(data?.role || null);
        }
      } catch (err) {
        console.error("Error checking user role:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  const isGarageOwner = role === "garage_owner";
  const isCustomer = role === "customer";
  const isPartner = role === "partner";
  const isAdmin = role === "admin";

  return { role, isGarageOwner, isCustomer, isPartner, isAdmin, loading };
}
