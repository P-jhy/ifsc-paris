"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const finalistes = [
  "Kokoro Fujii", "Tomoa Narasaki", "Colin Duffy", "Sean Bailey",
  "Janja Garnbret", "Natalia Grossman", "Oriane Bertone", "Miho Nonaka"
];

export default function PodiumPage() {
  const router = useRouter();
  const [gold, setGold] = useState<string | null>(null);
  const [silver, setSilver] = useState<string | null>(null);
  const [bronze, setBronze] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
      else setUserId(data.session.user.id);
    });
  }, [router]);

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
    setLoading(true);
    await supabase.from("picks_phase2_temp").upsert({
      user_id: userId,
      competition_id: "00000000-0000-0000-0000-000000000001",
      gold_athlete: gold,
      silver_athlete: silver,
      bronze_athlete: bronze,
    }, { onConflict: "user_id,competition_id" });
    setSaved(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white mb-6 text-sm">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold mb-1">Phase 2 — Choisis ton podium</h1>
        <p className="text-gray-400 mb-4">Clique dans l'ordre : 1er → 2ème → 3ème</p>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-gray-900 border border-yellow-500/40 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🥇</div>
            <div className="text-sm font-semibold text-yellow-400">{gold ?? "—"}</div>
          </div>
          <div className="flex-1 bg-gray-900 border border-gray-500/40 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🥈</div>
            <div className="text-sm font-semibold text-gray-300">{silver ?? "—"}</div>
          </div>
          <div className="flex-1 bg-gray-900 border border-orange-500/40 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🥉</div>
            <div className="text-sm font-semibold text-orange-400">{bronze ?? "—"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {finalistes.map((name) => {
            const label = getLabel(name);
            return (
              <button key={name} onClick={() => selectPodium(name)}
                className={`p-4 rounded-xl border text-left font-medium transition flex items-center justify-between ${
                  label
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500"
                }`}>
                <span>{name}</span>
                {label && <span className="text-xl">{label}</span>}
              </button>
            );
          })}
        </div>

        {gold && silver && bronze && !saved && (
          <button onClick={valider} disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg disabled:opacity-60">
            {loading ? "Enregistrement..." : "Valider mon podium"}
          </button>
        )}

        {saved && (
          <div className="w-full h-12 bg-green-700 rounded-xl font-semibold text-lg flex items-center justify-center">
            ✓ Podium enregistré ! Retour au dashboard...
          </div>
        )}
      </div>
    </main>
  );
}
