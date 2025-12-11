"use client";

import React, { useState } from "react";
import {
  Upload,
  X,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { FILE_UPLOAD } from "@/utils/constants";

interface ImportModalProps {
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
}

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  totalRows: number;
  validRows: number;
  headerRowIndex: number;
}

const MAX_PREVIEW_ROWS = 10;

// Helper function to find header row (sama seperti di API)
const findHeaderRow = (sheetData: any[][]): number => {
  for (let i = 0; i < Math.min(sheetData.length, 20); i++) {
    const row = sheetData[i];
    if (!Array.isArray(row)) continue;

    const hasKodeUnit = row.some(
      (cell) =>
        cell && cell.toString().trim().toUpperCase().includes("KODE UNIT")
    );
    const hasNomorSurat = row.some(
      (cell) =>
        cell && cell.toString().trim().toUpperCase().includes("NOMOR SURAT")
    );
    const hasPerihal = row.some(
      (cell) => cell && cell.toString().trim().toUpperCase().includes("PERIHAL")
    );

    if (hasKodeUnit || hasNomorSurat || hasPerihal) {
      return i;
    }
  }
  return -1;
};

export default function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewData, setPreviewData] = useState<SheetData[] | null>(null);
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const validateFile = (file: File): boolean => {
    setError("");

    // Check file size
    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      setError(
        `File terlalu besar. Maksimal ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`
      );
      return false;
    }

    // Check file type
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const fileExtension = ext ? "." + ext.toLowerCase() : "";
    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(fileExtension as any)) {
      setError(
        `Format file tidak didukung. Gunakan: ${FILE_UPLOAD.ALLOWED_TYPES.join(
          ", "
        )}`
      );
      return false;
    }

    return true;
  };

  const parseExcelFile = async (file: File): Promise<SheetData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetsData: SheetData[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            }) as any[][];

            if (jsonData.length > 0) {
              // Find header row
              const headerRowIndex = findHeaderRow(jsonData);

              if (headerRowIndex === -1) {
                sheetsData.push({
                  sheetName,
                  headers: [],
                  rows: [],
                  totalRows: 0,
                  validRows: 0,
                  headerRowIndex: -1,
                });
                return;
              }

              const headers = jsonData[headerRowIndex].map((h) =>
                String(h).trim()
              );

              // Get all rows after header
              const allRows = jsonData.slice(headerRowIndex + 1);

              // Filter valid rows (not empty, not just numbers)
              const validRows = allRows.filter((row) => {
                // Skip empty rows
                if (
                  !row ||
                  row.every(
                    (cell) =>
                      cell === null ||
                      cell === undefined ||
                      cell === "" ||
                      (typeof cell === "string" && cell.trim() === "")
                  )
                ) {
                  return false;
                }

                // Skip rows that only contain numbers
                const isNumberedRow = row.every((value) => {
                  if (value === null || value === undefined || value === "")
                    return false;
                  const str = value.toString().trim();
                  return !isNaN(Number(str)) && str !== "";
                });

                if (isNumberedRow) return false;

                return true;
              });

              // Limit preview rows
              const previewRows = validRows.slice(0, MAX_PREVIEW_ROWS);

              sheetsData.push({
                sheetName,
                headers,
                rows: previewRows,
                totalRows: validRows.length,
                validRows: validRows.length,
                headerRowIndex,
              });
            }
          });

          resolve(sheetsData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!validateFile(selectedFile)) {
      return;
    }

    setFile(selectedFile);
    setError("");
    setShowPreview(false);
    setPreviewData(null);

    try {
      const parsedData = await parseExcelFile(selectedFile);
      setPreviewData(parsedData);

      // Auto expand first sheet
      if (parsedData.length > 0) {
        setExpandedSheets(new Set([parsedData[0].sheetName]));
      }
    } catch (err) {
      console.error("Error parsing Excel:", err);
      setError("Gagal membaca file Excel. Pastikan format file benar.");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      await onImport(file);
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      setError("Terjadi kesalahan saat mengimpor file");
    } finally {
      setImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const toggleSheet = (sheetName: string) => {
    const newExpanded = new Set(expandedSheets);
    if (newExpanded.has(sheetName)) {
      newExpanded.delete(sheetName);
    } else {
      newExpanded.add(sheetName);
    }
    setExpandedSheets(newExpanded);
  };

  const totalValidRows =
    previewData?.reduce((sum, sheet) => sum + sheet.validRows, 0) || 0;
  const hasInvalidSheets =
    previewData?.some((sheet) => sheet.headerRowIndex === -1) || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Import Data Excel</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={importing}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* File Upload Area */}
          {!showPreview && (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {file
                      ? file.name
                      : "Drag & drop file Excel atau klik untuk memilih"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Format yang didukung: {FILE_UPLOAD.ALLOWED_TYPES.join(", ")}
                    (maksimal {FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB)
                  </p>
                  <input
                    type="file"
                    accept={FILE_UPLOAD.ALLOWED_TYPES.join(",")}
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Pilih File
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Preview Button */}
              {file && previewData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">
                        File berhasil dibaca!
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Ditemukan {previewData.length} sheet dengan total{" "}
                        {totalValidRows} baris data valid
                      </p>
                      {hasInvalidSheets && (
                        <p className="text-sm text-yellow-700 mt-1">
                          ⚠️ Beberapa sheet tidak memiliki header yang valid
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Eye size={16} className="mr-2" />
                      Preview Data
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Format Excel yang diharapkan:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Header sesuai template sistem</li>
                  <li>• Kolom KODE UNIT, NOMOR SURAT, PERIHAL (wajib)</li>
                  <li>• Format tanggal: DD-MMM-YY atau YYYY-MM-DD</li>
                  <li>• Maksimal 1000 baris per upload</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">
                  Validasi Klasifikasi & Masa Retensi:
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>
                    • Sistem akan memvalidasi masa retensi berdasarkan
                    klasifikasi
                  </li>
                  <li>• Contoh: KU (Keuangan) = 10 tahun</li>
                  <li>
                    • Jika tidak sesuai, akan muncul konfirmasi untuk perbaikan
                  </li>
                  <li>
                    • Anda dapat memilih perbaiki otomatis atau tetap lanjutkan
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Preview Area */}
          {showPreview && previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="text-green-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-900">{file?.name}</p>
                    <p className="text-sm text-gray-600">
                      {previewData.length} sheet • {totalValidRows} baris data
                      valid
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Kembali
                </button>
              </div>

              {/* Sheets Preview */}
              <div className="space-y-3">
                {previewData.map((sheet, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Sheet Header */}
                    <button
                      onClick={() => toggleSheet(sheet.sheetName)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {expandedSheets.has(sheet.sheetName) ? (
                          <ChevronDown size={20} className="text-gray-600" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-600" />
                        )}
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {sheet.sheetName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {sheet.headerRowIndex === -1 ? (
                              <span className="text-red-600">
                                ⚠️ Header tidak ditemukan
                              </span>
                            ) : (
                              <>
                                {sheet.validRows} baris valid •{" "}
                                {sheet.headers.length} kolom
                                {sheet.totalRows > MAX_PREVIEW_ROWS && (
                                  <span className="text-gray-500 ml-2">
                                    (menampilkan {MAX_PREVIEW_ROWS} dari{" "}
                                    {sheet.totalRows})
                                  </span>
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Sheet Content */}
                    {expandedSheets.has(sheet.sheetName) && (
                      <div className="p-4 bg-white">
                        {sheet.headerRowIndex === -1 ? (
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-red-700 text-sm">
                              Sheet ini tidak memiliki header yang valid.
                              Pastikan terdapat kolom KODE UNIT, NOMOR SURAT,
                              atau PERIHAL.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="bg-gray-100">
                                  {sheet.headers.map((header, hIdx) => (
                                    <th
                                      key={hIdx}
                                      className="px-3 py-2 text-left font-medium text-gray-700 border-b-2 border-gray-300 whitespace-nowrap"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sheet.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={
                                      rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                    }
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="px-3 py-2 border-b border-gray-200 text-gray-800 whitespace-nowrap"
                                      >
                                        {cell !== null &&
                                        cell !== undefined &&
                                        cell !== ""
                                          ? String(cell)
                                          : "-"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Warning if no valid data */}
              {totalValidRows === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle
                      className="text-red-600 flex-shrink-0"
                      size={20}
                    />
                    <div>
                      <p className="font-medium text-red-900">
                        Tidak ada data valid yang dapat diimport
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Pastikan file Excel memiliki header yang benar dan
                        setidaknya satu baris data yang valid.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t flex-shrink-0">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing || !!error || totalValidRows === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mengimpor...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Import {totalValidRows > 0 && `(${totalValidRows} baris)`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
