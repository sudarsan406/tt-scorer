# TT Scorer Screenshot Creation Guide

## Quick Start

You need **10 screenshots** at the correct dimensions for App Store submission.

---

## Step 1: Prepare Your App with Sample Data

Before taking screenshots, populate the app with realistic demo data:

### Create Sample Players (8-10 players)
Examples:
- Alex Chen (Rating: 1456)
- Maria Garcia (Rating: 1389)
- James Wilson (Rating: 1267)
- Sarah Johnson (Rating: 1245)
- David Kim (Rating: 1198)
- Emma Brown (Rating: 1167)
- Michael Lee (Rating: 1134)
- Lisa Martinez (Rating: 1089)

### Create Sample Matches
- Create 15-20 completed matches between different players
- Include various scores (close games and blowouts)
- This will generate realistic statistics and ELO progression

### Create a Sample Tournament
- Create a single elimination tournament with 8 players
- Complete some matches but leave the tournament in-progress
- This will show an active bracket with progression

---

## Step 2: Take Screenshots on iPhone Simulator

### Launch the Correct Simulator

```bash
# Open iOS Simulator with iPhone 14 Pro Max (6.5" display)
# This ensures correct screenshot dimensions

# Option 1: Through Xcode
open -a Simulator

# Then select: iPhone 14 Pro Max or iPhone 15 Plus
```

### Run Your App

```bash
npm run ios
# Wait for app to load on simulator
```

### Take Screenshots (Cmd + S)

Navigate to each screen and press **Cmd + S** to save screenshot:

1. **Home Screen** - Make sure recent matches are visible
2. **Tournament Bracket** - Navigate to a tournament with active bracket
3. **Stats Screen** - ELO leaderboard view (All Time period selected)
4. **Player Stats** - Click any player to view their detailed stats with charts
5. **Match Scoring** - Start a match and score a few points
6. **Match History** - Navigate to Matches tab
7. **Tournament List** - Navigate to Tournaments tab
8. **Export Screen** - Go to Home and show export button/menu
9. **Statistics Dashboard** - Stats screen showing period selector
10. **Match Detail** - Tap a match to expand details

### Where Screenshots Are Saved

By default, screenshots save to:
```
~/Desktop/
```

Look for files named like: `Simulator Screen Shot - iPhone 15 Plus - 2025-11-17 at 14.30.25.png`

---

## Step 3: Add Annotations to Screenshots

You have several options:

### Option A: Use Preview (Mac Built-in)

1. Open screenshot in Preview
2. Click the markup toolbar button (pen icon)
3. Click the text button (T)
4. Add text annotations at top or bottom
5. Use:
   - Font: Helvetica Bold
   - Size: 72pt for title, 48pt for subtitle
   - Color: White
6. Add a semi-transparent dark rectangle behind text for readability
7. Export and save

### Option B: Use Keynote (Free, Easy)

1. Open Keynote
2. Create new presentation with dimensions 1290 x 2796
3. Insert your screenshot as background
4. Add text boxes with annotations
5. Export as PNG at actual size

### Option C: Use Figma (Free, Professional)

1. Go to figma.com and create free account
2. Create new file
3. Create frame: 1290 x 2796 pixels
4. Import screenshots
5. Add text overlays with gradient backgrounds
6. Export as PNG @1x

### Option D: Use Online Tool

Visit: https://www.applaunchpad.com or https://screenshots.pro
- Upload screenshots
- Add text annotations
- Download annotated versions

---

## Step 4: Screenshot Annotations Reference

Copy these exactly for each screenshot:

### Screenshot 1: Home Screen
**Title:** "Professional Tournament Management"
**Subtitle:** "for Table Tennis"

### Screenshot 2: Tournament Bracket ⭐ PRIORITY
**Title:** "Interactive Tournament Brackets"
**Subtitle:** "Single Elimination & Round Robin"

### Screenshot 3: ELO Leaderboard ⭐ PRIORITY
**Title:** "Advanced ELO Rating System"
**Subtitle:** "with Competitiveness Adjustment"

### Screenshot 4: Match Scoring
**Title:** "Real-Time Scoring"
**Subtitle:** "Singles & Doubles Support"

### Screenshot 5: Statistics Dashboard ⭐ PRIORITY
**Title:** "Comprehensive Analytics"
**Subtitle:** "Track Your Performance Over Time"

### Screenshot 6: Player Statistics
**Title:** "Detailed Player Metrics"
**Subtitle:** "Monitor Progress & Trends"

### Screenshot 7: Match History
**Title:** "Complete Match History"
**Subtitle:** "Every Point Recorded"

### Screenshot 8: Export Functionality ⭐ PRIORITY
**Title:** "Professional Data Export"
**Subtitle:** "Share & Backup Your Data"

### Screenshot 9: Tournament List
**Title:** "Easy Tournament Setup"
**Subtitle:** "Multiple Formats Supported"

### Screenshot 10: Match Detail
**Title:** "Detailed Match Breakdowns"
**Subtitle:** "Set-by-Set Analysis"

---

## Step 5: Verify Screenshot Dimensions

Before uploading to App Store Connect, verify dimensions:

### Check File Info (Mac)
1. Right-click screenshot
2. Select "Get Info"
3. Verify dimensions are either:
   - 1242 x 2688 pixels (iPhone 11 Pro Max, XS Max)
   - 1284 x 2778 pixels (iPhone 12/13/14 Pro Max)
   - 1290 x 2796 pixels (iPhone 14/15 Plus, 15 Pro Max)

All three are acceptable for 6.5" display category.

---

## Step 6: Upload to App Store Connect

### Navigation
1. Go to https://appstoreconnect.apple.com
2. Select "TT Scorer" app
3. Go to version 1.1.0 (or create new version)
4. Scroll to "App Preview and Screenshots"
5. Select "6.5" display" (iPhone 15 Pro Max)

### Upload Order (Drag to reorder)
1. Tournament Bracket (FIRST - most important)
2. ELO Leaderboard
3. Statistics Dashboard
4. Export Functionality
5. Home Screen
6. Match Scoring
7. Player Statistics
8. Match History
9. Tournament List
10. Match Detail

### Requirements
- Minimum: 3 screenshots
- Maximum: 10 screenshots
- Recommended: All 10 for best impression
- **The first 3 are shown in search results** - make them count!

---

## Alternative: Use Real Device

If you have an iPhone 14 Pro Max or iPhone 15 Plus:

1. Build app on device:
   ```bash
   npx expo run:ios --device
   ```

2. Take screenshots:
   - Press Side Button + Volume Up simultaneously
   - Screenshots save to Photos app

3. AirDrop to Mac for annotation

---

## Pro Tips

### Make Screenshots Pop
1. **Use dark mode consistently** - Or light mode, but be consistent
2. **Show realistic data** - Use actual names and realistic scores
3. **Highlight key UI elements** - Circle or arrow to draw attention
4. **Keep annotations brief** - 5-7 words max per annotation
5. **Use consistent styling** - Same fonts, colors, layout for all

### Showcase Unique Features First
Your first 3 screenshots appear in App Store search results. Make them:
1. Tournament Bracket (shows tournament management)
2. ELO Leaderboard (shows advanced ratings)
3. Statistics Dashboard (shows professional analytics)

These three immediately communicate "professional tournament management" not "basic scorer."

### Test on Multiple Devices (Optional)
While 6.5" iPhone screenshots are required, you can also add:
- 6.7" iPhone (iPhone 14 Pro Max, 15 Pro Max) - 1290 x 2796
- 5.5" iPhone (older devices) - 1242 x 2208
- iPad Pro 12.9" - 2048 x 2732

But start with just 6.5" iPhone for initial submission.

---

## Checklist Before Upload

- [ ] All 10 screenshots taken
- [ ] All screenshots have annotations
- [ ] Dimensions verified (1242x2688 or 1284x2778 or 1290x2796)
- [ ] File format is PNG or JPEG
- [ ] File size < 500KB per screenshot (compress if needed)
- [ ] Screenshots show realistic data (not "Test Player 1")
- [ ] No placeholder text visible
- [ ] UI is in English (or primary language)
- [ ] Status bar shows good signal/battery (or hide it)
- [ ] Consistent light/dark mode across all screenshots
- [ ] Tournament Bracket is screenshot #1
- [ ] First 3 screenshots are strongest

---

## Quick Commands Reference

```bash
# Start app on simulator
npm run ios

# Take screenshot on simulator
Cmd + S (while simulator is in focus)

# Build for real device
npx expo run:ios --device

# Find screenshots on Mac
open ~/Desktop
```

---

## Need Help?

If you get stuck:
1. Check simulator is iPhone 14 Pro Max or 15 Plus
2. Verify screenshots are saving to Desktop
3. Use Preview for simple annotations (easiest method)
4. Remember: First 3 screenshots are most important!

**Estimated Time:** 30-45 minutes total
- 10 minutes: Add sample data to app
- 5 minutes: Take 10 screenshots
- 20-30 minutes: Add annotations
- 5 minutes: Upload to App Store Connect

You've got this! 🎾
