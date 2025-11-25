# Screenshot Creation Checklist - TT Scorer

## Current Status
✅ Simulator: iPhone 16 Pro Max is booted and ready
✅ Guides: All documentation created

---

## Step-by-Step Process

### STEP 1: Launch Your App on Simulator (5 minutes)

Open a new terminal and run:

```bash
cd /Users/skanagala/Documents/learn/mobile-apps/tt-scorer
npm start
```

Then press `i` to open on iOS simulator, or in another terminal:

```bash
npm run ios
```

Wait for the app to build and launch on the iPhone 16 Pro Max simulator.

**✓ Checkpoint:** You should see your TT Scorer app running on the simulator.

---

### STEP 2: Add Sample Players (5 minutes)

In the app on the simulator:

1. Navigate to **Players** tab (bottom navigation)
2. Tap the **"+"** or **"Add Player"** button
3. Add these players one by one:

**Player Names to Add:**
- Alex Chen
- Maria Garcia
- James Wilson
- Sarah Johnson
- David Kim
- Emma Brown
- Michael Lee
- Lisa Martinez

**Tip:** Just add names - the ELO ratings will be generated after matches.

**✓ Checkpoint:** You should have 8 players in your Players list.

---

### STEP 3: Create Sample Matches (15 minutes)

Now create matches between different players to generate statistics.

1. Go to **Home** tab
2. Tap **"Start Quick Match"** (or similar button)
3. Select 2 players
4. Play through the match by tapping points

**Matches to Create (suggested):**

**Match 1:** Alex Chen vs Maria Garcia
- Set 1: 11-9 (Alex wins)
- Set 2: 11-8 (Alex wins)
- Set 3: 11-7 (Alex wins)
- **Winner:** Alex Chen (3-0)

**Match 2:** James Wilson vs Sarah Johnson
- Set 1: 11-6 (James wins)
- Set 2: 9-11 (Sarah wins)
- Set 3: 11-8 (James wins)
- **Winner:** James Wilson (2-1)

**Match 3:** David Kim vs Emma Brown
- Set 1: 11-13 (Emma wins - deuce!)
- Set 2: 11-9 (David wins)
- Set 3: 8-11 (Emma wins)
- **Winner:** Emma Brown (2-1)

**Match 4:** Michael Lee vs Lisa Martinez
- Set 1: 11-5 (Michael wins)
- Set 2: 11-3 (Michael wins)
- **Winner:** Michael Lee (2-0)

**Match 5:** Alex Chen vs James Wilson
- Set 1: 11-9 (Alex wins)
- Set 2: 12-14 (James wins - deuce!)
- Set 3: 11-7 (Alex wins)
- **Winner:** Alex Chen (2-1)

**Quick Matches (for volume):**
Create 10-15 more matches between random players. You can make these faster by:
- Using quick scores (11-5, 11-3, etc.)
- Varying winners
- Creating some close matches and some blowouts

**Tip:** The more matches you create, the better your statistics and ELO rankings will look!

**✓ Checkpoint:** You should have 15-20 completed matches, and players should have different ELO ratings now.

---

### STEP 4: Create a Tournament (10 minutes)

1. Go to **Tournaments** tab
2. Tap **"Create Tournament"** (or "+")
3. **Tournament Settings:**
   - Name: "Club Championship 2025"
   - Format: **Single Elimination**
   - Select 8 players (all of them)

4. **Complete Some Matches:**
   - Complete 2-3 matches in Round 1 (Quarterfinals)
   - Leave 1-2 matches incomplete
   - This will show an in-progress bracket

**Example Tournament Progression:**
- Quarterfinal 1: Alex Chen vs Lisa Martinez → Alex wins
- Quarterfinal 2: Maria Garcia vs Michael Lee → Maria wins
- Quarterfinal 3: James Wilson vs Emma Brown → (Leave incomplete)
- Quarterfinal 4: Sarah Johnson vs David Kim → (Leave incomplete)

**✓ Checkpoint:** You should have a tournament with a partially completed bracket.

---

### STEP 5: Take 10 Screenshots (10 minutes)

Now take screenshots! On the simulator, press **Cmd + S** to save a screenshot.

Screenshots will save to your **Desktop** automatically.

#### Screenshot 1: HOME SCREEN
1. Navigate to **Home** tab
2. Make sure recent matches are visible
3. Press **Cmd + S**
4. **Filename suggestion:** `01-home-screen.png`

#### Screenshot 2: TOURNAMENT BRACKET ⭐ MOST IMPORTANT
1. Navigate to **Tournaments** tab
2. Tap on "Club Championship 2025"
3. View the tournament bracket
4. Make sure you can see:
   - Round names (Quarterfinals, Semifinals, Finals)
   - Player names in bracket slots
   - Some completed matches
   - Some pending matches
5. Press **Cmd + S**
6. **Filename suggestion:** `02-tournament-bracket.png`

#### Screenshot 3: ELO LEADERBOARD ⭐ IMPORTANT
1. Navigate to **Stats** tab (or Players tab with rankings)
2. Make sure view shows:
   - Players sorted by ELO rating
   - Different ratings for each player
   - Win/loss records
   - Period selector showing "All Time"
3. Press **Cmd + S**
4. **Filename suggestion:** `03-elo-leaderboard.png`

#### Screenshot 4: PLAYER STATISTICS DETAIL ⭐ IMPORTANT
1. From Stats or Players screen, **tap on Alex Chen** (or top player)
2. This should show:
   - Player name and rating
   - Win/loss stats
   - ELO progression chart (line chart)
   - Win/loss trend chart (bar chart)
   - Period selector (7d, 30d, 3m, etc.)
3. Press **Cmd + S**
4. **Filename suggestion:** `04-player-stats-charts.png`

#### Screenshot 5: MATCH SCORING (Live Match)
1. Go to **Home** tab
2. Tap **"Start Quick Match"**
3. Select 2 players
4. Score a few points (e.g., 8-5 in Set 1)
5. Make sure the screen shows:
   - Both player names clearly
   - Current score
   - Set indicator
6. Press **Cmd + S**
7. **Cancel the match** (don't save it)
8. **Filename suggestion:** `05-match-scoring.png`

#### Screenshot 6: MATCH HISTORY
1. Navigate to **Matches** tab
2. Make sure you can see:
   - List of completed matches
   - Match cards showing players, scores, dates
   - Maybe expand one match to show details
3. Press **Cmd + S**
4. **Filename suggestion:** `06-match-history.png`

#### Screenshot 7: STATISTICS DASHBOARD
1. Navigate to **Stats** tab
2. Show the main stats overview:
   - Overall statistics (total players, matches, tournaments)
   - Any charts or graphs
   - Period selectors
3. Press **Cmd + S**
4. **Filename suggestion:** `07-statistics-dashboard.png`

#### Screenshot 8: EXPORT FUNCTIONALITY ⭐ IMPORTANT
1. Go to **Home** tab (or Stats/Matches screen)
2. Look for **Export** button
3. If there's an export menu, open it to show options:
   - Export Match History
   - Export Player Stats
   - Export Tournament Bracket
   - Database Backup
4. Press **Cmd + S**
5. **Filename suggestion:** `08-export-menu.png`

**Note:** If your export is just a button (not a menu), that's fine - just capture the screen with the export button visible.

#### Screenshot 9: TOURNAMENT LIST
1. Navigate to **Tournaments** tab
2. Show the list of tournaments
3. Should display tournament name, status, date
4. Press **Cmd + S**
5. **Filename suggestion:** `09-tournament-list.png`

#### Screenshot 10: MATCH DETAIL (Expanded)
1. Go to **Matches** tab
2. **Tap on a completed match** to expand it
3. Make sure it shows:
   - Set-by-set scores
   - Winner indicator (trophy or highlight)
   - Match date/time
   - Any deuce indicators if present
4. Press **Cmd + S**
5. **Filename suggestion:** `10-match-detail.png`

**✓ Checkpoint:** You should have 10 PNG files on your Desktop!

---

### STEP 6: Verify Screenshots (2 minutes)

1. Go to your **Desktop**
2. Find the 10 screenshots (they'll be named like "Simulator Screen Shot - iPhone 16 Pro Max...")
3. **Rename them** to:
   - `01-home-screen.png`
   - `02-tournament-bracket.png`
   - `03-elo-leaderboard.png`
   - `04-player-stats-charts.png`
   - `05-match-scoring.png`
   - `06-match-history.png`
   - `07-statistics-dashboard.png`
   - `08-export-menu.png`
   - `09-tournament-list.png`
   - `10-match-detail.png`

4. **Check dimensions:**
   - Right-click any screenshot → Get Info
   - Verify dimensions are **1290 x 2796** pixels (or similar)

**✓ Checkpoint:** All 10 screenshots renamed and verified.

---

### STEP 7: Add Annotations (30 minutes)

Now add text overlays to each screenshot. **Easiest method: Use Preview (Mac built-in app)**

**For EACH screenshot:**

1. **Open in Preview**
   - Double-click the PNG file
   - It should open in Preview

2. **Enable Markup Tools**
   - Click the **Markup Toolbar** button (pen/pencil icon in top toolbar)
   - Or press **Shift + Cmd + A**

3. **Add Dark Rectangle Background (for text readability)**
   - Click **Shapes** button → Select **Rectangle**
   - Draw rectangle at **top of screenshot** (covering ~15% of height)
   - Click **Style** button → Select **Fill Color** → Choose **Black**
   - Adjust opacity to **50-60%** for semi-transparent dark overlay

4. **Add Text Annotation**
   - Click **Text** button (or press **Cmd + T**)
   - Click on the dark rectangle to place text
   - Type the annotation (see below)
   - Select the text and change:
     - **Font:** Helvetica Neue Bold (or San Francisco Display Bold)
     - **Size:** 64pt (title), 44pt (subtitle)
     - **Color:** White
     - **Alignment:** Center

5. **Save**
   - Press **Cmd + S** to save
   - Close and move to next screenshot

---

**Text Annotations for Each Screenshot:**

**01-home-screen.png**
```
Title (64pt): Professional Tournament Management
Subtitle (44pt): for Table Tennis
```

**02-tournament-bracket.png** ⭐
```
Title (64pt): Interactive Tournament Brackets
Subtitle (44pt): Single Elimination & Round Robin
```

**03-elo-leaderboard.png** ⭐
```
Title (64pt): Advanced ELO Rating System
Subtitle (44pt): with Competitiveness Adjustment
```

**04-player-stats-charts.png** ⭐
```
Title (64pt): Comprehensive Analytics
Subtitle (44pt): Track Your Performance Over Time
```

**05-match-scoring.png**
```
Title (64pt): Real-Time Scoring
Subtitle (44pt): Singles & Doubles Support
```

**06-match-history.png**
```
Title (64pt): Complete Match History
Subtitle (44pt): Every Point Recorded
```

**07-statistics-dashboard.png**
```
Title (64pt): Detailed Player Metrics
Subtitle (44pt): Monitor Progress & Trends
```

**08-export-menu.png** ⭐
```
Title (64pt): Professional Data Export
Subtitle (44pt): Share & Backup Your Data
```

**09-tournament-list.png**
```
Title (64pt): Easy Tournament Setup
Subtitle (44pt): Multiple Formats Supported
```

**10-match-detail.png**
```
Title (64pt): Detailed Match Breakdowns
Subtitle (44pt): Set-by-Set Analysis
```

---

**Alternative: Quick Annotation Template**

If you want to be faster, create ONE annotated screenshot first, then:
1. Copy the text boxes
2. Paste onto other screenshots
3. Just change the text content

**✓ Checkpoint:** All 10 screenshots now have professional text annotations!

---

### STEP 8: Final Check (2 minutes)

Before uploading to App Store Connect:

- [ ] All 10 screenshots have annotations
- [ ] Text is white and readable on all screenshots
- [ ] Dimensions verified (should be 1290 x 2796)
- [ ] Files are PNG format
- [ ] File sizes are reasonable (< 5MB each)
- [ ] Screenshots show realistic data (not "Test Player")
- [ ] No spelling errors in annotations

---

### STEP 9: Upload to App Store Connect (5 minutes)

1. Go to https://appstoreconnect.apple.com
2. Sign in with `sudarsan406@gmail.com`
3. Select **"TT Scorer"** app
4. Click on your current version or create new version
5. Scroll to **"App Previews and Screenshots"** section
6. Select **"6.7" iPhone Display"** (for iPhone 16 Pro Max)
7. **Drag and drop all 10 screenshots** in this order:
   1. 02-tournament-bracket.png (FIRST!)
   2. 03-elo-leaderboard.png
   3. 04-player-stats-charts.png
   4. 08-export-menu.png
   5. 01-home-screen.png
   6. 05-match-scoring.png
   7. 07-statistics-dashboard.png
   8. 06-match-history.png
   9. 09-tournament-list.png
   10. 10-match-detail.png

8. Click **Save** in top right

**✓ Checkpoint:** Screenshots uploaded to App Store Connect!

---

## Quick Reference Card

### Screenshot Keyboard Shortcuts
- **Take screenshot:** Cmd + S (while Simulator is in focus)
- **Open Markup:** Shift + Cmd + A (in Preview)
- **Add text:** Cmd + T (in Preview Markup mode)

### Screenshot Locations
- **Saved to:** ~/Desktop/
- **Expected dimensions:** 1290 x 2796 pixels

### Most Important Screenshots (Must be perfect!)
1. **#2 - Tournament Bracket** (shows tournament management)
2. **#3 - ELO Leaderboard** (shows advanced ratings)
3. **#4 - Player Stats Charts** (shows analytics)
4. **#8 - Export Menu** (shows professional features)

---

## Troubleshooting

**Q: Screenshots not saving to Desktop?**
A: Check Simulator → File → Screenshot Location

**Q: Dimensions are wrong?**
A: Make sure you're using iPhone 16 Pro Max simulator (1290 x 2796)

**Q: Can't find Markup tools in Preview?**
A: Try View → Show Markup Toolbar, or press Shift + Cmd + A

**Q: Text is hard to read?**
A: Add a semi-transparent dark rectangle behind the text first

**Q: App Store Connect won't accept my screenshots?**
A: Verify file format is PNG and dimensions are exactly 1290 x 2796

---

## Time Estimate

- ✅ Step 1: Launch app (5 min)
- ✅ Step 2: Add players (5 min)
- ✅ Step 3: Create matches (15 min)
- ✅ Step 4: Create tournament (10 min)
- ✅ Step 5: Take screenshots (10 min)
- ✅ Step 6: Verify (2 min)
- ✅ Step 7: Annotate (30 min)
- ✅ Step 8: Final check (2 min)
- ✅ Step 9: Upload (5 min)

**Total: ~85 minutes** (1.5 hours)

But don't rush! Quality screenshots are crucial for App Store approval.

---

**You've got this! Start with Step 1 and work through systematically. Good luck! 🏓**
