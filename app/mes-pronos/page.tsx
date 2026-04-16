"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function MesPronOsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competition = searchParams.get("competition") || "keqiao-2026";
  const genre = searchParams.get("genre") || "hommes";
  const [picks, setPicks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const compName = competition.split("-")[0].charAt(0).toUpperCase() + competition.split("-")[0].slice(1);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      const { data: picks } = await supabase
        .from("picks_phase1_temp")
        .select("athlete_name")
        .eq("user_id", data.session.user.id)
        .eq("competition_id", `${competition}-${genre}`);
      setPicks(picks?.map(p => p.athlete_name) || []);
      setLoading(false);
    });
  }, [router, competition, genre]);

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">

        <button onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">
          ← Retour
        </button>

        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {compName} 2026 · {genre === "hommes" ? "Hommes" : "Femmes"}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">Mes pronos — Phase 1</h1>
          <p className="text-sm text-gray-400 mt-1">Tes 8 finalistes sélectionnés</p>
        </div>

        {picks.length === 0 ? (
          <div className="border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-gray-400 mb-6">Tu n'as pas encore parié sur cette compétition.</p>
            <button
              onClick={() => router.push(`/competition?competition=${competition}&genre=${genre}`)}
              className="bg-gray-900 hover:bg-gray-700 text-white rounded-xl px-6 py-3 font-semibold text-sm transition">
              Faire mes pronos →
            </button>
          </div>
        ) : (
          <>
            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-6">
              {picks.map((name, idx) => (
                <div key={name} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <span className="text-xs font-bold text-gray-300 w-4">{idx + 1}</span>
                  <span className="font-medium text-sm text-gray-900">{name}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push(`/competition?competition=${competition}&genre=${genre}`)}
              className="w-full h-11 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition">
              ✏️ Modifier mes pronos
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function MesPronos() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Chargement...</div>}>
      <MesPronOsContent />
    </Suspense>
  );
}
