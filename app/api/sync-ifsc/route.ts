// app/api/sync-ifsc/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const IFSC_BASE_URL = 'https://ifsc.results.info/api/v1'

const IFSC_CONFIG: Record<string, { eventId: number; finale: { men: number; women: number }; semis: { men: number; women: number } }> = {
  'keqiao-2026': { 
    eventId: 1524, 
    finale: { men: 10661, women: 10662 },
    semis:  { men: 10659, women: 10660 },
  },
  'berne-2026':     { eventId: 1478, finale: { men: 10667, women: 10668 }, semis: { men: 10665, women: 10666 } },
  'madrid-2026':    { eventId: 1479, finale: { men: 10671, women: 10672 }, semis: { men: 10669, women: 10670 } },
  'prague-2026':    { eventId: 1480, finale: { men: 10677, women: 10678 }, semis: { men: 10675, women: 10676 } },
  'innsbruck-2026': { eventId: 1482, finale: { men: 10681, women: 10682 }, semis: { men: 10679, women: 10680 } },
  'saltlake-2026':  { eventId: 1488, finale: { men: 0, women: 0 }, semis: { men: 0, women: 0 } },
}


// Types IFSC
type IFSCRankingEntry = {
  rank: number
  firstname: string
  lastname: string
  country: string
  score: string
  athlete_id: number
}

type IFSCResponse = {
  status: 'finished' | 'pending' | 'active'
  ranking: IFSCRankingEntry[]
  round: string
  category: string
  event: string
}

async function fetchIFSCRound(roundId: number): Promise<IFSCResponse | null> {
  const url = `${IFSC_BASE_URL}/category_rounds/${roundId}/results`
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://ifsc.results.info/',
        'Origin': 'https://ifsc.results.info',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })
    console.log('IFSC status:', res.status)
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('IFSC fetch error:', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { competitionId, genre, mode } = await req.json()
// mode = "semis" | "finale"
    // competitionId = ex: "keqiao-2026"
    // genre = "hommes" | "femmes"

    // Vérif admin via header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const config = IFSC_CONFIG[competitionId]
    if (!config) {
      return NextResponse.json({ error: 'Compétition inconnue' }, { status: 400 })
    }

    const roundConfig = mode === 'semis' ? config.semis : config.finale
    const roundId = genre === 'hommes' ? roundConfig.men : roundConfig.women
    if (!roundId) {
      return NextResponse.json({ error: 'Round ID non configuré pour cette compétition' }, { status: 400 })
    }

    // Appel API IFSC
    const data = await fetchIFSCRound(roundId)
    if (!data) {
      return NextResponse.json({ error: 'Impossible de contacter l\'API IFSC' }, { status: 502 })
    }

    if (data.status === 'pending') {
      return NextResponse.json({ 
        error: 'La compétition n\'a pas encore eu lieu (status: pending)' 
      }, { status: 400 })
    }

    if (!data.ranking || data.ranking.length === 0) {
      return NextResponse.json({ error: 'Aucun résultat disponible' }, { status: 400 })
    }

    // Trier par rank et prendre le top 8
    const top8 = data.ranking
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 8)

    if (top8.length < 8) {
      return NextResponse.json({ 
        error: `Seulement ${top8.length} finalistes trouvés (8 attendus)` 
      }, { status: 400 })
    }

    // Formater les noms : "Firstname LASTNAME"
    const formatName = (entry: IFSCRankingEntry) => 
      `${entry.firstname} ${entry.lastname}`

    // Construire l'objet pour resultats_officiels
    const payload = {
      competition_id: competitionId,
      genre: genre,
      rank1: formatName(top8[0]),
      rank2: formatName(top8[1]),
      rank3: formatName(top8[2]),
      rank4: formatName(top8[3]),
      rank5: formatName(top8[4]),
      rank6: formatName(top8[5]),
      rank7: formatName(top8[6]),
      rank8: formatName(top8[7]),
      // Podium seulement si finale
      ...(mode === 'finale' ? {
        podium_gold:   formatName(top8[0]),
        podium_silver: formatName(top8[1]),
        podium_bronze: formatName(top8[2]),
      } : {}),
    }

    // Upsert dans Supabase
    const { error } = await supabase
      .from('resultats_officiels')
      .upsert(payload, { onConflict: 'competition_id,genre' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisé : ${top8.map(formatName).join(', ')}`,
      top8: top8.map(e => ({ rank: e.rank, name: formatName(e), country: e.country })),
    })

  } catch (err) {
    console.error('Sync IFSC error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}