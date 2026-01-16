#!/usr/bin/env python3
"""
FinDash - Cache Merge Tool
Merges new API responses with existing cache files
Can be run via cron job or GitHub Actions for automatic updates
"""

import json
import os
from datetime import datetime, timedelta
from collections import OrderedDict

CACHE_DIR = "cache"

def load_cache_file(from_currency, to_currency):
    """Load existing cache file"""
    filename = f"{from_currency.lower()}_{to_currency.lower()}.json"
    filepath = os.path.join(CACHE_DIR, filename)
    
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filepath}: {str(e)}")
            return None
    return None

def merge_cache_data(existing_data, new_data):
    """
    Merge new data with existing cache
    Handles:
    - Duplicate dates (keeps latest value)
    - Missing values (fills gaps)
    - Maintains chronological order
    """
    if not existing_data:
        return new_data
    
    existing_dates = existing_data.get("dates", [])
    existing_rates = existing_data.get("rates", [])
    new_dates = new_data.get("dates", [])
    new_rates = new_data.get("rates", [])
    
    # Create a dict for easy merging
    merged = OrderedDict()
    
    # Add existing data
    for date, rate in zip(existing_dates, existing_rates):
        merged[date] = rate
    
    # Add/update with new data
    for date, rate in zip(new_dates, new_rates):
        if rate is not None:
            merged[date] = rate
    
    # Sort by date
    sorted_dates = sorted(merged.keys())
    sorted_rates = [merged[date] for date in sorted_dates]
    
    return {
        "pair": existing_data.get("pair", new_data.get("pair")),
        "dates": sorted_dates,
        "rates": sorted_rates,
        "count": len([r for r in sorted_rates if r is not None]),
        "merged_at": datetime.now().isoformat()
    }

def save_cache_file(from_currency, to_currency, data):
    """Save merged cache data"""
    filename = f"{from_currency.lower()}_{to_currency.lower()}.json"
    filepath = os.path.join(CACHE_DIR, filename)
    
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {str(e)}")
        return False

def merge_user_data(user_data_file):
    """
    Merge user-submitted API responses into cache files
    
    Expected format of user_data_file:
    {
        "twd_usd": {
            "dates": ["2026-01-01", "2026-01-02"],
            "rates": [30.5, 30.6]
        },
        ...
    }
    """
    print("\n" + "=" * 60)
    print("FinDash - Cache Merge Tool")
    print("=" * 60)
    
    if not os.path.exists(user_data_file):
        print(f"❌ User data file not found: {user_data_file}")
        return False
    
    try:
        with open(user_data_file, 'r') as f:
            user_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading user data: {str(e)}")
        return False
    
    merged_count = 0
    new_data_count = 0
    
    for pair_key, new_rates in user_data.items():
        try:
            # Parse pair key (e.g., "twd_usd")
            parts = pair_key.split('_')
            if len(parts) != 2:
                print(f"⚠ Invalid pair key: {pair_key}")
                continue
            
            from_curr, to_curr = parts
            print(f"\n📊 Merging {from_curr.upper()}/{to_curr.upper()}...")
            
            # Load existing cache
            existing_data = load_cache_file(from_curr, to_curr)
            
            # Merge data
            merged_data = merge_cache_data(existing_data, new_rates)
            
            # Save merged data
            if save_cache_file(from_curr, to_curr, merged_data):
                new_records = len(new_rates.get("dates", [])) if existing_data else 0
                total = merged_data.get("count", 0)
                print(f"  ✓ Merged {new_records} new records")
                print(f"  ✓ Total rates: {total}")
                merged_count += 1
                new_data_count += new_records
            else:
                print(f"  ✗ Failed to save cache")
        
        except Exception as e:
            print(f"  ✗ Error processing {pair_key}: {str(e)}")
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ Merge Complete!")
    print("=" * 60)
    print(f"✓ Updated pairs: {merged_count}")
    print(f"✓ New records merged: {new_data_count}")
    print("=" * 60)
    
    return True

def export_browser_cache():
    """
    Generate a template file for users to export their browser cache
    This shows the expected format for user data
    """
    print("\n" + "=" * 60)
    print("FinDash - Cache Export Template")
    print("=" * 60)
    print("\nExpected format for user_data.json:")
    print(json.dumps({
        "twd_usd": {
            "dates": ["2026-01-10", "2026-01-11", "2026-01-12"],
            "rates": [30.5, 30.6, 30.7]
        },
        "eur_usd": {
            "dates": ["2026-01-10"],
            "rates": [1.08]
        }
    }, indent=2))
    print("\n" + "=" * 60)

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 merge_cache.py <user_data.json>    - Merge user data")
        print("  python3 merge_cache.py --template           - Show format example")
        print("\nExample:")
        print("  python3 merge_cache.py new_rates.json")
        sys.exit(1)
    
    if sys.argv[1] == "--template":
        export_browser_cache()
    else:
        user_data_file = sys.argv[1]
        merge_user_data(user_data_file)

if __name__ == "__main__":
    main()
