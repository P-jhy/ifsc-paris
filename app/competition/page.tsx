"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getRankingLabel(r: number) { return r === 999 ? "NC" : `#${r}`; }
function getRankingColor(r: number) {
  if (r <= 10) return "text-amber-500";
  if (r <= 25) return "text-blue-500";
  if (r <= 50) return "text-green-500";
  return "text-gray-400";
}

type Athlete = { 
  name: string
  country: string
  ranking: number
  photo_url: string | null
  best_result_recent: string | null
  best_result_alltime: string | null
}


function CompetitionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competition = searchParams.get("competition") || "keqiao-2026";
  const genre = searchParams.get("genre") || "hommes";
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(true);

  useEffect(() => {
    supabase.from("competition_status").select("open")
      .eq("competition_id", competition).single()
      .then(({ data }) => setIsOpen(data?.open ?? false));
  }, [competition]);

  // Chargement des athlètes depuis Supabase
  useEffect(() => {
    setAthletesLoading(true)
    setAthletes([])
    supabase
      .from("athletes")
      .select("name, country, world_ranking, override_ranking, photo_url, best_result_recent, best_result_alltime")
      .eq("competition_id", competition)
      .eq("genre", genre)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAthletes(data.map(a => ({
            name: a.name,
            country: a.country,
            ranking: a.override_ranking ?? a.world_ranking,
            photo_url: a.photo_url,
            best_result_recent: a.best_result_recent,
            best_result_alltime: a.best_result_alltime,
          })))
        }
        setAthletesLoading(false)
      })
  }, [competition, genre]);

  const sorted = [...athletes].sort((a, b) => a.ranking - b.ranking);
  const filtered = sorted.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.country.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
      else setUserId(data.session.user.id);
    });
  }, [router]);

  const toggle = (name: string) => {
    if (selected.includes(name)) setSelected(selected.filter(n => n !== name));
    else if (selected.length < 8) setSelected([...selected, name]);
  };

  const valider = async () => {
    if (!userId || selected.length !== 8) return;
    setLoading(true);
    const rows = selected.map(name => ({
      user_id: userId,
      competition_id: `${competition}-${genre}`,
      athlete_name: name,
    }));
    await supabase.from("picks_phase1_temp").upsert(rows, { onConflict: "user_id,competition_id,athlete_name" });
    setSaved(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const compName = competition.split("-")[0].charAt(0).toUpperCase() + competition.split("-")[0].slice(1);

  if (isOpen === null) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  if (isOpen === false) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-5xl mb-4">🔒</p>
        <p className="text-lg font-semibold text-gray-900 mb-2">Votes fermés</p>
        <p className="text-sm text-gray-400 mb-6">Les votes pour cette étape ne sont pas encore ouverts.</p>
        <button onClick={() => router.push("/dashboard")}
          className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold">
          ← Retour au dashboard
        </button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">

        <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-400 hover:text-gray-900 transition mb-8 flex items-center gap-1">
          ← Retour
        </button>

        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{compName} 2026</p>
          <h1 className="text-2xl font-semibold text-gray-900">Phase 1 — Tes finalistes</h1>
          <p className="text-sm text-gray-400 mt-1">{selected.length} / 8 sélectionnés</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => { router.replace(`/competition?competition=${competition}&genre=hommes`); setSelected([]); }}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${genre === "hommes" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            Hommes
          </button>
          <button onClick={() => { router.replace(`/competition?competition=${competition}&genre=femmes`); setSelected([]); }}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${genre === "femmes" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            Femmes
          </button>
        </div>

        <input type="text" placeholder="Rechercher..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 mb-4 transition"/>

{athletesLoading ? (
  <div className="text-center py-12 text-gray-400 text-sm">Chargement des athlètes...</div>
) : athletes.length === 0 ? (
  <div className="text-center py-12 border border-gray-100 rounded-2xl">
    <p className="text-gray-400 text-sm">Aucun inscrit trouvé pour cette compétition.</p>
    <p className="text-gray-300 text-xs mt-1">L'admin doit synchroniser les inscrits depuis IFSC.</p>
  </div>
) : (
  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden mb-8">
    {filtered.map((athlete) => {
      const isSelected = selected.includes(athlete.name)
      return (
        <button key={athlete.name} onClick={() => toggle(athlete.name)}
  className={`w-full flex items-center gap-4 px-4 py-3 transition text-left ${
            isSelected ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50 text-gray-900"
          }`}>
          
          {/* Photo */}
<div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
  {athlete.photo_url ? (
    <img src={athlete.photo_url} alt={athlete.name}
      className="w-full h-full object-cover object-top"/>
  ) : (
    <div className="w-full h-full flex items-center justify-center text-3xl">🧗</div>
  )}
</div>

{/* Infos */}
<div className="flex-1 min-w-0">
  <div className="flex items-center gap-2 mb-1">
    {isSelected && <span className="text-white text-xs">✓</span>}
    <span className="font-semibold text-sm truncate">{athlete.name}</span>
    <span className="text-xs text-gray-400 flex-shrink-0">{athlete.country}</span>
  </div>
  <p className={`text-xs mb-0.5 ${isSelected ? "text-gray-400" : "text-gray-500"}`}>
    <span className="font-semibold">5 dernières compét. :</span>{" "}
    {athlete.best_result_recent || "—"}
  </p>
  <p className={`text-xs ${isSelected ? "text-gray-400" : "text-gray-500"}`}>
    <span className="font-semibold">All time :</span>{" "}
    {athlete.best_result_alltime || "—"}
  </p>
</div>

          {/* Ranking */}
          <span className={`text-xs font-semibold flex-shrink-0 ${
            isSelected ? "text-gray-300" : getRankingColor(athlete.ranking)
          }`}>
            {getRankingLabel(athlete.ranking)}
          </span>

        </button>
      )
    })}
  </div>
)}

        {selected.length === 8 && !saved && (
          <button onClick={valider} disabled={loading}
            className="w-full h-12 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl font-semibold transition disabled:opacity-60">
            {loading ? "Enregistrement..." : "Valider mes 8 finalistes →"}
          </button>
        )}

        {saved && (
          <div className="w-full h-12 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-semibold flex items-center justify-center">
            ✓ Enregistré ! Retour au dashboard...
          </div>
        )}
      </div>
    </main>
  );
}

export default function CompetitionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-400">Chargement...</div>}>
      <CompetitionContent />
    </Suspense>
  );
}