"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const competitions = [
  { id: "keqiao-2026", name: 'Keqiao', flag: '🇨🇳' },
  { id: "berne-2026", name: 'Berne', flag: '🇨🇭' },
  { id: "madrid-2026", name: 'Madrid', flag: '🇪🇸' },
  { id: "prague-2026", name: 'Prague', flag: '🇨🇿' },
  { id: "innsbruck-2026", name: 'Innsbruck', flag: '🇦🇹' },
  { id: "saltlake-2026", name: 'Salt Lake City', flag: '🇺🇸' },
]

function ChosenOneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedComp, setSelectedComp] = useState(searchParams.get("competition") || "keqiao-2026");
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [proposal, setProposal] = useState("");
  const [myProposal, setMyProposal] = useState<string | null>(null);
  const [allProposals, setAllProposals] = useState<{ athlete_name: string; username: string }[]>([]);
  const [chosenOne, setChosenOne] = useState<{ athlete_name: string; proposed_by_username: string } | null>(null);
  const [predictedRank, setPredictedRank] = useState<number | null>(null);
  const [myPick, setMyPick] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      setUserId(data.session.user.id);

      const { data: profile } = await supabase
        .from("profiles").select("username").eq("id", data.session.user.id).single();
      setUsername(profile?.username || "");
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId, selectedComp]);

  const loadData = async () => {
    // Ma proposition
    const { data: myProp } = await supabase
      .from("chosen_one_proposals")
      .select("athlete_name")
      .eq("competition_id", selectedComp)
      .eq("user_id", userId)
      .single();
    setMyProposal(myProp?.athlete_name || null);

    // L'élu
    const { data: chosen } = await supabase
      .from("chosen_one")
      .select("athlete_name, proposed_by")
      .eq("competition_id", selectedComp)
      .single();

    if (chosen) {
      const { data: proposerProfile } = await supabase
        .from("profiles").select("username").eq("id", chosen.proposed_by).single();
      setChosenOne({
        athlete_name: chosen.athlete_name,
        proposed_by_username: proposerProfile?.username || "Inconnu",
      });

      // Toutes les propositions (visibles après révélation)
      const { data: props } = await supabase
        .from("chosen_one_proposals")
        .select("athlete_name, user_id")
        .eq("competition_id", selectedComp);

      const enriched = await Promise.all((props || []).map(async p => {
        const { data: prof } = await supabase.from("profiles").select("username").eq("id", p.user_id).single();
        return { athlete_name: p.athlete_name, username: prof?.username || "?" };
      }));
      setAllProposals(enriched);

      // Mon pronostic de rang
      const { data: myPickData } = await supabase
        .from("chosen_one_picks")
        .select("predicted_rank")
        .eq("competition_id", selectedComp)
        .eq("user_id", userId)
        .single();
      setMyPick(myPickData?.predicted_rank || null);
    }
  };

  const submitProposal = async () => {
    if (!userId || !proposal.trim()) return;
    setSaving(true);
    await supabase.from("chosen_one_proposals").upsert({
      competition_id: selectedComp,
      user_id: userId,
      athlete_name: proposal.trim(),
    }, { onConflict: "competition_id,user_id" });
    setMyProposal(proposal.trim());
    setSaving(false);
    setMessage("✓ Proposition enregistrée !");
    setTimeout(() => setMessage(null), 3000);
  };

  const submitPick = async () => {
    if (!userId || !predictedRank) return;
    setSaving(true);
    await supabase.from("chosen_one_picks").upsert({
      competition_id: selectedComp,
      user_id: userId,
      predicted_rank: predictedRank,
    }, { onConflict: "competition_id,user_id" });
    setMyPick(predictedRank);
    setSaving(false);
    setMessage("✓ Pronostic enregistré !");
    setTimeout(() => setMessage(null), 3000);
  };

  const comp = competitions.find(c => c.id === selectedComp);

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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Mini-jeu</p>
          <h1 className="text-2xl font-semibold">⭐ The Chosen One</h1>
          <p className="text-sm text-gray-400 mt-1">Propose un athlète · Pronostique son rang en qualifs</p>
        </div>

        {/* Sélecteur compétition */}
        <div className="flex flex-wrap gap-2 mb-8">
          {competitions.map(c => (
            <button key={c.id} onClick={() => setSelectedComp(c.id)}
              className={`text-sm font-medium rounded-full px-3 py-1.5 transition ${
                selectedComp === c.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            {message}
          </div>
        )}

        {/* L'Élu révélé */}
        {chosenOne ? (
          <div className="border-2 border-amber-200 bg-amber-50 rounded-2xl p-6 mb-8 text-center">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">⭐ L'Élu de {comp?.name}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{chosenOne.athlete_name}</p>
            <p className="text-sm text-amber-600">Proposé par <span className="font-semibold">{chosenOne.proposed_by_username}</span></p>

            {/* Mon pronostic de rang */}
            <div className="mt-6 pt-6 border-t border-amber-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Ta prédiction de rang en qualifs</p>
              {myPick ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">#{myPick}</span>
                  <button onClick={() => setMyPick(null)}
                    className="text-xs text-gray-400 hover:text-gray-900 border border-gray-200 rounded-full px-3 py-1">
                    Modifier
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 justify-center">
                  <input type="number" min="1" max="200" placeholder="Ex: 12"
                    value={predictedRank || ""}
                    onChange={e => setPredictedRank(parseInt(e.target.value))}
                    className="w-24 h-10 rounded-xl border border-gray-200 px-3 text-sm text-center outline-none focus:border-gray-400"/>
                  <button onClick={submitPick} disabled={saving || !predictedRank}
                    className="h-10 bg-amber-500 hover:bg-amber-400 text-white rounded-xl px-4 text-sm font-semibold disabled:opacity-60 transition">
                    Valider
                  </button>
                </div>
              )}
            </div>

            {/* Toutes les propositions */}
            {allProposals.length > 0 && (
              <div className="mt-6 pt-6 border-t border-amber-200 text-left">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Toutes les propositions</p>
                <div className="space-y-2">
                  {allProposals.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{p.username}</span>
                      <span className={`text-sm font-semibold ${p.athlete_name === chosenOne.athlete_name ? "text-amber-600" : "text-gray-400"}`}>
                        {p.athlete_name} {p.athlete_name === chosenOne.athlete_name ? "⭐" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Phase de proposition */
          <div className="border border-gray-100 rounded-2xl p-6 mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Phase 1 — Propose un athlète</p>
            <p className="text-sm text-gray-500 mb-6">L'élu sera tiré au sort parmi toutes les propositions, 24h avant les qualifs.</p>

            {myProposal ? (
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Ta proposition</p>
                <p className="text-xl font-bold text-gray-900 mb-4">{myProposal}</p>
                <button onClick={() => setMyProposal(null)}
                  className="text-xs text-gray-400 hover:text-gray-900 border border-gray-200 rounded-full px-3 py-1.5 transition">
                  ✏️ Modifier
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input type="text" placeholder="Nom de l'athlète..." value={proposal}
                  onChange={e => setProposal(e.target.value)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 transition"/>
                <button onClick={submitProposal} disabled={saving || !proposal.trim()}
                  className="h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl px-5 text-sm font-semibold disabled:opacity-60 transition">
                  Proposer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Règles */}
        <div className="border border-gray-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Comment ça marche</p>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Chaque joueur propose un athlète avant les qualifs</p>
            <p>2. L'élu est tiré au sort parmi toutes les propositions, 24h avant</p>
            <p>3. Tu dois prédire son rang exact en qualification</p>
            <p>4. Plus tu es précis, plus tu marques de points</p>
            <p>5. Bonus si l'athlète est peu connu (classement mondial bas)</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ChosenOnePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Chargement...</div>}>
      <ChosenOneContent />
    </Suspense>
  );
}
