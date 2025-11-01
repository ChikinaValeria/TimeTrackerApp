import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = 'http://127.0.0.1:3010';

// Helper: format date YYYY-MM-DD
const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse server timestamp like "YYYY-MM-DD HH:mm:ss.sss" as UTC Date
const parseServerTsAsUtc = (ts) => new Date(ts.replace(' ', 'T') + 'Z');

// Simple Error Boundary to prevent the whole app from going blank when chart throws
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Chart render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="view-content-box">
          <h3>Chart failed to render</h3>
          <p style={{ color: 'var(--color-danger)' }}>{String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const TaskActivityChart = ({ tasks }) => {
  const [selectedTask, setSelectedTask] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]); // array of {date: 'YYYY-MM-DD', minutes: number}
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // default: previous day -> today
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    setStartDate(fmtDate(yesterday));
    setEndDate(fmtDate(today));

    if (tasks && tasks.length > 0) {
      setSelectedTask(String(tasks[0].id));
    }
  }, [tasks]);

  const validateDates = () => {
    setError(null);
    if (!selectedTask) {
      setError('Please select a task.');
      return false;
    }
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return false;
    }
    const s = new Date(startDate);
    const e = new Date(endDate);
    const today = new Date();
    // zero time for today check
    today.setHours(23,59,59,999);

    if (s > today) {
      setError('Start date cannot be in the future.');
      return false;
    }
    if (s > e) {
      setError('Start date must be before or equal to end date.');
      return false;
    }
    return true;
  };

  const buildDailyBuckets = (intervals, sDate, eDate) => {
    // sDate and eDate are Date objects at local midnight
    const buckets = [];
    const dayMs = 24 * 3600 * 1000;
    for (let d = new Date(sDate); d <= eDate; d = new Date(d.getTime() + dayMs)) {
      buckets.push({ date: fmtDate(d), startMs: d.getTime(), endMs: d.getTime() + dayMs, minutes: 0 });
    }

    const nowMs = Date.now();

    intervals.forEach(iv => {
      const ivStart = iv.startMs;
      const ivEnd = iv.endMs === null ? nowMs : iv.endMs;
      if (ivEnd <= ivStart) return;

      // add contribution to each bucket that intersects
      buckets.forEach(b => {
        const overlapStart = Math.max(ivStart, b.startMs);
        const overlapEnd = Math.min(ivEnd, b.endMs);
        const overlap = Math.max(0, overlapEnd - overlapStart);
        b.minutes += Math.round(overlap / 60000);
      });
    });

    return buckets.map(b => ({ date: b.date, minutes: b.minutes }));
  };

  const fetchAndCompute = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateDates()) return;

    setIsLoading(true);
    setError(null);
    setData([]);

    try {
      const resp = await fetch(`${API_URL}/timesfortask/${selectedTask}`);
      if (!resp.ok) throw new Error('Failed to fetch timestamps');
      const timestamps = await resp.json();

      // Sort timestamps by actual time
      const sorted = timestamps.slice().sort((a, b) => parseServerTsAsUtc(a.timestamp) - parseServerTsAsUtc(b.timestamp));

      // Build intervals: pair START(0) with next STOP(1) if any, otherwise end=null
      const intervals = [];
      const usedStopIds = new Set();

      for (let i = 0; i < sorted.length; i++) {
        const ts = sorted[i];
        if (ts.type !== 0) continue; // skip non-start
        const startMs = parseServerTsAsUtc(ts.timestamp).getTime();
        // find next stop
        let found = false;
        for (let j = i + 1; j < sorted.length; j++) {
          const t2 = sorted[j];
          if (t2.type === 1 && !usedStopIds.has(t2.id)) {
            const endMs = parseServerTsAsUtc(t2.timestamp).getTime();
            intervals.push({ startMs, endMs });
            usedStopIds.add(t2.id);
            found = true;
            break;
          }
        }
        if (!found) {
          intervals.push({ startMs, endMs: null });
        }
      }

      // Build day range in local timezone
      const sParts = startDate.split('-').map(Number);
      const eParts = endDate.split('-').map(Number);
      const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2], 0, 0, 0, 0);
      const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2], 0, 0, 0, 0);

      const buckets = buildDailyBuckets(intervals, sDate, eDate);
      setData(buckets);
    } catch (err) {
      console.error(err);
      setError('Failed to load data for chart.');
    } finally {
      setIsLoading(false);
    }
  };

  // Read chart color from CSS variables so chart adapts to theme
  const [chartColor, setChartColor] = useState(null);
  useEffect(() => {
    try {
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
      if (cs) setChartColor(cs.trim());
    } catch {
      // ignore
    }
  }, []);

  // Simple bar chart render
  const labels = data.map(d => d.date);
  const values = data.map(d => d.minutes);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Active minutes',
        data: values,
        backgroundColor: chartColor || 'rgba(59,130,246,0.9)'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const v = context.parsed && context.parsed.y != null ? context.parsed.y : context.formattedValue;
            return `${v} min`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 10 }, title: { display: true, text: 'Minutes' } }
    }
  };

  // Simple plugin to draw value labels above bars (no extra dependency)
  const dataLabelPlugin = {
    id: 'dataLabelPlugin',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar, index) => {
          const value = dataset.data[index];
          if (value === null || value === undefined) return;
          const x = bar.x;
          const y = bar.y - 6; // a bit above the bar
          ctx.save();
          ctx.fillStyle = window.getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(String(value), x, y);
          ctx.restore();
        });
      });
    }
  };

  return (
    <div className="view-content-box">
      <h2 className="view-title">Task Activity Chart</h2>
      <p className="view-text">Daily active minutes per selected task.</p>

      <form onSubmit={fetchAndCompute} className="summary-form">
        <div className="form-group">
          <label htmlFor="taskSelect">Task:</label>
          <select id="taskSelect" className="form-input" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
            <option value="">-- Select task --</option>
            {tasks && tasks.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input id="startDate" type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input id="endDate" type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button className="generate-summary-button" type="submit" disabled={isLoading}>{isLoading ? 'Loading...' : 'Show Chart'}</button>
      </form>

      {error && <p className="error-message" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <div style={{ marginTop: 20, height: 320 }}>
        {data.length === 0 ? (
          <p style={{ margin: 0 }}>No data. Pick task and period, then click Show Chart.</p>
        ) : (
          <div style={{ height: '100%' }}>
            <Bar data={chartData} options={options} plugins={[dataLabelPlugin]} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskActivityChart;
