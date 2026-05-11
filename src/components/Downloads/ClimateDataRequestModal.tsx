import { useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import {
  submitDataRequest,
  type ClimateDataRequestPayload,
  type ClimateDataRequestResponse,
} from "../../api/requests";

interface RequestDefaults {}

interface DistrictOption {
  id: string;
  name: string;
  region: string;
}

interface ClimateDataRequestModalProps {
  open: boolean;
  defaultValues: RequestDefaults;
  regionOptions: string[];
  districtOptions: DistrictOption[];
  onClose: () => void;
}

const DEFAULT_VARIABLE_OPTIONS = [
  "Average Annual Temperature",
  "Total Annual Rainfall",
  "Sea Level",
];

type ScenarioMode = "" | "historical" | "projection";
type GeographyType = "" | "ghana" | "region" | "district";
type ToastState = {
  type: "success" | "error";
  title: string;
  message: string;
};

const HISTORICAL_SCENARIO_OPTION = "Historical";

const RCP_SCENARIO_OPTIONS = ["RCP 2.6", "RCP 4.5", "RCP 8.5"];
const SSP_SCENARIO_OPTIONS = ["SSP1-2.6", "SSP2-4.5", "SSP5-8.5"];
const TIME_PERIOD_OPTIONS = ["REFERENCE", "2021-2040", "2041-2060", "2081-2100"];

const FORMAT_OPTIONS = ["CSV", "NetCDF", "GeoJSON", "Excel", "PDF report"];

const isSeaLevelRequestVariable = (value: string): boolean =>
  value.toLowerCase().includes("sea level");

const createInitialForm = (_defaults: RequestDefaults): ClimateDataRequestPayload => ({
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

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join("; ");
    }
    return error.message;
  }

  return error instanceof Error ? error.message : "Unable to submit request";
};

const getEmailWarningMessage = (result: ClimateDataRequestResponse): string | null => {
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

const ClimateDataRequestModal: React.FC<ClimateDataRequestModalProps> = ({
  open,
  defaultValues,
  regionOptions,
  districtOptions,
  onClose,
}) => {
  const [formData, setFormData] = useState<ClimateDataRequestPayload>(() =>
    createInitialForm(defaultValues),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ClimateDataRequestResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("");
  const [geographyType, setGeographyType] = useState<GeographyType>("");
  const [selectedGeographyValue, setSelectedGeographyValue] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const variableOptions = DEFAULT_VARIABLE_OPTIONS;
  const selectedVariables = formData.climate_variables;
  const hasSelectedVariables = selectedVariables.length > 0;
  const hasSeaLevelVariables = selectedVariables.some(isSeaLevelRequestVariable);
  const hasNonSeaLevelVariables = selectedVariables.some((item) => !isSeaLevelRequestVariable(item));
  const rcpScenarioOptions = hasNonSeaLevelVariables ? RCP_SCENARIO_OPTIONS : [];
  const sspScenarioOptions = hasSeaLevelVariables ? SSP_SCENARIO_OPTIONS : [];

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData(createInitialForm(defaultValues));
    setScenarioMode("");
    setGeographyType("");
    setSelectedGeographyValue("");
    setResult(null);
    setErrorMessage(null);
    setToast(null);
  }, [defaultValues, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose, open]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const isFormValid = useMemo(
    () =>
      formData.full_name.trim().length > 1 &&
      formData.email.trim().length > 4 &&
      formData.purpose.trim().length > 2 &&
      formData.geography.trim().length > 1 &&
      formData.time_period.trim().length > 1 &&
      formData.climate_variables.length > 0 &&
      formData.scenarios.length > 0 &&
      formData.preferred_format.trim().length > 1,
    [formData],
  );

  const updateField = (field: keyof ClimateDataRequestPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeographyTypeChange = (value: GeographyType) => {
    setGeographyType(value);
    setSelectedGeographyValue("");
    setFormData((prev) => ({
      ...prev,
      geography: value === "ghana" ? "Ghana" : "",
    }));
  };

  const handleGeographySelectionChange = (value: string) => {
    setSelectedGeographyValue(value);
    setFormData((prev) => ({ ...prev, geography: value }));
  };

  const toggleVariable = (value: string) => {
    setFormData((prev) => {
      const climateVariables = prev.climate_variables.includes(value)
        ? prev.climate_variables.filter((item) => item !== value)
        : [...prev.climate_variables, value];

      if (!climateVariables.length) {
        return { ...prev, climate_variables: [], scenarios: [] };
      }

      return {
        ...prev,
        climate_variables: climateVariables,
        scenarios: prev.scenarios.filter((scenario) => {
          if (scenario === HISTORICAL_SCENARIO_OPTION) return true;
          if (RCP_SCENARIO_OPTIONS.includes(scenario)) {
            return climateVariables.some((item) => !isSeaLevelRequestVariable(item));
          }
          if (SSP_SCENARIO_OPTIONS.includes(scenario)) {
            return climateVariables.some(isSeaLevelRequestVariable);
          }
          return false;
        }),
      };
    });
  };

  const toggleScenario = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      scenarios: prev.scenarios.includes(value)
        ? prev.scenarios.filter((item) => item !== value)
        : [...prev.scenarios, value],
    }));
  };

  useEffect(() => {
    if (formData.climate_variables.length === 0 && scenarioMode) {
      setScenarioMode("");
    }
  }, [formData.climate_variables.length, scenarioMode]);

  const handleScenarioModeChange = (mode: Exclude<ScenarioMode, "">) => {
    if (!hasSelectedVariables) {
      return;
    }

    setScenarioMode(mode);
    setFormData((prev) => ({
      ...prev,
      scenarios: mode === "historical" ? [HISTORICAL_SCENARIO_OPTION] : [],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submitDataRequest({
        ...formData,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        organization: formData.organization?.trim() || null,
        purpose: formData.purpose.trim(),
        geography: formData.geography.trim(),
        time_period: formData.time_period.trim(),
        preferred_format: formData.preferred_format.trim(),
      });
      setResult(response);
      setToast({
        type: "success",
        title: "Request submitted",
        message:
          response.email_status === "sent"
            ? "Confirmation email sent."
            : "Your request is saved for follow-up.",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setToast({
        type: "error",
        title: "Submission failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setFormData(createInitialForm(defaultValues));
    setScenarioMode("");
    setGeographyType("");
    setSelectedGeographyValue("");
    setResult(null);
    setErrorMessage(null);
    setToast(null);
  };

  if (!open) {
    return null;
  }

  const emailWasSent = result?.email_status === "sent";
  const emailWarning = result ? getEmailWarningMessage(result) : null;

  return (
    <div
      className="data-request-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        className="data-request-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-request-title"
      >
        <button
          type="button"
          className="data-request-close"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close data request form"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {toast && (
          <div
            className={`data-request-toast ${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
          >
            <div className="data-request-toast-icon" aria-hidden="true">
              {toast.type === "success" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </div>
            <div className="data-request-toast-copy">
              <strong>{toast.title}</strong>
              <span>{toast.message}</span>
            </div>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {result ? (
          <div className="data-request-success">
            <div className="data-request-status-panel">
              <div className="data-request-status-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <p className="data-request-eyebrow">Request received</p>
              <h2 id="data-request-title">Climate data request submitted</h2>
              {emailWasSent ? (
                <p>
                  A confirmation email was sent to <strong>{formData.email}</strong>.
                </p>
              ) : (
                <p>Your request was saved. Keep this Request ID for follow-up.</p>
              )}
            </div>

            <div className="data-request-result-panel">
              <div className="data-request-id-card">
                <span>Request ID</span>
                <strong>{result.request_id}</strong>
              </div>
              {emailWarning && (
                <div className="data-request-warning" role="status">
                  {emailWarning}
                </div>
              )}
              <div className="data-request-actions">
                <button type="button" className="data-request-secondary-btn" onClick={handleSubmitAnother}>
                  Submit another request
                </button>
                <button type="button" className="data-request-primary-btn" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="data-request-landscape">
            <div className="data-request-header">
              <div className="modal-section">
                <h4>Request Type</h4>
                <p className="modal-highlight">Climate Data Package</p>
                <p className="modal-section-desc">
                  Submit dataset details for download access.
                </p>
              </div>

              <div className="modal-section">
                <h4>Email Notification</h4>
                <p className="modal-highlight">Confirmation Required</p>
                <p className="modal-section-desc">
                  Your request ID is sent to your email.
                </p>
              </div>

              <div className="modal-divider" />

              <div className="modal-section-parameter">
                <h3 className="modal-param-name">Climate Data Request</h3>
                <p className="modal-short-desc">
                  Request a prepared climate data package.
                </p>
              </div>
            </div>

            <form className="data-request-form" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 id="data-request-title">Request download access</h2>
              </div>

              <div className="data-request-form-columns">
                <div className="data-request-column">
                  <div className="data-request-grid two-columns">
                    <label>
                      <span>Full name *</span>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(event) => updateField("full_name", event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      <span>Email *</span>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <label>
                    <span>Organization / institution</span>
                    <input
                      type="text"
                      value={formData.organization || ""}
                      onChange={(event) => updateField("organization", event.target.value)}
                    />
                  </label>

                  <label>
                    <span>Request purpose *</span>
                    <textarea
                      value={formData.purpose}
                      onChange={(event) => updateField("purpose", event.target.value)}
                      rows={2}
                      required
                    />
                  </label>

                  <div className="data-request-grid two-columns">
                    <label>
                      <span>Geography type *</span>
                      <select
                        value={geographyType}
                        onChange={(event) => handleGeographyTypeChange(event.target.value as GeographyType)}
                        required
                      >
                        <option value="">Select type</option>
                        <option value="ghana">Ghana</option>
                        <option value="region">Region</option>
                        <option value="district">District</option>
                      </select>
                    </label>

                    <label>
                      <span>Time period needed *</span>
                      <select
                        value={formData.time_period}
                        onChange={(event) => updateField("time_period", event.target.value)}
                        required
                      >
                        <option value="">Select time period</option>
                        {TIME_PERIOD_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {geographyType === "region" && (
                    <label>
                      <span>Region *</span>
                      <select
                        value={selectedGeographyValue}
                        onChange={(event) => handleGeographySelectionChange(event.target.value)}
                        required
                      >
                        <option value="">Select region</option>
                        {regionOptions.map((region) => (
                          <option key={region} value={`Region: ${region}`}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {geographyType === "district" && (
                    <label>
                      <span>District *</span>
                      <select
                        value={selectedGeographyValue}
                        onChange={(event) => handleGeographySelectionChange(event.target.value)}
                        required
                      >
                        <option value="">Select district</option>
                        {districtOptions.map((district) => {
                          const value = `District: ${district.name}, ${district.region}`;
                          return (
                            <option key={district.id} value={value}>
                              {district.name} - {district.region}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  )}
                </div>

                <div className="data-request-column">
                  <fieldset className="data-request-section">
                    <legend>Climate variables *</legend>
                    <div className="data-request-chip-grid">
                      {variableOptions.map((option) => (
                        <label key={option} className="data-request-chip">
                          <input
                            type="checkbox"
                            checked={formData.climate_variables.includes(option)}
                            onChange={() => toggleVariable(option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {hasSelectedVariables && (
                    <fieldset className="data-request-section">
                      <legend>Scenarios *</legend>
                      <div className="data-request-scenario-toggle" role="group" aria-label="Scenario type">
                        <button
                          type="button"
                          className={`data-request-toggle-option ${scenarioMode === "historical" ? "active" : ""}`}
                          onClick={() => handleScenarioModeChange("historical")}
                          aria-pressed={scenarioMode === "historical"}
                        >
                          Historical
                        </button>
                        <button
                          type="button"
                          className={`data-request-toggle-option ${scenarioMode === "projection" ? "active" : ""}`}
                          onClick={() => handleScenarioModeChange("projection")}
                          aria-pressed={scenarioMode === "projection"}
                        >
                          Projections
                        </button>
                      </div>

                      {scenarioMode === "historical" && (
                        <div className="data-request-scenario-panel">
                          <div className="data-request-selected-scenario" role="status">
                            <span className="data-request-selected-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            </span>
                            <span>Historical baseline</span>
                          </div>
                        </div>
                      )}

                      {scenarioMode === "projection" && (
                        <div className="data-request-scenario-panel">
                          {rcpScenarioOptions.length > 0 && (
                            <div className="data-request-scenario-group">
                              <span>RCP scenarios</span>
                              <div className="data-request-chip-grid">
                                {rcpScenarioOptions.map((option) => (
                                  <label key={option} className="data-request-chip">
                                    <input
                                      type="checkbox"
                                      checked={formData.scenarios.includes(option)}
                                      onChange={() => toggleScenario(option)}
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {sspScenarioOptions.length > 0 && (
                            <div className="data-request-scenario-group">
                              <span>SSP scenarios</span>
                              <div className="data-request-chip-grid">
                                {sspScenarioOptions.map((option) => (
                                  <label key={option} className="data-request-chip">
                                    <input
                                      type="checkbox"
                                      checked={formData.scenarios.includes(option)}
                                      onChange={() => toggleScenario(option)}
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </fieldset>
                  )}

                  <div className="data-request-grid">
                    <label>
                      <span>Preferred format *</span>
                      <select
                        value={formData.preferred_format}
                        onChange={(event) => updateField("preferred_format", event.target.value)}
                        required
                      >
                        <option value="">Select format</option>
                        {FORMAT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="data-request-error" role="alert">
                  {errorMessage}
                </div>
              )}

              <div className="data-request-actions">
                <button
                  type="button"
                  className="data-request-secondary-btn"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="data-request-primary-btn"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>

            <button type="button" className="modal-return data-request-return" onClick={onClose}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Return to the map</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ClimateDataRequestModal;
