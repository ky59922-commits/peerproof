'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useRequireJudge() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [judge, setJudge] = useState(null);

  useEffect(() => {
    let active = true;
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/judge/login"); return; }
      const { data: judgeRow } = await supabase
        .from("judges")
        .select("id, code, field, level, university, sessions_completed, rating")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (!judgeRow) { router.push("/judge/login"); return; }
      setJudge(judgeRow);
      setChecking(false);
    }
    check();
    return () => { active = false; };
  }, [router]);

  return { checking, judge };
}
