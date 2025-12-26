/**
 * Database Service Functional Tests
 *
 * Tests core database operations including player management,
 * match creation, tournament handling, and Elo rating calculations.
 */

import { databaseService } from '../../services/database';
import { Player } from '../../types/models';

describe('DatabaseService - Functional Tests', () => {
  beforeAll(async () => {
    // Initialize database before all tests
    await databaseService.init();
  });

  describe('Player Management', () => {
    let testPlayer: Player;

    it('should create a new player with default rating', async () => {
      testPlayer = await databaseService.createPlayer({
        name: 'Test Player',
        email: 'test@example.com',
        rating: 1200,
      });

      expect(testPlayer).toBeDefined();
      expect(testPlayer.id).toBeDefined();
      expect(testPlayer.name).toBe('Test Player');
      expect(testPlayer.email).toBe('test@example.com');
      expect(testPlayer.rating).toBe(1200);
      expect(testPlayer.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve all players', async () => {
      const players = await databaseService.getPlayers();

      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBeGreaterThan(0);
      expect(players.some(p => p.id === testPlayer.id)).toBe(true);
    });

    it('should update player details', async () => {
      const updatedPlayer = await databaseService.updatePlayer(testPlayer.id, {
        name: 'Updated Player Name',
        rating: 1250,
      });

      expect(updatedPlayer.name).toBe('Updated Player Name');
      expect(updatedPlayer.rating).toBe(1250);
      expect(updatedPlayer.id).toBe(testPlayer.id);
    });

    it('should not delete player with existing matches', async () => {
      // Create another player for a match
      const player2 = await databaseService.createPlayer({
        name: 'Player 2',
        rating: 1200,
      });

      // Create a match
      await databaseService.createMatch({
        player1Id: testPlayer.id,
        player2Id: player2.id,
        status: 'completed',
        bestOf: 3,
        winnerId: testPlayer.id,
      });

      // Try to delete player with matches
      await expect(
        databaseService.deletePlayer(testPlayer.id)
      ).rejects.toThrow('Cannot delete player with existing matches');
    });
  });

  describe('Match Management', () => {
    let player1: Player;
    let player2: Player;
    let matchId: string;

    beforeAll(async () => {
      player1 = await databaseService.createPlayer({
        name: 'Match Player 1',
        rating: 1200,
      });
      player2 = await databaseService.createPlayer({
        name: 'Match Player 2',
        rating: 1200,
      });
    });

    it('should create a match between two players', async () => {
      matchId = await databaseService.createMatch({
        player1Id: player1.id,
        player2Id: player2.id,
        status: 'scheduled',
        bestOf: 3,
      });

      expect(matchId).toBeDefined();
      expect(typeof matchId).toBe('string');
    });

    it('should update match score', async () => {
      await databaseService.updateMatchScore(matchId, 1, 0, 2);

      const matches = await databaseService.getMatches();
      const match = matches.find(m => m.id === matchId);

      expect(match).toBeDefined();
      expect(match?.player1Sets).toBe(1);
      expect(match?.player2Sets).toBe(0);
      expect(match?.currentSet).toBe(2);
    });

    it('should create and retrieve game sets', async () => {
      const setId = await databaseService.createGameSet(
        matchId,
        1,
        11,
        9,
        player1.id
      );

      expect(setId).toBeDefined();

      const sets = await databaseService.getMatchSets(matchId);
      expect(sets.length).toBeGreaterThan(0);
      expect(sets[0].player1Score).toBe(11);
      expect(sets[0].player2Score).toBe(9);
      expect(sets[0].winnerId).toBe(player1.id);
    });

    it('should complete match and update Elo ratings', async () => {
      const initialRating1 = player1.rating;
      const initialRating2 = player2.rating;

      await databaseService.completeMatch(matchId, player1.id);

      const players = await databaseService.getPlayers();
      const updatedPlayer1 = players.find(p => p.id === player1.id);
      const updatedPlayer2 = players.find(p => p.id === player2.id);

      expect(updatedPlayer1?.rating).not.toBe(initialRating1);
      expect(updatedPlayer2?.rating).not.toBe(initialRating2);
      // Winner's rating should increase
      expect(updatedPlayer1!.rating).toBeGreaterThan(initialRating1);
      // Loser's rating should decrease
      expect(updatedPlayer2!.rating).toBeLessThan(initialRating2);
    });
  });

  describe('Tournament Management', () => {
    let player1: Player;
    let player2: Player;
    let player3: Player;
    let player4: Player;
    let tournamentId: string;

    beforeAll(async () => {
      // Create 4 players for tournament
      player1 = await databaseService.createPlayer({ name: 'Tournament Player 1', rating: 1200 });
      player2 = await databaseService.createPlayer({ name: 'Tournament Player 2', rating: 1200 });
      player3 = await databaseService.createPlayer({ name: 'Tournament Player 3', rating: 1200 });
      player4 = await databaseService.createPlayer({ name: 'Tournament Player 4', rating: 1200 });
    });

    it('should create a tournament', async () => {
      tournamentId = await databaseService.createTournament({
        name: 'Test Tournament',
        description: 'A test tournament',
        startDate: new Date(),
        status: 'upcoming',
        format: 'single_elimination',
        bestOf: 3,
      });

      expect(tournamentId).toBeDefined();
    });

    it('should add participants to tournament', async () => {
      await databaseService.addTournamentParticipants(tournamentId, [
        player1,
        player2,
        player3,
        player4,
      ]);

      const tournaments = await databaseService.getTournaments();
      const tournament = tournaments.find(t => t.id === tournamentId);

      expect(tournament?.participants.length).toBe(4);
    });

    it('should generate tournament bracket', async () => {
      await databaseService.generateTournamentBracket(
        tournamentId,
        'single_elimination',
        [player1, player2, player3, player4]
      );

      const bracket = await databaseService.getTournamentBracket(tournamentId);

      expect(bracket.length).toBeGreaterThan(0);
      // Single elimination with 4 players should have 3 matches (2 semis + 1 final)
      expect(bracket.length).toBe(3);
    });

    it('should start tournament', async () => {
      await databaseService.startTournament(tournamentId);

      const tournaments = await databaseService.getTournaments();
      const tournament = tournaments.find(t => t.id === tournamentId);

      expect(tournament?.status).toBe('in_progress');
    });

    it('should get tournament standings', async () => {
      const standings = await databaseService.getTournamentStandings(tournamentId);

      expect(Array.isArray(standings)).toBe(true);
      expect(standings.length).toBe(4);
      expect(standings[0]).toHaveProperty('player');
      expect(standings[0]).toHaveProperty('position');
      expect(standings[0]).toHaveProperty('matchWins');
      expect(standings[0]).toHaveProperty('winPercentage');
    });

    it('should not delete tournament with completed matches', async () => {
      // Get a bracket match
      const bracket = await databaseService.getTournamentBracket(tournamentId);
      const firstMatch = bracket[0];

      // Create and complete a match
      const matchId = await databaseService.createMatch({
        player1Id: firstMatch.player1Id!,
        player2Id: firstMatch.player2Id!,
        status: 'completed',
        bestOf: 3,
      });

      await databaseService.updateTournamentMatchStatus(
        firstMatch.id,
        'completed',
        firstMatch.player1Id!,
        matchId,
        2,
        0
      );

      // Try to delete tournament with completed matches
      await expect(
        databaseService.deleteTournament(tournamentId)
      ).rejects.toThrow(/completed match/i);
    });
  });

  describe('Statistics and Analytics', () => {
    let testPlayer: Player;

    beforeAll(async () => {
      testPlayer = await databaseService.createPlayer({
        name: 'Stats Test Player',
        rating: 1200,
      });
    });

    it('should get player statistics', async () => {
      const stats = await databaseService.getPlayerStatistics(testPlayer.id);

      expect(stats).toBeDefined();
      expect(stats.playerId).toBe(testPlayer.id);
      expect(stats.totalMatches).toBeGreaterThanOrEqual(0);
      expect(stats.wins).toBeGreaterThanOrEqual(0);
      expect(stats.losses).toBeGreaterThanOrEqual(0);
      expect(stats.winPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.winPercentage).toBeLessThanOrEqual(100);
    });

    it('should get player trending statistics', async () => {
      const trendingStats = await databaseService.getPlayerTrendingStats(testPlayer.id);

      expect(Array.isArray(trendingStats)).toBe(true);
      expect(trendingStats.length).toBe(5); // 5 time periods
      expect(trendingStats[0]).toHaveProperty('period');
      expect(trendingStats[0]).toHaveProperty('label');
      expect(trendingStats[0]).toHaveProperty('totalMatches');
    });

    it('should get all players statistics', async () => {
      const allStats = await databaseService.getAllPlayersStatistics();

      expect(Array.isArray(allStats)).toBe(true);
      expect(allStats.length).toBeGreaterThan(0);
      // Should be sorted by Elo rating (highest first)
      if (allStats.length > 1) {
        expect(allStats[0].eloRating || 1200).toBeGreaterThanOrEqual(
          allStats[1].eloRating || 1200
        );
      }
    });

    it('should get overall statistics', async () => {
      const overallStats = await databaseService.getOverallStatistics();

      expect(overallStats).toBeDefined();
      expect(overallStats.totalPlayers).toBeGreaterThan(0);
      expect(overallStats.totalMatches).toBeGreaterThanOrEqual(0);
      expect(overallStats.totalTournaments).toBeGreaterThanOrEqual(0);
    });
  });
});
