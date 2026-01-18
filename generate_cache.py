#!/usr/bin/env python3
"""
FinDash - Forex Historical Data Cache Generator
Fetches and caches historical exchange rates for offline use
Intelligently updates cache with only missing data
"""

import requests
import json
import os
from datetime import datetime, timedelta
import time

# Configuration
API_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1"
API_FALLBACK = "https://latest.currency-api.pages.dev/v1"
CACHE_DIR = "cache"
DAYS_TO_FETCH = 365 * 1  # 2 years

# Currency pairs to cache
# Generate all combinations of available currencies
CURRENCIES = ["twd", "usd", "eur", "gbp", "jpy", "cny", "vnd", "aud", "cad", "chf", "sgd"]
# CURRENCIES = ["chf", "sgd"]
CURRENCY_PAIRS = [
    (curr1, curr2) 
    for curr1 in CURRENCIES 
    for curr2 in CURRENCIES 
    if curr1 != curr2  # Exclude same currency pairs
]

def create_cache_dir():
    """Create cache directory if it doesn't exist"""
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)
        print(f"✓ Created cache directory: {CACHE_DIR}")

def load_existing_cache(from_currency, to_currency):
    """Load existing cache file and return current data"""
    filename = f"{from_currency.lower()}_{to_currency.lower()}.json"
    filepath = os.path.join(CACHE_DIR, filename)
    
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                return data
        except Exception as e:
            print(f"  ⚠ Error reading existing cache: {str(e)}")
    
    return None

def get_missing_dates(existing_dates, days=365):
    """Determine which dates are missing from the cache"""
    today = datetime.now()
    all_dates = []
    
    # Generate all dates for the requested period
    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        all_dates.append(date_str)
    
    # Find missing dates
    existing_set = set(existing_dates) if existing_dates else set()
    missing_dates = [d for d in all_dates if d not in existing_set]
    
    return missing_dates, all_dates

def fetch_historical_rates(from_currency, to_currency, days=365):
    """Fetch historical exchange rates for a currency pair (only missing dates)"""
    print(f"\n📊 Fetching {from_currency.upper()}/{to_currency.upper()} ({days} days)...")
    
    # Load existing cache
    existing_data = load_existing_cache(from_currency, to_currency)
    existing_dates = existing_data.get("dates", []) if existing_data else []
    
    # Get missing dates
    missing_dates, all_dates = get_missing_dates(existing_dates, days)
    
    if not missing_dates:
        print(f"  ✓ All {len(all_dates)} dates already cached!")
        return existing_data
    
    print(f"  📅 {len(all_dates)} total dates, {len(existing_dates)} cached, {len(missing_dates)} to fetch")
    
    # Initialize or use existing data
    if existing_data:
        dates = existing_data.get("dates", [])
        rates = existing_data.get("rates", [])
    else:
        dates = all_dates
        rates = [None] * len(all_dates)  # Placeholder for missing rates
    
    # Fetch only missing rates
    fetched_count = 0
    for idx, date_str in enumerate(missing_dates):
        try:
            # Try fetching from specific date API
            url = f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date_str}/v1/currencies/{from_currency}.json"
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                # Fallback to latest API
                url = f"{API_FALLBACK}/currencies/{from_currency}.json"
                response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                rate_data = data.get(from_currency, {})
                
                if to_currency in rate_data:
                    # Find position in dates array and update
                    date_idx = dates.index(date_str)
                    rates[date_idx] = rate_data[to_currency]
                    fetched_count += 1
                else:
                    print(f"  ⚠ Rate not found for {date_str}")
            else:
                print(f"  ⚠ Failed to fetch for {date_str}")
        
        except Exception as e:
            print(f"  ✗ Error fetching {date_str}: {str(e)}")
        
        # Progress indicator
        if (idx + 1) % 30 == 0:
            print(f"  ... {idx + 1}/{len(missing_dates)} new dates fetched")
        
        # Rate limiting - be nice to the API
        time.sleep(0.1)
    
    # Prepare result
    result = {
        "pair": f"{from_currency.upper()}/{to_currency.upper()}",
        "dates": dates,
        "rates": rates,
        "count": len([r for r in rates if r is not None]),
        "cached_at": datetime.now().isoformat()
    }
    
    print(f"  ✓ Fetched {fetched_count} new rates")
    print(f"  ✓ Total available rates: {result['count']}")
    return result

def save_cache_file(from_currency, to_currency, data):
    """Save cached data to JSON file"""
    filename = f"{from_currency.lower()}_{to_currency.lower()}.json"
    filepath = os.path.join(CACHE_DIR, filename)
    
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"  💾 Updated: {filepath}")
        return True
    except Exception as e:
        print(f"  ✗ Error saving {filepath}: {str(e)}")
        return False

def main():
    """Main execution"""
    print("=" * 60)
    print("FinDash - Forex Historical Data Cache Generator")
    print("Smart Incremental Updates")
    print("=" * 60)
    
    create_cache_dir()
    
    successful = 0
    failed = 0
    
    print(f"\n🔄 Starting to update cache for {len(CURRENCY_PAIRS)} currency pairs...")
    print(f"📅 Period: Last {DAYS_TO_FETCH} days")
    
    for from_curr, to_curr in CURRENCY_PAIRS:
        try:
            # Fetch historical data (only missing dates)
            data = fetch_historical_rates(from_curr, to_curr, DAYS_TO_FETCH)
            
            # Save to cache file
            if save_cache_file(from_curr, to_curr, data):
                successful += 1
            else:
                failed += 1
        
        except Exception as e:
            print(f"✗ Error processing {from_curr.upper()}/{to_curr.upper()}: {str(e)}")
            failed += 1
        
        # Small delay between currency pairs
        time.sleep(1)
    
    # Summary
    print("\n" + "=" * 60)
    print("📈 Cache Update Complete!")
    print("=" * 60)
    print(f"✓ Successfully updated: {successful} pairs")
    print(f"✗ Failed: {failed} pairs")
    print(f"📁 Cache location: {os.path.abspath(CACHE_DIR)}")
    print("\n✅ Cache is ready to use!")
    print("=" * 60)

if __name__ == "__main__":
    main()

