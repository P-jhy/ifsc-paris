"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function PodiumContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competition = searchParams.get("competition") || "keqiao-2026";
  const genre = searchParams.get("genre") || "hommes";
  const [finalistes, setFinalistes] = useState<string[]>([]);
  const [gold, setGold] = useState<string | null>(null);
  const [silver, setSilver] = useState<string | null>(null);
  const [bronze, setBronze] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      setUserId(data.session.user.id);

      const { data: resultats } = await supabase
        .from("resultats_officiels")
        .select("*")
        .eq("competition_id", competition)
        .eq("genre", genre)
        .single();

      if (resultats) {
        const liste = [
          resultats.rank1, resultats.rank2, resultats.rank3, resultats.rank4,
          resultats.rank5, resultats.rank6, resultats.rank7, resultats.rank8
        ].filter(Boolean);
        setFinalistes(liste);
      }
      setLoading(false);
    });
  }, [router, competition, genre]);

  const selectPodium = (name: string) => {
    if (gold === name) { setGold(null); return; }
    if (silver === name) { setSilver(null); return; }
    if (bronze === name) { setBronze(null); return; }
    if (!gold) { setGold(name); return; }
    if (!silver) { setSilver(name); return; }
    if (!bronze) { setBronze(name); return; }
  };

  const getLabel = (name: string) => {
    if (gold === name) return "🥇";
    if (silver === name) return "🥈";
    if (bronze === name) return "🥉";
    return null;
  };

  const valider = async () => {
    if (!userId || !gold || !silver || !bronze) return;
    await supabase.from("picks_phase2_temp").upsert({
      user_id: userId,
      competition_id: `${competition}-${genre}`,
      gold_athlete: gold,
      silver_athlete: silver,
      bronze_athlete: bronze,
    }, { onConflict: "user_id,competition_id" });
    setSaved(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const compName = competition.split("-")[0].charAt(0).toUpperCase() + competition.split("-")[0].slice(1);

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
          <h1 className="text-2xl font-semibold">Phase 2 — Ton podium</h1>
          <p className="text-sm text-gray-400 mt-1">Clique dans l'ordre : 1er → 2ème → 3ème</p>
        </div>

        {finalistes.length === 0 ? (
          <div className="border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-gray-500 mb-2">Les finalistes ne sont pas encore disponibles.</p>
            <p className="text-gray-300 text-sm">L'admin doit d'abord sauvegarder les 8 finalistes officiels.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 mb-8">
              {[
                { emoji: "🥇", value: gold, color: "border-amber-200 bg-amber-50 text-amber-600" },
                { emoji: "🥈", value: silver, color: "border-gray-200 bg-gray-50 text-gray-600" },
                { emoji: "🥉", value: bronze, color: "border-orange-200 bg-orange-50 text-orange-600" },
              ].map(({ emoji, value, color }, i) => (
                <div key={i} className={`flex-1 border rounded-xl p-3 text-center ${color}`}>
                  <p className="text-xl mb-1">{emoji}</p>
                  <p className="text-xs font-semibold truncate">{value ?? "—"}</p>
                </div>
              ))}
            </div>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden mb-8">
              {finalistes.map((name) => {
                const label = getLabel(name);
                return (
                  <button key={name} onClick={() => selectPodium(name)}
                    className={`w-full flex items-center justify-between px-5 py-4 transition text-left ${
                      label ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50 text-gray-900"
                    }`}>
                    <span className="font-medium text-sm">{name}</span>
                    {label && <span className="text-xl">{label}</span>}
                  </button>
                );
              })}
            </div>

            {gold && silver && bronze && !saved && (
              <button onClick={valider}
                className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition">
                Valider mon podium →
              </button>
            )}

            {saved && (
              <div className="w-full h-11 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold text-sm flex items-center justify-center">
                ✓ Podium enregistré !
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function PodiumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Chargement...</div>}>
      <PodiumContent />
    </Suspense>
  );
}
