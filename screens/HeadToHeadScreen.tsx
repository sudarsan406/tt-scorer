import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService } from '../services/database';
import { Player } from '../types/models';

interface HeadToHeadScreenProps {
  route: {
    params: {
      player1Id: string;
      player2Id: string;
    };
  };
  navigation: any;
}

export default function HeadToHeadScreen({ route, navigation }: HeadToHeadScreenProps) {
  const { player1Id, player2Id } = route.params;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeadToHeadStats();
  }, [player1Id, player2Id]);

  const loadHeadToHeadStats = async () => {
    try {
      const h2hStats = await databaseService.getHeadToHeadStats(player1Id, player2Id);
      setStats(h2hStats);
      navigation.setOptions({
        title: `${h2hStats.player1.name} vs ${h2hStats.player2.name}`
      });
    } catch (error) {
      console.error('Failed to load head-to-head stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No head-to-head data available</Text>
      </View>
    );
  }

  const player1WinPercentage = stats.totalMatches > 0
    ? Math.round((stats.player1Wins / stats.totalMatches) * 100)
    : 0;
  const player2WinPercentage = 100 - player1WinPercentage;

  const getStreakPlayer = () => {
    if (stats.longestWinStreak.playerId === player1Id) {
      return stats.player1.name;
    }
    return stats.player2.name;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Overall Record */}
      <View style={styles.recordSection}>
        <View style={styles.playerColumn}>
          <Text style={styles.playerName}>{stats.player1.name}</Text>
          <Text style={[styles.winsText, styles.player1Color]}>{stats.player1Wins}</Text>
          <Text style={styles.percentageText}>{player1WinPercentage}%</Text>
        </View>

        <View style={styles.vsColumn}>
          <Ionicons name="tennisball" size={32} color="#666" />
          <Text style={styles.totalMatchesText}>{stats.totalMatches}</Text>
          <Text style={styles.totalMatchesLabel}>Matches</Text>
        </View>

        <View style={styles.playerColumn}>
          <Text style={styles.playerName}>{stats.player2.name}</Text>
          <Text style={[styles.winsText, styles.player2Color]}>{stats.player2Wins}</Text>
          <Text style={styles.percentageText}>{player2WinPercentage}%</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="trophy-outline" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stats.player1SetsWon} - {stats.player2SetsWon}</Text>
          <Text style={styles.statLabel}>Sets Won</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.longestWinStreak.streak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
          <Text style={styles.statSubLabel}>{getStreakPlayer()}</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="analytics-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{stats.averageScoreDifference}</Text>
          <Text style={styles.statLabel}>Avg Set Diff</Text>
        </View>
      </View>

      {/* Recent Matches */}
      {stats.lastFiveResults.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          {stats.lastFiveResults.map((result: any, index: number) => {
            const winner = result.winnerId === player1Id ? stats.player1.name : stats.player2.name;
            const isPlayer1Win = result.winnerId === player1Id;

            return (
              <View key={index} style={styles.matchCard}>
                <View style={styles.matchInfo}>
                  <Ionicons
                    name={isPlayer1Win ? 'arrow-forward' : 'arrow-back'}
                    size={20}
                    color={isPlayer1Win ? '#4CAF50' : '#F44336'}
                  />
                  <Text style={styles.matchWinner}>{winner}</Text>
                </View>
                <View style={styles.matchScore}>
                  <Text style={styles.scoreText}>{result.score}</Text>
                  <Text style={styles.dateText}>
                    {new Date(result.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {stats.totalMatches === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="tennisball-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No matches played yet</Text>
          <Text style={styles.emptySubText}>
            Start a match between these players to see head-to-head stats
          </Text>
        </View>
      )}
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
  recordSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  vsColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  winsText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  player1Color: {
    color: '#2196F3',
  },
  player2Color: {
    color: '#4CAF50',
  },
  percentageText: {
    fontSize: 14,
    color: '#666',
  },
  totalMatchesText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  totalMatchesLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  recentSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  matchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchWinner: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  matchScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});
