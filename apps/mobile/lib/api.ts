import { Platform } from "react-native";
import { supabase } from "./supabase";

// Update this with machine's local IP when testing on physical device
export const API_URL = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
export const WEB_URL = "https://trip-vibes.vercel.app";

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function api<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log(`[MobileAPI] Calling ${endpoint}, Session: ${session ? "Active" : "None"}`);

  const config: RequestInit = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...headers,
    },
  };

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `API Error: ${response.statusText}`);
  }

  // Handle empty responses (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch (error) {
    // If response is not JSON, return text or throw
    return (await response.text()) as unknown as T;
  }
}
