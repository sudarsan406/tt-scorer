/**
 * Game Rules and Configuration Constants
 *
 * Centralizes all magic numbers and hard-coded values for easier maintenance
 * and consistent application of game rules across the application.
 */

export const ELO_CONFIG = {
  /** Default Elo rating for new players */
  DEFAULT_RATING: 1200,

  /** Minimum allowed Elo rating */
  MIN_RATING: 100,

  /** Maximum reasonable Elo rating */
  MAX_RATING: 3000,

  /** K-factor for established players (games >= PROVISIONAL_GAMES) */
  K_FACTOR: 32,

  /** K-factor for provisional players (games < PROVISIONAL_GAMES) */
  K_FACTOR_PROVISIONAL: 50,

  /** Number of games before a player's rating is considered established */
  PROVISIONAL_GAMES: 10,
} as const;

export const MATCH_CONFIG = {
  /** Default best-of sets for matches */
  DEFAULT_BEST_OF: 3,

  /** Valid best-of options */
  VALID_BEST_OF: [1, 3, 5, 7] as const,

  /** Points required to win a set */
  POINTS_TO_WIN_SET: 11,

  /** Minimum margin required to win (deuce rule) */
  WIN_BY_MARGIN: 2,

  /** Maximum points in a set (safety limit) */
  MAX_POINTS_PER_SET: 50,
} as const;

export const TOURNAMENT_CONFIG = {
  /** Minimum players for single elimination tournament */
  MIN_PLAYERS_SINGLE_ELIMINATION: 4,

  /** Minimum players for round robin tournament */
  MIN_PLAYERS_ROUND_ROBIN: 3,

  /** Minimum players for king of court tournament */
  MIN_PLAYERS_KING_OF_COURT: 3,

  /** Default number of rounds in round robin */
  DEFAULT_ROUND_ROBIN_ROUNDS: 1,

  /** Valid round robin round counts */
  VALID_ROUND_ROBIN_ROUNDS: [1, 2, 3] as const,

  /** Default wins required to become king in King of Court */
  DEFAULT_KING_OF_COURT_WINS: 3,

  /** Valid player counts for single elimination (power of 2) */
  VALID_SINGLE_ELIMINATION_SIZES: [4, 8, 16, 32] as const,
} as const;

export const STATISTICS_CONFIG = {
  /** Available time periods for statistics filtering */
  STAT_PERIODS: ['7d', '30d', '3m', '6m', '1y'] as const,

  /** Labels for each statistics period */
  STAT_PERIOD_LABELS: {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '3m': 'Last 3 Months',
    '6m': 'Last 6 Months',
    '1y': 'Last Year',
  } as const,

  /** Days for each period */
  STAT_PERIOD_DAYS: {
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
  } as const,

  /** Default limit for recent matches display */
  DEFAULT_RECENT_MATCHES_LIMIT: 5,

  /** Default limit for Elo history */
  DEFAULT_ELO_HISTORY_LIMIT: 20,

  /** Default limit for trending data points */
  DEFAULT_TRENDING_LIMIT: 10,
} as const;

export const UI_CONFIG = {
  /** Primary theme color */
  PRIMARY_COLOR: '#2196F3',

  /** Trophy colors for podium positions */
  TROPHY_COLORS: {
    GOLD: '#FFD700',
    SILVER: '#C0C0C0',
    BRONZE: '#CD7F32',
  } as const,

  /** Background colors for podium positions */
  PODIUM_BACKGROUNDS: {
    FIRST: '#FFF9E6',
    SECOND: '#F5F5F5',
    THIRD: '#FFF5F0',
  } as const,
} as const;

export const VALIDATION_LIMITS = {
  /** Maximum player name length */
  MAX_PLAYER_NAME_LENGTH: 100,

  /** Minimum player name length */
  MIN_PLAYER_NAME_LENGTH: 1,

  /** Maximum tournament name length */
  MAX_TOURNAMENT_NAME_LENGTH: 200,

  /** Maximum tournament description length */
  MAX_TOURNAMENT_DESCRIPTION_LENGTH: 1000,

  /** Player name validation regex */
  PLAYER_NAME_REGEX: /^[a-zA-Z0-9\s\-']+$/,
} as const;
