// Climate Atlas updates scraped from meteo.gov.gh by the backend.

import { useQuery } from "@tanstack/react-query";
import { fetchLatestUpdates, LATEST_UPDATES_LIMIT } from "../api/news";

// The backend keeps its own copy warm and refreshes roughly every 20 minutes, so
// the client only needs to re-check often enough that a tab left open on the
// Overview page picks up a new GMet post without a manual reload.
export const useLatestUpdates = (limit: number = LATEST_UPDATES_LIMIT) =>
  useQuery({
    queryKey: ["atlas-news", limit],
    queryFn: () => fetchLatestUpdates(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 10 * 60 * 1000,
    // A backgrounded tab should cost nothing.
    refetchIntervalInBackground: false,
  });
