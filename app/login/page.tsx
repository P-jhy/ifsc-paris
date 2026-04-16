"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState<"signin" | "signup" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const onSignIn = async () => {
    setError(null);
    setLoading("signin");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Email ou mot de passe incorrect."); setLoading(null); return; }
    router.push("/dashboard");
  };

  const onSignUp = async () => {
    setError(null);
    if (!username.trim()) { setError("Choisis un pseudo."); return; }
    setLoading("signup");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(null); return; }
    if (data.session) router.push("/dashboard");
    else setMessage("Compte créé ! Tu peux te connecter.");
    setLoading(null);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">IFSC Boulder 2026</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === "signin" ? "Bon retour 👋" : "Créer un compte"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {mode === "signin" ? "Connecte-toi pour accéder à tes paris" : "Rejoins le groupe"}
          </p>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pseudo</label>
              <input type="text" placeholder="Ton pseudo" value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 transition"/>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
            <input type="email" placeholder="ton@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 transition"/>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mot de passe</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 transition"/>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            onClick={mode === "signin" ? onSignIn : onSignUp}
            disabled={loading !== null}
            className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-60 mt-2">
            {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          {mode === "signin" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-gray-900 font-semibold hover:underline">
            {mode === "signin" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </main>
  );
}
