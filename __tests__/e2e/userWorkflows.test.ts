/**
 * End-to-End Functional Tests
 *
 * Tests complete user workflows from start to finish,
 * simulating real-world usage scenarios.
 */

import { databaseService } from '../../services/database';
import { Player } from '../../types/models';

describe('E2E Functional Tests - User Workflows', () => {
  beforeAll(async () => {
    await databaseService.init();
  });

  describe('User Workflow: New Player Joins and Plays First Match', () => {
    let newPlayer: Player;
    let opponent: Player;
    let matchId: string;

    it('Step 1: User creates a new player profile', async () => {
      newPlayer = await databaseService.createPlayer({
        name: 'John Doe',
        email: 'john@example.com',
        rating: 1200,
      });

      expect(newPlayer.id).toBeDefined();
      expect(newPlayer.name).toBe('John Doe');
      expect(newPlayer.rating).toBe(1200);
    });

    it('Step 2: User creates opponent player', async () => {
      opponent = await databaseService.createPlayer({
        name: 'Jane Smith',
        rating: 1200,
      });

      expect(opponent.id).toBeDefined();
    });

    it('Step 3: User starts a quick match (best of 3)', async () => {
      matchId = await databaseService.createMatch({
        player1Id: newPlayer.id,
        player2Id: opponent.id,
        status: 'in_progress',
        bestOf: 3,
        startedAt: new Date(),
      });

      expect(matchId).toBeDefined();
    });

    it('Step 4: User plays first set (11-9)', async () => {
      const setId = await databaseService.createGameSet(
        matchId,
        1,
        11,
        9,
        newPlayer.id
      );

      expect(setId).toBeDefined();

      await databaseService.updateMatchScore(matchId, 1, 0, 2);
    });

    it('Step 5: User plays second set (9-11)', async () => {
      await databaseService.createGameSet(
        matchId,
        2,
        9,
        11,
        opponent.id
      );

      await databaseService.updateMatchScore(matchId, 1, 1, 3);
    });

    it('Step 6: User plays deciding set (11-7)', async () => {
      await databaseService.createGameSet(
        matchId,
        3,
        11,
        7,
        newPlayer.id
      );

      await databaseService.updateMatchScore(matchId, 2, 1, 3);
    });

    it('Step 7: User completes match and ratings are updated', async () => {
      await databaseService.completeMatch(matchId, newPlayer.id);

      const players = await databaseService.getPlayers();
      const updatedPlayer = players.find(p => p.id === newPlayer.id);
      const updatedOpponent = players.find(p => p.id === opponent.id);

      // Winner's rating should increase
      expect(updatedPlayer!.rating).toBeGreaterThan(1200);
      // Loser's rating should decrease
      expect(updatedOpponent!.rating).toBeLessThan(1200);
    });

    it('Step 8: User views match history', async () => {
      const matches = await databaseService.getMatches();
      const playedMatch = matches.find(m => m.id === matchId);

      expect(playedMatch).toBeDefined();
      expect(playedMatch?.status).toBe('completed');
      expect(playedMatch?.winnerId).toBe(newPlayer.id);
      expect(playedMatch?.player1Sets).toBe(2);
      expect(playedMatch?.player2Sets).toBe(1);
    });

    it('Step 9: User views player statistics', async () => {
      const stats = await databaseService.getPlayerStatistics(newPlayer.id);

      expect(stats.totalMatches).toBeGreaterThanOrEqual(1);
      expect(stats.wins).toBeGreaterThanOrEqual(1);
      expect(stats.winPercentage).toBeGreaterThan(0);
    });
  });

  describe('User Workflow: Organizing a Tournament', () => {
    let players: Player[];
    let tournamentId: string;

    it('Step 1: User creates 4 players for tournament', async () => {
      players = [];
      for (let i = 1; i <= 4; i++) {
        const player = await databaseService.createPlayer({
          name: `Tournament Player ${i}`,
          rating: 1200,
        });
        players.push(player);
      }

      expect(players.length).toBe(4);
    });

    it('Step 2: User creates a single elimination tournament', async () => {
      tournamentId = await databaseService.createTournament({
        name: 'Friday Night Tournament',
        description: 'Weekly tournament',
        startDate: new Date(),
        status: 'upcoming',
        format: 'single_elimination',
        bestOf: 3,
      });

      expect(tournamentId).toBeDefined();
    });

    it('Step 3: User adds participants to tournament', async () => {
      await databaseService.addTournamentParticipants(tournamentId, players);

      const tournaments = await databaseService.getTournaments();
      const tournament = tournaments.find(t => t.id === tournamentId);

      expect(tournament?.participants.length).toBe(4);
    });

    it('Step 4: User generates tournament bracket', async () => {
      await databaseService.generateTournamentBracket(
        tournamentId,
        'single_elimination',
        players
      );

      const bracket = await databaseService.getTournamentBracket(tournamentId);

      expect(bracket.length).toBe(3); // 2 semis + 1 final
    });

    it('Step 5: User starts tournament', async () => {
      await databaseService.startTournament(tournamentId);

      const tournaments = await databaseService.getTournaments();
      const tournament = tournaments.find(t => t.id === tournamentId);

      expect(tournament?.status).toBe('in_progress');
    });

    it('Step 6: User plays first semifinal match', async () => {
      const bracket = await databaseService.getTournamentBracket(tournamentId);
      const semifinal1 = bracket.find(m => m.round === 1 && m.matchNumber === 1);

      expect(semifinal1).toBeDefined();

      // Create actual match
      const matchId = await databaseService.createMatch({
        player1Id: semifinal1!.player1Id!,
        player2Id: semifinal1!.player2Id!,
        status: 'completed',
        bestOf: 3,
      });

      // Complete sets
      await databaseService.createGameSet(matchId, 1, 11, 9, semifinal1!.player1Id!);
      await databaseService.createGameSet(matchId, 2, 11, 7, semifinal1!.player1Id!);
      await databaseService.updateMatchScore(matchId, 2, 0, 2);

      // Complete match
      await databaseService.completeMatch(matchId, semifinal1!.player1Id!);

      // Update tournament bracket
      await databaseService.updateTournamentMatchStatus(
        semifinal1!.id,
        'completed',
        semifinal1!.player1Id!,
        matchId,
        2,
        0
      );

      // Advance winner
      await databaseService.advanceTournamentWinner(
        tournamentId,
        semifinal1!.id,
        semifinal1!.player1Id!
      );
    });

    it('Step 7: User views tournament standings', async () => {
      const standings = await databaseService.getTournamentStandings(tournamentId);

      expect(standings.length).toBe(4);
      expect(standings[0]).toHaveProperty('player');
      expect(standings[0]).toHaveProperty('matchWins');
    });

    it('Step 8: User views updated bracket with winners', async () => {
      const bracket = await databaseService.getTournamentBracket(tournamentId);
      const completedMatches = bracket.filter(m => m.status === 'completed');

      expect(completedMatches.length).toBeGreaterThan(0);
    });
  });

  describe('User Workflow: Tracking Statistics Over Time', () => {
    let player: Player;

    beforeAll(async () => {
      player = await databaseService.createPlayer({
        name: 'Stats Tracker',
        rating: 1200,
      });
    });

    it('Step 1: User plays multiple matches over time', async () => {
      const opponent = await databaseService.createPlayer({
        name: 'Opponent',
        rating: 1200,
      });

      // Play 5 matches
      for (let i = 0; i < 5; i++) {
        const matchId = await databaseService.createMatch({
          player1Id: player.id,
          player2Id: opponent.id,
          status: 'completed',
          bestOf: 3,
        });

        // Alternate wins
        const winnerId = i % 2 === 0 ? player.id : opponent.id;
        await databaseService.createGameSet(matchId, 1, 11, 9, winnerId);
        await databaseService.createGameSet(matchId, 2, 11, 8, winnerId);
        await databaseService.updateMatchScore(matchId, 2, 0, 2);
        await databaseService.completeMatch(matchId, winnerId);
      }
    });

    it('Step 2: User views overall statistics', async () => {
      const stats = await databaseService.getPlayerStatistics(player.id);

      expect(stats.totalMatches).toBeGreaterThanOrEqual(5);
      expect(stats.wins).toBeGreaterThan(0);
      expect(stats.losses).toBeGreaterThan(0);
    });

    it('Step 3: User views trending statistics', async () => {
      const trending = await databaseService.getPlayerTrendingStats(player.id);

      expect(trending.length).toBe(5); // 5 time periods
      expect(trending[0].period).toBe('7d');
      expect(trending[0].label).toBe('Last 7 Days');
    });

    it('Step 4: User views Elo history', async () => {
      const history = await databaseService.getPlayerEloHistory(player.id, 10);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('date');
      expect(history[0]).toHaveProperty('rating');
      expect(history[0]).toHaveProperty('opponent');
    });

    it('Step 5: User views leaderboard', async () => {
      const leaderboard = await databaseService.getAllPlayersStatistics();

      expect(leaderboard.length).toBeGreaterThan(0);
      // Should be sorted by Elo rating
      if (leaderboard.length > 1) {
        expect(leaderboard[0].eloRating || 1200).toBeGreaterThanOrEqual(
          leaderboard[1].eloRating || 1200
        );
      }
    });
  });

  describe('User Workflow: Round Robin Tournament with Playoffs', () => {
    let players: Player[];
    let tournamentId: string;

    it('Complete round robin tournament with playoff progression', async () => {
      // Create 4 players
      players = [];
      for (let i = 1; i <= 4; i++) {
        const player = await databaseService.createPlayer({
          name: `RR Player ${i}`,
          rating: 1200,
        });
        players.push(player);
      }

      // Create tournament
      tournamentId = await databaseService.createTournament({
        name: 'Round Robin with Playoffs',
        startDate: new Date(),
        status: 'in_progress',
        format: 'round_robin',
        bestOf: 3,
        roundRobinRounds: 1,
        hasPlayoffs: true,
      });

      // Add participants and generate bracket
      await databaseService.addTournamentParticipants(tournamentId, players);
      await databaseService.generateTournamentBracket(
        tournamentId,
        'round_robin',
        players,
        false,
        undefined,
        1,
        true
      );

      const bracket = await databaseService.getTournamentBracket(tournamentId);

      // Should have group stage + playoff matches
      const groupStage = bracket.filter(m => m.round === 1);
      expect(groupStage.length).toBe(6); // C(4,2) = 6 matches

      // Complete all group stage matches
      for (const match of groupStage) {
        const matchId = await databaseService.createMatch({
          player1Id: match.player1Id!,
          player2Id: match.player2Id!,
          status: 'completed',
          bestOf: 3,
        });

        await databaseService.updateTournamentMatchStatus(
          match.id,
          'completed',
          match.player1Id!,
          matchId,
          2,
          1
        );
      }

      // Seed playoffs
      await databaseService.seedRoundRobinPlayoffs(tournamentId);

      const updatedBracket = await databaseService.getTournamentBracket(tournamentId);
      const playoffMatches = updatedBracket.filter(m => m.round > 1);

      expect(playoffMatches.length).toBeGreaterThan(0);
    });
  });
});
