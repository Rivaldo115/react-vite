import { useState } from "react";
import "./App.css";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import axios from "axios";
import { Box, Button, Typography } from "@mui/material";
import BasicLineChart from "./assets/Materials/BasicLineChart";
import BasicPie from "./assets/Materials/Pie";
import TextField from "@mui/material/TextField";
import HelpButton from "./assets/Materials/HelpButton";
import HelpButton2 from "./assets/Materials/HelpButton2";
import MaterialTitle from "./assets/Materials/MaterialTitle";
import { Modal } from "@mui/material";

function App() {
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [results, setResults] = useState([]);
  const [warning, setWarning] = useState("");
  const [ATotal, setATotal] = useState(0);
  const [ANegado, setANegado] = useState(0);
  const [AAceptado, setAAceptado] = useState(0);
  const [relevances, setRelevances] = useState([]);
  const [downloadableFile, setDownloadableFile] = useState(null);

  const [isLoad, setIsLoad] = useState(false);
  const [isLoadDos, setIsLoadDos] = useState(false);
  const [isLoadTres, setIsLoadTres] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [cancelTokenSource, setCancelTokenSource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pieData, setPieData] = useState([]);

  const sxStatistics = {
    width: {
      xs: "80%",
      sm: "80%",
      md: "15%",
      lg: "15%",
      xl: "15%",
    },
    transition: "all 0.5s ease-in-out",
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleOpenModal = () => {
    if (file && file.type !== "text/csv") {
      Swal.fire({
        title: "Error",
        text: "Por favor, selecciona un archivo CSV válido.",
        icon: "error",
      });
      return;
    } else if (!file || !keywords || !inclusions || !exclusions) {
      Swal.fire({
        title: "Error",
        text: "Por favor, completa todos los campos antes de continuar.",
        icon: "error",
      });
      return;
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmAnalyze = () => {
    setIsModalOpen(false);
    handleAnalyze();
  };

  const handleAnalyze = async () => {
    setIsLoad(true);
    setIsLoadDos(false);
    setIsLoadTres(false);
    setIsCanceling(true);
    setWarning("");

    const source = axios.CancelToken.source();
    setCancelTokenSource(source);

    const controller = new AbortController();
    setAbortController(controller);

    setWarning("");
    console.log("Analyze button clicked");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("keywords", keywords);
    formData.append("inclusions", inclusions);
    formData.append("exclusions", exclusions);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/analyze",
        formData,
        { cancelToken: source.token }
      );
      console.log("Response received:", response.data);

      let data;
      try {
        const cleanData = response.data.replace(/NaN/g, "null");
        data = JSON.parse(cleanData);
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "Ocurrió un error durante el análisis. Verifica tu archivo e intenta nuevamente.",
          icon: "error",
        });
        console.error("Error durante el analisis:", error);
        setIsLoad(false);
        setIsCanceling(false);
        return;
      }

      if (!Array.isArray(data)) {
        console.error("Response data is not an array:", data);
        data = [data];
      }
      console.log("Data after conversion:", data);
      setResults(data);

      handleDownload(data);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("La solicitud fue cancelada.");
      } else {
        Swal.fire({
          title: "Error",
          text: "Ocurrió un error al realizar la solicitud. Intenta nuevamente.",
          icon: "error",
        });
      }
      setIsLoad(false);
      setIsCanceling(false);
    }

    setIsLoad(false);
    setIsCanceling(false);
    setTimeout(() => setIsLoadDos(true), 1500);
    setTimeout(() => setIsLoadTres(true), 3000);
  };

  const handleCancel = () => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel("La solicitud fue cancelada por el usuario.");
      setCancelTokenSource(null);
      Swal.fire({
        title: "Cancelado",
        text: "El análisis fue cancelado.",
        icon: "info",
      });
    }
  };

  const handleDownload = (data) => {
    let total = 0;
    let aceptado = 0;
    let negado = 0;
    let group50to69 = 0;
    let group70to89 = 0;
    let group90to100 = 0;

    const group50to69Data = [];
    const group70to89Data = [];
    const group90to100Data = [];

    const filteredResults = data.filter((result) => {
      total++;
      if (result.Relevancia && result.Relevancia > 0.50) {
        aceptado++;
        if (result.Relevancia >= 0.50 && result.Relevancia < 0.70) {
          group50to69++;
          group50to69Data.push(result);
        } else if (result.Relevancia >= 0.70 && result.Relevancia < 0.90) {
          group70to89++;
          group70to89Data.push(result);
        } else if (result.Relevancia >= 0.90 && result.Relevancia <= 1) {
          group90to100++;
          group90to100Data.push(result);
        }
        return true;
      } else {
        negado++;
        return false;
      }
    });

    setATotal(total);
    setAAceptado(aceptado);
    setANegado(negado);

    const relevancesData = filteredResults.map((result) => result.Relevancia);
    setRelevances(relevancesData);

    const pieData = [
      { id: 0, value: group50to69, label: "50-69" },
      { id: 1, value: group70to89, label: "70-89" },
      { id: 2, value: group90to100, label: "90-100" },
    ];

    setPieData(pieData);

    const worksheet1 = XLSX.utils.json_to_sheet(group50to69Data);
    const worksheet2 = XLSX.utils.json_to_sheet(group70to89Data);
    const worksheet3 = XLSX.utils.json_to_sheet(group90to100Data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet1, "50-69");
    XLSX.utils.book_append_sheet(workbook, worksheet2, "70-89");
    XLSX.utils.book_append_sheet(workbook, worksheet3, "90-100");

    const blob = new Blob(
      [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
      {
        type: "application/octet-stream",
      }
    );
    setDownloadableFile(blob);
    //Hclick();
  };

  const handleManualDownload = () => {
    if (downloadableFile) {
      const url = window.URL.createObjectURL(downloadableFile);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "results.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Swal.fire({
        title: "Error",
        text: "No hay archivo disponible para descargar.",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    }
  };

  const Hclick = () => {
    Swal.fire({
      title: "Archivo listo",
      text: "Puedes verlo en descargas",
      icon: "success",
    });
  };

  return (
    <div className="full-screen">
      <h1>Análisis de Artículos</h1>
      <HelpButton />
      {warning && <p style={{ color: "red" }}>{warning}</p>}
      <Box className="row">
        <Box className="column" sx={{ width: "50%" }}>
          <Box className="row">
            <Box className="column" sx={{ width: "50%" }}>
              <Typography variant="h6">Cargar Archivo CSV:</Typography>
            </Box>
            <Box className="column" sx={{ width: "50%" }}>
              <input type="file" accept=".csv" onChange={handleFileChange} />
            </Box>
          </Box>
          <Box className="row">
            <Box className="column" sx={{ width: "50%" }}>
              <Typography variant="h6">Campo de Estudio:</Typography>
            </Box>
            <Box className="column" sx={{ width: "100%" }}>
              <TextField
                id="keyword-input"
                label="Ingresa el campo de estudio"
                variant="outlined"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                fullWidth
              />
            </Box>
          </Box>
          <Box
            className="row"
            sx={{
              justifyContent: "space-between",
              display: "flex",
              gap: 2,
              marginTop: 2,
            }}
          >
            <Box className="column" sx={{ flex: 1 }}>
              <Typography variant="h6">Criterios de Inclusión</Typography>
            </Box>
            <Box className="column" sx={{ width: "45%" }}>
              <TextField
                id="keyword-input"
                label="Ingresa los criterios de inclusión"
                variant="outlined"
                value={inclusions}
                onChange={(e) => setInclusions(e.target.value)}
                fullWidth
                multiline
                maxRows={4}
                InputProps={{
                  style: {
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                  },
                }}
              />
            </Box>
            <HelpButton2 />
            <Box className="column" sx={{ flex: 1 }}>
              <Typography variant="h6">Criterios de Exclusión</Typography>
            </Box>
            <Box className="column" sx={{ width: "45%" }}>
              <TextField
                id="keyword-input"
                label="Ingresa los criterios de exclusión"
                variant="outlined"
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                fullWidth
                multiline
                maxRows={4}
                InputProps={{
                  style: {
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box>
        <Button
          onClick={handleOpenModal}
          disabled={isLoad}
          variant="contained"
          sx={{ margin: 5, textTransform: "none" }}
        >
          <Typography variant="h6">Analizar</Typography>
        </Button>
        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "#333", // Fondo oscuro
              color: "#fff", // Texto blanco para contraste
              boxShadow: 24,
              p: 4,
              width: 400,
              borderRadius: 2,
            }}
          >
            <Typography id="modal-title" variant="h6" gutterBottom>
              Resumen del Análisis
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Nombre del Archivo:</strong> {file?.name || "N/A"}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Palabra Clave:</strong> {keywords}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Criterios de Inclusión:</strong> {inclusions}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Criterios de Exclusión:</strong> {exclusions}
            </Typography>

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmAnalyze}
              >
                Confirmar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>

      <Button
        onClick={handleManualDownload}
        variant="contained"
        sx={{ margin: 5, textTransform: "none" }}
        disabled={!downloadableFile}
      >
        <Typography variant="h6">Descargar Resultados</Typography>
      </Button>
      <Box
        className="row"
        sx={{
          justifyContent: "space-around",
          transition: "all 0.6s ease-in-out",
          opacity: isLoad ? 1 : 0,
          transform: isLoad ? "translateY(0)" : "translateY(20px)",
          visibility: isLoad ? "visible" : "hidden",
          margin: "30px 0px",
        }}
      >
        <Box className="column" sx={{ width: "100%" }}>
          <Typography variant="h3">Estadisticas</Typography>
        </Box>
      </Box>
      <Box
        className="row"
        sx={{
          justifyContent: "space-around",
          transition: "all 0.6s ease-in-out",
          opacity: isLoadDos ? 1 : 0,
          transform: isLoadDos ? "translateY(0)" : "translateY(20px)",
          visibility: isLoadDos ? "visible" : "hidden",
        }}
      >
        <Box className="column card" sx={sxStatistics}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ textAlign: "center" }}
          >
            Artículos Procesados
          </Typography>
          <Typography variant="h5">{ATotal}</Typography>
        </Box>
        <Box className="column card" sx={sxStatistics}>
          <Typography variant="h5" fontWeight="bold">
            Artículos Aceptados
          </Typography>
          <Typography variant="h5">{AAceptado}</Typography>
        </Box>
        <Box className="column card" sx={sxStatistics}>
          <Typography variant="h5" fontWeight="bold">
            Artículos Negados
          </Typography>
          <Typography variant="h5">{ANegado}</Typography>
        </Box>
      </Box>
      <Box
        className="row"
        sx={{
          justifyContent: "space-between",
          transition: "all 0.6s ease-in-out",
          opacity: isLoadTres ? 1 : 0,
          transform: isLoadTres ? "translateY(0)" : "translateY(20px)",
          visibility: isLoadTres ? "visible" : "hidden",
          margin: "90px 0px",
        }}
      >
        <Box
          className="column card"
          sx={{ width: "40%", margin: "0px 30px", backgroundColor: "#ffffff" }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ color: "black" }}>
            Gráfico de Relevancias
          </Typography>
          <BasicLineChart relevances={relevances} />
        </Box>
        <Box
          className="column card"
          sx={{ width: "40%", margin: "0px 30px", backgroundColor: "#ffffff" }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ color: "black" }}>
            Distribución por Grupos de Relevancia
          </Typography>
          <BasicPie pieData={pieData} />
        </Box>
      </Box>
    </div>
  );
}

export default App;
