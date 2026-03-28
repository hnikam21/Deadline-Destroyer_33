import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineX, HiOutlineCalendar } from 'react-icons/hi';
import { useTopics } from '../context/TopicContext';
import { getRevisionSchedulePreview } from '../utils/spacedRepetition';
import SuccessAnimation from '../components/SuccessAnimation';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function AddTopic() {
    const { addTopic } = useTopics();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    const schedule = getRevisionSchedulePreview();

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        addTopic({
            title: title.trim(),
            description: description.trim(),
            tags,
        });

        setShowSuccess(true);
    };

    const handleSuccessComplete = () => {
        setShowSuccess(false);
        setTitle('');
        setDescription('');
        setTags([]);
        navigate('/');
    };

    return (
        <>
            <SuccessAnimation
                show={showSuccess}
                message="Topic Added!"
                subtitle="Revision schedule has been generated automatically."
                onComplete={handleSuccessComplete}
            />

            <motion.div variants={container} initial="hidden" animate="show">
                <motion.div variants={item} className="page-header">
                    <h1>Add New Topic</h1>
                    <p>Add a topic you want to remember. We'll create a revision schedule for you.</p>
                </motion.div>

                <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>
                    {/* Form */}
                    <div className="card" style={{ padding: '32px' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Topic Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Binary Search Algorithm"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description / Notes</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Write your notes here... What do you want to remember about this topic?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tags</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: tags.length > 0 ? '12px' : 0 }}>
                                    {tags.map((tag) => (
                                        <span key={tag} className="tag tag-removable" onClick={() => removeTag(tag)}>
                                            {tag}
                                            <HiOutlineX style={{ fontSize: '0.7rem' }} />
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Type a tag and press Enter (e.g., DSA, ML, Math)"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <motion.button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={!title.trim()}
                                    style={{ opacity: title.trim() ? 1 : 0.5 }}
                                >
                                    <HiOutlinePlus /> Add Topic
                                </motion.button>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-lg"
                                    onClick={() => navigate('/')}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Schedule Preview */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}
                            onClick={() => setShowSchedule(!showSchedule)}
                        >
                            <HiOutlineCalendar style={{ color: 'var(--primary-400)', fontSize: '1.2rem' }} />
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Revision Schedule</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                            Your topic will be automatically scheduled for spaced revision:
                        </p>
                        <div className="schedule-preview">
                            {schedule.map((s) => (
                                <motion.div
                                    key={s.revision}
                                    className="schedule-item"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: s.revision * 0.08 }}
                                >
                                    <span className="schedule-day">Rev #{s.revision}</span>
                                    <span className="schedule-date">
                                        +{s.days} day{s.days > 1 ? 's' : ''} → {s.date}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <style>{`
        @media (max-width: 900px) {
          .card + .card {
            margin-top: 0;
          }
        }
      `}</style>
        </>
    );
}
