"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const competitions = [
  { id: "keqiao-2026", name: 'Keqiao', country: 'Chine', flag: '🇨🇳', date: new Date('2026-05-01') },
  { id: "berne-2026", name: 'Berne', country: 'Suisse', flag: '🇨🇭', date: new Date('2026-05-22') },
  { id: "madrid-2026", name: 'Madrid', country: 'Espagne', flag: '🇪🇸', date: new Date('2026-05-28') },
  { id: "prague-2026", name: 'Prague', country: 'Tchéquie', flag: '🇨🇿', date: new Date('2026-06-03') },
  { id: "innsbruck-2026", name: 'Innsbruck', country: 'Autriche', flag: '🇦🇹', date: new Date('2026-06-17') },
  { id: "saltlake-2026", name: 'Salt Lake City', country: 'États-Unis', flag: '🇺🇸', date: new Date('2026-10-16') },
]

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex gap-3 justify-center mt-2">
      {[
        { value: timeLeft.days, label: "jours" },
        { value: timeLeft.hours, label: "heures" },
        { value: timeLeft.minutes, label: "min" },
        { value: timeLeft.seconds, label: "sec" },
      ].map(({ value, label }) => (
        <div key={label} className="text-center">
          <p className="text-2xl font-bold text-gray-900">{String(value).padStart(2, '0')}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ pickedH, pickedF, pickedP2H, pickedP2F }: {
  pickedH: boolean, pickedF: boolean, pickedP2H: boolean, pickedP2F: boolean
}) {
  const steps = [
    { label: "Phase 1 H", done: pickedH },
    { label: "Phase 1 F", done: pickedF },
    { label: "Podium H", done: pickedP2H },
    { label: "Podium F", done: pickedP2F },
  ];
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{done}/{steps.length} complétés</span>
        <span className="text-xs font-semibold text-gray-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gray-900 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}/>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {steps.map(({ label, done }) => (
          <span key={label} className={`text-xs rounded-full px-2 py-0.5 ${
            done ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-400 border border-gray-100"
          }`}>
            {done ? "✓" : "○"} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPicked, setHasPicked] = useState<Record<string, boolean>>({});
  const [hasPickedP2, setHasPickedP2] = useState<Record<string, boolean>>({});

  const nextComp = competitions.find(c => c.date > new Date());

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      const userId = data.session.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, is_admin, avatar_url")
        .eq("id", userId)
        .single();

      setUsername(profile?.username || data.session.user.email || "");
      setAvatarUrl(profile?.avatar_url || null);
      setIsAdmin(profile?.is_admin || false);

      const { data: picks1 } = await supabase
        .from("picks_phase1_temp")
        .select("competition_id")
        .eq("user_id", userId);

      const { data: picks2 } = await supabase
        .from("picks_phase2_temp")
        .select("competition_id")
        .eq("user_id", userId);

      const picked1: Record<string, boolean> = {};
      picks1?.forEach(p => { picked1[p.competition_id] = true; });
      setHasPicked(picked1);

      const picked2: Record<string, boolean> = {};
      picks2?.forEach(p => { picked2[p.competition_id] = true; });
      setHasPickedP2(picked2);
    });
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!username) return null;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar"
                className="w-14 h-14 rounded-2xl object-cover border border-gray-100"/>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">🧗</div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">IFSC Boulder 2026</p>
              <h1 className="text-2xl font-semibold text-gray-900">Bonjour {username} 👋</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/classement")}
              className="text-sm font-medium text-gray-900 border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition">
              Classement
            </button>
            <button onClick={() => router.push("/profil")}
              className="text-sm font-medium text-gray-900 border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition">
              Mon profil
            </button>
            {isAdmin && (
              <button onClick={() => router.push("/admin")}
                className="text-sm font-medium text-gray-900 border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition">
                Admin
              </button>
            )}
            <button onClick={signOut}
              className="text-sm font-medium text-gray-400 hover:text-gray-900 transition">
              Quitter
            </button>
          </div>
        </div>

        {/* Compte à rebours prochaine étape */}
        {nextComp && (
          <div className="border border-gray-100 rounded-2xl p-6 mb-8 text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Prochaine étape</p>
            <p className="text-lg font-semibold text-gray-900 mb-1">{nextComp.flag} {nextComp.name}</p>
            <Countdown targetDate={nextComp.date} />
          </div>
        )}

        {/* Compétitions */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Saison 2026</h2>
            <span className="text-xs text-gray-400">6 étapes</span>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {competitions.map((c, idx) => {
              const pickedH = hasPicked[`${c.id}-hommes`];
              const pickedF = hasPicked[`${c.id}-femmes`];
              const pickedP2H = hasPickedP2[`${c.id}-hommes`];
              const pickedP2F = hasPickedP2[`${c.id}-femmes`];
              const isPast = c.date < new Date();

              return (
                <div key={idx} className={`px-5 py-4 transition ${isPast ? "bg-gray-50" : "bg-white hover:bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className={`font-semibold ${isPast ? "text-gray-400" : "text-gray-900"}`}>{c.name}</p>
                        <p className="text-xs text-gray-400">{c.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => pickedH
                          ? router.push(`/mes-pronos?competition=${c.id}&genre=hommes`)
                          : router.push(`/competition?competition=${c.id}&genre=hommes`)
                        }
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 transition ${
                          pickedH ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-900 text-white hover:bg-gray-700"
                        }`}>
                        {pickedH ? "✓ H" : "Phase 1 H"}
                      </button>
                      <button
                        onClick={() => pickedF
                          ? router.push(`/mes-pronos?competition=${c.id}&genre=femmes`)
                          : router.push(`/competition?competition=${c.id}&genre=femmes`)
                        }
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 transition ${
                          pickedF ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-900 text-white hover:bg-gray-700"
                        }`}>
                        {pickedF ? "✓ F" : "Phase 1 F"}
                      </button>
                      <button
                        onClick={() => router.push(`/podium?competition=${c.id}&genre=hommes`)}
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 transition ${
                          pickedP2H ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}>
                        {pickedP2H ? "✓ Podium H" : "🏆 Podium H"}
                      </button>
                      <button
                        onClick={() => router.push(`/podium?competition=${c.id}&genre=femmes`)}
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 transition ${
                          pickedP2F ? "bg-pink-50 text-pink-700 border border-pink-200" : "bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100"
                        }`}>
                        {pickedP2F ? "✓ Podium F" : "🏆 Podium F"}
                      </button>
                    </div>
                  </div>
                  <ProgressBar pickedH={!!pickedH} pickedF={!!pickedF} pickedP2H={!!pickedP2H} pickedP2F={!!pickedP2F} />
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300">IFSC World Cup Boulder · Saison 2026</p>
      </div>
    </main>
  );
}
