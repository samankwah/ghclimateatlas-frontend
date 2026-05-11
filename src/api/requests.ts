import axios from "axios";
import { API_BASE } from "./climate";

export interface ClimateDataRequestPayload {
  full_name: string;
  email: string;
  organization?: string | null;
  purpose: string;
  geography: string;
  time_period: string;
  climate_variables: string[];
  scenarios: string[];
  preferred_format: string;
  additional_notes?: string | null;
}

export interface ClimateDataRequestResponse {
  request_id: string;
  submitted_at: string;
  status: string;
  email_status: "sent" | "failed" | string;
  warning?: string | null;
}

const requestsApi = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export const submitDataRequest = async (
  payload: ClimateDataRequestPayload,
): Promise<ClimateDataRequestResponse> => {
  const response = await requestsApi.post<ClimateDataRequestResponse>("/requests", payload);
  return response.data;
};
