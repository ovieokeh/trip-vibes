# Transit API Cost Analysis

> **Analysis Date:** December 2024  
> **Scenario:** Full API-based transit time accuracy for Trip Vibes

---

## Assumptions

| Parameter                     | Value  | Notes                             |
| ----------------------------- | ------ | --------------------------------- |
| Average trip duration         | 5 days | User-specified                    |
| Activities per day            | 5      | Typical itinerary density         |
| Transit calculations per trip | 20     | ~4 routes/day × 5 days            |
| Place enrichment calls        | 25     | One per activity for photos/hours |

### API Call Breakdown per Trip

| Call Type                  | Count  | Purpose                         |
| -------------------------- | ------ | ------------------------------- |
| Routes/Directions API      | 20     | Transit time between activities |
| Place Details (enrichment) | 25     | Photos, opening hours, ratings  |
| **Total API calls**        | **45** | Per trip                        |

---

## Google Maps Platform Pricing

> ⚠️ **Note:** The Routes API (for transit directions) costs **$5.00 per 1,000 requests** for basic routing.  
> Your provided pricing covers Places API; Routes API is separate but similarly priced.

### Cost per Trip (Google)

| Component                | Calls | Cost/1000 | Cost/Trip  |
| ------------------------ | ----- | --------- | ---------- |
| Routes API (transit)     | 20    | $5.00     | $0.10      |
| Place Details Essentials | 25    | $5.00     | $0.125     |
| **Total per trip**       | 45    | -         | **$0.225** |

### Google Cost at Scale

| # Trips       | Transit Calls | Place Calls | Monthly Cost  | Notes                |
| ------------- | ------------- | ----------- | ------------- | -------------------- |
| **1,000**     | 20,000        | 25,000      | **$225**      | Starter scale        |
| **10,000**    | 200,000       | 250,000     | **$2,250**    | Small business       |
| **500,000**   | 10,000,000    | 12,500,000  | **~$90,000**  | Volume tier kicks in |
| **1,000,000** | 20,000,000    | 25,000,000  | **~$150,000** | Enterprise scale     |

> 💡 Google offers $200/month free credit on Maps Platform, covering ~890 trips/month for free.

---

## Foursquare Pricing

Foursquare doesn't provide routing/transit APIs, so we'd still need Google for directions.  
However, here's the cost for **place discovery** via Foursquare:

### Cost per Trip (Foursquare Place Search Only)

| Tier      | Calls | CPM    | Cost/Trip |
| --------- | ----- | ------ | --------- |
| 0-10K     | 25    | $0.00  | $0.00     |
| 10K-100K  | 25    | $15.00 | $0.375    |
| 100K-500K | 25    | $12.00 | $0.30     |

### Foursquare Cost at Scale (Place Discovery Only)

| # Trips       | Total Calls | Tier        | Monthly Cost  |
| ------------- | ----------- | ----------- | ------------- |
| **1,000**     | 25,000      | Mostly free | **~$225**     |
| **10,000**    | 250,000     | $12-15 CPM  | **~$3,000**   |
| **500,000**   | 12,500,000  | $9 CPM      | **~$112,500** |
| **1,000,000** | 25,000,000  | $4.50 CPM   | **~$112,500** |

---

## Combined Cost Summary (Google Routing + Current Foursquare Discovery)

| # Trips/Month | Google (Routing + Places) | Foursquare (Discovery) | **Total**    |
| ------------- | ------------------------- | ---------------------- | ------------ |
| **1,000**     | $225                      | ~$225                  | **$450**     |
| **10,000**    | $2,250                    | ~$3,000                | **$5,250**   |
| **500,000**   | ~$90,000                  | ~$112,500              | **$202,500** |
| **1,000,000** | ~$150,000                 | ~$112,500              | **$262,500** |

---

## Cost Optimization Strategies

### 1. Caching (High Impact)

**Cache transit times in the database** after first calculation.

- Same origin→destination pair reused = free
- Estimate: 60-80% cache hit rate for popular city routes
- **Potential savings: 60-80%**

### 2. Batch Requests (Medium Impact)

Google Routes API supports up to 25 origins × 25 destinations per request.

- Instead of 20 calls/trip → **1-2 calls/trip**
- **Potential savings: 90%+ on routing costs**

### 3. Hybrid Approach (Recommended)

| Distance   | Method                  | Cost        |
| ---------- | ----------------------- | ----------- |
| < 500m     | Haversine estimate      | Free        |
| 500m - 3km | Cached walking estimate | Free        |
| > 3km      | Google Routes API       | $0.005/call |

**Result: ~5 API calls/trip instead of 20**

### 4. Self-Hosted Routing (Advanced)

Use **OSRM** (Open Source Routing Machine) or **Valhalla**:

- Open-source, self-hosted routing
- One-time infrastructure cost
- **Per-API-call cost: $0.00**
- Trade-off: Setup complexity, hosting costs (~$50-200/month for server)

---

## Recommendation

| Scale       | Strategy                 | Est. Monthly Cost  |
| ----------- | ------------------------ | ------------------ |
| < 10K trips | Hybrid + caching         | **< $500**         |
| 10K-100K    | Batch requests + caching | **$1,000-5,000**   |
| 100K+       | Self-hosted OSRM         | **$200 (hosting)** |

### Quick Win: Route Factor Adjustment

Before adding API costs, we can improve accuracy **for free** by:

1. Applying 1.3-1.4x multiplier to Haversine distance (approximates road network)
2. Using more realistic speeds (Walking: 4.5 km/h, Driving: 25 km/h city average)
3. Adding 2-3 minute buffer for stoplights/crossings

**Estimated accuracy improvement: 70-80% of Google Maps accuracy at $0 cost.**

---

## Conclusion

| Approach                | Accuracy | Cost Impact          |
| ----------------------- | -------- | -------------------- |
| Current (Haversine)     | ~60-70%  | $0                   |
| Route factor adjustment | ~80-85%  | $0                   |
| Google API (cached)     | 95%+     | $0.05-0.10/trip      |
| Self-hosted OSRM        | 90-95%   | $100-200/month fixed |

**Recommendation:** Start with route factor adjustments (free), add Google API for high-value routes with aggressive caching. Move to self-hosted routing at 100K+ trips/month.
