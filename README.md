# ⚽ Football ELO Prediction System

Advanced ELO-based football match prediction system for the top 5 European leagues with real-time ratings, comprehensive predictions, and neobrutalist UI design.

## 🎯 Features

### Core Functionality
- **Pure ELO Rating System**: Dynamic ratings based on match results, not league standings
- **5 Prediction Types**: Home Win, Draw, Away Win, Home/Draw (1X), Away/Draw (X2)
- **Smart Draw Probability**: Calibrated based on ELO difference, team quality, and defensive capabilities
- **Real-time Updates**: Enter scores and watch ELO ratings and predictions update automatically
- **Historical Analysis**: Track ELO progression throughout the season with interactive charts

### ELO Calculation Features
- **Dynamic K-Factor Multipliers**:
  - Opponent Quality: 0.6x - 2.0x (upsets = higher impact)
  - Venue: Away wins worth 35% more
  - Goal Difference: 1.0x - 1.5x
  - Form (Last 5 games): 0.85x - 1.2x
  - Defensive Quality: Based on clean sheets and goals conceded

- **Progressive K-Caps**: Allows promoted/struggling teams to rise faster
  - < 1400 ELO: Max K = 75
  - 1400-1500: Max K = 60
  - 1500-1600: Max K = 50
  - 1600-1700: Max K = 40
  - > 1700: Max K = 35

### Data Coverage
- **5 Leagues**: Premier League, La Liga, Serie A, Bundesliga, Ligue 1
- **2 Seasons**: 2024-25 (training data) + 2025-26 (predictions)
- **1,752 matches per season**
- **96 teams** including 14 promoted teams

## 🏗️ Technical Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS with Neobrutalist Design
- **Charts**: Recharts
- **Data Processing**: Python (openpyxl, pandas)
- **Deployment**: Vercel

## 📊 System Statistics

**2024-25 Season Results:**
- **Draw Rate**: 24.94%
- **Home Win Rate**: 42.01%
- **Away Win Rate**: 33.05%
- **Average Home Advantage**: 46.8 ELO points

**Top 3 Teams (End of 2024-25):**
1. Bayern Munich - 1807.1 ELO
2. Barcelona - 1796.7 ELO
3. Paris Saint-Germain - 1778.9 ELO

**Current Season (2025-26):**
- 327 matches completed
- 1,425 pending matches with predictions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/football-elo.git
cd football-elo
```

2. Install Python dependencies:
```bash
pip install openpyxl pandas
```

3. Process the data (if needed):
```bash
cd scripts
python process_data.py
python prepare_current_season.py
python create_predictions.py
```

4. Install webapp dependencies:
```bash
cd football-elo-webapp
npm install
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📱 Pages

### 🏠 Dashboard
- Overview statistics
- Top 10 teams by ELO
- Recent matches with ELO changes
- Upcoming match previews

### 🔮 Predictions
- All 1,425 upcoming matches
- 5 prediction types with probabilities
- Filter by league
- Search by team
- Recommended bets with confidence levels

### ✍️ Score Entry
- Manual score input interface
- Enter results for pending matches
- Triggers ELO recalculation

### 🏆 Rankings
- Current ELO rankings by league
- ELO change from season start
- Sortable tables

### 📈 History
- Interactive ELO progression charts
- Per-team analysis
- Match-by-match breakdown

### 🎯 Accuracy
- Prediction accuracy statistics
- By league breakdown
- Recent predictions vs actual results

## 🎨 Design Philosophy

**Neobrutalism**: Bold, unapologetic design with:
- Thick black borders (4px)
- Strong shadows (`shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`)
- High contrast colors
- No rounded corners
- Uppercase typography
- Direct, functional aesthetics

## 📂 Project Structure

```
football-elo/
├── football-elo-webapp/          # Next.js webapp
│   ├── app/                      # App router pages
│   │   ├── page.tsx             # Dashboard
│   │   ├── predictions/         # Predictions page
│   │   ├── score-entry/         # Score entry interface
│   │   ├── rankings/            # ELO rankings
│   │   ├── history/             # ELO history charts
│   │   ├── accuracy/            # Prediction accuracy
│   │   └── api/                 # API routes
│   ├── components/              # React components
│   │   ├── ui/                  # UI primitives
│   │   └── Navigation.tsx       # Main navigation
│   ├── lib/                     # Utility functions
│   ├── types/                   # TypeScript definitions
│   └── data/                    # JSON data files
├── scripts/                      # Data processing scripts
│   ├── process_data.py          # Main ELO calculation
│   ├── prepare_current_season.py
│   ├── create_predictions.py
│   └── generate_pages.py
├── Football-Top5-Past-And-Current-Data.xlsx  # Raw data
├── CHANGES_MADE.md              # Change log
└── ELO_SYSTEM_GUIDE.md          # System documentation
```

## 🔧 How It Works

### ELO Calculation Process

1. **Load Raw Data**: Extract match results from Excel
2. **Calculate Baseline Stats**: Analyze 2024-25 season for draw rates, home advantage
3. **Process Historical Season**: Calculate ELO for all 2024-25 matches sequentially
4. **Initialize Current Season**: Set starting ELOs (1500 for existing, 1400 for promoted)
5. **Generate Predictions**: Calculate win probabilities for pending matches

### Prediction Formula

**Standard ELO Probability:**
```
P(home_win) = 1 / (1 + 10^((away_elo - home_elo - home_advantage) / 400))
```

**Complex Draw Probability:**
```
draw% = 24.94% × (1 + elo_closeness_bonus + elite_bonus + defensive_bonus)

where:
- elo_closeness_bonus = (200 - min(elo_diff, 200)) / 2000  [0 to 0.10]
- elite_bonus = 0.08 if both teams > 1650 ELO
- defensive_bonus = (avg_defensive_quality - 0.5) × 0.06  [-0.03 to +0.03]
```

**Away Win Probability:**
```
P(away_win) = max(0, 1 - P(home_win) - P(draw))
```

## 📊 Data Files

### `season_2024_25.json`
- 1,752 completed matches
- Full ELO progression
- Final ELO ratings for all teams
- Baseline statistics

### `season_2025_26.json`
- 327 completed matches
- 1,425 pending matches
- Current ELO ratings
- 1,425 predictions with 5 types each

### `parameters.json`
- All K-factor multipliers
- K-caps by ELO range
- Baseline statistics
- Team-specific defensive quality

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Deploy (automatic)

The app is production-ready with:
- Static page generation where possible
- API routes for dynamic data
- Optimized build output

## 🔮 Future Enhancements

- [ ] Automated score fetching via API
- [ ] Real-time ELO recalculation on score entry
- [ ] Head-to-head team comparison
- [ ] Export predictions to CSV
- [ ] Mobile responsive improvements
- [ ] Authentication for score entry
- [ ] Historical match replay
- [ ] League-specific parameter tuning

## 📄 License

MIT License - Feel free to use and modify

## 🙏 Acknowledgments

- ELO rating system concept by Arpad Elo
- Match data sourced from ESPN/official league sources
- Inspired by chess and esports rating systems

---

**Built with ⚽ for football analytics enthusiasts**
