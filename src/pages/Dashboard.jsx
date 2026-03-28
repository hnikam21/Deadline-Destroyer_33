import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    HiOutlineBookOpen,
    HiOutlineCheck,
    HiOutlineClock,
    HiOutlineFire,
    HiOutlineExclamation,
    HiOutlineLightningBolt,
} from 'react-icons/hi';
import { useTopics } from '../context/TopicContext';
import {
    isTopicDueToday,
    isTopicAtRisk,
    getRetentionStatus,
    getRetentionLabel,
    getRetentionColor,
    calculateStreak,
    formatDate,
} from '../utils/spacedRepetition';
import SuccessAnimation from '../components/SuccessAnimation';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
    const { topics, markRevised } = useTopics();
    const navigate = useNavigate();
    const [showSuccess, setShowSuccess] = useState(false);
    const [justRevised, setJustRevised] = useState(new Set());

    const todaysTopics = useMemo(() => topics.filter(isTopicDueToday), [topics]);
    const atRiskTopics = useMemo(
        () => topics.filter((t) => isTopicAtRisk(t) && !isTopicDueToday(t)),
        [topics]
    );

    const todayRevisionCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let count = 0;
        topics.forEach((t) => {
            (t.revisions || []).forEach((r) => {
                const rd = new Date(r);
                rd.setHours(0, 0, 0, 0);
                if (rd.getTime() === today.getTime()) count++;
            });
        });
        return count;
    }, [topics]);

    const streak = useMemo(() => calculateStreak(topics), [topics]);
    const pendingCount = todaysTopics.filter((t) => !justRevised.has(t.id)).length;

    const handleQuickRevise = (id) => {
        markRevised(id);
        setJustRevised((prev) => new Set([...prev, id]));
        setShowSuccess(true);
    };

    const stats = [
        {
            icon: <HiOutlineBookOpen />,
            label: 'Total Topics',
            value: topics.length,
            color: '#6366F1',
            bg: 'rgba(99, 102, 241, 0.15)',
            gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        },
        {
            icon: <HiOutlineCheck />,
            label: 'Revised Today',
            value: todayRevisionCount,
            color: '#10B981',
            bg: 'rgba(16, 185, 129, 0.15)',
            gradient: 'linear-gradient(135deg, #10B981, #34D399)',
        },
        {
            icon: <HiOutlineClock />,
            label: 'Pending Today',
            value: pendingCount,
            color: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.15)',
            gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
        },
        {
            icon: <HiOutlineFire />,
            label: 'Current Streak',
            value: `${streak} 🔥`,
            color: '#EF4444',
            bg: 'rgba(239, 68, 68, 0.15)',
            gradient: 'linear-gradient(135deg, #EF4444, #F87171)',
        },
    ];

    return (
        <>
            <SuccessAnimation
                show={showSuccess}
                message="Revision Complete!"
                subtitle="Great job keeping your knowledge fresh!"
                onComplete={() => setShowSuccess(false)}
            />

            <motion.div variants={container} initial="hidden" animate="show">
                <motion.div variants={item} className="page-header">
                    <h1>Dashboard</h1>
                    <p>Welcome back! Here's your learning overview.</p>
                </motion.div>

                {/* Stats */}
                <motion.div variants={item} className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            className="stat-card"
                            variants={item}
                            whileHover={{ y: -4 }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: stat.gradient,
                                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                                }}
                            />
                            <div
                                className="stat-icon"
                                style={{ background: stat.bg, color: stat.color }}
                            >
                                {stat.icon}
                            </div>
                            <div className="stat-value" style={{ color: stat.color }}>
                                {stat.value}
                            </div>
                            <div className="stat-label">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* At Risk Warning */}
                {atRiskTopics.length > 0 && (
                    <motion.div variants={item} className="at-risk-section">
                        <h3 className="animate-pulse-warning">
                            <HiOutlineExclamation /> ⚠️ You might forget these topics soon
                        </h3>
                        <div className="revision-list">
                            {atRiskTopics.slice(0, 5).map((topic) => {
                                const status = getRetentionStatus(topic.revisionCount);
                                return (
                                    <div key={topic.id} className="revision-item">
                                        <div className="revision-info">
                                            <span
                                                className={`badge badge-${status}`}
                                                style={{ fontSize: '0.7rem' }}
                                            >
                                                {getRetentionLabel(status)}
                                            </span>
                                            <span className="revision-title">{topic.title}</span>
                                        </div>
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={() => navigate('/revision', { state: { topicId: topic.id } })}
                                        >
                                            Revise Now
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Today's Revisions */}
                <motion.div variants={item}>
                    <div className="section-header">
                        <h2>
                            <HiOutlineLightningBolt style={{ color: 'var(--primary-400)' }} />
                            Today's Revisions
                        </h2>
                        <span className="badge badge-pending">{todaysTopics.length} topics</span>
                    </div>

                    {todaysTopics.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">🎉</div>
                                <h3>All caught up!</h3>
                                <p>No revisions due today. Add new topics to start building your knowledge base.</p>
                                <button
                                    className="btn btn-primary"
                                    style={{ marginTop: '20px' }}
                                    onClick={() => navigate('/add')}
                                >
                                    + Add Topic
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="revision-list">
                            {todaysTopics.map((topic) => {
                                const isDone = justRevised.has(topic.id);
                                const status = getRetentionStatus(topic.revisionCount);
                                return (
                                    <motion.div
                                        key={topic.id}
                                        className="revision-item"
                                        variants={item}
                                        style={{
                                            opacity: isDone ? 0.5 : 1,
                                            borderColor: isDone
                                                ? 'rgba(16, 185, 129, 0.2)'
                                                : undefined,
                                        }}
                                    >
                                        <div className="revision-info">
                                            <span className={`badge badge-${status}`}>
                                                {getRetentionLabel(status)}
                                            </span>
                                            <div>
                                                <span className="revision-title">{topic.title}</span>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                    Revision #{topic.revisionCount + 1} • Due {formatDate(topic.nextRevisionDate)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {isDone ? (
                                                <span className="badge badge-done">✓ Done</span>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => navigate('/revision', { state: { topicId: topic.id } })}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleQuickRevise(topic.id)}
                                                    >
                                                        ✓ Mark Done
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </>
    );
}
