import axios from "axios";
import { API_BASE } from "./climate";
import type { AtlasNewsFeed } from "../types/news";

const newsApi = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const LATEST_UPDATES_LIMIT = 6;

export const fetchLatestUpdates = async (
  limit: number = LATEST_UPDATES_LIMIT,
): Promise<AtlasNewsFeed> => {
  const response = await newsApi.get<AtlasNewsFeed>("/news/latest", {
    params: { limit },
  });
  return response.data;
};
