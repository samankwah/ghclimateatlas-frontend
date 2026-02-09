// Time period slider component

import type { Period } from "../../types/climate";

interface TimePeriodSliderProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
}

const PERIODS: { value: Period; label: string; years: string }[] = [
  { value: "baseline", label: "Baseline", years: "1991-2020" },
  { value: "2030", label: "2030s", years: "2021-2050" },
  { value: "2050", label: "2050s", years: "2041-2070" },
  { value: "2080", label: "2080s", years: "2071-2100" },
];

const TimePeriodSlider: React.FC<TimePeriodSliderProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const currentIndex = PERIODS.findIndex((p) => p.value === selectedPeriod);
  const currentPeriodInfo = PERIODS[currentIndex];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    onPeriodChange(PERIODS[index].value);
  };

  return (
    <div className="time-period-slider">
      <label>Time Period</label>

      <div className="slider-container">
        <input
          type="range"
          min={0}
          max={PERIODS.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="period-slider"
        />

        <div className="period-labels">
          {PERIODS.map((period, index) => (
            <span
              key={period.value}
              className={`period-label ${index === currentIndex ? "active" : ""}`}
              onClick={() => onPeriodChange(period.value)}
            >
              {period.label}
            </span>
          ))}
        </div>
      </div>

      <div className="period-info">
        <span className="period-years">{currentPeriodInfo.years}</span>
      </div>
    </div>
  );
};

export default TimePeriodSlider;
