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
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [playerMatches, setPlayerMatches] = useState<{ [playerId: string]: any[] }>({});

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

  const togglePlayerExpansion = async (playerId: string) => {
    const newExpanded = new Set(expandedPlayers);

    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId);
      // Clear selected player when collapsing
      if (selectedPlayerForCharts === playerId) {
        setSelectedPlayerForCharts(null);
      }
    } else {
      newExpanded.add(playerId);

      // Set this player as selected for charts
      setSelectedPlayerForCharts(playerId);

      // Load charts data for this player
      loadPlayerCharts(playerId);

      // Load player matches if not already loaded
      if (!playerMatches[playerId]) {
        try {
          console.log('Loading matches for player:', playerId);
          const matches = await databaseService.getPlayerMatches(playerId, 5);
          console.log('Loaded matches:', matches);
          setPlayerMatches(prev => ({
            ...prev,
            [playerId]: matches
          }));
        } catch (error) {
          console.error('Failed to load player matches:', error);
        }
      }
    }

    setExpandedPlayers(newExpanded);
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

    const isExpanded = expandedPlayers.has(playerStats.player.id);
    const matches = playerMatches[playerStats.player.id] || [];

    return (
      <View key={playerStats.player.id} style={styles.playerCard}>
        <TouchableOpacity
          style={styles.playerCardHeader}
          onPress={() => playerStats.player && togglePlayerExpansion(playerStats.player.id)}
        >
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>

          <View style={styles.playerMainInfo}>
            <Text style={styles.playerName}>{playerStats.player.name}</Text>
            <View style={styles.compactStatsRow}>
              <View style={styles.compactStatItem}>
                <Text style={styles.compactStatValue}>{playerStats.wins}-{playerStats.losses}</Text>
                <Text style={styles.compactStatLabel}>W-L</Text>
              </View>
              <View style={styles.compactStatDivider} />
              <View style={styles.compactStatItem}>
                <Text style={[styles.compactStatValue, { color: '#4CAF50' }]}>{playerStats.winPercentage}%</Text>
                <Text style={styles.compactStatLabel}>Win</Text>
              </View>
              <View style={styles.compactStatDivider} />
              <View style={styles.compactStatItem}>
                <Text style={styles.compactStatValue}>{playerStats.totalMatches || 0}</Text>
                <Text style={styles.compactStatLabel}>Games</Text>
              </View>
              <View style={styles.compactStatDivider} />
              <View style={styles.compactStatItem}>
                <Text style={[styles.compactStatValue, { color: '#2196F3' }]}>{Math.round(playerStats.eloRating || 1200)}</Text>
                <Text style={styles.compactStatLabel}>Rating</Text>
              </View>
            </View>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
            style={styles.expandIcon}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedSection}>
              <Text style={styles.expandedSectionTitle}>Recent Matches</Text>
              {matches.length > 0 ? (
                matches.map((match: any, idx: number) => (
                  <View key={match.id || idx} style={styles.matchHistoryItem}>
                    <View style={[
                      styles.matchResultIndicator,
                      { backgroundColor: match.winnerId === playerStats.player?.id ? '#4CAF50' : '#f44336' }
                    ]} />
                    <View style={styles.matchHistoryDetails}>
                      <Text style={styles.matchOpponent}>
                        vs {match.opponentName || 'Unknown'}
                      </Text>
                      <Text style={styles.matchScore}>
                        {match.player1Sets || 0} - {match.player2Sets || 0}
                      </Text>
                    </View>
                    <Text style={styles.matchDate}>
                      {new Date(match.completedAt || match.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noMatchesText}>No recent matches</Text>
              )}
            </View>

            {/* Analytics Charts - Now integrated directly in player card */}
            {selectedPlayerForCharts === playerStats.player.id && (
              <View style={styles.chartsInCard}>
                {chartLoading ? (
                  <View style={styles.chartLoadingInline}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={styles.loadingTextInline}>Loading analytics...</Text>
                  </View>
                ) : (
                  <>
                    {eloHistory.length > 0 && (
                      <View style={styles.chartContainerInline}>
                        <Text style={styles.chartTitleInline}>Rating Trend</Text>
                        <LineChart
                          data={{
                            labels: eloHistory.map((_, idx) => idx % 3 === 0 ? `M${idx + 1}` : ''),
                            datasets: [{
                              data: eloHistory.map(h => h.rating),
                              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                              strokeWidth: 2
                            }]
                          }}
                          width={screenWidth - 80}
                          height={180}
                          chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: { borderRadius: 8 },
                            propsForDots: {
                              r: '3',
                              strokeWidth: '1',
                              stroke: '#2196F3',
                              fill: '#2196F3'
                            }
                          }}
                          bezier
                          style={styles.chartInline}
                        />
                      </View>
                    )}

                    {winLossTrends.length > 0 && (
                      <View style={styles.chartContainerInline}>
                        <Text style={styles.chartTitleInline}>Win Rate Trend</Text>
                        <BarChart
                          data={{
                            labels: winLossTrends.slice(-4).map(t => t.label.split(' ')[0]),
                            datasets: [{
                              data: winLossTrends.slice(-4).map(t => t.winPercentage)
                            }]
                          }}
                          width={screenWidth - 80}
                          height={180}
                          yAxisLabel=""
                          yAxisSuffix="%"
                          chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: { borderRadius: 8 }
                          }}
                          style={styles.chartInline}
                          fromZero
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </View>
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
  // New styles for improved player cards
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  playerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerMainInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  compactStatValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  compactStatLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
  compactStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
  },
  expandIcon: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  expandedContent: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  expandedSection: {
    padding: 16,
  },
  expandedSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  matchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  matchResultIndicator: {
    width: 4,
    height: 30,
    borderRadius: 2,
    marginRight: 12,
  },
  matchHistoryDetails: {
    flex: 1,
  },
  matchOpponent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  matchScore: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  noMatchesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewChartsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    gap: 8,
  },
  viewChartsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  chartsInCard: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chartLoadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingTextInline: {
    fontSize: 14,
    color: '#2196F3',
  },
  chartContainerInline: {
    marginBottom: 16,
  },
  chartTitleInline: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  chartInline: {
    borderRadius: 8,
    marginVertical: 4,
  },
});