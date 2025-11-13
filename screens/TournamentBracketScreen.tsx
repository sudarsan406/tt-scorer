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
import { Tournament, GameSet } from '../types/models';
import { BracketMatch } from '../services/bracketGenerator';
import { databaseService } from '../services/database';
import MatchCard from '../components/MatchCard';
import FooterNavigation from '../components/FooterNavigation';
import { ExportService } from '../services/exportService';

interface TournamentBracketScreenProps {
  route: {
    params: {
      tournamentId: string;
    };
  };
  navigation: any;
}

export default function TournamentBracketScreen({ route, navigation }: TournamentBracketScreenProps) {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadTournamentData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTournamentData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTournamentData = async () => {
    try {
      const tournaments = await databaseService.getTournaments();
      const tournamentData = tournaments.find(t => t.id === tournamentId);
      
      if (tournamentData) {
        setTournament(tournamentData);
        navigation.setOptions({
          title: `${tournamentData.name} - Bracket`,
        });
        
        const bracket = await databaseService.getTournamentBracket(tournamentId);
        setBracketMatches(bracket);
      } else {
        Alert.alert('Error', 'Tournament not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load tournament data:', error);
      Alert.alert('Error', 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };


  const handleExport = async () => {
    if (bracketMatches.length === 0) {
      Alert.alert('No Data', 'No bracket data to export');
      return;
    }

    setExporting(true);
    try {
      await ExportService.exportTournamentToCSV(tournamentId);
      Alert.alert(
        'Success',
        'Tournament bracket exported successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export tournament bracket',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const handleMatchPress = (match: BracketMatch) => {
    if (match.status === 'scheduled' && match.player1Id && match.player2Id) {
      Alert.alert(
        'Start Match',
        `Start match between ${match.player1Name} and ${match.player2Name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: () => startMatch(match) }
        ]
      );
    } else if (match.status === 'completed') {
      // For completed matches, only handle expansion via score section
      return;
    } else {
      Alert.alert('Match Info', 'This match is not ready to be played yet.');
    }
  };

  const startMatch = async (match: BracketMatch) => {
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
        tournamentId,
        tournamentMatchId: match.id,
      });
    } catch (error) {
      console.error('Failed to start match:', error);
      Alert.alert('Error', 'Failed to start match');
    }
  };


  const renderMatch = (match: BracketMatch) => {
    return (
      <MatchCard
        key={match.id}
        matchId={match.linkedMatchId || ''}
        status={match.status}
        player1Id={match.player1Id || ''}
        player2Id={match.player2Id || ''}
        player1Name={match.player1Name || 'TBD'}
        player2Name={match.player2Name || 'TBD'}
        player1Sets={match.player1Sets}
        player2Sets={match.player2Sets}
        winnerId={match.winnerId}
        showMatchNumber={true}
        matchNumber={match.matchNumber}
        showDate={false}
        onPress={() => handleMatchPress(match)}
        loadMatchDetails={async (matchId: string) => {
          try {
            const sets = await databaseService.getMatchSets(matchId);
            return sets;
          } catch (error) {
            console.error('Failed to load match details:', error);
            return [];
          }
        }}
      />
    );
  };

  const renderRoundRobinBracket = () => {
    return (
      <View style={styles.roundRobinContainer}>
        <Text style={styles.roundTitle}>All Matches</Text>
        <View style={styles.matchesGrid}>
          {bracketMatches.map(renderMatch)}
        </View>
      </View>
    );
  };

  const renderSingleEliminationBracket = () => {
    const rounds = Array.from(new Set(bracketMatches.map(m => m.round))).sort();
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        style={styles.bracketContainer}
        contentContainerStyle={styles.bracketContent}
      >
        {rounds.map(roundNumber => {
          const roundMatches = bracketMatches.filter(m => m.round === roundNumber);
          
          return (
            <View key={roundNumber} style={styles.roundColumn}>
              <Text style={styles.roundTitle}>
                {roundNumber === rounds.length ? 'Final' :
                 roundNumber === rounds.length - 1 ? 'Semifinal' :
                 `Round ${roundNumber}`}
              </Text>
              <View style={styles.roundMatches}>
                {roundMatches.map((match) => (
                  <View key={match.id}>
                    {renderMatch(match)}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading bracket...</Text>
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
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.tournamentTitle}>{tournament.name}</Text>
          <Text style={styles.formatText}>
            {tournament.format === 'single_elimination' ? 'Single Elimination' : 'Round Robin'}
          </Text>
          <View style={styles.headerButtons}>
            {tournament.status === 'completed' && (
              <TouchableOpacity
                style={styles.tournamentDetailsButton}
                onPress={() => navigation.navigate('TournamentDetail', { tournamentId: tournament.id })}
              >
                <Ionicons name="trophy" size={16} color="#fff" />
                <Text style={styles.tournamentDetailsButtonText}>View Winner</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
              onPress={handleExport}
              disabled={exporting || bracketMatches.length === 0}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={16} color="#fff" />
              )}
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      <ScrollView style={styles.mainScrollContainer} showsVerticalScrollIndicator={true}>
        {tournament.format === 'round_robin' ? 
          renderRoundRobinBracket() : 
          renderSingleEliminationBracket()
        }
      </ScrollView>
      <FooterNavigation navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  mainScrollContainer: {
    flex: 1,
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
  },
  headerMain: {
    alignItems: 'center',
    marginBottom: 15,
  },
  tournamentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  formatText: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tournamentDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  tournamentDetailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bracketContainer: {
    flex: 1,
  },
  bracketContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  roundColumn: {
    marginRight: 20,
    minWidth: 200,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  roundMatches: {
    flex: 1,
    paddingVertical: 10,
    gap: 15,
  },
  roundRobinContainer: {
    flex: 1,
    padding: 20,
  },
  matchesGrid: {
    gap: 15,
  },
});