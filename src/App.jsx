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
    //http://127.0.0.1:5000/analyze
    try {
      const response = await axios.post(
        "https://api-flask-c-fx4a.fly.dev/analyze",
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
      if (result.Relevancia && result.Relevancia > 0.5) {
        aceptado++;
        if (result.Relevancia >= 0.5 && result.Relevancia < 0.7) {
          group50to69++;
          group50to69Data.push(result);
        } else if (result.Relevancia >= 0.7 && result.Relevancia < 0.9) {
          group70to89++;
          group70to89Data.push(result);
        } else if (result.Relevancia >= 0.9 && result.Relevancia <= 1) {
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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          padding: 5,
          color: "inherit",
          minHeight: "100vh",
        }}
      >
        <Typography variant="h3" fontWeight="bold">
          Análisis de Artículos
        </Typography>

        <Typography
          variant="h6"
          sx={{ textAlign: "center", maxWidth: "60%", color: "inherit" }}
        >
          Para utilizar esta aplicación, sube un archivo CSV que contenga los
          artículos que deseas analizar. Luego, ingresa el campo de estudio y
          define los criterios de inclusión y exclusión estos deben estar en
          ingles. Finalmente, presiona el botón Analizar para procesar y
          confirmar los datos y obtener las estadísticas correspondientes.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "60%",
            gap: 2,
          }}
        >
          <Typography variant="h6">Cargar Archivo CSV:</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <HelpButton />
          </Box>
          {file && (
            <Typography variant="body2">
              Archivo seleccionado: {file.name}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "60%",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "inherit" }}>
            <Typography variant="h6">Campo de Estudio</Typography>
          </Box>
          <TextField
            label="Campo de Estudio"
            variant="outlined"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            fullWidth
            sx={{
              "& .MuiInputBase-input": {
                color: "black", // Modo claro por defecto
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "& .MuiInputLabel-root": {
                color: "black", // Color del label en modo claro
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "black",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(0, 0, 0, 0.5)", // Placeholder en modo claro
              },
              "@media (prefers-color-scheme: dark)": {
                "& .MuiInputBase-input": {
                  color: "white", // Texto en modo oscuro
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white", // Borde en modo oscuro
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "white !important", // Forzar el label en modo oscuro
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "white !important",
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(255, 255, 255, 0.5)", // Placeholder en modo oscuro
                },
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "60%",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "inherit" }}>
            <Typography variant="h6">Criterios de Inclusión</Typography>
            <HelpButton2 />
          </Box>
          <TextField
            label="Ingresa los criterios de inclusión"
            variant="outlined"
            value={inclusions}
            onChange={(e) => setInclusions(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{
              "& .MuiInputBase-input": {
                color: "black", // Modo claro por defecto
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "& .MuiInputLabel-root": {
                color: "black", // Color del label en modo claro
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "black",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(0, 0, 0, 0.5)", // Placeholder en modo claro
              },
              "@media (prefers-color-scheme: dark)": {
                "& .MuiInputBase-input": {
                  color: "white", // Texto en modo oscuro
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white", // Borde en modo oscuro
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "white !important", // Forzar el label en modo oscuro
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "white !important",
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(255, 255, 255, 0.5)", // Placeholder en modo oscuro
                },
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "60%",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">Criterios de Exclusión</Typography>
            <HelpButton2 />
          </Box>
          <TextField
            label="Ingresa los criterios de exclusión"
            variant="outlined"
            value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{
              "& .MuiInputBase-input": {
                color: "black", // Modo claro por defecto
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "& .MuiInputLabel-root": {
                color: "black", // Color del label en modo claro
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "black",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(0, 0, 0, 0.5)", // Placeholder en modo claro
              },
              "@media (prefers-color-scheme: dark)": {
                "& .MuiInputBase-input": {
                  color: "white", // Texto en modo oscuro
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white", // Borde en modo oscuro
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "white !important", // Forzar el label en modo oscuro
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "white !important",
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(255, 255, 255, 0.5)", // Placeholder en modo oscuro
                },
              },
            }}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenModal}
          sx={{ textTransform: "none" }}
        >
          Analizar
        </Button>

        <Modal open={isModalOpen} onClose={handleCloseModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "#333",
              color: "inherit",
              boxShadow: 24,
              p: 4,
              width: 400,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6">Resumen del Análisis</Typography>
            <Typography>
              <strong>Archivo:</strong> {file?.name || "N/A"}
            </Typography>
            <Typography>
              <strong>Campo de Estudio:</strong> {keywords}
            </Typography>
            <Typography>
              <strong>Criterios de Inclusión:</strong> {inclusions}
            </Typography>
            <Typography>
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

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Button
            onClick={handleManualDownload}
            variant="contained"
            sx={{ textTransform: "none", width: "80%", maxWidth: "300px" }}
            disabled={!downloadableFile}
          >
            Descargar Resultados
          </Button>
        </Box>

        <Box
          className="row"
          sx={{
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 2,
            transition: "all 0.6s ease-in-out",
            opacity: isLoadDos ? 1 : 0,
            transform: isLoadDos ? "translateY(0)" : "translateY(20px)",
            visibility: isLoadDos ? "visible" : "hidden",
          }}
        >
          <Box
            className="column card"
            sx={{
              width: { xs: "90%", sm: "45%", md: "30%" },
              textAlign: "center",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ textAlign: "center" }}
            >
              Artículos Procesados
            </Typography>
            <Typography variant="h5">{ATotal}</Typography>
          </Box>
          <Box
            className="column card"
            sx={{
              width: { xs: "90%", sm: "45%", md: "30%" },
              textAlign: "center",
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              Artículos Aceptados
            </Typography>
            <Typography variant="h5">{AAceptado}</Typography>
          </Box>
          <Box
            className="column card"
            sx={{
              width: { xs: "90%", sm: "45%", md: "30%" },
              textAlign: "center",
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              Artículos Negados
            </Typography>
            <Typography variant="h5">{ANegado}</Typography>
          </Box>
        </Box>

        <Box
          className="row"
          sx={{
            justifyContent: "center",
            flexWrap: "wrap",
            transition: "all 0.6s ease-in-out",
            opacity: isLoadTres ? 1 : 0,
            transform: isLoadTres ? "translateY(0)" : "translateY(20px)",
            visibility: isLoadTres ? "visible" : "hidden",
            margin: "40px 0px",
            display: "flex",
            gap: 3,
          }}
        >
          <Box
            className="column card"
            sx={{
              width: { xs: "90%", sm: "45%", md: "40%" },
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ color: "black" }}>
              Gráfico de Relevancias
            </Typography>
            <BasicLineChart relevances={relevances} />
          </Box>
          <Box
            className="column card"
            sx={{
              width: { xs: "90%", sm: "45%", md: "40%" },
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ color: "black" }}>
              Distribución por Grupos de Relevancia
            </Typography>
            <BasicPie pieData={pieData} />
          </Box>
        </Box>
      </Box>
    </div>
  );
}

export default App;
