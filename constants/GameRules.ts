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

