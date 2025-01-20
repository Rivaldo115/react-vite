import { LineChart } from '@mui/x-charts/LineChart';

export default function BasicLineChart({ relevances }) {
  return (
    <LineChart
      xAxis={[{ data: Array.from({ length: relevances.length }, (_, i) => i + 1) }]} 
      series={[
        {
          data: relevances, 
        },
      ]}
      width={500}
      height={300}
    />
  );
}
