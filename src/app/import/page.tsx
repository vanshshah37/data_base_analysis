"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      parseFile(selected);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length > 0) {
          const headers = json[0] as string[];
          const rows = json.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          
          setColumns(headers);
          setData(rows);
          toast.success("Loaded " + rows.length + " rows successfully.");
        }
      } catch (error) {
        toast.error("Failed to parse the file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    // This is where we'd do the column mapping and send to API
    toast.info("Import feature is under development. AI Mapping will be integrated here.");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import & Clean</h2>
        <p className="text-muted-foreground">
          Upload Excel or CSV files to normalize and import customers into your database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Data</CardTitle>
          <CardDescription>Drag and drop your customer list here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors " +
              (isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400")
            }
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-semibold text-gray-900">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">
              .XLSX or .CSV up to 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      {file && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5 text-green-600" />
              File Preview: {file.name}
            </CardTitle>
            <CardDescription>
              We detected {columns.length} columns and {data.length} records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-4">
              <h4 className="font-semibold text-sm mb-2">Detected Columns:</h4>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <span key={col} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {col}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
              <Button onClick={handleImport}>Proceed to Mapping</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
