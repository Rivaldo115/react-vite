// src/hooks/useAnalyzer.js

import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export const useAnalyzer = () => {
  // Estados principales
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");

  const [AAceptado, setAAceptado] = useState(0);
  const [ANegado, setANegado] = useState(0);
  const [ATotal, setATotal] = useState(0);

  const [relevances, setRelevances] = useState([]);
  const [pieData, setPieData] = useState([]);

  const [downloadableFile, setDownloadableFile] = useState(null);

  const [isLoad, setIsLoad] = useState(false);
  const [isLoadDos, setIsLoadDos] = useState(false);
  const [isLoadTres, setIsLoadTres] = useState(false);

  // Maneja cambio de archivo CSV
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "text/csv") {
      setFile(selected);
    } else {
      Swal.fire("Error", "Por favor sube un archivo CSV válido.", "error");
      setFile(null);
    }
  };

  // Validaciones previas al análisis
  const validateInputs = () => {
    if (!file) {
      Swal.fire("Error", "Debes subir un archivo CSV.", "error");
      return false;
    }
    if (!keywords.trim()) {
      Swal.fire("Error", "El campo de estudio no puede estar vacío.", "error");
      return false;
    }
    if (!inclusions.trim()) {
      Swal.fire("Error", "Ingresa al menos un criterio de inclusión.", "error");
      return false;
    }
    if (!exclusions.trim()) {
      Swal.fire("Error", "Ingresa al menos un criterio de exclusión.", "error");
      return false;
    }
    return true;
  };

  // Temporizadores para mostrar progresivamente resultados
  const triggerDelayedVisuals = () => {
    setIsLoadDos(false);
    setIsLoadTres(false);
    setTimeout(() => setIsLoadDos(true), 1000);
    setTimeout(() => setIsLoadTres(true), 1500);
  };

  // Función principal que llama al backend para analizar
  const analyzeData = async () => {
    if (!validateInputs()) return;

    setIsLoad(true);
    setIsLoadDos(false);
    setIsLoadTres(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("keywords", keywords);
    formData.append("inclusions", inclusions);
    formData.append("exclusions", exclusions);

    try {
      const response = await axios.post("https://api-flask-prod.fly.dev/analyze", formData);
      const data = response.data;

      setAAceptado(data.accepted || 0);
      setANegado(data.rejected || 0);
      setATotal(data.total || 0);

      setRelevances(data.relevances || []);
      setPieData(data.pieChart || []);
      setDownloadableFile(data.outputFile || null);

      triggerDelayedVisuals();
    } catch (error) {
      Swal.fire("Error", "Error al analizar los datos. Intenta de nuevo.", "error");
      console.error(error);
    } finally {
      setIsLoad(false);
    }
  };

  // Maneja descarga del archivo resultante
  const handleDownload = () => {
    if (!downloadableFile) {
      Swal.fire("Atención", "No hay archivo para descargar.", "info");
      return;
    }
    const link = document.createElement("a");
    link.href = downloadableFile;
    link.download = "resultado.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    // Estados
    file,
    keywords,
    inclusions,
    exclusions,
    AAceptado,
    ANegado,
    ATotal,
    relevances,
    pieData,
    downloadableFile,
    isLoad,
    isLoadDos,
    isLoadTres,

    // Setters
    setKeywords,
    setInclusions,
    setExclusions,

    // Funciones
    handleFileChange,
    analyzeData,
    handleDownload,
    setDownloadableFile,
  };
};

