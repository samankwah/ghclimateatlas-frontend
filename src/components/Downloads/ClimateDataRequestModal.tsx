import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  submitDataRequest,
  type ClimateDataRequestPayload,
  type ClimateDataRequestResponse,
} from "../../api/requests";
import {
  CLIMATE_VARIABLE_OPTIONS,
  FORMAT_OPTIONS,
  HISTORICAL_SCENARIO_OPTION,
  TIME_PERIOD_OPTIONS,
  createInitialDataRequestForm,
  filterCompatibleScenarios,
  getCompatibleScenarioOptions,
  getDataRequestEmailWarning,
  getDataRequestSubmissionError,
  getGeographyForType,
  normalizeDataRequestPayload,
  validateDataRequest,
  type DataRequestValidationErrors,
  type DataRequestValidationField,
  type DataRequestDistrictOption,
  type GeographyType,
  type ScenarioMode,
} from "./dataRequestForm";
import "./ClimateDataRequestModal.css";

interface ClimateDataRequestModalProps {
  open: boolean;
  regionOptions: string[];
  districtOptions: DataRequestDistrictOption[];
  geographyOptionsLoading?: boolean;
  geographyOptionsError?: boolean;
  onClose: () => void;
}

type ToastState = {
  type: "success" | "error";
  title: string;
  message: string;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const ClimateDataRequestModal: React.FC<ClimateDataRequestModalProps> = ({
  open,
  regionOptions,
  districtOptions,
  geographyOptionsLoading = false,
  geographyOptionsError = false,
  onClose,
}) => {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const submissionInFlightRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [formData, setFormData] = useState<ClimateDataRequestPayload>(
    createInitialDataRequestForm,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ClimateDataRequestResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<DataRequestValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<DataRequestValidationField, boolean>>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("");
  const [geographyType, setGeographyType] = useState<GeographyType>("");
  const [selectedGeographyValue, setSelectedGeographyValue] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  const selectedVariables = formData.climate_variables;
  const hasSelectedVariables = selectedVariables.length > 0;
  const geographyOptionsUnavailable =
    geographyOptionsLoading || geographyOptionsError || districtOptions.length === 0;
  const { rcp: rcpScenarioOptions, ssp: sspScenarioOptions } = useMemo(
    () => getCompatibleScenarioOptions(selectedVariables),
    [selectedVariables],
  );
  const validationErrors = useMemo(
    () => validateDataRequest(formData, geographyType, scenarioMode),
    [formData, geographyType, scenarioMode],
  );

  onCloseRef.current = onClose;
  isSubmittingRef.current = isSubmitting;

  const resetForm = useCallback(() => {
    submissionInFlightRef.current = false;
    isSubmittingRef.current = false;
    setFormData(createInitialDataRequestForm());
    setIsSubmitting(false);
    setScenarioMode("");
    setGeographyType("");
    setSelectedGeographyValue("");
    setResult(null);
    setErrorMessage(null);
    setServerFieldErrors({});
    setTouchedFields({});
    setSubmittedOnce(false);
    setToast(null);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    const bodyAlreadyMarkedOpen = document.body.classList.contains("data-request-modal-open");
    document.body.classList.add("data-request-modal-open");
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isSubmittingRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (!bodyAlreadyMarkedOpen) {
        document.body.classList.remove("data-request-modal-open");
      }
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("#data-request-title")?.focus();
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [result]);

  const updateField = (field: keyof ClimateDataRequestPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage(null);
    if (field !== "organization" && field !== "additional_notes") {
      setServerFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const markTouched = (field: DataRequestValidationField) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleFieldBlur = (field: DataRequestValidationField) => () => {
    markTouched(field);
  };

  const getFieldError = (field: DataRequestValidationField): string | undefined =>
    serverFieldErrors[field] ||
    (submittedOnce || touchedFields[field] ? validationErrors[field] : undefined);

  const requestClose = useCallback(() => {
    if (!isSubmittingRef.current) {
      onCloseRef.current();
    }
  }, []);

  const handleGeographyTypeChange = (value: GeographyType) => {
    setGeographyType(value);
    setSelectedGeographyValue("");
    setErrorMessage(null);
    setServerFieldErrors((prev) => {
      const next = { ...prev };
      delete next.geography;
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      geography: getGeographyForType(value),
    }));
  };

  const handleGeographySelectionChange = (value: string) => {
    setSelectedGeographyValue(value);
    updateField("geography", value);
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
        scenarios: filterCompatibleScenarios(prev.scenarios, climateVariables),
      };
    });
    setErrorMessage(null);
    setServerFieldErrors((prev) => {
      const next = { ...prev };
      delete next.climate_variables;
      delete next.scenarios;
      return next;
    });
    markTouched("climate_variables");
  };

  const toggleScenario = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      scenarios: prev.scenarios.includes(value)
        ? prev.scenarios.filter((item) => item !== value)
        : [...prev.scenarios, value],
    }));
    setErrorMessage(null);
    setServerFieldErrors((prev) => {
      const next = { ...prev };
      delete next.scenarios;
      return next;
    });
    markTouched("scenarios");
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
    markTouched("scenarios");
    setFormData((prev) => ({
      ...prev,
      scenarios: mode === "historical" ? [HISTORICAL_SCENARIO_OPTION] : [],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionInFlightRef.current) {
      return;
    }

    const normalizedPayload = normalizeDataRequestPayload(formData);
    const clientErrors = validateDataRequest(normalizedPayload, geographyType, scenarioMode);
    setFormData(normalizedPayload);
    setSubmittedOnce(true);
    setServerFieldErrors({});
    setErrorMessage(null);

    const firstInvalidField = Object.keys(clientErrors)[0] as DataRequestValidationField | undefined;
    if (firstInvalidField) {
      window.requestAnimationFrame(() => {
        dialogRef.current
          ?.querySelector<HTMLElement>(`[data-validation-field="${firstInvalidField}"]`)
          ?.focus();
      });
      return;
    }

    submissionInFlightRef.current = true;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await submitDataRequest(normalizedPayload);
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
      const submissionError = getDataRequestSubmissionError(error);
      setErrorMessage(submissionError.message);
      setServerFieldErrors(submissionError.fieldErrors);
      setToast({
        type: "error",
        title: "Submission failed",
        message: submissionError.message,
      });
      const firstServerField = Object.keys(
        submissionError.fieldErrors,
      )[0] as DataRequestValidationField | undefined;
      window.requestAnimationFrame(() => {
        if (firstServerField) {
          dialogRef.current
            ?.querySelector<HTMLElement>(`[data-validation-field="${firstServerField}"]`)
            ?.focus();
        } else {
          dialogRef.current?.querySelector<HTMLElement>("#data-request-submit-error")?.focus();
        }
      });
    } finally {
      submissionInFlightRef.current = false;
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    resetForm();
    window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("#data-request-full-name")?.focus();
    });
  };

  if (!open) {
    return null;
  }

  const emailWasSent = result?.email_status === "sent";
  const emailWarning = result ? getDataRequestEmailWarning(result) : null;

  return (
    <div
      className="data-request-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          requestClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        className="data-request-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-request-title"
        aria-describedby="data-request-description"
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="data-request-close"
          onClick={requestClose}
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
              <h2 id="data-request-title" tabIndex={-1}>Climate data request submitted</h2>
              {emailWasSent ? (
                <p id="data-request-description">
                  A confirmation email was sent to <strong>{formData.email}</strong>.
                </p>
              ) : (
                <p id="data-request-description">
                  Your request was saved. Keep this Request ID for follow-up.
                </p>
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
                <button type="button" className="data-request-primary-btn" onClick={requestClose}>
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
                <p className="modal-short-desc" id="data-request-description">
                  Request a prepared climate data package.
                </p>
              </div>
            </div>

            <form className="data-request-form" onSubmit={handleSubmit} noValidate>
              <div className="modal-header">
                <h2 id="data-request-title">Request download access</h2>
              </div>

              <div className="data-request-form-columns">
                <div className="data-request-column">
                  <div className="data-request-grid two-columns">
                    <label htmlFor="data-request-full-name">
                      <span>Full name *</span>
                      <input
                        id="data-request-full-name"
                        type="text"
                        autoComplete="name"
                        value={formData.full_name}
                        onChange={(event) => updateField("full_name", event.target.value)}
                        onBlur={handleFieldBlur("full_name")}
                        data-validation-field="full_name"
                        aria-invalid={Boolean(getFieldError("full_name"))}
                        aria-describedby={getFieldError("full_name") ? "data-request-full-name-error" : undefined}
                        required
                      />
                      {getFieldError("full_name") && (
                        <span className="data-request-field-error" id="data-request-full-name-error">
                          {getFieldError("full_name")}
                        </span>
                      )}
                    </label>

                    <label htmlFor="data-request-email">
                      <span>Email *</span>
                      <input
                        id="data-request-email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={formData.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        onBlur={handleFieldBlur("email")}
                        data-validation-field="email"
                        aria-invalid={Boolean(getFieldError("email"))}
                        aria-describedby={getFieldError("email") ? "data-request-email-error" : undefined}
                        required
                      />
                      {getFieldError("email") && (
                        <span className="data-request-field-error" id="data-request-email-error">
                          {getFieldError("email")}
                        </span>
                      )}
                    </label>
                  </div>

                  <label htmlFor="data-request-organization">
                    <span>Organization / institution</span>
                    <input
                      id="data-request-organization"
                      type="text"
                      autoComplete="organization"
                      value={formData.organization || ""}
                      onChange={(event) => updateField("organization", event.target.value)}
                    />
                  </label>

                  <label htmlFor="data-request-purpose">
                    <span>Request purpose *</span>
                    <textarea
                      id="data-request-purpose"
                      value={formData.purpose}
                      onChange={(event) => updateField("purpose", event.target.value)}
                      onBlur={handleFieldBlur("purpose")}
                      data-validation-field="purpose"
                      aria-invalid={Boolean(getFieldError("purpose"))}
                      aria-describedby={getFieldError("purpose") ? "data-request-purpose-error" : undefined}
                      rows={2}
                      required
                    />
                    {getFieldError("purpose") && (
                      <span className="data-request-field-error" id="data-request-purpose-error">
                        {getFieldError("purpose")}
                      </span>
                    )}
                  </label>

                  <div className="data-request-grid two-columns">
                    <label htmlFor="data-request-geography-type">
                      <span>Geography type *</span>
                      <select
                        id="data-request-geography-type"
                        value={geographyType}
                        onChange={(event) => handleGeographyTypeChange(event.target.value as GeographyType)}
                        onBlur={handleFieldBlur("geography_type")}
                        data-validation-field="geography_type"
                        aria-invalid={Boolean(getFieldError("geography_type"))}
                        aria-describedby={
                          [
                            getFieldError("geography_type") ? "data-request-geography-type-error" : "",
                            geographyOptionsUnavailable ? "data-request-geography-options-status" : "",
                          ].filter(Boolean).join(" ") || undefined
                        }
                        required
                      >
                        <option value="">Select type</option>
                        <option value="ghana">Ghana</option>
                        <option value="region" disabled={geographyOptionsUnavailable}>
                          Region{geographyOptionsLoading ? " (loading…)" : geographyOptionsUnavailable ? " (unavailable)" : ""}
                        </option>
                        <option value="district" disabled={geographyOptionsUnavailable}>
                          District{geographyOptionsLoading ? " (loading…)" : geographyOptionsUnavailable ? " (unavailable)" : ""}
                        </option>
                      </select>
                      {getFieldError("geography_type") && (
                        <span className="data-request-field-error" id="data-request-geography-type-error">
                          {getFieldError("geography_type")}
                        </span>
                      )}
                      {geographyOptionsUnavailable && (
                        <span
                          className="data-request-field-help"
                          id="data-request-geography-options-status"
                          role={geographyOptionsError ? "alert" : "status"}
                        >
                          {geographyOptionsLoading
                            ? "Loading region and district options…"
                            : "Region and district options are currently unavailable; Ghana remains available."}
                        </span>
                      )}
                    </label>

                    <label htmlFor="data-request-time-period">
                      <span>Time period needed *</span>
                      <select
                        id="data-request-time-period"
                        value={formData.time_period}
                        onChange={(event) => updateField("time_period", event.target.value)}
                        onBlur={handleFieldBlur("time_period")}
                        data-validation-field="time_period"
                        aria-invalid={Boolean(getFieldError("time_period"))}
                        aria-describedby={
                          getFieldError("time_period") ? "data-request-time-period-error" : undefined
                        }
                        required
                      >
                        <option value="">Select time period</option>
                        {TIME_PERIOD_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {getFieldError("time_period") && (
                        <span className="data-request-field-error" id="data-request-time-period-error">
                          {getFieldError("time_period")}
                        </span>
                      )}
                    </label>
                  </div>

                  {geographyType === "region" && (
                    <label htmlFor="data-request-geography">
                      <span>Region *</span>
                      <select
                        id="data-request-geography"
                        value={selectedGeographyValue}
                        onChange={(event) => handleGeographySelectionChange(event.target.value)}
                        onBlur={handleFieldBlur("geography")}
                        data-validation-field="geography"
                        aria-invalid={Boolean(getFieldError("geography"))}
                        aria-describedby={getFieldError("geography") ? "data-request-geography-error" : undefined}
                        required
                      >
                        <option value="">Select region</option>
                        {regionOptions.map((region) => (
                          <option key={region} value={`Region: ${region}`}>
                            {region}
                          </option>
                        ))}
                      </select>
                      {getFieldError("geography") && (
                        <span className="data-request-field-error" id="data-request-geography-error">
                          {getFieldError("geography")}
                        </span>
                      )}
                    </label>
                  )}

                  {geographyType === "district" && (
                    <label htmlFor="data-request-geography">
                      <span>District *</span>
                      <select
                        id="data-request-geography"
                        value={selectedGeographyValue}
                        onChange={(event) => handleGeographySelectionChange(event.target.value)}
                        onBlur={handleFieldBlur("geography")}
                        data-validation-field="geography"
                        aria-invalid={Boolean(getFieldError("geography"))}
                        aria-describedby={getFieldError("geography") ? "data-request-geography-error" : undefined}
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
                      {getFieldError("geography") && (
                        <span className="data-request-field-error" id="data-request-geography-error">
                          {getFieldError("geography")}
                        </span>
                      )}
                    </label>
                  )}
                </div>

                <div className="data-request-column">
                  <fieldset
                    className="data-request-section"
                    aria-invalid={Boolean(getFieldError("climate_variables"))}
                    aria-describedby={
                      getFieldError("climate_variables") ? "data-request-climate-variables-error" : undefined
                    }
                  >
                    <legend>Climate variables *</legend>
                    <div className="data-request-chip-grid">
                      {CLIMATE_VARIABLE_OPTIONS.map((option) => (
                        <label key={option} className="data-request-chip">
                          <input
                            type="checkbox"
                            checked={formData.climate_variables.includes(option)}
                            onChange={() => toggleVariable(option)}
                            data-validation-field="climate_variables"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    {getFieldError("climate_variables") && (
                      <span className="data-request-field-error" id="data-request-climate-variables-error">
                        {getFieldError("climate_variables")}
                      </span>
                    )}
                  </fieldset>

                  <fieldset
                    className="data-request-section"
                    disabled={!hasSelectedVariables}
                    aria-invalid={Boolean(getFieldError("scenarios"))}
                    aria-describedby={
                      getFieldError("scenarios")
                        ? "data-request-scenarios-error"
                        : !hasSelectedVariables
                          ? "data-request-scenarios-help"
                          : undefined
                    }
                  >
                    <legend>Scenarios *</legend>
                    <div className="data-request-scenario-toggle" role="group" aria-label="Scenario type">
                      <button
                        type="button"
                        className={`data-request-toggle-option ${scenarioMode === "historical" ? "active" : ""}`}
                        onClick={() => handleScenarioModeChange("historical")}
                        aria-pressed={scenarioMode === "historical"}
                        data-validation-field="scenarios"
                        disabled={!hasSelectedVariables}
                      >
                        Historical
                      </button>
                      <button
                        type="button"
                        className={`data-request-toggle-option ${scenarioMode === "projection" ? "active" : ""}`}
                        onClick={() => handleScenarioModeChange("projection")}
                        aria-pressed={scenarioMode === "projection"}
                        disabled={!hasSelectedVariables}
                      >
                        Projections
                      </button>
                    </div>

                    {!hasSelectedVariables && (
                      <p className="data-request-field-help" id="data-request-scenarios-help">
                        Select a climate variable to make scenarios available.
                      </p>
                    )}

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
                                    data-validation-field="scenarios"
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
                                    data-validation-field="scenarios"
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {getFieldError("scenarios") && (
                      <span className="data-request-field-error" id="data-request-scenarios-error">
                        {getFieldError("scenarios")}
                      </span>
                    )}
                  </fieldset>

                  <div className="data-request-grid">
                    <label htmlFor="data-request-preferred-format">
                      <span>Preferred format *</span>
                      <select
                        id="data-request-preferred-format"
                        value={formData.preferred_format}
                        onChange={(event) => updateField("preferred_format", event.target.value)}
                        onBlur={handleFieldBlur("preferred_format")}
                        data-validation-field="preferred_format"
                        aria-invalid={Boolean(getFieldError("preferred_format"))}
                        aria-describedby={
                          getFieldError("preferred_format") ? "data-request-preferred-format-error" : undefined
                        }
                        required
                      >
                        <option value="">Select format</option>
                        {FORMAT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {getFieldError("preferred_format") && (
                        <span className="data-request-field-error" id="data-request-preferred-format-error">
                          {getFieldError("preferred_format")}
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div
                  className="data-request-error"
                  id="data-request-submit-error"
                  role="alert"
                  tabIndex={-1}
                >
                  {errorMessage}
                </div>
              )}

              <div className="data-request-actions">
                <button
                  type="button"
                  className="data-request-secondary-btn"
                  onClick={requestClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="data-request-primary-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>

            <button
              type="button"
              className="modal-return data-request-return"
              onClick={requestClose}
              disabled={isSubmitting}
            >
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
