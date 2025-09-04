import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match, GameSet } from '../types/models';

export default function MatchesScreen({ navigation }: { navigation: any }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [matchDetails, setMatchDetails] = useState<Record<string, GameSet[]>>({});

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMatches();
    });
    return unsubscribe;
  }, [navigation]);

  const loadMatches = async () => {
    try {
      const { databaseService } = await import('../services/database');
      const matchesData = await databaseService.getMatches();
      setMatches(matchesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const toggleMatchExpansion = async (matchId: string) => {
    const newExpandedMatches = new Set(expandedMatches);
    
    if (expandedMatches.has(matchId)) {
      newExpandedMatches.delete(matchId);
    } else {
      newExpandedMatches.add(matchId);
      
      // Load detailed scores if not already loaded
      if (!matchDetails[matchId]) {
        try {
          const { databaseService } = await import('../services/database');
          const sets = await databaseService.getMatchSets(matchId);
          setMatchDetails(prev => ({ ...prev, [matchId]: sets }));
        } catch (error) {
          console.error('Failed to load match details:', error);
        }
      }
    }
    
    setExpandedMatches(newExpandedMatches);
  };

  const handleNewMatch = () => {
    navigation.navigate('QuickMatch');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      case 'scheduled':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderMatch = ({ item }: { item: Match }) => {
    const isExpanded = expandedMatches.has(item.id);
    const sets = matchDetails[item.id] || [];
    
    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.playersInfo}>
            <Text style={styles.playerName}>
              {item.isDoubles ? item.team1Name : item.player1.name}
            </Text>
            <Text style={styles.vsText}>vs</Text>
            <Text style={styles.playerName}>
              {item.isDoubles ? item.team2Name : item.player2.name}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>
        
        {item.status === 'completed' && (
          <TouchableOpacity 
            style={styles.scoreSection}
            onPress={() => toggleMatchExpansion(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.scoreRow}>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreText}>
                  {item.player1Sets} - {item.player2Sets}
                </Text>
                {item.winnerId && (
                  <Text style={styles.winnerText}>
                    Winner: {item.winnerId === item.player1Id ? 
                      (item.isDoubles ? item.team1Name : item.player1.name) : 
                      (item.isDoubles ? item.team2Name : item.player2.name)}
                  </Text>
                )}
              </View>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#2196F3" 
              />
            </View>
          </TouchableOpacity>
        )}
        
        {item.status === 'completed' && isExpanded && sets.length > 0 && (
          <View style={styles.detailedScores}>
            <Text style={styles.detailedScoresTitle}>Set Scores:</Text>
            {sets.map((set, index) => (
              <View key={set.id} style={styles.setScore}>
                <Text style={styles.setNumber}>Set {set.setNumber}:</Text>
                <Text style={[
                  styles.setScoreText,
                  set.winnerId === item.player1Id ? styles.player1Winner : styles.player2Winner
                ]}>
                  {set.player1Score} - {set.player2Score}
                </Text>
                {set.player1Score > 10 && set.player2Score > 10 && (
                  <Text style={styles.deuceIndicator}>Deuce</Text>
                )}
              </View>
            ))}
          </View>
        )}
      
        {item.status === 'in_progress' && (
          <View style={styles.scoreSection}>
            <View style={styles.mainScore}>
              <Text style={styles.scoreText}>
                Sets: {item.player1Sets} - {item.player2Sets}
              </Text>
              <Text style={styles.currentSetText}>Current Set: {item.currentSet}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.matchFooter}>
          <Text style={styles.dateText}>
            {item.scheduledAt ? 
              `Scheduled: ${item.scheduledAt.toLocaleDateString()}` :
              `Created: ${item.createdAt.toLocaleDateString()}`
            }
          </Text>
          {item.status !== 'completed' && (
            <Ionicons name="chevron-forward" size={20} color="#666" />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newMatchButton} onPress={handleNewMatch}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.newMatchButtonText}>New Match</Text>
      </TouchableOpacity>

      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No matches yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first match to get started</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          style={styles.matchesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  },
  newMatchButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  newMatchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  matchesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  matchCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playersInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vsText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreSection: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  scoreInfo: {
    alignItems: 'center',
    flex: 1,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  winnerText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  currentSetText: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 4,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainScore: {
    alignItems: 'center',
  },
  detailedScores: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  detailedScoresTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  setScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  setNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  setScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  player1Winner: {
    color: '#4CAF50',
  },
  player2Winner: {
    color: '#2196F3',
  },
  deuceIndicator: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginLeft: 8,
  },
});