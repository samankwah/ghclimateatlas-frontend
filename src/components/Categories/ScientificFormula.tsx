import type { Period, Scenario } from "../../types/climate";
import {
  getFormulaAccessibleLabels,
  type RainfallMaximumFormulaSpec,
  type RainfallThresholdFormulaSpec,
  type ScientificFormulaSpec,
} from "./scientificFormulas";

interface ScientificFormulaProps {
  formula: ScientificFormulaSpec;
  scenario: Scenario;
  period: Period;
}

interface EquationProps {
  label: string;
  children: React.ReactNode;
}

const Equation = ({ label, children }: EquationProps) => (
  <div className="modal-equation-block">
    <div className="modal-equation-scroll">
      <math display="block" className="modal-equation" aria-label={label}>
        {children}
      </math>
    </div>
  </div>
);

const TemperatureEquation = ({ label }: { label: string }) => (
    <Equation label={label}>
      <mrow>
        <msub><mi>T</mi><mi>d</mi></msub>
        <mo>=</mo>
        <mfrac>
          <mrow>
            <munder>
              <mo>∑</mo>
              <mrow><mi>g</mi><mo>∈</mo><mi>d</mi></mrow>
            </munder>
            <msub><mi>T</mi><mi>g</mi></msub>
          </mrow>
          <msub><mi>N</mi><mi>d</mi></msub>
        </mfrac>
        <mspace width="0.75em" />
        <mtext>[°C]</mtext>
      </mrow>
    </Equation>
);

const RainfallTotalEquation = ({ label }: { label: string }) => (
    <Equation label={label}>
      <mrow>
        <msub><mi>P</mi><mi>d</mi></msub>
        <mo>=</mo>
        <mfrac>
          <mrow>
            <munder>
              <mo>∑</mo>
              <mrow><mi>g</mi><mo>∈</mo><mi>d</mi></mrow>
            </munder>
            <msub><mi>R</mi><mi>g</mi></msub>
          </mrow>
          <msub><mi>N</mi><mi>d</mi></msub>
        </mfrac>
        <mspace width="0.75em" />
        <mtext>[mm]</mtext>
      </mrow>
    </Equation>
);

const RainfallThresholdEquation = ({
  formula,
  label,
}: {
  formula: RainfallThresholdFormulaSpec;
  label: string;
}) => {
  const isDryDay = formula.comparison === "lt";
  const comparison = isDryDay ? "<" : "≥";

  return (
    <>
      <Equation label={label}>
        <mrow>
          <msub>
            <mi>N</mi>
            <mrow>
              <mo>{comparison}</mo>
              {isDryDay ? <mn>{formula.thresholdMm}</mn> : <mi>x</mi>}
            </mrow>
          </msub>
          <mo>=</mo>
          <munder><mo>∑</mo><mi>t</mi></munder>
          <mi mathvariant="bold">1</mi>
          <mo>(</mo>
          <msub><mi>P</mi><mi>t</mi></msub>
          <mo>{comparison}</mo>
          {isDryDay ? (
            <mrow><mn>{formula.thresholdMm}</mn><mspace width="0.25em" /><mtext>mm</mtext></mrow>
          ) : (
            <mi>x</mi>
          )}
          <mo>)</mo>
        </mrow>
      </Equation>
      {!isDryDay && (
        <p className="modal-formula-parameter">
          Here <span className="formula-symbol">x</span> = {formula.thresholdMm} mm.
        </p>
      )}
    </>
  );
};

const RainfallMaximumEquation = ({
  formula,
  label,
}: {
  formula: RainfallMaximumFormulaSpec;
  label: string;
}) => {
  if (formula.windowDays === 1) {
    return (
      <Equation label={label}>
        <mrow>
          <mi>Rx1day</mi>
          <mo>=</mo>
          <munder><mo>max</mo><mi>t</mi></munder>
          <mo>(</mo><msub><mi>P</mi><mi>t</mi></msub><mo>)</mo>
        </mrow>
      </Equation>
    );
  }

  return (
    <>
      <Equation label={label}>
        <mrow>
          <mi>RxNday</mi>
          <mo>=</mo>
          <munder><mo>max</mo><mi>t</mi></munder>
          <munderover>
            <mo>∑</mo>
            <mrow><mi>i</mi><mo>=</mo><mn>0</mn></mrow>
            <mrow><mi>N</mi><mo>−</mo><mn>1</mn></mrow>
          </munderover>
          <msub>
            <mi>P</mi>
            <mrow><mi>t</mi><mo>+</mo><mi>i</mi></mrow>
          </msub>
        </mrow>
      </Equation>
      <p className="modal-formula-parameter">
        Here <span className="formula-symbol">N</span> = {formula.windowDays} days.
      </p>
    </>
  );
};

const ScientificFormula = ({ formula, scenario, period }: ScientificFormulaProps) => {
  const labels = getFormulaAccessibleLabels(formula, scenario, period);

  return (
    <section
      className="modal-scientific-formula"
      aria-label="Scientific formula and notation"
      data-formula-kind={formula.kind}
    >
      {formula.kind === "mean-temperature" && (
        <TemperatureEquation label={labels[1]} />
      )}
      {formula.kind === "rainfall-total" && (
        <RainfallTotalEquation label={labels[1]} />
      )}
      {formula.kind === "rainfall-threshold-count" && (
        <RainfallThresholdEquation formula={formula} label={labels[0]} />
      )}
      {formula.kind === "rainfall-maximum" && (
        <RainfallMaximumEquation formula={formula} label={labels[0]} />
      )}

    </section>
  );
};

export default ScientificFormula;
