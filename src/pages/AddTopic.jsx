import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineX, HiOutlineCalendar, HiOutlineUpload, HiOutlineDocument, HiOutlinePhotograph } from 'react-icons/hi';
import { useTopics } from '../context/TopicContext';
import { getRevisionSchedulePreview } from '../utils/spacedRepetition';
import { extractTextFromFile, summarizeText, formatFileSize } from '../utils/fileExtractor';
import SuccessAnimation from '../components/SuccessAnimation';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const ACCEPTED_TYPES = {
    'application/pdf': 'pdf',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/webp': 'image',
    'image/bmp': 'image',
};

const ACCEPT_STRING = '.pdf,.png,.jpg,.jpeg,.webp,.bmp';

export default function AddTopic() {
    const { addTopic } = useTopics();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    // File upload states
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [processStatus, setProcessStatus] = useState('');
    const [fileError, setFileError] = useState('');
    const [extractSuccess, setExtractSuccess] = useState(false);
    const fileInputRef = useRef(null);

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
        setUploadedFile(null);
        setExtractSuccess(false);
        navigate('/');
    };

    // ── File upload handlers ──────────────────────────
    const isValidFile = (file) => {
        const validTypes = Object.keys(ACCEPTED_TYPES);
        if (validTypes.includes(file.type)) return true;
        const ext = file.name.toLowerCase().split('.').pop();
        return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext);
    };

    const getFileCategory = (file) => {
        if (ACCEPTED_TYPES[file.type]) return ACCEPTED_TYPES[file.type];
        if (file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
        return 'image';
    };

    const handleFileSelect = useCallback((file) => {
        setFileError('');
        setExtractSuccess(false);

        if (!file) return;

        if (!isValidFile(file)) {
            setFileError('Unsupported file type. Please upload a PDF or image (PNG, JPG, WebP).');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setFileError('File is too large. Maximum size is 20 MB.');
            return;
        }

        setUploadedFile(file);
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        // Reset so the same file can be re-selected
        e.target.value = '';
    };

    const removeFile = () => {
        setUploadedFile(null);
        setFileError('');
        setExtractSuccess(false);
    };

    const handleExtract = async () => {
        if (!uploadedFile || isProcessing) return;

        setIsProcessing(true);
        setProcessProgress(0);
        setFileError('');
        setExtractSuccess(false);

        const isPdf = getFileCategory(uploadedFile) === 'pdf';
        setProcessStatus(isPdf ? 'Extracting text from PDF…' : 'Running OCR on image…');

        try {
            const rawText = await extractTextFromFile(uploadedFile, (progress) => {
                setProcessProgress(progress);
            });

            if (!rawText || rawText.trim().length < 10) {
                throw new Error('Could not extract meaningful text from this file. Try a different file.');
            }

            setProcessStatus('Generating summary…');
            setProcessProgress(90);

            // Small delay so the user sees the "Generating summary" state
            await new Promise((r) => setTimeout(r, 400));

            const summary = summarizeText(rawText, 5);
            setDescription((prev) => (prev ? prev + '\n\n' + summary : summary));
            setExtractSuccess(true);
            setProcessProgress(100);
        } catch (err) {
            console.error('Extraction error:', err);
            setFileError(err.message || 'Failed to extract text. Please try a different file.');
        } finally {
            setIsProcessing(false);
            setProcessStatus('');
            setProcessProgress(0);
        }
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

                            {/* ── File Upload Section ── */}
                            <div className="form-group">
                                <label className="form-label">
                                    Upload File <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional — PDF or Image)</span>
                                </label>

                                <div
                                    className={`file-upload-zone${isDragOver ? ' drag-over' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span className="upload-icon">📄</span>
                                    <div className="upload-title">
                                        Drag & drop a file here
                                    </div>
                                    <div className="upload-subtitle">
                                        or <span className="upload-browse">browse</span> to choose a file
                                    </div>
                                    <div className="upload-subtitle" style={{ marginTop: '6px', fontSize: '0.75rem' }}>
                                        PDF, PNG, JPG, WebP — Max 20 MB
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPT_STRING}
                                        onChange={handleFileInputChange}
                                    />
                                </div>

                                {/* File Preview */}
                                <AnimatePresence>
                                    {uploadedFile && !isProcessing && (
                                        <motion.div
                                            className="file-preview"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                        >
                                            <div className={`file-preview-icon ${getFileCategory(uploadedFile)}`}>
                                                {getFileCategory(uploadedFile) === 'pdf' ? (
                                                    <HiOutlineDocument />
                                                ) : (
                                                    <HiOutlinePhotograph />
                                                )}
                                            </div>
                                            <div className="file-preview-info">
                                                <div className="file-preview-name">{uploadedFile.name}</div>
                                                <div className="file-preview-size">{formatFileSize(uploadedFile.size)}</div>
                                            </div>
                                            <button
                                                type="button"
                                                className="file-preview-remove"
                                                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                                title="Remove file"
                                            >
                                                <HiOutlineX />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Processing State */}
                                <AnimatePresence>
                                    {isProcessing && (
                                        <motion.div
                                            className="file-processing"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                        >
                                            <div className="file-processing-spinner" />
                                            <div className="file-processing-text">{processStatus}</div>
                                            <div className="file-processing-progress">
                                                <div
                                                    className="file-processing-progress-fill"
                                                    style={{ width: `${processProgress}%` }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error State */}
                                <AnimatePresence>
                                    {fileError && (
                                        <motion.div
                                            className="file-error"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                        >
                                            <span className="file-error-icon">⚠️</span>
                                            <span>{fileError}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Success State */}
                                <AnimatePresence>
                                    {extractSuccess && (
                                        <motion.div
                                            className="extract-success"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                        >
                                            <span>✅</span>
                                            <span>Summary extracted and added to description!</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Extract Button */}
                                {uploadedFile && !isProcessing && !extractSuccess && (
                                    <motion.button
                                        type="button"
                                        className="btn btn-extract"
                                        style={{ marginTop: '12px', width: '100%' }}
                                        onClick={handleExtract}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <HiOutlineUpload /> Extract & Summarize
                                    </motion.button>
                                )}
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
