import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { Match, Player } from '../types/models';
import { ExportService } from '../services/exportService';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { isReady, error } = useDatabaseContext();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadHomeData();
    }
  }, [isReady]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isReady) {
        loadHomeData();
      }
    });
    return unsubscribe;
  }, [navigation, isReady]);

  const loadHomeData = async () => {
    try {
      const { databaseService } = await import('../services/database');

      const [matches, players] = await Promise.all([
        databaseService.getMatches(),
        databaseService.getPlayers()
      ]);

      setRecentMatches(matches.slice(0, 5));
      setTopPlayers(players.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3));

    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const handleExportMatches = async () => {
    setExportMenuVisible(false);
    setExporting(true);
    try {
      await ExportService.exportMatchesToCSV();
      Alert.alert(
        'Success',
        'Match history exported successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export match history',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportPlayerStats = async () => {
    setExportMenuVisible(false);
    setExporting(true);
    try {
      await ExportService.exportPlayerStatsToCSV();
      Alert.alert(
        'Success',
        'Player statistics exported successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export player statistics',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const handleBackupDatabase = async () => {
    setExportMenuVisible(false);
    setExporting(true);
    try {
      await ExportService.backupDatabase();
      Alert.alert(
        'Success',
        'Database backup created successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Backup Failed',
        error instanceof Error ? error.message : 'Failed to create database backup',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };


  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.topHeader}>
          <View style={styles.brandContainer}>
            <View style={styles.ttContainer}>
              <Text style={styles.ttLetter1}>T</Text>
              <Text style={styles.ttLetter2}>T</Text>
            </View>
            <View style={styles.scorerContainer}>
              <View style={styles.scoreBoard}>
                <Text style={styles.scorerText}>Scorer</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setExportMenuVisible(true)}
          >
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.welcomeText}>Ready to play?</Text>
        <Text style={styles.subtitleText}>Start a match or create a tournament</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('QuickMatch')}>
            <Ionicons name="play-circle" size={32} color="#2196F3" />
            <Text style={styles.quickActionText}>Start Match</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('TournamentCreate')}>
            <Ionicons name="trophy" size={32} color="#FF9800" />
            <Text style={styles.quickActionText}>Tournament</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Main', { screen: 'Players' })}>
            <Ionicons name="people" size={32} color="#4CAF50" />
            <Text style={styles.quickActionText}>Players</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Main', { screen: 'Stats' })}>
            <Ionicons name="stats-chart" size={32} color="#9C27B0" />
            <Text style={styles.quickActionText}>Stats</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Matches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          {recentMatches.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Matches' })}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {recentMatches.length > 0 ? (
          <View style={styles.matchesList}>
            {recentMatches.map((match) => (
              <TouchableOpacity 
                key={match.id} 
                style={styles.matchCard}
                onPress={() => navigation.navigate('Main', { screen: 'Matches' })}
              >
                <View style={styles.matchInfo}>
                  <Text style={styles.matchPlayers}>
                    {match.isDoubles ? match.team1Name : match.player1.name} vs{' '}
                    {match.isDoubles ? match.team2Name : match.player2.name}
                  </Text>
                  <Text style={styles.matchScore}>
                    {match.status === 'completed' 
                      ? `${match.player1Sets}-${match.player2Sets}` 
                      : match.status}
                  </Text>
                </View>
                <View style={[styles.statusDot, { 
                  backgroundColor: match.status === 'completed' ? '#4CAF50' : 
                                 match.status === 'in_progress' ? '#FF9800' : '#2196F3'
                }]} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="play-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubtext}>Start your first match to see activity here</Text>
          </View>
        )}
      </View>

      {/* Top Players */}
      {topPlayers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Players</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Players' })}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.playersList}>
            {topPlayers.map((player, index) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerRating}>{player.rating} rating</Text>
                </View>
                <Ionicons name="trophy" size={20} color="#FFD700" />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Export Menu Modal */}
      <Modal
        visible={exportMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExportMenuVisible(false)}
        >
          <View style={styles.exportMenu}>
            <View style={styles.exportMenuHeader}>
              <Ionicons name="download" size={24} color="#2196F3" />
              <Text style={styles.exportMenuTitle}>Export Data</Text>
            </View>

            <TouchableOpacity
              style={styles.exportMenuItem}
              onPress={handleExportMatches}
            >
              <Ionicons name="list" size={24} color="#4CAF50" />
              <View style={styles.exportMenuItemText}>
                <Text style={styles.exportMenuItemTitle}>Match History</Text>
                <Text style={styles.exportMenuItemSubtitle}>Export all matches to CSV</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportMenuItem}
              onPress={handleExportPlayerStats}
            >
              <Ionicons name="stats-chart" size={24} color="#9C27B0" />
              <View style={styles.exportMenuItemText}>
                <Text style={styles.exportMenuItemTitle}>Player Statistics</Text>
                <Text style={styles.exportMenuItemSubtitle}>Export player stats to CSV</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportMenuItem}
              onPress={handleBackupDatabase}
            >
              <Ionicons name="cloud-upload" size={24} color="#FF9800" />
              <View style={styles.exportMenuItemText}>
                <Text style={styles.exportMenuItemTitle}>Full Backup</Text>
                <Text style={styles.exportMenuItemSubtitle}>Backup entire database to JSON</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportMenuCancel}
              onPress={() => setExportMenuVisible(false)}
            >
              <Text style={styles.exportMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Export Loading Modal */}
      <Modal
        visible={exporting}
        transparent
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingCardText}>Exporting data...</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  headerSection: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  topHeader: {
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 0,
  },
  ttContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 0,
  },
  ttLetter1: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    transform: [{ rotate: '-8deg' }, { translateY: -4 }],
    marginRight: -4,
  },
  ttLetter2: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    transform: [{ rotate: '8deg' }, { translateY: 4 }],
  },
  scorerContainer: {
    alignSelf: 'flex-end',
    marginBottom: 4,
    marginLeft: -8,
  },
  scoreBoard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
    opacity: 0.95,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#E3F2FD',
    opacity: 0.85,
    lineHeight: 20,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  matchesList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  matchInfo: {
    flex: 1,
  },
  matchPlayers: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 14,
    color: '#666',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  playersList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  playerRating: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  exportMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  exportMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exportMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  exportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    marginBottom: 10,
  },
  exportMenuItemText: {
    flex: 1,
    marginLeft: 15,
  },
  exportMenuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  exportMenuItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  exportMenuCancel: {
    marginTop: 10,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  exportMenuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingCardText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});