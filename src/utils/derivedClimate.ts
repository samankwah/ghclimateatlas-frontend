import type {
  ClimateComparison,
  ClimateComparisonResponse,
  ClimateResponse,
  ClimateValue,
  ClimateVariable,
  Scenario,
} from "../types/climate";

export type DerivedAggregation = "mean" | "sum";

export interface DerivedClimateVariableDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: ClimateVariable["category"];
  color_scale: ClimateVariable["color_scale"];
  sourceVariableIds: string[];
  aggregation: DerivedAggregation;
}

export const DERIVED_CLIMATE_VARIABLES: Record<string, DerivedClimateVariableDefinition> = {};

export const isDerivedClimateVariable = (variableId: string): boolean =>
  variableId in DERIVED_CLIMATE_VARIABLES;

export const getDerivedClimateVariable = (
  variableId: string,
): DerivedClimateVariableDefinition | undefined => DERIVED_CLIMATE_VARIABLES[variableId];

export const buildDerivedClimateVariableMeta = (
  variableId: string,
): ClimateVariable | undefined => {
  const definition = getDerivedClimateVariable(variableId);

  if (!definition) {
    return undefined;
  }

  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    unit: definition.unit,
    category: definition.category,
    color_scale: definition.color_scale,
  };
};

const aggregateValues = (aggregation: DerivedAggregation, values: number[]): number => {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return aggregation === "mean" ? total / values.length : total;
};

const roundValue = (value: number): number => Math.round(value * 10) / 10;

const collectAlignedDistrictValues = (
  sourceData: ClimateResponse[],
): Map<string, { district_id: string; district_name: string; values: number[] }> => {
  const districtMap = new Map<string, { district_id: string; district_name: string; values: number[] }>();

  sourceData.forEach((response) => {
    response.data.forEach((entry) => {
      const current = districtMap.get(entry.district_id);
      if (current) {
        current.values.push(entry.value);
        return;
      }

      districtMap.set(entry.district_id, {
        district_id: entry.district_id,
        district_name: entry.district_name,
        values: [entry.value],
      });
    });
  });

  return districtMap;
};

export const aggregateClimateDataResponses = (
  definition: DerivedClimateVariableDefinition,
  sourceData: ClimateResponse[],
  period: string,
  scenario: Scenario,
): ClimateResponse => {
  const districtMap = collectAlignedDistrictValues(sourceData);
  const data: ClimateValue[] = [];

  districtMap.forEach((entry) => {
    if (entry.values.length !== definition.sourceVariableIds.length) {
      return;
    }

    data.push({
      district_id: entry.district_id,
      district_name: entry.district_name,
      value: roundValue(aggregateValues(definition.aggregation, entry.values)),
    });
  });

  return {
    variable: definition.id,
    variable_name: definition.name,
    period,
    scenario,
    unit: definition.unit,
    data,
  };
};

export const aggregateClimateComparisonResponses = (
  definition: DerivedClimateVariableDefinition,
  sourceData: ClimateComparisonResponse[],
  period: string,
  scenario: Scenario,
): ClimateComparisonResponse => {
  const districtMap = new Map<
    string,
    {
      district_id: string;
      district_name: string;
      baselineValues: number[];
      futureValues: number[];
    }
  >();

  sourceData.forEach((response) => {
    response.data.forEach((entry) => {
      const current = districtMap.get(entry.district_id);
      if (current) {
        current.baselineValues.push(entry.baseline);
        current.futureValues.push(entry.future);
        return;
      }

      districtMap.set(entry.district_id, {
        district_id: entry.district_id,
        district_name: entry.district_name,
        baselineValues: [entry.baseline],
        futureValues: [entry.future],
      });
    });
  });

  const data: ClimateComparison[] = [];
  districtMap.forEach((entry) => {
    if (
      entry.baselineValues.length !== definition.sourceVariableIds.length ||
      entry.futureValues.length !== definition.sourceVariableIds.length
    ) {
      return;
    }

    const baseline = roundValue(aggregateValues(definition.aggregation, entry.baselineValues));
    const future = roundValue(aggregateValues(definition.aggregation, entry.futureValues));
    const change = roundValue(future - baseline);
    const changePercent = baseline !== 0 ? (change / baseline) * 100 : 0;

    data.push({
      district_id: entry.district_id,
      district_name: entry.district_name,
      baseline,
      future,
      change,
      change_percent: roundValue(changePercent),
    });
  });

  return {
    variable: definition.id,
    variable_name: definition.name,
    period,
    scenario,
    unit: definition.unit,
    data,
  };
};

export const buildRangeFromClimateResponse = (
  response: ClimateResponse | undefined,
): { min: number; max: number; mean: number } | undefined => {
  if (!response?.data.length) {
    return undefined;
  }

  const values = response.data.map((entry) => entry.value);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: roundValue(total / values.length),
  };
};
