"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const competitions = [
  { id: 1, name: 'Keqiao', country: 'Chine', flag: '🇨🇳', status: 'before_semis' },
  { id: 2, name: 'Berne', country: 'Suisse', flag: '🇨🇭', status: 'before_semis' },
  { id: 3, name: 'Madrid', country: 'Espagne', flag: '🇪🇸', status: 'before_semis' },
  { id: 4, name: 'Prague', country: 'Tchéquie', flag: '🇨🇿', status: 'before_semis' },
  { id: 5, name: 'Innsbruck', country: 'Autriche', flag: '🇦🇹', status: 'before_semis' },
  { id: 6, name: 'Salt Lake City', country: 'États-Unis', flag: '🇺🇸', status: 'before_semis' },
]

const statusLabels: Record<string, string> = {
  before_semis: '⏳ Avant les demi-finales',
  after_semis: '🔒 Après les demi-finales',
  finished: '✅ Terminée',
}

const statusColors: Record<string, string> = {
  before_semis: 'text-yellow-400',
  after_semis: 'text-blue-400',
  finished: 'text-green-400',
}

export default function AdminPage() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<number, string>>(
    Object.fromEntries(competitions.map(c => [c.id, c.status]))
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  const nextStatus = (current: string) => {
    if (current === 'before_semis') return 'after_semis';
    if (current === 'after_semis') return 'finished';
    return 'finished';
  };

  const updateStatus = (id: number) => {
    setStatuses(prev => ({
      ...prev,
      [id]: nextStatus(prev[id])
    }));
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">⚙️ Interface Admin</h1>
            <p className="text-gray-400 mt-1">Gestion des compétitions IFSC 2026</p>
          </div>
          <button onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-xl px-4 py-2">
            ← Dashboard
          </button>
        </div>

        <div className="grid gap-4">
          {competitions.map((c) => {
            const status = statuses[c.id];
            return (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <h2 className="font-semibold">{c.name} · {c.country}</h2>
                      <p className={`text-sm font-medium ${statusColors[status]}`}>
                        {statusLabels[status]}
                      </p>
                    </div>
                  </div>
                  {status !== 'finished' && (
                    <button
                      onClick={() => updateStatus(c.id)}
                      className="text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 font-semibold"
                    >
                      {status === 'before_semis' ? '🔒 Verrouiller Phase 1' : '✅ Terminer'}
                    </button>
                  )}
                  {status === 'finished' && (
                    <span className="text-green-400 font-semibold text-sm">✅ Terminée</span>
                  )}
                </div>

                {status === 'after_semis' && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-sm text-gray-400 mb-2">Entre les 8 finalistes officiels :</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <input key={i} type="text" placeholder={`Finaliste ${i}`}
                          className="h-9 rounded-lg bg-gray-800 border border-gray-700 px-3 text-sm outline-none focus:border-blue-500"/>
                      ))}
                    </div>
                    <button className="mt-3 w-full h-10 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-semibold">
                      Valider les finalistes
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
