-- Football ELO Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: teams
-- Stores all teams and their current ELO ratings
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  league_id INTEGER NOT NULL,
  league_name TEXT NOT NULL,
  current_elo DECIMAL(10, 2) NOT NULL DEFAULT 1500.0,
  is_promoted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: matches
-- Stores all matches (both completed and pending)
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  event_id INTEGER UNIQUE NOT NULL,
  season_type INTEGER NOT NULL,
  season_name TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  league_id INTEGER NOT NULL,
  league_name TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  venue_id INTEGER,
  attendance INTEGER,

  -- Teams
  home_team_id INTEGER NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_id INTEGER NOT NULL,
  away_team_name TEXT NOT NULL,

  -- Scores (NULL if pending)
  home_team_score INTEGER,
  away_team_score INTEGER,
  home_team_winner BOOLEAN,
  away_team_winner BOOLEAN,

  -- ELO data (NULL if pending)
  home_elo_pre DECIMAL(10, 2),
  away_elo_pre DECIMAL(10, 2),
  home_elo_change DECIMAL(10, 2),
  away_elo_change DECIMAL(10, 2),
  home_elo_post DECIMAL(10, 2),
  away_elo_post DECIMAL(10, 2),

  -- Status
  is_completed BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: predictions
-- Stores predictions for pending matches
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  event_id INTEGER UNIQUE NOT NULL,

  -- ELO ratings used for prediction
  home_elo DECIMAL(10, 2) NOT NULL,
  away_elo DECIMAL(10, 2) NOT NULL,

  -- Probabilities
  home_win_prob DECIMAL(5, 4) NOT NULL,
  draw_prob DECIMAL(5, 4) NOT NULL,
  away_win_prob DECIMAL(5, 4) NOT NULL,
  home_or_draw_prob DECIMAL(5, 4) NOT NULL,
  away_or_draw_prob DECIMAL(5, 4) NOT NULL,

  -- Recommendation
  recommended_bet TEXT NOT NULL,
  recommended_prob DECIMAL(5, 4) NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('High', 'Medium', 'Low')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: parameters
-- Stores ELO calculation parameters
CREATE TABLE parameters (
  id SERIAL PRIMARY KEY,
  param_key TEXT UNIQUE NOT NULL,
  param_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_matches_event_id ON matches(event_id);
CREATE INDEX idx_matches_completed ON matches(is_completed);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_league ON matches(league_id);
CREATE INDEX idx_matches_season ON matches(season_year);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_elo ON teams(current_elo DESC);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read, only authenticated users can write
CREATE POLICY "Allow public read access to teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access to teams" ON teams
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access to matches" ON matches
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to predictions" ON predictions
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access to predictions" ON predictions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to parameters" ON parameters
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access to parameters" ON parameters
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parameters_updated_at BEFORE UPDATE ON parameters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
