import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VitalReading } from '@/integrations/firebase/vitals';

interface VitalsChartProps {
  vitals: VitalReading[];
  type: 'heartRate' | 'oxygenSaturation' | 'temperature';
  title: string;
  color: string;
  unit: string;
}

const VitalsChart = ({ vitals, type, title, color, unit }: VitalsChartProps) => {
  // Prepare data for the chart
  const chartData = vitals
    .filter(vital => vital[type] !== undefined)
    .map(vital => ({
      time: new Date(vital.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: vital[type],
      timestamp: vital.timestamp
    }))
    .reverse() // Show oldest to newest
    .slice(-20); // Show last 20 readings

  if (chartData.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: unit, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value) => `Time: ${value}`}
                formatter={(value) => [`${value} ${unit}`, title]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalsChart;
