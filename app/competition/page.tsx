"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const athletesHommes = [
  { name: "Sorato ANRAKU", country: "JPN", ranking: 1 },
  { name: "Mejdi SCHALCK", country: "FRA", ranking: 2 },
  { name: "Dohyun LEE", country: "KOR", ranking: 3 },
  { name: "Tomoa NARASAKI", country: "JPN", ranking: 4 },
  { name: "Sohta AMAGASA", country: "JPN", ranking: 5 },
  { name: "Meichi NARASAKI", country: "JPN", ranking: 6 },
  { name: "Hannes VAN DUYSEN", country: "BEL", ranking: 7 },
  { name: "Yufei PAN", country: "CHN", ranking: 8 },
  { name: "Colin DUFFY", country: "USA", ranking: 9 },
  { name: "Dayan AKHTAR", country: "GBR", ranking: 10 },
  { name: "Anze PEHARC", country: "SLO", ranking: 11 },
  { name: "Paul JENFT", country: "FRA", ranking: 12 },
  { name: "Jan-Luca POSCH", country: "AUT", ranking: 13 },
  { name: "Jack MACDOUGALL", country: "GBR", ranking: 14 },
  { name: "Toby ROBERTS", country: "GBR", ranking: 16 },
  { name: "Thorben Perry BLOEM", country: "GER", ranking: 17 },
  { name: "Nikolay RUSEV", country: "BUL", ranking: 18 },
  { name: "Samuel RICHARD", country: "FRA", ranking: 19 },
  { name: "Maximillian MILNE", country: "GBR", ranking: 22 },
  { name: "Oren PRIHED", country: "ISR", ranking: 24 },
  { name: "Elias ARRIAGADA KRÜGER", country: "GER", ranking: 25 },
  { name: "Guillermo PEINADO FRANGANILLO", country: "ESP", ranking: 29 },
  { name: "Jongwon CHON", country: "KOR", ranking: 32 },
  { name: "Lasse VON FREIER", country: "GER", ranking: 36 },
  { name: "Benjamin HANNA", country: "USA", ranking: 37 },
  { name: "Adi BARK", country: "ISR", ranking: 39 },
  { name: "Antoine GIRARD", country: "FRA", ranking: 41 },
  { name: "Tomer YAKOBOVITCH", country: "ISR", ranking: 41 },
  { name: "Ziqi XU", country: "CHN", ranking: 43 },
  { name: "Dylan PARKS", country: "AUS", ranking: 44 },
  { name: "Julien CLÉMENCE", country: "SUI", ranking: 47 },
  { name: "Max BERTONE", country: "FRA", ranking: 50 },
  { name: "Lucas TRANDAFIR", country: "GER", ranking: 51 },
  { name: "Luca BOLDRINI", country: "ITA", ranking: 55 },
  { name: "Raffael GRUBER", country: "AUT", ranking: 58 },
  { name: "Levin STRAUBHAAR", country: "SUI", ranking: 59 },
  { name: "Matthew RODRIGUEZ", country: "CAN", ranking: 61 },
  { name: "Ido FIDEL", country: "ISR", ranking: 62 },
  { name: "Hugo DORVAL", country: "CAN", ranking: 63 },
  { name: "Jiahao FU", country: "CHN", ranking: 64 },
  { name: "Keita DOHI", country: "JPN", ranking: 65 },
  { name: "Timotej ROMŠAK", country: "SLO", ranking: 67 },
  { name: "Jinwei YAO", country: "CHN", ranking: 68 },
  { name: "Bharath PEREIRA", country: "IND", ranking: 70 },
  { name: "Andreas HOFHERR", country: "AUT", ranking: 74 },
  { name: "Junzhe HU", country: "CHN", ranking: 75 },
  { name: "Xuanpu BAI", country: "CHN", ranking: 76 },
  { name: "Hyunseung NOH", country: "KOR", ranking: 80 },
  { name: "Rei KAWAMATA", country: "JPN", ranking: 83 },
  { name: "Vail EVERETT", country: "USA", ranking: 85 },
  { name: "Campbell HARRISON", country: "AUS", ranking: 93 },
  { name: "Dohyeon KIM", country: "KOR", ranking: 132 },
  { name: "Chih-En FAN", country: "TPE", ranking: 91 },
  { name: "Chia Hsiang LIN", country: "TPE", ranking: 114 },
  { name: "Auswin AUEAREECHIT", country: "THA", ranking: 92 },
  { name: "Matteo REUSA", country: "ITA", ranking: 49 },
  { name: "Cheung-Chi Shoji CHAN", country: "HKG", ranking: 53 },
  { name: "Ali SALIMIAN", country: "IRI", ranking: 117 },
  { name: "Cozmo ROTHFORK", country: "USA", ranking: 105 },
  { name: "Gerald BAYO VEROSIL", country: "SGP", ranking: 123 },
  { name: "Luke GOH WEN BIN", country: "SGP", ranking: 111 },
  { name: "Andrés ORTEGA FOSADO", country: "MEX", ranking: 118 },
  { name: "Qun Tao KE", country: "MAS", ranking: 150 },
  { name: "André MACEDO", country: "BRA", ranking: 156 },
  { name: "Finn ALTEMÖLLER", country: "GER", ranking: 999 },
  { name: "Aiden DUNNE", country: "GBR", ranking: 999 },
  { name: "Rhys CONLON", country: "GBR", ranking: 999 },
  { name: "Timothy James FOLEY", country: "CAN", ranking: 999 },
  { name: "Ronak UPRETI", country: "NEP", ranking: 999 },
  { name: "Tenzin Bertin RAI", country: "NEP", ranking: 999 },
  { name: "Jack BURNINGHAM", country: "RSA", ranking: 999 },
  { name: "Auggie CHI", country: "USA", ranking: 999 },
  { name: "Egor DULUB", country: "AIN", ranking: 999 },
  { name: "Nikolai IARILOVETS", country: "AIN", ranking: 999 },
  { name: "Shing Yui WAI", country: "HKG", ranking: 999 },
  { name: "Yago GANCEDO", country: "MEX", ranking: 999 },
];

const athletesFemmes = [
  { name: "Oriane BERTONE", country: "FRA", ranking: 1 },
  { name: "Annie SANDERS", country: "USA", ranking: 2 },
  { name: "Mao NAKAMURA", country: "JPN", ranking: 3 },
  { name: "Erin MCNEICE", country: "GBR", ranking: 4 },
  { name: "Melody SEKIKAWA", country: "JPN", ranking: 5 },
  { name: "Miho NONAKA", country: "JPN", ranking: 6 },
  { name: "Janja GARNBRET", country: "SLO", ranking: 7 },
  { name: "Anon MATSUFUJI", country: "JPN", ranking: 8 },
  { name: "Zélia AVEZOU", country: "FRA", ranking: 9 },
  { name: "Camilla MORONI", country: "ITA", ranking: 10 },
  { name: "Agathe CALLIET", country: "FRA", ranking: 11 },
  { name: "Jennifer Eucharia BUCKLEY", country: "SLO", ranking: 12 },
  { name: "Oceania MACKENZIE", country: "AUS", ranking: 13 },
  { name: "Emma EDWARDS", country: "GBR", ranking: 14 },
  { name: "Futaba ITO", country: "JPN", ranking: 15 },
  { name: "Naïlé MEIGNAN", country: "FRA", ranking: 16 },
  { name: "Chloe CAULIER", country: "BEL", ranking: 17 },
  { name: "Chaehyun SEO", country: "KOR", ranking: 18 },
  { name: "Lily ABRIAT", country: "FRA", ranking: 20 },
  { name: "Melina COSTANZA", country: "USA", ranking: 23 },
  { name: "Yuetong ZHANG", country: "CHN", ranking: 24 },
  { name: "Giorgia TESIO", country: "ITA", ranking: 25 },
  { name: "Cloe COSCOY", country: "USA", ranking: 26 },
  { name: "Madison RICHARDSON", country: "CAN", ranking: 28 },
  { name: "Afra HÖNIG", country: "GER", ranking: 31 },
  { name: "Nekaia SANDERS", country: "USA", ranking: 33 },
  { name: "Zoe PEETERMANS", country: "GBR", ranking: 35 },
  { name: "Flora OBLASSER", country: "AUT", ranking: 36 },
  { name: "Adriene Akiko CLARK", country: "USA", ranking: 37 },
  { name: "Stella GIACANI", country: "ITA", ranking: 38 },
  { name: "Selma ELHADJ MIMOUNE", country: "FRA", ranking: 40 },
  { name: "Lucija TARKUS", country: "SLO", ranking: 41 },
  { name: "Lucile SAUREL", country: "FRA", ranking: 42 },
  { name: "Maya STASIUK", country: "AUS", ranking: 44 },
  { name: "Irina DAZIANO", country: "ITA", ranking: 45 },
  { name: "Sandra LETTNER", country: "AUT", ranking: 46 },
  { name: "Gayeong OH", country: "KOR", ranking: 48 },
  { name: "Zhilu LUO", country: "CHN", ranking: 50 },
  { name: "Lea KEMPF", country: "AUT", ranking: 53 },
  { name: "Hannah MEUL", country: "GER", ranking: 80 },
  { name: "Heeju NOH", country: "KOR", ranking: 81 },
  { name: "Yawen MI", country: "CHN", ranking: 82 },
  { name: "Yajun HUANG", country: "CHN", ranking: 83 },
  { name: "Francesca MATUELLA", country: "ITA", ranking: 134 },
  { name: "Tsz Kiu TSUI", country: "HKG", ranking: 114 },
  { name: "Yali WEI", country: "CHN", ranking: 153 },
  { name: "Jingyu LI", country: "CHN", ranking: 143 },
  { name: "Xin WANG", country: "CHN", ranking: 88 },
  { name: "Tahnia HARRIS", country: "AUS", ranking: 79 },
  { name: "Lucy SINCLAIR", country: "NZL", ranking: 90 },
  { name: "Vanessa Si Yinn TENG", country: "SGP", ranking: 96 },
  { name: "Anna KELLEY", country: "CAN", ranking: 62 },
  { name: "Martina CASTRO", country: "CHI", ranking: 86 },
  { name: "Alejandra CONTRERAS", country: "CHI", ranking: 130 },
  { name: "María José ESTRADA", country: "MEX", ranking: 108 },
  { name: "Shareen MOHD NASRAN", country: "MAS", ranking: 122 },
  { name: "Ting-Chen YAO", country: "TPE", ranking: 111 },
  { name: "Yun-Shan HSIEH", country: "TPE", ranking: 158 },
  { name: "Natalia GROSSMAN", country: "USA", ranking: 61 },
  { name: "Ruby DANZIGER", country: "ISR", ranking: 110 },
  { name: "Alma SAPIR HALEVI", country: "ISR", ranking: 60 },
  { name: "Lucia DÖRFFEL", country: "GER", ranking: 102 },
  { name: "Brooke RABOUTOU", country: "USA", ranking: 999 },
  { name: "Kseniia CHERNEGA", country: "AIN", ranking: 999 },
  { name: "Elena KRASOVSKAIA", country: "AIN", ranking: 999 },
  { name: "Lucy GARLICK", country: "GBR", ranking: 999 },
  { name: "Eugenie LEE", country: "GBR", ranking: 999 },
  { name: "Anna LECHNER", country: "GER", ranking: 999 },
  { name: "Alma SHLOMOVITZ", country: "ISR", ranking: 999 },
  { name: "Zhenxuan ELISE YEE", country: "SGP", ranking: 999 },
  { name: "Mia AOYAGI", country: "JPN", ranking: 999 },
  { name: "Swastika CHAUDHARY", country: "NEP", ranking: 999 },
];

function getRankingLabel(r: number) { return r === 999 ? "NC" : `#${r}`; }
function getRankingColor(r: number) {
  if (r <= 10) return "text-amber-500";
  if (r <= 25) return "text-blue-500";
  if (r <= 50) return "text-green-500";
  return "text-gray-400";
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
      else setUserId(data.session.user.id);
    });
  }, [router]);

  useEffect(() => {
    supabase.from("competition_status").select("open")
      .eq("competition_id", competition).single()
      .then(({ data }) => setIsOpen(data?.open ?? false));
  }, [competition]);

  const athletes = genre === "hommes" ? athletesHommes : athletesFemmes;
  const sorted = [...athletes].sort((a, b) => a.ranking - b.ranking);
  const filtered = sorted.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.country.toLowerCase().includes(search.toLowerCase())
  );

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

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden mb-8">
          {filtered.map((athlete) => {
            const isSelected = selected.includes(athlete.name);
            return (
              <button key={athlete.name} onClick={() => toggle(athlete.name)}
                className={`w-full flex items-center justify-between px-5 py-3 transition text-left ${
                  isSelected ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50 text-gray-900"
                }`}>
                <div className="flex items-center gap-3">
                  {isSelected && <span className="text-white text-xs">✓</span>}
                  <span className="font-medium text-sm">{athlete.name}</span>
                  <span className="text-xs text-gray-400">{athlete.country}</span>
                </div>
                <span className={`text-xs font-semibold ${isSelected ? "text-gray-300" : getRankingColor(athlete.ranking)}`}>
                  {getRankingLabel(athlete.ranking)}
                </span>
              </button>
            );
          })}
        </div>

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
