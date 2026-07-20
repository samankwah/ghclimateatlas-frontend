import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("uses the shared stepped map legend instead of a modal-specific gradient", async () => {
  const modalSource = await readSource(
    "../src/components/Categories/ParameterInfoModal.tsx",
  );

  assert.match(modalSource, /import Legend, \{ type LegendInputs \} from "\.\.\/Map\/Legend"/);
  assert.match(
    modalSource,
    /<Legend \{\.\.\.legend\} className="modal-map-legend" responsive \/>/,
  );
  assert.doesNotMatch(modalSource, /generateLegendStops|linear-gradient/);
  assert.doesNotMatch(modalSource, /modal-legend-gradient|modal-legend-labels/);
});

test("forwards the current map legend state without selecting the inspected card", async () => {
  const [appSource, categorySource] = await Promise.all([
    readSource("../src/App.tsx"),
    readSource("../src/components/Categories/CategoryTabs.tsx"),
  ]);

  assert.match(
    appSource,
    /legend=\{\{\s*variable: effectiveVariable,\s*minValue,\s*maxValue,\s*colorScaleType,\s*showChange,\s*\}\}/,
  );
  assert.match(categorySource, /legend: LegendInputs/);
  assert.match(categorySource, /<ParameterInfoModal[\s\S]*?legend=\{legend\}/);

  const openInfoHandler = categorySource.match(
    /const handleOpenParameterInfo[\s\S]*?\n  \};/,
  )?.[0];
  assert.ok(openInfoHandler, "parameter info handler should be present");
  assert.match(openInfoHandler, /setModalParam/);
  assert.doesNotMatch(openInfoHandler, /onParameterSelect|handleToggleParameter|setSelections/);
});

test("keeps modal legend widths within their container without changing legend values", async () => {
  const [legendSource, cssSource] = await Promise.all([
    readSource("../src/components/Map/Legend.tsx"),
    readSource("../src/App.css"),
  ]);

  assert.match(legendSource, /responsive\?: boolean/);
  assert.match(legendSource, /min\(var\(--legend-base-width\), 100%\)/);
  assert.match(
    cssSource,
    /\.modal-map-legend\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*var\(--legend-width\);/,
  );
});
