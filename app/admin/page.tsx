"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const competitions = [
  { id: "keqiao-2026", name: 'Keqiao', flag: '🇨🇳' },
  { id: "berne-2026", name: 'Berne', flag: '🇨🇭' },
  { id: "madrid-2026", name: 'Madrid', flag: '🇪🇸' },
  { id: "prague-2026", name: 'Prague', flag: '🇨🇿' },
  { id: "innsbruck-2026", name: 'Innsbruck', flag: '🇦🇹' },
  { id: "saltlake-2026", name: 'Salt Lake City', flag: '🇺🇸' },
]

const worldRankings: Record<string, number> = {
  "Sorato ANRAKU": 1, "Mejdi SCHALCK": 2, "Dohyun LEE": 3, "Tomoa NARASAKI": 4,
  "Sohta AMAGASA": 5, "Meichi NARASAKI": 6, "Hannes VAN DUYSEN": 7, "Yufei PAN": 8,
  "Colin DUFFY": 9, "Dayan AKHTAR": 10, "Anze PEHARC": 11, "Paul JENFT": 12,
  "Jan-Luca POSCH": 13, "Jack MACDOUGALL": 14, "Toby ROBERTS": 16,
  "Thorben Perry BLOEM": 17, "Nikolay RUSEV": 18, "Samuel RICHARD": 19,
  "Maximillian MILNE": 22, "Oren PRIHED": 24, "Elias ARRIAGADA KRÜGER": 25,
  "Guillermo PEINADO FRANGANILLO": 29, "Jongwon CHON": 32, "Lasse VON FREIER": 36,
  "Benjamin HANNA": 37, "Adi BARK": 39, "Antoine GIRARD": 41, "Tomer YAKOBOVITCH": 41,
  "Ziqi XU": 43, "Dylan PARKS": 44, "Julien CLÉMENCE": 47, "Max BERTONE": 50,
  "Lucas TRANDAFIR": 51, "Luca BOLDRINI": 55, "Raffael GRUBER": 58,
  "Levin STRAUBHAAR": 59, "Matthew RODRIGUEZ": 61, "Ido FIDEL": 62,
  "Hugo DORVAL": 63, "Jiahao FU": 64, "Keita DOHI": 65, "Timotej ROMŠAK": 67,
  "Jinwei YAO": 68, "Bharath PEREIRA": 70, "Andreas HOFHERR": 74,
  "Junzhe HU": 75, "Xuanpu BAI": 76, "Hyunseung NOH": 80, "Rei KAWAMATA": 83,
  "Vail EVERETT": 85, "Campbell HARRISON": 93, "Chih-En FAN": 91,
  "Chia Hsiang LIN": 114, "Auswin AUEAREECHIT": 92, "Matteo REUSA": 49,
  "Oriane BERTONE": 1, "Annie SANDERS": 2, "Mao NAKAMURA": 3, "Erin MCNEICE": 4,
  "Melody SEKIKAWA": 5, "Miho NONAKA": 6, "Janja GARNBRET": 7, "Anon MATSUFUJI": 8,
  "Zélia AVEZOU": 9, "Camilla MORONI": 10, "Agathe CALLIET": 11,
  "Jennifer Eucharia BUCKLEY": 12, "Oceania MACKENZIE": 13, "Emma EDWARDS": 14,
  "Futaba ITO": 15, "Naïlé MEIGNAN": 16, "Chloe CAULIER": 17, "Chaehyun SEO": 18,
  "Lily ABRIAT": 20, "Melina COSTANZA": 23, "Yuetong ZHANG": 24, "Giorgia TESIO": 25,
  "Cloe COSCOY": 26, "Madison RICHARDSON": 28, "Afra HÖNIG": 31, "Nekaia SANDERS": 33,
  "Zoe PEETERMANS": 35, "Flora OBLASSER": 36, "Adriene Akiko CLARK": 37,
  "Stella GIACANI": 38, "Selma ELHADJ MIMOUNE": 40, "Lucija TARKUS": 41,
  "Lucile SAUREL": 42, "Maya STASIUK": 44, "Irina DAZIANO": 45,
  "Sandra LETTNER": 46, "Gayeong OH": 48, "Zhilu LUO": 50, "Lea KEMPF": 53,
  "Hannah MEUL": 80, "Heeju NOH": 81, "Yawen MI": 82, "Yajun HUANG": 83,
  "Natalia GROSSMAN": 61, "Ruby DANZIGER": 110, "Alma SAPIR HALEVI": 60,
}

type Profile = { id: string; username: string; avatar_url: string | null; hidden: boolean };
type Tab = "votes" | "resultats" | "joueurs" | "points";
type ScoringRule = { id: string; label: string; points: number };
type AthleteOverride = { id: string; competition_id: string; genre: string; athlete_name: string; points: number; note: string | null };
type ChosenProp = { username: string; athlete: string };

const defaultScoringRules: ScoringRule[] = [
  { id: "phase1_rank_1_10", label: "Phase 1 — Rang 1-10", points: 2 },
  { id: "phase1_rank_11_25", label: "Phase 1 — Rang 11-25", points: 4 },
  { id: "phase1_rank_26_50", label: "Phase 1 — Rang 26-50", points: 7 },
  { id: "phase1_rank_51_plus", label: "Phase 1 — Rang 51+", points: 12 },
  { id: "phase1_unranked", label: "Phase 1 — Non classé", points: 15 },
  { id: "phase2_exact_gold", label: "Phase 2 — Bon vainqueur", points: 5 },
  { id: "phase2_exact_silver", label: "Phase 2 — Bon 2ème", points: 3 },
  { id: "phase2_exact_bronze", label: "Phase 2 — Bon 3ème", points: 2 },
  { id: "phase2_on_podium_wrong_place", label: "Phase 2 — Sur le podium (mauvaise place)", points: 1 },
  { id: "phase2_bonus_rank_1_10", label: "Phase 2 bonus — Rang 1-10", points: 0 },
  { id: "phase2_bonus_rank_11_25", label: "Phase 2 bonus — Rang 11-25", points: 1 },
  { id: "phase2_bonus_rank_26_50", label: "Phase 2 bonus — Rang 26-50", points: 3 },
  { id: "phase2_bonus_rank_51_plus", label: "Phase 2 bonus — Rang 51+", points: 5 },
  { id: "phase2_bonus_unranked", label: "Phase 2 bonus — Non classé", points: 7 },
];

function getRulePoints(ruleMap: Map<string, number>, key: string, fallback: number) {
  return ruleMap.has(key) ? (ruleMap.get(key) as number) : fallback;
}

function getRankingBonusFromRules(rank: number, ruleMap: Map<string, number>, phase: "phase1" | "phase2_bonus") {
  const keys = phase === "phase1"
    ? { top10: "phase1_rank_1_10", top25: "phase1_rank_11_25", top50: "phase1_rank_26_50", other: "phase1_rank_51_plus", unranked: "phase1_unranked" }
    : { top10: "phase2_bonus_rank_1_10", top25: "phase2_bonus_rank_11_25", top50: "phase2_bonus_rank_26_50", other: "phase2_bonus_rank_51_plus", unranked: "phase2_bonus_unranked" };
  if (!rank || rank >= 999) return getRulePoints(ruleMap, keys.unranked, 0);
  if (rank <= 10) return getRulePoints(ruleMap, keys.top10, 0);
  if (rank <= 25) return getRulePoints(ruleMap, keys.top25, 0);
  if (rank <= 50) return getRulePoints(ruleMap, keys.top50, 0);
  return getRulePoints(ruleMap, keys.other, 0);
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("votes");
  const [selectedComp, setSelectedComp] = useState("keqiao-2026");
  const [selectedGenre, setSelectedGenre] = useState("hommes");
  const [finalistes, setFinalistes] = useState(["","","","","","","",""]);
  const [podium, setPodium] = useState({ gold: "", silver: "", bronze: "" });
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [voters, setVoters] = useState<{ p1: string[]; p2: string[]; chosen: ChosenProp[] }>({ p1: [], p2: [], chosen: [] });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [compStatuses, setCompStatuses] = useState<Record<string, boolean>>({});
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(defaultScoringRules);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [overrides, setOverrides] = useState<AthleteOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [overrideAthlete, setOverrideAthlete] = useState("");
  const [overridePoints, setOverridePoints] = useState(0);
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", data.session.user.id).single();
      if (!profile?.is_admin) { router.push("/dashboard"); return; }
      const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url, hidden");
      setProfiles(profs || []);
      const { data: statuses } = await supabase.from("competition_status").select("competition_id, open");
      const statusMap: Record<string, boolean> = {};
      statuses?.forEach(s => { statusMap[s.competition_id] = s.open; });
      setCompStatuses(statusMap);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (loading) return;
    loadResultats();
    loadVoters();
  }, [selectedComp, selectedGenre, loading]);

  useEffect(() => {
    if (loading || tab !== "points") return;
    loadScoringRules();
  }, [loading, tab]);

  useEffect(() => {
    if (loading || tab !== "points") return;
    loadOverrides();
  }, [loading, tab, selectedComp, selectedGenre]);

  const loadResultats = async () => {
    const { data } = await supabase.from("resultats_officiels").select("*")
      .eq("competition_id", selectedComp).eq("genre", selectedGenre).single();
    if (data) {
      setFinalistes([data.rank1||"",data.rank2||"",data.rank3||"",data.rank4||"",data.rank5||"",data.rank6||"",data.rank7||"",data.rank8||""]);
      setPodium({ gold: data.podium_gold||"", silver: data.podium_silver||"", bronze: data.podium_bronze||"" });
    } else {
      setFinalistes(["","","","","","","",""]);
      setPodium({ gold: "", silver: "", bronze: "" });
    }
  };

  const loadVoters = async () => {
    const { data: p1 } = await supabase.from("picks_phase1_temp").select("user_id").eq("competition_id", `${selectedComp}-${selectedGenre}`);
    const { data: p2 } = await supabase.from("picks_phase2_temp").select("user_id").eq("competition_id", `${selectedComp}-${selectedGenre}`);
    const p1Ids = [...new Set(p1?.map(p => p.user_id) || [])];
    const p2Ids = [...new Set(p2?.map(p => p.user_id) || [])];
    const getName = (id: string) => profiles.find(p => p.id === id)?.username || id.substring(0, 8);
    const { data: chosenProps } = await supabase.from("chosen_one_proposals").select("user_id, athlete_name").eq("competition_id", selectedComp);
    const chosenList: ChosenProp[] = (chosenProps || []).map(p => ({
      username: profiles.find(pr => pr.id === p.user_id)?.username || "?",
      athlete: p.athlete_name,
    }));
    setVoters({ p1: p1Ids.map(getName), p2: p2Ids.map(getName), chosen: chosenList });
  };

  const saveFinalistes = async () => {
    setSaving(true);
    await supabase.from("resultats_officiels").upsert({
      competition_id: selectedComp, genre: selectedGenre,
      rank1: finalistes[0], rank2: finalistes[1], rank3: finalistes[2],
      rank4: finalistes[3], rank5: finalistes[4], rank6: finalistes[5],
      rank7: finalistes[6], rank8: finalistes[7],
      podium_gold: podium.gold, podium_silver: podium.silver, podium_bronze: podium.bronze,
    }, { onConflict: "competition_id,genre" });
    setSaving(false);
    setMessage("✓ Résultats sauvegardés !");
    setTimeout(() => setMessage(null), 3000);
  };

  const calculateScores = async () => {
    setCalculating(true);
    setMessage("Calcul en cours...");
    try {
      const top8 = finalistes.filter(f => f.trim() !== "");
      const competitionGenreId = `${selectedComp}-${selectedGenre}`;
      const { data: rulesData } = await supabase.from("scoring_rules").select("id, points");
      const ruleMap = new Map<string, number>();
      defaultScoringRules.forEach(r => ruleMap.set(r.id, r.points));
      rulesData?.forEach((r: { id: string; points: number }) => ruleMap.set(r.id, Number(r.points) || 0));
      const { data: overrideRows } = await supabase.from("athlete_point_overrides").select("athlete_name, points").eq("competition_id", selectedComp).eq("genre", selectedGenre);
      const overrideMap = new Map<string, number>();
      overrideRows?.forEach((o: { athlete_name: string; points: number }) => overrideMap.set(o.athlete_name, Number(o.points) || 0));
      const { data: allPicks1 } = await supabase.from("picks_phase1_temp").select("user_id, athlete_name").eq("competition_id", competitionGenreId);
      const { data: allPicks2 } = await supabase.from("picks_phase2_temp").select("user_id, gold_athlete, silver_athlete, bronze_athlete").eq("competition_id", competitionGenreId);
      const userIds = [...new Set([...(allPicks1?.map(p => p.user_id) || []), ...(allPicks2?.map(p => p.user_id) || [])])];
      for (const userId of userIds) {
        const userPicks1 = allPicks1?.filter(p => p.user_id === userId).map(p => p.athlete_name) || [];
        const userPick2 = allPicks2?.find(p => p.user_id === userId);
        let phase1 = 0;
        for (const pick of userPicks1) {
          if (!top8.includes(pick)) continue;
          phase1 += overrideMap.has(pick) ? (overrideMap.get(pick) as number) : getRankingBonusFromRules(worldRankings[pick] || 999, ruleMap, "phase1");
        }
        let phase2 = 0;
        const wrongPlacePts = getRulePoints(ruleMap, "phase2_on_podium_wrong_place", 1);
        if (userPick2 && podium.gold && podium.silver && podium.bronze) {
          if (userPick2.gold_athlete === podium.gold) {
            phase2 += getRulePoints(ruleMap, "phase2_exact_gold", 5) + (overrideMap.has(podium.gold) ? (overrideMap.get(podium.gold) as number) : getRankingBonusFromRules(worldRankings[podium.gold] || 999, ruleMap, "phase2_bonus"));
          } else if ([podium.gold, podium.silver, podium.bronze].includes(userPick2.gold_athlete)) phase2 += wrongPlacePts;
          if (userPick2.silver_athlete === podium.silver) {
            phase2 += getRulePoints(ruleMap, "phase2_exact_silver", 3) + (overrideMap.has(podium.silver) ? (overrideMap.get(podium.silver) as number) : getRankingBonusFromRules(worldRankings[podium.silver] || 999, ruleMap, "phase2_bonus"));
          } else if ([podium.gold, podium.silver, podium.bronze].includes(userPick2.silver_athlete)) phase2 += wrongPlacePts;
          if (userPick2.bronze_athlete === podium.bronze) {
            phase2 += getRulePoints(ruleMap, "phase2_exact_bronze", 2) + (overrideMap.has(podium.bronze) ? (overrideMap.get(podium.bronze) as number) : getRankingBonusFromRules(worldRankings[podium.bronze] || 999, ruleMap, "phase2_bonus"));
          } else if ([podium.gold, podium.silver, podium.bronze].includes(userPick2.bronze_athlete)) phase2 += wrongPlacePts;
        }
        await supabase.from("scores").upsert({ user_id: userId, competition_id: selectedComp, genre: selectedGenre, phase1_points: phase1, phase2_points: phase2, total_points: phase1 + phase2 }, { onConflict: "user_id,competition_id,genre" });
      }
      setMessage(`✓ Scores calculés pour ${userIds.length} joueurs !`);
    } finally {
      setCalculating(false);
    }
  };

  const resetScores = async () => {
    if (!confirm("Réinitialiser TOUS les scores ? Cette action est irréversible.")) return;
    await supabase.from("scores").delete().eq("competition_id", selectedComp);
    setMessage("✓ Scores réinitialisés !");
  };

  const toggleHidden = async (userId: string, hidden: boolean) => {
    await supabase.from("profiles").update({ hidden: !hidden }).eq("id", userId);
    setProfiles(profiles.map(p => p.id === userId ? { ...p, hidden: !hidden } : p));
  };

  const toggleCompStatus = async (compId: string) => {
    const current = compStatuses[compId] ?? false;
    await supabase.from("competition_status").upsert({ competition_id: compId, open: !current }, { onConflict: "competition_id" });
    setCompStatuses({ ...compStatuses, [compId]: !current });
  };

  const loadScoringRules = async () => {
    setRulesLoading(true);
    const { data } = await supabase.from("scoring_rules").select("id, points");
    if (!data || data.length === 0) { setScoringRules(defaultScoringRules); setRulesLoading(false); return; }
    const dbMap = new Map<string, number>();
    data.forEach((r: { id: string; points: number }) => dbMap.set(r.id, Number(r.points) || 0));
    setScoringRules(defaultScoringRules.map(rule => ({ ...rule, points: dbMap.has(rule.id) ? (dbMap.get(rule.id) as number) : rule.points })));
    setRulesLoading(false);
  };

  const saveScoringRules = async () => {
    setRulesSaving(true);
    const { error } = await supabase.from("scoring_rules").upsert(scoringRules.map(r => ({ id: r.id, label: r.label, points: Number(r.points) || 0 })), { onConflict: "id" });
    setRulesSaving(false);
    if (error) { setMessage(`Erreur: ${error.message}`); return; }
    setMessage("✓ Règles sauvegardées !");
    setTimeout(() => setMessage(null), 3000);
  };

  const loadOverrides = async () => {
    setOverridesLoading(true);
    const { data } = await supabase.from("athlete_point_overrides").select("id, competition_id, genre, athlete_name, points, note").eq("competition_id", selectedComp).eq("genre", selectedGenre).order("athlete_name", { ascending: true });
    setOverrides((data || []) as AthleteOverride[]);
    setOverridesLoading(false);
  };

  const addOverride = async () => {
    const athleteName = overrideAthlete.trim();
    if (!athleteName) return;
    setOverrideSaving(true);
    const { error } = await supabase.from("athlete_point_overrides").insert({ competition_id: selectedComp, genre: selectedGenre, athlete_name: athleteName, points: Number(overridePoints) || 0, note: overrideNote.trim() || null });
    setOverrideSaving(false);
    if (error) { setMessage(`Erreur: ${error.message}`); return; }
    setOverrideAthlete(""); setOverridePoints(0); setOverrideNote("");
    await loadOverrides();
    setMessage("✓ Ajustement ajouté !");
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteOverride = async (id: string) => {
    const { error } = await supabase.from("athlete_point_overrides").delete().eq("id", id);
    if (error) { setMessage(`Erreur: ${error.message}`); return; }
    setOverrides(overrides.filter(o => o.id !== id));
    setMessage("✓ Supprimé !");
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "votes", label: "Votes" },
    { id: "resultats", label: "Résultats" },
    { id: "joueurs", label: "Joueurs" },
    { id: "points", label: "Points" },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">← Retour</button>
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Administration</p>
          <h1 className="text-2xl font-semibold">Panel Admin</h1>
        </div>
        {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">{message}</div>}
        <div className="flex gap-2 mb-8 border-b border-gray-100 pb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${tab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "votes" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {competitions.map(c => (
                <button key={c.id} onClick={() => setSelectedComp(c.id)}
                  className={`text-sm font-medium rounded-full px-3 py-1.5 transition ${selectedComp === c.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {c.flag} {c.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              {["hommes", "femmes"].map(g => (
                <button key={g} onClick={() => setSelectedGenre(g)}
                  className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${selectedGenre === g ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500"}`}>
                  {g === "hommes" ? "Hommes" : "Femmes"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Phase 1 — {voters.p1.length} joueurs</p>
                {voters.p1.length === 0 ? <p className="text-gray-300 text-sm">Aucun vote</p> : voters.p1.map(name => (
                  <div key={name} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-green-500 text-xs">✓</span>
                    <span className="text-sm font-medium text-gray-900">{name}</span>
                  </div>
                ))}
              </div>
              <div className="border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Phase 2 — {voters.p2.length} joueurs</p>
                {voters.p2.length === 0 ? <p className="text-gray-300 text-sm">Aucun vote</p> : voters.p2.map(name => (
                  <div key={name} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-amber-500 text-xs">✓</span>
                    <span className="text-sm font-medium text-gray-900">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">⭐ Chosen One — {voters.chosen.length} propositions</p>
              {voters.chosen.length === 0 ? (
                <p className="text-gray-300 text-sm">Aucune proposition</p>
              ) : voters.chosen.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-gray-900">{p.username}</span>
                  <span className="text-sm text-gray-500">{p.athlete}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "resultats" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {competitions.map(c => (
                <button key={c.id} onClick={() => setSelectedComp(c.id)}
                  className={`text-sm font-medium rounded-full px-3 py-1.5 transition ${selectedComp === c.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {c.flag} {c.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              {["hommes", "femmes"].map(g => (
                <button key={g} onClick={() => setSelectedGenre(g)}
                  className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${selectedGenre === g ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500"}`}>
                  {g === "hommes" ? "Hommes" : "Femmes"}
                </button>
              ))}
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-4">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Top 8 finalistes</p>
              </div>
              <div className="p-5 grid gap-3">
                {finalistes.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                    <input type="text" value={f} placeholder={`Finaliste ${i + 1}`}
                      onChange={e => { const n = [...finalistes]; n[i] = e.target.value; setFinalistes(n); }}
                      className="flex-1 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 transition"/>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-4">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Podium officiel</p>
              </div>
              <div className="p-5 grid gap-3">
                {[{ label: "🥇 Vainqueur", key: "gold" }, { label: "🥈 2ème", key: "silver" }, { label: "🥉 3ème", key: "bronze" }].map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm w-24">{label}</span>
                    <input type="text" value={podium[key as keyof typeof podium]} placeholder="Nom"
                      onChange={e => setPodium({ ...podium, [key]: e.target.value })}
                      className="flex-1 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 transition"/>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={saveFinalistes} disabled={saving}
              className="w-full h-11 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition mb-3 disabled:opacity-60">
              {saving ? "Sauvegarde..." : "Sauvegarder tout"}
            </button>
            <button onClick={calculateScores} disabled={calculating}
              className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition mb-3 disabled:opacity-60">
              {calculating ? "Calcul en cours..." : "Calculer les scores →"}
            </button>
            <button onClick={resetScores}
              className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-semibold transition">
              Réinitialiser les scores
            </button>
          </div>
        )}

        {tab === "joueurs" && (
          <div>
            <p className="text-sm text-gray-400 mb-6">Les joueurs masqués ne figurent pas dans le classement.</p>
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ouverture des votes par étape</p>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {competitions.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-medium text-gray-900">{c.flag} {c.name}</span>
                    <button onClick={() => toggleCompStatus(c.id)}
                      className={`text-xs font-semibold rounded-full px-4 py-1.5 transition ${compStatuses[c.id] ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                      {compStatuses[c.id] ? "✓ Ouvert" : "Fermé"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Joueurs inscrits</p>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="avatar" className="w-8 h-8 rounded-lg object-cover"/>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm">🧗</div>
                  )}
                  <span className={`flex-1 text-sm font-semibold ${p.hidden ? "text-gray-300" : "text-gray-900"}`}>{p.username}</span>
                  <button onClick={() => toggleHidden(p.id, p.hidden)}
                    className={`text-xs font-semibold rounded-full px-3 py-1.5 transition ${p.hidden ? "bg-gray-100 text-gray-400 border border-gray-200" : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"}`}>
                    {p.hidden ? "Afficher" : "Masquer"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "points" && (
          <div className="space-y-6">
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Règles de scoring</p>
              {rulesLoading ? <p className="text-sm text-gray-400">Chargement...</p> : (
                <div className="space-y-3">
                  {scoringRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between gap-4">
                      <label className="text-sm text-gray-700">{rule.label}</label>
                      <input type="number" value={rule.points}
                        onChange={e => {
                          const next = [...scoringRules];
                          const idx = next.findIndex(r => r.id === rule.id);
                          next[idx] = { ...next[idx], points: Number(e.target.value) || 0 };
                          setScoringRules(next);
                        }}
                        className="w-24 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 transition"/>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={saveScoringRules} disabled={rulesSaving || rulesLoading}
                className="mt-5 h-11 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition px-4 disabled:opacity-60">
                {rulesSaving ? "Sauvegarde..." : "Sauvegarder les règles"}
              </button>
            </div>
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ajustements individuels</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {competitions.map(c => (
                  <button key={`pts-${c.id}`} onClick={() => setSelectedComp(c.id)}
                    className={`text-sm font-medium rounded-full px-3 py-1.5 transition ${selectedComp === c.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    {c.flag} {c.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                {["hommes", "femmes"].map(g => (
                  <button key={`pts-${g}`} onClick={() => setSelectedGenre(g)}
                    className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${selectedGenre === g ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500"}`}>
                    {g === "hommes" ? "Hommes" : "Femmes"}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 mb-5">
                <input type="text" value={overrideAthlete} onChange={e => setOverrideAthlete(e.target.value)} placeholder="Nom de l'athlète"
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 transition"/>
                <div className="flex gap-3">
                  <input type="number" value={overridePoints} onChange={e => setOverridePoints(Number(e.target.value) || 0)}
                    className="w-24 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 transition"/>
                  <input type="text" value={overrideNote} onChange={e => setOverrideNote(e.target.value)} placeholder="Note (optionnelle)"
                    className="flex-1 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 transition"/>
                  <button onClick={addOverride} disabled={overrideSaving}
                    className="h-10 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition px-4 disabled:opacity-60">
                    {overrideSaving ? "..." : "Ajouter"}
                  </button>
                </div>
              </div>
              {overridesLoading ? <p className="text-sm text-gray-400">Chargement...</p> :
                overrides.length === 0 ? <p className="text-sm text-gray-400">Aucun ajustement.</p> : (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                    {overrides.map(o => (
                      <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{o.athlete_name}</p>
                          <p className="text-xs text-gray-400">{o.points} pts{o.note ? ` · ${o.note}` : ""}</p>
                        </div>
                        <button onClick={() => deleteOverride(o.id)}
                          className="text-xs font-semibold rounded-full px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
