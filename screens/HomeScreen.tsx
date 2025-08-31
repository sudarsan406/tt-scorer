import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatabaseContext } from '../contexts/DatabaseContext';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { isReady, error } = useDatabaseContext();

  const handleQuickMatch = () => {
    navigation.navigate('QuickMatch');
  };

  const handleNewTournament = () => {
    navigation.navigate('TournamentCreate');
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>🏓 Welcome to TT Score</Text>
        <Text style={styles.welcomeSubtitle}>
          Track your table tennis matches and improve your game
        </Text>
        {Platform.OS === 'web' && (
          <Text style={styles.webNote}>
            ✨ Check the browser tab to see your custom favicon!
          </Text>
        )}
      </View>

      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleQuickMatch}>
          <Ionicons name="play-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Start Quick Match</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleNewTournament}>
          <Ionicons name="trophy" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Create Tournament</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsPreviewSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.statsCard}>
          <Text style={styles.statsText}>No recent matches</Text>
          <Text style={styles.statsSubtext}>Start playing to see your stats here</Text>
        </View>
      </View>
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
    fontSize: 18,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  welcomeSection: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    textAlign: 'center',
  },
  webNote: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statsPreviewSection: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  statsSubtext: {
    fontSize: 14,
    color: '#999',
  },
});