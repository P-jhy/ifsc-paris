import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const IFSC_BASE_URL = 'https://ifsc.results.info/api/v1'

const IFSC_CONFIG: Record<string, { eventId: number; finale: { men: number; women: number }; semis: { men: number; women: number } }> = {
  'keqiao-2026':    { eventId: 1524, finale: { men: 10661, women: 10662 }, semis: { men: 10659, women: 10660 } },
  'berne-2026':     { eventId: 1478, finale: { men: 0, women: 0 }, semis: { men: 0, women: 0 } },
  'madrid-2026':    { eventId: 1479, finale: { men: 0, women: 0 }, semis: { men: 0, women: 0 } },
  'prague-2026':    { eventId: 1480, finale: { men: 0, women: 0 }, semis: { men: 0, women: 0 } },
  'innsbruck-2026': { eventId: 1482, finale: { men: 0, women: 0 }, semis: { men: 0, women: 0 } },
  'saltlake-2026':  { eventId: 1488, finale: { men: 0, women: 0 }, semis: { men: 0, women: 0 } },
}

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

const IFSC_HEADERS = {
  'Accept': 'application/json',
  'Referer': 'https://ifsc.results.info/',
  'Origin': 'https://ifsc.results.info',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

type IFSCRankingEntry = {
  rank: number
  firstname: string
  lastname: string
  country: string
  score: string
  athlete_id: number
}

type IFSCResultResponse = {
  status: 'finished' | 'pending' | 'active'
  ranking: IFSCRankingEntry[]
  round: string
  category: string
  event: string
}

type IFSCAthlete = {
  athlete_id: number
  firstname: string
  lastname: string
  country: string
  gender: number
  d_cats: { id: number; name: string }[]
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { action, competitionId, genre, mode } = await req.json()
    // action = "sync-results" | "sync-registrations"

    const config = IFSC_CONFIG[competitionId]
    if (!config) {
      return NextResponse.json({ error: 'Compétition inconnue' }, { status: 400 })
    }

    // ===== ACTION : SYNC RÉSULTATS =====
    if (action === 'sync-results') {
      const roundConfig = mode === 'semis' ? config.semis : config.finale
      const roundId = genre === 'hommes' ? roundConfig.men : roundConfig.women

      if (!roundId) {
        return NextResponse.json({ error: 'Round ID non configuré' }, { status: 400 })
      }

      const url = `${IFSC_BASE_URL}/category_rounds/${roundId}/results`
      const res = await fetch(url, { cache: 'no-store', headers: IFSC_HEADERS })
      console.log('IFSC results status:', res.status)
      if (!res.ok) return NextResponse.json({ error: `IFSC API error: ${res.status}` }, { status: 502 })

      const data: IFSCResultResponse = await res.json()

      if (data.status === 'pending') {
        return NextResponse.json({ error: 'Compétition pas encore disputée (status: pending)' }, { status: 400 })
      }
      if (!data.ranking || data.ranking.length === 0) {
        return NextResponse.json({ error: 'Aucun résultat disponible' }, { status: 400 })
      }

      const top8 = data.ranking.sort((a, b) => a.rank - b.rank).slice(0, 8)
      if (top8.length < 8) {
        return NextResponse.json({ error: `Seulement ${top8.length} finalistes trouvés` }, { status: 400 })
      }

      const formatName = (e: IFSCRankingEntry) => `${e.firstname} ${e.lastname}`

      const payload: Record<string, string> = {
        competition_id: competitionId,
        genre,
        rank1: formatName(top8[0]),
        rank2: formatName(top8[1]),
        rank3: formatName(top8[2]),
        rank4: formatName(top8[3]),
        rank5: formatName(top8[4]),
        rank6: formatName(top8[5]),
        rank7: formatName(top8[6]),
        rank8: formatName(top8[7]),
      }

      if (mode === 'finale') {
        payload.podium_gold   = formatName(top8[0])
        payload.podium_silver = formatName(top8[1])
        payload.podium_bronze = formatName(top8[2])
      }

      const { error } = await supabase
        .from('resultats_officiels')
        .upsert(payload, { onConflict: 'competition_id,genre' })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({
        success: true,
        message: `Synchronisé : ${top8.map(formatName).join(', ')}`,
        top8: top8.map(e => ({ rank: e.rank, name: formatName(e), country: e.country })),
      })
    }

    // ===== ACTION : SYNC INSCRITS =====
if (action === 'sync-registrations') {
  const url = `${IFSC_BASE_URL}/events/${config.eventId}/registrations`
  const res = await fetch(url, { cache: 'no-store', headers: IFSC_HEADERS })
  console.log('IFSC registrations status:', res.status)
  if (!res.ok) return NextResponse.json({ error: `IFSC API error: ${res.status}` }, { status: 502 })

  const registrations: IFSCAthlete[] = await res.json()

  const hommes = registrations.filter(a => a.d_cats.some(d => d.id === 3))
  const femmes = registrations.filter(a => a.d_cats.some(d => d.id === 7))

  const formatName = (a: IFSCAthlete) => `${a.firstname} ${a.lastname}`

  // Fonction pour calculer les stats boulder d'un athlète
  const getAthleteStats = async (athleteId: number) => {
    try {
      const res = await fetch(`${IFSC_BASE_URL}/athletes/${athleteId}`, {
        cache: 'no-store',
        headers: IFSC_HEADERS,
      })
      if (!res.ok) return { photo_url: null, best_result_recent: null, best_result_alltime: null }

      const data = await res.json()

      const photo_url = data.photo_url || null

      // Filtrer uniquement les résultats boulder en senior
      const boulderResults = (data.all_results || []).filter((r: any) =>
        r.discipline === 'boulder' && r.category_name === 'Women' || r.category_name === 'Men'
      )

      // Priorité des événements pour all time
      const eventPriority = (name: string) => {
        if (name.toLowerCase().includes('olympic')) return 4
        if (name.toLowerCase().includes('world championship') || name.toLowerCase().includes('world championships')) return 3
        if (name.toLowerCase().includes('world cup')) return 2
        return 1
      }

      // Best recent : meilleur rang parmi les 5 derniers événements boulder
      const recent5 = boulderResults.slice(0, 5)
      let best_result_recent = null
      if (recent5.length > 0) {
        const best = recent5.reduce((a: any, b: any) => {
          if (a.rank !== b.rank) return a.rank < b.rank ? a : b
          return eventPriority(a.event_name) >= eventPriority(b.event_name) ? a : b
        })
        best_result_recent = `#${best.rank} ${best.event_name.replace(/IFSC (Climbing )?World Cup /i, 'WC ').replace(/IFSC (Climbing )?World Championships? /i, 'WCh ').substring(0, 40)}`
      }

      // Best all time : meilleur rang tous temps boulder
      let best_result_alltime = null
      if (boulderResults.length > 0) {
        const best = boulderResults.reduce((a: any, b: any) => {
          if (a.rank !== b.rank) return a.rank < b.rank ? a : b
          return eventPriority(a.event_name) >= eventPriority(b.event_name) ? a : b
        })
        best_result_alltime = `#${best.rank} ${best.event_name.replace(/IFSC (Climbing )?World Cup /i, 'WC ').replace(/IFSC (Climbing )?World Championships? /i, 'WCh ').substring(0, 40)}`
      }

      return { photo_url, best_result_recent, best_result_alltime }
    } catch {
      return { photo_url: null, best_result_recent: null, best_result_alltime: null }
    }
  }

  // Construire les rows avec stats (en parallèle par batch de 5 pour pas surcharger)
  const allAthletes = [
    ...hommes.map(a => ({ ...a, genre: 'hommes' })),
    ...femmes.map(a => ({ ...a, genre: 'femmes' })),
  ]

  const rows = []
  for (let i = 0; i < allAthletes.length; i += 5) {
    const batch = allAthletes.slice(i, i + 5)
    const batchResults = await Promise.all(
      batch.map(async a => {
        const stats = await getAthleteStats(a.athlete_id)
        const name = formatName(a)
        return {
          competition_id: competitionId,
          genre: a.genre,
          name,
          country: a.country,
          world_ranking: worldRankings[name] ?? 999,
          athlete_id: a.athlete_id,
          photo_url: stats.photo_url,
          best_result_recent: stats.best_result_recent,
          best_result_alltime: stats.best_result_alltime,
        }
      })
    )
    rows.push(...batchResults)
    console.log(`Traité ${Math.min(i + 5, allAthletes.length)}/${allAthletes.length} athlètes`)
  }

  await supabase.from('athletes').delete().eq('competition_id', competitionId)
  const { error } = await supabase.from('athletes').insert(rows)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    message: `${hommes.length} hommes et ${femmes.length} femmes synchronisés avec photos et stats`,
  })
}

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })

  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}