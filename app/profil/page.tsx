"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AVATARS = [
  "CLIMBETE.png",
  "CLIMBETE (5).png",
  "CLIMBETE (2).png",
  "CLIMBETE (3).png",
  "CLIMBETE (9).png",
  "CLIMBETE (10).png",
  "CLIMBETE (11).png",
  "CLIMBETE (12).png",
  "CLIMBETE (8).png",
  "CLIMBETE (7).png",
  "CLIMBETE (4).png",
  "CLIMBETE (6).png",
  "CLIMBETE (13).png",
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
function getAvatarUrl(filename: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/Avatars/${encodeURIComponent(filename)}`;
}

export default function ProfilPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      setUserId(data.session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", data.session.user.id)
        .single();

      if (profile) {
        setUsername(profile.username || "");
        setCurrentAvatar(profile.avatar_url || null);
      }
    });
  }, [router]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").upsert({
      id: userId,
      username,
      avatar_url: selectedAvatar ? getAvatarUrl(selectedAvatar) : currentAvatar,
    });
    setSaving(false);
    setMessage("✓ Profil mis à jour !");
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-sm mx-auto px-6 py-12">
        <button onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-400 hover:text-gray-900 transition mb-8">
          ← Retour
        </button>

        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Mon compte</p>
          <h1 className="text-2xl font-semibold">Mon profil</h1>
        </div>

        {/* Avatar actuel */}
        <div className="flex justify-center mb-8">
          {selectedAvatar ? (
            <img src={getAvatarUrl(selectedAvatar)} alt="avatar"
              className="w-24 h-24 rounded-3xl object-cover border border-gray-100"/>
          ) : currentAvatar ? (
            <img src={currentAvatar} alt="avatar"
              className="w-24 h-24 rounded-3xl object-cover border border-gray-100"/>
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-4xl">🧗</div>
          )}
        </div>

        <div className="space-y-6">
          {/* Pseudo */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pseudo</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 transition"/>
          </div>

          {/* Choix avatar */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Changer d'avatar</label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {AVATARS.map((avatar) => (
                <button key={avatar} onClick={() => setSelectedAvatar(avatar)}
                  className={`rounded-xl overflow-hidden border-2 transition ${
                    selectedAvatar === avatar ? "border-gray-900" : "border-transparent hover:border-gray-200"
                  }`}>
                  <img src={getAvatarUrl(avatar)} alt="avatar"
                    className="w-full aspect-square object-cover"/>
                </button>
              ))}
            </div>
          </div>

          {message && (
            <p className="text-sm text-green-600 font-medium">{message}</p>
          )}

          <button onClick={save} disabled={saving}
            className="w-full h-11 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-60">
            {saving ? "Sauvegarde..." : "Sauvegarder →"}
          </button>
        </div>
      </div>
    </main>
  );
}
