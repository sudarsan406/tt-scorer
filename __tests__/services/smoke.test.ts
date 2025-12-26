/**
 * Smoke Tests - Verify Core Functionality After Code Cleanup
 *
 * These tests verify that the code cleanup didn't break core functionality.
 */

import { EloRatingService } from '../../services/eloRating';
import { BracketGenerator } from '../../services/bracketGenerator';
import { ELO_CONFIG, MATCH_CONFIG, TOURNAMENT_CONFIG } from '../../constants/GameRules';

describe('Smoke Tests - Core Functionality', () => {
  describe('GameRules Constants', () => {
    it('should have valid ELO_CONFIG constants', () => {
      expect(ELO_CONFIG.DEFAULT_RATING).toBe(1200);
      expect(ELO_CONFIG.K_FACTOR).toBe(32);
      expect(ELO_CONFIG.K_FACTOR_PROVISIONAL).toBe(50);
      expect(ELO_CONFIG.MIN_RATING).toBe(100);
      expect(ELO_CONFIG.MAX_RATING).toBe(3000);
      expect(ELO_CONFIG.PROVISIONAL_GAMES).toBe(10);
    });

    it('should have valid MATCH_CONFIG constants', () => {
      expect(MATCH_CONFIG.DEFAULT_BEST_OF).toBe(3);
      expect(MATCH_CONFIG.POINTS_TO_WIN_SET).toBe(11);
      expect(MATCH_CONFIG.WIN_BY_MARGIN).toBe(2);
      expect(MATCH_CONFIG.VALID_BEST_OF).toContain(3);
      expect(MATCH_CONFIG.VALID_BEST_OF).toContain(5);
    });

    it('should have valid TOURNAMENT_CONFIG constants', () => {
      expect(TOURNAMENT_CONFIG.MIN_PLAYERS_SINGLE_ELIMINATION).toBe(4);
      expect(TOURNAMENT_CONFIG.MIN_PLAYERS_ROUND_ROBIN).toBe(3);
      expect(TOURNAMENT_CONFIG.MIN_PLAYERS_KING_OF_COURT).toBe(3);
    });
  });

  describe('EloRatingService - Basic Calculations', () => {
    it('should calculate new ratings for equal players', () => {
      const result = EloRatingService.calculateNewRatings(1200, 1200, true);

      expect(result.player1NewRating).toBeGreaterThan(1200);
      expect(result.player2NewRating).toBeLessThan(1200);
      expect(result.player1Change).toBeGreaterThan(0);
      expect(result.player2Change).toBeLessThan(0);
    });

    it('should calculate new ratings with score adjustments', () => {
      const result = EloRatingService.calculateNewRatingsWithScore(
        1200,
        1200,
        true,
        { player1Sets: 3, player2Sets: 1, setScores: [] }
      );

      expect(result.player1NewRating).toBeGreaterThan(1200);
      expect(result.player2NewRating).toBeLessThan(1200);
    });

    it('should respect minimum rating floor', () => {
      const result = EloRatingService.calculateNewRatings(100, 1500, false);

      // Even when losing, rating should not go below minimum
      expect(result.player1NewRating).toBeGreaterThanOrEqual(ELO_CONFIG.MIN_RATING);
    });

    it('should respect maximum rating ceiling', () => {
      const result = EloRatingService.calculateNewRatings(3000, 1500, true);

      // Even when winning, rating should not exceed maximum
      expect(result.player1NewRating).toBeLessThanOrEqual(ELO_CONFIG.MAX_RATING);
    });
  });

  describe('BracketGenerator - Tournament Generation', () => {
    const createTestPlayers = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        rating: 1200 + i * 50,
        email: undefined,
        gamesPlayed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    };

    it('should generate single elimination bracket for 4 players', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateSingleElimination(players);

      // 4 players = 2 semis + 1 final = 3 matches
      expect(bracket.length).toBe(3);

      const semifinals = bracket.filter(m => m.round === 1);
      expect(semifinals.length).toBe(2);

      const final = bracket.filter(m => m.round === 2);
      expect(final.length).toBe(1);
    });

    it('should generate round robin bracket for 4 players', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateRoundRobin(players, 1, false);

      // 4 players = C(4,2) = 6 matches
      expect(bracket.length).toBe(6);
      expect(bracket.every(m => m.status === 'scheduled')).toBe(true);
    });

    it('should generate king of court bracket for 4 players', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateKingOfCourt(players);

      // Initial match for King of Court
      expect(bracket.length).toBeGreaterThan(0);
      expect(bracket[0].status).toBe('scheduled');
    });

    it('should calculate round robin standings', () => {
      const players = createTestPlayers(3);
      const bracket = BracketGenerator.generateRoundRobin(players, 1, false);

      // Simulate some completed matches
      const updatedBracket = bracket.map((match, index) => ({
        ...match,
        status: 'completed' as const,
        winnerId: index === 0 ? players[0].id : players[1].id,
        player1Sets: index === 0 ? 2 : 1,
        player2Sets: index === 0 ? 0 : 2,
      }));

      const standings = BracketGenerator.getRoundRobinStandings(
        updatedBracket,
        players
      );

      // Verify standings are calculated
      expect(standings.length).toBe(3);
      expect(standings[0].matchWins).toBeGreaterThanOrEqual(0);
      expect(standings[0].setDifference).toBeDefined();
    });
  });

  describe('Integration - Constants Usage', () => {
    it('should use constants in Elo calculations', () => {
      // Verify that Elo service respects the configured K-factor
      const result1 = EloRatingService.calculateNewRatings(1200, 1200, true);
      const result2 = EloRatingService.calculateNewRatings(1200, 1200, true, 5);

      // Provisional player (5 games) should have larger or equal rating changes
      expect(Math.abs(result2.player1Change)).toBeGreaterThanOrEqual(
        Math.abs(result1.player1Change)
      );
    });

    it('should enforce minimum player counts for tournaments', () => {
      const players = [
        { id: '1', name: 'P1', rating: 1200, email: undefined, gamesPlayed: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'P2', rating: 1200, email: undefined, gamesPlayed: 0, createdAt: new Date(), updatedAt: new Date() },
      ];

      // Single elimination requires at least 4 players
      expect(() => {
        BracketGenerator.generateSingleElimination(players);
      }).toThrow();
    });
  });
});
