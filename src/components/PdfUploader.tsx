"use client";

import { useState, useCallback, useRef } from "react";

interface PdfUploaderProps {
  onFileSelected: (file: File) => void;
}

export function PdfUploader({ onFileSelected }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center
        w-full max-w-xl mx-auto p-12
        border-2 border-dashed rounded-2xl cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
        }
      `}
    >
      <svg
        className="w-16 h-16 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-lg font-medium text-gray-700 mb-1">
        決算短信PDFをドラッグ&ドロップ
      </p>
      <p className="text-sm text-gray-500">
        またはクリックしてファイルを選択
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
