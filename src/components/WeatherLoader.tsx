interface WeatherLoaderProps {
  size?: "sm" | "md";
  className?: string;
}

const SIZE_PX: Record<NonNullable<WeatherLoaderProps["size"]>, number> = {
  sm: 32,
  md: 96,
};

const WeatherLoader: React.FC<WeatherLoaderProps> = ({ size = "md", className }) => {
  const px = SIZE_PX[size];
  const classes = ["weather-loader", size === "sm" ? "is-small" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden="true" style={{ width: px, height: px }}>
      <svg viewBox="0 0 96 96" width={px} height={px}>
        <g className="weather-loader-sun">
          <circle cx="38" cy="38" r="13" fill="#fbbf24" />
          <g stroke="#fbbf24" strokeWidth="3" strokeLinecap="round">
            <line x1="38" y1="12" x2="38" y2="20" />
            <line x1="38" y1="56" x2="38" y2="64" />
            <line x1="12" y1="38" x2="20" y2="38" />
            <line x1="56" y1="38" x2="64" y2="38" />
            <line x1="19" y1="19" x2="25" y2="25" />
            <line x1="51" y1="51" x2="57" y2="57" />
            <line x1="57" y1="19" x2="51" y2="25" />
            <line x1="25" y1="51" x2="19" y2="57" />
          </g>
        </g>
        <g className="weather-loader-cloud">
          <path
            d="M30 66 Q30 54 42 54 Q48 46 58 50 Q70 48 72 60 Q82 60 82 70 Q82 80 72 80 L34 80 Q24 80 24 72 Q24 66 30 66 Z"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
        </g>
        <g className="weather-loader-drops" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round">
          <line x1="40" y1="84" x2="40" y2="90" />
          <line x1="52" y1="84" x2="52" y2="90" />
          <line x1="64" y1="84" x2="64" y2="90" />
        </g>
      </svg>
    </div>
  );
};

export default WeatherLoader;
