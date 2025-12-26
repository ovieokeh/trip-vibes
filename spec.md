Project: TripVibes (Working Title)

The Objective: A travel planning app that converts aesthetic preferences into a geographically optimized, ready-to-book daily schedule.

1. The Core Problem

Most travel apps are "Bucket Lists." They help you find things, but they don't help you order them. Users spend hours jumping between Instagram (inspiration), Google Maps (logistics), and Booking.com (transaction). The friction leads to "Planning Paralysis."

2. The Functional Loop

The system operates in three distinct phases: Extraction, Optimization, and Verification.

Phase A: The Extraction (The Swipe)

Instead of asking for specific museums, the app presents a high-speed "Vibe Check."

Inputs: Destination, Dates, and Budget.

The Interaction: 20-30 cards showing "Atmospheres" (e.g., "Dark Academia Libraries," "Neon Street Food," "Hidden Brutalist Architecture," "Quiet Canal Walks").

Logic: The app isn't just tagging "Museums"; it’s building a weighted interest profile. If you swipe right on three "Dimly lit bars," the system weights "Speakeasy" higher than "Nightclub."

Phase B: The Optimization (The Brain)

This is where Vera's idea becomes a business. The system takes the "Liked" interests and crosses them with a real-time database of the destination.

Geographic Clustering: It groups liked activities by neighborhood (e.g., keeping all "De Pijp" activities together).

Time-Slotting: It assigns activities based on logic (e.g., "Parks" in the morning, "Bars" at night, "Museums" during mid-day heat).

Transit Buffer: It automatically calculates the 15–20 minute walk or tram ride between stops. If a schedule requires more than 60 minutes of travel in a day, it flags a "Logistical Conflict" and asks the user to choose a favorite.

Phase C: The Verification (The Outcome)

The user receives a "Day View" that looks like a calendar, not a list.

The "Live" Itinerary: Each block includes an "Alternative" (e.g., "If you're tired of walking, here is a nearby cafe").

One-Click Booking: Affiliate links for tickets (Tiqets/GetYourGuide) and table reservations.

3. The Minimum Viable System (MVS)

To test this in 30 days, we don't build a native app. We build a Web-App with the following stack:

Frontend: A simple "Card Stack" UI (React/Tailwind).

Logic Layer: A LLM (Gemini 2.5 Flash) acting as the "Architect." It receives the "Swipes" and the "Map Data" and returns a structured JSON itinerary.

Database: A curated list of the top 50 "Vibes" for 5 major cities (Amsterdam, Paris, London, Berlin, Barcelona).

4. Why This Succeeds Where Others Fail

Low Barrier to Entry: Swiping is fun and low-stakes. Filling out a 10-page "Preference Survey" is work.

Spatial Integrity: By including distance calculations, the app provides a schedule that is actually breathable.

Monetization is Native: The app doesn't need ads. It makes money when the user buys the ticket for the museum they just swiped right on.

5. Logical Risks to Solve

The "Tourist Trap" Problem: If the app only shows the most popular spots, it's just a digital brochure. The "Vibe" cards must include "Deep Cuts" (local favorites) to maintain high-value retention.

Weather Sensitivity: A "Walking Tour" swipe should be automatically swapped for an indoor activity if the forecast predicts rain.
