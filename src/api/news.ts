import axios from "axios";
import { API_BASE } from "./climate";
import type { AtlasNewsFeed } from "../types/news";

const newsApi = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// The Overview carousel shows the four newest on-topic updates.
export const LATEST_UPDATES_LIMIT = 4;

export const fetchLatestUpdates = async (
  limit: number = LATEST_UPDATES_LIMIT,
): Promise<AtlasNewsFeed> => {
  const response = await newsApi.get<AtlasNewsFeed>("/news/latest", {
    params: { limit },
  });
  return response.data;
};
