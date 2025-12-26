TripVibes: Data Acquisition & Triangulation Strategy

To solve the "Tourist Trap" problem and provide a geographically sound itinerary, the system requires a multi-layered data architecture. We must prioritize high-signal, low-noise sources that capture the "soul" of a city rather than just its "popularity."

1. The "Signal" Layer (Vibe Extraction)

Goal: Source the aesthetic cards that the user swipes on.

Atlas Obscura API: This is the primary antidote to the tourist trap. It provides data on non-obvious, "wonder-based" locations (e.g., a hidden medical museum or an abandoned metro station).

Instagram Graph API (Location Search): We don't use this for reviews; we use it for Visual Cluster Analysis. By analyzing which locations have a high density of "Aesthetic" tags (e.g., #brutalism, #midcenturymodern) but low total geotag volume, we can identify "Deep Cuts."

Pinterest Trends: To understand the "Atmospheres" people are currently romanticizing (e.g., "European Summer," "Old Money Library"). This informs the imagery on the swiping cards.

2. The "Truth" Layer (Geospatial & Temporal Logic)

Goal: Ensure the itinerary is physically possible and time-appropriate.

Google Places API (Advanced Fields): Specifically for opening_hours and popular_times.

Systemic Logic: If a user swipes right on a "Quiet Coffee Shop," but the data shows it peaks at 10:00 AM, the architect should schedule it for 8:30 AM or 3:00 PM.

OpenStreetMap (OSM) / Overpass API: Unlike Google, OSM provides granular data on "Micro-mapping" like pedestrian-only streets, stairs, and park paths. This is essential for calculating the "Transit Buffer" mentioned in the spec.

Foursquare (Places API): Foursquare remains superior for "Tastes." It allows us to query for specific attributes like "Cozy," "Good for reading," or "Hidden gem" which are harder to extract from Google’s generic labels.

3. The "Context" Layer (Live Optimization)

Goal: Adapt to the immediate environment.

OpenWeatherMap API: To trigger the "Weather Sensitivity" logic. If rain is predicted, the system must prioritize indoor "liked" vibes (Museums/Cafes) over outdoor ones (Parks/Bridges).

Citymapper / Transit APIs: Real-time data for public transport. If a tram line in Amsterdam is under construction, the "Transit Buffer" logic must automatically pivot to walking or cycling routes.

4. The "Anti-Tourist" Algorithm (The Logic Filter)

To mathematically avoid tourist traps, we implement a "Popularity-to-Sentiment" Ratio:

$$Signal = \frac{Avg. Rating}{Total Number of Reviews}$$

Logic: A place with a 4.8 rating and 50,000 reviews is a "Trap." A place with a 4.8 rating and 120 reviews is a "Gem."

Implementation: The LLM "Architect" is instructed to prefer locations where the review count is below a certain percentile for that city, provided the rating remains high.

5. Monetization Data (The Transaction)

Affiliate Integration: \* GetYourGuide / Tiqets: For ticketed activities.

TheFork / OpenTable: For dining reservations.

Skyscanner / Booking.com: For "Top of Funnel" trip details.

Summary of Data Flow

Vibe Cards: Generated from Atlas Obscura + Instagram Aesthetic clusters.

Swipes: Stored as a weighted vector (e.g., Architecture: 0.8, Nature: 0.2).

Optimization: Foursquare/OSM/Google cross-reference the vector against real-world coordinates and opening times.

Final Output: A JSON itinerary validated against Weather and Transit APIs.
