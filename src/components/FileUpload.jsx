import React, { useRef } from "react";
import { Button, Typography, Box } from "@mui/material";
import UploadIcon from '@mui/icons-material/Upload';

const FileUpload = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Button variant="contained" startIcon={<UploadIcon />} onClick={handleButtonClick}>
        Cargar Archivo CSV
      </Button>
    </Box>
  );
};

export default FileUpload;
