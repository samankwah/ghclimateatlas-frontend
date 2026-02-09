// Parameter descriptions and metadata for the info modal

import type { ColorScaleType } from '../../utils/colorScales';

export interface ParameterDescription {
  shortDescription: string;      // Left panel description
  aboutDescription: string;      // Right panel "About this variable"
  technicalDescription: string;  // Collapsible technical section
  formula: string;               // Mathematical formula (LaTeX-style or Unicode)
  unit: string;                  // e.g., "°C", "mm", "days"
  legendMin: number;
  legendMax: number;
  colorScaleType: ColorScaleType; // Must match the spatial map's color scale
}

export const PARAMETER_DESCRIPTIONS: Record<string, ParameterDescription> = {
  // Precipitation parameters
  heavy_precip_10mm: {
    shortDescription: 'The number of days per year when rainfall exceeds 10mm. This indicator helps track the frequency of moderate to heavy rainfall events across Ghana.',
    aboutDescription: 'In Ghana, where rain-fed agriculture dominates, tracking days with over 10mm of rainfall is essential. This metric helps farmers across the cocoa belt, the Guinea savanna, and coastal plains plan planting schedules and anticipate waterlogging risks that can damage crops and rural roads.',
    technicalDescription: 'Annual count of days where daily precipitation total is greater than or equal to 10mm.',
    formula: 'Count(P ≥ 10mm)',
    unit: 'days',
    legendMin: 0,
    legendMax: 100,
    colorScaleType: 'precipitation'
  },
  heavy_precip_20mm: {
    shortDescription: 'The number of days per year when rainfall exceeds 20mm. This tracks very heavy rainfall events that can cause flooding in Ghana.',
    aboutDescription: 'Days exceeding 20mm of rainfall represent significant downpour events in Ghana. These heavy rains frequently trigger urban flooding in cities like Accra, Kumasi, and Tamale, overwhelm drainage systems, and can cause erosion on deforested hillsides in the Volta and Eastern regions.',
    technicalDescription: 'Annual count of days where daily precipitation total is greater than or equal to 20mm.',
    formula: 'Count(P ≥ 20mm)',
    unit: 'days',
    legendMin: 0,
    legendMax: 60,
    colorScaleType: 'precipitation'
  },
  wet_days: {
    shortDescription: 'The total number of days per year with measurable precipitation (at least 1mm of rainfall) across Ghana.',
    aboutDescription: 'Ghana experiences distinct wet and dry seasons that vary by region. The south-west receives rain for most of the year with two rainy seasons, while the northern savanna has a single rainy season. Tracking wet days helps understand shifts in these seasonal patterns that are critical for food security and water supply.',
    technicalDescription: 'Annual count of days where daily precipitation total is greater than or equal to 1mm.',
    formula: 'Count(P ≥ 1mm)',
    unit: 'days',
    legendMin: 0,
    legendMax: 200,
    colorScaleType: 'precipitation'
  },
  dry_days: {
    shortDescription: 'The total number of days per year with no significant precipitation (less than 1mm of rainfall) in Ghana.',
    aboutDescription: 'Dry days are a critical concern in Ghana, particularly in the northern regions where the Harmattan season brings extended periods without rain. Prolonged dry spells threaten smallholder farming, reduce water levels in the Volta Lake reservoir (which supplies much of Ghana\'s hydroelectric power), and increase bushfire risk in the savanna zones.',
    technicalDescription: 'Annual count of days where daily precipitation total is less than 1mm.',
    formula: 'Count(P < 1mm)',
    unit: 'days',
    legendMin: 0,
    legendMax: 365,
    colorScaleType: 'dry_days'
  },
  max_1day_precip: {
    shortDescription: 'The highest amount of rainfall recorded in a single day during the year. Indicates extreme rainfall intensity in Ghana.',
    aboutDescription: 'Ghana is increasingly vulnerable to extreme single-day rainfall events. In Accra and other low-lying coastal cities, a single intense downpour can overwhelm drainage infrastructure and cause severe flash flooding. This indicator is vital for disaster preparedness and urban planning across Ghana\'s rapidly growing cities.',
    technicalDescription: 'Maximum daily precipitation total recorded in a single day during the annual period.',
    formula: 'max(P₁)',
    unit: 'mm',
    legendMin: 0,
    legendMax: 200,
    colorScaleType: 'precipitation'
  },
  max_3day_precip: {
    shortDescription: 'The highest cumulative rainfall over any 3-day period during the year. Indicates sustained heavy rainfall events in Ghana.',
    aboutDescription: 'In regions where intense rain persists for multiple days in a row, the Max 3-Day Precipitation captures multi-day storm events common during Ghana\'s peak rainy seasons. Sustained heavy rainfall in the Volta Basin and along the south-western coast can cause river flooding, damage to cocoa farms, and landslides in hilly terrain.',
    technicalDescription: 'Maximum cumulative precipitation total over any consecutive 3-day period during the annual period.',
    formula: 'max(P₁ + P₂ + P₃)',
    unit: 'mm',
    legendMin: 0,
    legendMax: 300,
    colorScaleType: 'precipitation'
  },
  max_5day_precip: {
    shortDescription: 'The highest cumulative rainfall over any 5-day period during the year. Tracks extended storm systems affecting Ghana.',
    aboutDescription: 'Extended wet spells lasting five or more days can saturate soils across Ghana, leading to widespread flooding in the White Volta and Oti river basins. These prolonged events are particularly damaging in the Upper East and Upper West regions, where they can wash away crops, displace communities, and cut off rural roads.',
    technicalDescription: 'Maximum cumulative precipitation total over any consecutive 5-day period during the annual period.',
    formula: 'max(Σᵢ₌₁⁵ Pᵢ)',
    unit: 'mm',
    legendMin: 0,
    legendMax: 400,
    colorScaleType: 'precipitation'
  },

  // Agriculture parameters
  maize_heat_units: {
    shortDescription: 'A specialized measure of heat accumulation for maize growth, accounting for both day and night temperatures in Ghana.',
    aboutDescription: 'Maize is a staple crop across Ghana, grown from the coastal plains to the northern savanna. Maize Heat Units help Ghanaian farmers and agricultural extension officers predict crop maturity timing and optimize planting windows, especially as rising temperatures shift traditional growing calendars.',
    technicalDescription: 'Calculated using the Ontario Maize Heat Unit formula, which combines daytime maximum temperature contribution and nighttime minimum temperature contribution with specific thresholds for maize growth.',
    formula: 'MHU = Σ[(Ymax + Ymin)/2], Ymax = 3.33(Tmax-10) - 0.084(Tmax-10)²',
    unit: 'MHU',
    legendMin: 1000,
    legendMax: 4000,
    colorScaleType: 'temperature'
  },
  gdd_base_5: {
    shortDescription: 'Growing Degree Days accumulate whenever the daily mean temperature is above 5°C. Useful for tracking overall heat accumulation in Ghana.',
    aboutDescription: 'While Ghana\'s tropical climate rarely drops below 5°C, this base threshold captures the full growing potential available to crops. It is useful for comparing heat accumulation across Ghana\'s ecological zones, from the hot Upper East to the milder Ashanti highlands.',
    technicalDescription: 'Annual sum of degrees Celsius that each day\'s mean temperature exceeds 5°C. Values below the base temperature contribute zero to the total.',
    formula: 'GDD = Σ max(Tmean - 5, 0)',
    unit: 'Degree Days',
    legendMin: 0,
    legendMax: 5000,
    colorScaleType: 'temperature'
  },
  gdd_base_10: {
    shortDescription: 'Growing Degree Days accumulate whenever the daily mean temperature is above 10°C. Key measure for Ghana\'s warm-season crops.',
    aboutDescription: 'Growing Degree Days at 10°C base are widely used for crops central to Ghana\'s agriculture, including maize, rice, soybeans, and cassava. This indicator helps assess whether changing climate conditions will support or threaten crop yields across Ghana\'s diverse farming regions.',
    technicalDescription: 'Annual sum of degrees Celsius that each day\'s mean temperature exceeds 10°C. This is the most widely used GDD threshold for agricultural planning.',
    formula: 'GDD = Σ max(Tmean - 10, 0)',
    unit: 'Degree Days',
    legendMin: 0,
    legendMax: 4000,
    colorScaleType: 'temperature'
  },
  gdd_base_15: {
    shortDescription: 'Growing Degree Days accumulate whenever the daily mean temperature is above 15°C. Used for Ghana\'s tropical crops.',
    aboutDescription: 'This higher base threshold is most relevant for heat-loving crops that form the backbone of Ghana\'s agriculture and exports: cocoa, oil palm, rice, and cotton. Tracking GDD at 15°C helps predict growing seasons and evaluate climate suitability for these economically important crops.',
    technicalDescription: 'Annual sum of degrees Celsius that each day\'s mean temperature exceeds 15°C. Higher base temperatures are used for crops with greater heat requirements.',
    formula: 'GDD = Σ max(Tmean - 15, 0)',
    unit: 'Degree Days',
    legendMin: 0,
    legendMax: 3000,
    colorScaleType: 'temperature'
  },
  gdd_base_4: {
    shortDescription: 'Growing Degree Days accumulate whenever the daily mean temperature is above 4°C. Captures nearly all heat accumulation in Ghana\'s tropical climate.',
    aboutDescription: 'With Ghana\'s year-round warm temperatures, the 4°C base captures virtually all daily heat accumulation. This metric is useful for understanding total thermal resources available for agriculture and for comparing Ghana\'s growing potential with cooler climates globally.',
    technicalDescription: 'Annual sum of degrees Celsius that each day\'s mean temperature exceeds 4°C. Lower base temperatures capture growing potential in cooler climates.',
    formula: 'GDD = Σ max(Tmean - 4, 0)',
    unit: 'Degree Days',
    legendMin: 0,
    legendMax: 6000,
    colorScaleType: 'temperature'
  },

  // Hot Weather parameters
  very_hot_days_30: {
    shortDescription: 'The number of days per year when the maximum temperature exceeds 30°C. A key indicator of heat stress in Ghana.',
    aboutDescription: 'In Ghana\'s tropical climate, days above 30°C are common but their increasing frequency is a concern. Northern regions like Tamale and Bolgatanga already experience extreme heat for much of the year. Rising very hot days threaten outdoor workers, reduce labour productivity, and strain health services across the country.',
    technicalDescription: 'Annual count of days where daily maximum temperature is greater than or equal to 30°C.',
    formula: 'Count(Tmax ≥ 30°C)',
    unit: 'days',
    legendMin: 0,
    legendMax: 200,
    colorScaleType: 'hot_days'
  },
  warmest_max_temp: {
    shortDescription: 'The highest maximum temperature recorded during the year. Indicates peak heat intensity in Ghana.',
    aboutDescription: 'Ghana\'s warmest temperatures are typically recorded in the northern savanna during the dry season (February-April), when temperatures can exceed 40°C. This indicator is critical for heat emergency planning in cities like Tamale and Wa, and for understanding how climate change is pushing peak temperatures to new extremes.',
    technicalDescription: 'The highest daily maximum temperature recorded during the annual period.',
    formula: 'max(Tmax)',
    unit: '°C',
    legendMin: 25,
    legendMax: 50,
    colorScaleType: 'hot_days'
  },
  heat_wave_count: {
    shortDescription: 'The number of distinct heat wave events per year. Heat waves are a growing concern across Ghana.',
    aboutDescription: 'Heat waves in Ghana can be devastating, particularly in the Upper East, Upper West, and Northern regions where access to cooling is limited. Multiple heat wave events in a year compound health risks for vulnerable populations, reduce crop yields, and increase water demand during already-stressed dry seasons.',
    technicalDescription: 'Count of distinct heat wave events, where a heat wave is defined as 3 or more consecutive days with maximum temperature exceeding 32°C.',
    formula: 'N(events where Tmax ≥ 32°C for ≥ 3 consecutive days)',
    unit: 'events',
    legendMin: 0,
    legendMax: 20,
    colorScaleType: 'hot_days'
  },
  heat_wave_avg_length: {
    shortDescription: 'The average duration of heat wave events in days. Longer heat waves have more severe impacts on Ghanaian communities.',
    aboutDescription: 'Extended heat waves are particularly dangerous in Ghana, where many homes lack air conditioning and outdoor labour in farming, construction, and mining is widespread. Longer heat waves strain water supplies, increase the risk of heat-related illness, and can cause significant losses in livestock and poultry production.',
    technicalDescription: 'Mean duration (in days) of heat wave events during the annual period, where a heat wave is 3+ consecutive days above 32°C.',
    formula: 'Σ(heat wave days) / N(heat waves)',
    unit: 'days',
    legendMin: 0,
    legendMax: 15,
    colorScaleType: 'hot_days'
  },
  longest_hot_spell: {
    shortDescription: 'The longest consecutive sequence of days with maximum temperature above 30°C during the year in Ghana.',
    aboutDescription: 'Ghana\'s northern regions can experience continuous stretches of extreme heat lasting weeks during the dry season. The longest hot spell indicator reveals how sustained these heat events are, which is critical for planning water rationing, protecting livestock, and supporting communities through extended periods without relief.',
    technicalDescription: 'Maximum number of consecutive days during the annual period where daily maximum temperature exceeds 30°C.',
    formula: 'max(consecutive days where Tmax ≥ 30°C)',
    unit: 'days',
    legendMin: 0,
    legendMax: 100,
    colorScaleType: 'hot_days'
  },
  hot_season: {
    shortDescription: 'The length of the hot season in Ghana, when daily maximum temperatures regularly exceed 30°C.',
    aboutDescription: 'Ghana\'s hot season varies by region: the north experiences a pronounced hot dry season from February to April, while the south has more moderate temperatures year-round due to coastal influence. A lengthening hot season affects energy demand, water availability from the Volta reservoir, and the viability of outdoor economic activities.',
    technicalDescription: 'Duration of the annual period between the first and last occurrence of daily maximum temperature exceeding 30°C.',
    formula: 'Last(Tmax ≥ 30°C) - First(Tmax ≥ 30°C)',
    unit: 'days',
    legendMin: 0,
    legendMax: 250,
    colorScaleType: 'hot_days'
  },
  extreme_hot_32: {
    shortDescription: 'The number of days per year when the maximum temperature exceeds 32°C in Ghana. Indicates severe heat conditions.',
    aboutDescription: 'At 32°C and above, outdoor work becomes dangerous without precautions. In Ghana, where agriculture, construction, and artisanal mining employ millions of outdoor workers, tracking extremely hot days is essential for occupational health planning and for designing climate adaptation strategies in vulnerable districts.',
    technicalDescription: 'Annual count of days where daily maximum temperature is greater than or equal to 32°C.',
    formula: 'Count(Tmax ≥ 32°C)',
    unit: 'days',
    legendMin: 0,
    legendMax: 150,
    colorScaleType: 'hot_days'
  },
  extreme_hot_34: {
    shortDescription: 'The number of days per year when the maximum temperature exceeds 34°C in Ghana. Indicates extreme heat conditions.',
    aboutDescription: 'Days exceeding 34°C represent the most dangerous heat conditions in Ghana. These temperatures, most frequent in the Upper East and Northern regions, pose serious risks of heat stroke, are lethal for poultry and livestock, and can cause significant yield losses in crops like maize, millet, and sorghum.',
    technicalDescription: 'Annual count of days where daily maximum temperature is greater than or equal to 34°C.',
    formula: 'Count(Tmax ≥ 34°C)',
    unit: 'days',
    legendMin: 0,
    legendMax: 100,
    colorScaleType: 'hot_days'
  },

  // Temperature parameters
  mean_temp: {
    shortDescription: 'The average of daily mean temperatures across the year. A fundamental climate indicator for Ghana.',
    aboutDescription: 'Ghana\'s mean temperature varies from about 26°C along the coast to over 28°C in the northern savanna. Rising mean temperatures are a clear signal of climate change, affecting cocoa suitability zones, increasing evaporation from the Volta Lake, and intensifying heat stress for communities across all regions.',
    technicalDescription: 'Annual average of daily mean temperatures, where daily mean is the average of daily maximum and minimum temperatures.',
    formula: 'Tmean = (Tmax + Tmin) / 2',
    unit: '°C',
    legendMin: 20,
    legendMax: 35,
    colorScaleType: 'temperature'
  },
  max_temp: {
    shortDescription: 'The average of daily maximum temperatures across the year. Indicates typical daytime heat in Ghana.',
    aboutDescription: 'Daytime temperatures in Ghana shape daily life, from when outdoor markets operate to agricultural work schedules. The northern regions consistently record higher maximum temperatures than the coast. Understanding how daytime heat is changing helps plan for energy demand, urban heat islands in Accra and Kumasi, and worker safety.',
    technicalDescription: 'Annual average of daily maximum temperatures.',
    formula: 'Annual mean of daily Tmax',
    unit: '°C',
    legendMin: 25,
    legendMax: 40,
    colorScaleType: 'temperature'
  },
  min_temp: {
    shortDescription: 'The average of daily minimum temperatures across the year. Indicates typical nighttime conditions in Ghana.',
    aboutDescription: 'Nighttime temperatures in Ghana determine comfort during sleep and affect crop respiration rates. Warmer nights mean less relief from daytime heat, increased energy use for cooling, and reduced yields for temperature-sensitive crops like cocoa. Coastal cities experience less nighttime cooling due to humidity and urban heat effects.',
    technicalDescription: 'Annual average of daily minimum temperatures.',
    formula: 'Annual mean of daily Tmin',
    unit: '°C',
    legendMin: 15,
    legendMax: 30,
    colorScaleType: 'temperature'
  },

  // Cold Weather parameters
  coldest_min_temp: {
    shortDescription: 'The lowest minimum temperature recorded during the year. Indicates the coolest conditions in Ghana.',
    aboutDescription: 'While Ghana does not experience freezing temperatures, the coldest nights occur during the Harmattan season (December-February) when dry, dusty winds from the Sahara bring cooler conditions, particularly in the northern regions and highland areas around the Kwahu Plateau and Akuapem Ridge.',
    technicalDescription: 'The lowest daily minimum temperature recorded during the annual period.',
    formula: 'min(Tmin)',
    unit: '°C',
    legendMin: 10,
    legendMax: 25,
    colorScaleType: 'temperature'
  },
};

// Helper to get description with fallback
export const getParameterDescription = (parameterId: string): ParameterDescription => {
  return PARAMETER_DESCRIPTIONS[parameterId] || {
    shortDescription: 'Climate parameter data for analysis across Ghana\'s 261 districts.',
    aboutDescription: 'This climate variable provides insights into Ghana\'s regional climate patterns and how they are projected to change over time across the country\'s diverse ecological zones.',
    technicalDescription: 'Computed from climate model outputs.',
    formula: '',
    unit: '',
    legendMin: 0,
    legendMax: 100,
    colorScaleType: 'temperature'
  };
};
