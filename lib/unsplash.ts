"use server";

import axios from "axios";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_API_ACCESS_KEY;

export async function getRandomImageForCategory(category: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("UNSPLASH_API_ACCESS_KEY is missing");
    return "";
  }

  try {
    const response = await axios.get("https://api.unsplash.com/photos/random", {
      params: {
        query: category,
        orientation: "landscape",
        content_filter: "high",
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const url = response.data?.urls?.regular;
    return url || "";
  } catch (error) {
    console.error("Unsplash fetch error:", error);
    return "";
  }
}
