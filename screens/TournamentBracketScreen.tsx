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
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [matchDetails, setMatchDetails] = useState<Record<string, GameSet[]>>({});

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

  const toggleMatchExpansion = async (matchId: string, linkedMatchId?: string) => {
    const newExpandedMatches = new Set(expandedMatches);
    
    if (expandedMatches.has(matchId)) {
      newExpandedMatches.delete(matchId);
    } else {
      newExpandedMatches.add(matchId);
      
      // Load detailed scores if not already loaded and we have a linked match
      if (!matchDetails[matchId] && linkedMatchId) {
        try {
          const sets = await databaseService.getMatchSets(linkedMatchId);
          setMatchDetails(prev => ({ ...prev, [matchId]: sets }));
        } catch (error) {
          console.error('Failed to load match details:', error);
        }
      }
    }
    
    setExpandedMatches(newExpandedMatches);
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
      // If completed, expand to show detailed scores instead of alert
      toggleMatchExpansion(match.id, match.linkedMatchId);
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

  const getMatchStatusColor = (match: BracketMatch) => {
    if (match.status === 'completed') return '#4CAF50';
    if (match.status === 'scheduled' && match.player1Id && match.player2Id) return '#2196F3';
    return '#ccc';
  };

  const getMatchStatusIcon = (match: BracketMatch) => {
    if (match.status === 'completed') return 'checkmark-circle';
    if (match.status === 'scheduled' && match.player1Id && match.player2Id) return 'play-circle';
    return 'time';
  };

  const renderMatch = (match: BracketMatch) => {
    const isExpanded = expandedMatches.has(match.id);
    const sets = matchDetails[match.id] || [];
    
    return (
      <View key={match.id} style={[styles.matchCard, { borderLeftColor: getMatchStatusColor(match) }]}>
        <TouchableOpacity onPress={() => handleMatchPress(match)}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>Match {match.matchNumber}</Text>
            <View style={styles.matchHeaderRight}>
              <Ionicons 
                name={getMatchStatusIcon(match)} 
                size={20} 
                color={getMatchStatusColor(match)} 
              />
              {match.status === 'completed' && (
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#2196F3" 
                />
              )}
            </View>
          </View>
          
          <View style={styles.playersSection}>
            <View style={[
              styles.playerRow,
              match.winnerId === match.player1Id && styles.winnerRow
            ]}>
              <Text style={[
                styles.playerName,
                match.winnerId === match.player1Id && styles.winnerName
              ]}>
                {match.player1Name || 'TBD'}
              </Text>
              <View style={styles.playerScore}>
                {match.status === 'completed' && match.player1Sets !== undefined && (
                  <Text style={[
                    styles.scoreText,
                    match.winnerId === match.player1Id && styles.winnerScore
                  ]}>
                    {match.player1Sets}
                  </Text>
                )}
                {match.winnerId === match.player1Id && (
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                )}
              </View>
            </View>
            
            <Text style={styles.vsText}>vs</Text>
            
            <View style={[
              styles.playerRow,
              match.winnerId === match.player2Id && styles.winnerRow
            ]}>
              <Text style={[
                styles.playerName,
                match.winnerId === match.player2Id && styles.winnerName
              ]}>
                {match.player2Name || 'TBD'}
              </Text>
              <View style={styles.playerScore}>
                {match.status === 'completed' && match.player2Sets !== undefined && (
                  <Text style={[
                    styles.scoreText,
                    match.winnerId === match.player2Id && styles.winnerScore
                  ]}>
                    {match.player2Sets}
                  </Text>
                )}
                {match.winnerId === match.player2Id && (
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                )}
              </View>
            </View>
          </View>

          {match.status === 'completed' && (
            <View style={styles.resultsSummary}>
              <Text style={styles.winnerText}>
                Winner: {match.winnerId === match.player1Id ? match.player1Name : match.player2Name}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {match.status === 'completed' && isExpanded && sets.length > 0 && (
          <View style={styles.detailedScores}>
            <Text style={styles.detailedScoresTitle}>Set Scores:</Text>
            {sets.map((set, index) => (
              <View key={set.id} style={styles.setScore}>
                <Text style={styles.setNumber}>Set {set.setNumber}:</Text>
                <Text style={[
                  styles.setScoreText,
                  set.winnerId === match.player1Id ? styles.player1Winner : styles.player2Winner
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
      </View>
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
                {tournament?.format === 'round_robin' ? (
                  roundNumber === 1 ? 'Group Stage' :
                  roundNumber === 2 ? 'Semifinals' :
                  roundNumber === 3 ? 'Final' :
                  `Round ${roundNumber}`
                ) : (
                  roundNumber === rounds.length ? 'Final' :
                  roundNumber === rounds.length - 1 ? 'Semifinal' :
                  `Round ${roundNumber}`
                )}
              </Text>
              <View style={styles.roundMatches}>
                {roundMatches.map((match, index) => (
                  <View key={match.id} style={index > 0 ? styles.matchSpacing : undefined}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tournamentTitle}>{tournament.name}</Text>
        <Text style={styles.formatText}>
          {tournament.format === 'single_elimination' ? 'Single Elimination' : 'Round Robin'}
        </Text>
        {tournament.status === 'completed' && (
          <TouchableOpacity 
            style={styles.tournamentDetailsButton}
            onPress={() => navigation.navigate('TournamentDetail', { tournamentId: tournament.id })}
          >
            <Ionicons name="trophy" size={16} color="#fff" />
            <Text style={styles.tournamentDetailsButtonText}>View Winner</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.mainScrollContainer} showsVerticalScrollIndicator={true}>
        {tournament.format === 'round_robin' ? 
          renderRoundRobinBracket() : 
          renderSingleEliminationBracket()
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    alignItems: 'center',
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
  tournamentDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
    gap: 4,
  },
  tournamentDetailsButtonText: {
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
  },
  roundRobinContainer: {
    flex: 1,
    padding: 20,
  },
  matchesGrid: {
    gap: 15,
  },
  matchSpacing: {
    marginTop: 15,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  playersSection: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  playerScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    minWidth: 20,
    textAlign: 'center',
  },
  winnerScore: {
    color: '#2196F3',
  },
  winnerRow: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  playerName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  winnerName: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  vsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultsSummary: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  winnerText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
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