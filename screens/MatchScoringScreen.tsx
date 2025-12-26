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
import { Player, GameSet } from '../types/models';
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

interface ScoreSnapshot {
  team1Sets: number;
  team2Sets: number;
  team1Points: number;
  team2Points: number;
  currentSet: number;
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
  const [scoreHistory, setScoreHistory] = useState<ScoreSnapshot[]>([]);
  const [completedSets, setCompletedSets] = useState<GameSet[]>([]);

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

        // Load all sets for this match
        const sets = await databaseService.getMatchSets(matchId);

        // Filter completed sets and sort by set number
        const completed = sets
          .filter(s => s.completedAt)
          .sort((a, b) => a.setNumber - b.setNumber);
        setCompletedSets(completed);

        // Find current set in progress
        const currentSetData = sets.find(s => s.setNumber === match.currentSet);

        if (currentSetData && !currentSetData.completedAt) {
          // Set is in progress, restore the score
          setTeam1Points(currentSetData.player1Score);
          setTeam2Points(currentSetData.player2Score);
        } else {
          // No in-progress set, start fresh
          setTeam1Points(0);
          setTeam2Points(0);
        }
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

    // Save current state to history before making changes
    setScoreHistory([...scoreHistory, {
      team1Sets,
      team2Sets,
      team1Points,
      team2Points,
      currentSet,
    }]);

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

    // Save or update the current set's in-progress score to the database
    try {
      const sets = await databaseService.getMatchSets(matchId);
      const currentSetData = sets.find(s => s.setNumber === currentSet);

      if (currentSetData && !currentSetData.completedAt) {
        // Update existing in-progress set
        await databaseService.updateGameSetScore(currentSetData.id, newTeam1Points, newTeam2Points);
      } else if (!currentSetData) {
        // Create new in-progress set
        await databaseService.createInProgressGameSet(matchId, currentSet, newTeam1Points, newTeam2Points);
      }
    } catch (error) {
      console.error('Failed to save in-progress set score:', error);
    }

    const isSetWon = (newTeam1Points >= 11 || newTeam2Points >= 11) &&
                     Math.abs(newTeam1Points - newTeam2Points) >= 2;

    if (isSetWon) {
      const setWinnerId = newTeam1Points > newTeam2Points ? team1.id : team2.id;

      // Complete the set in database
      try {
        const sets = await databaseService.getMatchSets(matchId);
        const currentSetData = sets.find(s => s.setNumber === currentSet);

        if (currentSetData && !currentSetData.completedAt) {
          // Update existing in-progress set to completed
          await databaseService.completeGameSet(currentSetData.id, setWinnerId);
        } else {
          // Create new completed set
          await databaseService.createGameSet(
            matchId,
            currentSet,
            newTeam1Points,
            newTeam2Points,
            setWinnerId
          );
        }

        // Add the completed set to our state
        const completedSet: GameSet = {
          id: currentSetData?.id || Date.now().toString(),
          matchId: matchId,
          setNumber: currentSet,
          player1Score: newTeam1Points,
          player2Score: newTeam2Points,
          winnerId: setWinnerId,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCompletedSets([...completedSets, completedSet]);
      } catch (error) {
        console.error('Failed to save set score:', error);
      }

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

  const handleUndoPoint = async () => {
    if (isMatchComplete) {
      Alert.alert('Cannot Undo', 'Match is already completed.');
      return;
    }

    if (scoreHistory.length === 0) {
      Alert.alert('Cannot Undo', 'No points to undo.');
      return;
    }

    Alert.alert(
      'Undo Last Point',
      'Are you sure you want to undo the last point?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          onPress: async () => {
            try {
              // Get the last snapshot from history
              const lastSnapshot = scoreHistory[scoreHistory.length - 1];

              // Restore the previous state
              setTeam1Sets(lastSnapshot.team1Sets);
              setTeam2Sets(lastSnapshot.team2Sets);
              setTeam1Points(lastSnapshot.team1Points);
              setTeam2Points(lastSnapshot.team2Points);
              setCurrentSet(lastSnapshot.currentSet);

              // Remove the last snapshot from history
              setScoreHistory(scoreHistory.slice(0, -1));

              // Update the database to reflect the undo
              await databaseService.updateMatchScore(
                matchId,
                lastSnapshot.team1Sets,
                lastSnapshot.team2Sets,
                lastSnapshot.currentSet
              );

              // Update or delete the current set in database
              const sets = await databaseService.getMatchSets(matchId);
              const currentSetData = sets.find(s => s.setNumber === lastSnapshot.currentSet);

              if (currentSetData) {
                if (lastSnapshot.team1Points === 0 && lastSnapshot.team2Points === 0) {
                  // If we're back to 0-0, we should delete this set if it was just created
                  // For now, just update it to 0-0
                  await databaseService.updateGameSetScore(
                    currentSetData.id,
                    lastSnapshot.team1Points,
                    lastSnapshot.team2Points
                  );
                } else {
                  // Update the set score to the previous state
                  await databaseService.updateGameSetScore(
                    currentSetData.id,
                    lastSnapshot.team1Points,
                    lastSnapshot.team2Points
                  );
                }
              }
            } catch (error) {
              console.error('Failed to undo point:', error);
              Alert.alert('Error', 'Failed to undo point');
            }
          },
        },
      ]
    );
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
          {isDoubles ? (
            <Text style={styles.teamLabel}>Team {teamNumber}</Text>
          ) : (
            <Text style={styles.teamLabel}> </Text>
          )}
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

      {/* Set Scores Display */}
      {(completedSets.length > 0 || currentSet > 1) && (
        <View style={styles.setsHistoryContainer}>
          <Text style={styles.setsHistoryTitle}>Set Scores</Text>
          <View style={styles.setsHistoryGrid}>
            {completedSets.map((set) => (
              <View key={set.id} style={styles.setHistoryItem}>
                <Text style={styles.setHistoryLabel}>Set {set.setNumber}</Text>
                <Text style={[
                  styles.setHistoryScore,
                  set.player1Score > set.player2Score ? styles.winnerScore : styles.loserScore
                ]}>
                  {set.player1Score}
                </Text>
                <Text style={styles.setHistorySeparator}>-</Text>
                <Text style={[
                  styles.setHistoryScore,
                  set.player2Score > set.player1Score ? styles.winnerScore : styles.loserScore
                ]}>
                  {set.player2Score}
                </Text>
              </View>
            ))}
            {/* Show current set in progress */}
            {!isMatchComplete && (team1Points > 0 || team2Points > 0) && (
              <View style={[styles.setHistoryItem, styles.currentSetItem]}>
                <Text style={styles.setHistoryLabel}>Set {currentSet}</Text>
                <Text style={styles.setHistoryScore}>{team1Points}</Text>
                <Text style={styles.setHistorySeparator}>-</Text>
                <Text style={styles.setHistoryScore}>{team2Points}</Text>
                <Text style={styles.inProgressLabel}>(In Progress)</Text>
              </View>
            )}
          </View>
        </View>
      )}

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
        <TouchableOpacity
          style={[
            styles.controlButton,
            scoreHistory.length === 0 && styles.controlButtonDisabled
          ]}
          onPress={handleUndoPoint}
          disabled={scoreHistory.length === 0 || isMatchComplete}
        >
          <Ionicons
            name="arrow-undo"
            size={24}
            color={scoreHistory.length === 0 || isMatchComplete ? '#ccc' : '#FF9800'}
          />
          <Text
            style={[
              styles.controlButtonText,
              (scoreHistory.length === 0 || isMatchComplete) && styles.controlButtonTextDisabled
            ]}
          >
            Undo
          </Text>
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
    alignItems: 'stretch', // Changed from 'center' to 'stretch' to ensure equal height
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between', // Added to distribute content evenly
  },
  playerHeader: {
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 45, // Fixed minimum height to ensure consistency
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
    minHeight: 16, // Ensures consistent height whether text is shown or not
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
    alignSelf: 'center', // Ensure VS section is centered vertically
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
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  controlButtonTextDisabled: {
    color: '#ccc',
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
  setsHistoryContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  setsHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  setsHistoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  setHistoryItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  currentSetItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  setHistoryLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  setHistoryScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 2,
  },
  setHistorySeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  winnerScore: {
    color: '#4CAF50',
  },
  loserScore: {
    color: '#666',
  },
  inProgressLabel: {
    fontSize: 10,
    color: '#2196F3',
    marginLeft: 8,
    fontStyle: 'italic',
  },
});