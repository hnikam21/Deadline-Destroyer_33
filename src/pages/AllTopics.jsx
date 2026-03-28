import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    HiOutlineSearch,
    HiOutlineCalendar,
    HiOutlineRefresh,
    HiOutlineTrash,
} from 'react-icons/hi';
import { useTopics } from '../context/TopicContext';
import {
    getRetentionStatus,
    getRetentionLabel,
    getRetentionColor,
    isTopicDueToday,
    isTopicCompleted,
    formatDate,
} from '../utils/spacedRepetition';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function AllTopics() {
    const { topics, deleteTopic } = useTopics();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filteredTopics = useMemo(() => {
        let result = [...topics];

        // Filter
        if (filter === 'pending') {
            result = result.filter((t) => isTopicDueToday(t));
        } else if (filter === 'completed') {
            result = result.filter((t) => isTopicCompleted(t));
        } else if (filter === 'weak') {
            result = result.filter((t) => getRetentionStatus(t.revisionCount) === 'weak');
        } else if (filter === 'strong') {
            result = result.filter((t) => getRetentionStatus(t.revisionCount) === 'strong');
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    (t.description && t.description.toLowerCase().includes(q)) ||
                    (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
            );
        }

        // Sort by next revision date, soonest first
        result.sort((a, b) => new Date(a.nextRevisionDate) - new Date(b.nextRevisionDate));

        return result;
    }, [topics, filter, search]);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (confirm('Delete this topic? This cannot be undone.')) {
            deleteTopic(id);
        }
    };

    const filters = [
        { key: 'all', label: 'All', count: topics.length },
        { key: 'pending', label: 'Pending', count: topics.filter(isTopicDueToday).length },
        { key: 'weak', label: 'Weak', count: topics.filter((t) => getRetentionStatus(t.revisionCount) === 'weak').length },
        { key: 'strong', label: 'Strong', count: topics.filter((t) => getRetentionStatus(t.revisionCount) === 'strong').length },
        { key: 'completed', label: 'Completed', count: topics.filter(isTopicCompleted).length },
    ];

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="page-header">
                <h1>All Topics</h1>
                <p>Browse and manage your knowledge base.</p>
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="search-bar">
                <HiOutlineSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Search topics by title, description, or tag..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} className="filter-tabs">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </motion.div>

            {/* Topics Grid */}
            {filteredTopics.length === 0 ? (
                <motion.div variants={item} className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📚</div>
                        <h3>{topics.length === 0 ? 'No topics yet' : 'No matching topics'}</h3>
                        <p>
                            {topics.length === 0
                                ? 'Start by adding your first topic to build your knowledge base.'
                                : 'Try a different search or filter.'}
                        </p>
                        {topics.length === 0 && (
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '20px' }}
                                onClick={() => navigate('/add')}
                            >
                                + Add Topic
                            </button>
                        )}
                    </div>
                </motion.div>
            ) : (
                <motion.div variants={container} className="topics-grid">
                    {filteredTopics.map((topic) => {
                        const status = getRetentionStatus(topic.revisionCount);
                        const isDue = isTopicDueToday(topic);
                        const color = getRetentionColor(status);

                        return (
                            <motion.div
                                key={topic.id}
                                className="topic-card"
                                variants={item}
                                whileHover={{ y: -4 }}
                                onClick={() => navigate('/revision', { state: { topicId: topic.id } })}
                                style={{
                                    borderColor: isDue ? 'rgba(99, 102, 241, 0.3)' : undefined,
                                }}
                            >
                                {/* Top accent bar */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '3px',
                                        background: color,
                                        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                                    }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <span className={`badge badge-${status}`}>
                                        {getRetentionLabel(status)}
                                    </span>
                                    {isDue && (
                                        <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                                            Due Today
                                        </span>
                                    )}
                                </div>

                                <h3 className="topic-title">{topic.title}</h3>

                                {topic.description && (
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        marginBottom: '8px',
                                        lineHeight: 1.5,
                                    }}>
                                        {topic.description}
                                    </p>
                                )}

                                {topic.tags && topic.tags.length > 0 && (
                                    <div className="tags-container" style={{ marginBottom: '8px' }}>
                                        {topic.tags.map((tag) => (
                                            <span key={tag} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="topic-meta">
                                    <span>
                                        <HiOutlineRefresh />
                                        {topic.revisionCount} revision{topic.revisionCount !== 1 ? 's' : ''}
                                    </span>
                                    <span>
                                        <HiOutlineCalendar />
                                        Next: {formatDate(topic.nextRevisionDate)}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="progress-bar" style={{ marginTop: '12px' }}>
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min((topic.revisionCount / 6) * 100, 100)}%`,
                                            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                                        }}
                                    />
                                </div>

                                {/* Delete button */}
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => handleDelete(e, topic.id)}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        padding: '4px 8px',
                                        opacity: 0.5,
                                        fontSize: '0.85rem',
                                    }}
                                    title="Delete topic"
                                >
                                    <HiOutlineTrash />
                                </button>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
}
