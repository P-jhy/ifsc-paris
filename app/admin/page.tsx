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

function getRankingBonus(ranking: number): number {
  if (!ranking || ranking >= 999) return 15;
  if (ranking <= 10) return 2;
  if (ranking <= 25) return 4;
  if (ranking <= 50) return 7;
  if (ranking <= 100) return 12;
  return 12;
}

function getPhase2BasePoints(predicted: string, actual: string, position: string): number {
  if (predicted !== actual) return 0;
  if (position === "gold") return 5;
  if (position === "silver") return 3;
  if (position === "bronze") return 2;
  return 0;
}

function getRankingBonusP2(ranking: number): number {
  if (!ranking || ranking >= 999) return 7;
  if (ranking <= 10) return 0;
  if (ranking <= 25) return 1;
  if (ranking <= 50) return 3;
  return 5;
}

export default function AdminPage() {
  const router = useRouter();
  const [selectedComp, setSelectedComp] = useState("keqiao-2026");
  const [selectedGenre, setSelectedGenre] = useState("hommes");
  const [finalistes, setFinalistes] = useState(["","","","","","","",""]);
  const [podium, setPodium] = useState({ gold: "", silver: "", bronze: "" });
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  const saveFinalistes = async () => {
    setSaving(true);
    await supabase.from("resultats_officiels").upsert({
      competition_id: selectedComp,
      genre: selectedGenre,
      rank1: finalistes[0], rank2: finalistes[1], rank3: finalistes[2],
      rank4: finalistes[3], rank5: finalistes[4], rank6: finalistes[5],
      rank7: finalistes[6], rank8: finalistes[7],
    }, { onConflict: "competition_id,genre" });
    setSaving(false);
    setMessage("✓ Résultats sauvegardés !");
    setTimeout(() => setMessage(null), 3000);
  };

  const calculateScores = async () => {
    setCalculating(true);
    setMessage("Calcul en cours...");

    const gold = podium.gold || finalistes[0];
    const silver = podium.silver || finalistes[1];
    const bronze = podium.bronze || finalistes[2];
    const top8 = finalistes.filter(f => f.trim() !== "");

    const { data: allPicks1 } = await supabase
      .from("picks_phase1_temp")
      .select("user_id, athlete_name")
      .eq("competition_id", `${selectedComp}-${selectedGenre}`);

    const { data: allPicks2 } = await supabase
      .from("picks_phase2_temp")
      .select("user_id, gold_athlete, silver_athlete, bronze_athlete")
      .eq("competition_id", `${selectedComp}-${selectedGenre}`);

    const userIds = [...new Set(allPicks1?.map(p => p.user_id) || [])];

    for (const userId of userIds) {
      const userPicks1 = allPicks1?.filter(p => p.user_id === userId).map(p => p.athlete_name) || [];
      const userPick2 = allPicks2?.find(p => p.user_id === userId);

      let phase1 = 0;
      for (const pick of userPicks1) {
        if (top8.includes(pick)) {
          const ranking = worldRankings[pick] || 999;
          phase1 += getRankingBonus(ranking);
        }
      }

      let phase2 = 0;
      if (userPick2) {
        const goldRank = worldRankings[gold] || 999;
        const silverRank = worldRankings[silver] || 999;
        const bronzeRank = worldRankings[bronze] || 999;

        if (userPick2.gold_athlete === gold) phase2 += 5 + getRankingBonusP2(goldRank);
        else if ([gold, silver, bronze].includes(userPick2.gold_athlete)) phase2 += 1;

        if (userPick2.silver_athlete === silver) phase2 += 3 + getRankingBonusP2(silverRank);
        else if ([gold, silver, bronze].includes(userPick2.silver_athlete)) phase2 += 1;

        if (userPick2.bronze_athlete === bronze) phase2 += 2 + getRankingBonusP2(bronzeRank);
        else if ([gold, silver, bronze].includes(userPick2.bronze_athlete)) phase2 += 1;
      }

      await supabase.from("scores").upsert({
        user_id: userId,
        competition_id: selectedComp,
        genre: selectedGenre,
        phase1_points: phase1,
        phase2_points: phase2,
        total_points: phase1 + phase2,
      }, { onConflict: "user_id,competition_id,genre" });
    }

    setCalculating(false);
    setMessage(`✓ Scores calculés pour ${userIds.length} joueurs !`);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">
          ← Retour
        </button>

        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Administration</p>
          <h1 className="text-2xl font-semibold">Résultats officiels</h1>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            {message}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {competitions.map(c => (
            <button key={c.id} onClick={() => setSelectedComp(c.id)}
              className={`text-sm font-medium rounded-full px-3 py-1.5 transition ${selectedComp === c.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-8">
          <button onClick={() => setSelectedGenre("hommes")}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${selectedGenre === "hommes" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500"}`}>
            Hommes
          </button>
          <button onClick={() => setSelectedGenre("femmes")}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition ${selectedGenre === "femmes" ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500"}`}>
            Femmes
          </button>
        </div>

        <div className="border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Top 8 finalistes officiels</p>
            <p className="text-xs text-gray-400 mt-1">Entre les noms exactement comme dans l'app</p>
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

        <button onClick={saveFinalistes} disabled={saving}
          className="w-full h-11 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold transition mb-8 disabled:opacity-60">
          {saving ? "Sauvegarde..." : "Sauvegarder les finalistes"}
        </button>

        <div className="border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Podium officiel</p>
          </div>
          <div className="p-5 grid gap-3">
            {[
              { label: "🥇 Vainqueur", key: "gold" },
              { label: "🥈 2ème", key: "silver" },
              { label: "🥉 3ème", key: "bronze" },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm w-24">{label}</span>
                <input type="text" value={podium[key as keyof typeof podium]}
                  placeholder="Nom de l'athlète"
                  onChange={e => setPodium({ ...podium, [key]: e.target.value })}
                  className="flex-1 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 transition"/>
              </div>
            ))}
          </div>
        </div>

        <button onClick={calculateScores} disabled={calculating}
          className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60">
          {calculating ? "Calcul en cours..." : "Calculer les scores →"}
        </button>
      </div>
    </main>
  );
}
