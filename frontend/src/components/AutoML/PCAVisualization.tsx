import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PCAVisualization({ pcaStats }: { pcaStats: any }) {
  if (!pcaStats) return null;

  const explainedVarianceData = pcaStats.explained_variance_ratio.map((val: number, i: number) => ({
    component: `PC${i + 1}`,
    variance: val * 100
  }));

  const cumulativeData = pcaStats.explained_variance_ratio.map((_val: number, i: number, arr: number[]) => {
    const sum = arr.slice(0, i + 1).reduce((acc, v) => acc + v, 0);
    return {
      component: `PC${i + 1}`,
      cumulative: sum * 100
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Explained Variance per Component</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={explainedVarianceData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="component" />
              <YAxis tickFormatter={(val) => `${val}%`} />
              <Tooltip formatter={(val: number) => `${val.toFixed(2)}%`} />
              <Line type="monotone" dataKey="variance" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Cumulative Variance</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="component" />
              <YAxis tickFormatter={(val) => `${val}%`} />
              <Tooltip formatter={(val: number) => `${val.toFixed(2)}%`} />
              <Area type="monotone" dataKey="cumulative" stroke="#10B981" fill="#D1FAE5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
