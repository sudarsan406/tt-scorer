/**
 * Elo Rating Service Functional Tests
 *
 * Tests Elo rating calculations, provisional ratings, and score adjustments.
 */

import { EloRatingService } from '../../services/eloRating';

describe('EloRatingService - Functional Tests', () => {
  describe('Basic Elo Calculations', () => {
    it('should calculate new ratings when equal players play', () => {
      const result = EloRatingService.calculateNewRatings(1200, 1200, true);

      expect(result.player1NewRating).toBeGreaterThan(1200);
      expect(result.player2NewRating).toBeLessThan(1200);
      expect(result.player1Change).toBeGreaterThan(0);
      expect(result.player2Change).toBeLessThan(0);
      // Rating changes should be equal but opposite
      expect(Math.abs(result.player1Change + result.player2Change)).toBeLessThan(1);
    });

    it('should calculate expected score correctly', () => {
      const expectedScore = EloRatingService.calculateExpectedScore(1200, 1200);
      expect(expectedScore).toBeCloseTo(0.5, 2);

      const expectedScore2 = EloRatingService.calculateExpectedScore(1400, 1200);
      expect(expectedScore2).toBeGreaterThan(0.5);

      const expectedScore3 = EloRatingService.calculateExpectedScore(1200, 1400);
      expect(expectedScore3).toBeLessThan(0.5);
    });

    it('should give higher-rated player smaller gains and larger losses', () => {
      // Higher rated player wins
      const result1 = EloRatingService.calculateNewRatings(1400, 1200, true);
      // Lower rated player wins
      const result2 = EloRatingService.calculateNewRatings(1400, 1200, false);

      // Underdog winning should get more points than favorite winning
      expect(Math.abs(result2.player2Change)).toBeGreaterThan(
        Math.abs(result1.player1Change)
      );
    });
  });

  describe('Provisional Player Handling', () => {
    it('should use higher K-factor for provisional players', () => {
      // Provisional player (< 10 games)
      const provisionalResult = EloRatingService.calculateNewRatings(
        1200,
        1200,
        true,
        32,  // K for established
        50   // K for provisional
      );

      // Established player
      const establishedResult = EloRatingService.calculateNewRatings(
        1200,
        1200,
        true,
        32,
        32
      );

      // Provisional player should have larger rating change
      expect(Math.abs(provisionalResult.player1Change)).toBeGreaterThan(
        Math.abs(establishedResult.player1Change)
      );
    });

    it('should correctly determine K-factor based on game count', () => {
      const k1 = EloRatingService.getKFactor(5);   // Provisional
      const k2 = EloRatingService.getKFactor(15);  // Established

      expect(k1).toBe(50);  // Provisional K-factor
      expect(k2).toBe(32);  // Established K-factor
    });
  });

  describe('Score-Based Adjustments', () => {
    it('should apply larger adjustment for dominant wins', () => {
      const dominantWin = EloRatingService.calculateNewRatingsWithScore(
        1200,
        1200,
        true,
        { player1Sets: 3, player2Sets: 0, setScores: [] }
      );

      const closeWin = EloRatingService.calculateNewRatingsWithScore(
        1200,
        1200,
        true,
        { player1Sets: 3, player2Sets: 2, setScores: [] }
      );

      // Dominant win should give more rating points
      expect(dominantWin.player1Change).toBeGreaterThan(closeWin.player1Change);
    });

    it('should calculate score multiplier correctly', () => {
      const multiplier1 = EloRatingService.getScoreMultiplier(3, 0);
      const multiplier2 = EloRatingService.getScoreMultiplier(3, 2);
      const multiplier3 = EloRatingService.getScoreMultiplier(3, 3);

      expect(multiplier1).toBeGreaterThan(multiplier2);
      expect(multiplier2).toBeGreaterThan(multiplier3);
      expect(multiplier1).toBe(1.25);  // Dominant win
      expect(multiplier3).toBe(0.85);  // Very close match
    });

    it('should describe match competitiveness correctly', () => {
      const description1 = EloRatingService.getMatchCompetitivenessDescription({
        player1Sets: 3,
        player2Sets: 0,
        setScores: [],
      });

      const description2 = EloRatingService.getMatchCompetitivenessDescription({
        player1Sets: 3,
        player2Sets: 2,
        setScores: [],
      });

      expect(description1).toContain('dominant');
      expect(description2).toContain('competitive');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum rating boundary', () => {
      const result = EloRatingService.calculateNewRatings(100, 1200, false);

      // Loser at minimum rating shouldn't go below 100
      expect(result.player1NewRating).toBeGreaterThanOrEqual(100);
    });

    it('should handle maximum rating boundary', () => {
      const result = EloRatingService.calculateNewRatings(3000, 1200, true);

      // Winner at maximum rating shouldn't go above 3000
      expect(result.player1NewRating).toBeLessThanOrEqual(3000);
    });

    it('should handle identical ratings', () => {
      const result = EloRatingService.calculateNewRatings(1500, 1500, true);

      expect(result.player1NewRating).toBeGreaterThan(1500);
      expect(result.player2NewRating).toBeLessThan(1500);
      expect(result.player1NewRating + result.player2NewRating).toBeCloseTo(3000, 0);
    });

    it('should handle large rating differences', () => {
      // Very high rated player beats low rated
      const result1 = EloRatingService.calculateNewRatings(2500, 1000, true);
      // Very low rated player beats high rated (upset!)
      const result2 = EloRatingService.calculateNewRatings(2500, 1000, false);

      // Expected result gives tiny gain
      expect(result1.player1Change).toBeLessThan(5);
      // Upset gives huge gain
      expect(Math.abs(result2.player2Change)).toBeGreaterThan(25);
    });
  });

  describe('Round Robin Adjustments', () => {
    it('should apply lower adjustment for round robin matches', () => {
      const standardResult = EloRatingService.calculateNewRatingsWithScore(
        1200,
        1200,
        true,
        { player1Sets: 2, player2Sets: 1, setScores: [] },
        10,
        10,
        false  // Not round robin
      );

      const roundRobinResult = EloRatingService.calculateNewRatingsWithScore(
        1200,
        1200,
        true,
        { player1Sets: 2, player2Sets: 1, setScores: [] },
        10,
        10,
        true   // Round robin
      );

      // Round robin should give smaller rating changes
      expect(Math.abs(roundRobinResult.player1Change)).toBeLessThan(
        Math.abs(standardResult.player1Change)
      );
    });
  });

  describe('Rating Conservation', () => {
    it('should conserve total rating points in the system', () => {
      const player1Rating = 1200;
      const player2Rating = 1400;
      const totalBefore = player1Rating + player2Rating;

      const result = EloRatingService.calculateNewRatings(
        player1Rating,
        player2Rating,
        true
      );

      const totalAfter = result.player1NewRating + result.player2NewRating;

      // Total rating should be conserved (within rounding error)
      expect(Math.abs(totalAfter - totalBefore)).toBeLessThan(1);
    });
  });
});
