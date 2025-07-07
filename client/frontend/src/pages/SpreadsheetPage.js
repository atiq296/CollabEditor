import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from "@mui/material";
import Handsontable from "handsontable";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "handsontable/dist/handsontable.full.min.css";

// ✅ Register all Handsontable plugins
registerAllModules();

function SpreadsheetPage() {
  const { id: documentId } = useParams();
  const [data, setData] = useState([]);
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("token") || "";
  const getUserId = () => {
    try {
      return JSON.parse(atob(getToken().split(".")[1])).id;
    } catch {
      return "";
    }
  };

  // 🔹 Fetch spreadsheet and permission data
  useEffect(() => {
    const token = getToken();
    const userId = getUserId();

    fetch(`http://localhost:5000/api/document/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((doc) => {
        setIsEditor(
          doc.createdBy === userId ||
            doc.collaborators?.some(
              (c) => c.user._id === userId && c.role === "Editor"
            )
        );
      });

    fetch(`http://localhost:5000/api/document/${documentId}/spreadsheet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((fetchedData) => {
        if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
          const rows = 20,
            cols = 10;
          const empty = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => "")
          );
          setData(empty);
        } else {
          setData(fetchedData);
        }
        setLoading(false);
      });
  }, [documentId]);

  // 🔄 Auto-save every 3 seconds
  useEffect(() => {
    if (!isEditor) return;

    const interval = setInterval(() => {
      fetch(`http://localhost:5000/api/document/${documentId}/spreadsheet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ data }),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [data, documentId, isEditor]);

  // ✅ Export to Excel
  const handleExportToExcel = () => {
    if (!data || data.length === 0) return;

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(fileData, `spreadsheet_${documentId}.xlsx`);
  };

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        📊 Collaborative Spreadsheet
      </Typography>

      {!isEditor && (
        <Alert severity="info" sx={{ mb: 2 }}>
          View-only access. You cannot edit this spreadsheet.
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleExportToExcel}
        >
          📤 Export to Excel
        </Button>
      </Box>

      <HotTable
        data={data}
        colHeaders
        rowHeaders
        readOnly={!isEditor}
        width="100%"
        height="75vh"
        stretchH="all"
        licenseKey="non-commercial-and-evaluation"
        contextMenu={isEditor}
        dropdownMenu={isEditor}
        mergeCells={true}
        filters={true}
        manualRowResize
        manualColumnResize
        autoWrapRow
        autoWrapCol
        afterChange={(changes) => {
          if (changes) {
            setData((prev) => [...prev]); // trigger save
          }
        }}
      />
    </Box>
  );
}

export default SpreadsheetPage;
