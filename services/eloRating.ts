import { ELO_CONFIG } from '../constants/GameRules';

/**
 * Simple Elo Rating System for Table Tennis
 *
 * Standard configuration imported from GameRules:
 * - Starting rating: 1200
 * - K-factor: 32 (standard for most competitive games)
 * - Rating floor: 100 (minimum rating)
 */

export interface EloResult {
  player1NewRating: number;
  player2NewRating: number;
  player1Change: number;
  player2Change: number;
}

export interface MatchScore {
  player1Sets: number;
  player2Sets: number;
  setScores: Array<{
    player1Score: number;
    player2Score: number;
  }>;
}

export class EloRatingService {
  private static readonly K_FACTOR = ELO_CONFIG.K_FACTOR;
  private static readonly K_FACTOR_PROVISIONAL = ELO_CONFIG.K_FACTOR_PROVISIONAL;
  private static readonly PROVISIONAL_GAMES = ELO_CONFIG.PROVISIONAL_GAMES;
  private static readonly STARTING_RATING = ELO_CONFIG.DEFAULT_RATING;
  private static readonly MIN_RATING = ELO_CONFIG.MIN_RATING;

  /**
   * Calculate expected score for a player
   */
  private static calculateExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Calculate new ratings after a match
   * @param player1Rating Current rating of player 1
   * @param player2Rating Current rating of player 2
   * @param player1Won True if player 1 won, false if player 2 won
   * @param player1Games Number of games played by player 1 (for provisional K-factor)
   * @param player2Games Number of games played by player 2 (for provisional K-factor)
   * @returns New ratings and changes for both players
   */
  static calculateNewRatings(
    player1Rating: number,
    player2Rating: number,
    player1Won: boolean,
    player1Games: number = 0,
    player2Games: number = 0
  ): EloResult {
    const expectedScore1 = this.calculateExpectedScore(player1Rating, player2Rating);
    const expectedScore2 = this.calculateExpectedScore(player2Rating, player1Rating);

    const actualScore1 = player1Won ? 1 : 0;
    const actualScore2 = player1Won ? 0 : 1;

    // Use higher K-factor for provisional players (first 10 games)
    const kFactor1 = player1Games < this.PROVISIONAL_GAMES ? this.K_FACTOR_PROVISIONAL : this.K_FACTOR;
    const kFactor2 = player2Games < this.PROVISIONAL_GAMES ? this.K_FACTOR_PROVISIONAL : this.K_FACTOR;

    const change1 = Math.round(kFactor1 * (actualScore1 - expectedScore1));
    const change2 = Math.round(kFactor2 * (actualScore2 - expectedScore2));

    const newRating1 = Math.max(this.MIN_RATING, player1Rating + change1);
    const newRating2 = Math.max(this.MIN_RATING, player2Rating + change2);

    return {
      player1NewRating: newRating1,
      player2NewRating: newRating2,
      player1Change: change1,
      player2Change: change2,
    };
  }

  /**
   * Get the standard starting rating
   */
  static getStartingRating(): number {
    return this.STARTING_RATING;
  }

  /**
   * Calculate win probability for player 1
   */
  static calculateWinProbability(player1Rating: number, player2Rating: number): number {
    return this.calculateExpectedScore(player1Rating, player2Rating);
  }

  /**
   * Calculate match competitiveness factor based on scores
   * Returns a multiplier for K-factor (0.8 - 1.2)
   */
  private static calculateCompetitiveFactor(matchScore: MatchScore): number {
    const { setScores } = matchScore;
    
    if (setScores.length === 0) return 1.0; // No score data, use normal K-factor
    
    let totalCloseGames = 0;
    let totalGames = setScores.length;
    
    // Analyze each set for competitiveness
    for (const set of setScores) {
      const diff = Math.abs(set.player1Score - set.player2Score);
      
      // Close games: difference of 2 points or less, or deuce games (both >10)
      if (diff <= 2 || (set.player1Score > 10 && set.player2Score > 10)) {
        totalCloseGames++;
      }
    }
    
    const closenessRatio = totalCloseGames / totalGames;
    
    // Competitive matches (high closeness) get higher K-factor (up to 1.2x)
    // Blowout matches get lower K-factor (down to 0.8x)
    return 0.8 + (closenessRatio * 0.4);
  }

  /**
   * Enhanced rating calculation with match score consideration
   */
  static calculateNewRatingsWithScore(
    player1Rating: number,
    player2Rating: number,
    player1Won: boolean,
    matchScore: MatchScore,
    player1Games: number = 0,
    player2Games: number = 0
  ): EloResult {
    const expectedScore1 = this.calculateExpectedScore(player1Rating, player2Rating);
    const expectedScore2 = this.calculateExpectedScore(player2Rating, player1Rating);

    const actualScore1 = player1Won ? 1 : 0;
    const actualScore2 = player1Won ? 0 : 1;

    // Base K-factors (provisional vs established)
    const baseKFactor1 = player1Games < this.PROVISIONAL_GAMES ? this.K_FACTOR_PROVISIONAL : this.K_FACTOR;
    const baseKFactor2 = player2Games < this.PROVISIONAL_GAMES ? this.K_FACTOR_PROVISIONAL : this.K_FACTOR;

    // Apply competitiveness multiplier
    const competitiveFactor = this.calculateCompetitiveFactor(matchScore);
    const kFactor1 = Math.round(baseKFactor1 * competitiveFactor);
    const kFactor2 = Math.round(baseKFactor2 * competitiveFactor);

    const change1 = Math.round(kFactor1 * (actualScore1 - expectedScore1));
    const change2 = Math.round(kFactor2 * (actualScore2 - expectedScore2));

    const newRating1 = Math.max(this.MIN_RATING, player1Rating + change1);
    const newRating2 = Math.max(this.MIN_RATING, player2Rating + change2);

    return {
      player1NewRating: newRating1,
      player2NewRating: newRating2,
      player1Change: change1,
      player2Change: change2,
    };
  }

  /**
   * Get match competitiveness description
   */
  static getMatchCompetitivenessDescription(matchScore: MatchScore): string {
    const factor = this.calculateCompetitiveFactor(matchScore);
    
    if (factor >= 1.1) return 'Highly Competitive';
    if (factor >= 0.95) return 'Competitive';
    if (factor >= 0.9) return 'Somewhat Competitive';
    return 'One-sided';
  }
}