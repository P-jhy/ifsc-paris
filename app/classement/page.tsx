"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const mockClassement = [
  { rank: 1, username: "paulacebplayer", total: 47, details: [12, 8, 15, 0, 0, 0] },
  { rank: 2, username: "sophie", total: 38, details: [9, 0, 12, 0, 0, 0] },
  { rank: 3, username: "lucas", total: 35, details: [7, 11, 0, 0, 0, 0] },
  { rank: 4, username: "marine", total: 29, details: [5, 8, 8, 0, 0, 0] },
  { rank: 5, username: "thomas", total: 21, details: [0, 9, 4, 0, 0, 0] },
];

const etapes = ["Keqiao", "Berne", "Madrid", "Prague", "Innsbruck", "SLC"];
const medals = ["🥇", "🥈", "🥉"];

export default function ClassementPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">

        <button onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-gray-900 transition mb-8 flex items-center gap-1">
          ← Retour
        </button>

        <div className="mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Saison 2026</p>
          <h1 className="text-2xl font-semibold text-gray-900">Classement général</h1>
        </div>

        {/* Top 3 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {mockClassement.slice(0, 3).map((j, idx) => (
            <div key={idx} className={`rounded-2xl border p-4 text-center ${idx === 0 ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
              <p className="text-2xl mb-1">{medals[idx]}</p>
              <p className="font-semibold text-sm text-gray-900 truncate">{j.username}</p>
              <p className={`text-lg font-bold mt-1 ${idx === 0 ? "text-amber-600" : "text-gray-700"}`}>{j.total} pts</p>
            </div>
          ))}
        </div>

        {/* Tableau complet */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_60px] gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400">#</p>
            <p className="text-xs font-semibold text-gray-400">Joueur</p>
            <p className="text-xs font-semibold text-gray-400 text-right">Total</p>
          </div>

          {mockClassement.map((j, idx) => (
            <div key={idx} className="grid grid-cols-[32px_1fr_60px] gap-2 px-5 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50 transition">
              <p className="text-sm font-medium text-gray-400">{j.rank}</p>
              <p className="text-sm font-semibold text-gray-900">{j.username}</p>
              <p className="text-sm font-bold text-gray-900 text-right">{j.total}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-gray-100 rounded-2xl overflow-hidden">
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
                {mockClassement.map((j, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-semibold text-gray-900">{j.username}</td>
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

        <p className="text-center text-xs text-gray-300 mt-8">Mis à jour après chaque étape · 6 étapes au total</p>
      </div>
    </main>
  );
}
