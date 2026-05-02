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
type Tab = "votes" | "resultats" | "joueurs" | "points" | "chosen";
type ScoringRule = { id: string; label: string; points: number };
type AthleteOverride = { id: string; competition_id: string; genre: string; athlete_name: string; point_override: number; note: string | null };
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

function ChosenOneStatus({ compId, supabase, onReset }: { compId: string; supabase: any; onReset: () => void }) {
  const [current, setCurrent] = useState<{ athlete_name: string; revealed_at: string } | null>(null);

  useEffect(() => {
    supabase.from("chosen_one").select("athlete_name, revealed_at").eq("competition_id", compId).maybeSingle()
      .then(({ data }: any) => setCurrent(data));
  }, [compId]);

  return (
    <div className={`rounded-2xl p-5 mb-4 ${current ? "bg-amber-50 border border-amber-200" : "border border-gray-100"}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Élu actuel</p>
      {current ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-amber-700">⭐ {current.athlete_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">Tiré le {new Date(current.revealed_at).toLocaleDateString("fr-FR")}</p>
          </div>
          <button onClick={onReset}
            className="text-xs font-semibold rounded-full px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
            🔄 Réinitialiser
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Aucun élu pour cette étape.</p>
      )}
    </div>
  );
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
  const [voters, setVoters] = useState<{ 
    p1: { username: string; picks: string[] }[]
    p2: { username: string; gold: string; silver: string; bronze: string }[]
    chosen: ChosenProp[] 
  }>({ p1: [], p2: [], chosen: [] });  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [compStatuses, setCompStatuses] = useState<Record<string, { open: boolean; phase1_open: boolean; phase2_open: boolean }>>({});
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(defaultScoringRules);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [overrides, setOverrides] = useState<AthleteOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [overrideAthlete, setOverrideAthlete] = useState("");
  const [overridePoints, setOverridePoints] = useState(0);
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncRegStatus, setSyncRegStatus] = useState<Record<string, string>>({})
  const [syncingReg, setSyncingReg] = useState<string | null>(null)
  const [syncingDemis, setSyncingDemis] = useState<string | null>(null)
const [syncDemisStatus, setSyncDemisStatus] = useState<Record<string, string>>({})



  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", data.session.user.id).single();
      if (!profile?.is_admin) { router.push("/dashboard"); return; }
      const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url, hidden");
      setProfiles(profs || []);
      const { data: statuses } = await supabase.from("competition_status").select("competition_id, open, phase1_open, phase2_open");
      const statusMap: Record<string, { open: boolean; phase1_open: boolean; phase2_open: boolean }> = {};
      statuses?.forEach(s => { statusMap[s.competition_id] = { open: s.open ?? false, phase1_open: s.phase1_open ?? true, phase2_open: s.phase2_open ?? true }; });
      setCompStatuses(statusMap);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (loading) return;
    loadResultats();
    loadVoters();
  }, [selectedComp, selectedGenre, loading, tab]);

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
    const { data: p1 } = await supabase.from("picks_phase1_temp").select("user_id, athlete_name").eq("competition_id", `${selectedComp}-${selectedGenre}`);
    const { data: p2 } = await supabase.from("picks_phase2_temp").select("user_id, gold_athlete, silver_athlete, bronze_athlete").eq("competition_id", `${selectedComp}-${selectedGenre}`);
    const { data: chosenProps } = await supabase.from("chosen_one_proposals").select("user_id, athlete_name").eq("competition_id", selectedComp);
    const { data: freshProfiles } = await supabase.from("profiles").select("id, username");
    const getName = (id: string) => freshProfiles?.find(p => p.id === id)?.username || id.substring(0, 8);

    const p1ByUser: Record<string, string[]> = {};
    p1?.forEach(p => {
      if (!p1ByUser[p.user_id]) p1ByUser[p.user_id] = [];
      p1ByUser[p.user_id].push(p.athlete_name);
    });

    const p1List = Object.entries(p1ByUser).map(([uid, picks]) => ({ username: getName(uid), picks }));
    const p2List = (p2 || []).map(p => ({ username: getName(p.user_id), gold: p.gold_athlete, silver: p.silver_athlete, bronze: p.bronze_athlete }));
    const chosenList = (chosenProps || []).map(p => ({ username: getName(p.user_id), athlete: p.athlete_name }));

    setVoters({ p1: p1List, p2: p2List, chosen: chosenList });
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
      const { data: overrideRows } = await supabase.from("athlete_point_overrides").select("athlete_name, point_override").eq("competition_id", selectedComp).eq("genre", selectedGenre);
      const overrideMap = new Map<string, number>();
      overrideRows?.forEach((o: { athlete_name: string; point_override: number }) => overrideMap.set(o.athlete_name, Number(o.point_override) || 0));      const { data: allPicks1 } = await supabase.from("picks_phase1_temp").select("user_id, athlete_name").eq("competition_id", competitionGenreId);
      const { data: allPicks2 } = await supabase.from("picks_phase2_temp").select("user_id, gold_athlete, silver_athlete, bronze_athlete").eq("competition_id", competitionGenreId);
      const { data: activeProfiles } = await supabase.from("profiles").select("id");
      const activeIds = new Set(activeProfiles?.map(p => p.id) || []);
      const userIds = [...new Set([...(allPicks1?.map(p => p.user_id) || []), ...(allPicks2?.map(p => p.user_id) || [])])].filter(id => activeIds.has(id));
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

  const deleteProfile = async (userId: string, username: string) => {
    if (!confirm(`Supprimer définitivement "${username}" ?`)) return;
    await supabase.from("picks_phase1_temp").delete().eq("user_id", userId);
    await supabase.from("picks_phase2_temp").delete().eq("user_id", userId);
    await supabase.from("scores").delete().eq("user_id", userId);
    await supabase.from("chosen_one_picks").delete().eq("user_id", userId);
    await supabase.from("chosen_one_proposals").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    setMessage(`✓ Compte "${username}" supprimé.`);
    setTimeout(() => setMessage(null), 3000);
  };


  const toggleCompStatus = async (compId: string, field: "open" | "phase1_open" | "phase2_open") => {
    const current = compStatuses[compId] ?? { open: false, phase1_open: true, phase2_open: true };
    const next = { ...current, [field]: !current[field] };
    await supabase.from("competition_status").upsert({ competition_id: compId, ...next }, { onConflict: "competition_id" });
    setCompStatuses({ ...compStatuses, [compId]: next });
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
    const { data } = await supabase.from("athlete_point_overrides").select("id, competition_id, genre, athlete_name, point_override, note").eq("competition_id", selectedComp).eq("genre", selectedGenre).order("athlete_name", { ascending: true });
    setOverrides((data || []) as AthleteOverride[]);
    setOverridesLoading(false);
  };
  const addOverride = async () => {
    const athleteName = overrideAthlete.trim();
    if (!athleteName) return;
    setOverrideSaving(true);
    const { error } = await supabase.from("athlete_point_overrides").insert({ competition_id: selectedComp, genre: selectedGenre, athlete_name: athleteName, point_override: Number(overridePoints) || 0, note: overrideNote.trim() || null });
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

  const syncFromIFSC = async (competitionId: string, genre: 'hommes' | 'femmes', mode: 'semis' | 'finale') => {
    const key = `${competitionId}-${genre}-${mode}`
    setSyncing(key)
    setSyncStatus(prev => ({ ...prev, [key]: '⏳ Synchronisation...' }))
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch('/api/sync-ifsc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'sync-results', competitionId, genre, mode }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncStatus(prev => ({ ...prev, [key]: `✅ ${data.message}` }))
        await loadResultats()
      } else {
        setSyncStatus(prev => ({ ...prev, [key]: `❌ ${data.error}` }))
      }
    } catch {
      setSyncStatus(prev => ({ ...prev, [key]: '❌ Erreur réseau' }))
    } finally {
      setSyncing(null)
    }
  };

  const syncRegistrations = async (competitionId: string) => {
    setSyncingReg(competitionId)
    setSyncRegStatus(prev => ({ ...prev, [competitionId]: '⏳ Synchronisation...' }))
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch('/api/sync-ifsc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'sync-registrations', competitionId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncRegStatus(prev => ({ ...prev, [competitionId]: `✅ ${data.message}` }))
      } else {
        setSyncRegStatus(prev => ({ ...prev, [competitionId]: `❌ ${data.error}` }))
      }
    } catch {
      setSyncRegStatus(prev => ({ ...prev, [competitionId]: '❌ Erreur réseau' }))
    } finally {
      setSyncingReg(null)
    }
  };

  const syncDemis = async (competitionId: string) => {
    setSyncingDemis(competitionId)
    setSyncDemisStatus(prev => ({ ...prev, [competitionId]: '⏳ Synchronisation...' }))
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch('/api/sync-ifsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'sync-demis', competitionId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncDemisStatus(prev => ({ ...prev, [competitionId]: `✅ ${data.message}` }))
      } else {
        setSyncDemisStatus(prev => ({ ...prev, [competitionId]: `❌ ${data.error}` }))
      }
    } catch {
      setSyncDemisStatus(prev => ({ ...prev, [competitionId]: '❌ Erreur réseau' }))
    } finally {
      setSyncingDemis(null)
    }
  }

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
    { id: "chosen", label: "⭐ Chosen One" },
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
            <button onClick={loadVoters} className="w-full h-10 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium transition mb-4">
              🔄 Rafraîchir les votes
            </button>
            <div className="space-y-4 mb-4">
  <div className="border border-gray-100 rounded-2xl p-5">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      Phase 1 — {voters.p1.length} joueurs
    </p>
    {voters.p1.length === 0 ? (
      <p className="text-gray-300 text-sm">Aucun vote</p>
    ) : voters.p1.map(({ username, picks }) => (
      <div key={username} className="py-3 border-b border-gray-50 last:border-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-900">{username}</span>
          <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${
            picks.length === 8
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {picks.length}/8 picks
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {picks.map(p => (
            <span key={p} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{p}</span>
          ))}
        </div>
      </div>
    ))}
  </div>
  <div className="border border-gray-100 rounded-2xl p-5">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      Phase 2 — {voters.p2.length} joueurs
    </p>
    {voters.p2.length === 0 ? (
      <p className="text-gray-300 text-sm">Aucun vote</p>
    ) : voters.p2.map(({ username, gold, silver, bronze }) => (
      <div key={username} className="py-3 border-b border-gray-50 last:border-0">
        <span className="text-sm font-semibold text-gray-900 block mb-1">{username}</span>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">🥇 {gold}</span>
          <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">🥈 {silver}</span>
          <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5">🥉 {bronze}</span>
        </div>
      </div>
    ))}
  </div>
</div>
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">⭐ Chosen One — {voters.chosen.length} propositions</p>
              {voters.chosen.length === 0 ? <p className="text-gray-300 text-sm">Aucune proposition</p> : voters.chosen.map((p, i) => (
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

    {/* === BLOC SYNC RÉSULTATS === */}
    <div className="border border-blue-100 bg-blue-50 rounded-2xl p-5 mb-4">
      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
        🔄 Sync résultats depuis IFSC
      </p>
      {(['hommes', 'femmes'] as const).map(genre => (
        <div key={genre} className="mb-4">
          <p className="text-xs font-medium text-blue-600 mb-2">
            {genre === 'hommes' ? '👨 Hommes' : '👩 Femmes'}
          </p>
          <div className="flex gap-2">
            {(['semis', 'finale'] as const).map(mode => {
              const key = `${selectedComp}-${genre}-${mode}`
              const isConfigured = ['keqiao-2026'].includes(selectedComp)
              return (
                <div key={mode} className="flex-1">
                  <button
                    onClick={() => syncFromIFSC(selectedComp, genre, mode)}
                    disabled={!isConfigured || syncing === key}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {syncing === key ? '⏳' : '🔄'} {mode === 'semis' ? 'Semis → Top 8' : 'Finale → Podium'}
                  </button>
                  {syncStatus[key] && (
                    <p className="text-xs mt-1 text-blue-700 break-words">{syncStatus[key]}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-blue-400 mt-1">
        ⚠️ Semis remplit le top 8 uniquement. Finale remplit top 8 + podium.
      </p>
    </div>

    {/* === BLOC SYNC INSCRITS === */}
    <div className="border border-green-100 bg-green-50 rounded-2xl p-5 mb-4">
      <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">
        👥 Sync inscrits depuis IFSC
      </p>
      <button
        onClick={() => syncRegistrations(selectedComp)}
        disabled={syncingReg === selectedComp}
        className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {syncingReg === selectedComp ? '⏳' : '👥'} Sync inscrits ({selectedComp})
      </button>
      {syncRegStatus[selectedComp] && (
        <p className="text-xs mt-2 text-green-700">{syncRegStatus[selectedComp]}</p>
      )}
      <p className="text-xs text-green-400 mt-2">
        Synchronise hommes + femmes en une fois. À faire avant d'ouvrir les votes.
      </p>
    </div>

{/* === BLOC SYNC DEMIS === */}
<div className="border border-orange-100 bg-orange-50 rounded-2xl p-5 mb-4">
  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
    🎯 Sync demi-finalistes depuis IFSC
  </p>
  <button
    onClick={() => syncDemis(selectedComp)}
    disabled={syncingDemis === selectedComp}
    className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {syncingDemis === selectedComp ? '⏳' : '🎯'} Sync demi-finalistes ({selectedComp})
  </button>
  {syncDemisStatus[selectedComp] && (
    <p className="text-xs mt-2 text-orange-700">{syncDemisStatus[selectedComp]}</p>
  )}
  <p className="text-xs text-orange-400 mt-2">
    Remplace les inscrits par les 24 qualifiés pour les demis. À faire après les qualifs.
  </p>
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
    <button onClick={saveFinalistes} disabled={saving} className="w-full h-11 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition mb-3 disabled:opacity-60">
      {saving ? "Sauvegarde..." : "Sauvegarder tout"}
    </button>
    <button onClick={calculateScores} disabled={calculating} className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition mb-3 disabled:opacity-60">
      {calculating ? "Calcul en cours..." : "Calculer les scores →"}
    </button>
    <button onClick={resetScores} className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-semibold transition">
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
                {competitions.map(c => {
                  const s = compStatuses[c.id] ?? { open: false, phase1_open: true, phase2_open: true };
                  return (
                    <div key={c.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{c.flag} {c.name}</span>
                        <button onClick={() => toggleCompStatus(c.id, "open")}
                          className={`text-xs font-semibold rounded-full px-3 py-1 transition ${s.open ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                          {s.open ? "✓ Étape ouverte" : "Étape fermée"}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleCompStatus(c.id, "phase1_open")}
                          className={`text-xs font-semibold rounded-full px-3 py-1 transition ${s.phase1_open ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                          {s.phase1_open ? "✓ Phase 1 ouverte" : "Phase 1 fermée"}
                        </button>
                        <button onClick={() => toggleCompStatus(c.id, "phase2_open")}
                          className={`text-xs font-semibold rounded-full px-3 py-1 transition ${s.phase2_open ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                          {s.phase2_open ? "✓ Phase 2 ouverte" : "Phase 2 fermée"}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                  <button onClick={() => deleteProfile(p.id, p.username)}
                    className="text-xs font-semibold rounded-full px-3 py-1.5 transition bg-red-600 text-white hover:bg-red-700">
                    🗑
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
              <button onClick={saveScoringRules} disabled={rulesSaving || rulesLoading} className="mt-5 h-11 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition px-4 disabled:opacity-60">
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
                  <button onClick={addOverride} disabled={overrideSaving} className="h-10 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition px-4 disabled:opacity-60">
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
                          <p className="text-xs text-gray-400">{o.point_override} pts{o.note ? ` · ${o.note}` : ""}</p>
                        </div>
                        <button onClick={() => deleteOverride(o.id)} className="text-xs font-semibold rounded-full px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {tab === "chosen" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {competitions.map(c => (
                <button key={c.id} onClick={() => setSelectedComp(c.id)}
                  className={`text-sm font-medium rounded-full px-3 py-1.5 transition ${selectedComp === c.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {c.flag} {c.name}
                </button>
              ))}
            </div>
            <ChosenOneStatus compId={selectedComp} supabase={supabase} onReset={async () => {
              if (!confirm("Réinitialiser le Chosen One ? Cela supprime l'élu actuel ET toutes les propositions pour cette étape.")) return;
              await supabase.from("chosen_one").delete().eq("competition_id", selectedComp);
              await supabase.from("chosen_one_proposals").delete().eq("competition_id", selectedComp);
              setVoters(v => ({ ...v, chosen: [] }));
              setMessage("✓ Chosen One réinitialisé ! Les joueurs peuvent re-proposer.");
              setTimeout(() => setMessage(null), 4000);
            }} />
            <div className="border border-gray-100 rounded-2xl p-5 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Propositions reçues</p>
              {voters.chosen.length === 0 ? (
                <p className="text-gray-300 text-sm">Aucune proposition pour cette étape.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {voters.chosen.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-gray-900">{p.username}</span>
                      <span className="text-sm text-gray-500">{p.athlete}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                if (voters.chosen.length === 0) { setMessage("Aucune proposition à tirer au sort !"); return; }
                const random = voters.chosen[Math.floor(Math.random() * voters.chosen.length)];
                const proposer = profiles.find(p => p.username === random.username);
                await supabase.from("chosen_one").upsert({
                  competition_id: selectedComp,
                  athlete_name: random.athlete,
                  proposed_by: proposer?.id || null,
                  revealed_at: new Date().toISOString(),
                }, { onConflict: "competition_id" });
                setMessage(`⭐ L'élu est : ${random.athlete} (proposé par ${random.username}) !`);
              }}
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold text-sm transition mb-4">
              🎲 Tirer au sort l'Élu
            </button>
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Entrer le rang officiel en qualifs</p>
              <p className="text-sm text-gray-500 mb-4">Une fois les qualifications terminées, entre le rang réel de l'Élu pour calculer les points.</p>
              <div className="flex gap-3">
                <input type="number" min="1" max="200" placeholder="Rang officiel (ex: 14)"
                  id="chosen-rank-input"
                  className="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 transition"/>
                <button
                  onClick={async () => {
                    const input = document.getElementById("chosen-rank-input") as HTMLInputElement;
                    const rank = parseInt(input.value);
                    if (!rank) { setMessage("Entre un rang valide."); return; }
                    const { data: chosen } = await supabase.from("chosen_one").select("athlete_name").eq("competition_id", selectedComp).single();
                    if (!chosen) { setMessage("Aucun élu trouvé pour cette étape."); return; }
                    const { data: picks } = await supabase.from("chosen_one_picks").select("user_id, predicted_rank").eq("competition_id", selectedComp);
                    for (const pick of picks || []) {
                      const diff = Math.abs(pick.predicted_rank - rank);
                      let pts = 0;
                      if (diff === 0) pts = 20;
                      else if (diff <= 2) pts = 10;
                      else if (diff <= 5) pts = 5;
                      else if (diff <= 10) pts = 2;
                      await supabase.from("scores").upsert({
                        user_id: pick.user_id,
                        competition_id: `${selectedComp}-chosen`,
                        genre: "chosen",
                        phase1_points: pts,
                        phase2_points: 0,
                        total_points: pts,
                      }, { onConflict: "user_id,competition_id,genre" });
                    }
                    setMessage(`✓ Points Chosen One calculés ! Rang réel : #${rank}`);
                  }}
                  className="h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl px-5 text-sm font-semibold transition">
                  Calculer les points
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}