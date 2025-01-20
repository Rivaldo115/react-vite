import { PieChart } from '@mui/x-charts/PieChart';

export default function BasicPie({ pieData }) {
  return (
    <PieChart
      series={[
        {
          data: pieData, // Usa los datos de los grupos de relevancia
        },
      ]}
      width={400}
      height={200}
    />
  );
}

