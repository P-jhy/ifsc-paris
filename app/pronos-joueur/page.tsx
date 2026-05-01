"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const competitions = [
  { id: "keqiao-2026", label: "Keqiao" },
  { id: "berne-2026", label: "Berne" },
  { id: "madrid-2026", label: "Madrid" },
  { id: "prague-2026", label: "Prague" },
  { id: "innsbruck-2026", label: "Innsbruck" },
  { id: "saltlake-2026", label: "Salt Lake City" },
] as const;

const genres = [
  { id: "hommes", label: "Hommes" },
  { id: "femmes", label: "Femmes" },
] as const;

type Pick2 = {
  gold_athlete: string;
  silver_athlete: string;
  bronze_athlete: string;
}

type StatEtape = {
  label: string;
  compId: string;
  hommes: { phase1: number | null; phase2: number | null; total: number | null };
  femmes: { phase1: number | null; phase2: number | null; total: number | null };
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-xs font-semibold text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function PronOsJoueurContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("user") || "";
  const competition = searchParams.get("competition") || "keqiao-2026";
  const genre = searchParams.get("genre") || "hommes";
  const [tab, setTab] = useState<"pronos" | "stats">("pronos");

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [picks1, setPicks1] = useState<string[]>([]);
  const [pick2, setPick2] = useState<Pick2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [stats, setStats] = useState<StatEtape[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const compName = competition.split("-")[0].charAt(0).toUpperCase() + competition.split("-")[0].slice(1);

  const navigateWith = (nextCompetition: string, nextGenre: string) => {
    const params = new URLSearchParams();
    if (userId) params.set("user", userId);
    params.set("competition", nextCompetition);
    params.set("genre", nextGenre);
    router.push(`/pronos-joueur?${params.toString()}`);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      if (!userId) { router.back(); return; }

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

      // Stats : charger tous les scores du joueur
      const { data: scores } = await supabase
        .from("scores")
        .select("competition_id, genre, phase1_points, phase2_points, total_points")
        .eq("user_id", userId);

      // Stats par étape
      const statEtapes: StatEtape[] = competitions.map(c => {
        const sh = scores?.find(s => s.competition_id === c.id && s.genre === "hommes");
        const sf = scores?.find(s => s.competition_id === c.id && s.genre === "femmes");
        return {
          label: c.label,
          compId: c.id,
          hommes: {
            phase1: sh?.phase1_points ?? null,
            phase2: sh?.phase2_points ?? null,
            total: sh?.total_points ?? null,
          },
          femmes: {
            phase1: sf?.phase1_points ?? null,
            phase2: sf?.phase2_points ?? null,
            total: sf?.total_points ?? null,
          },
        };
      });
      setStats(statEtapes);

      const total = scores?.reduce((acc, s) => acc + (s.total_points || 0), 0) || 0;
      setTotalScore(total);

      setLoading(false);
    });
  }, [router, userId, competition, genre]);

  // Stats globales
  const totalHommes = stats.reduce((acc, s) => acc + (s.hommes.total || 0), 0);
  const totalFemmes = stats.reduce((acc, s) => acc + (s.femmes.total || 0), 0);
  const maxPossible = stats.filter(s => s.hommes.total !== null || s.femmes.total !== null).length * 100;

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">
          ← Retour
        </button>

        {/* Header joueur */}
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-2xl object-cover border border-gray-100"/>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">🧗</div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{username}</h1>
            <p className="text-xs text-gray-400">{totalScore > 0 ? `${totalScore} pts au total` : "Pas encore de score"}</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("pronos")}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${tab === "pronos" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            📋 Pronos
          </button>
          <button onClick={() => setTab("stats")}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${tab === "stats" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            📊 Stats
          </button>
        </div>

        {/* ===== ONGLET STATS ===== */}
        {tab === "stats" && (
          <div className="space-y-6">

            {/* Score global */}
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Score global</p>
              <div className="flex items-end gap-4 mb-4">
                <p className="text-4xl font-bold text-gray-900">{totalScore}</p>
                <p className="text-sm text-gray-400 mb-1">pts</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hommes</p>
                  <p className="text-lg font-bold text-blue-600">{totalHommes} pts</p>
                  <StatBar value={totalHommes} max={totalScore || 1} color="bg-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Femmes</p>
                  <p className="text-lg font-bold text-pink-500">{totalFemmes} pts</p>
                  <StatBar value={totalFemmes} max={totalScore || 1} color="bg-pink-400" />
                </div>
              </div>
            </div>

            {/* Stats par étape */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Détail par étape</p>
              </div>
              {stats.map((s) => {
                const etapeTotal = (s.hommes.total || 0) + (s.femmes.total || 0);
                const hasData = s.hommes.total !== null || s.femmes.total !== null;
                return (
                  <div key={s.compId} className={`px-5 py-4 border-b border-gray-50 last:border-0 ${!hasData ? "opacity-40" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                      <p className="text-sm font-bold text-gray-900">{hasData ? `${etapeTotal} pts` : "—"}</p>
                    </div>
                    {hasData && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-xs text-blue-400 font-medium">H</p>
                            <p className="text-xs text-gray-500">{s.hommes.total ?? "—"} pts</p>
                          </div>
                          <StatBar value={s.hommes.total || 0} max={etapeTotal || 1} color="bg-blue-300" />
                          <p className="text-xs text-gray-300 mt-1">
                            P1: {s.hommes.phase1 ?? "—"} · P2: {s.hommes.phase2 ?? "—"}
                          </p>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-xs text-pink-400 font-medium">F</p>
                            <p className="text-xs text-gray-500">{s.femmes.total ?? "—"} pts</p>
                          </div>
                          <StatBar value={s.femmes.total || 0} max={etapeTotal || 1} color="bg-pink-300" />
                          <p className="text-xs text-gray-300 mt-1">
                            P1: {s.femmes.phase1 ?? "—"} · P2: {s.femmes.phase2 ?? "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== ONGLET PRONOS ===== */}
        {tab === "pronos" && (
          <>
            {/* Filtres compét + genre */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-wrap gap-2">
                {competitions.map((c) => (
                  <button key={c.id} onClick={() => navigateWith(c.id, genre)}
                    className={`text-xs font-medium rounded-full px-3 py-1.5 transition border ${
                      competition === c.id ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {genres.map((g) => (
                  <button key={g.id} onClick={() => navigateWith(competition, g.id)}
                    className={`text-xs font-medium rounded-full px-3 py-1.5 transition border ${
                      genre === g.id ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              {compName} 2026 · {genre === "hommes" ? "Hommes" : "Femmes"}
            </p>

            {!locked ? (
              <div className="border border-gray-100 rounded-2xl p-10 text-center">
                <p className="text-4xl mb-4">🔒</p>
                <p className="text-gray-600 font-semibold mb-2">Pronos verrouillés</p>
                <p className="text-gray-400 text-sm">Visibles une fois les résultats officiels entrés.</p>
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
