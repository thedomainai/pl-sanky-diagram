"use client";

import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import type { PlData } from "../../types/pl-data";
import { transformPlToSankey } from "../lib/sankey-data";

const Plot = dynamic(
  () => import("react-plotly.js").then((mod) => mod.default),
  { ssr: false }
) as React.ComponentType<PlotParams>;

interface SankeyDiagramProps {
  data: PlData;
}

export function SankeyDiagram({ data }: SankeyDiagramProps) {
  const sankeyData = transformPlToSankey(data);

  const nodeMap = new Map(sankeyData.nodes.map((n, i) => [n.id, i]));

  const plotData: PlotParams["data"] = [
    {
      type: "sankey",
      orientation: "h",
      node: {
        pad: 20,
        thickness: 24,
        line: { color: "white", width: 1 },
        label: sankeyData.nodes.map((n) => n.label),
        color: sankeyData.nodes.map((n) => n.color),
        hovertemplate:
          "%{label}<br>%{value:,.0f} " +
          data.currency_unit +
          "<extra></extra>",
      },
      link: {
        source: sankeyData.links.map((l) => nodeMap.get(l.source) ?? 0),
        target: sankeyData.links.map((l) => nodeMap.get(l.target) ?? 0),
        value: sankeyData.links.map((l) => l.value),
        color: sankeyData.links.map((l) => {
          const sourceNode = sankeyData.nodes.find(
            (n) => n.id === l.source
          );
          return sourceNode ? sourceNode.color + "40" : "#00000020";
        }),
        hovertemplate:
          "%{source.label} → %{target.label}<br>%{value:,.0f} " +
          data.currency_unit +
          "<extra></extra>",
      },
    } as PlotParams["data"][number],
  ];

  const layout: PlotParams["layout"] = {
    title: {
      text: `${data.company_name} ${data.fiscal_period} 損益フロー`,
      font: { size: 16 },
    },
    font: { family: "system-ui, sans-serif", size: 12 },
    margin: { l: 20, r: 20, t: 50, b: 20 },
    height: 500,
    paper_bgcolor: "transparent",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <Plot
        data={plotData}
        layout={layout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
