"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const etapesLabels: Record<string, string> = {
  "keqiao-2026": "Keqiao", "berne-2026": "Berne", "madrid-2026": "Madrid",
  "prague-2026": "Prague", "innsbruck-2026": "Innsbruck", "saltlake-2026": "SLC",
};

type PlayerCard = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  picks1: { name: string; color: string }[];
  picks2: {
    gold: string; silver: string; bronze: string;
    goldColor: string; silverColor: string; bronzeColor: string;
  } | null;
};

function getColor1(rank: number | null): string {
  if (rank === null) return "bg-purple-100 text-purple-700";
  if (rank <= 8) return "bg-green-100 text-green-700";
  if (rank <= 12) return "bg-orange-100 text-orange-700";
  if (rank <= 16) return "bg-red-100 text-red-700";
  return "bg-purple-100 text-purple-700";
}

function getColor2(predictedPos: "gold" | "silver" | "bronze", athleteName: string, official: { gold: string; silver: string; bronze: string }): string {
  const posOrder = ["gold", "silver", "bronze"];
  const officialPos = Object.entries(official).find(([, v]) => v === athleteName)?.[0];
  if (!officialPos) return "bg-red-100 text-red-700"; // pas sur le podium
  if (officialPos === predictedPos) return "bg-green-100 text-green-700"; // bonne place exacte
  return "bg-orange-100 text-orange-700"; // sur le podium, mauvaise place
}

function MurPronOsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competition = searchParams.get("competition") || "keqiao-2026";
  const genre = searchParams.get("genre") || "hommes";

  const [cards, setCards] = useState<PlayerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [scoresCalculated, setScoresCalculated] = useState(false);

  const compLabel = etapesLabels[competition] || competition;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }

      // Vérifier si les scores ont été calculés
      const { data: scores } = await supabase
  .from("scores")
  .select("user_id, total_points")
  .eq("competition_id", competition)
  .eq("genre", genre);

      if (!scores || scores.length === 0) {
        setScoresCalculated(false);
        setLoading(false);
        return;
      }
      setScoresCalculated(true);

      // Résultats officiels
      const { data: officiel } = await supabase
        .from("resultats_officiels")
        .select("*")
        .eq("competition_id", competition)
        .eq("genre", genre)
        .single();

      // Map rang → athlète (rank1 = rang 1, etc.)
      const rankMap: Record<string, number> = {};
if (officiel) {
  const o = officiel as Record<string, string>;
  ["rank1","rank2","rank3","rank4","rank5","rank6","rank7","rank8",
   "rank9","rank10","rank11","rank12","rank13","rank14","rank15",
   "rank16","rank17","rank18","rank19","rank20"].forEach((key, i) => {
    const name = o[key];
    if (name) rankMap[name] = i + 1;
  });
}
      console.log("rankMap:", rankMap);

      const officialPodium = officiel
        ? { gold: officiel.podium_gold, silver: officiel.podium_silver, bronze: officiel.podium_bronze }
        : null;

      // Profils actifs
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, hidden")
        .eq("hidden", false);

      const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      profiles?.forEach(p => { profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url }; });
      const activeIds = new Set(profiles?.map(p => p.id) || []);

      // Picks phase 1
      const { data: allPicks1 } = await supabase
        .from("picks_phase1_temp")
        .select("user_id, athlete_name")
        .eq("competition_id", `${competition}-${genre}`);
        console.log("picks1 exemple:", allPicks1?.slice(0, 3));


      // Picks phase 2
      const { data: allPicks2 } = await supabase
        .from("picks_phase2_temp")
        .select("user_id, gold_athlete, silver_athlete, bronze_athlete")
        .eq("competition_id", `${competition}-${genre}`);

      const picks2Map: Record<string, { gold_athlete: string; silver_athlete: string; bronze_athlete: string }> = {};
      allPicks2?.forEach(p => { picks2Map[p.user_id] = p; });

      const scoreMap: Record<string, number> = {};
      scores.forEach(s => { scoreMap[s.user_id] = s.total_points; });

      const userIds = [...new Set(allPicks1?.map(p => p.user_id) || [])].filter(id => activeIds.has(id));

      const built: PlayerCard[] = userIds.map(uid => {
        const myPicks1 = allPicks1?.filter(p => p.user_id === uid) || [];
        const p2 = picks2Map[uid];

        return {
          user_id: uid,
          username: profileMap[uid]?.username || "Joueur",
          avatar_url: profileMap[uid]?.avatar_url || null,
          total_points: scoreMap[uid] || 0,
          picks1: myPicks1.map(p => ({
            name: p.athlete_name,
            color: getColor1(rankMap[p.athlete_name] ?? null),
          })),
          picks2: p2 && officialPodium ? {
            gold: p2.gold_athlete,
            silver: p2.silver_athlete,
            bronze: p2.bronze_athlete,
            goldColor: getColor2("gold", p2.gold_athlete, officialPodium),
            silverColor: getColor2("silver", p2.silver_athlete, officialPodium),
            bronzeColor: getColor2("bronze", p2.bronze_athlete, officialPodium),
          } : null,
        };
      }).sort((a, b) => b.total_points - a.total_points);

      setCards(built);
      setLoading(false);
    });
  }, [router, competition, genre]);

  const toggleFlip = (uid: string) => setFlipped(prev => ({ ...prev, [uid]: !prev[uid] }));

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  if (!scoresCalculated) return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">← Retour</button>
        <div className="border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-3xl mb-3">🔒</p>
          <p className="font-semibold text-gray-900 mb-1">Résultats non encore disponibles</p>
          <p className="text-sm text-gray-400">Le mur des pronos sera visible une fois les scores calculés par l'admin.</p>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <style>{`
        .card-container { perspective: 1000px; }
        .card-inner {
          position: relative; width: 100%; height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face {
          position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
          border-radius: 1rem; overflow: hidden;
        }
        .card-back { transform: rotateY(180deg); }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">← Retour</button>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {compLabel} · {genre === "hommes" ? "Hommes" : "Femmes"}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">Mur des pronos</h1>
          <p className="text-sm text-gray-400 mt-1">Clique sur une carte pour révéler les pronos</p>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { color: "bg-green-100 text-green-700", label: "✓ Bon pick" },
            { color: "bg-orange-100 text-orange-700", label: "≈ À la porte (9-12)" },
            { color: "bg-red-100 text-red-700", label: "✗ Loin (13-16)" },
{ color: "bg-purple-100 text-purple-700", label: "💀 WTF (17+)" },
          ].map(({ color, label }) => (
            <span key={label} className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>{label}</span>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.user_id}
              className="card-container cursor-pointer"
              style={{ height: "380px" }}
              onClick={() => toggleFlip(card.user_id)}
            >
              <div className={`card-inner ${flipped[card.user_id] ? "flipped" : ""}`}>

                {/* Recto */}
                <div className="card-face border border-gray-100 bg-white flex flex-col items-center justify-center gap-3 p-4">
                  {card.avatar_url ? (
                    <img src={card.avatar_url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover shadow-sm"/>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">🧗</div>
                  )}
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-900">{card.username}</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{card.total_points} pts</p>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">↻ Retourner</p>
                </div>

                {/* Verso */}
                <div className="card-face card-back bg-gray-50 border border-gray-100 p-3 flex flex-col overflow-hidden">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phase 1</p>
                  <div className="flex flex-col gap-1 mb-3 overflow-y-auto flex-1">
                    {card.picks1.map((p, i) => (
                      <span key={i} className={`text-xs font-medium px-2 py-1 rounded-lg ${p.color}`}>
                        {p.name}
                      </span>
                    ))}
                  </div>

                  {card.picks2 && (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phase 2</p>
                      <div className="flex flex-col gap-1">
                        {[
                          { emoji: "🥇", name: card.picks2.gold, color: card.picks2.goldColor },
                          { emoji: "🥈", name: card.picks2.silver, color: card.picks2.silverColor },
                          { emoji: "🥉", name: card.picks2.bronze, color: card.picks2.bronzeColor },
                        ].map(({ emoji, name, color }) => (
                            <span key={emoji} className={`text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1.5 ${color}`}>
                            {emoji} {name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function MurPronos() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Chargement...</div>}>
      <MurPronOsContent />
    </Suspense>
  );
}