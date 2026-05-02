"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const etapes = ["Keqiao", "Berne", "Madrid", "Prague", "Innsbruck", "SLC"];
const competitionIds = ["keqiao-2026", "berne-2026", "madrid-2026", "prague-2026", "innsbruck-2026", "saltlake-2026"];
const medals = ["🥇", "🥈", "🥉"];

type PlayerScore = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total: number;
  details: number[];
  previousTotal: number | null;
}

export default function ClassementPage() {
  const router = useRouter();
  const [classement, setClassement] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedEtape, setSelectedEtape] = useState<string>("all");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      setCurrentUserId(data.session.user.id);

      const { data: scores } = await supabase
        .from("scores")
        .select("user_id, competition_id, genre, total_points");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url");

      const { data: history } = await supabase
        .from("scores_history")
        .select("user_id, competition_id, total_points, recorded_at")
        .order("recorded_at", { ascending: false });

      if (!scores || scores.length === 0) { setLoading(false); return; }

      const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      profiles?.forEach(p => { profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url }; });
      const activeIds = new Set(profiles?.map(p => p.id) || []);

      // Historique précédent par user (avant le snapshot le plus récent)
      const previousTotals: Record<string, number> = {};
      if (history && history.length > 0) {
        const userIds = [...new Set(scores.map(s => s.user_id))];
        for (const uid of userIds) {
          const userHistory = history.filter(h => h.user_id === uid);
          if (userHistory.length >= 2) {
            // Prendre le snapshot juste avant le dernier
            const prev = userHistory.slice(1);
            previousTotals[uid] = prev.reduce((acc, cur) => acc + cur.total_points, 0);
          }
        }
      }

      const userIds = [...new Set(scores.map(s => s.user_id))].filter(id => activeIds.has(id));
      const playerMap: Record<string, PlayerScore> = {};

      for (const userId of userIds) {
        const userScores = scores.filter(s => s.user_id === userId);
        const details = competitionIds.map(compId => {
          const s = userScores.filter(s => s.competition_id === compId);
          return s.reduce((acc, cur) => acc + cur.total_points, 0);
        });
        const total = details.reduce((a, b) => a + b, 0);
        playerMap[userId] = {
          user_id: userId,
          username: profileMap[userId]?.username || "Joueur",
          avatar_url: profileMap[userId]?.avatar_url || null,
          total,
          details,
          previousTotal: previousTotals[userId] ?? null,
        };
      }

      const sorted = Object.values(playerMap).sort((a, b) => b.total - a.total);
      setClassement(sorted);
      setLoading(false);
    });
  }, [router]);

  // Classement filtré selon étape sélectionnée
  const filteredClassement = selectedEtape === "all"
    ? classement
    : [...classement]
        .map(j => ({
          ...j,
          total: j.details[competitionIds.indexOf(selectedEtape)] || 0,
        }))
        .sort((a, b) => b.total - a.total);

  // Meilleure / pire perf sur la dernière étape disputée
  const lastDisputedIdx = competitionIds.reduce((lastIdx, _, i) => {
    const hasScores = classement.some(j => j.details[i] > 0);
    return hasScores ? i : lastIdx;
  }, -1);

  const perfDerniereEtape = lastDisputedIdx >= 0
    ? classement.map(j => ({ username: j.username, pts: j.details[lastDisputedIdx] }))
    : [];
  const bestPerf = perfDerniereEtape.length > 0
    ? perfDerniereEtape.reduce((a, b) => a.pts >= b.pts ? a : b)
    : null;
  const worstPerf = perfDerniereEtape.filter(p => p.pts > 0).length > 0
    ? perfDerniereEtape.filter(p => p.pts > 0).reduce((a, b) => a.pts <= b.pts ? a : b)
    : null;

  const getEvolution = (j: PlayerScore) => {
    if (j.previousTotal === null) return null;
    const diff = j.total - j.previousTotal;
    if (diff > 0) return { label: `+${diff}`, color: "text-green-500", arrow: "↑" };
    if (diff < 0) return { label: `${diff}`, color: "text-red-400", arrow: "↓" };
    return { label: "=", color: "text-gray-300", arrow: "=" };
  };

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <button onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">
          ← Retour
        </button>

        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Saison 2026</p>
          <h1 className="text-2xl font-semibold text-gray-900">Classement général</h1>
        </div>

        {/* Meilleure / pire perf */}
        {(bestPerf || worstPerf) && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {bestPerf && (
              <div className="border border-green-100 bg-green-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
                  🔥 Meilleure perf — {etapes[lastDisputedIdx]}
                </p>
                <p className="font-semibold text-sm text-gray-900">{bestPerf.username}</p>
                <p className="text-lg font-bold text-green-600">{bestPerf.pts} pts</p>
              </div>
            )}
            {worstPerf && (
              <div className="border border-red-100 bg-red-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
                  💀 Pire perf — {etapes[lastDisputedIdx]}
                </p>
                <p className="font-semibold text-sm text-gray-900">{worstPerf.username}</p>
                <p className="text-lg font-bold text-red-500">{worstPerf.pts} pts</p>
              </div>
            )}
          </div>
        )}

        {classement.length === 0 ? (
          <div className="border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-gray-400">Aucun score encore calculé.</p>
          </div>
        ) : (
          <>
            {/* Top 3 */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {classement.slice(0, 3).map((j, idx) => (
                <button key={idx}
                  onClick={() => router.push(`/pronos-joueur?user=${j.user_id}&competition=keqiao-2026&genre=hommes`)}
                  className={`rounded-2xl border p-4 text-center hover:shadow-sm transition ${
                    j.user_id === currentUserId
                      ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200"
                      : idx === 0 ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"
                  }`}>
                  {j.avatar_url ? (
                    <img src={j.avatar_url} alt="avatar" className="w-12 h-12 rounded-xl object-cover mx-auto mb-2"/>
                  ) : (
                    <p className="text-2xl mb-1">{medals[idx]}</p>
                  )}
                  <p className="font-semibold text-sm text-gray-900 truncate">{j.username}</p>
                  {j.user_id === currentUserId && (
                    <p className="text-xs text-blue-400 font-medium">Toi</p>
                  )}
                  <p className={`text-lg font-bold mt-1 ${idx === 0 ? "text-amber-600" : "text-gray-700"}`}>
                    {j.total} pts
                  </p>
                </button>
              ))}
            </div>

            {/* Filtre étape */}
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setSelectedEtape("all")}
                className={`text-xs font-medium rounded-full px-3 py-1.5 transition ${
                  selectedEtape === "all" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}>
                Saison
              </button>
              {etapes.map((e, i) => (
                <button key={e}
                  onClick={() => setSelectedEtape(competitionIds[i])}
                  className={`text-xs font-medium rounded-full px-3 py-1.5 transition ${
                    selectedEtape === competitionIds[i] ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}>
                  {e}
                </button>
              ))}
            </div>

            {/* Tableau complet */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-8">
              {filteredClassement.map((j, idx) => {
                const evo = getEvolution(j);
                const isMe = j.user_id === currentUserId;
                return (
                  <button key={idx}
                    onClick={() => router.push(`/pronos-joueur?user=${j.user_id}&competition=keqiao-2026&genre=hommes`)}
                    className={`w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 transition text-left ${
                      isMe ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                    }`}>
                    <span className="text-sm font-medium text-gray-300 w-4">{idx + 1}</span>
                    {j.avatar_url ? (
                      <img src={j.avatar_url} alt="avatar" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">🧗</div>
                    )}
                    <span className={`flex-1 text-sm font-semibold ${isMe ? "text-blue-700" : "text-gray-900"}`}>
                      {j.username} {isMe && <span className="text-xs font-normal text-blue-400">(toi)</span>}
                    </span>
                    {evo && (
                      <span className={`text-xs font-semibold ${evo.color}`}>
                        {evo.arrow} {evo.label}
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-900">{j.total} pts</span>
                  </button>
                );
              })}
            </div>

            {/* Détail par étape */}
            {selectedEtape === "all" && (
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Détail par étape</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Joueur</th>
                        {etapes.map(e => (
                          <th key={e} className="text-center px-3 py-3 text-xs text-gray-400 font-medium">{e}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classement.map((j, idx) => (
                        <tr key={idx}
                          className={`border-b border-gray-50 last:border-0 transition cursor-pointer ${
                            j.user_id === currentUserId ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                          }`}
                          onClick={() => router.push(`/pronos-joueur?user=${j.user_id}&competition=keqiao-2026&genre=hommes`)}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              {j.avatar_url ? (
                                <img src={j.avatar_url} alt="avatar" className="w-6 h-6 rounded-md object-cover"/>
                              ) : null}
                              <span className={`font-semibold text-sm ${j.user_id === currentUserId ? "text-blue-700" : "text-gray-900"}`}>
                                {j.username}
                              </span>
                            </div>
                          </td>
                          {j.details.map((pts, i) => (
                            <td key={i} className="text-center px-3 py-3">
                              {pts > 0
                                ? <span className="font-semibold text-gray-900">{pts}</span>
                                : <span className="text-gray-300">—</span>
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-300 mt-8">Mis à jour après chaque étape · 6 étapes au total</p>
      </div>
    </main>
  );
}
