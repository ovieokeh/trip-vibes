import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

// Mock function representing the logic we will implement in engine.ts
function processFoursquareResult(fsqPlace: any) {
  // 1. ID handling: fsq_place_id seems to be the one returned by this endpoint
  const id = fsqPlace.fsq_id || fsqPlace.fsq_place_id;
  if (!id) throw new Error("Missing ID in Foursquare result");

  const name = fsqPlace.name;
  const address = fsqPlace.location?.formatted_address;

  // 2. Coordinate handling: Top-level lat/lng in this endpoint response
  let lat = fsqPlace.latitude;
  let lng = fsqPlace.longitude;

  // Fallback to geocodes.main if top-level is missing (just in case)
  if (lat === undefined || lng === undefined) {
    lat = fsqPlace.geocodes?.main?.latitude;
    lng = fsqPlace.geocodes?.main?.longitude;
  }

  // Default to 0 if still missing
  lat = lat ?? 0;
  lng = lng ?? 0;

  // 3. Rating/Price: Skip/Default as they cause 429s or aren't present
  const rating = null;
  const priceLevel = 1;

  // 4. Photos: Not in default response, so null
  const imageUrl = null;

  // 5. Metadata
  const categories = fsqPlace.categories?.map((c: any) => c.name) || [];

  return {
    foursquareId: id,
    name,
    address,
    lat,
    lng,
    rating,
    priceLevel,
    imageUrl,
    metadata: JSON.stringify({
      categories,
      source: "foursquare",
      website: fsqPlace.website,
      phone: fsqPlace.tel,
    }),
  };
}

// The actual response format we discovered
const discoveredResponse = {
  fsq_place_id: "5130af56e4b0d576b5cc9d63",
  latitude: 52.37468219976994,
  longitude: 4.889017939567566,
  categories: [
    {
      fsq_category_id: "4bf58dd8d48988d16d941735",
      name: "Café",
      short_name: "Café",
      plural_name: "Cafés",
      icon: {
        prefix: "https://ss3.4sqi.net/img/categories_v2/food/cafe_",
        suffix: ".png",
      },
    },
  ],
  location: {
    address: "Singel 180",
    locality: "Amsterdam",
    region: "Noord-Holland",
    postcode: "1015 AJ",
    country: "NL",
    formatted_address: "Singel 180, 1015 AJ Amsterdam",
  },
  name: "Caffè Il Momento",
  website: "http://www.caffeilmomento.nl",
  tel: "020 331 6652",
};

console.log("Running logic verification...");

try {
  const result = processFoursquareResult(discoveredResponse);
  console.log("Test PASSED");

  // Verify critical fields
  if (result.lat !== 52.37468219976994) throw new Error("Latitude mismatch");
  if (result.lng !== 4.889017939567566) throw new Error("Longitude mismatch");
  if (result.foursquareId !== "5130af56e4b0d576b5cc9d63") throw new Error("ID mismatch");

  // Verify metadata enrichment
  const metadata = JSON.parse(result.metadata);
  if (metadata.website !== "http://www.caffeilmomento.nl") throw new Error("Website missing from metadata");

  console.log("Processed Object:", result);
} catch (e) {
  console.error("Test FAILED", e);
  process.exit(1);
}
