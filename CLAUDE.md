# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TT Scorer is a React Native table tennis scoring application built with Expo, featuring tournament management, real-time scoring, and detailed statistics tracking with Elo ratings.

**Tech Stack:**
- React Native 0.81.4 with TypeScript (strict mode)
- Expo SDK ~54.0.0
- React Navigation 7 (bottom tabs + stack)
- SQLite (expo-sqlite) for local data persistence
- Jest + Testing Library for testing

**Bundle IDs:**
- iOS: `com.skanagala.ttscorer`
- Android: `com.skanagala.ttscorer`
- EAS Project: `22d038dc-1f57-4a70-8115-91a01c529b6d`

## Development Commands

### Running the App
```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run web version
```

### Testing
```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run test:e2e       # Run end-to-end tests only
npm run test:services  # Run service tests only
```

### Building & Deployment (EAS)
```bash
# Development builds
npx eas build --profile development --platform ios

# Preview builds (internal testing)
npx eas build --profile preview

# Production builds
npx eas build --profile production --platform ios
npx eas submit --platform ios  # Submit to App Store
```

### iOS Development
```bash
# Generate iOS native project (first time)
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Build with Xcode (after prebuild)
npx expo run:ios

# Clean build
rm -rf ios/Pods ios/Podfile.lock && cd ios && pod install && cd ..
```

Note: This project uses `use_modular_headers!` in the Podfile for Firebase compatibility.

## Architecture

### Data Flow Pattern
1. **DatabaseContext** provides database initialization state
2. **DatabaseService** (singleton) handles all SQLite operations
3. Screens consume database methods directly (no intermediate state management layer)
4. React Navigation manages screen navigation state

### Core Services

**DatabaseService** (`services/database.ts`)
- Singleton pattern with async initialization via `DatabaseContext`
- All database operations (CRUD for players, matches, tournaments, etc.)
- Statistics calculations (win/loss ratios, streaks, trending data)
- Schema migrations handled via `ALTER TABLE` with try-catch (idempotent)

**BracketGenerator** (`services/bracketGenerator.ts`)
- Generates single elimination brackets (4, 8, 16, 32 players)
- Generates round robin brackets (3+ players, 1-3 rounds)
- Supports both singles and doubles tournaments
- Returns `BracketMatch[]` with parent/child relationships

**EloRatingService** (`services/eloRating.ts`)
- Calculates Elo rating changes after matches
- Default rating: 1200, K-factor: 32 (50 for provisional players <10 games)
- Includes competitiveness multiplier based on set scores
- All configuration in `constants/GameRules.ts`

**ExportService** (`services/exportService.ts`)
- Exports match/tournament data to CSV
- Uses expo-file-system and expo-sharing

### Database Schema

**Key Tables:**
- `players` - Player profiles with Elo ratings
- `matches` - Match records with sets/scores, supports doubles (`is_doubles`, `team1_name`, `team2_name`)
- `sets` - Individual set scores within matches
- `tournaments` - Tournament metadata (`format`: 'single_elimination', 'round_robin')
- `tournament_matches` - Bracket structure with round/match numbers

**Important Notes:**
- All IDs are UUIDs generated with `uuid` package
- Dates stored as ISO strings, converted to `Date` objects in TypeScript
- Schema migrations use `ALTER TABLE` in try-catch blocks (idempotent for re-runs)

### Navigation Structure

**Tab Navigator** (5 tabs):
- Home - Quick actions, recent activity
- Players - Player list and management
- Matches - Match history
- Tournaments - Tournament list and creation
- Stats - Analytics dashboard

**Stack Screens** (modal/detail views):
- QuickMatchScreen - Create singles/doubles matches
- MatchScoringScreen - Real-time scoring interface
- TournamentCreateScreen - Tournament setup
- TournamentDetailScreen - Tournament management
- TournamentBracketScreen - Bracket visualization
- PlayerStatsScreen - Individual player analytics

### Key Type Definitions

Located in `types/models.ts`:
- `Player` - Player entity with optional Elo rating
- `Match` - Match entity with `bestOf`, sets, winner, doubles support
- `GameSet` - Individual set within a match
- `Tournament` - Tournament with format, dates, participant count
- `PlayerStatistics` - Win/loss ratios, streaks, averages
- `TrendingStats` - Time-series statistics (7d, 30d, 3m, 6m, 1y)

## Configuration Constants

**All magic numbers centralized in `constants/GameRules.ts`:**

```typescript
// Elo Configuration
ELO_CONFIG.DEFAULT_RATING = 1200
ELO_CONFIG.K_FACTOR = 32
ELO_CONFIG.K_FACTOR_PROVISIONAL = 50 (first 10 games)

// Match Configuration
MATCH_CONFIG.POINTS_TO_WIN_SET = 11
MATCH_CONFIG.WIN_BY_MARGIN = 2
MATCH_CONFIG.VALID_BEST_OF = [1, 3, 5, 7]

// Tournament Configuration
TOURNAMENT_CONFIG.VALID_SINGLE_ELIMINATION_SIZES = [4, 8, 16, 32]
TOURNAMENT_CONFIG.MIN_PLAYERS_ROUND_ROBIN = 3
TOURNAMENT_CONFIG.VALID_ROUND_ROBIN_ROUNDS = [1, 2, 3]
```

## Testing Guidelines

**Test Structure:**
- `__tests__/services/` - Unit tests for services (database, Elo, bracket generation)
- `__tests__/e2e/` - End-to-end workflow tests
- `__tests__/setup.ts` - Jest configuration and global test setup

**Running Single Test Files:**
```bash
jest __tests__/services/database.test.ts
jest __tests__/services/eloRating.test.ts
jest __tests__/services/bracketGenerator.test.ts
jest __tests__/e2e/userWorkflows.test.ts
```

**Test Configuration:**
- Preset: `ts-jest`
- Environment: `node` (for SQLite mocking)
- Coverage collected from `services/`, `screens/`, `components/`

## Common Development Patterns

### Adding a New Screen
1. Create screen component in `screens/`
2. Add route to `navigation/AppNavigator.tsx`
3. Update tab or stack navigator configuration
4. Add screen-specific types to `types/models.ts` if needed

### Modifying Database Schema
1. Add migration logic in `DatabaseService.createTables()`
2. Use try-catch around `ALTER TABLE` for idempotency
3. Update TypeScript types in `types/models.ts`
4. Update relevant queries in `DatabaseService`
5. Add tests in `__tests__/services/database.test.ts`

### Adding New Game Configuration
1. Update `constants/GameRules.ts` with new constants
2. Import and use constants in relevant services
3. Update validation logic if needed
4. Add tests for new configuration

### Working with Elo Ratings
- Use `EloRatingService.calculateNewRatings()` for basic calculation
- Use `EloRatingService.calculateNewRatingsWithScore()` for competitiveness-adjusted ratings
- Rating updates happen in `DatabaseService.updatePlayerRatingsAfterMatch()`
- All Elo configuration lives in `ELO_CONFIG`

## Important Implementation Notes

### Database Initialization
- Database must be initialized via `DatabaseContext` before use
- All screens wrapped in `DatabaseProvider` in `App.tsx`
- Check `useDatabaseContext().isReady` before database operations

### Doubles Match Support
- Matches have `isDoubles` boolean flag
- Doubles matches store 4 player IDs (player1Id, player2Id, player3Id, player4Id in bracket)
- Optional team names: `team1Name`, `team2Name`
- Currently Elo ratings only calculated for singles matches

### Tournament Bracket Generation
- Single elimination: Players shuffled for random seeding
- Round robin: Each player plays every other player once per round
- Bracket matches linked via `nextMatchId`, `parentMatch1Id`, `parentMatch2Id`
- Status progression: `scheduled` → `in_progress` → `completed`

### Statistics Calculation
- Statistics calculated on-demand from match data
- Trending stats use time periods: 7d, 30d, 3m, 6m, 1y
- Streaks calculated by checking consecutive match outcomes
- All statistics methods in `DatabaseService`

## Project-Specific Conventions

### Styling
- Primary color: `#2196F3` (blue)
- Tab navigation uses Ionicons
- Header background matches primary color
- No global theme provider - styles defined per component

### Error Handling
- Database errors logged to console with descriptive messages
- UI components should handle loading/error states
- Database operations wrapped in try-catch with user-friendly error returns

### Code Organization
- Services: Pure TypeScript classes with static methods or singletons
- Screens: React functional components with hooks
- No custom hooks directory - hooks defined inline or in contexts
- Types centralized in `types/models.ts`
