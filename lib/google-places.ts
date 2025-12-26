import axios from "axios";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function searchGoogleCities(query: string) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("GOOGLE_PLACES_API_KEY missing");
    return [];
  }

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", {
      params: {
        input: query,
        types: "(cities)",
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      console.error("Google Places Autocomplete error:", response.data);
      return [];
    }

    return response.data.predictions || [];
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return [];
  }
}

export async function getGooglePlaceDetails(placeId: string) {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: placeId,
        fields: "name,formatted_address,geometry,address_components",
        key: GOOGLE_PLACES_API_KEY,
      },
    });

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
