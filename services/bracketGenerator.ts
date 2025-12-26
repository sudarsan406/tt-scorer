import { Player, Match } from '../types/models';

export interface DoublesTeam {
  player1: Player;
  player2: Player;
  teamName?: string;
}

export interface BracketMatch {
  id: string;
  player1Id?: string;
  player2Id?: string;
  player1Name?: string;
  player2Name?: string;
  // For doubles support
  player3Id?: string; // Team 1 partner
  player4Id?: string; // Team 2 partner
  player3Name?: string;
  player4Name?: string;
  team1Name?: string; // Custom team name (optional)
  team2Name?: string; // Custom team name (optional)
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
   * Generate Single Elimination bracket for singles
   */
  static generateSingleElimination(players: Player[]): BracketMatch[] {
    const playerCount = players.length;
    const validSizes = [4, 8, 16, 32];

    if (!validSizes.includes(playerCount)) {
      throw new Error(`Single elimination requires ${validSizes.join(', ')} players`);
    }

    // Shuffle players for random seeding
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    const matches: BracketMatch[] = [];
    const totalMatches = playerCount - 1; // Always n-1 matches in single elimination
    let currentMatchId = 1;
    let globalMatchNumber = 1; // Global match number counter

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
        matchNumber: globalMatchNumber++, // Use global counter
        status: 'scheduled',
      });
      currentMatchId++;
    }

    // Generate subsequent rounds
    let previousRoundMatches = firstRoundMatches;
    for (let round = 2; round <= rounds; round++) {
      const currentRoundMatches = previousRoundMatches / 2;

      for (let i = 0; i < currentRoundMatches; i++) {
        // Find parent matches by looking for the correct indices within the round
        const roundMatches = matches.filter(m => m.round === round - 1);
        const parentMatch1 = roundMatches[i * 2];
        const parentMatch2 = roundMatches[i * 2 + 1];

        const match: BracketMatch = {
          id: `match_${currentMatchId}`,
          round,
          matchNumber: globalMatchNumber++, // Use global counter
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
   * Generate Single Elimination bracket for doubles
   */
  static generateSingleEliminationDoubles(teams: DoublesTeam[]): BracketMatch[] {
    const teamCount = teams.length;
    const validSizes = [4, 8, 16, 32];

    if (!validSizes.includes(teamCount)) {
      throw new Error(`Single elimination requires ${validSizes.join(', ')} teams`);
    }

    // Shuffle teams for random seeding
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    const matches: BracketMatch[] = [];
    let currentMatchId = 1;

    // Calculate number of rounds
    const rounds = Math.log2(teamCount);

    // Generate first round matches
    const firstRoundMatches = teamCount / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
      const team1 = shuffledTeams[i * 2];
      const team2 = shuffledTeams[i * 2 + 1];

      matches.push({
        id: `match_${currentMatchId}`,
        player1Id: team1.player1.id,
        player2Id: team2.player1.id,
        player3Id: team1.player2.id,
        player4Id: team2.player2.id,
        player1Name: team1.player1.name,
        player2Name: team2.player1.name,
        player3Name: team1.player2.name,
        player4Name: team2.player2.name,
        team1Name: team1.teamName || `${team1.player1.name} / ${team1.player2.name}`,
        team2Name: team2.teamName || `${team2.player1.name} / ${team2.player2.name}`,
        round: 1,
        matchNumber: i + 1,
        status: 'scheduled',
      });
      currentMatchId++;
    }

    // Generate subsequent rounds (same structure as singles, just tracking teams)
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
   * Generate Round Robin schedule with optional playoffs (supports multiple rounds)
   */
  static generateRoundRobin(players: Player[], rounds: number = 1, hasPlayoffs?: boolean): BracketMatch[] {
    const playerCount = players.length;

    if (playerCount < 3) {
      throw new Error('Round robin requires at least 3 players');
    }

    const matches: BracketMatch[] = [];
    let currentMatchId = 1;

    // Generate all possible pairings for round robin, repeated for each round
    for (let roundNum = 1; roundNum <= rounds; roundNum++) {
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
            round: roundNum, // Round robin group stage (can be multiple rounds now)
            matchNumber: currentMatchId,
            status: 'scheduled',
          });
          currentMatchId++;
        }
      }
    }

    // Determine if we should add playoffs
    // If hasPlayoffs is undefined, use smart defaults based on player count
    const shouldHavePlayoffs = hasPlayoffs ?? (playerCount === 4 || playerCount >= 6);

    if (!shouldHavePlayoffs) {
      // No playoffs - group stage winner is tournament champion
      return matches;
    }

    // Add playoff matches based on player count
    // Playoffs start after all group stage rounds
    const playoffRoundStart = rounds + 1;

    if (playerCount === 4) {
      // For 4 players: Top 2 go directly to final
      const final: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: playoffRoundStart,
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
        round: playoffRoundStart,
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
        round: playoffRoundStart,
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
        round: playoffRoundStart + 1,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: semi1.id,
        parentMatch2Id: semi2.id,
      };
      matches.push(final);

      // Set next match references
      semi1.nextMatchId = final.id;
      semi2.nextMatchId = final.id;
    } else {
      // For 3 or 5 players with playoffs enabled, create top 2 final
      const final: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: playoffRoundStart,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: 'group_stage',
        parentMatch2Id: 'group_stage',
      };
      matches.push(final);
    }

    return matches;
  }

  /**
   * Generate Round Robin schedule for doubles with optional playoffs
   */
  static generateRoundRobinDoubles(teams: DoublesTeam[], rounds: number = 1, hasPlayoffs?: boolean): BracketMatch[] {
    const teamCount = teams.length;

    if (teamCount < 3) {
      throw new Error('Round robin requires at least 3 teams');
    }

    const matches: BracketMatch[] = [];
    let currentMatchId = 1;

    // Generate all possible team pairings for round robin, repeated for each round
    for (let roundNum = 1; roundNum <= rounds; roundNum++) {
      for (let i = 0; i < teamCount; i++) {
        for (let j = i + 1; j < teamCount; j++) {
          const team1 = teams[i];
          const team2 = teams[j];

          matches.push({
            id: `match_${currentMatchId}`,
            player1Id: team1.player1.id,
            player2Id: team2.player1.id,
            player3Id: team1.player2.id,
            player4Id: team2.player2.id,
            player1Name: team1.player1.name,
            player2Name: team2.player1.name,
            player3Name: team1.player2.name,
            player4Name: team2.player2.name,
            team1Name: team1.teamName || `${team1.player1.name} / ${team1.player2.name}`,
            team2Name: team2.teamName || `${team2.player1.name} / ${team2.player2.name}`,
            round: roundNum,
            matchNumber: currentMatchId,
            status: 'scheduled',
          });
          currentMatchId++;
        }
      }
    }

    // Determine if we should add playoffs
    const shouldHavePlayoffs = hasPlayoffs ?? (teamCount === 4 || teamCount >= 6);

    if (!shouldHavePlayoffs) {
      // No playoffs - group stage winner is tournament champion
      return matches;
    }

    // Add playoff matches based on team count
    const playoffRoundStart = rounds + 1;

    if (teamCount === 4) {
      // For 4 teams: Top 2 go directly to final
      const final: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: playoffRoundStart,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: 'group_stage',
        parentMatch2Id: 'group_stage',
      };
      matches.push(final);
    } else if (teamCount >= 6) {
      // For 6+ teams: Top 4 go to semifinals, then final
      const semi1: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: playoffRoundStart,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: 'group_stage',
        parentMatch2Id: 'group_stage',
      };
      matches.push(semi1);
      currentMatchId++;

      const semi2: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: playoffRoundStart,
        matchNumber: 2,
        status: 'scheduled',
        parentMatch1Id: 'group_stage',
        parentMatch2Id: 'group_stage',
      };
      matches.push(semi2);
      currentMatchId++;

      const final: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: playoffRoundStart + 1,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: semi1.id,
        parentMatch2Id: semi2.id,
      };
      matches.push(final);

      semi1.nextMatchId = final.id;
      semi2.nextMatchId = final.id;
    } else {
      // For 3 or 5 teams with playoffs enabled, create top 2 final
      const final: BracketMatch = {
        id: `match_${currentMatchId}`,
        round: playoffRoundStart,
        matchNumber: 1,
        status: 'scheduled',
        parentMatch1Id: 'group_stage',
        parentMatch2Id: 'group_stage',
      };
      matches.push(final);
    }

    return matches;
  }

  /**
   * Advance winner to next match in single elimination (supports singles and doubles)
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
        // Check if this is a doubles match
        const isDoubles = !!(completedMatch.player3Id && completedMatch.player4Id);

        // Determine if winner goes to player1/team1 or player2/team2 slot
        if (nextMatch.parentMatch1Id === completedMatchId) {
          nextMatch.player1Id = winnerId;
          const isTeam1Winner = winnerId === completedMatch.player1Id;
          nextMatch.player1Name = isTeam1Winner ? completedMatch.player1Name : completedMatch.player2Name;

          if (isDoubles) {
            // For doubles, also copy partner and team name
            nextMatch.player3Id = isTeam1Winner ? completedMatch.player3Id : completedMatch.player4Id;
            nextMatch.player3Name = isTeam1Winner ? completedMatch.player3Name : completedMatch.player4Name;
            nextMatch.team1Name = isTeam1Winner ? completedMatch.team1Name : completedMatch.team2Name;
          }
        } else if (nextMatch.parentMatch2Id === completedMatchId) {
          nextMatch.player2Id = winnerId;
          const isTeam1Winner = winnerId === completedMatch.player1Id;
          nextMatch.player2Name = isTeam1Winner ? completedMatch.player1Name : completedMatch.player2Name;

          if (isDoubles) {
            // For doubles, also copy partner and team name
            nextMatch.player4Id = isTeam1Winner ? completedMatch.player3Id : completedMatch.player4Id;
            nextMatch.player4Name = isTeam1Winner ? completedMatch.player3Name : completedMatch.player4Name;
            nextMatch.team2Name = isTeam1Winner ? completedMatch.team1Name : completedMatch.team2Name;
          }
        }

        // Check if match is ready (both sides filled)
        const isNextMatchReady = isDoubles
          ? (nextMatch.player1Id && nextMatch.player2Id && nextMatch.player3Id && nextMatch.player4Id)
          : (nextMatch.player1Id && nextMatch.player2Id);

        if (isNextMatchReady) {
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
   * Generate King of the Court format
   * This is a flexible format where any number of players can participate
   * Creates one initial match randomly, then matches are added dynamically
   */
  static generateKingOfCourt(players: Player[]): BracketMatch[] {
    const playerCount = players.length;

    if (playerCount < 3) {
      throw new Error('King of the Court requires at least 3 players');
    }

    // Shuffle players for random selection
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Create the first match with two random players
    const matches: BracketMatch[] = [{
      id: 'match_1',
      player1Id: shuffledPlayers[0].id,
      player2Id: shuffledPlayers[1].id,
      player1Name: shuffledPlayers[0].name,
      player2Name: shuffledPlayers[1].name,
      round: 1,
      matchNumber: 1,
      status: 'scheduled',
    }];

    // Additional matches will be created dynamically as the tournament progresses
    return matches;
  }

  /**
   * Generate King of the Court format for doubles
   * Creates one initial match randomly, then matches are added dynamically
   */
  static generateKingOfCourtDoubles(teams: DoublesTeam[]): BracketMatch[] {
    const teamCount = teams.length;

    if (teamCount < 3) {
      throw new Error('King of the Court requires at least 3 teams');
    }

    // Shuffle teams for random selection
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    // Create the first match with two random teams
    const team1 = shuffledTeams[0];
    const team2 = shuffledTeams[1];

    const matches: BracketMatch[] = [{
      id: 'match_1',
      player1Id: team1.player1.id,
      player2Id: team2.player1.id,
      player3Id: team1.player2.id,
      player4Id: team2.player2.id,
      player1Name: team1.player1.name,
      player2Name: team2.player1.name,
      player3Name: team1.player2.name,
      player4Name: team2.player2.name,
      team1Name: team1.teamName || `${team1.player1.name} / ${team1.player2.name}`,
      team2Name: team2.teamName || `${team2.player1.name} / ${team2.player2.name}`,
      round: 1,
      matchNumber: 1,
      status: 'scheduled',
    }];

    // Additional matches will be created dynamically as the tournament progresses
    return matches;
  }

  /**
   * Get King of Court standings
   * Tracks individual match wins for each player
   * Used to determine who has won the most "games" (first to X match wins)
   */
  static getKingOfCourtStandings(matches: BracketMatch[], players: Player[]): Array<{
    player: Player;
    matchWins: number;
    matchLosses: number;
    matchesPlayed: number;
    gamesWon: number; // Number of "games" claimed (if using game tracking)
  }> {
    const standings = players.map(player => ({
      player,
      matchWins: 0,
      matchLosses: 0,
      matchesPlayed: 0,
      gamesWon: 0,
    }));

    // Count wins and losses from completed matches
    matches.filter(m => m.status === 'completed').forEach(match => {
      const player1Standing = standings.find(s => s.player.id === match.player1Id);
      const player2Standing = standings.find(s => s.player.id === match.player2Id);

      if (player1Standing && player2Standing) {
        player1Standing.matchesPlayed++;
        player2Standing.matchesPlayed++;

        if (match.winnerId === match.player1Id) {
          player1Standing.matchWins++;
          player2Standing.matchLosses++;
        } else if (match.winnerId === match.player2Id) {
          player2Standing.matchWins++;
          player1Standing.matchLosses++;
        }
      }
    });

    // Sort by match wins (descending)
    return standings.sort((a, b) => b.matchWins - a.matchWins);
  }

  /**
   * Suggest next King of Court match
   * Winner stays on court, next challenger is selected based on FIFO waiting queue:
   * 1. Players who haven't played yet (highest priority)
   * 2. Player who has been waiting longest (FIFO queue)
   * 3. Recent loser only after ALL other players have had their turn
   */
  static suggestNextKingOfCourtMatch(
    matches: BracketMatch[],
    players: Player[],
    completedMatchId: string
  ): BracketMatch | null {
    const completedMatch = matches.find(m => m.id === completedMatchId);
    if (!completedMatch || !completedMatch.winnerId) {
      return null;
    }

    // Winner stays on court
    const winner = players.find(p => p.id === completedMatch.winnerId);
    if (!winner) return null;

    // Identify the recent loser
    const recentLoserId = completedMatch.player1Id === completedMatch.winnerId
      ? completedMatch.player2Id
      : completedMatch.player1Id;

    // Sort matches by match number to get chronological order
    const completedMatches = matches
      .filter(m => m.status === 'completed')
      .sort((a, b) => a.matchNumber - b.matchNumber);

    // Build waiting queue based on when each player last played
    const playerLastMatchIndex = new Map<string, number>();

    completedMatches.forEach((match, index) => {
      if (match.player1Id) playerLastMatchIndex.set(match.player1Id, index);
      if (match.player2Id) playerLastMatchIndex.set(match.player2Id, index);
    });

    // Separate players into categories
    const unplayedPlayers = players.filter(p =>
      p.id !== completedMatch.winnerId && !playerLastMatchIndex.has(p.id)
    );

    const waitingPlayers = players.filter(p =>
      p.id !== completedMatch.winnerId &&
      p.id !== recentLoserId &&
      playerLastMatchIndex.has(p.id)
    );

    // Priority 1: Players who haven't played yet
    if (unplayedPlayers.length > 0) {
      // Randomly pick one if multiple unplayed players
      const challenger = unplayedPlayers[Math.floor(Math.random() * unplayedPlayers.length)];

      const nextMatchNumber = Math.max(...matches.map(m => m.matchNumber), 0) + 1;
      return {
        id: `match_${nextMatchNumber}`,
        player1Id: winner.id,
        player2Id: challenger.id,
        player1Name: winner.name,
        player2Name: challenger.name,
        round: 1,
        matchNumber: nextMatchNumber,
        status: 'scheduled',
      };
    }

    // Priority 2: Player who has been waiting longest (FIFO queue)
    if (waitingPlayers.length > 0) {
      // Sort by last match index (ascending) - oldest match = been waiting longest
      waitingPlayers.sort((a, b) => {
        const aLastMatch = playerLastMatchIndex.get(a.id) ?? -1;
        const bLastMatch = playerLastMatchIndex.get(b.id) ?? -1;
        return aLastMatch - bLastMatch;
      });

      // Select the player who has been waiting the longest
      const challenger = waitingPlayers[0];

      const nextMatchNumber = Math.max(...matches.map(m => m.matchNumber), 0) + 1;
      return {
        id: `match_${nextMatchNumber}`,
        player1Id: winner.id,
        player2Id: challenger.id,
        player1Name: winner.name,
        player2Name: challenger.name,
        round: 1,
        matchNumber: nextMatchNumber,
        status: 'scheduled',
      };
    }

    // Priority 3: Recent loser (only when no other players available)
    const recentLoser = players.find(p => p.id === recentLoserId);
    if (recentLoser) {
      const nextMatchNumber = Math.max(...matches.map(m => m.matchNumber), 0) + 1;
      return {
        id: `match_${nextMatchNumber}`,
        player1Id: winner.id,
        player2Id: recentLoser.id,
        player1Name: winner.name,
        player2Name: recentLoser.name,
        round: 1,
        matchNumber: nextMatchNumber,
        status: 'scheduled',
      };
    }

    return null;
  }

  /**
   * Get round robin standings with match wins and set difference (supports multiple rounds)
   */
  static getRoundRobinStandings(matches: BracketMatch[], players: Player[], roundRobinRounds: number = 1): Array<{
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

    // Filter for group stage matches only (rounds 1 through roundRobinRounds, excluding playoffs)
    matches.filter(m => m.status === 'completed' && m.round >= 1 && m.round <= roundRobinRounds).forEach(match => {
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

    // Sort by: 1) Match wins, 2) Set difference, 3) Set wins, 4) Head-to-head
    return standings.sort((a, b) => {
      if (a.matchWins !== b.matchWins) return b.matchWins - a.matchWins;
      if (a.setDifference !== b.setDifference) return b.setDifference - a.setDifference;
      if (a.setWins !== b.setWins) return b.setWins - a.setWins;

      // Head-to-head: Check if these two players played each other
      const h2hMatch = matches.find(m =>
        m.status === 'completed' &&
        m.round >= 1 && m.round <= roundRobinRounds &&
        ((m.player1Id === a.player.id && m.player2Id === b.player.id) ||
         (m.player1Id === b.player.id && m.player2Id === a.player.id))
      );

      if (h2hMatch) {
        // If a won the head-to-head, a ranks higher (return negative to put a before b)
        if (h2hMatch.winnerId === a.player.id) return -1;
        if (h2hMatch.winnerId === b.player.id) return 1;
      }

      // If all else is equal, maintain original order (by player name)
      return a.player.name.localeCompare(b.player.name);
    });
  }

  /**
   * Check if round robin group stage is complete and seed playoffs (supports multiple rounds)
   */
  static seedRoundRobinPlayoffs(matches: BracketMatch[], players: Player[], roundRobinRounds: number = 1): BracketMatch[] {
    const updatedMatches = [...matches];

    // Check if all group stage matches (rounds 1 through roundRobinRounds) are complete
    const groupMatches = matches.filter(m => m.round >= 1 && m.round <= roundRobinRounds);
    const completedGroupMatches = groupMatches.filter(m => m.status === 'completed');

    if (completedGroupMatches.length === groupMatches.length) {
      // Get final standings
      const standings = this.getRoundRobinStandings(matches, players, roundRobinRounds);

      // Playoff rounds start after group stage rounds
      const playoffRoundStart = roundRobinRounds + 1;

      if (players.length === 3 || players.length === 5) {
        // For 3 or 5 players with playoffs: Top 2 go to final
        const final = updatedMatches.find(m => m.round === playoffRoundStart && m.matchNumber === 1);

        if (final && standings.length >= 2) {
          final.player1Id = standings[0].player.id;
          final.player1Name = standings[0].player.name;
          final.player2Id = standings[1].player.id;
          final.player2Name = standings[1].player.name;
          final.status = 'scheduled';
        }
      } else if (players.length === 4) {
        // For 4 players: Top 2 go directly to final
        const final = updatedMatches.find(m => m.round === playoffRoundStart && m.matchNumber === 1);

        if (final && standings.length >= 2) {
          final.player1Id = standings[0].player.id;
          final.player1Name = standings[0].player.name;
          final.player2Id = standings[1].player.id;
          final.player2Name = standings[1].player.name;
          final.status = 'scheduled';
        }
      } else if (players.length >= 6) {
        // For 6+ players: Seed semifinals
        const semi1 = updatedMatches.find(m => m.round === playoffRoundStart && m.matchNumber === 1);
        const semi2 = updatedMatches.find(m => m.round === playoffRoundStart && m.matchNumber === 2);

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