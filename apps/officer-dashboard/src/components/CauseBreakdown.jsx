import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Make causes human readable
const formatCauseName = (cause) => {
  return cause
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

export default function CauseBreakdown({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic p-4 text-center">
        No cause data to display.
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map(item => ({
    name: formatCauseName(item.cause),
    count: item.count
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value) => [value, 'Failures']}
            cursor={{fill: '#f3f4f6'}}
          />
          <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
