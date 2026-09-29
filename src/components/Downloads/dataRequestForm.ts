import axios from "axios";
import type {
  ClimateDataRequestPayload,
  ClimateDataRequestResponse,
} from "../../api/requests";

export const CLIMATE_VARIABLE_OPTIONS = [
  "Average Annual Temperature",
  "Total Annual Rainfall",
  "Sea Level",
] as const;

export const HISTORICAL_SCENARIO_OPTION = "Historical";
export const RCP_SCENARIO_OPTIONS = ["RCP 2.6", "RCP 4.5", "RCP 8.5"] as const;
export const SSP_SCENARIO_OPTIONS = ["SSP1-2.6", "SSP2-4.5", "SSP5-8.5"] as const;
export const TIME_PERIOD_OPTIONS = ["REFERENCE", "2021-2040", "2041-2060", "2081-2100"] as const;
export const FORMAT_OPTIONS = ["CSV", "NetCDF", "GeoJSON", "Excel", "PDF report"] as const;

export type ScenarioMode = "" | "historical" | "projection";
export type GeographyType = "" | "ghana" | "region" | "district";
export type DataRequestValidationField =
  | "full_name"
  | "email"
  | "purpose"
  | "geography_type"
  | "geography"
  | "time_period"
  | "climate_variables"
  | "scenarios"
  | "preferred_format";

export type DataRequestValidationErrors = Partial<
  Record<DataRequestValidationField, string>
>;

export type DataRequestSubmissionError = {
  message: string;
  fieldErrors: DataRequestValidationErrors;
};

export interface DataRequestDistrictOption {
  id: string;
  name: string;
  region: string;
}

export interface DataRequestGeographyOptions {
  regionOptions: string[];
  districtOptions: DataRequestDistrictOption[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYLOAD_FIELD_NAMES = new Set<DataRequestValidationField>([
  "full_name",
  "email",
  "purpose",
  "geography",
  "time_period",
  "climate_variables",
  "scenarios",
  "preferred_format",
]);

export const isSeaLevelRequestVariable = (value: string): boolean =>
  value.toLowerCase().includes("sea level");

export const getGeographyForType = (value: GeographyType): string =>
  value === "ghana" ? "Ghana" : "";

export const buildDataRequestGeographyOptions = (
  districts: DataRequestDistrictOption[],
): DataRequestGeographyOptions => {
  const districtOptions = [...districts].sort(
    (a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name),
  );
  const regionOptions = Array.from(
    new Set(districtOptions.map(({ region }) => region).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  return { regionOptions, districtOptions };
};

export const createInitialDataRequestForm = (): ClimateDataRequestPayload => ({
  full_name: "",
  email: "",
  organization: "",
  purpose: "",
  geography: "",
  time_period: "",
  climate_variables: [],
  scenarios: [],
  preferred_format: "",
});

const normalizeList = (values: string[]): string[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

export const normalizeDataRequestPayload = (
  payload: ClimateDataRequestPayload,
): ClimateDataRequestPayload => {
  const normalized: ClimateDataRequestPayload = {
    ...payload,
    full_name: payload.full_name.trim(),
    email: payload.email.trim(),
    organization: payload.organization?.trim() || null,
    purpose: payload.purpose.trim(),
    geography: payload.geography.trim(),
    time_period: payload.time_period.trim(),
    climate_variables: normalizeList(payload.climate_variables),
    scenarios: normalizeList(payload.scenarios),
    preferred_format: payload.preferred_format.trim(),
  };

  if (payload.additional_notes !== undefined) {
    normalized.additional_notes = payload.additional_notes?.trim() || null;
  }

  return normalized;
};

export const getCompatibleScenarioOptions = (climateVariables: string[]) => ({
  rcp: climateVariables.some((item) => !isSeaLevelRequestVariable(item))
    ? [...RCP_SCENARIO_OPTIONS]
    : [],
  ssp: climateVariables.some(isSeaLevelRequestVariable)
    ? [...SSP_SCENARIO_OPTIONS]
    : [],
});

export const filterCompatibleScenarios = (
  scenarios: string[],
  climateVariables: string[],
): string[] => {
  if (climateVariables.length === 0) {
    return [];
  }

  const { rcp, ssp } = getCompatibleScenarioOptions(climateVariables);
  const compatible = new Set<string>([
    HISTORICAL_SCENARIO_OPTION,
    ...rcp,
    ...ssp,
  ]);
  return scenarios.filter((scenario) => compatible.has(scenario));
};

export const validateDataRequest = (
  payload: ClimateDataRequestPayload,
  geographyType: GeographyType,
  scenarioMode: ScenarioMode,
): DataRequestValidationErrors => {
  const normalized = normalizeDataRequestPayload(payload);
  const errors: DataRequestValidationErrors = {};

  if (normalized.full_name.length < 2) {
    errors.full_name = "Enter your full name.";
  }
  if (!EMAIL_PATTERN.test(normalized.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (normalized.purpose.length < 3) {
    errors.purpose = "Describe how you plan to use the data.";
  }
  if (!geographyType) {
    errors.geography_type = "Choose a geography type.";
  } else if (!normalized.geography) {
    errors.geography = `Choose a ${geographyType}.`;
  }
  if (!TIME_PERIOD_OPTIONS.includes(normalized.time_period as (typeof TIME_PERIOD_OPTIONS)[number])) {
    errors.time_period = "Choose a time period.";
  }

  const supportedVariables = new Set<string>(CLIMATE_VARIABLE_OPTIONS);
  if (
    normalized.climate_variables.length === 0 ||
    normalized.climate_variables.some((variable) => !supportedVariables.has(variable))
  ) {
    errors.climate_variables = "Choose at least one climate variable.";
  }

  if (normalized.climate_variables.length > 0) {
    const compatibleScenarios = new Set(
      filterCompatibleScenarios(
        [HISTORICAL_SCENARIO_OPTION, ...RCP_SCENARIO_OPTIONS, ...SSP_SCENARIO_OPTIONS],
        normalized.climate_variables,
      ),
    );
    const modeIsCompatible =
      (scenarioMode === "historical" &&
        normalized.scenarios.length === 1 &&
        normalized.scenarios[0] === HISTORICAL_SCENARIO_OPTION) ||
      (scenarioMode === "projection" &&
        normalized.scenarios.length > 0 &&
        normalized.scenarios.every((scenario) => compatibleScenarios.has(scenario)) &&
        !normalized.scenarios.includes(HISTORICAL_SCENARIO_OPTION));

    if (!modeIsCompatible) {
      errors.scenarios = "Choose a historical or compatible projection scenario.";
    }
  }

  if (!FORMAT_OPTIONS.includes(normalized.preferred_format as (typeof FORMAT_OPTIONS)[number])) {
    errors.preferred_format = "Choose a preferred format.";
  }

  return errors;
};

export const getDataRequestSubmissionError = (error: unknown): DataRequestSubmissionError => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return { message: detail, fieldErrors: {} };
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const fieldErrors: DataRequestValidationErrors = {};
      const messages = detail.flatMap((item) => {
        const message = typeof item?.msg === "string" ? item.msg : "";
        const location = Array.isArray(item?.loc) ? item.loc : [];
        const field = [...location]
          .reverse()
          .find((part): part is DataRequestValidationField =>
            typeof part === "string" && PAYLOAD_FIELD_NAMES.has(part as DataRequestValidationField),
          );
        if (field && message) {
          fieldErrors[field] = message;
        }
        return message ? [message] : [];
      });
      return {
        message: messages.join("; ") || "Please review the highlighted fields.",
        fieldErrors,
      };
    }
    return { message: error.message || "Unable to submit request", fieldErrors: {} };
  }

  return {
    message: error instanceof Error ? error.message : "Unable to submit request",
    fieldErrors: {},
  };
};

export const getDataRequestEmailWarning = (
  result: ClimateDataRequestResponse,
): string | null => {
  if (result.email_status === "sent") {
    return null;
  }

  const warning = result.warning?.trim();
  if (!warning) {
    return "Email confirmation is currently unavailable. Your request is saved.";
  }

  const lowerWarning = warning.toLowerCase();
  if (
    lowerWarning.includes("smtp") ||
    lowerWarning.includes("not configured") ||
    lowerWarning.includes("could not be sent")
  ) {
    return "Email confirmation is currently unavailable. Your request is saved.";
  }

  return warning;
};
