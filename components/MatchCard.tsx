import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameSet } from '../types/models';

interface MatchCardProps {
  // Required props
  matchId: string;
  status: string;
  
  // Player/Team info
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  isDoubles?: boolean;
  team1Name?: string;
  team2Name?: string;
  
  // Score info (for completed matches)
  player1Sets?: number;
  player2Sets?: number;
  winnerId?: string;
  currentSet?: number;
  
  // Optional props for customization
  showMatchNumber?: boolean;
  matchNumber?: number;
  showDate?: boolean;
  createdAt?: Date;
  scheduledAt?: Date;
  
  // Callbacks
  onPress?: () => void;
  loadMatchDetails: (matchId: string) => Promise<GameSet[]>;
}

export default function MatchCard({
  matchId,
  status,
  player1Id,
  player2Id,
  player1Name,
  player2Name,
  isDoubles = false,
  team1Name,
  team2Name,
  player1Sets,
  player2Sets,
  winnerId,
  currentSet,
  showMatchNumber = false,
  matchNumber,
  showDate = true,
  createdAt,
  scheduledAt,
  onPress,
  loadMatchDetails
}: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sets, setSets] = useState<GameSet[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      case 'scheduled':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return 'checkmark-circle';
    if (status === 'scheduled' && player1Id && player2Id) return 'play-circle';
    if (status === 'in_progress') return 'hourglass';
    return 'time';
  };

  const toggleExpansion = async () => {
    console.log('MatchCard toggleExpansion called:', { status, matchId, isExpanded, setsLength: sets.length, loading });
    
    if (status !== 'completed') {
      console.log('Match not completed, returning');
      return;
    }
    
    if (!matchId) {
      console.log('No valid matchId available for loading sets');
      return;
    }
    
    if (!isExpanded && sets.length === 0 && !loading) {
      console.log('Loading match details for matchId:', matchId);
      setLoading(true);
      try {
        const matchSets = await loadMatchDetails(matchId);
        console.log('Loaded sets:', matchSets);
        setSets(matchSets);
      } catch (error) {
        console.error('Failed to load match details:', error);
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
    console.log('Set isExpanded to:', !isExpanded);
  };

  const getWinnerName = () => {
    if (!winnerId) return '';
    
    if (winnerId === player1Id) {
      return isDoubles ? team1Name || player1Name : player1Name;
    } else {
      return isDoubles ? team2Name || player2Name : player2Name;
    }
  };

  const getDisplayName = (playerId: string, playerName: string, teamName?: string) => {
    return isDoubles ? teamName || playerName : playerName;
  };

  return (
    <View style={[styles.matchCard, { borderLeftColor: getStatusColor(status) }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
        <View style={styles.matchHeader}>
          <View style={styles.headerLeft}>
            {showMatchNumber && matchNumber && (
              <Text style={styles.matchTitle}>Match {matchNumber}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusText}>{getStatusText(status)}</Text>
            </View>
            <Ionicons 
              name={getStatusIcon(status)} 
              size={20} 
              color={getStatusColor(status)} 
            />
          </View>
        </View>
        
        <View style={styles.playersSection}>
          <View style={[
            styles.playerRow,
            styles.player1Row,
            winnerId === player1Id && styles.winnerRow
          ]}>
            <Text style={[
              styles.playerName,
              styles.player1Name
            ]}>
              {getDisplayName(player1Id, player1Name, team1Name)}
            </Text>
            <View style={styles.playerScore}>
              {status === 'completed' && player1Sets !== undefined && (
                <Text style={[
                  styles.scoreText,
                  styles.player1Score
                ]}>
                  {player1Sets}
                </Text>
              )}
              {winnerId === player1Id && (
                <Ionicons name="trophy" size={16} color="#FFD700" />
              )}
            </View>
          </View>

          <Text style={styles.vsText}>vs</Text>

          <View style={[
            styles.playerRow,
            styles.player2Row,
            winnerId === player2Id && styles.winnerRow
          ]}>
            <Text style={[
              styles.playerName,
              styles.player2Name
            ]}>
              {getDisplayName(player2Id, player2Name, team2Name)}
            </Text>
            <View style={styles.playerScore}>
              {status === 'completed' && player2Sets !== undefined && (
                <Text style={[
                  styles.scoreText,
                  styles.player2Score
                ]}>
                  {player2Sets}
                </Text>
              )}
              {winnerId === player2Id && (
                <Ionicons name="trophy" size={16} color="#FFD700" />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Completed match score section */}
      {status === 'completed' && player1Sets !== undefined && player2Sets !== undefined && matchId && (
        <View style={styles.completedMatchContainer}>
          <TouchableOpacity
            style={styles.scoreSection}
            onPress={toggleExpansion}
            activeOpacity={0.7}
          >
            <View style={styles.scoreInfo}>
              <View style={styles.scoreWithChevron}>
                <Text style={[
                  styles.mainScoreText,
                  winnerId === player1Id && styles.player1ScoreWin
                ]}>
                  {player1Sets}
                </Text>
                <Text style={styles.scoreSeparator}>-</Text>
                <Text style={[
                  styles.mainScoreText,
                  winnerId === player2Id && styles.player2ScoreWin
                ]}>
                  {player2Sets}
                </Text>
                {loading ? (
                  <Text style={styles.loadingText}>Loading...</Text>
                ) : (
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#2196F3"
                    style={styles.chevronIcon}
                  />
                )}
              </View>
              {winnerId && (
                <Text style={styles.winnerText}>
                  Winner: {getWinnerName()}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Detailed scores (expanded) - Now inside the same container */}
          {isExpanded && (
            <View style={styles.detailedScores}>
              {sets.length > 0 ? (
                sets.map((set) => (
                  <View key={set.id} style={styles.setScore}>
                    <Text style={styles.setNumber}>Set {set.setNumber}</Text>
                    <View style={styles.setScoreContainer}>
                      <Text style={[
                        styles.setScoreText,
                        set.winnerId === player1Id && styles.player1ScoreWin
                      ]}>
                        {set.player1Score}
                      </Text>
                      <Text style={styles.setScoreSeparator}>-</Text>
                      <Text style={[
                        styles.setScoreText,
                        set.winnerId === player2Id && styles.player2ScoreWin
                      ]}>
                        {set.player2Score}
                      </Text>
                    </View>
                    {set.player1Score > 10 && set.player2Score > 10 && (
                      <Text style={styles.deuceIndicator}>Deuce</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No detailed scores available</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* In progress match info */}
      {status === 'in_progress' && (
        <View style={styles.scoreSection}>
          <View style={styles.mainScore}>
            <Text style={styles.mainScoreText}>
              Sets: {player1Sets || 0} - {player2Sets || 0}
            </Text>
            <Text style={styles.currentSetText}>Current Set: {currentSet || 1}</Text>
          </View>
        </View>
      )}
      
      {/* Footer with date */}
      {showDate && (
        <View style={styles.matchFooter}>
          <Text style={styles.dateText}>
            {scheduledAt ? 
              `Scheduled: ${scheduledAt.toLocaleDateString()}` :
              createdAt ? `Created: ${createdAt.toLocaleDateString()}` : ''
            }
          </Text>
          {status !== 'completed' && onPress && (
            <Ionicons name="chevron-forward" size={20} color="#666" />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'nowrap', // Prevent wrapping
  },
  headerLeft: {
    flex: 0,
    marginRight: 10, // Add spacing between match number and status
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'flex-end', // Align to the right
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playersSection: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  winnerRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Light gold background for winner
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  playerName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  winnerName: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  playerScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    minWidth: 20,
    textAlign: 'center',
  },
  winnerScore: {
    color: '#2196F3',
  },
  vsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  completedMatchContainer: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scoreSection: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  scoreInfo: {
    alignItems: 'center',
  },
  scoreWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mainScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mainScore: {
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  currentSetText: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 4,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginTop: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  detailedScores: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  setScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    gap: 15,
  },
  setNumber: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    minWidth: 40,
  },
  setScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  player1Winner: {
    color: '#4CAF50',
  },
  player2Winner: {
    color: '#2196F3',
  },
  deuceIndicator: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  chevronIcon: {
    marginLeft: 8, // Add some spacing between score and chevron
  },
  // Player 1 color theme (blue)
  player1Row: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    paddingLeft: 5,
  },
  player1Name: {
    color: '#2196F3',
    fontWeight: '600',
  },
  player1Score: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  player1ScoreWin: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 22,
  },
  // Player 2 color theme (green)
  player2Row: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    paddingLeft: 5,
  },
  player2Name: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  player2Score: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  player2ScoreWin: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 22,
  },
  scoreSeparator: {
    fontSize: 20,
    color: '#666',
    marginHorizontal: 8,
  },
  setScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setScoreSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 5,
  },
});