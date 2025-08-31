import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tournament } from '../types/models';
import { databaseService } from '../services/database';

interface TournamentsScreenProps {
  navigation: any;
}

export default function TournamentsScreen({ navigation }: TournamentsScreenProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTournaments();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTournaments = async () => {
    try {
      const tournamentsData = await databaseService.getTournaments();
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      Alert.alert('Error', 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTournament = () => {
    navigation.navigate('TournamentCreate');
  };

  const handleTournamentPress = (tournament: Tournament) => {
    navigation.navigate('TournamentDetail', { tournamentId: tournament.id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      case 'upcoming':
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
      case 'upcoming':
        return 'Upcoming';
      default:
        return status;
    }
  };

  const getFormatText = (format: string) => {
    switch (format) {
      case 'single_elimination':
        return 'Single Elimination';
      case 'round_robin':
        return 'Round Robin';
      case 'double_elimination':
        return 'Double Elimination';
      default:
        return format;
    }
  };

  const renderTournament = ({ item }: { item: Tournament }) => (
    <TouchableOpacity 
      style={styles.tournamentCard}
      onPress={() => handleTournamentPress(item)}
    >
      <View style={styles.tournamentHeader}>
        <View style={styles.tournamentInfo}>
          <Text style={styles.tournamentName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.tournamentDescription}>{item.description}</Text>
          )}
          <View style={styles.tournamentMeta}>
            <Text style={styles.formatText}>{getFormatText(item.format)}</Text>
            <Text style={styles.participantsText}>
              {item.participants.length} players
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.tournamentFooter}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar" size={14} color="#666" />
          <Text style={styles.dateText}>
            Started: {item.startDate.toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.progressInfo}>
          {item.status === 'completed' && item.winnerId && (
            <View style={styles.winnerInfo}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.winnerText}>
                Winner: {item.participants.find(p => p.id === item.winnerId)?.name || 'Unknown'}
              </Text>
            </View>
          )}
          
          {item.status === 'in_progress' && (
            <View style={styles.progressBar}>
              <Text style={styles.progressText}>
                {item.matches.filter(m => m.status === 'completed').length} / {item.matches.length} matches
              </Text>
            </View>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading tournaments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newTournamentButton} onPress={handleNewTournament}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.newTournamentButtonText}>New Tournament</Text>
      </TouchableOpacity>

      {tournaments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No tournaments yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first tournament to get started</Text>
        </View>
      ) : (
        <FlatList
          data={tournaments}
          renderItem={renderTournament}
          keyExtractor={(item) => item.id}
          style={styles.tournamentsList}
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  newTournamentButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  newTournamentButtonText: {
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
  tournamentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tournamentCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tournamentInfo: {
    flex: 1,
    marginRight: 10,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tournamentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tournamentMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  formatText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  participantsText: {
    fontSize: 12,
    color: '#666',
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
  tournamentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  progressInfo: {
    flex: 1,
    alignItems: 'center',
  },
  winnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winnerText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  progressBar: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
  },
});