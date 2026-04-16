import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const competitions = [
  { name: 'Coupe du Monde Keqiao', city: 'Keqiao', country: 'Chine', date_start: '2026-05-01', date_end: '2026-05-03' },
  { name: 'Coupe du Monde Berne', city: 'Berne', country: 'Suisse', date_start: '2026-05-22', date_end: '2026-05-24' },
  { name: 'Coupe du Monde Madrid', city: 'Madrid', country: 'Espagne', date_start: '2026-05-28', date_end: '2026-05-31' },
  { name: 'Coupe du Monde Prague', city: 'Prague', country: 'Tchéquie', date_start: '2026-06-03', date_end: '2026-06-07' },
  { name: 'Coupe du Monde Innsbruck', city: 'Innsbruck', country: 'Autriche', date_start: '2026-06-17', date_end: '2026-06-21' },
  { name: 'Coupe du Monde Salt Lake City', city: 'Salt Lake City', country: 'États-Unis', date_start: '2026-10-16', date_end: '2026-10-18' },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🧗 IFSC Paris 2026</h1>
        <p className="text-center text-gray-400 mb-10">Saison Coupe du Monde de Bloc</p>

        <div className="grid gap-4">
          {competitions.map((c, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Étape {idx + 1}</span>
                <h2 className="text-lg font-semibold mt-1">{c.city} <span className="text-gray-400 font-normal">· {c.country}</span></h2>
                <p className="text-sm text-gray-500 mt-1">{c.date_start} → {c.date_end}</p>
              </div>
              <div className="text-3xl">
                {['🇨🇳','🇨🇭','🇪🇸','🇨🇿','🇦🇹','🇺🇸'][idx]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
