import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createInitialDataRequestForm,
  buildDataRequestGeographyOptions,
  filterCompatibleScenarios,
  getCompatibleScenarioOptions,
  getDataRequestEmailWarning,
  getDataRequestSubmissionError,
  getGeographyForType,
  normalizeDataRequestPayload,
  validateDataRequest,
} from "../src/components/Downloads/dataRequestForm.ts";

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

const validPayload = () => ({
  full_name: "Ama Mensah",
  email: "ama@example.com",
  organization: "GMet",
  purpose: "Regional climate risk analysis",
  geography: "Ghana",
  time_period: "2041-2060",
  climate_variables: ["Average Annual Temperature"],
  scenarios: ["RCP 4.5"],
  preferred_format: "CSV",
});

test("creates a completely blank and independent request on every reset", () => {
  const first = createInitialDataRequestForm();
  first.full_name = "Old request";
  first.climate_variables.push("Sea Level");

  assert.deepEqual(createInitialDataRequestForm(), {
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
});

test("normalizes trimmed scalar values, nullable optionals, and unique selections", () => {
  assert.deepEqual(
    normalizeDataRequestPayload({
      ...validPayload(),
      full_name: "  Ama Mensah  ",
      email: "  ama@example.com ",
      organization: "   ",
      purpose: "  Research use  ",
      geography: "  Ghana ",
      climate_variables: ["Sea Level", " Sea Level "],
      scenarios: [" SSP2-4.5 ", "SSP2-4.5"],
      preferred_format: " CSV ",
      additional_notes: "   ",
    }),
    {
      full_name: "Ama Mensah",
      email: "ama@example.com",
      organization: null,
      purpose: "Research use",
      geography: "Ghana",
      time_period: "2041-2060",
      climate_variables: ["Sea Level"],
      scenarios: ["SSP2-4.5"],
      preferred_format: "CSV",
      additional_notes: null,
    },
  );
});

test("returns field-level errors for invalid contact details and required selections", () => {
  const errors = validateDataRequest(
    {
      ...createInitialDataRequestForm(),
      full_name: " ",
      email: "not-an-email",
      purpose: "  ",
    },
    "",
    "",
  );

  assert.deepEqual(errors, {
    full_name: "Enter your full name.",
    email: "Enter a valid email address.",
    purpose: "Describe how you plan to use the data.",
    geography_type: "Choose a geography type.",
    time_period: "Choose a time period.",
    climate_variables: "Choose at least one climate variable.",
    preferred_format: "Choose a preferred format.",
  });
});

test("validates historical and projection requests only when their modes and scenarios agree", () => {
  assert.deepEqual(validateDataRequest(validPayload(), "ghana", "projection"), {});
  assert.deepEqual(
    validateDataRequest(
      { ...validPayload(), scenarios: ["Historical"] },
      "ghana",
      "historical",
    ),
    {},
  );
  assert.equal(
    validateDataRequest(
      { ...validPayload(), scenarios: ["Historical"] },
      "ghana",
      "projection",
    ).scenarios,
    "Choose a historical or compatible projection scenario.",
  );
});

test("clears dependent geography values when geography type changes", () => {
  assert.equal(getGeographyForType("ghana"), "Ghana");
  assert.equal(getGeographyForType("region"), "");
  assert.equal(getGeographyForType("district"), "");

  const regionRequest = { ...validPayload(), geography: "" };
  assert.equal(validateDataRequest(regionRequest, "region", "projection").geography, "Choose a region.");
  assert.equal(validateDataRequest(regionRequest, "district", "projection").geography, "Choose a district.");
});

test("builds sorted region and district choices for every request entry point", () => {
  assert.deepEqual(
    buildDataRequestGeographyOptions([
      { id: "3", name: "Tema", region: "Greater Accra" },
      { id: "1", name: "Kumasi", region: "Ashanti" },
      { id: "2", name: "Accra", region: "Greater Accra" },
    ]),
    {
      regionOptions: ["Ashanti", "Greater Accra"],
      districtOptions: [
        { id: "1", name: "Kumasi", region: "Ashanti" },
        { id: "2", name: "Accra", region: "Greater Accra" },
        { id: "3", name: "Tema", region: "Greater Accra" },
      ],
    },
  );
});

test("offers RCPs for temperature and rainfall, SSPs for sea level, and removes incompatible choices", () => {
  assert.deepEqual(getCompatibleScenarioOptions(["Average Annual Temperature"]), {
    rcp: ["RCP 2.6", "RCP 4.5", "RCP 8.5"],
    ssp: [],
  });
  assert.deepEqual(getCompatibleScenarioOptions(["Sea Level"]), {
    rcp: [],
    ssp: ["SSP1-2.6", "SSP2-4.5", "SSP5-8.5"],
  });
  assert.deepEqual(
    filterCompatibleScenarios(["RCP 4.5", "SSP2-4.5"], ["Sea Level"]),
    ["SSP2-4.5"],
  );
  assert.deepEqual(filterCompatibleScenarios(["Historical", "SSP2-4.5"], []), []);
});

test("distinguishes email confirmation success from saved-with-warning responses", () => {
  assert.equal(
    getDataRequestEmailWarning({
      request_id: "REQ-1",
      submitted_at: "2026-08-11T00:00:00Z",
      status: "saved",
      email_status: "sent",
    }),
    null,
  );
  assert.equal(
    getDataRequestEmailWarning({
      request_id: "REQ-2",
      submitted_at: "2026-08-11T00:00:00Z",
      status: "saved",
      email_status: "failed",
      warning: "SMTP is not configured",
    }),
    "Email confirmation is currently unavailable. Your request is saved.",
  );
  assert.equal(
    getDataRequestEmailWarning({
      request_id: "REQ-3",
      submitted_at: "2026-08-11T00:00:00Z",
      status: "saved",
      email_status: "failed",
      warning: "Contact the climate services desk with your request ID.",
    }),
    "Contact the climate services desk with your request ID.",
  );
});

test("maps backend validation details to fields and preserves network errors for retry", () => {
  assert.deepEqual(
    getDataRequestSubmissionError({
      isAxiosError: true,
      message: "Request failed with status code 422",
      response: {
        data: {
          detail: [
            { loc: ["body", "email"], msg: "Email is already invalid" },
            { loc: ["body", "scenarios"], msg: "Scenario is unavailable" },
          ],
        },
      },
    }),
    {
      message: "Email is already invalid; Scenario is unavailable",
      fieldErrors: {
        email: "Email is already invalid",
        scenarios: "Scenario is unavailable",
      },
    },
  );
  assert.deepEqual(
    getDataRequestSubmissionError({ isAxiosError: true, message: "Network Error" }),
    { message: "Network Error", fieldErrors: {} },
  );
});

test("guards one POST at a time, keeps retry available, and fully resets after success", async () => {
  const source = await readSource("../src/components/Downloads/ClimateDataRequestModal.tsx");

  assert.match(source, /if \(submissionInFlightRef\.current\) \{\s*return;/);
  assert.match(source, /submissionInFlightRef\.current = true;[\s\S]*submitDataRequest\(normalizedPayload\)/);
  assert.equal(source.match(/submitDataRequest\(normalizedPayload\)/g)?.length, 1);
  assert.match(source, /finally \{\s*submissionInFlightRef\.current = false;/);
  assert.match(source, /catch \(error\)[\s\S]*setErrorMessage[\s\S]*setIsSubmitting\(false\)/);
  assert.match(source, /<strong>\{result\.request_id\}<\/strong>/);
  assert.match(source, /handleSubmitAnother[\s\S]*resetForm\(\)/);
  assert.doesNotMatch(source, /defaultValues/);
});

test("contains keyboard focus, restores the Data button, locks scrolling, and supports responsive layouts", async () => {
  const [source, appSource, css] = await Promise.all([
    readSource("../src/components/Downloads/ClimateDataRequestModal.tsx"),
    readSource("../src/App.tsx"),
    readSource("../src/App.css"),
  ]);

  assert.match(source, /role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-labelledby/);
  assert.match(source, /event\.key === "Escape"[\s\S]*!isSubmittingRef\.current/);
  assert.match(source, /event\.key !== "Tab"[\s\S]*firstElement[\s\S]*lastElement/);
  assert.match(source, /previouslyFocusedRef\.current[\s\S]*document\.activeElement/);
  assert.match(source, /document\.body\.style\.overflow = "hidden"/);
  assert.match(source, /document\.body\.style\.overflow = previousBodyOverflow/);
  assert.match(source, /previouslyFocusedRef\.current\?\.focus\(\)/);
  assert.match(source, /disabled=\{isSubmitting\}/);
  assert.doesNotMatch(appSource, /defaultValues=\{/);
  assert.match(css, /@media \(max-width: 980px\), \(max-height: 680px\)/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.data-request-grid\.two-columns \{\s*grid-template-columns: 1fr;/);
  assert.match(css, /\.data-request-form \{[\s\S]*overflow-y: auto;/);
});
