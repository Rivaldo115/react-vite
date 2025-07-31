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
import { CircularProgress } from "@mui/material";
import utnLogo from "./assets/img/utn_logo.png";
import { AppBar, Toolbar } from "@mui/material";

function App() {
  const [file, setFile] = useState(null);
  const [currentPage, setCurrentPage] = useState("inicio");
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
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const baseName = uploadedFile.name.split(".").slice(0, -1).join(".");
    setKeywords(baseName);
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
    //https://api-flask-c-fx4a.fly.dev/analyze
    //https://api-flask-prod.fly.dev/analyze
    //https://back-fuerte-1656.fly.dev/analyze
    try {
      const response = await axios.post(
        "https://back-fuerte-1656.fly.dev/analyze",
        formData,
        { cancelToken: source.token }
      );
      console.log("Response received:", response.data);
      console.log(typeof response.data);
      console.log(Array.isArray(response.data));

      let data = response.data;
      

      if (!Array.isArray(data)) {
        console.error("Response data is not an array");
        data = [data];
      }
      console.log("Data after conversion:", data);
      setResults(data);

      handleDownload(data);
    } catch (error) {

      if (axios.isCancel(error)) {
        console.log("La solicitud fue cancelada.");
      } 

      let errorMessage = "Ocurrió un error al realizar la solicitud. Intenta nuevamente.";
      if (error.response && error.response.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
        });
        console.error("Error durante la solicitud:", error);
      }

      setIsLoad(false);
      setIsCanceling(false);
    }

    setIsLoad(false);
    setIsCanceling(false);
    setTimeout(() => setIsLoadDos(true), 1500);
    setTimeout(() => setIsLoadTres(true), 3000);
  };

  //const handleCancel = () => {
    //if (cancelTokenSource) {
      //cancelTokenSource.cancel("La solicitud fue cancelada por el usuario.");
      //setCancelTokenSource(null);
      //Swal.fire({
        //title: "Cancelado",
        //text: "El análisis fue cancelado.",
        //icon: "info",
      //});
    //}
  //};

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

  
  const scores = data
    .map(r => r.Relevancia)
    .filter(r => r != null)
    .sort((a, b) => a - b);

  const idx75 = Math.floor(scores.length * 0.75);
  const threshold = scores[idx75] ?? 0;   
  console.log("Umbral percentil-75:", threshold);

  
  const filteredResults = data.filter((result) => {
    total++;
    if (result.Relevancia != null && result.Relevancia >= threshold) {
      aceptado++;
      
      if (result.Relevancia < threshold + (1 - threshold) * 0.5) {
        group50to69++;
        group50to69Data.push(result);
      } else if (result.Relevancia < threshold + (1 - threshold) * 0.8) {
        group70to89++;
        group70to89Data.push(result);
      } else {
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

  const relevancesData = filteredResults.map(r => r.Relevancia);
  setRelevances(relevancesData);

  const pieData = [
    { id: 0, value: group50to69, label: "A. Baja" },
    { id: 1, value: group70to89, label: "A. Media" },
    { id: 2, value: group90to100, label: "A. Alta" },
  ];
  setPieData(pieData);

  const worksheet1 = XLSX.utils.json_to_sheet(group50to69Data);
  const worksheet2 = XLSX.utils.json_to_sheet(group70to89Data);
  const worksheet3 = XLSX.utils.json_to_sheet(group90to100Data);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet1, "Aceptación baja");
  XLSX.utils.book_append_sheet(workbook, worksheet2, "Aceptación media");
  XLSX.utils.book_append_sheet(workbook, worksheet3, "Aceptación alta");

  const blob = new Blob(
    [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
    { type: "application/octet-stream" }
  );
  setDownloadableFile(blob);
};


  const handleManualDownload = () => {
    if (downloadableFile) {
      const url = window.URL.createObjectURL(downloadableFile);
      const link = document.createElement("a");
      link.href = url;
      const originalName = file?.name?.split(".").slice(0, -1).join(".") || "resultados";
      link.setAttribute("download", `${originalName}-Filtrado.xlsx`);
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

  //const Hclick = () => {
    //Swal.fire({
      //title: "Archivo listo",
      //text: "Puedes verlo en descargas",
      //icon: "success",
    //});
  //};

  return (
    <div className="full-screen" 
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1751335412320-14cbef56564e?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      <AppBar position="static" sx={{ backgroundColor: "#b71c1c" }}>
        <Toolbar>
          <Box
            component="img"
            src={utnLogo}
            alt="UTN Logo"
            sx={{ 
              height: "auto",
              maxHeight: "50px", // o el tamaño máximo que prefieras
              width: "auto",
              marginRight: 2,
            }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, marginLeft: "0%" }}>
            Análisis de Artículos UTN
          </Typography>
          <Button className="navbar-button" onClick={() => setCurrentPage("inicio")}>
            Inicio
          </Button>
          <Button className="navbar-button" onClick={() => setCurrentPage("ayuda")}>
            Ayuda
          </Button>
          <Button className="navbar-button" onClick={() => setCurrentPage("agradecimientos")}>
            Agradecimiento
          </Button>
        </Toolbar>
      </AppBar>
    {currentPage === "inicio" && ( 
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          padding: 5,
          color: "inherit",
          minHeight: "100vh",
          backgroundColor: "rgba(255, 255, 255, 0.85)",  // blanco semitransparente
          borderRadius: 2,
          maxWidth: "900px",
          margin: "20px auto",
          boxShadow: "0 0 15px rgba(0,0,0,0.2)",
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
            className="custom-textfield"
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
            className="custom-textfield"
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
            className="custom-textfield"
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
        {isLoad && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
                    }}
          >
            <CircularProgress sx={{ marginBottom: 2 }} />
            <Typography variant="h6">Procesando el archivo...</Typography>
          </Box>
        )}

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
            <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
              Indica el nivel de relevancia de los artículos aceptados
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
            <Typography variant="body2" sx={{ color: "gray", mb: 1 }}>
              Muestra la categoría de los artículos según su relevancia
            </Typography>
            <BasicPie pieData={pieData} />
          </Box>
        </Box>
      </Box>
    )}
    {currentPage === "agradecimientos" && (
        <Box 
          sx={{ 
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: 5,
            color: "inherit",
            minHeight: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.85)",  // blanco semitransparente
            borderRadius: 2,
            maxWidth: "900px",
            margin: "20px auto",
            boxShadow: "0 0 15px rgba(0,0,0,0.2)",
          }}
        >
          <Typography variant="h4" gutterBottom>
            Agradecimientos
          </Typography>
          <Typography variant="body1" paragraph>
            Quiero expresar mi profundo agradecimiento a todas las personas e instituciones que hicieron posible el desarrollo de esta aplicación.
          </Typography>
          <Typography variant="body1" paragraph>
            Agradezco a la Universidad Técnica del Norte (UTN) por brindarme la formación académica y el espacio necesario para el desarrollo de este proyecto de titulación. Asimismo, agradezco a los docentes que guiaron mi proceso de investigación y aplicación de conocimientos técnicos.
          </Typography>
          <Typography variant="body1" paragraph>
            Este proyecto se apoya en el uso de inteligencia artificial para el análisis semántico de artículos científicos. En particular, se utilizó el modelo preentrenado <strong>all-MiniLM-L6-v2</strong>, cuyo repositorio pertenece a <a href="https://github.com/henrytanner52/all-MiniLM-L6-v2" target="_blank" rel="noopener noreferrer">henrytanner52</a>. Este modelo permite la generación de embeddings que ayudan a evaluar la relevancia de los textos con base en palabras clave, criterios de inclusión y exclusión.
          </Typography>
          <Typography variant="body1" paragraph>
            Gracias también a las plataformas de desarrollo y despliegue utilizadas: <strong>Vercel</strong> para el frontend, y <strong>Fly.io</strong> para el backend, que facilitaron la implementación y publicación del sistema.
          </Typography>
          <Typography variant="body1" paragraph>
            La hermosa imagen de fondo utilizada en la aplicación es cortesía del fotógrafo <strong>Aaron Burden</strong>, a través de <a href="https://unsplash.com/es/@aaronburden" target="_blank" rel="noopener noreferrer">Unsplash</a>.
          </Typography>
          <Typography variant="body1">
            Finalmente, agradezco a mi familia y a quienes me brindaron apoyo moral y técnico durante todo el proceso.
          </Typography>
        </Box>
      )}
      {currentPage === "ayuda" && (
        <Box 
          sx={{ 
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: 5,
            color: "inherit",
            minHeight: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.85)",  // blanco semitransparente
            borderRadius: 2,
            maxWidth: "900px",
            margin: "20px auto",
            boxShadow: "0 0 15px rgba(0,0,0,0.2)",
          }}
        >
          <Typography variant="h4" gutterBottom>
            Guía de Uso
          </Typography>
          <Typography variant="body1" paragraph>
            1. Sube un archivo <code>.csv</code> con las columnas: <strong>Title</strong>, <strong>Abstract</strong> y <strong>DOI</strong>.
          </Typography>
          <Typography variant="body1" paragraph>
            2. Ingresa el campo de estudio en inglés (por ejemplo: <em>sustainable mobility</em>).
          </Typography>
          <Typography variant="body1" paragraph>
            3. Para los criterios de inclusión y exclusión, ingresa cada criterio separado por un punto (<code>.</code>).
          </Typography>
          <Typography variant="body1" paragraph>
            4. Si no tienes criterios para alguna categoría, ingresa un punto (<code>.</code>) en ese campo para continuar.
          </Typography>
          <Typography variant="body1" paragraph>
            5. Presiona el botón <strong>Analizar</strong> para procesar los datos.
          </Typography>
          <Typography variant="body1" paragraph>
            6. Aparecera un cuadro con los datos ingresados, una vez confirmados puedes precionar <strong>Confirmar</strong>.
          </Typography>
          <Typography variant="body1">
            Al finalizar, podrás descargar un archivo con los artículos aceptados y ver estadísticas visuales.
          </Typography>
        </Box>
      )}
    </div>
  );
}

export default App;
