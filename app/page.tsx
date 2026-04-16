"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const nextCompDate = new Date('2026-05-01');

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
    <div className="flex gap-6 justify-center">
      {[
        { value: timeLeft.days, label: "jours" },
        { value: timeLeft.hours, label: "heures" },
        { value: timeLeft.minutes, label: "min" },
        { value: timeLeft.seconds, label: "sec" },
      ].map(({ value, label }) => (
        <div key={label} className="text-center">
          <p className="text-4xl font-bold text-gray-900 tabular-nums">{String(value).padStart(2, '0')}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/dashboard");
      else setChecking(false);
    });
  }, [router]);

  if (checking) return null;

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">

      {/* Logo / Titre */}
      <div className="mb-12">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          IFSC World Cup Boulder
        </p>
        <h1 className="text-5xl font-bold text-gray-900 mb-2">🧗 Climbete</h1>
        <p className="text-gray-400 text-lg">Paris entre amis · Saison 2026</p>
      </div>

      {/* Compte à rebours */}
      <div className="mb-12">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Prochaine étape — Keqiao 🇨🇳
        </p>
        <Countdown targetDate={nextCompDate} />
      </div>

      {/* Étapes */}
      <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-md">
        {[
          { name: "Keqiao", flag: "🇨🇳" },
          { name: "Berne", flag: "🇨🇭" },
          { name: "Madrid", flag: "🇪🇸" },
          { name: "Prague", flag: "🇨🇿" },
          { name: "Innsbruck", flag: "🇦🇹" },
          { name: "Salt Lake City", flag: "🇺🇸" },
        ].map(({ name, flag }) => (
          <span key={name} className="text-sm border border-gray-100 rounded-full px-3 py-1.5 text-gray-500">
            {flag} {name}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={() => router.push("/login")}
          className="w-full h-12 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl font-semibold text-sm transition">
          Se connecter
        </button>
        <button onClick={() => router.push("/login")}
          className="w-full h-12 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-semibold text-sm transition">
          Créer un compte
        </button>
      </div>

      <p className="text-xs text-gray-300 mt-12">Un jeu privé entre amis · Pas de mise d'argent</p>
    </main>
  );
}
