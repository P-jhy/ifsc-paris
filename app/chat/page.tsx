"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const GIPHY_KEY = ""; // Laisse vide pour l'instant, on utilisera tenor gratuit
const QUICK_EMOJIS = ["👍", "🔥", "😂", "😮", "💪", "🎯"];
const TENOR_KEY = "AIzaSyAyimkuYQYF_FXVALexPZnhFnoy06AmU9o"; // clé publique demo tenor

type Message = {
  id: string;
  user_id: string;
  content: string;
  gif_url: string | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
  reactions: Record<string, string[]>; // emoji -> user_ids
};

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState<{ url: string; preview: string }[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      setUserId(data.session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", data.session.user.id)
        .single();
      setUsername(profile?.username || "Joueur");
      setAvatarUrl(profile?.avatar_url || null);

      await loadMessages();
      setLoading(false);
    });
  }, [router]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadMessages();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        loadMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, user_id, content, gif_url, created_at")
      .order("created_at", { ascending: true })
      .limit(100);

    if (!msgs) return;

    const userIds = [...new Set(msgs.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
    profiles?.forEach(p => { profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url }; });

    const msgIds = msgs.map(m => m.id);
    const { data: reactions } = await supabase
      .from("message_reactions")
      .select("message_id, user_id, emoji")
      .in("message_id", msgIds);

    const reactionMap: Record<string, Record<string, string[]>> = {};
    reactions?.forEach(r => {
      if (!reactionMap[r.message_id]) reactionMap[r.message_id] = {};
      if (!reactionMap[r.message_id][r.emoji]) reactionMap[r.message_id][r.emoji] = [];
      reactionMap[r.message_id][r.emoji].push(r.user_id);
    });

    setMessages(msgs.map(m => ({
      ...m,
      username: profileMap[m.user_id]?.username || "Joueur",
      avatar_url: profileMap[m.user_id]?.avatar_url || null,
      reactions: reactionMap[m.id] || {},
    })));
  };

  const sendMessage = async (gifUrl?: string) => {
    if (!userId || (!input.trim() && !gifUrl)) return;
    setSending(true);
    await supabase.from("messages").insert({
      user_id: userId,
      content: input.trim(),
      gif_url: gifUrl || null,
    });
    setInput("");
    setShowGifPicker(false);
    setSending(false);
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!userId) return;
    const msg = messages.find(m => m.id === messageId);
    const hasReacted = msg?.reactions[emoji]?.includes(userId);
    if (hasReacted) {
      await supabase.from("message_reactions").delete()
        .eq("message_id", messageId).eq("user_id", userId).eq("emoji", emoji);
    } else {
      await supabase.from("message_reactions").insert({ message_id: messageId, user_id: userId, emoji });
    }
  };

  const deleteMessage = async (messageId: string) => {
    await supabase.from("messages").delete().eq("id", messageId);
  };

  const searchGifs = async (q: string) => {
    if (!q.trim()) return;
    setGifLoading(true);
    try {
      const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=AIzaSyC6XuKR3w-FvNpgkq_M0gGTkVdqP6sG3Ck&limit=12&media_filter=gif`);
      const data = await res.json();
      setGifs(data.results?.map((r: any) => ({
        url: r.media_formats?.gif?.url || r.url,
        preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url,
      })) || []);
    } catch {
      setGifs([]);
    }
    setGifLoading(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement...</p>
    </main>
  );

  // Grouper les messages par date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const date = formatDate(m.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(m);
    else groupedMessages.push({ date, msgs: [m] });
  });

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-900 transition">
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-900">💬 Chat Saison 2026</h1>
          <p className="text-xs text-gray-400">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-400 text-sm">Sois le premier à écrire !</p>
          </div>
        )}

        {groupedMessages.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-100"/>
              <span className="text-xs text-gray-300 flex-shrink-0">{date}</span>
              <div className="flex-1 h-px bg-gray-100"/>
            </div>

            {msgs.map((msg, idx) => {
              const isMe = msg.user_id === userId;
              const prevMsg = idx > 0 ? msgs[idx - 1] : null;
              const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id;

              return (
                <div key={msg.id} className={`flex gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className="w-8 flex-shrink-0 flex items-end">
                    {showAvatar && (
                      msg.avatar_url
                        ? <img src={msg.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover"/>
                        : <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">🧗</div>
                    )}
                  </div>

                  {/* Bulle */}
                  <div className={`max-w-[75%] group`}>
                  {showAvatar && !isMe && (
  <button
    onClick={() => router.push(`/pronos-joueur?user=${msg.user_id}&competition=keqiao-2026&genre=hommes`)}
    className="text-xs text-gray-400 hover:text-gray-900 hover:underline transition mb-1 ml-1 text-left">
    {msg.username}
  </button>
)}


                    <div className={`relative rounded-2xl px-3 py-2 ${
                      isMe ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    }`}>
                      {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                      {msg.gif_url && (
                        <img src={msg.gif_url} alt="gif" className="rounded-xl max-w-full mt-1" style={{ maxHeight: 200 }}/>
                      )}
                      <p className={`text-xs mt-1 ${isMe ? "text-gray-400" : "text-gray-400"}`}>
                        {formatTime(msg.created_at)}
                      </p>

                      {/* Supprimer */}
                      {isMe && (
                        <button onClick={() => deleteMessage(msg.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 text-red-400 rounded-full text-xs hidden group-hover:flex items-center justify-center">
                          ×
                        </button>
                      )}
                    </div>

                    {/* Réactions */}
                    <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? "justify-end" : "justify-start"}`}>
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                        <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                          className={`text-xs rounded-full px-2 py-0.5 border transition ${
                            userIds.includes(userId || "")
                              ? "bg-blue-50 border-blue-200 text-blue-600"
                              : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                          }`}>
                          {emoji} {userIds.length}
                        </button>
                      ))}

                      {/* Ajouter réaction */}
                      <div className="relative">
                        <button className="text-xs rounded-full px-2 py-0.5 border border-gray-100 text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition opacity-0 group-hover:opacity-100">
                          + 😊
                        </button>
                      </div>

                      {/* Quick emojis au hover */}
                      <div className={`hidden group-hover:flex gap-1 ${isMe ? "flex-row-reverse" : ""}`}>
                        {QUICK_EMOJIS.map(e => (
                          <button key={e} onClick={() => toggleReaction(msg.id, e)}
                            className="text-sm hover:scale-125 transition-transform">
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setShowGifPicker(false)}>
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-900 mb-3">Choisir un GIF</p>
            <div className="flex gap-2 mb-4">
              <input
                value={gifSearch}
                onChange={e => setGifSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchGifs(gifSearch)}
                placeholder="Rechercher un GIF..."
                className="flex-1 h-9 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
              />
              <button onClick={() => searchGifs(gifSearch)}
                className="h-9 px-4 bg-gray-900 text-white rounded-xl text-sm font-medium">
                Go
              </button>
            </div>
            {gifLoading && <p className="text-center text-gray-400 text-sm py-4">Chargement...</p>}
            <div className="grid grid-cols-3 gap-2">
              {gifs.map((gif, i) => (
                <button key={i} onClick={() => sendMessage(gif.url)}
                  className="rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition">
                  <img src={gif.preview} alt="gif" className="w-full h-24 object-cover"/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-30">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <button onClick={() => { setShowGifPicker(true); searchGifs("climbing boulder"); }}
            className="h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition flex-shrink-0">
            GIF
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ton message..."
            className="flex-1 h-10 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 transition"
          />
          <button onClick={() => sendMessage()} disabled={sending || !input.trim()}
            className="h-10 w-10 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-40 flex-shrink-0 flex items-center justify-center">
            →
          </button>
        </div>
      </div>
    </main>
  );
}
