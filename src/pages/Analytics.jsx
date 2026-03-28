import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    HiOutlineChartBar,
    HiOutlineFire,
    HiOutlineTrendingUp,
    HiOutlineBookOpen,
} from 'react-icons/hi';
import { useTopics } from '../context/TopicContext';
import {
    getRetentionStatus,
    getRevisionsPerDay,
    calculateStreak,
} from '../utils/spacedRepetition';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Filler);

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function Analytics() {
    const { topics } = useTopics();

    const stats = useMemo(() => {
        const totalRevisions = topics.reduce((sum, t) => sum + (t.revisionCount || 0), 0);
        const weakCount = topics.filter((t) => getRetentionStatus(t.revisionCount) === 'weak').length;
        const mediumCount = topics.filter((t) => getRetentionStatus(t.revisionCount) === 'medium').length;
        const strongCount = topics.filter((t) => getRetentionStatus(t.revisionCount) === 'strong').length;
        const streak = calculateStreak(topics);
        const avgRetention = topics.length > 0
            ? Math.round((topics.reduce((sum, t) => sum + Math.min(t.revisionCount / 6, 1), 0) / topics.length) * 100)
            : 0;

        return { totalRevisions, weakCount, mediumCount, strongCount, streak, avgRetention };
    }, [topics]);

    const dailyData = useMemo(() => getRevisionsPerDay(topics, 14), [topics]);

    const barChartData = {
        labels: dailyData.map((d) => d.date),
        datasets: [
            {
                label: 'Revisions',
                data: dailyData.map((d) => d.count),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                titleFont: { family: 'Inter', size: 13 },
                bodyFont: { family: 'Inter', size: 12 },
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } },
                grid: { display: false },
                border: { display: false },
            },
            y: {
                ticks: {
                    color: '#64748B',
                    font: { family: 'Inter', size: 11 },
                    stepSize: 1,
                },
                grid: { color: 'rgba(148, 163, 184, 0.06)' },
                border: { display: false },
            },
        },
    };

    const doughnutData = {
        labels: ['Weak', 'Medium', 'Strong'],
        datasets: [
            {
                data: [stats.weakCount, stats.mediumCount, stats.strongCount],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(16, 185, 129, 1)',
                ],
                borderWidth: 2,
                spacing: 4,
                borderRadius: 4,
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#94A3B8',
                    font: { family: 'Inter', size: 12 },
                    padding: 20,
                    usePointStyle: true,
                    pointStyleWidth: 10,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                titleFont: { family: 'Inter', size: 13 },
                bodyFont: { family: 'Inter', size: 12 },
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
            },
        },
    };

    const summaryStats = [
        {
            icon: <HiOutlineBookOpen />,
            label: 'Total Revisions',
            value: stats.totalRevisions,
            color: '#6366F1',
            bg: 'rgba(99, 102, 241, 0.15)',
        },
        {
            icon: <HiOutlineTrendingUp />,
            label: 'Avg. Retention',
            value: `${stats.avgRetention}%`,
            color: '#10B981',
            bg: 'rgba(16, 185, 129, 0.15)',
        },
        {
            icon: <HiOutlineFire />,
            label: 'Longest Streak',
            value: `${stats.streak} 🔥`,
            color: '#EF4444',
            bg: 'rgba(239, 68, 68, 0.15)',
        },
    ];

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="page-header">
                <h1>Analytics</h1>
                <p>Track your learning progress and retention over time.</p>
            </motion.div>

            {/* Summary stats */}
            <motion.div variants={item} className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {summaryStats.map((stat, i) => (
                    <motion.div
                        key={i}
                        className="stat-card"
                        variants={item}
                        whileHover={{ y: -2 }}
                    >
                        <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-value" style={{ color: stat.color, fontSize: '1.75rem' }}>
                            {stat.value}
                        </div>
                        <div className="stat-label">{stat.label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <motion.div variants={item} className="chart-container">
                    <h3>
                        <HiOutlineChartBar style={{ display: 'inline', marginRight: '8px', verticalAlign: '-2px' }} />
                        Revisions Over Time
                    </h3>
                    <div style={{ height: '300px' }}>
                        {topics.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Add topics and start revising to see your activity chart.</p>
                            </div>
                        ) : (
                            <Bar data={barChartData} options={barChartOptions} />
                        )}
                    </div>
                </motion.div>

                <motion.div variants={item} className="chart-container">
                    <h3>Topic Distribution</h3>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {topics.length === 0 ? (
                            <div className="empty-state" style={{ padding: '20px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data yet.</p>
                            </div>
                        ) : (
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        )}
                    </div>
                </motion.div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 2fr 1fr"] {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
        </motion.div>
    );
}
