import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OverallStatistics, PlayerStatistics, StatsPeriod } from '../types/models';
import { databaseService } from '../services/database';

export default function StatsScreen({ navigation }: { navigation: any }) {
  const [overallStats, setOverallStats] = useState<OverallStatistics | null>(null);
  const [playerRankings, setPlayerRankings] = useState<PlayerStatistics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | StatsPeriod>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStatistics();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStatistics = async () => {
    try {
      setError(null);
      setLoading(true);

      const [overall, rankings] = await Promise.all([
        databaseService.getOverallStatistics(),
        databaseService.getAllPlayersStatistics(
          selectedPeriod === 'all' ? undefined : selectedPeriod as StatsPeriod
        )
      ]);
      
      setOverallStats(overall);
      setPlayerRankings(rankings);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce the API call to prevent excessive requests when changing periods
    const timeoutId = setTimeout(() => {
      loadStatistics();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [selectedPeriod]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
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
          onPress={loadStatistics}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const overallStatsCards = [
    { label: 'Total Players', value: overallStats?.totalPlayers || 0, icon: 'people' },
    { label: 'Total Matches', value: overallStats?.completedMatches || 0, icon: 'trophy' },
    { label: 'Tournaments', value: overallStats?.completedTournaments || 0, icon: 'medal' },
    { label: 'Active Players', value: playerRankings.filter(p => p.totalMatches > 0).length, icon: 'trending-up' },
  ];

  const renderPlayerRanking = (playerStats: PlayerStatistics, index: number) => {
    if (!playerStats.player) {
      return null;
    }

    return (
      <TouchableOpacity 
        key={playerStats.player.id} 
        style={styles.rankingCard}
        onPress={() => navigation.navigate('PlayerStats', { playerId: playerStats.player!.id })}
      >
      <View style={styles.rankingPosition}>
        <Text style={styles.rankingNumber}>#{index + 1}</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{playerStats.player.name}</Text>
        <Text style={styles.playerRecord}>
          {playerStats.wins}W - {playerStats.losses}L ({playerStats.winPercentage}%)
        </Text>
      </View>
      <View style={styles.playerStats}>
        <Text style={styles.statValue}>{playerStats.winPercentage}%</Text>
        <Text style={styles.statSubtext}>Win Rate</Text>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics Overview</Text>
      </View>

      <View style={styles.statsGrid}>
        {overallStatsCards.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={24} color="#2196F3" />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.periodSelector}>
        <Text style={styles.periodTitle}>Rankings Period</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScrollView}>
          {[
            { key: 'all', label: 'All Time' },
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '3m', label: '3 Months' },
            { key: '6m', label: '6 Months' },
            { key: '1y', label: '1 Year' }
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Rankings</Text>
        {playerRankings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="podium-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No rankings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add players and play matches to see rankings
            </Text>
          </View>
        ) : (
          <View style={styles.rankingsContainer}>
            {playerRankings.slice(0, 10).map(renderPlayerRanking)}
            {playerRankings.length > 10 && (
              <Text style={styles.moreText}>
                And {playerRankings.length - 10} more players...
              </Text>
            )}
          </View>
        )}
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
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
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
  statSubtext: {
    fontSize: 12,
    color: '#666',
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
  rankingsContainer: {
    gap: 10,
  },
  rankingCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankingPosition: {
    width: 40,
    alignItems: 'center',
  },
  rankingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  playerRecord: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  playerStats: {
    alignItems: 'center',
  },
  moreText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  periodSelector: {
    margin: 20,
    marginTop: 0,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  periodScrollView: {
    marginTop: 5,
  },
  periodButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
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