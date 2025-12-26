/**
 * Zod Validation Schemas for TT Scorer
 *
 * Provides runtime type validation and transformation for all data inputs.
 * These schemas ensure data integrity before it reaches the database.
 */

import { z } from 'zod';
import { ELO_CONFIG, MATCH_CONFIG, TOURNAMENT_CONFIG, VALIDATION_LIMITS } from '../constants/GameRules';

// ============================================================================
// Player Schemas
// ============================================================================

export const PlayerSchema = z.object({
  name: z.string()
    .min(VALIDATION_LIMITS.MIN_PLAYER_NAME_LENGTH, 'Player name is required')
    .max(VALIDATION_LIMITS.MAX_PLAYER_NAME_LENGTH, `Player name must be less than ${VALIDATION_LIMITS.MAX_PLAYER_NAME_LENGTH} characters`)
    .regex(VALIDATION_LIMITS.PLAYER_NAME_REGEX, 'Player name can only contain letters, numbers, spaces, hyphens, and apostrophes')
    .transform(str => str.trim()),

  email: z.string()
    .email('Invalid email format')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val === '' ? null : val),

  avatar: z.string()
    .url('Avatar must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val === '' ? null : val),

  rating: z.number()
    .int('Rating must be an integer')
    .min(ELO_CONFIG.MIN_RATING, `Rating cannot be below ${ELO_CONFIG.MIN_RATING}`)
    .max(ELO_CONFIG.MAX_RATING, `Rating cannot exceed ${ELO_CONFIG.MAX_RATING}`)
    .default(ELO_CONFIG.DEFAULT_RATING)
    .optional(),
});

export type CreatePlayerDto = z.infer<typeof PlayerSchema>;

export const UpdatePlayerSchema = PlayerSchema.partial();
export type UpdatePlayerDto = z.infer<typeof UpdatePlayerSchema>;

// ============================================================================
// Match Schemas
// ============================================================================

export const CreateMatchSchema = z.object({
  player1Id: z.string().uuid('Invalid player1 ID format'),
  player2Id: z.string().uuid('Invalid player2 ID format'),

  scheduledAt: z.date().optional().nullable(),

  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .default('scheduled'),

  bestOf: z.number()
    .int('Best of must be an integer')
    .refine(val => MATCH_CONFIG.VALID_BEST_OF.includes(val as any), {
      message: `Best of must be one of: ${MATCH_CONFIG.VALID_BEST_OF.join(', ')}`
    })
    .default(MATCH_CONFIG.DEFAULT_BEST_OF),

  isDoubles: z.boolean().default(false).optional(),

  team1Name: z.string()
    .max(200, 'Team name too long')
    .optional()
    .nullable(),

  team2Name: z.string()
    .max(200, 'Team name too long')
    .optional()
    .nullable(),

  player1Sets: z.number().int().min(0).default(0).optional(),
  player2Sets: z.number().int().min(0).default(0).optional(),
  currentSet: z.number().int().min(1).default(1).optional(),

  startedAt: z.date().optional().nullable(),
}).refine(data => data.player1Id !== data.player2Id, {
  message: 'Player 1 and Player 2 must be different players',
  path: ['player2Id'],
});

export type CreateMatchDto = z.infer<typeof CreateMatchSchema>;

export const GameSetScoreSchema = z.object({
  player1Score: z.number()
    .int('Score must be an integer')
    .min(0, 'Score cannot be negative')
    .max(MATCH_CONFIG.MAX_POINTS_PER_SET, 'Score exceeds maximum'),

  player2Score: z.number()
    .int('Score must be an integer')
    .min(0, 'Score cannot be negative')
    .max(MATCH_CONFIG.MAX_POINTS_PER_SET, 'Score exceeds maximum'),
}).refine(data => {
  const { player1Score, player2Score } = data;
  const winThreshold = MATCH_CONFIG.POINTS_TO_WIN_SET;
  const margin = MATCH_CONFIG.WIN_BY_MARGIN;

  // One player must reach win threshold
  if (player1Score < winThreshold && player2Score < winThreshold) {
    return false;
  }

  // Winner must win by required margin
  const diff = Math.abs(player1Score - player2Score);
  if (player1Score >= winThreshold || player2Score >= winThreshold) {
    return diff >= margin;
  }

  return true;
}, {
  message: `A set must be won by reaching ${MATCH_CONFIG.POINTS_TO_WIN_SET} points with a ${MATCH_CONFIG.WIN_BY_MARGIN}-point margin`,
});

export type GameSetScoreDto = z.infer<typeof GameSetScoreSchema>;

// ============================================================================
// Tournament Schemas
// ============================================================================

export const CreateTournamentSchema = z.object({
  name: z.string()
    .min(1, 'Tournament name is required')
    .max(VALIDATION_LIMITS.MAX_TOURNAMENT_NAME_LENGTH, `Tournament name must be less than ${VALIDATION_LIMITS.MAX_TOURNAMENT_NAME_LENGTH} characters`)
    .transform(str => str.trim()),

  description: z.string()
    .max(VALIDATION_LIMITS.MAX_TOURNAMENT_DESCRIPTION_LENGTH, 'Description too long')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val === '' ? null : val),

  startDate: z.date(),

  endDate: z.date().optional().nullable(),

  status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled'])
    .default('upcoming'),

  format: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'king_of_court']),

  bestOf: z.number()
    .int('Best of must be an integer')
    .refine(val => MATCH_CONFIG.VALID_BEST_OF.includes(val as any), {
      message: `Best of must be one of: ${MATCH_CONFIG.VALID_BEST_OF.join(', ')}`
    })
    .default(MATCH_CONFIG.DEFAULT_BEST_OF)
    .optional(),

  isDoubles: z.boolean().default(false).optional(),

  roundRobinRounds: z.number()
    .int('Rounds must be an integer')
    .refine(val => TOURNAMENT_CONFIG.VALID_ROUND_ROBIN_ROUNDS.includes(val as any), {
      message: `Rounds must be one of: ${TOURNAMENT_CONFIG.VALID_ROUND_ROBIN_ROUNDS.join(', ')}`
    })
    .default(TOURNAMENT_CONFIG.DEFAULT_ROUND_ROBIN_ROUNDS)
    .optional(),

  kingOfCourtWins: z.number()
    .int('King of Court wins must be an integer')
    .min(1, 'Must require at least 1 win')
    .max(10, 'Maximum 10 consecutive wins')
    .default(TOURNAMENT_CONFIG.DEFAULT_KING_OF_COURT_WINS)
    .optional(),

  hasPlayoffs: z.boolean().optional().nullable(),
}).refine(data => {
  // Validate endDate is after startDate if provided
  if (data.endDate && data.startDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type CreateTournamentDto = z.infer<typeof CreateTournamentSchema>;

export const UpdateTournamentSchema = CreateTournamentSchema.partial();
export type UpdateTournamentDto = z.infer<typeof UpdateTournamentSchema>;

// ============================================================================
// Statistics Schemas
// ============================================================================

export const StatsPeriodSchema = z.enum(['7d', '30d', '3m', '6m', '1y']);
export type StatsPeriod = z.infer<typeof StatsPeriodSchema>;

// ============================================================================
// Helper Validation Functions
// ============================================================================

/**
 * Validate player count for tournament format
 */
export function validatePlayerCount(format: string, playerCount: number): {
  valid: boolean;
  error?: string;
} {
  switch (format) {
    case 'single_elimination':
      if (playerCount < TOURNAMENT_CONFIG.MIN_PLAYERS_SINGLE_ELIMINATION) {
        return {
          valid: false,
          error: `Single elimination requires at least ${TOURNAMENT_CONFIG.MIN_PLAYERS_SINGLE_ELIMINATION} players`
        };
      }
      // Check if power of 2
      const isPowerOfTwo = (playerCount & (playerCount - 1)) === 0;
      if (!isPowerOfTwo) {
        return {
          valid: false,
          error: `Single elimination requires a power of 2 players (4, 8, 16, 32, etc.). Got ${playerCount}.`
        };
      }
      break;

    case 'round_robin':
    case 'king_of_court':
      if (playerCount < TOURNAMENT_CONFIG.MIN_PLAYERS_ROUND_ROBIN) {
        return {
          valid: false,
          error: `${format} requires at least ${TOURNAMENT_CONFIG.MIN_PLAYERS_ROUND_ROBIN} players`
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Validate that IDs are proper UUIDs
 */
export const UUIDSchema = z.string().uuid('Invalid ID format');

/**
 * Validate rating is within acceptable range
 */
export function validateRating(rating: number): boolean {
  return rating >= ELO_CONFIG.MIN_RATING && rating <= ELO_CONFIG.MAX_RATING;
}
