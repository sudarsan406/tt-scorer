import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { databaseService } from './database';
import { Player, Match } from '../types/models';

export class ExportService {
  /**
   * Export match history to CSV format
   */
  static async exportMatchesToCSV(): Promise<void> {
    try {
      const matches = await databaseService.getMatches();

      if (matches.length === 0) {
        throw new Error('No matches to export');
      }

      // CSV Header
      let csvContent = 'Date,Player 1,Player 2,Score,Winner,Match Type,Elo Change\n';

      // CSV Rows
      for (const match of matches) {
        if (match.status === 'completed') {
          const date = match.completedAt
            ? new Date(match.completedAt).toLocaleDateString('en-US')
            : 'N/A';

          const player1Name = match.isDoubles ? (match.team1Name || 'Team 1') : match.player1.name;
          const player2Name = match.isDoubles ? (match.team2Name || 'Team 2') : match.player2.name;
          const score = `${match.player1Sets}-${match.player2Sets}`;

          let winnerName = 'N/A';
          if (match.winnerId) {
            if (match.isDoubles) {
              winnerName = match.winnerId === match.player1Id
                ? (match.team1Name || 'Team 1')
                : (match.team2Name || 'Team 2');
            } else {
              winnerName = match.winnerId === match.player1Id
                ? match.player1.name
                : match.player2.name;
            }
          }

          const matchType = match.isDoubles ? 'Doubles' : 'Singles';
          const eloChange = 'N/A'; // We don't store historical Elo changes

          // Escape commas in names
          const escapedPlayer1 = player1Name.includes(',') ? `"${player1Name}"` : player1Name;
          const escapedPlayer2 = player2Name.includes(',') ? `"${player2Name}"` : player2Name;
          const escapedWinner = winnerName.includes(',') ? `"${winnerName}"` : winnerName;

          csvContent += `${date},${escapedPlayer1},${escapedPlayer2},${score},${escapedWinner},${matchType},${eloChange}\n`;
        }
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const fileName = `tt-scorer-matches-${timestamp}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write to file (UTF8 is the default encoding)
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Match History',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to export matches:', error);
      throw error;
    }
  }

  /**
   * Export full database backup as JSON
   */
  static async backupDatabase(): Promise<void> {
    try {
      const [players, matches, tournaments] = await Promise.all([
        databaseService.getPlayers(),
        databaseService.getMatches(),
        databaseService.getTournaments(),
      ]);

      const backup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          players,
          matches: matches.map(match => ({
            ...match,
            // Convert Date objects to ISO strings for JSON serialization
            scheduledAt: match.scheduledAt?.toISOString(),
            startedAt: match.startedAt?.toISOString(),
            completedAt: match.completedAt?.toISOString(),
            createdAt: match.createdAt.toISOString(),
            updatedAt: match.updatedAt.toISOString(),
          })),
          tournaments: tournaments.map(tournament => ({
            ...tournament,
            startDate: tournament.startDate.toISOString(),
            endDate: tournament.endDate.toISOString(),
            createdAt: tournament.createdAt.toISOString(),
            updatedAt: tournament.updatedAt.toISOString(),
            // Simplify nested data
            participants: tournament.participants.map(p => p.id),
            matches: tournament.matches.map(m => m.id),
          })),
        },
      };

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const fileName = `tt-scorer-backup-${timestamp}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write to file (UTF8 is the default encoding)
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2));

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Database Backup',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to backup database:', error);
      throw error;
    }
  }

  /**
   * Export player statistics to CSV
   */
  static async exportPlayerStatsToCSV(): Promise<void> {
    try {
      const players = await databaseService.getPlayers();

      if (players.length === 0) {
        throw new Error('No players to export');
      }

      // CSV Header
      let csvContent = 'Player Name,Rating,Total Matches,Wins,Losses,Win %,Sets Won,Sets Lost,Sets %\n';

      // Get stats for each player
      for (const player of players) {
        const stats = await databaseService.getPlayerStatistics(player.id);

        const playerName = player.name.includes(',') ? `"${player.name}"` : player.name;
        const rating = player.rating || 1200;

        csvContent += `${playerName},${rating},${stats.totalMatches},${stats.wins},${stats.losses},${stats.winPercentage},${stats.setsWon},${stats.setsLost},${stats.setsPercentage}\n`;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const fileName = `tt-scorer-player-stats-${timestamp}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write to file (UTF8 is the default encoding)
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Player Statistics',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to export player stats:', error);
      throw error;
    }
  }

  /**
   * Export tournament bracket and results to CSV
   */
  static async exportTournamentToCSV(tournamentId: string): Promise<void> {
    try {
      const tournaments = await databaseService.getTournaments();
      const tournament = tournaments.find(t => t.id === tournamentId);

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const bracket = await databaseService.getTournamentBracket(tournamentId);

      if (bracket.length === 0) {
        throw new Error('No bracket data to export');
      }

      // Fetch detailed set scores for completed matches
      const detailedScores = new Map<string, string>();
      for (const match of bracket) {
        if (match.linkedMatchId && match.status === 'completed') {
          try {
            const sets = await databaseService.getMatchSets(match.linkedMatchId);
            const setScoresStr = sets
              .map(set => `${set.player1Score}-${set.player2Score}`)
              .join(', ');
            if (setScoresStr) {
              detailedScores.set(match.id, setScoresStr);
            }
          } catch (error) {
            console.warn(`Failed to fetch sets for match ${match.linkedMatchId}:`, error);
          }
        }
      }

      // Fetch standings for Round Robin and King of Court tournaments
      let standings: any[] = [];
      if (tournament.format === 'round_robin' || tournament.format === 'king_of_court') {
        try {
          standings = await databaseService.getTournamentStandings(tournamentId);
        } catch (error) {
          console.warn('Failed to fetch standings:', error);
        }
      }

      // CSV Header - Tournament Info
      let csvContent = 'TOURNAMENT DETAILS\n';
      csvContent += `Name,${tournament.name}\n`;
      csvContent += `Format,${tournament.format === 'single_elimination' ? 'Single Elimination' : tournament.format === 'round_robin' ? 'Round Robin' : 'King of Court'}\n`;
      csvContent += `Status,${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}\n`;
      csvContent += `Participants,${tournament.participants.length}\n`;
      csvContent += '\n';

      // Standings Section (for Round Robin and King of Court)
      if (standings.length > 0) {
        csvContent += 'STANDINGS\n';
        csvContent += 'Pos,Player/Team,Record (W-L),Sets,Win %\n';

        for (const standing of standings) {
          const playerName = standing.player.name;
          const escapedName = playerName.includes(',') ? `"${playerName}"` : playerName;
          const record = `${standing.matchWins}-${standing.matchLosses}`;
          const sets = `${standing.setWins}-${standing.setLosses} (${standing.setDifference >= 0 ? '+' : ''}${standing.setDifference})`;
          csvContent += `${standing.position},${escapedName},${record},${sets},${standing.winPercentage.toFixed(0)}%\n`;
        }
        csvContent += '\n';
      }

      // Matches Section
      csvContent += 'MATCHES\n';
      csvContent += 'Round,Player 1,Player 2,Result,Winner\n';

      // CSV Rows - organized by round
      const rounds = [...new Set(bracket.map(m => m.round))].sort((a, b) => a - b);

      for (const round of rounds) {
        const roundMatches = bracket.filter(m => m.round === round);

        for (const match of roundMatches) {
          const player1 = match.team1Name || match.player1Name || 'TBD';
          const player2 = match.team2Name || match.player2Name || 'TBD';

          // Build result string with detailed scores if available
          let result = '-';
          if (match.status === 'completed') {
            const setScores = detailedScores.get(match.id);
            if (setScores) {
              // Show detailed scores: "2-1 (11-9, 8-11, 11-7)"
              result = `${match.player1Sets || 0}-${match.player2Sets || 0} (${setScores})`;
            } else {
              // Show just set score: "2-1"
              result = `${match.player1Sets || 0}-${match.player2Sets || 0}`;
            }
          }

          // Determine the correct winner name
          let winner = '-';
          if (match.winnerId) {
            // For doubles, check team names first
            if (match.team1Name || match.team2Name) {
              if (match.winnerId === match.player1Id || match.winnerId === match.player3Id) {
                winner = match.team1Name || 'Team 1';
              } else if (match.winnerId === match.player2Id || match.winnerId === match.player4Id) {
                winner = match.team2Name || 'Team 2';
              }
            } else {
              // For singles, check which player won
              if (match.winnerId === match.player1Id) {
                winner = match.player1Name || 'TBD';
              } else if (match.winnerId === match.player2Id) {
                winner = match.player2Name || 'TBD';
              }
            }
          }

          // Escape commas in names and result
          const escapedPlayer1 = player1.includes(',') ? `"${player1}"` : player1;
          const escapedPlayer2 = player2.includes(',') ? `"${player2}"` : player2;
          const escapedWinner = winner.includes(',') ? `"${winner}"` : winner;
          const escapedResult = result.includes(',') ? `"${result}"` : result;

          csvContent += `Round ${round},${escapedPlayer1},${escapedPlayer2},${escapedResult},${escapedWinner}\n`;
        }
      }

      // Generate filename with tournament name and timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const tournamentName = tournament.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `tournament-${tournamentName}-${timestamp}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write to file (UTF8 is the default encoding)
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Tournament Bracket',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to export tournament:', error);
      throw error;
    }
  }

  /**
   * Get backup file info
   */
  static async getBackupInfo(): Promise<{ size: number; date: Date } | null> {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory || '');
      const backupFiles = files.filter(file => file.startsWith('tt-scorer-backup-'));

      if (backupFiles.length === 0) {
        return null;
      }

      // Get the most recent backup
      const latestBackup = backupFiles.sort().reverse()[0];
      const fileUri = `${FileSystem.documentDirectory}${latestBackup}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        return {
          size: fileInfo.size || 0,
          date: new Date(fileInfo.modificationTime || Date.now()),
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get backup info:', error);
      return null;
    }
  }
}
