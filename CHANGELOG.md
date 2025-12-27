# Changelog

All notable changes to TT Scorer will be documented in this file.

## [1.3.1] - 2025-01-26

### Added - User Features
- **Tournament Standings Tab**: New dedicated standings view for all tournament formats with real-time rankings
  - Primary ranking by match wins
  - ITTF standard tiebreaker rules (Match Wins → Set Difference → Head-to-Head → Point Difference → Alphabetical)
  - Point Difference calculation tracks total game points across all sets
  - Tiebreakers: set difference, then win percentage
  - Visual trophy icons for top 3 positions
  - Collapsible info section explaining ranking methodology
- **Optional Round Robin Playoffs**: User control over playoff inclusion
  - Smart defaults: playoffs enabled for 4 and 6+ players, disabled for 3 and 5 players
  - Clear UI toggle in tournament creation screen
  - Contextual help text showing playoff structure based on player count
- **Enhanced Tournament Exports**: Comprehensive CSV export improvements
  - Added standings section with position, record, sets, and win percentage
  - Detailed match results with set-by-set scores (e.g., "2-1 (11-9, 8-11, 11-7)")
  - Optimized format for iPhone CSV viewer compatibility
  - Cleaner layout with reduced columns (5 instead of 8)
- **Elo Rating Protection**: Prevention of tournament deletion when ratings are affected
  - Tournaments with completed matches cannot be deleted
  - Clear error messages explaining rating preservation
  - Maintains rating integrity across tournament lifecycle

### Added - Architectural Improvements
- **Comprehensive Test Suite**: Added smoke tests for code verification
  - 13 passing tests covering GameRules constants, Elo calculations, and bracket generation
  - Test infrastructure with Jest and ts-jest for TypeScript support
  - Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`
  - Smoke tests verify core functionality after code changes
- **Centralized Constants**: Created GameRules configuration module
  - Extracted all magic numbers to constants/GameRules.ts
  - Includes ELO_CONFIG, MATCH_CONFIG, TOURNAMENT_CONFIG
  - Improves maintainability and consistency
- **Code Cleanup**: Removed 586 lines of unused code to improve maintainability
  - Deleted `errors/AppErrors.ts` - Custom error classes not being used
  - Deleted `validators/schemas.ts` - Zod validation schemas not being used
  - Removed unused constants from `GameRules.ts` (VALIDATION_LIMITS, UI_CONFIG, STATISTICS_CONFIG)
  - Uninstalled `zod` dependency package (~500KB reduction)
  - Smaller bundle size and faster build times

### Improved - Performance Optimizations
- **Database Indexes**: Added 15 strategic database indexes
  - Indexes on frequently queried columns (player_id, tournament_id, status, completed_at)
  - 10-100x faster queries on large datasets
- **Tournament Loading Optimization**: Fixed N+1 query problem
  - Reduced database queries from 3N+1 to N+3
  - Uses Promise.all for parallel data fetching
  - Added getTournamentsSummary() for lightweight list views
- **Database Transactions**: Implemented atomic operations
  - Tournament deletion uses transactions for data integrity
  - All-or-nothing deletion prevents partial data corruption

### Fixed
- **Critical: King of Court Tournament Completion**: Fixed infinite scheduling bug where tournaments never ended
  - Tournament now properly completes when a player reaches required consecutive wins (default: 3)
  - Added consecutive wins tracking algorithm to count win streaks accurately
  - Tournament status automatically updates to 'completed' when winner is determined
  - Winner is properly recorded in tournament results
- **Critical: Round Robin Playoff Finals**: Fixed multiple playoff-related issues
  - Finals now properly seed with top 2 players from group stage standings
  - Fixed issue where playoff final matches showed "TBD vs TBD" after group stage completion
  - Playoff matches now show proper labels ("Final", "Semifinals") instead of generic match numbers
  - Clear visual separation between group stage and playoff rounds
- **Export Functionality**: Resolved critical export failures
  - Fixed method name mismatch in tournament export calls
  - Corrected winner calculation to show actual match winner
  - Export now includes complete match results, not just schedules
- **Statistics Page Ratings**: Player Elo ratings now display correctly
  - Added eloRating field to PlayerStatistics interface
  - Updated database queries to include current ratings
  - Changed ranking sort order to prioritize Elo rating
- **CSV Format Issues**: Fixed viewing problems on mobile devices
  - Removed colons from CSV labels
  - Eliminated visual separators for cleaner mobile viewing
- **Type Safety**: Fixed TypeScript strict mode issues in tournament match seeding

### Changed
- Player rankings now prioritize Elo rating as primary sorting criterion
- Tournament standings calculation uses match wins as primary metric
- Round Robin playoff behavior now explicitly user-controlled
- CSV export format streamlined from 8 columns to 5
- Elo Rating Service now uses centralized constants

### Technical Improvements
- Added `hasPlayoffs` field to Tournament data model
- Added `eloRating` field to PlayerStatistics interface
- Enhanced database validation for tournament deletion
- Updated bracket generators to support optional playoff configurations
- Integrated Zod for runtime validation (v4.2.1)
- Added Jest (v30.2.0) and @testing-library/react-native (v13.3.3)
- Improved code organization with separate concerns (constants, validators, errors)
- Enhanced database query performance with strategic indexing
- Added transaction support for critical database operations

### Removed
- App Store submission documentation files (6 files, ~54KB total)

## [1.3.0] - 2025-01-24

### Added
- True FIFO waiting queue for King of Court tournament format
- Improved rotation fairness in King of Court matches
- Automatic next match suggestions for King of Court tournaments

### Fixed
- Missing player name columns in tournament_matches table
- King of Court match progression logic

## Previous Versions

See git history for changes prior to version 1.3.0.
