import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

/**
 * Small salary-distribution chart over the *currently filtered* results, so it
 * answers "what does this search pay?" rather than showing a static figure.
 *
 * One hue only — purple, with the modal band emphasised. Bar charts do not
 * need a categorical palette when the category is already on the axis.
 */
export const SalaryInsights = ({ jobs }) => {
  if (jobs.length < 3) return null;

  const bands = [
    { band: '0–15', min: 0, max: 15 },
    { band: '15–25', min: 15, max: 25 },
    { band: '25–35', min: 25, max: 35 },
    { band: '35–50', min: 35, max: 50 },
    { band: '50+', min: 50, max: Infinity },
  ];

  const data = bands.map((bucket) => ({
    band: bucket.band,
    count: jobs.filter((job) => {
      const mid = (job.salaryMin + job.salaryMax) / 2;
      return mid >= bucket.min && mid < bucket.max;
    }).length,
  }));

  const peak = Math.max(...data.map((entry) => entry.count));
  const median = [...jobs]
    .map((job) => (job.salaryMin + job.salaryMax) / 2)
    .sort((a, b) => a - b)[Math.floor(jobs.length / 2)];

  return (
    <section
      className="rounded-card border border-ink-200 bg-surface p-4"
      aria-labelledby="salary-insights-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="salary-insights-title"
            className="flex items-center gap-1.5 text-[13px] font-semibold tracking-heading text-ink-900"
          >
            <TrendingUp className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />
            Salary spread
          </h2>
          <p className="mt-0.5 text-[11px] text-ink-500">
            Across {jobs.length} matching {jobs.length === 1 ? 'role' : 'roles'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-ink-500">Median</p>
          <p className="text-[15px] font-semibold tracking-heading text-ink-900">
            {Math.round(median)} LPA
          </p>
        </div>
      </div>

      <div className="mt-2.5 h-[76px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: -28 }}>
            <XAxis
              dataKey="band"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#A9A296' }}
              dy={2}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: '#F3F1ED' }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #E7E3DC',
                fontSize: 12,
                padding: '6px 10px',
                boxShadow: '0 4px 12px -2px rgb(28 25 23 / 0.08)',
              }}
              labelStyle={{ color: '#5E584E', fontSize: 11 }}
              formatter={(value) => [`${value} ${value === 1 ? 'role' : 'roles'}`, '']}
              labelFormatter={(label) => `${label} LPA`}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.band}
                  fill={entry.count === peak && peak > 0 ? '#5B21B6' : '#DDD2F7'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
