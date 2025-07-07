import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";

import Handsontable from "handsontable";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";

registerAllModules(); // mergeCells, dropdownMenu, formulas, etc.

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
          const empty = Array.from({ length: 20 }, () =>
            Array.from({ length: 10 }, () => "")
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
        manualRowResize={true}
        manualColumnResize={true}
        autoWrapRow
        autoWrapCol
        formulas={true}
        filters={false} // ❌ DISABLED to prevent crash

        afterChange={(changes) => {
          if (changes) {
            setData((prev) => [...prev]);
          }
        }}
      />
    </Box>
  );
}

export default SpreadsheetPage;
