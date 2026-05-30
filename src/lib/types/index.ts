// ─── Player ───────────────────────────────────────────────────────────────────

export type PlayerLevel = "beginner" | "intermediate" | "advanced" | "pro";
export type PlayerHand = "right" | "left";
export type PlayerPosition = "drive" | "revés" | "flexible";
export type PlayerGender = "male" | "female" | "other";

export interface PlayerStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  eloRating: number;
  currentStreak: number;
  tournamentsWon: number;
}

export interface Player {
  id: string;
  name: string;
  avatarUrl: string | null;
  level: PlayerLevel;
  hand: PlayerHand;
  position: PlayerPosition;
  gender?: PlayerGender;
  memberSince: string;
  stats: PlayerStats;
  contact: { email: string; phone?: string };
  onboardingDone?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  player: Player;
  winRate: number;
  trend: "up" | "down" | "stable";
}

// ─── Court ────────────────────────────────────────────────────────────────────

export type CourtSurface = "crystal" | "artificial-grass" | "concrete";
export type CourtType = "indoor" | "outdoor";

export interface Court {
  id: string;
  name: string;
  surface: CourtSurface;
  type: CourtType;
  isActive: boolean;
  pricePerHour: number;
  imageUrl: string | null;
  features: string[];
  location?: string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export type BookingStatus = "confirmed" | "pending" | "cancelled";

export interface Booking {
  id: string;
  courtId: string;
  playerIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
  totalPrice: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingId?: string;
}

// ─── Match & Scoring ──────────────────────────────────────────────────────────

export type MatchFormat = "best-of-3" | "single-set" | "pro-set";
export type MatchStatus = "scheduled" | "in-progress" | "completed" | "abandoned";
export type MatchType = "casual" | "ranked" | "tournament";

export interface SetScore {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  tiebreak?: { team1Points: number; team2Points: number };
}

export interface MatchTeam {
  playerIds: [string, string];
}

export interface Match {
  id: string;
  courtId: string;
  bookingId?: string;
  type: MatchType;
  format: MatchFormat;
  status: MatchStatus;
  team1: MatchTeam;
  team2: MatchTeam;
  sets: SetScore[];
  winnerId?: "team1" | "team2";
  date: string;
  startTime: string;
  durationMinutes?: number;
  tournamentId?: string;
  tournamentRound?: string;
  eloChanges?: { [playerId: string]: number };
}

// ─── Open Game ────────────────────────────────────────────────────────────────

export type OpenGameStatus = "open" | "full" | "pending_result" | "completed" | "cancelled";
export type CourtBookingStatus = "not_booked" | "booked" | "failed";

export interface PendingScore {
  team1PlayerIds: [string, string];
  team2PlayerIds: [string, string];
  sets: SetScore[];
}

export interface OpenGame {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  createdBy: string;
  eloMin?: number;
  eloMax?: number;
  playerIds: string[];
  maxPlayers: number;
  notes?: string;
  status: OpenGameStatus;
  courtBookingStatus: CourtBookingStatus;
  gameType: "friendly" | "ranked";
  isPrivate: boolean;
  invitedPlayerIds?: string[];
  joinCode?: string;
  teams?: { team1: string[]; team2: string[] };
  pendingScore?: PendingScore;
  submittedBy?: string;
  matchId?: string;
  createdAt: string;
  waitlistCount?: number;
  myWaitlistPosition?: number | null;
}

// ─── Tournament ───────────────────────────────────────────────────────────────

export type TournamentStatus = "upcoming" | "registration" | "active" | "completed";
export type TournamentFormat = "knockout" | "round-robin" | "group-then-knockout";

export interface TournamentPrize {
  place: number;
  description: string;
  value?: number;
}

export interface GroupStanding {
  teamPlayerIds: [string, string];
  matchesPlayed: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  points: number;
}

export interface TournamentGroup {
  groupName: string;
  teamIds: string[][];
  matches: string[];
  standings: GroupStanding[];
}

export interface TournamentBracketSlot {
  round: number;
  position: number;
  matchId?: string;
  team1PlayerIds?: [string, string];
  team2PlayerIds?: [string, string];
  winnerId?: "team1" | "team2";
}

// ─── Challenge ────────────────────────────────────────────────────────────────

export type ChallengeStatus = "pending" | "accepted" | "declined" | "expired";

export interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  courtId: string;
  proposedDate: string;
  proposedTime: string;
  matchType: "casual" | "ranked";
  message?: string;
  status: ChallengeStatus;
  createdAt: string;
}

// ─── Community ────────────────────────────────────────────────────────────────

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
}

export interface CommunityPlayer {
  id: string;
  communityId: string;
  name: string;
  avatarUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  linkedUserId: string | null;
  linkedPlayerId: string | null;
  ntrp: number | null;
  eloRating: number;
  matchesPlayed: number;
  matchesWon: number;
  tournamentsWon: number;
  createdAt: string;
}

export interface CommunityAdmin {
  communityId: string;
  userId: string;
  createdAt: string;
}

export interface CommunitySummary extends Community {
  playerCount: number;
}

export type CommunityTournamentFormat =
  | "americano"
  | "mexicano"
  | "team-americano"
  | "team-mexicano"
  | "championship";

export type CommunityTournamentStatus = "draft" | "active" | "completed" | "cancelled";

export interface CommunityTournament {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  format: CommunityTournamentFormat;
  status: CommunityTournamentStatus;
  pointsPerRound: number;
  roundsCount: number | null;
  courtCount: number;
  prizePositions: number;
  groupSetsPerMatch: number;
  bracketSetsPerMatch: number;
  courtNames: string[];
  startDate: string | null;
  endDate: string | null;
  winnerPlayerIds: string[] | null;
  coverUrl: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CommunityTournamentPlayer {
  id: string;
  tournamentId: string;
  communityPlayerId: string;
  teamId: string | null;
  teamName: string | null;
  groupLabel: string | null;
  seed: number | null;
  totalPoints: number;
  pointsAgainst: number;
  matchesPlayed: number;
  matchesWon: number;
}

export interface MatchSetScore {
  team1Games: number;
  team2Games: number;
  tiebreak?: { team1Points: number; team2Points: number };
}

export type ChampionshipStage =
  | "group"
  | "round-of-16"
  | "quarterfinal"
  | "semifinal"
  | "final"
  | "bronze";

export interface CommunityTournamentRound {
  id: string;
  tournamentId: string;
  roundNumber: number;
  status: "pending" | "active" | "completed";
  startedAt: string | null;
  completedAt: string | null;
}

export interface CommunityTournamentMatch {
  id: string;
  roundId: string;
  tournamentId: string;
  courtLabel: string | null;
  team1PlayerIds: string[];
  team2PlayerIds: string[];
  team1Points: number | null;
  team2Points: number | null;
  sets: MatchSetScore[] | null;
  stage: ChampionshipStage | null;
  groupLabel: string | null;
  bracketPosition: number | null;
  status: "pending" | "completed";
  createdAt: string;
}

export interface TournamentStandingRow {
  player: CommunityPlayer;
  tournamentPlayer: CommunityTournamentPlayer;
  rank: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  status: TournamentStatus;
  format: TournamentFormat;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  registeredTeams: string[][];
  courtIds: string[];
  prizes: TournamentPrize[];
  groups?: TournamentGroup[];
  bracket?: TournamentBracketSlot[];
  matchIds: string[];
  winnerId?: [string, string];
  imageUrl?: string;
}
