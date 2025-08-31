import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player } from '../types/models';
import { databaseService } from '../services/database';

interface MatchScoringScreenProps {
  route: {
    params: {
      matchId: string;
      isDoubles?: boolean;
      player1Id: string;
      player2Id: string;
      player3Id?: string;
      player4Id?: string;
      team1Name: string;
      team2Name: string;
      tournamentId?: string;
      tournamentMatchId?: string;
    };
  };
  navigation: any;
}

export default function MatchScoringScreen({ route, navigation }: MatchScoringScreenProps) {
  const { matchId, isDoubles = false, player1Id, player2Id, player3Id, player4Id, team1Name, team2Name, tournamentId, tournamentMatchId } = route.params;
  
  const team1 = { id: player1Id, name: team1Name };
  const team2 = { id: player2Id, name: team2Name };
  
  const [team1Sets, setTeam1Sets] = useState(0);
  const [team2Sets, setTeam2Sets] = useState(0);
  const [team1Points, setTeam1Points] = useState(0);
  const [team2Points, setTeam2Points] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null);
  const [bestOf, setBestOf] = useState(3);

  useEffect(() => {
    navigation.setOptions({
      title: `${team1.name} vs ${team2.name}`,
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} style={{ marginLeft: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
    
    // Load match details to get bestOf value
    loadMatchDetails();
  }, []);

  const loadMatchDetails = async () => {
    try {
      const matches = await databaseService.getMatches();
      const match = matches.find(m => m.id === matchId);
      if (match) {
        setBestOf(match.bestOf);
        setCurrentSet(match.currentSet);
        setTeam1Sets(match.player1Sets);
        setTeam2Sets(match.player2Sets);
      }
    } catch (error) {
      console.error('Failed to load match details:', error);
    }
  };

  const handleBackPress = () => {
    if (team1Points > 0 || team2Points > 0 || team1Sets > 0 || team2Sets > 0) {
      Alert.alert(
        'Exit Match',
        'Are you sure you want to exit? Match progress will be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleScorePoint = async (scoringTeam: 1 | 2) => {
    if (isMatchComplete) return;

    let newTeam1Points = team1Points;
    let newTeam2Points = team2Points;
    let newTeam1Sets = team1Sets;
    let newTeam2Sets = team2Sets;
    let newCurrentSet = currentSet;

    if (scoringTeam === 1) {
      newTeam1Points++;
    } else {
      newTeam2Points++;
    }

    const isSetWon = (newTeam1Points >= 11 || newTeam2Points >= 11) && 
                     Math.abs(newTeam1Points - newTeam2Points) >= 2;

    if (isSetWon) {
      if (newTeam1Points > newTeam2Points) {
        newTeam1Sets++;
      } else {
        newTeam2Sets++;
      }

      newTeam1Points = 0;
      newTeam2Points = 0;
      newCurrentSet++;

      const setsToWin = Math.ceil(bestOf / 2); // 2 for bestOf 3, 3 for bestOf 5, 4 for bestOf 7
      const isMatchWon = newTeam1Sets >= setsToWin || newTeam2Sets >= setsToWin;
      
      if (isMatchWon) {
        const matchWinner = newTeam1Sets > newTeam2Sets ? team1 : team2;
        setWinner(matchWinner);
        setIsMatchComplete(true);
        setShowCompleteModal(true);
        
        try {
          await databaseService.updateMatchScore(matchId, newTeam1Sets, newTeam2Sets, newCurrentSet);
          await databaseService.completeMatch(matchId, matchWinner.id);
          
          // If this is a tournament match, update tournament bracket
          if (tournamentId && tournamentMatchId) {
            await databaseService.updateTournamentMatchStatus(
              tournamentMatchId, 
              'completed', 
              matchWinner.id, 
              matchId, 
              newTeam1Sets, 
              newTeam2Sets
            );
            await databaseService.advanceTournamentWinner(tournamentId, tournamentMatchId, matchWinner.id);
          }
          
        } catch (error) {
          console.error('Failed to complete match:', error);
        }
      } else {
        try {
          await databaseService.updateMatchScore(matchId, newTeam1Sets, newTeam2Sets, newCurrentSet);
        } catch (error) {
          console.error('Failed to update match score:', error);
        }
      }
    }

    setTeam1Points(newTeam1Points);
    setTeam2Points(newTeam2Points);
    setTeam1Sets(newTeam1Sets);
    setTeam2Sets(newTeam2Sets);
    setCurrentSet(newCurrentSet);
  };

  const handleUndoPoint = () => {
    Alert.alert('Undo Point', 'Undo functionality coming soon!');
  };

  const handleCompleteMatch = async () => {
    setShowCompleteModal(false);
    
    // If this is a tournament match, check if tournament is complete
    if (tournamentId) {
      try {
        // Check if tournament is now completed
        const tournaments = await databaseService.getTournaments();
        const tournament = tournaments.find(t => t.id === tournamentId);
        
        if (tournament?.status === 'completed') {
          // Tournament is complete, go to tournament details to show winner
          navigation.navigate('TournamentDetail', { tournamentId });
        } else {
          // Tournament still in progress, go back to bracket
          navigation.navigate('TournamentBracket', { tournamentId });
        }
      } catch (error) {
        console.error('Failed to check tournament status:', error);
        // Fallback to bracket view
        navigation.navigate('TournamentBracket', { tournamentId });
      }
    } else {
      navigation.navigate('Main', { screen: 'Matches' });
    }
  };

  const renderScoreButton = (team: { id: string; name: string }, teamNumber: 1 | 2) => {
    const points = teamNumber === 1 ? team1Points : team2Points;
    const sets = teamNumber === 1 ? team1Sets : team2Sets;
    
    return (
      <View style={styles.playerSection}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{team.name}</Text>
          {isDoubles && <Text style={styles.teamLabel}>Team {teamNumber}</Text>}
        </View>
        
        <View style={styles.scoreDisplay}>
          <View style={styles.setsScore}>
            <Text style={styles.setsLabel}>Sets</Text>
            <Text style={styles.setsValue}>{sets}</Text>
          </View>
          
          <View style={styles.pointsScore}>
            <Text style={styles.pointsLabel}>Points</Text>
            <Text style={styles.pointsValue}>{points}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.scoreButton,
            { backgroundColor: teamNumber === 1 ? '#2196F3' : '#4CAF50' },
            isMatchComplete && styles.scoreButtonDisabled
          ]}
          onPress={() => handleScorePoint(teamNumber)}
          disabled={isMatchComplete}
        >
          <Text style={styles.scoreButtonText}>+1 Point</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.matchInfo}>
        <Text style={styles.currentSetText}>Set {currentSet}</Text>
        <Text style={styles.bestOfText}>Best of {bestOf} Sets</Text>
      </View>

      <View style={styles.playersContainer}>
        {renderScoreButton(team1, 1)}
        
        <View style={styles.vsSection}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.scoreVs}>
            {team1Sets} - {team2Sets}
          </Text>
        </View>
        
        {renderScoreButton(team2, 2)}
      </View>

      <View style={styles.setScore}>
        <Text style={styles.setScoreLabel}>Current Set</Text>
        <Text style={styles.setScoreValue}>
          {team1Points} - {team2Points}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleUndoPoint}>
          <Ionicons name="arrow-undo" size={24} color="#FF9800" />
          <Text style={styles.controlButtonText}>Undo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleBackPress}>
          <Ionicons name="pause" size={24} color="#666" />
          <Text style={styles.controlButtonText}>Pause</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showCompleteModal}
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trophy" size={64} color="#FFD700" />
            <Text style={styles.modalTitle}>Match Complete!</Text>
            <Text style={styles.modalWinner}>
              {winner?.name} Wins!
            </Text>
            <Text style={styles.modalScore}>
              Final Score: {team1Sets} - {team2Sets}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCompleteMatch}
            >
              <Text style={styles.modalButtonText}>
                {tournamentId ? 'Continue' : 'View Matches'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  matchInfo: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  currentSetText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  bestOfText: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 4,
  },
  playersContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
  },
  playerHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  playerRating: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  teamLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  setsScore: {
    alignItems: 'center',
    marginBottom: 10,
  },
  setsLabel: {
    fontSize: 14,
    color: '#666',
  },
  setsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsScore: {
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  scoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 100,
  },
  scoreButtonDisabled: {
    backgroundColor: '#ccc',
  },
  scoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vsSection: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  scoreVs: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  setScore: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  setScoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  setScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  controlButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  modalWinner: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  modalScore: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});