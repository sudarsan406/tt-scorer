import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { OverallStatistics, PlayerStatistics, StatsPeriod } from '../types/models';
import { databaseService } from '../services/database';
import { ExportService } from '../services/exportService';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen({ navigation }: { navigation: any }) {
  const [overallStats, setOverallStats] = useState<OverallStatistics | null>(null);
  const [playerRankings, setPlayerRankings] = useState<PlayerStatistics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | StatsPeriod>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerForCharts, setSelectedPlayerForCharts] = useState<string | null>(null);
  const [eloHistory, setEloHistory] = useState<Array<{ date: string; rating: number; matchId: string; opponent: string; won: boolean }>>([]);
  const [winLossTrends, setWinLossTrends] = useState<Array<{ label: string; wins: number; losses: number; winPercentage: number }>>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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

      // Auto-select top player for charts if available
      if (rankings.length > 0 && !selectedPlayerForCharts) {
        const topPlayer = rankings[0];
        if (topPlayer.player) {
          setSelectedPlayerForCharts(topPlayer.player.id);
          loadPlayerCharts(topPlayer.player.id);
        }
      } else if (selectedPlayerForCharts) {
        loadPlayerCharts(selectedPlayerForCharts);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerCharts = async (playerId: string) => {
    try {
      setChartLoading(true);
      const [history, trends] = await Promise.all([
        databaseService.getPlayerEloHistory(playerId, 15),
        databaseService.getWinLossTrends(playerId, 'week')
      ]);
      setEloHistory(history);
      setWinLossTrends(trends);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerForCharts(playerId);
    loadPlayerCharts(playerId);
  };

  const handleExport = async () => {
    if (playerRankings.length === 0) {
      Alert.alert('No Data', 'No player statistics to export');
      return;
    }

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

    const isSelected = selectedPlayerForCharts === playerStats.player.id;

    return (
      <TouchableOpacity
        key={playerStats.player.id}
        style={[styles.rankingCard, isSelected && styles.rankingCardSelected]}
        onPress={() => handlePlayerSelect(playerStats.player!.id)}
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
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color="#2196F3" style={styles.checkmark} />
      )}
    </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics Overview</Text>
        <TouchableOpacity
          style={[styles.exportButtonHeader, exporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={exporting || playerRankings.length === 0}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#fff" />
          )}
        </TouchableOpacity>
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
        <Text style={styles.sectionSubtitle}>Tap a player to view their analytics</Text>
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

      {selectedPlayerForCharts && playerRankings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Analytics: {playerRankings.find(p => p.player?.id === selectedPlayerForCharts)?.player?.name || 'Player'}
          </Text>

          {chartLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading charts...</Text>
            </View>
          ) : (
            <>
              {eloHistory.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Elo Rating Progression</Text>
                  <Text style={styles.chartSubtitle}>Last {eloHistory.length} matches</Text>
                  <LineChart
                    data={{
                      labels: eloHistory.map((_, idx) => idx % 3 === 0 ? `M${idx + 1}` : ''),
                      datasets: [{
                        data: eloHistory.map(h => h.rating),
                        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                        strokeWidth: 3
                      }]
                    }}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: '#2196F3',
                        fill: '#2196F3'
                      }
                    }}
                    bezier
                    style={styles.chart}
                  />
                  <View style={styles.matchResultsRow}>
                    {eloHistory.map((match, idx) => (
                      <View key={idx} style={styles.matchResult}>
                        <View style={[
                          styles.matchDot,
                          { backgroundColor: match.won ? '#4CAF50' : '#F44336' }
                        ]} />
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartNote}>
                    <Text style={styles.chartNoteText}>
                      • Green = Win  • Red = Loss
                    </Text>
                  </View>
                </View>
              )}

              {winLossTrends.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Win/Loss Trends</Text>
                  <Text style={styles.chartSubtitle}>Weekly performance over time</Text>
                  <BarChart
                    data={{
                      labels: winLossTrends.map(t => t.label.split(' ')[0]),
                      datasets: [{
                        data: winLossTrends.map(t => t.winPercentage)
                      }]
                    }}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix="%"
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16
                      }
                    }}
                    style={styles.chart}
                    fromZero
                  />
                  <View style={styles.trendsDetails}>
                    {winLossTrends.slice(-3).reverse().map((trend, idx) => (
                      <View key={idx} style={styles.trendItem}>
                        <Text style={styles.trendLabel}>{trend.label}</Text>
                        <Text style={styles.trendStats}>
                          {trend.wins}W - {trend.losses}L ({trend.winPercentage}%)
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {eloHistory.length === 0 && winLossTrends.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="analytics-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No analytics data yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Play more matches to see analytics
                  </Text>
                </View>
              )}
            </>
          )}
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  exportButtonHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    marginTop: -10,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rankingCardSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  checkmark: {
    marginLeft: 8,
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
  chartContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLoadingContainer: {
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
  matchResultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  matchResult: {
    alignItems: 'center',
  },
  matchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartNote: {
    marginTop: 8,
    alignItems: 'center',
  },
  chartNoteText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  trendsDetails: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  trendStats: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
});