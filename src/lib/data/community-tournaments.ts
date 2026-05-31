import { supabase } from '@/lib/supabase'
import type {
  CommunityPlayer,
  CommunityTournament,
  CommunityTournamentFormat,
  CommunityTournamentMatch,
  CommunityTournamentPlayer,
  CommunityTournamentRound,
  CommunityTournamentStatus,
  TournamentStandingRow,
} from '@/lib/types'
import { getCommunityPlayers } from '@/lib/data/communities'
import { generateAmericanoSchedule, suggestedAmericanoRounds } from '@/lib/tournament-pairing'
import { groupRoundRobinPairings } from '@/lib/championship-bracket'

function toTournament(row: Record<string, unknown>): CommunityTournament {
  return {
    id: row.id as string,
    communityId: row.community_id as string,
    name: row.name as string,
    description: row.description as string | null,
    format: row.format as CommunityTournamentFormat,
    status: row.status as CommunityTournamentStatus,
    pointsPerRound: row.points_per_round as number,
    roundsCount: row.rounds_count as number | null,
    courtCount: (row.court_count as number) ?? 1,
    prizePositions: (row.prize_positions as number) ?? 1,
    groupSetsPerMatch: (row.group_sets_per_match as number) ?? 1,
    bracketSetsPerMatch: (row.bracket_sets_per_match as number) ?? 3,
    courtNames: (row.court_names as string[] | null) ?? [],
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    winnerPlayerIds: (row.winner_player_ids as string[] | null) ?? null,
    coverUrl: row.cover_url as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  }
}

function toTournamentPlayer(row: Record<string, unknown>): CommunityTournamentPlayer {
  return {
    id: row.id as string,
    tournamentId: row.tournament_id as string,
    communityPlayerId: row.community_player_id as string,
    teamId: row.team_id as string | null,
    teamName: row.team_name as string | null,
    groupLabel: row.group_label as string | null,
    seed: row.seed as number | null,
    totalPoints: (row.total_points as number) ?? 0,
    pointsAgainst: (row.points_against as number) ?? 0,
    matchesPlayed: (row.matches_played as number) ?? 0,
    matchesWon: (row.matches_won as number) ?? 0,
  }
}

function toRound(row: Record<string, unknown>): CommunityTournamentRound {
  return {
    id: row.id as string,
    tournamentId: row.tournament_id as string,
    roundNumber: row.round_number as number,
    status: row.status as CommunityTournamentRound['status'],
    startedAt: row.started_at as string | null,
    completedAt: row.completed_at as string | null,
  }
}

function toMatch(row: Record<string, unknown>): CommunityTournamentMatch {
  return {
    id: row.id as string,
    roundId: row.round_id as string,
    tournamentId: row.tournament_id as string,
    courtLabel: row.court_label as string | null,
    team1PlayerIds: (row.team1_player_ids as string[]) ?? [],
    team2PlayerIds: (row.team2_player_ids as string[]) ?? [],
    team1Points: row.team1_points as number | null,
    team2Points: row.team2_points as number | null,
    sets: (row.sets as CommunityTournamentMatch['sets']) ?? null,
    stage: row.stage as CommunityTournamentMatch['stage'],
    groupLabel: row.group_label as string | null,
    bracketPosition: row.bracket_position as number | null,
    status: row.status as CommunityTournamentMatch['status'],
    createdAt: row.created_at as string,
  }
}

export async function listTournaments(communityId: string): Promise<CommunityTournament[]> {
  const { data, error } = await supabase
    .from('community_tournaments')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(toTournament)
}

export async function getTournament(id: string): Promise<CommunityTournament | null> {
  const { data, error } = await supabase
    .from('community_tournaments')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return toTournament(data)
}

export interface CreateTournamentInput {
  communityId: string
  name: string
  description?: string | null
  format: CommunityTournamentFormat
  pointsPerRound: number
  roundsCount?: number | null
  courtCount: number
  prizePositions: number
  groupSetsPerMatch?: number
  bracketSetsPerMatch?: number
  courtNames?: string[]
  startDate?: string | null
  endDate?: string | null
  createdBy?: string | null
  playerIds: string[] // community_player ids in seed order
  // Championship-only: 2 player ids per team in selection order.
  // teams[i] becomes Team i+1; first 4 teams go to group A, next 4 to B, etc.
  teams?: { name?: string; playerIds: string[] }[]
}

export async function createTournament(input: CreateTournamentInput): Promise<CommunityTournament> {
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const { data, error } = await supabase
    .from('community_tournaments')
    .insert({
      id,
      community_id: input.communityId,
      name: input.name,
      description: input.description ?? null,
      format: input.format,
      status: 'draft',
      points_per_round: input.pointsPerRound,
      rounds_count: input.roundsCount ?? null,
      court_count: input.courtCount,
      prize_positions: input.prizePositions,
      group_sets_per_match: input.groupSetsPerMatch ?? 1,
      bracket_sets_per_match: input.bracketSetsPerMatch ?? 3,
      court_names:
        input.courtNames && input.courtNames.length > 0
          ? input.courtNames
          : Array.from({ length: input.courtCount }, (_, i) => `Court ${i + 1}`),
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      created_by: input.createdBy ?? null,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create tournament')

  // Player rows. For championship, each player belongs to a team. Group assignment
  // happens later via the draw — so group_label stays NULL until then.
  if (input.format === 'championship' && input.teams && input.teams.length > 0) {
    const rows: Record<string, unknown>[] = []
    input.teams.forEach((team, teamIdx) => {
      const teamId = `team_${id}_${teamIdx + 1}`
      const teamName = team.name ?? `Team ${teamIdx + 1}`
      team.playerIds.forEach((pid, j) => {
        rows.push({
          id: `tp_${id}_${teamIdx + 1}_${j + 1}`,
          tournament_id: id,
          community_player_id: pid,
          team_id: teamId,
          team_name: teamName,
          group_label: null,
          seed: teamIdx + 1,
        })
      })
    })
    const { error: pErr } = await supabase.from('community_tournament_players').insert(rows)
    if (pErr) throw new Error(pErr.message)
  } else if (input.playerIds.length > 0) {
    const rows = input.playerIds.map((pid, i) => ({
      id: `tp_${id}_${i + 1}`,
      tournament_id: id,
      community_player_id: pid,
      seed: i + 1,
    }))
    const { error: pErr } = await supabase.from('community_tournament_players').insert(rows)
    if (pErr) throw new Error(pErr.message)
  }

  // Americano: pre-create all rounds and matches upfront (schedule is deterministic).
  if (input.format === 'americano') {
    const N = input.playerIds.length
    const C = input.courtCount
    const desiredRounds =
      input.roundsCount ??
      (N === C * 4 ? N - 1 : suggestedAmericanoRounds(N, C))
    const schedule = generateAmericanoSchedule(N, C, desiredRounds)
    const courtNames =
      input.courtNames && input.courtNames.length > 0
        ? input.courtNames
        : Array.from({ length: C }, (_, i) => `Court ${i + 1}`)

    const roundRows: Record<string, unknown>[] = []
    const matchRows: Record<string, unknown>[] = []

    schedule.forEach((round, rIdx) => {
      const roundNumber = rIdx + 1
      const roundId = `r_${id}_${roundNumber}`
      roundRows.push({
        id: roundId,
        tournament_id: id,
        round_number: roundNumber,
        status: 'pending',
      })
      round.matches.forEach((m, i) => {
        matchRows.push({
          id: `m_${roundId}_${i + 1}`,
          round_id: roundId,
          tournament_id: id,
          court_label: courtNames[i] ?? `Court ${i + 1}`,
          team1_player_ids: [input.playerIds[m.team1[0]], input.playerIds[m.team1[1]]],
          team2_player_ids: [input.playerIds[m.team2[0]], input.playerIds[m.team2[1]]],
        })
      })
    })
    if (roundRows.length > 0) {
      const { error: rErr } = await supabase.from('community_tournament_rounds').insert(roundRows)
      if (rErr) throw new Error(rErr.message)
    }
    if (matchRows.length > 0) {
      const { error: mErr } = await supabase.from('community_tournament_matches').insert(matchRows)
      if (mErr) throw new Error(mErr.message)
    }

    // Persist the actual round count we generated, so completion logic knows the cap.
    if (desiredRounds !== input.roundsCount) {
      await supabase
        .from('community_tournaments')
        .update({ rounds_count: schedule.length })
        .eq('id', id)
    }
  }

  // Championship: do NOT pre-create matches here. They are created after the
  // draw assigns each team to a group, in the draw endpoint.

  return toTournament(data)
}

// Used by the draw endpoint once all teams have a group assignment.
// Creates the group-stage matches and activates the tournament.
// Round-robin within each group, distributed across the tournament's courts.
export async function createGroupStageMatches(tournamentId: string): Promise<void> {
  const tournament = await getTournament(tournamentId)
  const courtNames =
    tournament && tournament.courtNames.length > 0
      ? tournament.courtNames
      : Array.from({ length: tournament?.courtCount ?? 1 }, (_, i) => `Court ${i + 1}`)
  const players = await getTournamentPlayers(tournamentId)
  // Group players by team_id
  const teamMap = new Map<string, { teamId: string; playerIds: string[]; groupLabel: string; teamName: string; seed: number }>()
  for (const p of players) {
    if (!p.teamId) continue
    if (!teamMap.has(p.teamId)) {
      teamMap.set(p.teamId, {
        teamId: p.teamId,
        playerIds: [],
        groupLabel: p.groupLabel ?? '',
        teamName: p.teamName ?? p.teamId,
        seed: p.seed ?? 0,
      })
    }
    teamMap.get(p.teamId)!.playerIds.push(p.communityPlayerId)
  }
  const teams = Array.from(teamMap.values())
  const byGroup: Record<string, typeof teams> = {}
  for (const t of teams) {
    if (!t.groupLabel) continue
    if (!byGroup[t.groupLabel]) byGroup[t.groupLabel] = []
    byGroup[t.groupLabel].push(t)
  }

  const roundRows: Record<string, unknown>[] = []
  const matchRows: Record<string, unknown>[] = []
  let roundIdx = 0
  // Counter used to distribute matches across available courts in round-robin.
  let courtIdx = 0
  for (const groupLabel of Object.keys(byGroup).sort()) {
    const groupTeams = byGroup[groupLabel]
    const roundId = `r_${tournamentId}_group_${groupLabel}`
    roundRows.push({
      id: roundId,
      tournament_id: tournamentId,
      round_number: roundIdx + 1,
      status: roundIdx === 0 ? 'active' : 'pending',
      started_at: roundIdx === 0 ? new Date().toISOString() : null,
    })
    const pairings = groupRoundRobinPairings()
    pairings.forEach((p, i) => {
      const t1 = groupTeams[p.team1Idx]
      const t2 = groupTeams[p.team2Idx]
      if (!t1 || !t2) return
      const courtName = courtNames[courtIdx % courtNames.length]
      courtIdx++
      matchRows.push({
        id: `m_${roundId}_${i + 1}`,
        round_id: roundId,
        tournament_id: tournamentId,
        court_label: courtName,
        team1_player_ids: t1.playerIds,
        team2_player_ids: t2.playerIds,
        stage: 'group',
        group_label: groupLabel,
      })
    })
    roundIdx++
  }
  if (roundRows.length > 0) {
    const { error: rErr } = await supabase.from('community_tournament_rounds').insert(roundRows)
    if (rErr) throw new Error(rErr.message)
  }
  if (matchRows.length > 0) {
    const { error: mErr } = await supabase.from('community_tournament_matches').insert(matchRows)
    if (mErr) throw new Error(mErr.message)
  }
  await supabase.from('community_tournaments').update({ status: 'active' }).eq('id', tournamentId)
}

export async function getTournamentPlayers(tournamentId: string): Promise<CommunityTournamentPlayer[]> {
  const { data, error } = await supabase
    .from('community_tournament_players')
    .select('*')
    .eq('tournament_id', tournamentId)
  if (error || !data) return []
  return data.map(toTournamentPlayer)
}

export async function getRounds(tournamentId: string): Promise<CommunityTournamentRound[]> {
  const { data, error } = await supabase
    .from('community_tournament_rounds')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round_number', { ascending: true })
  if (error || !data) return []
  return data.map(toRound)
}

export async function getRoundMatches(roundId: string): Promise<CommunityTournamentMatch[]> {
  const { data, error } = await supabase
    .from('community_tournament_matches')
    .select('*')
    .eq('round_id', roundId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map(toMatch)
}

export async function getTournamentMatches(tournamentId: string): Promise<CommunityTournamentMatch[]> {
  const { data, error } = await supabase
    .from('community_tournament_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map(toMatch)
}

export async function createRoundWithMatches(
  tournamentId: string,
  roundNumber: number,
  pairings: { team1: string[]; team2: string[]; courtLabel?: string | null }[]
): Promise<CommunityTournamentRound> {
  const roundId = `r_${tournamentId}_${roundNumber}`
  const { data, error } = await supabase
    .from('community_tournament_rounds')
    .insert({
      id: roundId,
      tournament_id: tournamentId,
      round_number: roundNumber,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create round')

  if (pairings.length > 0) {
    const rows = pairings.map((p, i) => ({
      id: `m_${roundId}_${i + 1}`,
      round_id: roundId,
      tournament_id: tournamentId,
      court_label: p.courtLabel ?? `Court ${i + 1}`,
      team1_player_ids: p.team1,
      team2_player_ids: p.team2,
    }))
    const { error: mErr } = await supabase.from('community_tournament_matches').insert(rows)
    if (mErr) throw new Error(mErr.message)
  }

  return toRound(data)
}

// Record set-based scores for a championship match. Determines the winner from set count
// and updates the match row. Does NOT update per-player point totals (championship uses
// match wins, not points).
export async function recordMatchSets(
  matchId: string,
  sets: { team1Games: number; team2Games: number; tiebreak?: { team1Points: number; team2Points: number } }[]
): Promise<void> {
  const { error } = await supabase
    .from('community_tournament_matches')
    .update({
      sets,
      status: 'completed',
    })
    .eq('id', matchId)
  if (error) throw new Error(error.message)
}

export async function recordMatchScore(
  matchId: string,
  team1Points: number,
  team2Points: number
): Promise<void> {
  // Fetch the match to know who plays
  const { data: matchRow } = await supabase
    .from('community_tournament_matches')
    .select('*')
    .eq('id', matchId)
    .single()
  if (!matchRow) throw new Error('Match not found')
  const match = toMatch(matchRow)

  await supabase
    .from('community_tournament_matches')
    .update({
      team1_points: team1Points,
      team2_points: team2Points,
      status: 'completed',
    })
    .eq('id', matchId)

  const winnerIds = team1Points > team2Points
    ? match.team1PlayerIds
    : team2Points > team1Points
    ? match.team2PlayerIds
    : []

  // Fetch all 4 affected player rows in a single query, then update them in parallel.
  const allIds = [...match.team1PlayerIds, ...match.team2PlayerIds]
  const { data: tpRows } = await supabase
    .from('community_tournament_players')
    .select('*')
    .eq('tournament_id', match.tournamentId)
    .in('community_player_id', allIds)
  const tpMap = new Map((tpRows ?? []).map((r) => [r.community_player_id as string, toTournamentPlayer(r)]))

  const updates: { ids: string[]; points: number; against: number; won: boolean }[] = [
    { ids: match.team1PlayerIds, points: team1Points, against: team2Points, won: team1Points > team2Points },
    { ids: match.team2PlayerIds, points: team2Points, against: team1Points, won: team2Points > team1Points },
  ]

  await Promise.all(
    updates.flatMap((u) =>
      u.ids.map(async (pid) => {
        const tp = tpMap.get(pid)
        if (!tp) return
        await supabase
          .from('community_tournament_players')
          .update({
            total_points: tp.totalPoints + u.points,
            points_against: tp.pointsAgainst + u.against,
            matches_played: tp.matchesPlayed + 1,
            matches_won: tp.matchesWon + (u.won ? 1 : 0),
          })
          .eq('id', tp.id)
      })
    )
  )

  void winnerIds
}

export async function completeRound(roundId: string): Promise<void> {
  await supabase
    .from('community_tournament_rounds')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', roundId)
}

export async function completeTournament(
  tournamentId: string,
  winnerPlayerIds: string[]
): Promise<void> {
  // Increment tournaments_won on community_players + tournament_player tournaments_won
  await supabase
    .from('community_tournaments')
    .update({
      status: 'completed',
      winner_player_ids: winnerPlayerIds,
      end_date: new Date().toISOString().slice(0, 10),
    })
    .eq('id', tournamentId)

  for (const pid of winnerPlayerIds) {
    const { data } = await supabase
      .from('community_players')
      .select('tournaments_won')
      .eq('id', pid)
      .single()
    if (!data) continue
    await supabase
      .from('community_players')
      .update({ tournaments_won: ((data.tournaments_won as number) ?? 0) + 1 })
      .eq('id', pid)
  }
}

export interface LeaderboardEntry {
  player: CommunityPlayer
  golds: number
  silvers: number
  bronzes: number
  total: number
}

// Aggregate podium finishes per player across every completed tournament in this community.
// For team-based formats, each position (1st, 2nd, 3rd) is two player IDs; for individual
// formats it's one ID. Only players who reached at least one podium appear.
export async function getCommunityLeaderboard(communityId: string): Promise<LeaderboardEntry[]> {
  const { data: tournaments } = await supabase
    .from('community_tournaments')
    .select('id, format, winner_player_ids')
    .eq('community_id', communityId)
    .eq('status', 'completed')

  const players = await getCommunityPlayers(communityId)
  const playerMap = new Map(players.map((p) => [p.id, p]))
  const counts = new Map<string, { golds: number; silvers: number; bronzes: number }>()

  for (const t of tournaments ?? []) {
    const winners = ((t as Record<string, unknown>).winner_player_ids as string[] | null) ?? []
    if (winners.length === 0) continue
    const format = (t as Record<string, unknown>).format as string
    const isTeam =
      format === 'championship' || format === 'team-americano' || format === 'team-mexicano'
    const groupSize = isTeam ? 2 : 1

    for (let pos = 0; pos < 3; pos++) {
      const ids = winners.slice(pos * groupSize, (pos + 1) * groupSize)
      for (const pid of ids) {
        if (!counts.has(pid)) counts.set(pid, { golds: 0, silvers: 0, bronzes: 0 })
        const c = counts.get(pid)!
        if (pos === 0) c.golds++
        else if (pos === 1) c.silvers++
        else if (pos === 2) c.bronzes++
      }
    }
  }

  const entries: LeaderboardEntry[] = []
  for (const [pid, c] of counts) {
    const player = playerMap.get(pid)
    if (!player) continue
    entries.push({
      player,
      golds: c.golds,
      silvers: c.silvers,
      bronzes: c.bronzes,
      total: c.golds + c.silvers + c.bronzes,
    })
  }

  entries.sort((a, b) => {
    if (b.golds !== a.golds) return b.golds - a.golds
    if (b.silvers !== a.silvers) return b.silvers - a.silvers
    if (b.bronzes !== a.bronzes) return b.bronzes - a.bronzes
    return b.total - a.total
  })

  return entries
}

export async function getStandings(tournamentId: string): Promise<TournamentStandingRow[]> {
  const tournament = await getTournament(tournamentId)
  if (!tournament) return []

  const tournamentPlayers = await getTournamentPlayers(tournamentId)
  const players = await getCommunityPlayers(tournament.communityId)
  const playerMap = new Map(players.map((p) => [p.id, p]))

  return tournamentPlayers
    .map((tp) => {
      const player = playerMap.get(tp.communityPlayerId)
      if (!player) return null
      return { player, tournamentPlayer: tp }
    })
    .filter((x): x is { player: CommunityPlayer; tournamentPlayer: CommunityTournamentPlayer } => x !== null)
    .sort((a, b) => {
      // 1. Total points desc
      if (b.tournamentPlayer.totalPoints !== a.tournamentPlayer.totalPoints) {
        return b.tournamentPlayer.totalPoints - a.tournamentPlayer.totalPoints
      }
      // 2. Matches won desc
      if (b.tournamentPlayer.matchesWon !== a.tournamentPlayer.matchesWon) {
        return b.tournamentPlayer.matchesWon - a.tournamentPlayer.matchesWon
      }
      // 3. Point differential desc (head-to-head skipped for now — complex with rotating partners)
      const aDiff = a.tournamentPlayer.totalPoints - a.tournamentPlayer.pointsAgainst
      const bDiff = b.tournamentPlayer.totalPoints - b.tournamentPlayer.pointsAgainst
      return bDiff - aDiff
    })
    .map((x, idx) => ({ ...x, rank: idx + 1 }))
}
