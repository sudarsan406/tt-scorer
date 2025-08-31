import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tournament } from '../types/models';
import { databaseService } from '../services/database';

interface TournamentDetailScreenProps {
  route: {
    params: {
      tournamentId: string;
    };
  };
  navigation: any;
}

export default function TournamentDetailScreen({ route, navigation }: TournamentDetailScreenProps) {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournament();
  }, []);

  const loadTournament = async () => {
    try {
      const tournaments = await databaseService.getTournaments();
      const tournamentData = tournaments.find(t => t.id === tournamentId);
      
      if (tournamentData) {
        setTournament(tournamentData);
        navigation.setOptions({
          title: tournamentData.name,
        });
      } else {
        Alert.alert('Error', 'Tournament not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load tournament:', error);
      Alert.alert('Error', 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
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

  const handleStartTournament = async () => {
    if (!tournament) return;
    
    Alert.alert(
      'Start Tournament',
      `Are you sure you want to start "${tournament.name}"? This will make it available for matches.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: confirmStartTournament }
      ]
    );
  };

  const confirmStartTournament = async () => {
    if (!tournament) return;
    
    try {
      await databaseService.startTournament(tournament.id);
      
      // Update local state
      setTournament({
        ...tournament,
        status: 'in_progress'
      });
      
      Alert.alert(
        'Tournament Started!',
        'The tournament is now in progress. Players can start playing matches.',
        [{ text: 'View Bracket', onPress: handleViewBracket }]
      );
    } catch (error) {
      console.error('Failed to start tournament:', error);
      Alert.alert('Error', 'Failed to start tournament');
    }
  };

  const handleViewBracket = () => {
    if (!tournament) return;
    navigation.navigate('TournamentBracket', { tournamentId: tournament.id });
  };

  const handleContinueTournament = async () => {
    if (!tournament) return;
    
    try {
      // For single elimination, try to fix advancement first
      if (tournament.format === 'single_elimination') {
        await databaseService.fixSingleEliminationAdvancement(tournament.id);
      }
      
      // Get bracket matches to find next available match
      const bracketMatches = await databaseService.getTournamentBracket(tournament.id);
      const nextMatch = bracketMatches.find(match => 
        match.status === 'scheduled' && match.player1Id && match.player2Id
      );

      if (nextMatch) {
        // Ask user if they want to start the next match immediately
        Alert.alert(
          'Continue Tournament',
          `Next match: ${nextMatch.player1Name} vs ${nextMatch.player2Name}\n\nWould you like to start this match now?`,
          [
            { text: 'View Bracket', onPress: handleViewBracket },
            { text: 'Start Match', onPress: () => startMatch(nextMatch) }
          ]
        );
      } else {
        // No ready matches, check if advancement needs fixing
        const completedMatches = bracketMatches.filter(m => m.status === 'completed');
        const tbdMatches = bracketMatches.filter(m => 
          m.status === 'scheduled' && (!m.player1Id || !m.player2Id)
        );
        
        if (completedMatches.length > 0 && tbdMatches.length > 0) {
          Alert.alert(
            'Fix Tournament',
            'Some matches are completed but winners haven\'t advanced. Would you like to fix this?',
            [
              { text: 'View Bracket', onPress: handleViewBracket },
              { text: 'Fix & Continue', onPress: handleFixAndContinue }
            ]
          );
        } else {
          Alert.alert(
            'No Ready Matches',
            'No matches are currently ready to play. Complete more matches to unlock the next round.',
            [{ text: 'View Bracket', onPress: handleViewBracket }]
          );
        }
      }
    } catch (error) {
      console.error('Failed to check tournament status:', error);
      handleViewBracket(); // Fallback to bracket view
    }
  };

  const handleFixAndContinue = async () => {
    if (!tournament) return;
    
    try {
      if (tournament.format === 'single_elimination') {
        await databaseService.fixSingleEliminationAdvancement(tournament.id);
      }
      Alert.alert('Fixed!', 'Tournament bracket has been updated.', [
        { text: 'View Bracket', onPress: handleViewBracket }
      ]);
    } catch (error) {
      console.error('Failed to fix tournament:', error);
      Alert.alert('Error', 'Failed to fix tournament advancement');
    }
  };

  const startMatch = async (match: any) => {
    if (!match.player1Id || !match.player2Id) {
      Alert.alert('Error', 'Both players must be assigned to start the match');
      return;
    }

    try {
      // Create a regular match for scoring
      const matchId = await databaseService.createMatch({
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        status: 'in_progress',
        bestOf: tournament?.bestOf || 3,
        currentSet: 1,
        player1Sets: 0,
        player2Sets: 0,
        startedAt: new Date(),
        isDoubles: false,
        team1Name: match.player1Name || 'Player 1',
        team2Name: match.player2Name || 'Player 2',
      });

      // Update tournament match status
      await databaseService.updateTournamentMatchStatus(match.id, 'in_progress', undefined, matchId);

      navigation.navigate('MatchScoring', { 
        matchId,
        isDoubles: false,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        team1Name: match.player1Name || 'Player 1',
        team2Name: match.player2Name || 'Player 2',
        tournamentId: tournament.id,
        tournamentMatchId: match.id,
      });
    } catch (error) {
      console.error('Failed to start match:', error);
      Alert.alert('Error', 'Failed to start match');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>Tournament not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.tournamentName}>{tournament.name}</Text>
          {tournament.description && (
            <Text style={styles.description}>{tournament.description}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
          <Text style={styles.statusText}>{getStatusText(tournament.status)}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Tournament Info</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="trophy" size={20} color="#666" />
            <Text style={styles.infoLabel}>Format:</Text>
            <Text style={styles.infoValue}>{getFormatText(tournament.format)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.infoLabel}>Players:</Text>
            <Text style={styles.infoValue}>{tournament.participants.length}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoLabel}>Started:</Text>
            <Text style={styles.infoValue}>{tournament.startDate.toLocaleDateString()}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="fitness" size={20} color="#666" />
            <Text style={styles.infoLabel}>Match Format:</Text>
            <Text style={styles.infoValue}>Best of {tournament.bestOf || 3}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="tennisball" size={20} color="#666" />
            <Text style={styles.infoLabel}>Matches:</Text>
            <Text style={styles.infoValue}>
              {tournament.matchStats ? 
                `${tournament.matchStats.completed} / ${tournament.matchStats.total}` : 
                `${tournament.matches.filter(m => m.status === 'completed').length} / ${tournament.matches.length}`
              }
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.participantsSection}>
        <Text style={styles.sectionTitle}>Participants</Text>
        <View style={styles.participantsList}>
          {tournament.participants.map((player, index) => (
            <View key={player.id} style={styles.participantCard}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{player.name}</Text>
                <Text style={styles.participantRating}>Rating: {player.rating}</Text>
              </View>
              <Text style={styles.seedNumber}>#{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      {tournament.status === 'completed' && tournament.winnerId && (
        <View style={styles.winnerSection}>
          <View style={styles.winnerCard}>
            <Ionicons name="trophy" size={48} color="#FFD700" />
            <Text style={styles.winnerTitle}>Tournament Winner</Text>
            <Text style={styles.winnerName}>
              {tournament.participants.find(p => p.id === tournament.winnerId)?.name || 'Unknown'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.secondaryActionButton} onPress={handleViewBracket}>
          <Ionicons name="git-network" size={24} color="#2196F3" />
          <Text style={styles.secondaryActionButtonText}>View Bracket</Text>
        </TouchableOpacity>
        
        {tournament.status === 'upcoming' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleStartTournament}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Start Tournament</Text>
          </TouchableOpacity>
        )}
        
        {tournament.status === 'in_progress' && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF9800' }]} onPress={handleContinueTournament}>
            <Ionicons name="tennisball" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Continue Tournament</Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#e74c3c',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: 15,
  },
  tournamentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#e3f2fd',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  participantsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  participantsList: {
    gap: 10,
  },
  participantCard: {
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
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  participantRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  seedNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  winnerSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  winnerCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  winnerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  actionsSection: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryActionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  secondaryActionButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});