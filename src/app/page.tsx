"use client";

import { usePlExtraction } from "../hooks/use-pl-extraction";
import { PdfUploader } from "../components/PdfUploader";
import { PlDataTable } from "../components/PlDataTable";
import { SankeyDiagram } from "../components/SankeyDiagram";
import { ExcelDownloadButton } from "../components/ExcelDownloadButton";

export default function Home() {
  const { state, extractFromPdf, downloadExcel, reset } = usePlExtraction();

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            決算短信 P/L Analyzer
          </h1>
          <p className="text-gray-500">
            決算短信PDFをアップロードして、損益計算書をSankey Diagramで可視化
          </p>
        </header>

        {state.phase === "upload" && (
          <PdfUploader onFileSelected={extractFromPdf} />
        )}

        {state.phase === "processing" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg text-gray-600">PDFを解析中...</p>
            <p className="text-sm text-gray-400 mt-1">
              Claude APIでデータを抽出しています
            </p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 font-medium mb-2">エラーが発生しました</p>
              <p className="text-red-600 text-sm mb-4">{state.message}</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                やり直す
              </button>
            </div>
          </div>
        )}

        {state.phase === "results" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">分析結果</h2>
              <div className="flex items-center gap-3">
                <ExcelDownloadButton
                  data={state.data}
                  onDownload={downloadExcel}
                />
                <button
                  onClick={reset}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  新しいPDFを分析
                </button>
              </div>
            </div>

            <SankeyDiagram data={state.data} />
            <PlDataTable data={state.data} />
          </div>
        )}
      </div>
    </main>
  );
}
