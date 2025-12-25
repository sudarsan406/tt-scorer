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
import MatchCard from '../components/MatchCard';
import FooterNavigation from '../components/FooterNavigation';
import { ExportService } from '../services/exportService';

interface TournamentBracketScreenProps {
  route: {
    params: {
      tournamentId: string;
    };
  };
  navigation: any;
}

interface Standing {
  player: any;
  position: number;
  matchWins: number;
  matchLosses: number;
  setWins: number;
  setLosses: number;
  setDifference: number;
  winPercentage: number;
}

export default function TournamentBracketScreen({ route, navigation }: TournamentBracketScreenProps) {
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'bracket' | 'standings'>('bracket');

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

        // Load standings
        try {
          const tournamentStandings = await databaseService.getTournamentStandings(tournamentId);
          setStandings(tournamentStandings);
        } catch (error) {
          console.warn('Failed to load standings:', error);
        }
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


  const handleExport = async () => {
    if (bracketMatches.length === 0) {
      Alert.alert('No Data', 'No bracket data to export');
      return;
    }

    setExporting(true);
    try {
      await ExportService.exportTournamentToCSV(tournamentId);
      Alert.alert(
        'Success',
        'Tournament bracket exported successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export tournament bracket',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const handleMatchPress = (match: BracketMatch) => {
    if (match.status === 'scheduled' && match.player1Id && match.player2Id) {
      const team1Display = match.team1Name || match.player1Name || 'Team 1';
      const team2Display = match.team2Name || match.player2Name || 'Team 2';

      Alert.alert(
        'Start Match',
        `Start match between ${team1Display} and ${team2Display}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: () => startMatch(match) }
        ]
      );
    } else if (match.status === 'in_progress') {
      // Resume in-progress match
      resumeMatch(match);
    } else if (match.status === 'completed') {
      // For completed matches, only handle expansion via score section
      return;
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
      // Check if this is a doubles match
      const isDoublesMatch = !!(match.player3Id && match.player4Id);
      const team1Display = match.team1Name || match.player1Name || 'Team 1';
      const team2Display = match.team2Name || match.player2Name || 'Team 2';

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
        isDoubles: isDoublesMatch,
        team1Name: team1Display,
        team2Name: team2Display,
      });

      // Update tournament match status
      await databaseService.updateTournamentMatchStatus(match.id, 'in_progress', undefined, matchId);

      navigation.navigate('MatchScoring', {
        matchId,
        isDoubles: isDoublesMatch,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player3Id: match.player3Id,
        player4Id: match.player4Id,
        team1Name: team1Display,
        team2Name: team2Display,
        tournamentId,
        tournamentMatchId: match.id,
      });
    } catch (error) {
      console.error('Failed to start match:', error);
      Alert.alert('Error', 'Failed to start match');
    }
  };

  const resumeMatch = async (match: BracketMatch) => {
    if (!match.linkedMatchId) {
      Alert.alert('Error', 'Cannot resume match - match ID not found');
      return;
    }

    try {
      // Check if this is a doubles match
      const isDoublesMatch = !!(match.player3Id && match.player4Id);
      const team1Display = match.team1Name || match.player1Name || 'Team 1';
      const team2Display = match.team2Name || match.player2Name || 'Team 2';

      // Navigate to the match scoring screen to resume
      navigation.navigate('MatchScoring', {
        matchId: match.linkedMatchId,
        isDoubles: isDoublesMatch,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player3Id: match.player3Id,
        player4Id: match.player4Id,
        team1Name: team1Display,
        team2Name: team2Display,
        tournamentId,
        tournamentMatchId: match.id,
      });
    } catch (error) {
      console.error('Failed to resume match:', error);
      Alert.alert('Error', 'Failed to resume match');
    }
  };

  const renderMatch = (match: BracketMatch) => {
    // Display team names for doubles, otherwise player names
    const team1Display = match.team1Name || match.player1Name || 'TBD';
    const team2Display = match.team2Name || match.player2Name || 'TBD';

    return (
      <MatchCard
        key={match.id}
        matchId={match.linkedMatchId || ''}
        status={match.status}
        player1Id={match.player1Id || ''}
        player2Id={match.player2Id || ''}
        player1Name={team1Display}
        player2Name={team2Display}
        player1Sets={match.player1Sets}
        player2Sets={match.player2Sets}
        winnerId={match.winnerId}
        showMatchNumber={true}
        matchNumber={match.matchNumber}
        showDate={false}
        onPress={() => handleMatchPress(match)}
        loadMatchDetails={async (matchId: string) => {
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
                {roundNumber === rounds.length ? 'Final' :
                 roundNumber === rounds.length - 1 ? 'Semifinal' :
                 `Round ${roundNumber}`}
              </Text>
              <View style={styles.roundMatches}>
                {roundMatches.map((match) => (
                  <View key={match.id}>
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

  const [showStandingsInfo, setShowStandingsInfo] = useState(false);

  const renderStandings = () => {
    if (standings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="podium-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No standings available yet</Text>
          <Text style={styles.emptySubtext}>Complete some matches to see standings</Text>
        </View>
      );
    }

    return (
      <View style={styles.standingsContainer}>
        <View style={styles.standingsHeaderRow}>
          <Text style={styles.standingsTitle}>Standings</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowStandingsInfo(!showStandingsInfo)}
          >
            <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {showStandingsInfo && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How Standings Are Calculated:</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>1.</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Match Wins</Text> (Primary ranking)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>2.</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Set Difference</Text> (Tiebreaker #1)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>3.</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Win Percentage</Text> (Tiebreaker #2)
              </Text>
            </View>
            <Text style={styles.infoExample}>
              Example: A player with 5-1 (5 wins, 1 loss) beats a player with 4-2,
              even if the 4-2 player has better set difference.
            </Text>
          </View>
        )}

        <View style={styles.standingsHeader}>
          <Text style={[styles.standingsHeaderText, styles.positionColumn]}>#</Text>
          <Text style={[styles.standingsHeaderText, styles.nameColumn]}>Player</Text>
          <Text style={[styles.standingsHeaderText, styles.statsColumn]}>W-L</Text>
          <Text style={[styles.standingsHeaderText, styles.statsColumn]}>Sets</Text>
          <Text style={[styles.standingsHeaderText, styles.statsColumn]}>Win %</Text>
        </View>

        {standings.map((standing) => (
          <View
            key={standing.player.id}
            style={[
              styles.standingRow,
              standing.position === 1 && styles.firstPlace,
              standing.position === 2 && styles.secondPlace,
              standing.position === 3 && styles.thirdPlace,
            ]}
          >
            <View style={styles.positionColumn}>
              {standing.position <= 3 ? (
                <Ionicons
                  name="trophy"
                  size={20}
                  color={
                    standing.position === 1 ? '#FFD700' :
                    standing.position === 2 ? '#C0C0C0' :
                    '#CD7F32'
                  }
                />
              ) : (
                <Text style={styles.positionText}>{standing.position}</Text>
              )}
            </View>
            <Text style={[styles.standingText, styles.nameColumn]}>{standing.player.name}</Text>
            <Text style={[styles.standingText, styles.statsColumn]}>
              {standing.matchWins}-{standing.matchLosses}
            </Text>
            <Text style={[styles.standingText, styles.statsColumn]}>
              {standing.setWins}-{standing.setLosses}
              <Text style={styles.setDifferenceText}>
                {' '}({standing.setDifference >= 0 ? '+' : ''}{standing.setDifference})
              </Text>
            </Text>
            <Text style={[styles.standingText, styles.statsColumn]}>
              {standing.winPercentage.toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
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
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.tournamentTitle}>{tournament.name}</Text>
          <Text style={styles.formatText}>
            {tournament.format === 'single_elimination' ? 'Single Elimination' :
             tournament.format === 'round_robin' ? 'Round Robin' : 'King of Court'}
          </Text>
          <View style={styles.headerButtons}>
            {tournament.status === 'completed' && (
              <TouchableOpacity
                style={styles.tournamentDetailsButton}
                onPress={() => navigation.navigate('TournamentDetail', { tournamentId: tournament.id })}
              >
                <Ionicons name="trophy" size={16} color="#fff" />
                <Text style={styles.tournamentDetailsButtonText}>View Winner</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
              onPress={handleExport}
              disabled={exporting || bracketMatches.length === 0}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={16} color="#fff" />
              )}
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bracket' && styles.activeTab]}
          onPress={() => setActiveTab('bracket')}
        >
          <Ionicons
            name="git-network-outline"
            size={20}
            color={activeTab === 'bracket' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'bracket' && styles.activeTabText]}>
            Bracket
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
          onPress={() => setActiveTab('standings')}
        >
          <Ionicons
            name="podium-outline"
            size={20}
            color={activeTab === 'standings' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'standings' && styles.activeTabText]}>
            Standings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainScrollContainer} showsVerticalScrollIndicator={true}>
        {activeTab === 'bracket' ? (
          tournament.format === 'round_robin' || tournament.format === 'king_of_court' ?
            renderRoundRobinBracket() :
            renderSingleEliminationBracket()
        ) : (
          renderStandings()
        )}
      </ScrollView>
      <FooterNavigation navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
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
  },
  headerMain: {
    alignItems: 'center',
    marginBottom: 15,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tournamentDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  tournamentDetailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
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
    gap: 15,
  },
  roundRobinContainer: {
    flex: 1,
    padding: 20,
  },
  matchesGrid: {
    gap: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  standingsContainer: {
    flex: 1,
    padding: 16,
  },
  standingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  standingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoButton: {
    padding: 4,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  infoBold: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  infoExample: {
    fontSize: 13,
    color: '#555',
    marginTop: 8,
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  standingsHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  standingsHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  standingRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  firstPlace: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  secondPlace: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#C0C0C0',
  },
  thirdPlace: {
    backgroundColor: '#FFF5F0',
    borderLeftWidth: 4,
    borderLeftColor: '#CD7F32',
  },
  positionColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  nameColumn: {
    flex: 2,
    paddingHorizontal: 8,
  },
  statsColumn: {
    flex: 1,
    textAlign: 'center',
  },
  standingText: {
    fontSize: 13,
    color: '#333',
  },
  setDifferenceText: {
    fontSize: 11,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});