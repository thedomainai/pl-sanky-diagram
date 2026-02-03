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

  const plotData: PlotParams["data"] = [
    {
      type: "sankey",
      orientation: "h",
      node: {
        pad: 20,
        thickness: 24,
        line: { color: "white", width: 1 },
        label: chartData.nodes.map((n) => n.label),
        color: chartData.nodes.map((n) => n.color),
        hovertemplate: "%{label}<br>%{value:,.1f} 億円<extra></extra>",
      },
      link: {
        source: chartData.links.map((l) => Number(l.source)),
        target: chartData.links.map((l) => Number(l.target)),
        value: chartData.links.map((l) => l.value),
        color: chartData.links.map((l) => {
          const sourceNode = chartData.nodes[Number(l.source)];
          return sourceNode ? sourceNode.color + "40" : "#00000020";
        }),
        hovertemplate:
          "%{source.label} → %{target.label}<br>%{value:,.1f} 億円<extra></extra>",
      },
    } as PlotParams["data"][number],
  ];

  const layout: PlotParams["layout"] = {
    title: {
      text: `${companyName} ${fiscalPeriod} 損益フロー (${showThisYear ? "当期" : "前期"})`,
      font: { size: 16 },
    },
    font: { family: "system-ui, sans-serif", size: 11 },
    margin: { l: 10, r: 10, t: 50, b: 10 },
    height: 550,
    paper_bgcolor: "transparent",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">
          Step 5: Sankey Diagram (億円)
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThisYear(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !showThisYear
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            前期
          </button>
          <button
            onClick={() => setShowThisYear(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showThisYear
                ? "bg-blue-600 text-white"
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
