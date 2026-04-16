"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"signin" | "signup" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const onSignIn = async () => {s
    setError(null);
    setMessage(null);
    setLoading("signin");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Connexion OK => rediriger
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la connexion.");
    } finally {
      setLoading(null);
    }
  };
  const onSignUp = async () => {
    setError(null);
    setMessage(null);
    setLoading("signup");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      // Si Supabase crée une session immédiatement, on redirige.
      // Sinon (souvent email confirmation), on affiche un message.
      if (data.session) {
        router.push("/dashboard");
      } else {
        setMessage(
          "Compte créé. Vérifie ton email pour confirmer l'inscription (si requis)."
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création du compte.");
    } finally {
      setLoading(null);
    }
  };
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-200">
              IFSC Paris 2026
            </div>
            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight">
              Connexion & inscription
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Accède à ton espace paris et pronostics.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-gray-950 px-3 text-sm outline-none transition focus:border-blue-500/60"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-200">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-gray-950 px-3 text-sm outline-none transition focus:border-blue-500/60"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {message}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onSignIn}
                  disabled={loading !== null}
                  className="h-11 w-full rounded-xl bg-white text-gray-950 font-semibold transition disabled:opacity-60"
                >
                  {loading === "signin" ? "Connexion..." : "Se connecter"}
                </button>
                <button
                  type="button"
                  onClick={onSignUp}
                  disabled={loading !== null}
                  className="h-11 w-full rounded-xl bg-gray-900 text-gray-100 border border-white/10 font-semibold transition hover:bg-gray-800 disabled:opacity-60"
                >
                  {loading === "signup" ? "Création..." : "Créer un compte"}
                </button>
              </div>
            </form>
          </div>
          <p className="mt-5 text-xs text-gray-500">
            Conseil: si ton projet Supabase exige une confirmation email, la redirection après inscription
            peut nécessiter un clic de confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}