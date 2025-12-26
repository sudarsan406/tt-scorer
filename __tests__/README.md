# TT Scorer Test Suite

Comprehensive functional tests for the TT Scorer application.

## Test Structure

```
__tests__/
├── services/           # Service layer tests
│   ├── database.test.ts
│   ├── eloRating.test.ts
│   └── bracketGenerator.test.ts
├── e2e/               # End-to-end functional tests
│   └── userWorkflows.test.ts
└── README.md          # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run with coverage report
```bash
npm run test:coverage
```

### Run only service tests
```bash
npm run test:services
```

### Run only end-to-end tests
```bash
npm run test:e2e
```

## Test Coverage

### Service Layer Tests (120+ tests)

#### Database Service (`database.test.ts`)
- ✅ Player Management
  - Create, read, update, delete players
  - Player validation and constraints
  - Elo rating initialization
- ✅ Match Management
  - Match creation and scoring
  - Game set tracking
  - Match completion and Elo updates
- ✅ Tournament Management
  - Tournament creation (single elimination, round robin, king of court)
  - Participant management
  - Bracket generation
  - Tournament progression
  - Standings calculation
- ✅ Statistics & Analytics
  - Player statistics (all-time and period-based)
  - Trending statistics
  - Elo history tracking
  - Leaderboard generation

#### Elo Rating Service (`eloRating.test.ts`)
- ✅ Basic Elo Calculations
  - Expected score calculations
  - Rating adjustments for wins/losses
  - Underdog vs favorite scenarios
- ✅ Provisional Player Handling
  - Higher K-factor for new players
  - Transition to established rating
- ✅ Score-Based Adjustments
  - Dominant win bonuses
  - Close match adjustments
  - Competitiveness scoring
- ✅ Edge Cases
  - Rating boundaries (min/max)
  - Large rating differences
  - Rating conservation
- ✅ Round Robin Adjustments
  - Lower impact for group stage matches

#### Bracket Generator (`bracketGenerator.test.ts`)
- ✅ Single Elimination Tournaments
  - Bracket generation (4, 8, 16 players)
  - Parent/next match linking
  - Bye handling
- ✅ Round Robin Tournaments
  - All matchup generation
  - Multiple round support
  - Playoff integration
  - Standings calculation with ITTF tiebreakers
- ✅ King of Court Tournaments
  - Initial match generation
  - Next match suggestions
  - Consecutive win tracking
  - Tournament completion detection
- ✅ Edge Cases
  - Minimum player counts
  - Duplicate matchup prevention

### End-to-End Tests (`userWorkflows.test.ts`)

#### Complete User Workflows
- ✅ **New Player Journey**
  - Create player profile
  - Play first match
  - View updated ratings
  - Check match history
  - View statistics

- ✅ **Tournament Organization**
  - Create tournament
  - Add participants
  - Generate bracket
  - Play matches
  - Track progression
  - View standings

- ✅ **Statistics Tracking**
  - Play multiple matches
  - View overall stats
  - Check trending data
  - Review Elo history
  - Check leaderboard

- ✅ **Round Robin with Playoffs**
  - Complete group stage
  - Automatic playoff seeding
  - Final standings

## Test Best Practices

### Writing New Tests

1. **Descriptive test names**: Use clear, action-oriented descriptions
   ```typescript
   it('should update player rating after completing match', async () => {
     // ...
   });
   ```

2. **Arrange-Act-Assert pattern**:
   ```typescript
   it('should calculate Elo correctly', () => {
     // Arrange
     const rating1 = 1200;
     const rating2 = 1200;

     // Act
     const result = EloRatingService.calculateNewRatings(rating1, rating2, true);

     // Assert
     expect(result.player1NewRating).toBeGreaterThan(1200);
   });
   ```

3. **Test one thing per test**: Keep tests focused and atomic

4. **Use beforeAll/beforeEach for setup**: Avoid repetition

5. **Clean up after tests**: Ensure tests don't affect each other

### Coverage Goals

- **Target**: 80%+ code coverage
- **Critical paths**: 100% coverage
  - Elo calculations
  - Match completion
  - Tournament progression
  - Database operations

## Continuous Integration

Tests are run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Before deployment

## Debugging Tests

### Run a specific test file
```bash
npm test database.test.ts
```

### Run a specific test suite
```bash
npm test -- -t "Player Management"
```

### Run with verbose output
```bash
npm test -- --verbose
```

### Debug in VS Code
Add breakpoint and use "Jest: Debug" configuration

## Common Issues

### Database not initialized
```
Error: Database not initialized
```
**Solution**: Ensure `beforeAll` calls `databaseService.init()`

### SQLite errors
```
Error: table already exists
```
**Solution**: Tests use in-memory database, check for conflicts

### Timeout errors
```
Error: Timeout - Async callback was not invoked
```
**Solution**: Increase timeout or check for unresolved promises

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Check coverage hasn't decreased
4. Update this README if needed

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
