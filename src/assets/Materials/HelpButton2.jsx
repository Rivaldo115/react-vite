import { IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Swal from "sweetalert2";

const HelpButton2 = () => {
  const handleHelpClick = () => {
    Swal.fire({
      title: "Ayuda",
      text: "Cada criterio debe estar separado con un punto para poder filtrar de manera correcta, en caso de no tener criterios colocar un punto.",
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

export default HelpButton2;