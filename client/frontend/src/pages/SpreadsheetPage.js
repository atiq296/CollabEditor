import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import "./SpreadsheetPage.css";
import { HyperFormula } from "hyperformula";

registerAllModules();

function SpreadsheetPage() {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const importInputRef = useRef(null);

  const getToken = () => localStorage.getItem("token") || "";
  const getUserId = () => {
    try {
      return JSON.parse(atob(getToken().split(".")[1])).id;
    } catch {
      return "";
    }
  };

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

  // Import logic
  const handleImportClick = () => {
    if (importInputRef.current) importInputRef.current.value = null;
    importInputRef.current?.click();
  };
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      setData(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box className="spreadsheet-root">
      <div className="spreadsheet-header-row">
        <Button
          variant="outlined"
          color="primary"
          className="spreadsheet-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </Button>
        <Typography variant="h5" className="spreadsheet-title">
          Spreadsheet
        </Typography>
        <div style={{ display: 'flex', gap: '0.7rem' }}>
          <Button
            variant="outlined"
            color="primary"
            className="spreadsheet-import-btn"
            onClick={handleImportClick}
          >
            Import
          </Button>
          <input
            type="file"
            accept=".xlsx,.csv"
            ref={importInputRef}
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <Button
            variant="contained"
            color="success"
            className="spreadsheet-export-btn"
            onClick={handleExportToExcel}
          >
            Export to Excel
          </Button>
        </div>
      </div>
      {!isEditor && (
        <Alert severity="info" sx={{ mb: 2 }}>
          View-only access. You cannot edit this spreadsheet.
        </Alert>
      )}
      <HotTable
        data={data}
        colHeaders
        rowHeaders
        readOnly={!isEditor}
        width="100%"
        height="75vh"
        stretchH="all"
        licenseKey="non-commercial-and-evaluation"
        contextMenu={true}
        dropdownMenu={true}
        mergeCells={true}
        filters={true}
        manualRowResize={true}
        manualColumnResize={true}
        autoWrapRow={true}
        autoWrapCol={true}
        undo={true}
        redo={true}
        copyPaste={true}
        comments={true}
        formulas={{
          engine: HyperFormula,
        }}
        fixedRowsTop={1}
        fixedColumnsLeft={1}
        afterChange={(changes) => {
          if (changes) {
            setData((prev) => [...prev]);
          }
        }}
        className="spreadsheet-table"
      />
    </Box>
  );
}

export default SpreadsheetPage;
