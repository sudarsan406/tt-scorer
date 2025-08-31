import 'react-native-get-random-values';
import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { 
  Player, 
  Match, 
  Tournament, 
  StatsPeriod, 
  PlayerStatistics, 
  TrendingStats, 
  OverallStatistics,
  RecentMatch 
} from '../types/models';
import { BracketGenerator, BracketMatch } from './bracketGenerator';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      if (this.db) {
        console.log('Database already initialized');
        return;
      }
      
      this.db = await SQLite.openDatabaseAsync('ttscore.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.db = null; // Reset db on failure
      throw new Error('Failed to initialize database');
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // First, check if we need to add new columns to existing matches table
    try {
      await this.db.execAsync(`ALTER TABLE matches ADD COLUMN is_doubles BOOLEAN DEFAULT FALSE`);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db.execAsync(`ALTER TABLE matches ADD COLUMN team1_name TEXT`);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db.execAsync(`ALTER TABLE matches ADD COLUMN team2_name TEXT`);
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Ensure tournament_matches table exists (might be missing if created before this table was added)
    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS tournament_matches (
          id TEXT PRIMARY KEY,
          tournament_id TEXT NOT NULL,
          match_id TEXT,
          round_number INTEGER NOT NULL,
          match_number INTEGER NOT NULL,
          player1_id TEXT,
          player2_id TEXT,
          winner_id TEXT,
          status TEXT NOT NULL DEFAULT 'scheduled',
          next_match_id TEXT,
          parent_match1_id TEXT,
          parent_match2_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
    } catch (error) {
      console.error('Failed to create tournament_matches table:', error);
    }

    // Add bestOf column to tournaments table if it doesn't exist
    try {
      await this.db.execAsync(`ALTER TABLE tournaments ADD COLUMN best_of INTEGER DEFAULT 3`);
    } catch (error) {
      // Column might already exist, ignore error
    }

    const tables = [
      `CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        avatar TEXT,
        rating INTEGER DEFAULT 1200,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        player1_id TEXT NOT NULL,
        player2_id TEXT NOT NULL,
        scheduled_at TEXT,
        started_at TEXT,
        completed_at TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        best_of INTEGER NOT NULL DEFAULT 3,
        current_set INTEGER DEFAULT 1,
        player1_sets INTEGER DEFAULT 0,
        player2_sets INTEGER DEFAULT 0,
        winner_id TEXT,
        notes TEXT,
        location TEXT,
        is_doubles BOOLEAN DEFAULT FALSE,
        team1_name TEXT,
        team2_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (player1_id) REFERENCES players (id),
        FOREIGN KEY (player2_id) REFERENCES players (id),
        FOREIGN KEY (winner_id) REFERENCES players (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS game_sets (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        set_number INTEGER NOT NULL,
        player1_score INTEGER DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        winner_id TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches (id),
        FOREIGN KEY (winner_id) REFERENCES players (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        set_id TEXT NOT NULL,
        game_number INTEGER NOT NULL,
        player1_score INTEGER DEFAULT 0,
        player2_score INTEGER DEFAULT 0,
        server TEXT NOT NULL,
        winner_id TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (set_id) REFERENCES game_sets (id),
        FOREIGN KEY (winner_id) REFERENCES players (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS points (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        point_number INTEGER NOT NULL,
        scorer_id TEXT NOT NULL,
        player1_score INTEGER NOT NULL,
        player2_score INTEGER NOT NULL,
        rally_length INTEGER,
        shot_type TEXT,
        is_winner BOOLEAN DEFAULT FALSE,
        is_error BOOLEAN DEFAULT FALSE,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id),
        FOREIGN KEY (scorer_id) REFERENCES players (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        status TEXT NOT NULL DEFAULT 'upcoming',
        format TEXT NOT NULL,
        best_of INTEGER DEFAULT 3,
        winner_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (winner_id) REFERENCES players (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS tournament_participants (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        seed INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
        FOREIGN KEY (player_id) REFERENCES players (id),
        UNIQUE(tournament_id, player_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS tournament_matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        match_id TEXT,
        round_number INTEGER NOT NULL,
        match_number INTEGER NOT NULL,
        player1_id TEXT,
        player2_id TEXT,
        winner_id TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        next_match_id TEXT,
        parent_match1_id TEXT,
        parent_match2_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
        FOREIGN KEY (match_id) REFERENCES matches (id),
        FOREIGN KEY (player1_id) REFERENCES players (id),
        FOREIGN KEY (player2_id) REFERENCES players (id),
        FOREIGN KEY (winner_id) REFERENCES players (id)
      )`
    ];

    for (const table of tables) {
      await this.db.execAsync(table);
    }
  }

  async createPlayer(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date().toISOString();
    
    const newPlayer: Player = {
      ...player,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    await this.db.runAsync(
      `INSERT INTO players (id, name, email, avatar, rating, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, player.name, player.email || null, player.avatar || null, 
       player.rating || 1200, now, now]
    );

    return newPlayer;
  }

  async getPlayers(): Promise<Player[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync('SELECT * FROM players ORDER BY name ASC');
    return result.map(this.mapRowToPlayer);
  }

  async createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'player1' | 'player2'> & { 
    isDoubles?: boolean; 
    team1Name?: string; 
    team2Name?: string; 
  }): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO matches (id, player1_id, player2_id, scheduled_at, status, best_of, is_doubles, team1_name, team2_name, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, match.player1Id, match.player2Id, match.scheduledAt?.toISOString() || null, 
       match.status, match.bestOf, match.isDoubles || false, match.team1Name || null, match.team2Name || null, now, now]
    );

    return id;
  }

  async getMatches(): Promise<Match[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT m.*, 
             p1.name as player1_name, p1.email as player1_email, p1.avatar as player1_avatar, p1.rating as player1_rating,
             p2.name as player2_name, p2.email as player2_email, p2.avatar as player2_avatar, p2.rating as player2_rating
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      ORDER BY m.created_at DESC
    `);

    return result.map(this.mapRowToMatch);
  }

  async updateMatchScore(matchId: string, player1Sets: number, player2Sets: number, currentSet: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE matches SET player1_sets = ?, player2_sets = ?, current_set = ?, updated_at = ? WHERE id = ?`,
      [player1Sets, player2Sets, currentSet, now, matchId]
    );
  }

  async completeMatch(matchId: string, winnerId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE matches SET status = ?, winner_id = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      ['completed', winnerId, now, now, matchId]
    );
  }

  private mapRowToPlayer(row: any): Player {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      rating: row.rating,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToMatch(row: any): Match {
    return {
      id: row.id,
      player1Id: row.player1_id,
      player2Id: row.player2_id,
      player1: {
        id: row.player1_id,
        name: row.player1_name,
        email: row.player1_email,
        avatar: row.player1_avatar,
        rating: row.player1_rating,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      player2: {
        id: row.player2_id,
        name: row.player2_name,
        email: row.player2_email,
        avatar: row.player2_avatar,
        rating: row.player2_rating,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      status: row.status,
      bestOf: row.best_of,
      currentSet: row.current_set,
      player1Sets: row.player1_sets,
      player2Sets: row.player2_sets,
      winnerId: row.winner_id,
      notes: row.notes,
      location: row.location,
      isDoubles: Boolean(row.is_doubles),
      team1Name: row.team1_name,
      team2Name: row.team2_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async createTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'matches' | 'matchStats'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO tournaments (id, name, description, start_date, end_date, status, format, best_of, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tournament.name, tournament.description || null, tournament.startDate.toISOString(), 
       tournament.endDate?.toISOString() || null, tournament.status, tournament.format, tournament.bestOf || 3, now, now]
    );

    return id;
  }

  async addTournamentParticipants(tournamentId: string, players: Player[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    // Add participants
    for (let i = 0; i < players.length; i++) {
      const participantId = this.generateId();
      await this.db.runAsync(
        `INSERT INTO tournament_participants (id, tournament_id, player_id, seed, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [participantId, tournamentId, players[i].id, i + 1, now]
      );
    }
  }

  async generateTournamentBracket(tournamentId: string, format: string, players: Player[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    let bracketMatches: BracketMatch[];
    
    if (format === 'single_elimination') {
      bracketMatches = BracketGenerator.generateSingleElimination(players);
    } else if (format === 'round_robin') {
      bracketMatches = BracketGenerator.generateRoundRobin(players);
    } else {
      throw new Error(`Unsupported tournament format: ${format}`);
    }

    const now = new Date().toISOString();

    // Create a map of old IDs to new unique IDs
    const idMap = new Map<string, string>();
    bracketMatches.forEach(match => {
      idMap.set(match.id, this.generateId());
    });

    // Save bracket matches to database with unique IDs
    for (const bracketMatch of bracketMatches) {
      const newId = idMap.get(bracketMatch.id)!;
      const newNextMatchId = bracketMatch.nextMatchId ? idMap.get(bracketMatch.nextMatchId) || null : null;
      
      // For parent match references, we need to map the old parent IDs to new IDs
      let newParentMatch1Id = null;
      let newParentMatch2Id = null;
      
      if (bracketMatch.parentMatch1Id && bracketMatch.parentMatch1Id !== 'group_stage') {
        newParentMatch1Id = idMap.get(bracketMatch.parentMatch1Id) || null;
      } else if (bracketMatch.parentMatch1Id === 'group_stage') {
        newParentMatch1Id = 'group_stage';
      }
      
      if (bracketMatch.parentMatch2Id && bracketMatch.parentMatch2Id !== 'group_stage') {
        newParentMatch2Id = idMap.get(bracketMatch.parentMatch2Id) || null;
      } else if (bracketMatch.parentMatch2Id === 'group_stage') {
        newParentMatch2Id = 'group_stage';
      }
      
      await this.db.runAsync(
        `INSERT INTO tournament_matches (
          id, tournament_id, round_number, match_number, 
          player1_id, player2_id, status, next_match_id, 
          parent_match1_id, parent_match2_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId, tournamentId, bracketMatch.round, bracketMatch.matchNumber,
          bracketMatch.player1Id || null, bracketMatch.player2Id || null, 
          bracketMatch.status, newNextMatchId,
          newParentMatch1Id, newParentMatch2Id,
          now, now
        ]
      );
    }
  }

  async getTournaments(): Promise<Tournament[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM tournaments 
      ORDER BY created_at DESC
    `);

    const tournaments: Tournament[] = [];
    
    for (const row of result as any[]) {
      const participants = await this.getTournamentParticipants(row.id);
      const matches = await this.getTournamentMatches(row.id);
      const matchStats = await this.getTournamentMatchStats(row.id);
      
      tournaments.push({
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: new Date(row.start_date),
        endDate: row.end_date ? new Date(row.end_date) : new Date(),
        status: row.status,
        format: row.format,
        bestOf: row.best_of || 3,
        winnerId: row.winner_id,
        participants,
        matches,
        matchStats, // Add the match statistics
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      });
    }

    return tournaments;
  }

  private async getTournamentParticipants(tournamentId: string): Promise<Player[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT p.*, tp.seed
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = ?
      ORDER BY tp.seed ASC
    `, [tournamentId]);

    return result.map(this.mapRowToPlayer);
  }

  private async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    if (!this.db) throw new Error('Database not initialized');

    // Get actual completed/started matches
    const result = await this.db.getAllAsync(`
      SELECT m.*, 
             p1.name as player1_name, p1.email as player1_email, p1.avatar as player1_avatar, p1.rating as player1_rating,
             p2.name as player2_name, p2.email as player2_email, p2.avatar as player2_avatar, p2.rating as player2_rating
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      WHERE m.id IN (
        SELECT match_id FROM tournament_matches WHERE tournament_id = ? AND match_id IS NOT NULL
      )
      ORDER BY m.created_at DESC
    `, [tournamentId]);

    return result.map(this.mapRowToMatch);
  }

  async getTournamentMatchStats(tournamentId: string): Promise<{ completed: number; total: number }> {
    if (!this.db) throw new Error('Database not initialized');

    // Get all tournament bracket matches
    const bracketMatches = await this.db.getAllAsync(`
      SELECT status FROM tournament_matches WHERE tournament_id = ?
    `, [tournamentId]);

    const total = bracketMatches.length;
    const completed = bracketMatches.filter((match: any) => match.status === 'completed').length;

    return { completed, total };
  }

  async startTournament(tournamentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    await this.db.runAsync(
      `UPDATE tournaments SET status = ?, updated_at = ? WHERE id = ?`,
      ['in_progress', now, tournamentId]
    );
  }

  async getTournamentBracket(tournamentId: string): Promise<BracketMatch[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT tm.*, 
             p1.name as player1_name,
             p2.name as player2_name,
             winner.name as winner_name
      FROM tournament_matches tm
      LEFT JOIN players p1 ON tm.player1_id = p1.id
      LEFT JOIN players p2 ON tm.player2_id = p2.id
      LEFT JOIN players winner ON tm.winner_id = winner.id
      WHERE tm.tournament_id = ?
      ORDER BY tm.round_number ASC, tm.match_number ASC
    `, [tournamentId]);

    return result.map((row: any) => ({
      id: row.id,
      player1Id: row.player1_id,
      player2Id: row.player2_id,
      player1Name: row.player1_name,
      player2Name: row.player2_name,
      round: row.round_number,
      matchNumber: row.match_number,
      winnerId: row.winner_id,
      status: row.status,
      nextMatchId: row.next_match_id,
      parentMatch1Id: row.parent_match1_id,
      parentMatch2Id: row.parent_match2_id,
      player1Sets: row.player1_sets || 0,
      player2Sets: row.player2_sets || 0,
    }));
  }

  async updateTournamentMatchStatus(tournamentMatchId: string, status: string, winnerId?: string, actualMatchId?: string, player1Sets?: number, player2Sets?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    // First try to add match score columns if they don't exist
    try {
      await this.db.execAsync(`ALTER TABLE tournament_matches ADD COLUMN player1_sets INTEGER DEFAULT 0`);
      await this.db.execAsync(`ALTER TABLE tournament_matches ADD COLUMN player2_sets INTEGER DEFAULT 0`);
    } catch (error) {
      // Columns might already exist, ignore error
    }
    
    await this.db.runAsync(
      `UPDATE tournament_matches SET status = ?, winner_id = ?, match_id = ?, player1_sets = ?, player2_sets = ?, updated_at = ? WHERE id = ?`,
      [status, winnerId || null, actualMatchId || null, player1Sets || 0, player2Sets || 0, now, tournamentMatchId]
    );
  }

  async advanceTournamentWinner(tournamentId: string, completedMatchId: string, winnerId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get the completed match
    const completedMatch = await this.db.getFirstAsync(`
      SELECT * FROM tournament_matches WHERE id = ? AND tournament_id = ?
    `, [completedMatchId, tournamentId]);

    if (!completedMatch) return;

    // Get tournament format to handle round robin differently
    const tournament = await this.db.getFirstAsync(`
      SELECT format FROM tournaments WHERE id = ?
    `, [tournamentId]);

    if ((tournament as any)?.format === 'round_robin') {
      // For round robin, check if group stage is complete and seed playoffs
      await this.seedRoundRobinPlayoffs(tournamentId);
    } else {
      // Single elimination logic
      const nextMatch = await this.db.getFirstAsync(`
        SELECT * FROM tournament_matches 
        WHERE tournament_id = ? AND (parent_match1_id = ? OR parent_match2_id = ?)
      `, [tournamentId, completedMatchId, completedMatchId]);

      if (nextMatch) {
        const now = new Date().toISOString();
        
        // Determine if winner goes to player1 or player2 slot
        if ((nextMatch as any).parent_match1_id === completedMatchId) {
          await this.db.runAsync(
            `UPDATE tournament_matches SET player1_id = ?, updated_at = ? WHERE id = ?`,
            [winnerId, now, (nextMatch as any).id]
          );
        } else if ((nextMatch as any).parent_match2_id === completedMatchId) {
          await this.db.runAsync(
            `UPDATE tournament_matches SET player2_id = ?, updated_at = ? WHERE id = ?`,
            [winnerId, now, (nextMatch as any).id]
          );
        }

        // Check if both players are now assigned and update status to scheduled
        const updatedNextMatch = await this.db.getFirstAsync(`
          SELECT * FROM tournament_matches WHERE id = ?
        `, [(nextMatch as any).id]);

        if (updatedNextMatch && (updatedNextMatch as any).player1_id && (updatedNextMatch as any).player2_id) {
          await this.db.runAsync(
            `UPDATE tournament_matches SET status = ?, updated_at = ? WHERE id = ?`,
            ['scheduled', now, (nextMatch as any).id]
          );
        }
      }
    }

    // Check if tournament is complete and update status
    await this.checkAndCompleteTournament(tournamentId, winnerId);
  }

  async checkAndCompleteTournament(tournamentId: string, lastWinnerId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get all tournament matches
    const allMatches = await this.db.getAllAsync(`
      SELECT * FROM tournament_matches WHERE tournament_id = ?
      ORDER BY round_number DESC
    `, [tournamentId]);

    const matches = allMatches as any[];
    
    if (matches.length === 0) return;

    // Check if all matches are completed
    const completedMatches = matches.filter(m => m.status === 'completed');
    const allCompleted = completedMatches.length === matches.length;

    if (allCompleted) {
      // Find the final match (highest round number)
      const finalMatch = matches[0]; // Already sorted by round_number DESC
      
      console.log('Tournament complete! Final match winner:', finalMatch.winner_id);
      
      const now = new Date().toISOString();
      
      // Update tournament status to completed with winner
      await this.db.runAsync(
        `UPDATE tournaments SET status = ?, winner_id = ?, updated_at = ? WHERE id = ?`,
        ['completed', finalMatch.winner_id, now, tournamentId]
      );
    }
  }

  async seedRoundRobinPlayoffs(tournamentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get all tournament matches and participants
    const bracketMatches = await this.getTournamentBracket(tournamentId);
    const participants = await this.getTournamentParticipants(tournamentId);

    // Use bracket generator to seed playoffs
    const updatedMatches = BracketGenerator.seedRoundRobinPlayoffs(bracketMatches, participants);

    // Update database with seeded playoff matches
    const now = new Date().toISOString();
    
    for (const match of updatedMatches) {
      if (match.round > 1 && match.player1Id && match.player2Id) {
        await this.db.runAsync(`
          UPDATE tournament_matches 
          SET player1_id = ?, player2_id = ?, status = ?, updated_at = ?
          WHERE id = ? AND tournament_id = ?
        `, [match.player1Id, match.player2Id, match.status, now, match.id, tournamentId]);
      }
    }
  }

  async fixSingleEliminationAdvancement(tournamentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');


    // Get all completed matches that have winners but haven't advanced
    const completedMatches = await this.db.getAllAsync(`
      SELECT * FROM tournament_matches 
      WHERE tournament_id = ? AND status = 'completed' AND winner_id IS NOT NULL
      ORDER BY round_number ASC
    `, [tournamentId]);

    const now = new Date().toISOString();

    for (const match of completedMatches as any[]) {
      
      // Find the next match this winner should advance to
      const nextMatch = await this.db.getFirstAsync(`
        SELECT * FROM tournament_matches 
        WHERE tournament_id = ? AND (parent_match1_id = ? OR parent_match2_id = ?)
      `, [tournamentId, match.id, match.id]);

      if (nextMatch) {
        
        // Determine if winner goes to player1 or player2 slot
        if ((nextMatch as any).parent_match1_id === match.id) {
          await this.db.runAsync(
            `UPDATE tournament_matches SET player1_id = ?, updated_at = ? WHERE id = ?`,
            [match.winner_id, now, (nextMatch as any).id]
          );
        } else if ((nextMatch as any).parent_match2_id === match.id) {
          await this.db.runAsync(
            `UPDATE tournament_matches SET player2_id = ?, updated_at = ? WHERE id = ?`,
            [match.winner_id, now, (nextMatch as any).id]
          );
        }

        // Check if both players are now assigned and update status to scheduled
        const updatedNextMatch = await this.db.getFirstAsync(`
          SELECT * FROM tournament_matches WHERE id = ?
        `, [(nextMatch as any).id]);

        if (updatedNextMatch && (updatedNextMatch as any).player1_id && (updatedNextMatch as any).player2_id) {
          await this.db.runAsync(
            `UPDATE tournament_matches SET status = ?, updated_at = ? WHERE id = ?`,
            ['scheduled', now, (nextMatch as any).id]
          );
        }
      }
    }
  }

  async getPlayerStatistics(playerId: string, period?: StatsPeriod): Promise<PlayerStatistics> {
    if (!this.db) throw new Error('Database not initialized');

    // Validate input parameters
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Invalid playerId provided');
    }

    // Calculate date filter based on period with validation
    let dateFilter = '';
    let queryParams: any[] = [playerId, playerId];
    
    if (period) {
      const validPeriods: StatsPeriod[] = ['7d', '30d', '3m', '6m', '1y'];
      if (!validPeriods.includes(period)) {
        throw new Error(`Invalid period: ${period}. Must be one of: ${validPeriods.join(', ')}`);
      }
      
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = ` AND completed_at >= ?`;
      queryParams.push(startDate.toISOString());
    }

    // Get all matches for this player within the specified period
    const matches = await this.db.getAllAsync(`
      SELECT * FROM matches 
      WHERE (player1_id = ? OR player2_id = ?) AND status = 'completed'${dateFilter}
      ORDER BY completed_at DESC
    `, queryParams);

    const totalMatches = matches.length;
    const wins = matches.filter((match: any) => match.winner_id === playerId).length;
    const losses = totalMatches - wins;
    const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Calculate sets statistics
    let setsWon = 0;
    let setsLost = 0;
    
    matches.forEach((match: any) => {
      if (match.player1_id === playerId) {
        setsWon += match.player1_sets || 0;
        setsLost += match.player2_sets || 0;
      } else {
        setsWon += match.player2_sets || 0;
        setsLost += match.player1_sets || 0;
      }
    });

    // Calculate current streak
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | 'none' = 'none';
    
    for (const match of matches as any[]) {
      if (match.winner_id === playerId) {
        if (streakType === 'win' || streakType === 'none') {
          currentStreak = streakType === 'none' ? 1 : currentStreak + 1;
          streakType = 'win';
        } else {
          break;
        }
      } else {
        if (streakType === 'loss' || streakType === 'none') {
          currentStreak = streakType === 'none' ? 1 : currentStreak + 1;
          streakType = 'loss';
        } else {
          break;
        }
      }
    }

    // Get recent matches (last 5) with proper error handling
    const recentMatches: RecentMatch[] = matches.slice(0, 5).map((match: any) => {
      // Validate match data
      const player1Sets = Number(match.player1_sets) || 0;
      const player2Sets = Number(match.player2_sets) || 0;
      
      return {
        id: match.id,
        opponent: match.player1_id === playerId ? match.player2_id : match.player1_id,
        isWin: match.winner_id === playerId,
        score: match.player1_id === playerId ? 
          `${player1Sets}-${player2Sets}` : 
          `${player2Sets}-${player1Sets}`,
        date: match.completed_at || new Date().toISOString()
      };
    });

    const result: PlayerStatistics = {
      playerId,
      totalMatches,
      wins,
      losses,
      winPercentage,
      setsWon,
      setsLost,
      setsPercentage: setsWon + setsLost > 0 ? Math.round((setsWon / (setsWon + setsLost)) * 100) : 0,
      currentStreak,
      streakType,
      recentMatches,
      period
    };

    return result;
  }

  async getPlayerTrendingStats(playerId: string): Promise<TrendingStats[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Invalid playerId provided');
    }

    const periods: StatsPeriod[] = ['7d', '30d', '3m', '6m', '1y'];
    const trendingStats: TrendingStats[] = [];

    try {
      for (const period of periods) {
        const stats = await this.getPlayerStatistics(playerId, period);
        trendingStats.push({
          period,
          label: this.getPeriodLabel(period),
          totalMatches: stats.totalMatches,
          wins: stats.wins,
          losses: stats.losses,
          winPercentage: stats.winPercentage,
          setsWon: stats.setsWon,
          setsLost: stats.setsLost,
          setsPercentage: stats.setsPercentage
        });
      }
    } catch (error) {
      console.error('Error fetching trending stats:', error);
      throw new Error('Failed to fetch trending statistics');
    }

    return trendingStats;
  }

  private getPeriodLabel(period: StatsPeriod): string {
    switch (period) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '3m': return 'Last 3 Months';
      case '6m': return 'Last 6 Months';
      case '1y': return 'Last Year';
      default: return 'All Time';
    }
  }

  async getAllPlayersStatistics(period?: StatsPeriod): Promise<PlayerStatistics[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const players = await this.getPlayers();
      const allStats: PlayerStatistics[] = [];

      for (const player of players) {
        const stats = await this.getPlayerStatistics(player.id, period);
        allStats.push({
          ...stats,
          player
        });
      }

      // Sort by win percentage, then by total matches
      return allStats.sort((a, b) => {
        if (a.winPercentage !== b.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        return b.totalMatches - a.totalMatches;
      });
    } catch (error) {
      console.error('Error fetching all players statistics:', error);
      throw new Error('Failed to fetch player statistics');
    }
  }

  async getOverallStatistics(): Promise<OverallStatistics> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [players, matches, tournaments] = await Promise.all([
        this.getPlayers(),
        this.getMatches(),
        this.getTournaments()
      ]);

      const completedMatches = matches.filter(m => m.status === 'completed');
      const completedTournaments = tournaments.filter(t => t.status === 'completed');

      return {
        totalPlayers: players.length,
        totalMatches: matches.length,
        completedMatches: completedMatches.length,
        totalTournaments: tournaments.length,
        completedTournaments: completedTournaments.length
      };
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      throw new Error('Failed to fetch overall statistics');
    }
  }

  private generateId(): string {
    return uuidv4();
  }
}

export const databaseService = new DatabaseService();