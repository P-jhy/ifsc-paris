"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const etapes = ["Keqiao", "Berne", "Madrid", "Prague", "Innsbruck", "SLC"];
const competitionIds = ["keqiao-2026", "berne-2026", "madrid-2026", "prague-2026", "innsbruck-2026", "saltlake-2026"];
const medals = ["🥇", "🥈", "🥉"];

type PlayerScore = {
  user_id: string;
  email: string;
  total: number;
  details: number[];
}

export default function ClassementPage() {
  const router = useRouter();
  const [classement, setClassement] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }

      const { data: scores } = await supabase
        .from("scores")
        .select("user_id, competition_id, total_points");

      if (!scores || scores.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = [...new Set(scores.map(s => s.user_id))];
      const { data: users } = await supabase.auth.admin?.listUsers?.() || { data: null };

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
          email: userId.substring(0, 8) + "...",
          total,
          details,
        };
      }

      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session.session?.user.id;
      if (currentUserId && playerMap[currentUserId]) {
        playerMap[currentUserId].email = session.session?.user.email || "Moi";
      }

      const sorted = Object.values(playerMap).sort((a, b) => b.total - a.total);
      setClassement(sorted);
      setLoading(false);
    });
  }, [router]);

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

        <div className="mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Saison 2026</p>
          <h1 className="text-2xl font-semibold text-gray-900">Classement général</h1>
        </div>

        {classement.length === 0 ? (
          <div className="border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-gray-400">Aucun score encore calculé.</p>
            <p className="text-gray-300 text-sm mt-2">Les scores apparaîtront après la première étape.</p>
          </div>
        ) : (
          <>
            {/* Top 3 */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {classement.slice(0, 3).map((j, idx) => (
                <div key={idx} className={`rounded-2xl border p-4 text-center ${idx === 0 ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
                  <p className="text-2xl mb-1">{medals[idx]}</p>
                  <p className="font-semibold text-sm text-gray-900 truncate">{j.email}</p>
                  <p className={`text-lg font-bold mt-1 ${idx === 0 ? "text-amber-600" : "text-gray-700"}`}>{j.total} pts</p>
                </div>
              ))}
            </div>

            {/* Tableau complet */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-8">
              <div className="grid grid-cols-[32px_1fr_60px] gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400">#</p>
                <p className="text-xs font-semibold text-gray-400">Joueur</p>
                <p className="text-xs font-semibold text-gray-400 text-right">Total</p>
              </div>
              {classement.map((j, idx) => (
                <div key={idx} className="grid grid-cols-[32px_1fr_60px] gap-2 px-5 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50 transition">
                  <p className="text-sm font-medium text-gray-400">{idx + 1}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{j.email}</p>
                  <p className="text-sm font-bold text-gray-900 text-right">{j.total}</p>
                </div>
              ))}
            </div>

            {/* Détail par étape */}
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
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-semibold text-gray-900 truncate max-w-[120px]">{j.email}</td>
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
          </>
        )}

        <p className="text-center text-xs text-gray-300 mt-8">Mis à jour après chaque étape · 6 étapes au total</p>
      </div>
    </main>
  );
}
