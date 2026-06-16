'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Shared guard for any admin page: redirects to login if not signed in,
// or if signed in but not actually listed in platform_admins.
export function useRequireAdmin() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState(null);

  useEffect(() => {
    let active = true;
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }
      const { data: adminRow } = await supabase
        .from("platform_admins")
        .select("name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (!adminRow) { router.push("/admin/login"); return; }
      setAdminName(adminRow.name);
      setChecking(false);
    }
    check();
    return () => { active = false; };
  }, [router]);

  return { checking, adminName };
}
