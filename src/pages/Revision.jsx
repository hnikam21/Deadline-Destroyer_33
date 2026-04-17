import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCheck,
    HiOutlineClock,
    HiOutlineRefresh,
    HiOutlineArrowLeft,
    HiOutlineSparkles,
} from 'react-icons/hi';
import { useTopics } from '../context/TopicContext';
import {
    isTopicDueToday,
    getRetentionStatus,
    getRetentionLabel,
    getRetentionColor,
    formatDate,
} from '../utils/spacedRepetition';
import { summarizeTopic } from '../utils/geminiService';
import SuccessAnimation from '../components/SuccessAnimation';
import FlashcardMode from '../components/FlashcardMode';
import TestMode from '../components/TestMode';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function Revision() {
    const { topics, markRevised } = useTopics();
    const location = useLocation();
    const navigate = useNavigate();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [showTest, setShowTest] = useState(false);

    const selectedTopicId = location.state?.topicId;
    const [selectedId, setSelectedId] = useState(selectedTopicId || null);

    const dueTopics = useMemo(() => topics.filter(isTopicDueToday), [topics]);
    const selectedTopic = topics.find((t) => t.id === selectedId);

    // AI Summary state
    const [aiSummary, setAiSummary] = useState(null);
    const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
    const [aiSummaryError, setAiSummaryError] = useState('');
    const [showAiSummary, setShowAiSummary] = useState(false);

    const handleMarkRevised = () => {
        if (!selectedTopic) return;
        markRevised(selectedTopic.id);
        setShowSuccess(true);
    };

    const fetchAiSummary = useCallback(async () => {
        if (!selectedTopic || aiSummaryLoading) return;
        setAiSummaryLoading(true);
        setAiSummaryError('');
        try {
            const result = await summarizeTopic(selectedTopic.title, selectedTopic.description);
            if (result) {
                setAiSummary(result);
                setShowAiSummary(true);
            } else {
                setAiSummaryError('Not enough notes to summarize. Add more description first.');
            }
        } catch (err) {
            console.error('AI Summary error:', err);
            setAiSummaryError(err.message || 'Could not generate summary. Please try again.');
        } finally {
            setAiSummaryLoading(false);
        }
    }, [selectedTopic, aiSummaryLoading]);

    if (showFlashcards) {
        return (
            <div>
                <FlashcardMode
                    topics={selectedTopic ? [selectedTopic] : dueTopics.length > 0 ? dueTopics : topics}
                    onClose={() => setShowFlashcards(false)}
                />
            </div>
        );
    }

    if (showTest && selectedTopic) {
        return (
            <div>
                <TestMode
                    topic={selectedTopic}
                    onClose={() => setShowTest(false)}
                />
            </div>
        );
    }

    if (selectedTopic) {
        const status = getRetentionStatus(selectedTopic.revisionCount);
        const color = getRetentionColor(status);
        const progressPercent = Math.min((selectedTopic.revisionCount / 6) * 100, 100);

        return (
            <>
                <SuccessAnimation
                    show={showSuccess}
                    message="Revision Complete!"
                    subtitle={`Next revision: ${formatDate(selectedTopic.nextRevisionDate)}`}
                    onComplete={() => {
                        setShowSuccess(false);
                        setSelectedId(null);
                    }}
                />

                <motion.div variants={container} initial="hidden" animate="show">
                    <motion.div variants={item} style={{ marginBottom: '24px' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedId(null)}
                        >
                            <HiOutlineArrowLeft /> Back to list
                        </button>
                    </motion.div>

                    <motion.div variants={item} className="card" style={{ padding: '40px', maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <span className={`badge badge-${status}`} style={{ marginBottom: '12px', display: 'inline-block' }}>
                                    {getRetentionLabel(status)}
                                </span>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
                                    {selectedTopic.title}
                                </h1>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <HiOutlineRefresh /> {selectedTopic.revisionCount} revision{selectedTopic.revisionCount !== 1 ? 's' : ''}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <HiOutlineClock /> Next: {formatDate(selectedTopic.nextRevisionDate)}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowTest(true)}
                                >
                                    📝 Take Test
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowFlashcards(true)}
                                >
                                    🎴 Flashcard
                                </button>
                                {selectedTopic.description && selectedTopic.description.length >= 20 && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={fetchAiSummary}
                                        disabled={aiSummaryLoading}
                                        style={{ gap: '4px' }}
                                    >
                                        <HiOutlineSparkles />
                                        {aiSummaryLoading ? 'Thinking…' : '✨ AI Summary'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Retention Progress */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    Retention Progress
                                </span>
                                <span style={{ fontSize: '0.85rem', color, fontWeight: 600 }}>
                                    {Math.round(progressPercent)}%
                                </span>
                            </div>
                            <div className="progress-bar" style={{ height: '8px' }}>
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* ── AI Summary Panel ── */}
                        <AnimatePresence>
                            {aiSummaryError && (
                                <motion.div
                                    className="ai-summary-error"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    ⚠️ {aiSummaryError}
                                </motion.div>
                            )}
                            {showAiSummary && aiSummary && (
                                <motion.div
                                    className="ai-summary-card"
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                >
                                    <div className="ai-summary-header">
                                        <div className="ai-summary-title">
                                            <HiOutlineSparkles className="ai-summary-icon" />
                                            AI Summary
                                        </div>
                                        <button
                                            className="ai-summary-close"
                                            onClick={() => setShowAiSummary(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="ai-summary-content">
                                        {aiSummary}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tags */}
                        {selectedTopic.tags && selectedTopic.tags.length > 0 && (
                            <div className="tags-container" style={{ marginBottom: '24px' }}>
                                {selectedTopic.tags.map((tag) => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* Notes */}
                        {selectedTopic.description && (
                            <div style={{
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)',
                                padding: '24px',
                                marginBottom: '32px',
                                border: '1px solid var(--border-glass)',
                                lineHeight: 1.8,
                                fontSize: '0.95rem',
                                whiteSpace: 'pre-wrap',
                                color: 'var(--text-secondary)',
                            }}>
                                {selectedTopic.description}
                            </div>
                        )}

                        {/* Revision History */}
                        {selectedTopic.revisions && selectedTopic.revisions.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                                    Revision History
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedTopic.revisions.map((rev, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '8px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'rgba(99, 102, 241, 0.05)',
                                                borderLeft: '3px solid var(--primary-500)',
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            <HiOutlineCheck style={{ color: 'var(--success-500)' }} />
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                Revision #{i + 1}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                                {new Date(rev).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action */}
                        <motion.button
                            className="btn btn-success btn-lg"
                            onClick={handleMarkRevised}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ width: '100%' }}
                        >
                            <HiOutlineCheck /> Mark as Revised
                        </motion.button>
                    </motion.div>
                </motion.div>
            </>
        );
    }

    // Topic selection list
    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="page-header">
                <h1>Revision</h1>
                <p>Select a topic to review and mark your progress.</p>
            </motion.div>

            <motion.div variants={item} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowFlashcards(true)}
                    disabled={topics.length === 0}
                    style={{ opacity: topics.length === 0 ? 0.5 : 1 }}
                >
                    🎴 Flashcard Mode
                </button>
            </motion.div>

            {dueTopics.length > 0 && (
                <motion.div variants={item}>
                    <div className="section-header">
                        <h2>⚡ Due Today ({dueTopics.length})</h2>
                    </div>
                    <div className="revision-list" style={{ marginBottom: '32px' }}>
                        {dueTopics.map((topic) => {
                            const status = getRetentionStatus(topic.revisionCount);
                            return (
                                <motion.div
                                    key={topic.id}
                                    className="revision-item"
                                    variants={item}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedId(topic.id)}
                                    whileHover={{ x: 4 }}
                                >
                                    <div className="revision-info">
                                        <span className={`badge badge-${status}`}>
                                            {getRetentionLabel(status)}
                                        </span>
                                        <div>
                                            <span className="revision-title">{topic.title}</span>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                Rev #{topic.revisionCount + 1} • {formatDate(topic.nextRevisionDate)}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-success btn-sm">
                                        Revise Now
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            <motion.div variants={item}>
                <div className="section-header">
                    <h2>📚 All Topics ({topics.length})</h2>
                </div>
                {topics.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">📖</div>
                            <h3>No topics to revise</h3>
                            <p>Add your first topic to start learning with spaced repetition.</p>
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
                        {topics
                            .filter((t) => !dueTopics.some((d) => d.id === t.id))
                            .map((topic) => {
                                const status = getRetentionStatus(topic.revisionCount);
                                return (
                                    <motion.div
                                        key={topic.id}
                                        className="revision-item"
                                        variants={item}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedId(topic.id)}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="revision-info">
                                            <span className={`badge badge-${status}`}>
                                                {getRetentionLabel(status)}
                                            </span>
                                            <div>
                                                <span className="revision-title">{topic.title}</span>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                    {topic.revisionCount} revisions • Next: {formatDate(topic.nextRevisionDate)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="badge badge-pending">View</span>
                                    </motion.div>
                                );
                            })}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
