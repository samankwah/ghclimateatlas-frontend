// City markers layer for Ghana major cities

import { CircleMarker, Tooltip } from "react-leaflet";

interface City {
  name: string;
  lat: number;
  lng: number;
  population?: number;
  isCapital?: boolean;
}

interface CityMarkersProps {
  visible: boolean;
}

const GHANA_CITIES: City[] = [
  { name: "Accra", lat: 5.6037, lng: -0.1870, isCapital: true },
  { name: "Kumasi", lat: 6.6885, lng: -1.6244 },
  { name: "Tamale", lat: 9.4008, lng: -0.8393 },
  { name: "Takoradi", lat: 4.8845, lng: -1.7554 },
  { name: "Cape Coast", lat: 5.1315, lng: -1.2795 },
  { name: "Sunyani", lat: 7.3349, lng: -2.3123 },
  { name: "Ho", lat: 6.6009, lng: 0.4712 },
  { name: "Koforidua", lat: 6.0940, lng: -0.2593 },
  { name: "Wa", lat: 10.0601, lng: -2.5099 },
  { name: "Bolgatanga", lat: 10.7855, lng: -0.8514 },
  { name: "Techiman", lat: 7.5833, lng: -1.9333 },
  { name: "Obuasi", lat: 6.2000, lng: -1.6667 },
  { name: "Tema", lat: 5.6698, lng: -0.0166 },
  { name: "Nkawkaw", lat: 6.5500, lng: -0.7667 },
  { name: "Winneba", lat: 5.3500, lng: -0.6333 },
];

const CityMarkers: React.FC<CityMarkersProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <>
      {GHANA_CITIES.map((city) => (
        <CircleMarker
          key={city.name}
          center={[city.lat, city.lng]}
          radius={city.isCapital ? 8 : 5}
          pathOptions={{
            color: city.isCapital ? "#fbbf24" : "#fff",
            fillColor: city.isCapital ? "#fbbf24" : "#fff",
            fillOpacity: city.isCapital ? 0.9 : 0.7,
            weight: city.isCapital ? 2 : 1,
          }}
        >
          <Tooltip permanent={city.isCapital} direction="top" offset={[0, -5]}>
            <span className="city-tooltip">
              {city.name}
              {city.isCapital && " (Capital)"}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
};

export default CityMarkers;
