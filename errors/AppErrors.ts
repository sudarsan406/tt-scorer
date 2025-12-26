/**
 * Custom Error Classes for TT Scorer
 *
 * Provides structured error handling with error codes and contextual details.
 * This enables better error handling, logging, and user feedback.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

// ============================================================================
// Database Errors
// ============================================================================

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class DatabaseNotInitializedError extends DatabaseError {
  constructor() {
    super('Database has not been initialized', { code: 'DB_NOT_INITIALIZED' });
    this.name = 'DatabaseNotInitializedError';
    Object.setPrototypeOf(this, DatabaseNotInitializedError.prototype);
  }
}

// ============================================================================
// Player Errors
// ============================================================================

export class PlayerError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'PlayerError';
    Object.setPrototypeOf(this, PlayerError.prototype);
  }
}

export class PlayerNotFoundError extends PlayerError {
  constructor(playerId: string) {
    super(
      `Player with ID "${playerId}" not found`,
      'PLAYER_NOT_FOUND',
      { playerId }
    );
    this.name = 'PlayerNotFoundError';
    Object.setPrototypeOf(this, PlayerNotFoundError.prototype);
  }
}

export class PlayerHasMatchesError extends PlayerError {
  constructor(playerId: string, matchCount: number) {
    super(
      `Cannot delete player with ${matchCount} existing match${matchCount > 1 ? 'es' : ''}`,
      'PLAYER_HAS_MATCHES',
      { playerId, matchCount }
    );
    this.name = 'PlayerHasMatchesError';
    Object.setPrototypeOf(this, PlayerHasMatchesError.prototype);
  }
}

export class InvalidPlayerNameError extends PlayerError {
  constructor(name: string, reason: string) {
    super(
      `Invalid player name: ${reason}`,
      'INVALID_PLAYER_NAME',
      { name, reason }
    );
    this.name = 'InvalidPlayerNameError';
    Object.setPrototypeOf(this, InvalidPlayerNameError.prototype);
  }
}

// ============================================================================
// Match Errors
// ============================================================================

export class MatchError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'MatchError';
    Object.setPrototypeOf(this, MatchError.prototype);
  }
}

export class MatchNotFoundError extends MatchError {
  constructor(matchId: string) {
    super(
      `Match with ID "${matchId}" not found`,
      'MATCH_NOT_FOUND',
      { matchId }
    );
    this.name = 'MatchNotFoundError';
    Object.setPrototypeOf(this, MatchNotFoundError.prototype);
  }
}

export class MatchNotCompletedError extends MatchError {
  constructor(matchId: string) {
    super(
      'Cannot perform this operation on an incomplete match',
      'MATCH_NOT_COMPLETED',
      { matchId }
    );
    this.name = 'MatchNotCompletedError';
    Object.setPrototypeOf(this, MatchNotCompletedError.prototype);
  }
}

export class InvalidMatchScoreError extends MatchError {
  constructor(reason: string, details?: any) {
    super(
      `Invalid match score: ${reason}`,
      'INVALID_MATCH_SCORE',
      details
    );
    this.name = 'InvalidMatchScoreError';
    Object.setPrototypeOf(this, InvalidMatchScoreError.prototype);
  }
}

// ============================================================================
// Tournament Errors
// ============================================================================

export class TournamentError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'TournamentError';
    Object.setPrototypeOf(this, TournamentError.prototype);
  }
}

export class TournamentNotFoundError extends TournamentError {
  constructor(tournamentId: string) {
    super(
      `Tournament with ID "${tournamentId}" not found`,
      'TOURNAMENT_NOT_FOUND',
      { tournamentId }
    );
    this.name = 'TournamentNotFoundError';
    Object.setPrototypeOf(this, TournamentNotFoundError.prototype);
  }
}

export class TournamentHasCompletedMatchesError extends TournamentError {
  constructor(matchCount: number) {
    super(
      `Cannot delete tournament with ${matchCount} completed match${matchCount > 1 ? 'es' : ''}. ` +
      'Player Elo ratings have already been affected by these matches. ' +
      'Only tournaments with no completed matches can be deleted.',
      'TOURNAMENT_HAS_COMPLETED_MATCHES',
      { matchCount }
    );
    this.name = 'TournamentHasCompletedMatchesError';
    Object.setPrototypeOf(this, TournamentHasCompletedMatchesError.prototype);
  }
}

export class InvalidTournamentFormatError extends TournamentError {
  constructor(format: string, validFormats: string[]) {
    super(
      `Invalid tournament format: "${format}". Valid formats: ${validFormats.join(', ')}`,
      'INVALID_TOURNAMENT_FORMAT',
      { format, validFormats }
    );
    this.name = 'InvalidTournamentFormatError';
    Object.setPrototypeOf(this, InvalidTournamentFormatError.prototype);
  }
}

export class InsufficientPlayersError extends TournamentError {
  constructor(format: string, playerCount: number, minimumRequired: number) {
    super(
      `Insufficient players for ${format} tournament. Got ${playerCount}, need at least ${minimumRequired}.`,
      'INSUFFICIENT_PLAYERS',
      { format, playerCount, minimumRequired }
    );
    this.name = 'InsufficientPlayersError';
    Object.setPrototypeOf(this, InsufficientPlayersError.prototype);
  }
}

export class TournamentMatchNotReadyError extends TournamentError {
  constructor(matchId: string, reason: string) {
    super(
      `Tournament match not ready: ${reason}`,
      'TOURNAMENT_MATCH_NOT_READY',
      { matchId, reason }
    );
    this.name = 'TournamentMatchNotReadyError';
    Object.setPrototypeOf(this, TournamentMatchNotReadyError.prototype);
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends AppError {
  constructor(
    message: string,
    public field: string,
    public value: any,
    details?: any
  ) {
    super(message, 'VALIDATION_ERROR', { field, value, ...details });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class InvalidEmailError extends ValidationError {
  constructor(email: string) {
    super(
      'Invalid email format',
      'email',
      email
    );
    this.name = 'InvalidEmailError';
    Object.setPrototypeOf(this, InvalidEmailError.prototype);
  }
}

export class InvalidRatingError extends ValidationError {
  constructor(rating: number, min: number, max: number) {
    super(
      `Rating must be between ${min} and ${max}`,
      'rating',
      rating,
      { min, max }
    );
    this.name = 'InvalidRatingError';
    Object.setPrototypeOf(this, InvalidRatingError.prototype);
  }
}

// ============================================================================
// Export Errors
// ============================================================================

export class ExportError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'EXPORT_ERROR', details);
    this.name = 'ExportError';
    Object.setPrototypeOf(this, ExportError.prototype);
  }
}

export class NoDataToExportError extends ExportError {
  constructor(dataType: string) {
    super(
      `No ${dataType} data available to export`,
      { dataType }
    );
    this.name = 'NoDataToExportError';
    Object.setPrototypeOf(this, NoDataToExportError.prototype);
  }
}

export class ExportPermissionError extends ExportError {
  constructor(platform: string) {
    super(
      `Unable to share file on ${platform}. Please check app permissions.`,
      { platform }
    );
    this.name = 'ExportPermissionError';
    Object.setPrototypeOf(this, ExportPermissionError.prototype);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get a user-friendly error message from any error
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Get error code from any error (returns 'UNKNOWN' for non-AppErrors)
 */
export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}
