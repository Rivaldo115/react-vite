import { IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Swal from "sweetalert2";

const HelpButton = () => {
  const handleHelpClick = () => {
    Swal.fire({
      title: "Ayuda",
      text: "El archivo debe ser .csv y deberá tener los siguientes campos obligatorios: Title, Year, DOI, Abstract.",
      icon: "info",
      confirmButtonText: "Entendido",
    });
  };

  return (
    <IconButton onClick={handleHelpClick} aria-label="help" color="primary">
      <HelpOutlineIcon />
    </IconButton>
  );
};

export default HelpButton;
