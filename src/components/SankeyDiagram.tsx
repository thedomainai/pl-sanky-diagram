"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import type { SankeyRow } from "../../types/pl-data";
import { sankeyRowsToChartData } from "../lib/sankey-data";

const Plot = dynamic(
  () => import("react-plotly.js").then((mod) => mod.default),
  { ssr: false }
) as React.ComponentType<PlotParams>;

interface SankeyDiagramProps {
  rows: SankeyRow[];
  companyName: string;
  fiscalPeriod: string;
}

export function SankeyDiagram({
  rows,
  companyName,
  fiscalPeriod,
}: SankeyDiagramProps) {
  const [showThisYear, setShowThisYear] = useState(true);
  const chartData = sankeyRowsToChartData(rows, showThisYear);

  // Link color follows the TARGET node color with transparency
  const linkColors = chartData.links.map((l) => {
    const targetNode = chartData.nodes[Number(l.target)];
    return targetNode ? targetNode.color + "35" : "#00000015";
  });

  const plotData: PlotParams["data"] = [
    {
      type: "sankey",
      orientation: "h",
      arrangement: "fixed",
      node: {
        pad: 18,
        thickness: 22,
        line: { color: "white", width: 0.5 },
        label: chartData.nodes.map((n) => n.label),
        color: chartData.nodes.map((n) => n.color),
        x: chartData.nodes.map((n) => n.x),
        y: chartData.nodes.map((n) => n.y),
        hovertemplate:
          "%{label}<br>¥%{value:,.1f}億<extra></extra>",
      },
      link: {
        source: chartData.links.map((l) => Number(l.source)),
        target: chartData.links.map((l) => Number(l.target)),
        value: chartData.links.map((l) => l.value),
        color: linkColors,
        hovertemplate:
          "%{source.label} → %{target.label}<br>¥%{value:,.1f}億<extra></extra>",
      },
    } as PlotParams["data"][number],
  ];

  const layout: PlotParams["layout"] = {
    title: {
      text: `${companyName} ${fiscalPeriod} 損益フロー (${showThisYear ? "当期" : "前期"})`,
      font: { size: 15, color: "#1f2937" },
    },
    font: { family: "system-ui, -apple-system, sans-serif", size: 11 },
    margin: { l: 0, r: 0, t: 50, b: 10 },
    height: 600,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">
          Sankey Diagram (億円)
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThisYear(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !showThisYear
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            前期
          </button>
          <button
            onClick={() => setShowThisYear(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showThisYear
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            当期
          </button>
        </div>
      </div>
      <Plot
        data={plotData}
        layout={layout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
