import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import { Match, Player } from '../types/models';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { isReady, error } = useDatabaseContext();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalPlayers: 0,
    completedToday: 0
  });

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
      
      const today = new Date().setHours(0, 0, 0, 0);
      const completedToday = matches.filter(m => 
        m.status === 'completed' && 
        m.completedAt && 
        new Date(m.completedAt).getTime() >= today
      ).length;
      
      setStats({
        totalMatches: matches.length,
        totalPlayers: players.length,
        completedToday
      });
    } catch (error) {
      console.error('Failed to load home data:', error);
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
      {/* Header Stats */}
      <View style={styles.headerSection}>
        <Text style={styles.welcomeTitle}>🏓 TT Score</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('QuickMatch')}>
            <Ionicons name="play-circle" size={32} color="#2196F3" />
            <Text style={styles.quickActionText}>Quick Match</Text>
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
            <Text style={styles.quickActionText}>Statistics</Text>
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
    padding: 20,
    paddingTop: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 4,
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
});