import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player } from '../types/models';
import { databaseService } from '../services/database';

interface TournamentCreateScreenProps {
  navigation: any;
}

interface DoublesTeam {
  player1: Player;
  player2: Player;
  teamName?: string;
}

export default function TournamentCreateScreen({ navigation }: TournamentCreateScreenProps) {
  const [tournamentName, setTournamentName] = useState('');
  const [description, setDescription] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [format, setFormat] = useState<'single_elimination' | 'round_robin' | 'king_of_court'>('single_elimination');
  const [bestOf, setBestOf] = useState(3);
  const [isDoubles, setIsDoubles] = useState(false);
  const [doublesTeams, setDoublesTeams] = useState<DoublesTeam[]>([]);
  const [roundRobinRounds, setRoundRobinRounds] = useState(1);
  const [kingOfCourtWins, setKingOfCourtWins] = useState(3);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const playersData = await databaseService.getPlayers();
      setPlayers(playersData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerToggle = (player: Player) => {
    const isSelected = selectedPlayers.find(p => p.id === player.id);
    if (isSelected) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleCreateTeam = () => {
    if (selectedPlayers.length !== 2) {
      Alert.alert('Error', 'Please select exactly 2 players to form a team');
      return;
    }

    // Check if any of the selected players are already in a team
    const player1Id = selectedPlayers[0].id;
    const player2Id = selectedPlayers[1].id;

    const player1InTeam = doublesTeams.find(
      team => team.player1.id === player1Id || team.player2.id === player1Id
    );
    const player2InTeam = doublesTeams.find(
      team => team.player1.id === player2Id || team.player2.id === player2Id
    );

    if (player1InTeam) {
      Alert.alert(
        'Player Already in Team',
        `${selectedPlayers[0].name} is already part of team "${player1InTeam.teamName}". Each player can only be in one team.`
      );
      return;
    }

    if (player2InTeam) {
      Alert.alert(
        'Player Already in Team',
        `${selectedPlayers[1].name} is already part of team "${player2InTeam.teamName}". Each player can only be in one team.`
      );
      return;
    }

    const newTeam: DoublesTeam = {
      player1: selectedPlayers[0],
      player2: selectedPlayers[1],
      teamName: `${selectedPlayers[0].name} / ${selectedPlayers[1].name}`,
    };

    setDoublesTeams([...doublesTeams, newTeam]);
    setSelectedPlayers([]);
  };

  const handleRemoveTeam = (index: number) => {
    setDoublesTeams(doublesTeams.filter((_, i) => i !== index));
  };

  const validateTournament = () => {
    if (!tournamentName.trim()) {
      Alert.alert('Error', 'Tournament name is required');
      return false;
    }

    if (isDoubles) {
      if (doublesTeams.length < 3) {
        Alert.alert('Error', 'At least 3 teams are required for a doubles tournament');
        return false;
      }
      if (format === 'single_elimination') {
        const validSizes = [4, 8, 16, 32];
        if (!validSizes.includes(doublesTeams.length)) {
          Alert.alert('Error', 'Single elimination requires 4, 8, 16, or 32 teams');
          return false;
        }
      }
    } else {
      if (selectedPlayers.length < 3) {
        Alert.alert('Error', 'At least 3 players are required for a tournament');
        return false;
      }
      if (format === 'single_elimination') {
        const validSizes = [4, 8, 16, 32];
        if (!validSizes.includes(selectedPlayers.length)) {
          Alert.alert('Error', 'Single elimination requires 4, 8, 16, or 32 players');
          return false;
        }
      }
    }

    return true;
  };

  const handleCreateTournament = async () => {
    if (!validateTournament()) return;

    setCreating(true);
    try {
      const tournamentId = await databaseService.createTournament({
        name: tournamentName.trim(),
        description: description.trim() || undefined,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week
        status: 'upcoming',
        format,
        bestOf,
        isDoubles,
        roundRobinRounds,
        kingOfCourtWins,
      });

      // Get all unique players from teams or selected players
      const allPlayers = isDoubles
        ? Array.from(new Set(doublesTeams.flatMap(t => [t.player1, t.player2])))
        : selectedPlayers;

      await databaseService.addTournamentParticipants(tournamentId, allPlayers);
      await databaseService.generateTournamentBracket(
        tournamentId,
        format,
        selectedPlayers,
        isDoubles,
        isDoubles ? doublesTeams : undefined,
        roundRobinRounds
      );
      
      
      Alert.alert(
        'Tournament Created!', 
        `${tournamentName} tournament created with ${selectedPlayers.length} players and bracket generated!`,
        [
          { text: 'Back to List', style: 'cancel', onPress: () => navigation.goBack() },
          { text: 'View Tournament', onPress: () => navigation.navigate('TournamentDetail', { tournamentId }) }
        ]
      );
    } catch (error) {
      console.error('Failed to create tournament:', error);
      Alert.alert('Error', 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  const renderPlayer = (player: Player) => {
    const isSelected = selectedPlayers.find(p => p.id === player.id);

    // Check if player is already in a team (for doubles mode)
    const playerTeam = isDoubles ? doublesTeams.find(
      team => team.player1.id === player.id || team.player2.id === player.id
    ) : null;

    const isInTeam = !!playerTeam;

    return (
      <TouchableOpacity
        key={player.id}
        style={[
          styles.playerCard,
          isSelected && styles.selectedPlayerCard,
          isInTeam && styles.playerInTeamCard
        ]}
        onPress={() => handlePlayerToggle(player)}
        disabled={isInTeam}
      >
        <View style={styles.playerInfo}>
          <Text style={[
            styles.playerName,
            isSelected && styles.selectedPlayerName,
            isInTeam && styles.playerInTeamText
          ]}>
            {player.name}
          </Text>
          <Text style={[
            styles.playerRating,
            isSelected && styles.selectedPlayerRating,
            isInTeam && styles.playerInTeamText
          ]}>
            Rating: {player.rating}
          </Text>
          {isInTeam && playerTeam && (
            <Text style={styles.teamAssignmentText}>
              In team: {playerTeam.teamName}
            </Text>
          )}
        </View>
        {isSelected && !isInTeam && (
          <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
        )}
        {isInTeam && (
          <Ionicons name="people" size={24} color="#999" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading players...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Tournament</Text>
        <Text style={styles.subtitle}>Set up a new table tennis tournament</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tournament Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Tournament Name"
          value={tournamentName}
          onChangeText={setTournamentName}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tournament Format</Text>
        <View style={styles.formatContainer}>
          <TouchableOpacity
            style={[styles.formatButton, format === 'single_elimination' && styles.formatButtonActive]}
            onPress={() => setFormat('single_elimination')}
          >
            <Ionicons
              name="trophy"
              size={24}
              color={format === 'single_elimination' ? '#fff' : '#666'}
            />
            <Text style={[styles.formatButtonText, format === 'single_elimination' && styles.formatButtonTextActive]}>
              Single Elimination
            </Text>
            <Text style={[styles.formatDescription, format === 'single_elimination' && styles.formatDescriptionActive]}>
              Knockout tournament
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formatButton, format === 'round_robin' && styles.formatButtonActive]}
            onPress={() => setFormat('round_robin')}
          >
            <Ionicons
              name="repeat"
              size={24}
              color={format === 'round_robin' ? '#fff' : '#666'}
            />
            <Text style={[styles.formatButtonText, format === 'round_robin' && styles.formatButtonTextActive]}>
              Round Robin
            </Text>
            <Text style={[styles.formatDescription, format === 'round_robin' && styles.formatDescriptionActive]}>
              Everyone plays everyone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formatButton, format === 'king_of_court' && styles.formatButtonActive]}
            onPress={() => setFormat('king_of_court')}
          >
            <Ionicons
              name="podium"
              size={24}
              color={format === 'king_of_court' ? '#fff' : '#666'}
            />
            <Text style={[styles.formatButtonText, format === 'king_of_court' && styles.formatButtonTextActive]}>
              King of the Court
            </Text>
            <Text style={[styles.formatDescription, format === 'king_of_court' && styles.formatDescriptionActive]}>
              Winners stay, first to X wins
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Format</Text>
        <View style={styles.bestOfContainer}>
          {[3, 5, 7].map((sets) => (
            <TouchableOpacity
              key={sets}
              style={[styles.bestOfButton, bestOf === sets && styles.bestOfButtonActive]}
              onPress={() => setBestOf(sets)}
            >
              <Text style={[styles.bestOfButtonText, bestOf === sets && styles.bestOfButtonTextActive]}>
                Best of {sets}
              </Text>
              <Text style={[styles.bestOfDescription, bestOf === sets && styles.bestOfDescriptionActive]}>
                {sets === 3 ? 'First to 2 sets' : sets === 5 ? 'First to 3 sets' : 'First to 4 sets'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tournament Type</Text>
        <TouchableOpacity
          style={styles.doublesToggleContainer}
          onPress={() => {
            setIsDoubles(!isDoubles);
            setSelectedPlayers([]);
            setDoublesTeams([]);
          }}
        >
          <View style={styles.doublesToggleInfo}>
            <Text style={styles.doublesToggleText}>Doubles Tournament</Text>
            <Text style={styles.doublesToggleDescription}>
              {isDoubles ? 'Teams of 2 players' : 'Individual players'}
            </Text>
          </View>
          <View style={[styles.toggleSwitch, isDoubles && styles.toggleSwitchActive]}>
            <View style={[styles.toggleCircle, isDoubles && styles.toggleCircleActive]} />
          </View>
        </TouchableOpacity>
      </View>

      {format === 'round_robin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round Robin Rounds</Text>
          <Text style={styles.formatNote}>
            Number of times each {isDoubles ? 'team' : 'player'} plays each other
          </Text>
          <View style={styles.roundsContainer}>
            {[1, 2, 3, 5, 7].map((rounds) => (
              <TouchableOpacity
                key={rounds}
                style={[styles.roundButton, roundRobinRounds === rounds && styles.roundButtonActive]}
                onPress={() => setRoundRobinRounds(rounds)}
              >
                <Text style={[styles.roundButtonText, roundRobinRounds === rounds && styles.roundButtonTextActive]}>
                  {rounds} {rounds === 1 ? 'Round' : 'Rounds'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {format === 'king_of_court' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wins to Claim a Game</Text>
          <Text style={styles.formatNote}>
            First player to reach this many wins claims that game. Player with most games won is the champion.
          </Text>
          <View style={styles.roundsContainer}>
            {[3, 5, 7, 10].map((wins) => (
              <TouchableOpacity
                key={wins}
                style={[styles.roundButton, kingOfCourtWins === wins && styles.roundButtonActive]}
                onPress={() => setKingOfCourtWins(wins)}
              >
                <Text style={[styles.roundButtonText, kingOfCourtWins === wins && styles.roundButtonTextActive]}>
                  {wins} Wins
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isDoubles ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Create Teams ({doublesTeams.length} teams formed)
          </Text>
          {format === 'single_elimination' && (
            <Text style={styles.formatNote}>
              Single elimination requires 4, 8, 16, or 32 teams
            </Text>
          )}

          {/* Teams List */}
          {doublesTeams.length > 0 && (
            <View style={styles.teamsContainer}>
              {doublesTeams.map((team, index) => (
                <View key={index} style={styles.teamCard}>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.teamName}</Text>
                    <Text style={styles.teamPlayers}>
                      {team.player1.name} & {team.player2.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveTeam(index)}>
                    <Ionicons name="close-circle" size={24} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Player Selection for Team Formation */}
          <Text style={styles.subsectionTitle}>
            Select 2 players to form a team ({selectedPlayers.length}/2 selected)
          </Text>
          <View style={styles.playersContainer}>
            {players.map(renderPlayer)}
          </View>

          {selectedPlayers.length === 2 && (
            <TouchableOpacity style={styles.createTeamButton} onPress={handleCreateTeam}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createTeamButtonText}>Create Team</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select Players ({selectedPlayers.length} selected)
          </Text>
        {format === 'single_elimination' && (
          <Text style={styles.formatNote}>
            Single elimination requires 4, 8, 16, or 32 players
          </Text>
        )}
          <View style={styles.playersContainer}>
            {players.map(renderPlayer)}
          </View>
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Tournament Summary</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{tournamentName || 'Not set'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Format:</Text>
          <Text style={styles.summaryValue}>
            {format === 'single_elimination' ? 'Single Elimination' :
             format === 'round_robin' ? 'Round Robin' :
             'King of the Court'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{isDoubles ? 'Doubles' : 'Singles'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Match Format:</Text>
          <Text style={styles.summaryValue}>Best of {bestOf}</Text>
        </View>
        {format === 'round_robin' && roundRobinRounds > 1 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Rounds:</Text>
            <Text style={styles.summaryValue}>{roundRobinRounds} round(s)</Text>
          </View>
        )}
        {format === 'king_of_court' && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Wins per Game:</Text>
            <Text style={styles.summaryValue}>{kingOfCourtWins} wins</Text>
          </View>
        )}
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isDoubles ? 'Teams:' : 'Players:'}</Text>
          <Text style={styles.summaryValue}>{isDoubles ? doublesTeams.length : selectedPlayers.length}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.createButton, creating && styles.createButtonDisabled]}
        onPress={handleCreateTournament}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="trophy" size={24} color="#fff" />
            <Text style={styles.createButtonText}>Create Tournament</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  formatButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formatButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  formatButtonTextActive: {
    color: '#fff',
  },
  formatDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  formatDescriptionActive: {
    color: '#e3f2fd',
  },
  formatNote: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  bestOfContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  bestOfButton: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bestOfButtonTextActive: {
    color: '#fff',
  },
  bestOfDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  bestOfDescriptionActive: {
    color: '#e8f5e8',
  },
  playersContainer: {
    gap: 10,
  },
  playerCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
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
  playerInTeamCard: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.7,
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
  playerInTeamText: {
    color: '#999',
  },
  playerRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedPlayerRating: {
    color: '#1976D2',
  },
  teamAssignmentText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summary: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  doublesToggleContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  doublesToggleInfo: {
    flex: 1,
  },
  doublesToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  doublesToggleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#4CAF50',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleActive: {
    marginLeft: 22,
  },
  roundsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roundButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  roundButtonActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  roundButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  roundButtonTextActive: {
    color: '#fff',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 15,
    marginBottom: 10,
  },
  teamsContainer: {
    gap: 10,
    marginBottom: 15,
  },
  teamCard: {
    backgroundColor: '#e8f5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  teamPlayers: {
    fontSize: 14,
    color: '#558b2f',
    marginTop: 2,
  },
  createTeamButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  createTeamButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});