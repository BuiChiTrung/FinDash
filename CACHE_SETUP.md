# FinDash Cache Setup Guide

## Overview

This guide explains how to generate and use cached historical exchange rate data.

## Prerequisites

- Python 3.7 or higher
- Internet connection (for initial cache generation)

## Step 1: Generate Cache Files

Run the Python script to fetch and cache 1 year of historical data for all currency pairs:

```bash
python3 generate_cache.py
```

**What happens:**

- Script fetches historical rates for all configured currency pairs
- Creates `cache/` directory with JSON files
- Each file contains dates and rates for a currency pair
- Takes 5-10 minutes depending on your internet connection

**Output structure:**

```
cache/
├── twd_usd.json
├── eur_usd.json
├── gbp_usd.json
├── jpy_usd.json
├── usd_cny.json
└── ...
```

## Step 2: Commit to Git

```bash
git add cache/
git commit -m "Add cached exchange rate data"
git push
```

## Step 3: Deploy

Your cached data is now included in the deployed site!

## How It Works

### Loading Priority:

1. **Browser LocalStorage** (instant, if exists)
2. **Static Cache Files** (fast, ~100-300ms)
3. **API Fallback** (slower, ~2-5 seconds)

### Flow:

```
User loads chart
    ↓
Check browser cache (localStorage)
    ↓ (if not found)
Try loading from cache/*.json file
    ↓ (if not found)
Fetch from API
    ↓
Save to browser cache for future use
```

## Cache Configuration

Edit `generate_cache.py` to customize:

```python
# Number of days to fetch
DAYS_TO_FETCH = 365  # Change to 90, 30, etc.

# Currency pairs to cache
CURRENCY_PAIRS = [
    ("twd", "usd"),  # Add/remove pairs here
    ("eur", "usd"),
    # ...
]
```

Then regenerate:

```bash
python3 generate_cache.py
```

## Updating Cache

To refresh cache with latest data:

```bash
rm -rf cache/
python3 generate_cache.py
git add cache/
git commit -m "Update cached exchange rate data"
git push
```

## Troubleshooting

### Script times out

- Increase `timeout` value in generate_cache.py
- Run script with fewer currency pairs

### Cache files not loading

- Verify `cache/` directory exists at root level
- Check browser console for 404 errors
- Ensure file permissions are correct

### Want to skip cache files

- Keep cache files minimal or empty
- App will automatically fall back to API

## File Size Impact

Typical cache file sizes:

- 1 year of data: ~5-10 KB per pair
- Total for all pairs: ~50-100 KB
- Reduces download time by 90% after initial load

## Advanced: Merge New Data from API Calls

When users fallback to the API and fetch rates, you can merge that new data into cache files.

### Manual Merge

```bash
# Show expected format
python3 merge_cache.py --template

# Merge user data
python3 merge_cache.py user_data.json
```

**user_data.json format:**

```json
{
  "twd_usd": {
    "dates": ["2026-01-10", "2026-01-11"],
    "rates": [30.5, 30.6]
  },
  "eur_usd": {
    "dates": ["2026-01-10"],
    "rates": [1.08]
  }
}
```

### Automatic Daily Updates (GitHub Actions)

Cache is automatically updated daily via GitHub Actions:

- **Schedule**: 3 AM UTC daily (configurable)
- **Runs**: `generate_cache.py` to fetch latest data
- **Auto-commits**: Updates cache files if changes detected
- **Fallback**: If API unavailable, previous cache is used

**To trigger manually:**

1. Go to GitHub → Actions
2. Select "Update Exchange Rate Cache"
3. Click "Run workflow"

## Privacy

- Cache files contain only historical rates
- No personal data is stored
- LocalStorage is private to your domain
