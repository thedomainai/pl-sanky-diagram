"use client";

import { useState, useCallback } from "react";
import type { PlData } from "../../types/pl-data";

type AppState =
  | { phase: "upload" }
  | { phase: "processing" }
  | { phase: "results"; data: PlData }
  | { phase: "error"; message: string };

export function usePlExtraction() {
  const [state, setState] = useState<AppState>({ phase: "upload" });

  const extractFromPdf = useCallback(async (file: File) => {
    setState({ phase: "processing" });

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/extract-pl", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setState({ phase: "error", message: json.error || "抽出に失敗しました" });
        return;
      }

      setState({ phase: "results", data: json.data });
    } catch {
      setState({ phase: "error", message: "通信エラーが発生しました" });
    }
  }, []);

  const downloadExcel = useCallback(async (data: PlData) => {
    const res = await fetch("/api/export-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Excel出力に失敗しました");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.company_name}_${data.fiscal_period}_PL.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const reset = useCallback(() => {
    setState({ phase: "upload" });
  }, []);

  return { state, extractFromPdf, downloadExcel, reset };
}
