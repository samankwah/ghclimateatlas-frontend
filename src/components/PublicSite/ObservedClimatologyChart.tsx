import Highcharts from "highcharts";
import "highcharts/modules/accessibility";
import HighchartsReact from "highcharts-react-official";
import type { ObservedClimatologyPoint } from "../../data/observedClimatology";
import useResponsiveHighcharts from "./useResponsiveHighcharts";

interface ObservedClimatologyChartProps {
  data: ObservedClimatologyPoint[];
}

const ObservedClimatologyChart = ({ data }: ObservedClimatologyChartProps) => {
  const chartRef = useResponsiveHighcharts();
  const region = data[0]?.region ?? "Ghana";
  const options: Highcharts.Options = {
    chart: {
      backgroundColor: "transparent",
      height: 330,
      spacing: [14, 8, 8, 8],
      style: { fontFamily: 'Arial, "Helvetica Neue", sans-serif' },
    },
    accessibility: {
      description: `Monthly rainfall and temperature climatology for ${region} from 1991 to 2020.`,
    },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: {
      align: "right",
      verticalAlign: "top",
      layout: "horizontal",
      itemStyle: { color: "#17465d", fontSize: "14px", fontWeight: "600" },
      symbolRadius: 0,
    },
    title: { text: undefined },
    tooltip: {
      shared: true,
      valueDecimals: 1,
      backgroundColor: "rgba(255,255,255,.98)",
      borderColor: "#b9d8e7",
      shadow: false,
    },
    xAxis: {
      categories: data.map(({ month }) => month),
      crosshair: { color: "rgba(21, 141, 190, .2)", width: 1 },
      lineColor: "#9fb9c6",
      lineWidth: 1,
      tickColor: "#9fb9c6",
      tickLength: 5,
      tickmarkPlacement: "on",
      tickWidth: 1,
      title: {
        text: "Month",
        style: { color: "#547384", fontSize: "13px" },
      },
      labels: { style: { color: "#456878", fontSize: "13px" } },
    },
    yAxis: [
      {
        min: 0,
        max: 250,
        tickInterval: 50,
        title: { text: "Rainfall (mm)", style: { color: "#147ead", fontSize: "13px" } },
        gridLineColor: "#e5eef2",
        lineColor: "#9fb9c6",
        lineWidth: 1,
        tickColor: "#9fb9c6",
        tickLength: 5,
        tickWidth: 1,
        labels: { style: { color: "#527181", fontSize: "12px" } },
      },
      {
        min: 22,
        max: 34,
        tickInterval: 2,
        opposite: true,
        title: { text: "Temperature (°C)", style: { color: "#e45b30", fontSize: "13px" } },
        gridLineWidth: 0,
        lineColor: "#9fb9c6",
        lineWidth: 1,
        tickColor: "#9fb9c6",
        tickLength: 5,
        tickWidth: 1,
        labels: { style: { color: "#527181", fontSize: "12px" } },
      },
    ],
    plotOptions: {
      column: { borderWidth: 0, borderRadius: 2, pointPadding: 0.06, groupPadding: 0.08 },
      spline: { lineWidth: 3, marker: { enabled: true, radius: 3, symbol: "circle" } },
      series: { animation: { duration: 350 } },
    },
    series: [
      {
        type: "column",
        name: "Rainfall",
        color: "#1598c8",
        data: data.map(({ rainfallMillimetres }) => rainfallMillimetres),
        tooltip: { valueSuffix: " mm", valueDecimals: 0 },
      },
      {
        type: "spline",
        name: "Temperature",
        yAxis: 1,
        color: "#e45b30",
        data: data.map(({ temperatureCelsius }) => temperatureCelsius),
        tooltip: { valueSuffix: " °C", valueDecimals: 1 },
      },
    ],
    responsive: {
      rules: [{
        condition: { maxWidth: 520 },
        chartOptions: {
          chart: { height: 300 },
          legend: { itemDistance: 12 },
          yAxis: [{ title: { text: undefined } }, { title: { text: undefined } }],
        },
      }],
    },
  };

  return (
    <figure className="climatology-chart" aria-labelledby={`climatology-${region.replace(/\s/g, "-").toLowerCase()}`}>
      <h3 id={`climatology-${region.replace(/\s/g, "-").toLowerCase()}`}>{region}</h3>
      <p>Monthly rainfall and temperature, 1991–2020</p>
      <HighchartsReact
        ref={chartRef}
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { width: "100%", minWidth: 0 } }}
      />
      {/* Not shown on screen, but screen readers still get the values behind the chart. */}
      <table className="visually-hidden">
        <caption>{region} monthly observed climatology</caption>
        <thead><tr><th scope="col">Month</th><th scope="col">Rainfall (mm)</th><th scope="col">Temperature (°C)</th></tr></thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.month}>
              <th scope="row">{point.month}</th>
              <td>{point.rainfallMillimetres}</td>
              <td>{point.temperatureCelsius.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export default ObservedClimatologyChart;
