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

export default function TournamentCreateScreen({ navigation }: TournamentCreateScreenProps) {
  const [tournamentName, setTournamentName] = useState('');
  const [description, setDescription] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [format, setFormat] = useState<'single_elimination' | 'round_robin'>('single_elimination');
  const [bestOf, setBestOf] = useState(3);
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

  const validateTournament = () => {
    if (!tournamentName.trim()) {
      Alert.alert('Error', 'Tournament name is required');
      return false;
    }
    
    if (selectedPlayers.length < 4) {
      Alert.alert('Error', 'At least 4 players are required for a tournament');
      return false;
    }

    if (format === 'single_elimination') {
      const validSizes = [4, 8, 16, 32];
      if (!validSizes.includes(selectedPlayers.length)) {
        Alert.alert('Error', 'Single elimination requires 4, 8, 16, or 32 players');
        return false;
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
      });

      await databaseService.addTournamentParticipants(tournamentId, selectedPlayers);
      await databaseService.generateTournamentBracket(tournamentId, format, selectedPlayers);
      
      
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
    
    return (
      <TouchableOpacity
        key={player.id}
        style={[styles.playerCard, isSelected && styles.selectedPlayerCard]}
        onPress={() => handlePlayerToggle(player)}
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

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Tournament Summary</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{tournamentName || 'Not set'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Format:</Text>
          <Text style={styles.summaryValue}>
            {format === 'single_elimination' ? 'Single Elimination' : 'Round Robin'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Match Format:</Text>
          <Text style={styles.summaryValue}>Best of {bestOf}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Players:</Text>
          <Text style={styles.summaryValue}>{selectedPlayers.length}</Text>
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
});