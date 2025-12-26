# Code Cleanup Analysis - TT Scorer

## Unused Files (Safe to Delete)

### 1. `errors/AppErrors.ts` (331 lines)
**Status:** ❌ **COMPLETELY UNUSED**

**Contains:**
- Custom error classes (AppError, DatabaseError, PlayerError, MatchError, etc.)
- Error type guards and utility functions
- Structured error handling system

**Why unused:**
- Not imported by any file in the codebase
- App currently uses basic `throw new Error()` and `Alert.alert()`
- No runtime error handling using these classes

**Recommendation:** **DELETE** (can be restored later if structured error handling is needed)

---

### 2. `validators/schemas.ts` (255 lines)
**Status:** ❌ **COMPLETELY UNUSED**

**Contains:**
- Zod validation schemas for Player, Match, Tournament
- Runtime type validation
- Helper validation functions

**Why unused:**
- Not imported by any file in the codebase
- App relies on TypeScript compile-time types only
- No runtime validation is performed

**Recommendation:** **DELETE** (can be restored later if runtime validation is needed)

**Dependencies to keep:**
- `zod` package in package.json can be removed as well

---

## Files with Minimal Usage (Consider Refactoring)

### 3. `contexts/DatabaseContext.tsx` (38 lines)
**Status:** ⚠️ **MINIMALLY USED**

**Used by:**
- `App.tsx` - wraps the app with DatabaseProvider
- `HomeScreen.tsx` - checks `isReady` and `error` states

**Consideration:**
- Provides database initialization status
- Could be simplified by moving init logic to App.tsx directly
- Not critical to remove, but adds layer of abstraction

**Recommendation:** **KEEP FOR NOW** (useful for tracking DB init state)

---

## Cleanup Summary

### Files to Delete:
1. ✅ `errors/AppErrors.ts` (331 lines)
2. ✅ `validators/schemas.ts` (255 lines)

### Dependencies to Remove:
- `zod` package (currently unused, ~500KB)

### Total Cleanup:
- **586 lines of unused code**
- **~500KB** in dependencies

### Impact:
- ✅ Smaller bundle size
- ✅ Faster build times
- ✅ Less maintenance overhead
- ✅ Cleaner codebase
- ⚠️ Loss of structured error handling (can restore if needed)
- ⚠️ Loss of runtime validation (can restore if needed)

---

## Recommended Actions

1. **Delete unused files:**
   ```bash
   rm errors/AppErrors.ts
   rm validators/schemas.ts
   ```

2. **Remove unused dependency:**
   ```bash
   npm uninstall zod
   ```

3. **Update CHANGELOG.md:**
   - Document code cleanup
   - Note removal of unused files

4. **Commit changes:**
   - Clear commit message explaining cleanup
   - Version bump to 1.3.7

---

## Future Considerations

### When to restore `AppErrors.ts`:
- When implementing centralized error logging
- When building error reporting/analytics
- When needing consistent error handling across the app

### When to restore `validators/schemas.ts`:
- When implementing API endpoints
- When accepting user input that needs validation
- When paranoid about runtime type safety

For now, these files are **not providing value** and can be safely removed.
