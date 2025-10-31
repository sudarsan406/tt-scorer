import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match, GameSet } from '../types/models';
import MatchCard from '../components/MatchCard';

export default function MatchesScreen({ navigation }: { navigation: any }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMatches();
    });
    return unsubscribe;
  }, [navigation]);

  const loadMatches = async () => {
    try {
      const { databaseService } = await import('../services/database');
      const matchesData = await databaseService.getMatches();
      setMatches(matchesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };


  const handleNewMatch = () => {
    navigation.navigate('QuickMatch');
  };


  const renderMatch = ({ item }: { item: Match }) => {
    return (
      <MatchCard
        matchId={item.id}
        status={item.status}
        player1Id={item.player1Id}
        player2Id={item.player2Id}
        player1Name={item.player1.name}
        player2Name={item.player2.name}
        isDoubles={item.isDoubles}
        team1Name={item.team1Name}
        team2Name={item.team2Name}
        player1Sets={item.player1Sets}
        player2Sets={item.player2Sets}
        winnerId={item.winnerId}
        currentSet={item.currentSet}
        showDate={true}
        createdAt={item.createdAt}
        scheduledAt={item.scheduledAt}
        loadMatchDetails={async (matchId: string) => {
          const { databaseService } = await import('../services/database');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newMatchButton} onPress={handleNewMatch}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.newMatchButtonText}>New Match</Text>
      </TouchableOpacity>

      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No matches yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first match to get started</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          style={styles.matchesList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  newMatchButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  newMatchButtonText: {
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
  matchesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
});