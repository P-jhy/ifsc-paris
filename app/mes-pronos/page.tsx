"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

type Pick2 = {
  gold_athlete: string;
  silver_athlete: string;
  bronze_athlete: string;
}

function MesPronOsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competition = searchParams.get("competition") || "keqiao-2026";
  const genre = searchParams.get("genre") || "hommes";
  const [picks, setPicks] = useState<string[]>([]);
  const [pick2, setPick2] = useState<Pick2 | null>(null);
  const [loading, setLoading] = useState(true);

  const compName = competition.split("-")[0].charAt(0).toUpperCase() + competition.split("-")[0].slice(1);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }

      const { data: picks1 } = await supabase
        .from("picks_phase1_temp")
        .select("athlete_name")
        .eq("user_id", data.session.user.id)
        .eq("competition_id", `${competition}-${genre}`);

      const { data: picks2 } = await supabase
        .from("picks_phase2_temp")
        .select("gold_athlete, silver_athlete, bronze_athlete")
        .eq("user_id", data.session.user.id)
        .eq("competition_id", `${competition}-${genre}`)
        .single();

      setPicks(picks1?.map(p => p.athlete_name) || []);
      setPick2(picks2 || null);
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
          <h1 className="text-2xl font-semibold text-gray-900">Mes pronos</h1>
        </div>

        {/* Phase 1 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Phase 1 — Tes 8 finalistes</h2>
            <button onClick={() => router.push(`/competition?competition=${competition}&genre=${genre}`)}
              className="text-xs text-gray-400 hover:text-gray-900 border border-gray-200 rounded-full px-3 py-1 transition">
              ✏️ Modifier
            </button>
          </div>

          {picks.length === 0 ? (
            <div className="border border-gray-100 rounded-2xl p-8 text-center">
              <p className="text-gray-400 mb-4">Tu n'as pas encore fait ta Phase 1.</p>
              <button onClick={() => router.push(`/competition?competition=${competition}&genre=${genre}`)}
                className="bg-gray-900 hover:bg-gray-700 text-white rounded-xl px-6 py-3 font-semibold text-sm transition">
                Faire mes pronos →
              </button>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              {picks.map((name, idx) => (
                <div key={name} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <span className="text-xs font-bold text-gray-300 w-4">{idx + 1}</span>
                  <span className="font-medium text-sm text-gray-900">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phase 2 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Phase 2 — Ton podium</h2>
            <button onClick={() => router.push(`/podium?competition=${competition}&genre=${genre}`)}
              className="text-xs text-gray-400 hover:text-gray-900 border border-gray-200 rounded-full px-3 py-1 transition">
              ✏️ Modifier
            </button>
          </div>

          {!pick2 ? (
            <div className="border border-gray-100 rounded-2xl p-8 text-center">
              <p className="text-gray-400 mb-4">Tu n'as pas encore fait ta Phase 2.</p>
              <button onClick={() => router.push(`/podium?competition=${competition}&genre=${genre}`)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl px-6 py-3 font-semibold text-sm transition">
                🏆 Choisir mon podium →
              </button>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              {[
                { emoji: "🥇", label: "Vainqueur", name: pick2.gold_athlete, color: "bg-amber-50" },
                { emoji: "🥈", label: "2ème", name: pick2.silver_athlete, color: "bg-gray-50" },
                { emoji: "🥉", label: "3ème", name: pick2.bronze_athlete, color: "bg-orange-50" },
              ].map(({ emoji, label, name, color }) => (
                <div key={label} className={`flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 ${color}`}>
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-sm text-gray-900">{name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
