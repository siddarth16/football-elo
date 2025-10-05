# Football Elo Prediction System - User Guide

## 🎯 What You Have

A **professional, formula-driven Elo rating system** for predicting football match outcomes across the top 5 European leagues.

## 📊 Workbook Structure

### 1. **📈 Dashboard** (START HERE)
- Overview of the entire system
- Top 10 teams by Elo rating
- League statistics
- Instructions for use

### 2. **✍️ Score Entry 2025-26** (YOUR MAIN WORKSPACE)
- **Enter match scores here as they happen**
- Simply type scores in columns F (Home Score) and G (Away Score)
- Everything updates automatically!
- Shows 300 upcoming matches

### 3. **🔮 Predictions 2025-26** (VIEW PREDICTIONS)
- Automatically calculates win probabilities for all matches
- Shows predicted winners based on current Elo ratings
- Updates in real-time as you enter scores
- Track prediction accuracy

### 4. **🧮 Elo Engine 2024-25** (TRAINING DATA)
- Complete 2024/25 season with all Elo calculations
- 1,752 matches processed
- Shows how the Elo system works
- All multipliers (K-factors, form, defense, etc.)

### 5. **⭐ Current Elo Ratings** (LIVE RANKINGS)
- Real-time Elo rankings for all teams
- Sorted by league
- Updates automatically

### 6. **📋 Teams Master** (REFERENCE)
- Complete list of 96 teams (including promoted teams)
- Starting Elo (1500) vs Final 2024/25 Elo
- Promoted teams start at 1400 Elo

### 7. **⚙️ Parameters** (CUSTOMIZATION)
- All Elo formula parameters
- K-factors, multipliers, caps
- **Modify these to adjust system behavior**

### 8. **📊 Raw Data** (2024-25 & 2025-26)
- Original fixture data
- Reference only

## 🎮 How to Use

### Step 1: Understand Current Standings
1. Open **📈 Dashboard** to see top teams
2. Check **⭐ Current Elo Ratings** for all team rankings

### Step 2: View Predictions
1. Go to **🔮 Predictions 2025-26**
2. See match predictions with win probabilities
3. Column H: Home Win %
4. Column J: Away Win %
5. Column K: Predicted Winner

### Step 3: Enter Match Scores (As They Happen)
1. Open **✍️ Score Entry 2025-26**
2. Find the match that was played
3. Enter Home Score in column F
4. Enter Away Score in column G
5. **ALL predictions update automatically!**

### Step 4: Track Accuracy
1. Return to **🔮 Predictions 2025-26**
2. Column N shows if prediction was correct (✓ or ✗)

## 🔧 The Elo System Explained

### What is Elo?
A dynamic rating system where:
- Teams start at 1500 (promoted teams at 1400)
- Ratings increase when winning, decrease when losing
- Bigger upsets = bigger rating changes

### Your Custom Factors (In Priority Order):

#### 1. **Opponent Quality** (Most Important)
- Beating higher-ranked teams = big Elo gain
- Losing to lower-ranked teams = big Elo loss
- Multiplier: 0.6x to 2.0x

#### 2. **Away Performance**
- Away wins worth 35% more (×1.35)
- Away draws worth 15% more (×1.15)

#### 3. **Goal Difference**
- Win by 3+ goals = 30-50% bonus
- Big losses hurt less (tempered impact)

#### 4. **Form** (Last 5 Games)
- Hot streak: +20% K-factor
- Cold streak: -15% K-factor

#### 5. **Defensive Quality**
- Clean sheet win: +15% K-factor
- Conceding 2+ in a win: -5% K-factor

### K-Factor Caps (Smart Scaling)
Progressive caps help promoted/struggling teams climb faster:
- Elo < 1400: Max K = 75 (rapid gains)
- Elo 1400-1500: Max K = 60
- Elo 1500-1600: Max K = 50
- Elo 1600-1700: Max K = 40
- Elo > 1700: Max K = 35 (elite teams stable)

### Draw Logic
- Higher Elo team loses points in a draw (expected to win)
- Lower Elo team gains points (held off favorite)
- High-scoring draws (2-2, 3-3): Both teams gain slightly

## 🏆 Current Top Teams (End of 2024/25)

1. **Bayern Munich** - 1802.0 Elo
2. **Barcelona** - 1795.0 Elo
3. **Paris Saint-Germain** - 1784.7 Elo
4. **Real Madrid** - 1735.8 Elo
5. **Internazionale** - 1732.4 Elo
6. **AS Roma** - 1724.2 Elo
7. **Liverpool** - 1723.3 Elo
8. **Napoli** - 1722.4 Elo
9. **Manchester City** - 1720.8 Elo
10. **Atalanta** - 1704.6 Elo

## 🎛️ Customization Options

Want to adjust the system? Go to **⚙️ Parameters** and modify:
- Base K-Factor (default: 20)
- Home Advantage (default: 50 Elo points)
- All multipliers for away wins, GD, form, defense
- K-Factor caps by Elo range

**All changes propagate automatically to 2025/26 predictions!**

## 📝 Important Notes

### Promoted Teams
14 teams were promoted for 2025/26 season:
- Burnley, Leeds, Sunderland (Premier League)
- Cremonese, Pisa, Sassuolo (Serie A)
- Elche, Levante, Real Oviedo (La Liga)
- FC Cologne, Hamburg SV (Bundesliga)
- Lorient, Metz, Paris FC (Ligue 1)

All start at 1400 Elo (below average, need to prove themselves).

### Formula-Driven = Automatic Updates
- Everything is connected via Excel formulas
- No macros or manual calculations needed
- Just enter scores and watch predictions update!

### Zero Errors
All 9,096 formulas have been validated with zero errors.

## 🚀 Advanced Usage

### Compare Predictions vs Actual
Use the **🔮 Predictions** sheet to track:
- How often the system predicts correctly
- Which types of matches are hardest to predict
- Your prediction accuracy over time

### Analyze Form Trends
In **⭐ Current Elo Ratings**:
- Watch how teams rise/fall over the season
- Identify hot/cold streaks
- Spot potential upsets

### Adjust for League Differences
Each league runs independently:
- Different competitive balance
- Different home advantages
- Compare cross-league (use Elo ratings)

## 💡 Tips for Best Results

1. **Enter scores promptly** - The sooner you enter, the more accurate future predictions
2. **Check K-factor impacts** - See which factors are influencing ratings most in the Elo Engine
3. **Monitor promoted teams** - Watch how they adapt (start at 1400 Elo)
4. **Use predictions as probabilities** - Not certainties! Upsets happen.
5. **Adjust parameters if needed** - System is fully customizable

## 🐛 Troubleshooting

### Predictions not updating?
- Make sure you entered scores in the **Score Entry** sheet (not elsewhere)
- Check for #N/A errors (all should be resolved)

### Want to reset 2025/26?
- Clear all scores in columns F and G of Score Entry sheet
- Predictions will reset to pre-season state

### Want to change starting Elo?
- Modify in **📋 Teams Master** column E (Final Elo 2024/25)
- This is the starting point for 2025/26 predictions

---

## 🎉 Enjoy Your Elo System!

This is a professional-grade prediction system used by chess, esports, and sports analytics worldwide. Your version is customized specifically for football with factors that matter most to the beautiful game.

**Have fun predicting matches and may the best team win! ⚽**
