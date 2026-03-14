# Climate Indicator Contract

This document defines the frontend-to-backend contract for climate indicators that are currently missing or only partially supported.

## Current backend variables already exposed

These variables are already available from `/api/climate/variables` and should remain stable:

| Frontend parameter ID | Backend variable ID | Unit | Notes |
| --- | --- | --- | --- |
| `mean_temp_annual` | `annual_mean_temp` | `°C` | Supported |
| `max_temp_annual` | `annual_max_temp` | `°C` | Supported |
| `min_temp_annual` | `annual_min_temp` | `°C` | Supported |
| `very_hot_days_30` | `very_hot_days` | `days` | Backend currently means days with `Tmax >= 35°C` |
| `dry_days` | `dry_days` | `days` | Supported |
| `wet_days` | derived from `dry_days` | `days` | Frontend computes `365 - dry_days` |
| `maize_heat_units` | `maize_heat_units` | `°C·days` | Supported |
| `gdd_base_4` | `gdd_base_4` | `°C·days` | Supported |
| `gdd_base_5` | `gdd_base_5` | `°C·days` | Supported |
| `gdd_base_10` | `gdd_base_10` | `°C·days` | Supported |
| `gdd_base_15` | `gdd_base_15` | `°C·days` | Supported |

## Missing backend variables to expose

These should be added to `/api/climate/variables`, `/api/climate/{variable}`, `/api/climate/{variable}/compare`, and `/api/climate/{variable}/range`.

### Precipitation

| Frontend parameter ID | Proposed backend variable ID | Unit | Formula |
| --- | --- | --- | --- |
| `heavy_precip_10mm` | `heavy_precip_10mm` | `days` | Count of days where daily precipitation `P >= 10 mm` |
| `heavy_precip_20mm` | `heavy_precip_20mm` | `days` | Count of days where daily precipitation `P >= 20 mm` |
| `max_1day_precip` | `max_1day_precip` | `mm` | Maximum daily precipitation in the year: `max(P_d)` |
| `max_3day_precip` | `max_3day_precip` | `mm` | Maximum rolling 3-day precipitation: `max(P_d + P_d+1 + P_d+2)` |
| `max_5day_precip` | `max_5day_precip` | `mm` | Maximum rolling 5-day precipitation: `max(sum(P_d..P_d+4))` |

### Hot weather

| Frontend parameter ID | Proposed backend variable ID | Unit | Formula |
| --- | --- | --- | --- |
| `warmest_max_temp` | `warmest_max_temp` | `°C` | Highest daily maximum temperature in the year: `max(Tmax_d)` |
| `heat_wave_count` | `heat_wave_count` | `events` | Count of heat-wave runs, where a heat wave is at least 3 consecutive days with `Tmax >= 32°C` |
| `heat_wave_avg_length` | `heat_wave_avg_length` | `days` | Average duration of heat-wave runs: `sum(length of each heat wave) / heat_wave_count` |
| `longest_hot_spell` | `longest_hot_spell` | `days` | Longest run of consecutive days with `Tmax >= 30°C` |
| `hot_season` | `hot_season` | `days` | Duration between first and last day where `Tmax >= 30°C`: `last_day - first_day + 1` |
| `extreme_hot_32` | `extreme_hot_32` | `days` | Count of days where `Tmax >= 32°C` |
| `extreme_hot_34` | `extreme_hot_34` | `days` | Count of days where `Tmax >= 34°C` |

### Cold weather

| Frontend parameter ID | Proposed backend variable ID | Unit | Formula |
| --- | --- | --- | --- |
| `coldest_min_temp` | `coldest_min_temp` | `°C` | Lowest daily minimum temperature in the year: `min(Tmin_d)` |

## Temperature seasonal variables

If the seasonal temperature submenu is meant to work, the backend needs separate seasonal aggregations. Suggested IDs:

| Frontend parameter ID | Proposed backend variable ID | Unit | Formula |
| --- | --- | --- | --- |
| `mean_temp_spring` | `mean_temp_major_south` | `°C` | Mean of daily mean temperatures over Mar-May |
| `mean_temp_summer` | `mean_temp_major_north` | `°C` | Mean of daily mean temperatures over Jun-Aug |
| `mean_temp_fall` | `mean_temp_minor_south` | `°C` | Mean of daily mean temperatures over Sep-Nov |
| `mean_temp_winter` | `mean_temp_dry_season` | `°C` | Mean of daily mean temperatures over Dec-Feb |
| `max_temp_spring` | `max_temp_major_south` | `°C` | Mean of daily max temperatures over Mar-May |
| `max_temp_summer` | `max_temp_major_north` | `°C` | Mean of daily max temperatures over Jun-Aug |
| `max_temp_fall` | `max_temp_minor_south` | `°C` | Mean of daily max temperatures over Sep-Nov |
| `max_temp_winter` | `max_temp_dry_season` | `°C` | Mean of daily max temperatures over Dec-Feb |
| `min_temp_spring` | `min_temp_major_south` | `°C` | Mean of daily min temperatures over Mar-May |
| `min_temp_summer` | `min_temp_major_north` | `°C` | Mean of daily min temperatures over Jun-Aug |
| `min_temp_fall` | `min_temp_minor_south` | `°C` | Mean of daily min temperatures over Sep-Nov |
| `min_temp_winter` | `min_temp_dry_season` | `°C` | Mean of daily min temperatures over Dec-Feb |

## Required backend response shape

Each new variable should follow the existing response contract:

### `/api/climate/variables`

```json
{
  "id": "heavy_precip_20mm",
  "name": "Heavy Precipitation Days (20 mm)",
  "description": "Number of days per year with precipitation at or above 20 mm",
  "unit": "days",
  "category": "precipitation",
  "color_scale": "precipitation"
}
```

### `/api/climate/{variable}`

```json
{
  "variable": "heavy_precip_20mm",
  "variable_name": "Heavy Precipitation Days (20 mm)",
  "period": "baseline",
  "scenario": "historical",
  "unit": "days",
  "data": [
    {
      "district_id": "GH-GRE-ACCRA",
      "district_name": "Accra Metropolitan",
      "value": 14.2
    }
  ]
}
```

### `/api/climate/{variable}/compare`

```json
{
  "variable": "heavy_precip_20mm",
  "variable_name": "Heavy Precipitation Days (20 mm)",
  "period": "2050",
  "scenario": "rcp45",
  "unit": "days",
  "data": [
    {
      "district_id": "GH-GRE-ACCRA",
      "district_name": "Accra Metropolitan",
      "baseline": 14.2,
      "future": 18.5,
      "change": 4.3,
      "change_percent": 30.3
    }
  ]
}
```

### `/api/climate/{variable}/range`

```json
{
  "min": 0,
  "max": 60,
  "mean": 18.4
}
```

## Frontend mapping updates to apply after backend support lands

Update `src/components/Categories/categoryParameters.ts` so these parameter IDs map directly:

```ts
"heavy_precip_10mm": "heavy_precip_10mm",
"heavy_precip_20mm": "heavy_precip_20mm",
"max_1day_precip": "max_1day_precip",
"max_3day_precip": "max_3day_precip",
"max_5day_precip": "max_5day_precip",
"warmest_max_temp": "warmest_max_temp",
"heat_wave_count": "heat_wave_count",
"heat_wave_avg_length": "heat_wave_avg_length",
"longest_hot_spell": "longest_hot_spell",
"hot_season": "hot_season",
"extreme_hot_32": "extreme_hot_32",
"extreme_hot_34": "extreme_hot_34",
"coldest_min_temp": "coldest_min_temp",
```

For seasonal temperature menus, map only the annual option until seasonal variables exist.

## Implementation rule

Do not derive event-based indicators from annual totals or unrelated aggregates.

Valid derivation currently allowed:

- `wet_days = 365 - dry_days`

Invalid derivations:

- heavy precipitation day counts from annual precipitation totals
- max rolling precipitation from annual precipitation totals
- heat-wave metrics from annual hot-day counts
- coldest minimum temperature from annual minimum temperature averages
