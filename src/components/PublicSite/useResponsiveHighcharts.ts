import { useEffect, useRef } from "react";
import type { HighchartsReactRefObject } from "highcharts-react-official";

const useResponsiveHighcharts = () => {
  const chartRef = useRef<HighchartsReactRefObject>(null);

  useEffect(() => {
    const container = chartRef.current?.container.current;
    if (!container) return;

    let animationFrame = 0;
    const fitChartToContainer = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const chart = chartRef.current?.chart;
        const width = container.getBoundingClientRect().width;
        if (chart && width > 0 && Math.abs(chart.chartWidth - width) > 1) {
          chart.setSize(width, undefined, false);
        }
      });
    };

    fitChartToContainer();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fitChartToContainer);
      return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", fitChartToContainer);
      };
    }

    const resizeObserver = new ResizeObserver(fitChartToContainer);
    resizeObserver.observe(container);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, []);

  return chartRef;
};

export default useResponsiveHighcharts;
