import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// Try to load from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function searchGoogleCities(query: string) {
  if (!GOOGLE_PLACES_API_KEY) return [];
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", {
      params: {
        input: query,
        types: "(cities)",
        key: GOOGLE_PLACES_API_KEY,
      },
    });
    return response.data.predictions || [];
  } catch (error) {
    return [];
  }
}

async function getGooglePlaceDetails(placeId: string) {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    console.log(`Fetching details for ID: ${placeId}`);
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: placeId,
        fields: "name,formatted_address,geometry,address_components",
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    console.log("Details Status:", response.data.status);
    if (response.data.status !== "OK") {
      console.error("Google Place Details error:", response.data);
      return null;
    }
    return response.data.result;
  } catch (error) {
    console.error("Error getting Google Place details:", error);
    return null;
  }
}

// Test Flow
async function test() {
  console.log("--- Searching ---");
  const results = await searchGoogleCities("Tokyo");
  if (results.length === 0) {
    console.log("No results found.");
    return;
  }

  const first = results[0];
  console.log(`Found: ${first.description} (${first.place_id})`);

  console.log("--- Getting Details ---");
  const details = await getGooglePlaceDetails(first.place_id);
  console.log("Details found?", !!details);
  if (details) {
    console.log("Name:", details.name);
    const country = details.address_components.find((c: any) => c.types.includes("country"));
    console.log("Country:", country?.long_name);
  }
}

test();
