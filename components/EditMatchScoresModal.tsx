import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameSet } from '../types/models';
import { databaseService } from '../services/database';

interface EditMatchScoresModalProps {
  visible: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
  sets: GameSet[];
  onClose: () => void;
  onScoresUpdated: () => void;
}

export default function EditMatchScoresModal({
  visible,
  matchId,
  player1Name,
  player2Name,
  sets,
  onClose,
  onScoresUpdated,
}: EditMatchScoresModalProps) {
  const [editedScores, setEditedScores] = useState<{ [key: string]: { player1: string; player2: string } }>({});
  const [saving, setSaving] = useState(false);

  const initializeScores = () => {
    const scores: { [key: string]: { player1: string; player2: string } } = {};
    sets.forEach((set) => {
      scores[set.id] = {
        player1: set.player1Score.toString(),
        player2: set.player2Score.toString(),
      };
    });
    setEditedScores(scores);
  };

  React.useEffect(() => {
    if (visible) {
      initializeScores();
    }
  }, [visible, sets]);

  const handleScoreChange = (setId: string, player: 'player1' | 'player2', value: string) => {
    // Only allow numeric input
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    setEditedScores((prev) => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [player]: value,
      },
    }));
  };

  const validateScores = (): string | null => {
    for (const set of sets) {
      const scores = editedScores[set.id];
      if (!scores) continue;

      const p1Score = parseInt(scores.player1, 10);
      const p2Score = parseInt(scores.player2, 10);

      // Check for valid numbers
      if (isNaN(p1Score) || isNaN(p2Score)) {
        return `Set ${set.setNumber}: Both scores must be numbers`;
      }

      // Check for negative scores
      if (p1Score < 0 || p2Score < 0) {
        return `Set ${set.setNumber}: Scores cannot be negative`;
      }

      // Check minimum winning score (11 points)
      const maxScore = Math.max(p1Score, p2Score);
      const minScore = Math.min(p1Score, p2Score);

      if (maxScore < 11) {
        return `Set ${set.setNumber}: Winner must have at least 11 points`;
      }

      // Check 2-point margin for scores above 10-10
      if (minScore >= 10 && Math.abs(p1Score - p2Score) < 2) {
        return `Set ${set.setNumber}: Must win by 2 points when score is 10-10 or above`;
      }

      // Check for tie
      if (p1Score === p2Score) {
        return `Set ${set.setNumber}: Scores cannot be tied`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    // Validate all scores
    const validationError = validateScores();
    if (validationError) {
      Alert.alert('Invalid Scores', validationError);
      return;
    }

    // Check if any scores actually changed
    const hasChanges = sets.some((set) => {
      const scores = editedScores[set.id];
      if (!scores) return false;
      return (
        parseInt(scores.player1, 10) !== set.player1Score ||
        parseInt(scores.player2, 10) !== set.player2Score
      );
    });

    if (!hasChanges) {
      Alert.alert('No Changes', 'No scores were modified');
      return;
    }

    Alert.alert(
      'Confirm Score Edit',
      'Editing scores will recalculate the match winner and update Elo ratings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setSaving(true);
            try {
              // Update each set that changed
              for (const set of sets) {
                const scores = editedScores[set.id];
                if (!scores) continue;

                const newP1Score = parseInt(scores.player1, 10);
                const newP2Score = parseInt(scores.player2, 10);

                if (newP1Score !== set.player1Score || newP2Score !== set.player2Score) {
                  await databaseService.editGameSetScore(set.id, newP1Score, newP2Score);
                }
              }

              Alert.alert(
                'Success',
                'Scores updated successfully. Match winner and Elo ratings have been recalculated.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onScoresUpdated();
                      onClose();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Failed to update scores:', error);
              Alert.alert('Error', 'Failed to update scores. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Edit Match Scores</Text>
              <Text style={styles.subtitle}>
                {player1Name} vs {player2Name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Changes will recalculate the match winner and update Elo ratings
              </Text>
            </View>

            <View style={styles.setsContainer}>
              {sets.map((set) => (
                <View key={set.id} style={styles.setCard}>
                  <Text style={styles.setTitle}>Set {set.setNumber}</Text>

                  <View style={styles.scoreRow}>
                    <View style={styles.scoreInputContainer}>
                      <Text style={styles.playerLabel}>{player1Name}</Text>
                      <TextInput
                        style={styles.scoreInput}
                        value={editedScores[set.id]?.player1 || ''}
                        onChangeText={(value) => handleScoreChange(set.id, 'player1', value)}
                        keyboardType="number-pad"
                        maxLength={2}
                        editable={!saving}
                      />
                    </View>

                    <Text style={styles.separator}>-</Text>

                    <View style={styles.scoreInputContainer}>
                      <Text style={styles.playerLabel}>{player2Name}</Text>
                      <TextInput
                        style={styles.scoreInput}
                        value={editedScores[set.id]?.player2 || ''}
                        onChangeText={(value) => handleScoreChange(set.id, 'player2', value)}
                        keyboardType="number-pad"
                        maxLength={2}
                        editable={!saving}
                      />
                    </View>
                  </View>

                  {editedScores[set.id] &&
                    (parseInt(editedScores[set.id].player1, 10) !== set.player1Score ||
                      parseInt(editedScores[set.id].player2, 10) !== set.player2Score) && (
                      <View style={styles.changedIndicator}>
                        <Ionicons name="pencil" size={14} color="#FF9800" />
                        <Text style={styles.changedText}>
                          Original: {set.player1Score}-{set.player2Score}
                        </Text>
                      </View>
                    )}
                </View>
              ))}
            </View>

            <View style={styles.rulesBox}>
              <Text style={styles.rulesTitle}>Scoring Rules:</Text>
              <Text style={styles.rulesText}>• Winner must have at least 11 points</Text>
              <Text style={styles.rulesText}>• Must win by 2 points when score is 10-10 or above</Text>
              <Text style={styles.rulesText}>• Scores cannot be tied</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
  },
  setsContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  setCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  setTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scoreInputContainer: {
    alignItems: 'center',
    flex: 1,
  },
  playerLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  scoreInput: {
    width: 60,
    height: 50,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#fff',
  },
  separator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 24,
  },
  changedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  changedText: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  rulesBox: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    margin: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 6,
  },
  rulesText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
