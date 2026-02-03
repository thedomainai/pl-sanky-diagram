"use client";

import { useState } from "react";
import type { PlData } from "../../types/pl-data";

interface ExcelDownloadButtonProps {
  data: PlData;
  onDownload: (data: PlData) => Promise<void>;
}

export function ExcelDownloadButton({
  data,
  onDownload,
}: ExcelDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    setDownloading(true);
    try {
      await onDownload(data);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={downloading}
      className={`
        inline-flex items-center gap-2 px-5 py-2.5
        rounded-lg font-medium text-sm
        transition-colors duration-200
        ${
          downloading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
        }
      `}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {downloading ? "出力中..." : "Excel出力"}
    </button>
  );
}
