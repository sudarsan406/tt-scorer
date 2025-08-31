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
import { Player, PlayerStatistics, TrendingStats, StatsPeriod } from '../types/models';
import { databaseService } from '../services/database';

interface PlayerStatsScreenProps {
  navigation: any;
  route: any;
}

export default function PlayerStatsScreen({ navigation, route }: PlayerStatsScreenProps) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [trendingStats, setTrendingStats] = useState<TrendingStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | StatsPeriod>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      if (!playerId) {
        throw new Error('No player ID provided');
      }

      const [playersData, playerStats, trendingData] = await Promise.all([
        databaseService.getPlayers(),
        databaseService.getPlayerStatistics(
          playerId, 
          selectedPeriod === 'all' ? undefined : selectedPeriod as StatsPeriod
        ),
        databaseService.getPlayerTrendingStats(playerId)
      ]);
      
      const playerData = playersData.find(p => p.id === playerId);
      if (!playerData) {
        throw new Error('Player not found');
      }
      
      setPlayer(playerData);
      setStats(playerStats);
      setTrendingStats(trendingData);
    } catch (error) {
      console.error('Failed to load player data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load player data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (player) {
      // Debounce the API call to prevent excessive requests
      const timeoutId = setTimeout(() => {
        loadPlayerData();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedPeriod]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading player statistics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadPlayerData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!player || !stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Player not found</Text>
      </View>
    );
  }

  const getStreakIcon = () => {
    if (stats.streakType === 'win') return 'trending-up';
    if (stats.streakType === 'loss') return 'trending-down';
    return 'remove';
  };

  const getStreakColor = () => {
    if (stats.streakType === 'win') return '#4CAF50';
    if (stats.streakType === 'loss') return '#F44336';
    return '#666';
  };

  const renderStatCard = (icon: string, label: string, value: string | number, color: string = '#2196F3') => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderRecentMatch = (match: any, index: number) => (
    <View key={index} style={[styles.matchCard, match.isWin ? styles.winCard : styles.lossCard]}>
      <View style={styles.matchResult}>
        <Ionicons 
          name={match.isWin ? 'checkmark-circle' : 'close-circle'} 
          size={20} 
          color={match.isWin ? '#4CAF50' : '#F44336'} 
        />
        <Text style={[styles.matchResultText, { color: match.isWin ? '#4CAF50' : '#F44336' }]}>
          {match.isWin ? 'WIN' : 'LOSS'}
        </Text>
      </View>
      <View style={styles.matchDetails}>
        <Text style={styles.matchScore}>{match.score}</Text>
        <Text style={styles.matchDate}>
          {new Date(match.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerRating}>Rating: {player.rating}</Text>
        </View>
      </View>

      <View style={styles.periodSelector}>
        <Text style={styles.sectionTitle}>Time Period</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScrollView}>
          {[
            { key: 'all', label: 'All Time' },
            { key: '7d', label: 'Last 7 Days' },
            { key: '30d', label: 'Last 30 Days' },
            { key: '3m', label: 'Last 3 Months' },
            { key: '6m', label: 'Last 6 Months' },
            { key: '1y', label: 'Last Year' }
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key as 'all' | StatsPeriod)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('trophy', 'Matches Played', stats.totalMatches)}
        {renderStatCard('checkmark-circle', 'Wins', stats.wins, '#4CAF50')}
        {renderStatCard('close-circle', 'Losses', stats.losses, '#F44336')}
        {renderStatCard('percent', 'Win Rate', `${stats.winPercentage}%`, '#FF9800')}
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('albums', 'Sets Won', stats.setsWon, '#9C27B0')}
        {renderStatCard('albums-outline', 'Sets Lost', stats.setsLost, '#795548')}
        {renderStatCard('trending-up', 'Set Win Rate', `${stats.setsPercentage}%`, '#00BCD4')}
        {renderStatCard(getStreakIcon(), `${stats.streakType === 'win' ? 'Win' : stats.streakType === 'loss' ? 'Loss' : 'No'} Streak`, stats.currentStreak, getStreakColor())}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Matches</Text>
        {stats.recentMatches && stats.recentMatches.length > 0 ? (
          <View style={styles.recentMatches}>
            {stats.recentMatches.map(renderRecentMatch)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No matches played yet</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Trends</Text>
        {trendingStats.length > 0 && (
          <View style={styles.trendingContainer}>
            {trendingStats.map((trend, index) => (
              <View key={trend.period} style={styles.trendCard}>
                <Text style={styles.trendPeriod}>{trend.label}</Text>
                <View style={styles.trendStats}>
                  <View style={styles.trendStat}>
                    <Text style={styles.trendValue}>{trend.totalMatches}</Text>
                    <Text style={styles.trendLabel}>Matches</Text>
                  </View>
                  <View style={styles.trendStat}>
                    <Text style={[styles.trendValue, { color: '#4CAF50' }]}>{trend.wins}</Text>
                    <Text style={styles.trendLabel}>Wins</Text>
                  </View>
                  <View style={styles.trendStat}>
                    <Text style={[styles.trendValue, { color: '#F44336' }]}>{trend.losses}</Text>
                    <Text style={styles.trendLabel}>Losses</Text>
                  </View>
                  <View style={styles.trendStat}>
                    <Text style={[styles.trendValue, { color: '#FF9800' }]}>{trend.winPercentage}%</Text>
                    <Text style={styles.trendLabel}>Win Rate</Text>
                  </View>
                </View>
                <View style={styles.trendBar}>
                  <View 
                    style={[
                      styles.trendBarFill, 
                      { 
                        width: `${trend.winPercentage}%`,
                        backgroundColor: trend.winPercentage >= 70 ? '#4CAF50' : trend.winPercentage >= 50 ? '#FF9800' : '#F44336'
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Overall Performance</Text>
            <View style={styles.performanceBar}>
              <View 
                style={[
                  styles.performanceFill, 
                  { 
                    width: `${stats.winPercentage}%`,
                    backgroundColor: stats.winPercentage >= 70 ? '#4CAF50' : stats.winPercentage >= 50 ? '#FF9800' : '#F44336'
                  }
                ]} 
              />
            </View>
            <Text style={styles.performanceValue}>{stats.winPercentage}%</Text>
          </View>
          
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Set Performance</Text>
            <View style={styles.performanceBar}>
              <View 
                style={[
                  styles.performanceFill, 
                  { 
                    width: `${stats.setsPercentage}%`,
                    backgroundColor: stats.setsPercentage >= 70 ? '#4CAF50' : stats.setsPercentage >= 50 ? '#FF9800' : '#F44336'
                  }
                ]} 
              />
            </View>
            <Text style={styles.performanceValue}>{stats.setsPercentage}%</Text>
          </View>
        </View>
      </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerRating: {
    fontSize: 16,
    color: '#e3f2fd',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingBottom: 0,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recentMatches: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
  },
  winCard: {
    borderLeftColor: '#4CAF50',
  },
  lossCard: {
    borderLeftColor: '#F44336',
  },
  matchResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchResultText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  matchDetails: {
    alignItems: 'flex-end',
  },
  matchScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  matchDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  performanceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceRow: {
    marginBottom: 20,
  },
  performanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  performanceBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  performanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  periodSelector: {
    margin: 20,
    marginBottom: 0,
  },
  periodScrollView: {
    marginTop: 10,
  },
  periodButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  trendingContainer: {
    gap: 15,
  },
  trendCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trendPeriod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  trendStat: {
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trendBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});