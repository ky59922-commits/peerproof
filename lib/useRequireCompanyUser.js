'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Shared guard for any HR page: redirects to login if not signed in,
// or if signed in but not actually linked to a company.
export function useRequireCompanyUser() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/hr/login"); return; }
      const { data: membership } = await supabase
        .from("company_users")
        .select("id, name, role, company_id, companies(name)")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (!membership) { router.push("/hr/login"); return; }
      setUser({
        membershipId: membership.id,
        name: membership.name,
        role: membership.role,
        companyId: membership.company_id,
        companyName: membership.companies?.name,
      });
      setChecking(false);
    }
    check();
    return () => { active = false; };
  }, [router]);

  return { checking, user };
}
