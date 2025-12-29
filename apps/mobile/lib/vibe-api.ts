import EventSource, { EventSourceListener } from "react-native-sse";
import { Itinerary } from "@trip-vibes/shared";
import { api, API_URL } from "./api";
import { supabase } from "./supabase";

export interface StreamProgress {
  type: "progress";
  key: string;
  step?: string;
  params?: Record<string, unknown>;
}

export function generateItineraryStream(
  params: {
    cityId: string;
    vibes: string[];
    startDate: string; // ISO
    endDate: string; // ISO
    budget: "low" | "medium" | "high";
  },
  callbacks: {
    onProgress: (progress: StreamProgress) => void;
    onResult: (itinerary: Itinerary) => void;
    onError: (error: Error) => void;
  }
) {
  let es: EventSource | null = null;

  // Construct URL with query params
  // The backend expects 'prefs' as a JSON string in query param
  const prefs = {
    cityId: params.cityId,
    likedVibes: params.vibes,
    startDate: params.startDate,
    endDate: params.endDate,
    budget: params.budget,
    locale: "en",
  };

  const query = encodeURIComponent(JSON.stringify(prefs));

  // Determine headers synchronously if possible, but getSession is async.
  // We need to wrap this in an async init function or just promise-chain.
  // However, returning a cancel function synchronously is nice.
  // We'll trust that getSession is fast enough or handle it.

  const start = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const url = `${API_URL}/api/itinerary/stream?prefs=${query}`;

      es = new EventSource(url, {
        headers: {
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
      });

      const listener: EventSourceListener = (event) => {
        if (event.type === "open") {
          console.log("Connection opened");
        } else if (event.type === "message") {
          // Parse data
          try {
            const payload = JSON.parse(event.data || "{}");

            if (payload.type === "progress") {
              callbacks.onProgress(payload);
            } else if (payload.type === "result") {
              callbacks.onResult(payload.data);
              es?.close();
            } else if (payload.type === "error") {
              callbacks.onError(new Error(payload.message || "Unknown stream error"));
              es?.close();
            }
          } catch (e) {
            console.error("Failed to parse SSE message", e);
          }
        } else if (event.type === "error") {
          console.error("SSE connection error:", event.message);
          callbacks.onError(new Error(event.message || "Connection error"));
          es?.close();
        }
      };

      es.addEventListener("open", listener);
      es.addEventListener("message", listener);
      es.addEventListener("error", listener);
    } catch (err) {
      callbacks.onError(err as Error);
    }
  };

  start();

  // Return cleanup function
  return () => {
    es?.close();
  };
}

export async function getItinerary(id: string) {
  if (id === "mock-id") {
    return MOCK_ITINERARY;
  }

  try {
    return await api<Itinerary>(`/api/itinerary/${id}`);
  } catch (error) {
    console.error("Get Itinerary Error:", error);
    if (__DEV__) return MOCK_ITINERARY;
    throw error;
  }
}

const MOCK_ITINERARY = {
  id: "mock-id",
  cityId: "amsterdam",
  createdAt: new Date().toISOString(),
  days: [
    {
      id: "day-1",
      dayNumber: 1,
      date: new Date().toISOString(),
      neighborhood: "Jordaan & Center",
      activities: [
        {
          id: "a1",
          startTime: "10:00",
          endTime: "11:30",
          note: "Start with a coffee at a local favorite.",
          vibe: {
            id: "vibe-w43",
            cityId: "amsterdam",
            tags: ["food", "cafe"],
            title: "Winkel 43",
            category: "food",
            description: "Famous apple pie.",
            imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
          },
        },
        {
          id: "a2",
          startTime: "12:00",
          endTime: "14:00",
          note: "Walk through the canals.",
          vibe: {
            id: "vibe-pg2",
            cityId: "amsterdam",
            tags: ["walk", "scenic"],
            title: "Prinsengracht Walk",
            category: "hidden-gem",
            description: "Scenic canal route.",
            imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
          },
        },
      ],
    },
  ],
};

export async function getUserItineraries() {
  try {
    return await api<Itinerary[]>("/api/itinerary/list");
  } catch (error) {
    console.error("Get User Itineraries Error:", error);
    if (__DEV__) return [MOCK_ITINERARY]; // Return mock for now
    return [];
  }
}
