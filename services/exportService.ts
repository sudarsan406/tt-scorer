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
