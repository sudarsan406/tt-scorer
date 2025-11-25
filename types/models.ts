export interface Player {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1: Player;
  player2: Player;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  bestOf: number; // 3, 5, 7 sets
  currentSet: number;
  player1Sets: number;
  player2Sets: number;
  winnerId?: string;
  notes?: string;
  location?: string;
  isDoubles?: boolean;
  team1Name?: string;
  team2Name?: string;
  sets?: GameSet[]; // Detailed set scores
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSet {
  id: string;
  matchId: string;
  setNumber: number;
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  setId: string;
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  server: string;
  winnerId?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Point {
  id: string;
  gameId: string;
  pointNumber: number;
  scorerId: string;
  player1Score: number;
  player2Score: number;
  rallyLength?: number;
  shotType?: string;
  isWinner: boolean;
  isError: boolean;
  timestamp: Date;
}


export interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  participants: Player[];
  matches: Match[];
  matchStats?: { completed: number; total: number };
  winnerId?: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  bestOf?: number; // 3, 5, 7 sets - defaults to 3
  isDoubles?: boolean; // Support for doubles tournaments
  roundRobinRounds?: number; // Number of times each player/team plays each other (default: 1)
  createdAt: Date;
  updatedAt: Date;
}

export type StatsPeriod = '7d' | '30d' | '3m' | '6m' | '1y';

export interface PlayerStatistics {
  playerId: string;
  player?: Player;
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  setsWon: number;
  setsLost: number;
  setsPercentage: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
  recentMatches: RecentMatch[];
  period?: string;
}

export interface RecentMatch {
  id: string;
  opponent: string;
  isWin: boolean;
  score: string;
  date: string;
}

export interface TrendingStats {
  period: StatsPeriod;
  label: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  setsWon: number;
  setsLost: number;
  setsPercentage: number;
}

export interface OverallStatistics {
  totalPlayers: number;
  totalMatches: number;
  completedMatches: number;
  totalTournaments: number;
  completedTournaments: number;
}