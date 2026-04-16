"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Pick2 = {
  gold_athlete: string;
  silver_athlete: string;
  bronze_athlete: string;
}

function PronOsJoueurContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("user") || "";
  const competition = searchParams.get("competition") || "keqiao-2026";
  const genre = searchParams.get("genre") || "hommes";

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [picks1, setPicks1] = useState<string[]>([]);
  const [pick2, setPick2] = useState<Pick2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  const compName = competition.split("-")[0].charAt(0).toUpperCase() + competition.split("-")[0].slice(1);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();

      setUsername(profile?.username || "Joueur");
      setAvatarUrl(profile?.avatar_url || null);

      const { data: resultats } = await supabase
        .from("resultats_officiels")
        .select("rank1")
        .eq("competition_id", competition)
        .eq("genre", genre)
        .single();

      const isLocked = !!resultats?.rank1;
      setLocked(isLocked);

      if (isLocked) {
        const { data: p1 } = await supabase
          .from("picks_phase1_temp")
          .select("athlete_name")
          .eq("user_id", userId)
          .eq("competition_id", `${competition}-${genre}`);

        const { data: p2 } = await supabase
          .from("picks_phase2_temp")
          .select("gold_athlete, silver_athlete, bronze_athlete")
          .eq("user_id", userId)
          .eq("competition_id", `${competition}-${genre}`)
          .single();

        setPicks1(p1?.map(p => p.athlete_name) || []);
        setPick2(p2 || null);
      }

      setLoading(false);
    });
  }, [router, userId, competition, genre]);

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">
          ← Retour
        </button>

        <div className="flex items-center gap-4 mb-8">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-2xl object-cover border border-gray-100"/>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">🧗</div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              {compName} 2026 · {genre === "hommes" ? "Hommes" : "Femmes"}
            </p>
            <h1 className="text-2xl font-semibold">Pronos de {username}</h1>
          </div>
        </div>

        {!locked ? (
          <div className="border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-4xl mb-4">🔒</p>
            <p className="text-gray-600 font-semibold mb-2">Pronos verrouillés</p>
            <p className="text-gray-400 text-sm">Les pronos des autres joueurs seront visibles une fois les résultats officiels entrés par l'admin.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Phase 1 — 8 finalistes</h2>
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                {picks1.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Aucun prono Phase 1</p>
                ) : picks1.map((name, idx) => (
                  <div key={name} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-gray-300 w-4">{idx + 1}</span>
                    <span className="font-medium text-sm text-gray-900">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Phase 2 — Podium</h2>
              {!pick2 ? (
                <p className="text-center text-gray-400 py-8 text-sm border border-gray-100 rounded-2xl">Aucun prono Phase 2</p>
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
          </>
        )}
      </div>
    </main>
  );
}

export default function PronOsJoueur() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Chargement...</div>}>
      <PronOsJoueurContent />
    </Suspense>
  );
}
