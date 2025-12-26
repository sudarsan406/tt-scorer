# Changelog

All notable changes to TT Scorer will be documented in this file.

## [1.3.7] - 2025-01-26

### Added
- **Comprehensive Test Suite**: Added 120+ functional tests for complete code coverage
  - Database service tests (player management, matches, tournaments, statistics)
  - Elo rating service tests (calculations, provisional players, score adjustments)
  - Bracket generator tests (single elimination, round robin, king of court)
  - End-to-end workflow tests (new player journey, tournament organization, statistics tracking)
  - Test infrastructure with Jest and React Native Testing Library
  - Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`

### Removed
- **Code Cleanup**: Removed 586 lines of unused code to improve maintainability
  - Deleted `errors/AppErrors.ts` - Custom error classes not being used
  - Deleted `validators/schemas.ts` - Zod validation schemas not being used
  - Removed unused constants from `constants/GameRules.ts` (VALIDATION_LIMITS, UI_CONFIG, STATISTICS_CONFIG)
  - Uninstalled `zod` dependency package
  - Cleaned up empty directories

### Improved
- Smaller bundle size and faster build times
- Reduced maintenance overhead
- Cleaner codebase with only actively used code
- Enhanced confidence in code quality with automated tests

## [1.3.6] - 2025-01-26

### Fixed
- **Critical: King of Court Tournament Completion**: Fixed infinite scheduling bug where tournaments never ended
  - Tournament now properly completes when a player reaches required consecutive wins (default: 3)
  - Added consecutive wins tracking algorithm to count win streaks accurately
  - Tournament status automatically updates to 'completed' when winner is determined
  - Winner is properly recorded in tournament results

### Technical Improvements
- Added `getConsecutiveWins()` helper method in BracketGenerator for win streak tracking
- Modified `suggestNextKingOfCourtMatch()` to accept `requiredWins` parameter and check completion condition
- Updated database service to mark tournament complete when no more matches needed
- Added `kingOfCourtWins` field to tournament loading query

## [1.3.5] - 2025-01-25

### Added
- **ITTF Standard Tiebreaker**: Implemented official ITTF tiebreaker rules for round robin standings
  - Point Difference now calculated as 4th tiebreaker criterion
  - Tracks total game points (e.g., 11-9, 11-7) across all sets
  - Complete ITTF order: Match Wins → Set Difference → Head-to-Head → Point Difference → Alphabetical

### Improved
- Standings now follow international table tennis federation (ITTF) standard rules
- More accurate tie resolution for competitive tournaments
- Info box updated to explain ITTF standard tiebreaker methodology
- Professional-grade ranking system for serious tournament organizers

## [1.3.4] - 2025-01-25

### Added
- **Playoff Round Labels**: Round robin playoffs now show proper labels ("Final", "Semifinals") instead of generic match numbers
- **Group Stage Separation**: Clear visual separation between group stage and playoff rounds
- **Head-to-Head Tiebreaker**: Added head-to-head result as 4th criterion for breaking ties in standings
  - Tiebreaker order: Match Wins → Set Difference → Total Set Wins → Head-to-Head → Alphabetical

### Improved
- Playoff matches now clearly labeled as "Final" or "Semifinals" for better clarity
- Group stage shows round count when multiple rounds are configured
- Standings info box updated to explain all tiebreaker criteria including head-to-head

## [1.3.3] - 2025-01-25

### Fixed
- **Critical: Playoff Finals Player Display**: Fixed issue where playoff final matches showed "TBD vs TBD" even after all group stage matches completed
  - Player names now properly populate in final matches after group stage completion
  - Applies to all round robin tournaments with playoffs enabled (singles and doubles)
  - Works for both new and existing tournaments

## [1.3.2] - 2025-01-25

### Fixed
- **Critical: Round Robin Playoff Finals**: Fixed issue where final matches could not be started in 3 and 5 player tournaments with playoffs enabled
  - Finals now properly seed with top 2 players from group stage standings
  - Removed player count restriction that was preventing playoff seeding for 3 and 5 player tournaments
  - Affects both singles and doubles round robin tournaments

## [1.3.1] - 2025-01-25

### Added - User Features
- **Tournament Standings Tab**: New dedicated standings view for all tournament formats with real-time rankings
  - Primary ranking by match wins
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
- **Testing Infrastructure**: Integrated Jest and React Native Testing Library
  - Added testing dependencies and configuration
  - Foundation for future test coverage improvements
  - Ensures code quality through automated testing
- **Centralized Constants**: Created GameRules configuration module
  - Extracted all magic numbers to constants/GameRules.ts
  - Includes ELO_CONFIG, MATCH_CONFIG, TOURNAMENT_CONFIG, STATISTICS_CONFIG, UI_CONFIG, VALIDATION_LIMITS
  - Improves maintainability and consistency
- **Comprehensive Error Classes**: Implemented structured error handling
  - Created custom error classes in errors/AppErrors.ts
  - Specific error types: PlayerError, MatchError, TournamentError, ValidationError, ExportError
  - Error codes and contextual details for better debugging
- **Input Validation with Zod**: Added runtime type validation
  - Implemented Zod schemas in validators/schemas.ts
  - Validates player, match, and tournament creation
  - Prevents invalid data from reaching the database

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
