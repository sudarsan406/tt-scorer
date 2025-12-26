# Changelog

All notable changes to TT Scorer will be documented in this file.

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

### Added
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

### Fixed
- **Export Functionality**: Resolved critical export failures
  - Fixed method name mismatch in tournament export calls
  - Corrected winner calculation to show actual match winner instead of always showing player 1
  - Export now includes complete match results, not just schedules
- **Statistics Page Ratings**: Player Elo ratings now display and update correctly
  - Added eloRating field to PlayerStatistics interface
  - Updated database queries to include current ratings
  - Changed ranking sort order to prioritize Elo rating over win percentage
- **CSV Format Issues**: Fixed viewing problems on mobile devices
  - Removed colons from CSV labels to prevent empty column rendering on iPhone
  - Eliminated visual separators (dashes) for cleaner mobile viewing
  - Improved data organization with consolidated columns

### Changed
- Player rankings now prioritize Elo rating as the primary sorting criterion
- Tournament standings calculation uses match wins as primary metric (not win percentage)
- Round Robin playoff behavior is now explicitly user-controlled rather than automatic
- CSV export format streamlined from 8 columns to 5 for both standings and matches

### Technical Improvements
- Added `hasPlayoffs` field to Tournament data model
- Added `eloRating` field to PlayerStatistics interface
- Enhanced database validation for tournament deletion
- Updated bracket generators to support optional playoff configurations
- Improved TypeScript type safety across statistics components

### Removed
- App Store submission documentation files (6 files, ~54KB total):
  - APPEAL_RESPONSE_DRAFT.md
  - APP_STORE_DEPLOYMENT.md
  - APP_STORE_METADATA.md
  - NEXT_STEPS.md
  - SCREENSHOT_CHECKLIST.md
  - SCREENSHOT_GUIDE.md

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
