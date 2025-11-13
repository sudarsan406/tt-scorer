import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player } from '../types/models';
import { EloRatingService } from '../services/eloRating';

interface QuickMatchScreenProps {
  navigation: any;
}

export default function QuickMatchScreen({ navigation }: QuickMatchScreenProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);
  const [selectedPlayer3, setSelectedPlayer3] = useState<Player | null>(null);
  const [selectedPlayer4, setSelectedPlayer4] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDoubles, setIsDoubles] = useState(false);
  const [bestOf, setBestOf] = useState(3);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const { databaseService } = await import('../services/database');
      const playersData = await databaseService.getPlayers();
      setPlayers(playersData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = (player: Player, position: 1 | 2 | 3 | 4) => {
    const selectedPlayers = [selectedPlayer1, selectedPlayer2, selectedPlayer3, selectedPlayer4];
    
    if (position === 1) {
      setSelectedPlayer1(player);
    } else if (position === 2) {
      setSelectedPlayer2(player);
    } else if (position === 3) {
      setSelectedPlayer3(player);
    } else {
      setSelectedPlayer4(player);
    }
    
    // Clear other positions if same player is selected
    selectedPlayers.forEach((selectedPlayer, index) => {
      if (selectedPlayer?.id === player.id && index + 1 !== position) {
        if (index === 0) setSelectedPlayer1(null);
        else if (index === 1) setSelectedPlayer2(null);
        else if (index === 2) setSelectedPlayer3(null);
        else setSelectedPlayer4(null);
      }
    });
  };

  const handleStartMatch = async () => {
    if (isDoubles) {
      if (!selectedPlayer1 || !selectedPlayer2 || !selectedPlayer3 || !selectedPlayer4) {
        Alert.alert('Error', 'Please select all 4 players for doubles');
        return;
      }
    } else {
      if (!selectedPlayer1 || !selectedPlayer2) {
        Alert.alert('Error', 'Please select both players');
        return;
      }
    }

    setCreating(true);
    try {
      const team1Name = isDoubles ? `${selectedPlayer1!.name}/${selectedPlayer2!.name}` : selectedPlayer1!.name;
      const team2Name = isDoubles ? `${selectedPlayer3!.name}/${selectedPlayer4!.name}` : selectedPlayer2!.name;
      
      const { databaseService } = await import('../services/database');
      const matchId = await databaseService.createMatch({
        player1Id: selectedPlayer1!.id,
        player2Id: selectedPlayer2!.id,
        status: 'in_progress',
        bestOf,
        currentSet: 1,
        player1Sets: 0,
        player2Sets: 0,
        startedAt: new Date(),
        isDoubles,
        team1Name,
        team2Name,
      });

      navigation.navigate('MatchScoring', { 
        matchId,
        isDoubles,
        player1Id: selectedPlayer1!.id,
        player2Id: selectedPlayer2!.id,
        player3Id: isDoubles ? selectedPlayer3!.id : undefined,
        player4Id: isDoubles ? selectedPlayer4!.id : undefined,
        team1Name: isDoubles ? `${selectedPlayer1!.name}/${selectedPlayer2!.name}` : selectedPlayer1!.name,
        team2Name: isDoubles ? `${selectedPlayer3!.name}/${selectedPlayer4!.name}` : selectedPlayer2!.name
      });
    } catch (error) {
      console.error('Failed to create match:', error);
      Alert.alert('Error', 'Failed to create match');
    } finally {
      setCreating(false);
    }
  };

  const renderPlayer = (player: Player, isSelected: boolean, position: 1 | 2 | 3 | 4) => (
    <TouchableOpacity
      key={player.id}
      style={[
        styles.playerCard,
        isSelected && styles.selectedPlayerCard
      ]}
      onPress={() => handlePlayerSelect(player, position)}
    >
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, isSelected && styles.selectedPlayerName]}>
          {player.name}
        </Text>
        <Text style={[styles.playerRating, isSelected && styles.selectedPlayerRating]}>
          Rating: {player.rating}
        </Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading players...</Text>
      </View>
    );
  }

  const minPlayersNeeded = isDoubles ? 4 : 2;

  if (players.length < minPlayersNeeded) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={64} color="#ccc" />
        <Text style={styles.emptyStateText}>Need at least {minPlayersNeeded} players</Text>
        <Text style={styles.emptyStateSubtext}>Add more players to start a {isDoubles ? 'doubles' : 'singles'} match</Text>
        <TouchableOpacity
          style={styles.addPlayersButton}
          onPress={() => navigation.navigate('Main', { screen: 'Players' })}
        >
          <Text style={styles.addPlayersButtonText}>Add Players</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate match prediction for singles
  let winProbability = null;
  let player1WinProb = 0;
  let player2WinProb = 0;
  let ratingDifference = 0;
  let confidenceLevel = '';

  if (!isDoubles && selectedPlayer1 && selectedPlayer2) {
    const p1Rating = selectedPlayer1.rating || 1200;
    const p2Rating = selectedPlayer2.rating || 1200;
    ratingDifference = Math.abs(p1Rating - p2Rating);

    player1WinProb = EloRatingService.calculateWinProbability(p1Rating, p2Rating) * 100;
    player2WinProb = 100 - player1WinProb;

    // Determine confidence level
    if (ratingDifference < 50) {
      confidenceLevel = 'Evenly Matched';
    } else if (ratingDifference < 100) {
      confidenceLevel = 'Slight Advantage';
    } else if (ratingDifference < 200) {
      confidenceLevel = 'Clear Favorite';
    } else {
      confidenceLevel = 'Strong Favorite';
    }

    winProbability = {
      player1: player1WinProb,
      player2: player2WinProb,
      favorite: player1WinProb > 50 ? selectedPlayer1.name : selectedPlayer2.name,
      confidence: confidenceLevel
    };
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Match</Text>
        <Text style={styles.subtitle}>Select {isDoubles ? 'four' : 'two'} players to start a {isDoubles ? 'doubles' : 'singles'} match</Text>
      </View>

      <View style={styles.matchTypeSection}>
        <Text style={styles.sectionTitle}>Match Type</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !isDoubles && styles.toggleButtonActive]}
            onPress={() => setIsDoubles(false)}
          >
            <Text style={[styles.toggleButtonText, !isDoubles && styles.toggleButtonTextActive]}>Singles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, isDoubles && styles.toggleButtonActive]}
            onPress={() => setIsDoubles(true)}
          >
            <Text style={[styles.toggleButtonText, isDoubles && styles.toggleButtonTextActive]}>Doubles</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isDoubles ? 'Team 1 (Select 2 players)' : 'Player 1'}
        </Text>
        <View style={styles.teamSection}>
          {players.map(player => {
            const isSelected = selectedPlayer1?.id === player.id || 
                             (isDoubles && selectedPlayer2?.id === player.id);
            const position = selectedPlayer1?.id === player.id ? 1 : 
                           (isDoubles && selectedPlayer2?.id === player.id) ? 2 : 
                           (selectedPlayer1 ? (isDoubles ? 2 : null) : 1);
            
            return renderPlayer(player, isSelected, position || 1);
          })}
        </View>
        {isDoubles && (
          <View style={styles.selectedTeam}>
            <Text style={styles.selectedTeamLabel}>Team 1:</Text>
            <Text style={styles.selectedTeamPlayers}>
              {selectedPlayer1?.name || '?'} / {selectedPlayer2?.name || '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.vsSection}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isDoubles ? 'Team 2 (Select 2 players)' : 'Player 2'}
        </Text>
        <View style={styles.teamSection}>
          {players.map(player => {
            const isSelected = (!isDoubles && selectedPlayer2?.id === player.id) ||
                             (isDoubles && (selectedPlayer3?.id === player.id || selectedPlayer4?.id === player.id));
            const position = (!isDoubles && selectedPlayer2?.id === player.id) ? 2 :
                           (isDoubles && selectedPlayer3?.id === player.id) ? 3 :
                           (isDoubles && selectedPlayer4?.id === player.id) ? 4 :
                           (!isDoubles ? 2 : (selectedPlayer3 ? 4 : 3));
            
            return renderPlayer(player, isSelected, position);
          })}
        </View>
        {isDoubles && (
          <View style={styles.selectedTeam}>
            <Text style={styles.selectedTeamLabel}>Team 2:</Text>
            <Text style={styles.selectedTeamPlayers}>
              {selectedPlayer3?.name || '?'} / {selectedPlayer4?.name || '?'}
            </Text>
          </View>
        )}
      </View>

      {winProbability && !isDoubles && (
        <View style={styles.predictionSection}>
          <View style={styles.predictionHeader}>
            <Ionicons name="analytics" size={24} color="#FF9800" />
            <Text style={styles.predictionTitle}>Match Prediction</Text>
          </View>

          <View style={styles.predictionContent}>
            <View style={styles.probabilityBars}>
              <View style={styles.playerProbability}>
                <Text style={styles.playerProbabilityName}>{selectedPlayer1!.name}</Text>
                <View style={styles.probabilityBarContainer}>
                  <View style={[styles.probabilityBar, { width: `${winProbability.player1}%`, backgroundColor: '#4CAF50' }]} />
                </View>
                <Text style={styles.probabilityText}>{winProbability.player1.toFixed(1)}%</Text>
              </View>

              <View style={styles.playerProbability}>
                <Text style={styles.playerProbabilityName}>{selectedPlayer2!.name}</Text>
                <View style={styles.probabilityBarContainer}>
                  <View style={[styles.probabilityBar, { width: `${winProbability.player2}%`, backgroundColor: '#2196F3' }]} />
                </View>
                <Text style={styles.probabilityText}>{winProbability.player2.toFixed(1)}%</Text>
              </View>
            </View>

            <View style={styles.predictionDetails}>
              <View style={styles.predictionDetailRow}>
                <Ionicons name="trophy-outline" size={20} color="#FF9800" />
                <Text style={styles.predictionDetailLabel}>Predicted Winner:</Text>
                <Text style={styles.predictionDetailValue}>{winProbability.favorite}</Text>
              </View>
              <View style={styles.predictionDetailRow}>
                <Ionicons name="speedometer-outline" size={20} color="#FF9800" />
                <Text style={styles.predictionDetailLabel}>Confidence:</Text>
                <Text style={styles.predictionDetailValue}>{winProbability.confidence}</Text>
              </View>
              <View style={styles.predictionDetailRow}>
                <Ionicons name="stats-chart-outline" size={20} color="#FF9800" />
                <Text style={styles.predictionDetailLabel}>Rating Difference:</Text>
                <Text style={styles.predictionDetailValue}>{ratingDifference} pts</Text>
              </View>
            </View>

            <View style={styles.predictionNote}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.predictionNoteText}>
                Prediction based on Elo rating difference. Actual results may vary.
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.matchSettings}>
        <Text style={styles.settingsTitle}>Match Settings</Text>
        <View style={styles.settingSection}>
          <Text style={styles.settingLabel}>Best of</Text>
          <View style={styles.bestOfContainer}>
            {[3, 5, 7].map((sets) => (
              <TouchableOpacity
                key={sets}
                style={[styles.bestOfButton, bestOf === sets && styles.bestOfButtonActive]}
                onPress={() => setBestOf(sets)}
              >
                <Text style={[styles.bestOfButtonText, bestOf === sets && styles.bestOfButtonTextActive]}>
                  {sets}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          ((!isDoubles && (!selectedPlayer1 || !selectedPlayer2)) || 
           (isDoubles && (!selectedPlayer1 || !selectedPlayer2 || !selectedPlayer3 || !selectedPlayer4)) || 
           creating) && styles.startButtonDisabled
        ]}
        onPress={handleStartMatch}
        disabled={(!isDoubles && (!selectedPlayer1 || !selectedPlayer2)) || 
                 (isDoubles && (!selectedPlayer1 || !selectedPlayer2 || !selectedPlayer3 || !selectedPlayer4)) || 
                 creating}
      >
        {creating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Match</Text>
          </>
        )}
      </TouchableOpacity>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f5f5f5',
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
  addPlayersButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  addPlayersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  matchTypeSection: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  teamSection: {
    marginBottom: 10,
  },
  selectedTeam: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  selectedTeamLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  selectedTeamPlayers: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  playerCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedPlayerCard: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedPlayerName: {
    color: '#2196F3',
  },
  playerRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedPlayerRating: {
    color: '#1976D2',
  },
  vsSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchSettings: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  settingSection: {
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bestOfContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  bestOfButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  bestOfButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  bestOfButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  bestOfButtonTextActive: {
    color: '#fff',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  predictionSection: {
    backgroundColor: '#FFF8E1',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFB300',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  predictionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 10,
  },
  predictionContent: {
    gap: 15,
  },
  probabilityBars: {
    gap: 12,
  },
  playerProbability: {
    gap: 6,
  },
  playerProbabilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  probabilityBarContainer: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  probabilityBar: {
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  probabilityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  predictionDetails: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    gap: 10,
    marginTop: 5,
  },
  predictionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionDetailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  predictionDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  predictionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 5,
  },
  predictionNoteText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
});