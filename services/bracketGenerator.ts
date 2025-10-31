import { Player, Match } from '../types/models';

export interface BracketMatch {
  id: string;
  player1Id?: string;
  player2Id?: string;
  player1Name?: string;
  player2Name?: string;
  round: number;
  matchNumber: number;
  winnerId?: string;
  nextMatchId?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  parentMatch1Id?: string;
  parentMatch2Id?: string;
  player1Sets?: number;
  player2Sets?: number;
  linkedMatchId?: string;
}

export class BracketGenerator {
  
  /**
   * Generate Single Elimination bracket
   */
  static generateSingleElimination(players: Player[]): BracketMatch[] {
    const playerCount = players.length;
    const validSizes = [4, 8, 16, 32];
    
    if (!validSizes.includes(playerCount)) {
      throw new Error(`Single elimination requires ${validSizes.join(', ')} players`);
    }

    // Shuffle players for random seeding (or could implement rating-based seeding)
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    const matches: BracketMatch[] = [];
    const totalMatches = playerCount - 1; // Always n-1 matches in single elimination
    let currentMatchId = 1;
    
    // Calculate number of rounds
    const rounds = Math.log2(playerCount);
    
    // Generate first round matches
    const firstRoundMatches = playerCount / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
      const player1 = shuffledPlayers[i * 2];
      const player2 = shuffledPlayers[i * 2 + 1];
      
      matches.push({
        id: `match_${currentMatchId}`,
        player1Id: player1.id,
        player2Id: player2.id,
        player1Name: player1.name,
        player2Name: player2.name,
        round: 1,
        matchNumber: i + 1,
        status: 'scheduled',
      });
      currentMatchId++;
    }
    
    // Generate subsequent rounds
    let previousRoundMatches = firstRoundMatches;
    for (let round = 2; round <= rounds; round++) {
      const currentRoundMatches = previousRoundMatches / 2;
      
      for (let i = 0; i < currentRoundMatches; i++) {
        const parentMatch1 = matches.find(m => m.round === round - 1 && m.matchNumber === i * 2 + 1);
        const parentMatch2 = matches.find(m => m.round === round - 1 && m.matchNumber === i * 2 + 2);
        
        const match: BracketMatch = {
          id: `match_${currentMatchId}`,
          round,
          matchNumber: i + 1,
          status: 'scheduled',
          parentMatch1Id: parentMatch1?.id,
          parentMatch2Id: parentMatch2?.id,
        };
        
        matches.push(match);
        
        // Set next match reference in parent matches
        if (parentMatch1) parentMatch1.nextMatchId = match.id;
        if (parentMatch2) parentMatch2.nextMatchId = match.id;
        
        currentMatchId++;
      }
      
      previousRoundMatches = currentRoundMatches;
    }
    
    return matches;
  }

  /**
   * Generate Round Robin schedule with playoffs
   */
  static generateRoundRobin(players: Player[]): BracketMatch[] {
    const playerCount = players.length;
    
    if (playerCount < 3) {
      throw new Error('Round robin requires at least 3 players');
    }

    const matches: BracketMatch[] = [];
    let currentMatchId = 1;
    
    // Generate all possible pairings for round robin
    for (let i = 0; i < playerCount; i++) {
      for (let j = i + 1; j < playerCount; j++) {
        const player1 = players[i];
        const player2 = players[j];
        
        matches.push({
          id: `match_${currentMatchId}`,
          player1Id: player1.id,
          player2Id: player2.id,
          player1Name: player1.name,
          player2Name: player2.name,
          round: 1, // Round robin group stage
          matchNumber: currentMatchId,
          status: 'scheduled',
        });
        currentMatchId++;
      }
    }
    
    // Add playoff matches based on player count
    if (playerCount === 4) {
      // For 4 players: Top 2 go directly to final
      const final: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: 2,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: 'group_stage', // Special marker for group completion
        parentMatch2Id: 'group_stage',
      };
      matches.push(final);
    } else if (playerCount >= 6) {
      // For 6+ players: Top 4 go to semifinals, then final
      // Semifinal 1: 1st vs 4th
      const semi1: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: 2,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: 'group_stage',
        parentMatch2Id: 'group_stage',
      };
      matches.push(semi1);
      currentMatchId++;
      
      // Semifinal 2: 2nd vs 3rd
      const semi2: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: 2,
        matchNumber: 2,
        status: 'scheduled',
        parentMatch1Id: 'group_stage',
        parentMatch2Id: 'group_stage',
      };
      matches.push(semi2);
      currentMatchId++;
      
      // Final: Winner of semi1 vs Winner of semi2
      const final: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: 3,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: semi1.id,
        parentMatch2Id: semi2.id,
      };
      matches.push(final);
      
      // Set next match references
      semi1.nextMatchId = final.id;
      semi2.nextMatchId = final.id;
    }
    
    return matches;
  }

  /**
   * Advance winner to next match in single elimination
   */
  static advanceWinner(matches: BracketMatch[], completedMatchId: string, winnerId: string): BracketMatch[] {
    const updatedMatches = [...matches];
    const completedMatch = updatedMatches.find(m => m.id === completedMatchId);
    
    if (!completedMatch) return matches;
    
    // Mark match as completed
    completedMatch.status = 'completed';
    completedMatch.winnerId = winnerId;
    
    // Find next match and advance winner
    if (completedMatch.nextMatchId) {
      const nextMatch = updatedMatches.find(m => m.id === completedMatch.nextMatchId);
      
      if (nextMatch) {
        // Determine if winner goes to player1 or player2 slot
        if (nextMatch.parentMatch1Id === completedMatchId) {
          nextMatch.player1Id = winnerId;
          nextMatch.player1Name = completedMatch.winnerId === completedMatch.player1Id ? 
            completedMatch.player1Name : completedMatch.player2Name;
        } else if (nextMatch.parentMatch2Id === completedMatchId) {
          nextMatch.player2Id = winnerId;
          nextMatch.player2Name = completedMatch.winnerId === completedMatch.player1Id ? 
            completedMatch.player1Name : completedMatch.player2Name;
        }
        
        // If both players are set, match is ready to play
        if (nextMatch.player1Id && nextMatch.player2Id) {
          nextMatch.status = 'scheduled';
        }
      }
    }
    
    return updatedMatches;
  }

  /**
   * Get matches for a specific round
   */
  static getMatchesForRound(matches: BracketMatch[], round: number): BracketMatch[] {
    return matches.filter(m => m.round === round);
  }

  /**
   * Get tournament progress (percentage completed)
   */
  static getTournamentProgress(matches: BracketMatch[]): number {
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    return matches.length > 0 ? (completedMatches / matches.length) * 100 : 0;
  }

  /**
   * Check if tournament is complete
   */
  static isTournamentComplete(matches: BracketMatch[]): boolean {
    return matches.every(m => m.status === 'completed');
  }

  /**
   * Get tournament winner (for single elimination)
   */
  static getTournamentWinner(matches: BracketMatch[]): string | null {
    if (!this.isTournamentComplete(matches)) return null;
    
    // Winner is the winner of the final match (highest round)
    const maxRound = Math.max(...matches.map(m => m.round));
    const finalMatch = matches.find(m => m.round === maxRound);
    
    return finalMatch?.winnerId || null;
  }

  /**
   * Get round robin standings with match wins and set difference
   */
  static getRoundRobinStandings(matches: BracketMatch[], players: Player[]): Array<{
    player: Player;
    matchWins: number;
    matchLosses: number;
    setWins: number;
    setLosses: number;
    setDifference: number;
    winPercentage: number;
  }> {
    const standings = players.map(player => ({
      player,
      matchWins: 0,
      matchLosses: 0,
      setWins: 0,
      setLosses: 0,
      setDifference: 0,
      winPercentage: 0,
    }));

    matches.filter(m => m.status === 'completed' && m.round === 1).forEach(match => {
      const player1Standing = standings.find(s => s.player.id === match.player1Id);
      const player2Standing = standings.find(s => s.player.id === match.player2Id);
      
      if (player1Standing && player2Standing) {
        const player1Sets = match.player1Sets || 0;
        const player2Sets = match.player2Sets || 0;
        
        // Add set wins/losses for both players
        player1Standing.setWins += player1Sets;
        player1Standing.setLosses += player2Sets;
        player2Standing.setWins += player2Sets;
        player2Standing.setLosses += player1Sets;
        
        // Add match win/loss
        if (match.winnerId === match.player1Id) {
          player1Standing.matchWins++;
          player2Standing.matchLosses++;
        } else if (match.winnerId === match.player2Id) {
          player2Standing.matchWins++;
          player1Standing.matchLosses++;
        }
      }
    });

    // Calculate set difference and win percentage
    standings.forEach(standing => {
      standing.setDifference = standing.setWins - standing.setLosses;
      const totalMatches = standing.matchWins + standing.matchLosses;
      standing.winPercentage = totalMatches > 0 ? (standing.matchWins / totalMatches) * 100 : 0;
    });

    // Sort by: 1) Match wins, 2) Set difference, 3) Set wins
    return standings.sort((a, b) => {
      if (a.matchWins !== b.matchWins) return b.matchWins - a.matchWins;
      if (a.setDifference !== b.setDifference) return b.setDifference - a.setDifference;
      return b.setWins - a.setWins;
    });
  }

  /**
   * Check if round robin group stage is complete and seed playoffs
   */
  static seedRoundRobinPlayoffs(matches: BracketMatch[], players: Player[]): BracketMatch[] {
    const updatedMatches = [...matches];
    
    // Check if all group stage matches (round 1) are complete
    const groupMatches = matches.filter(m => m.round === 1);
    const completedGroupMatches = groupMatches.filter(m => m.status === 'completed');
    
    if (completedGroupMatches.length === groupMatches.length && players.length >= 4) {
      // Get final standings
      const standings = this.getRoundRobinStandings(matches, players);
      
      if (players.length === 4) {
        // For 4 players: Top 2 go directly to final
        const final = updatedMatches.find(m => m.round === 2 && m.matchNumber === 1);
        
        if (final && standings.length >= 2) {
          final.player1Id = standings[0].player.id;
          final.player1Name = standings[0].player.name;
          final.player2Id = standings[1].player.id;
          final.player2Name = standings[1].player.name;
          final.status = 'scheduled';
        }
      } else {
        // For 6+ players: Seed semifinals
        const semi1 = updatedMatches.find(m => m.round === 2 && m.matchNumber === 1);
        const semi2 = updatedMatches.find(m => m.round === 2 && m.matchNumber === 2);
        
        if (semi1 && semi2 && standings.length >= 4) {
          // Semi 1: 1st vs 4th
          semi1.player1Id = standings[0].player.id;
          semi1.player1Name = standings[0].player.name;
          semi1.player2Id = standings[3].player.id;
          semi1.player2Name = standings[3].player.name;
          semi1.status = 'scheduled';
          
          // Semi 2: 2nd vs 3rd
          semi2.player1Id = standings[1].player.id;
          semi2.player1Name = standings[1].player.name;
          semi2.player2Id = standings[2].player.id;
          semi2.player2Name = standings[2].player.name;
          semi2.status = 'scheduled';
        }
      }
    }
    
    return updatedMatches;
  }
}