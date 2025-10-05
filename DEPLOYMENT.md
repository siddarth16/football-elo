# 🚀 Deployment Instructions

## Quick Deploy to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository: `siddarth16/football-elo`
4. **Vercel will auto-detect everything!**
   - Framework Preset: **Next.js** ✓ (auto-detected)
   - Root Directory: **./** (repository root)
   - Build Command: `npm run build` (auto-populated)
   - Output Directory: `.next` (auto-populated)
   - Install Command: `npm install` (auto-populated)
5. **No configuration needed** - just click "Deploy"!

Your app will be live at: `https://your-project-name.vercel.app` in ~2 minutes

**What you should see:**
```
✓ Framework Preset: Next.js (auto-detected)
✓ Root Directory: ./
✓ Build Command: npm run build
✓ Output Directory: .next
✓ Install Command: npm install
```

**Just click Deploy - that's it!** 🚀

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to repository root
cd football-elo

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: Your username
# - Link to existing project: N
# - Project name: football-elo (or your choice)
# - Directory: ./ (current directory)
# - Override settings: N

# For production deployment
vercel --prod
```

## Environment Variables

No environment variables needed! All data is included in the repository.

## Build Settings

These are automatically detected, but if needed:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Post-Deployment

After deployment:

1. Visit your deployed URL
2. Check the Dashboard loads correctly
3. Navigate through all pages to verify:
   - Dashboard ✓
   - Predictions ✓
   - Score Entry ✓
   - Rankings ✓
   - History ✓
   - Accuracy ✓

## Updating Data

To update match scores and recalculate ELO:

1. Update scores in the raw Excel file
2. Run data processing scripts:
   ```bash
   cd scripts
   python process_data.py
   python prepare_current_season.py
   python create_predictions.py
   ```
3. Commit and push the updated JSON files:
   ```bash
   git add football-elo-webapp/data/*.json
   git commit -m "Update match scores and recalculate ELO"
   git push
   ```
4. Vercel will auto-deploy the changes

## Troubleshooting

### Build Fails

Check:
- Node version (should be 18+)
- All dependencies installed
- No TypeScript errors

### Pages Don't Load

Check:
- API routes are working (`/api/data`)
- JSON data files exist in `football-elo-webapp/data/`
- File paths are correct

### Slow Performance

- Data files are large (~40MB total)
- Consider implementing pagination for match lists
- Use loading states (already implemented)

## Custom Domain

To add a custom domain:

1. Go to Project Settings in Vercel
2. Click "Domains"
3. Add your domain
4. Update DNS records as instructed

## Analytics

Vercel provides free analytics:
- Go to Project → Analytics
- View page views, performance, etc.

## Monitoring

Check deployment logs in Vercel dashboard for any errors.

---

**Ready to deploy! 🎉**
