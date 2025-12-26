/**
 * Bracket Generator Functional Tests
 *
 * Tests tournament bracket generation for single elimination,
 * round robin, and king of court formats.
 */

import { BracketGenerator } from '../../services/bracketGenerator';
import { Player } from '../../types/models';

describe('BracketGenerator - Functional Tests', () => {
  // Create test players
  const createTestPlayers = (count: number): Player[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `player-${i + 1}`,
      name: `Player ${i + 1}`,
      rating: 1200,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  };

  describe('Single Elimination Tournament', () => {
    it('should generate correct bracket for 4 players', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateSingleElimination(players);

      // 4 players = 2 semis + 1 final = 3 matches
      expect(bracket.length).toBe(3);

      // Check round structure
      const semifinals = bracket.filter(m => m.round === 1);
      const final = bracket.filter(m => m.round === 2);

      expect(semifinals.length).toBe(2);
      expect(final.length).toBe(1);

      // All semifinal matches should have players assigned
      semifinals.forEach(match => {
        expect(match.player1Id).toBeDefined();
        expect(match.player2Id).toBeDefined();
        expect(match.status).toBe('scheduled');
      });

      // Final should have TBD players
      expect(final[0].player1Id).toBeNull();
      expect(final[0].player2Id).toBeNull();
      expect(final[0].status).toBe('pending');
    });

    it('should generate correct bracket for 8 players', () => {
      const players = createTestPlayers(8);
      const bracket = BracketGenerator.generateSingleElimination(players);

      // 8 players = 4 quarters + 2 semis + 1 final = 7 matches
      expect(bracket.length).toBe(7);

      const round1 = bracket.filter(m => m.round === 1);
      const round2 = bracket.filter(m => m.round === 2);
      const round3 = bracket.filter(m => m.round === 3);

      expect(round1.length).toBe(4);  // Quarterfinals
      expect(round2.length).toBe(2);  // Semifinals
      expect(round3.length).toBe(1);  // Final
    });

    it('should correctly link parent and next matches', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateSingleElimination(players);

      const semifinals = bracket.filter(m => m.round === 1);
      const final = bracket.filter(m => m.round === 2);

      // Both semifinals should point to the final
      semifinals.forEach(semi => {
        expect(semi.nextMatchId).toBe(final[0].id);
      });

      // Final should have both semifinals as parents
      expect(final[0].parentMatch1Id).toBe(semifinals[0].id);
      expect(final[0].parentMatch2Id).toBe(semifinals[1].id);
    });
  });

  describe('Round Robin Tournament', () => {
    it('should generate all matchups for 4 players (single round)', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateRoundRobin(players, 1, false);

      // 4 players round robin = C(4,2) = 6 matches
      expect(bracket.length).toBe(6);

      // All matches should be in round 1
      expect(bracket.every(m => m.round === 1)).toBe(true);

      // All matches should be scheduled
      expect(bracket.every(m => m.status === 'scheduled')).toBe(true);

      // Verify each player plays exactly 3 matches
      const playerMatches = new Map<string, number>();
      bracket.forEach(match => {
        playerMatches.set(
          match.player1Id!,
          (playerMatches.get(match.player1Id!) || 0) + 1
        );
        playerMatches.set(
          match.player2Id!,
          (playerMatches.get(match.player2Id!) || 0) + 1
        );
      });

      playerMatches.forEach(count => {
        expect(count).toBe(3); // Each player plays 3 matches
      });
    });

    it('should generate multiple rounds correctly', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateRoundRobin(players, 2, false);

      // 4 players, 2 rounds = 6 matches per round = 12 matches
      expect(bracket.length).toBe(12);

      const round1 = bracket.filter(m => m.round === 1);
      const round2 = bracket.filter(m => m.round === 2);

      expect(round1.length).toBe(6);
      expect(round2.length).toBe(6);
    });

    it('should generate playoffs when hasPlayoffs is true', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateRoundRobin(players, 1, true);

      // Group stage: 6 matches
      // Playoffs: 1 semifinal (3rd vs 4th) + 1 final = 2 matches
      // Total: 8 matches
      const groupStage = bracket.filter(m => m.round === 1);
      const playoffs = bracket.filter(m => m.round > 1);

      expect(groupStage.length).toBe(6);
      expect(playoffs.length).toBeGreaterThan(0);
    });

    it('should calculate round robin standings correctly', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateRoundRobin(players, 1, false);

      // Simulate some completed matches
      bracket[0].status = 'completed';
      bracket[0].winnerId = bracket[0].player1Id;
      bracket[0].player1Sets = 2;
      bracket[0].player2Sets = 1;

      bracket[1].status = 'completed';
      bracket[1].winnerId = bracket[1].player1Id;
      bracket[1].player1Sets = 2;
      bracket[1].player2Sets = 0;

      const standings = BracketGenerator.getRoundRobinStandings(bracket, players, 1);

      expect(standings.length).toBe(4);
      expect(standings[0]).toHaveProperty('player');
      expect(standings[0]).toHaveProperty('matchWins');
      expect(standings[0]).toHaveProperty('setWins');
      expect(standings[0]).toHaveProperty('winPercentage');

      // Standings should be sorted by wins
      for (let i = 0; i < standings.length - 1; i++) {
        expect(standings[i].matchWins).toBeGreaterThanOrEqual(
          standings[i + 1].matchWins
        );
      }
    });
  });

  describe('King of Court Tournament', () => {
    it('should generate initial match for king of court', () => {
      const players = createTestPlayers(4);
      const bracket = BracketGenerator.generateKingOfCourt(players);

      // Should create first match
      expect(bracket.length).toBe(1);
      expect(bracket[0].player1Id).toBeDefined();
      expect(bracket[0].player2Id).toBeDefined();
      expect(bracket[0].status).toBe('scheduled');
    });

    it('should suggest next match correctly', () => {
      const players = createTestPlayers(4);
      let bracket = BracketGenerator.generateKingOfCourt(players);

      // Complete first match
      bracket[0].status = 'completed';
      bracket[0].winnerId = bracket[0].player1Id;

      // Suggest next match
      const nextMatch = BracketGenerator.suggestNextKingOfCourtMatch(
        bracket,
        players,
        bracket[0].id,
        3  // Require 3 consecutive wins
      );

      expect(nextMatch).toBeDefined();
      expect(nextMatch?.player1Id).toBe(bracket[0].winnerId); // Winner stays
      expect(nextMatch?.player2Id).toBeDefined(); // New challenger
      expect(nextMatch?.status).toBe('scheduled');
    });

    it('should track consecutive wins correctly', () => {
      const players = createTestPlayers(4);
      let bracket = BracketGenerator.generateKingOfCourt(players);
      const winnerId = bracket[0].player1Id!;

      // Simulate 3 consecutive wins
      for (let i = 0; i < 3; i++) {
        bracket[i] = {
          ...bracket[i],
          status: 'completed',
          winnerId,
          player1Id: winnerId,
        };
      }

      const consecutiveWins = BracketGenerator.getConsecutiveWins(bracket, winnerId);
      expect(consecutiveWins).toBe(3);
    });

    it('should end tournament when player reaches required wins', () => {
      const players = createTestPlayers(4);
      let bracket = BracketGenerator.generateKingOfCourt(players);
      const winnerId = bracket[0].player1Id!;

      // Simulate 3 consecutive wins
      for (let i = 0; i < 3; i++) {
        bracket.push({
          id: `match-${i}`,
          player1Id: winnerId,
          player2Id: players[i].id,
          round: i + 1,
          matchNumber: i + 1,
          status: 'completed',
          winnerId,
          player1Sets: 2,
          player2Sets: 0,
        });
      }

      const nextMatch = BracketGenerator.suggestNextKingOfCourtMatch(
        bracket,
        players,
        bracket[bracket.length - 1].id,
        3
      );

      // Should return null when tournament is complete
      expect(nextMatch).toBeNull();
    });

    it('should reset consecutive wins when different player wins', () => {
      const players = createTestPlayers(4);
      const bracket = [
        {
          id: 'match-1',
          player1Id: players[0].id,
          player2Id: players[1].id,
          round: 1,
          matchNumber: 1,
          status: 'completed' as const,
          winnerId: players[0].id,
        },
        {
          id: 'match-2',
          player1Id: players[0].id,
          player2Id: players[2].id,
          round: 2,
          matchNumber: 2,
          status: 'completed' as const,
          winnerId: players[2].id, // Different winner
        },
      ];

      const consecutiveWins1 = BracketGenerator.getConsecutiveWins(bracket, players[0].id);
      const consecutiveWins2 = BracketGenerator.getConsecutiveWins(bracket, players[2].id);

      expect(consecutiveWins1).toBe(0); // Reset when lost
      expect(consecutiveWins2).toBe(1); // New champion
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum players (2 players single elimination)', () => {
      const players = createTestPlayers(2);
      const bracket = BracketGenerator.generateSingleElimination(players);

      // 2 players = 1 final
      expect(bracket.length).toBe(1);
      expect(bracket[0].player1Id).toBe(players[0].id);
      expect(bracket[0].player2Id).toBe(players[1].id);
    });

    it('should handle minimum players (3 players round robin)', () => {
      const players = createTestPlayers(3);
      const bracket = BracketGenerator.generateRoundRobin(players, 1, false);

      // 3 players round robin = C(3,2) = 3 matches
      expect(bracket.length).toBe(3);
    });

    it('should not duplicate matchups in round robin', () => {
      const players = createTestPlayers(5);
      const bracket = BracketGenerator.generateRoundRobin(players, 1, false);

      const matchups = new Set<string>();
      bracket.forEach(match => {
        const key = [match.player1Id, match.player2Id].sort().join('-');
        expect(matchups.has(key)).toBe(false); // No duplicates
        matchups.add(key);
      });
    });
  });
});
