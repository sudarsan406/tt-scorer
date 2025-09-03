import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player } from '../types/models';

export default function PlayersScreen({ navigation }: { navigation: any }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPlayers();
    });
    return unsubscribe;
  }, [navigation]);

  const loadPlayers = async () => {
    try {
      const { databaseService } = await import('../services/database');
      const playersData = await databaseService.getPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error('Failed to load players:', error);
      Alert.alert('Error', 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Error', 'Player name is required');
      return;
    }

    try {
      const { databaseService } = await import('../services/database');
      await databaseService.createPlayer({
        name: newPlayerName.trim(),
        email: newPlayerEmail.trim() || undefined,
        rating: 1200,
      });
      loadPlayers();
      
      setNewPlayerName('');
      setNewPlayerEmail('');
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to add player:', error);
      Alert.alert('Error', 'Failed to add player');
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        {item.email && <Text style={styles.playerEmail}>{item.email}</Text>}
        <Text style={styles.playerRating}>Rating: {item.rating}</Text>
      </View>
      <TouchableOpacity style={styles.playerActions}>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading players...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Player</Text>
      </TouchableOpacity>

      {players.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No players yet</Text>
          <Text style={styles.emptyStateSubtext}>Add your first player to get started</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Player</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Player Name"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              value={newPlayerEmail}
              onChangeText={setNewPlayerEmail}
              keyboardType="email-address"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddPlayer}
              >
                <Text style={styles.saveButtonText}>Add Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  addButtonText: {
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
  playersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  playerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  playerRating: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 4,
  },
  playerActions: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});