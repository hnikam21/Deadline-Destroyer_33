import { motion } from 'framer-motion';
import { useState } from 'react';
import { HiOutlineSwitchHorizontal, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

export default function FlashcardMode({ topics, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const validTopics = topics.filter((t) => t.title && t.description);

    if (validTopics.length === 0) {
        return (
            <div className="flashcard-mode-wrapper">
                <div className="flashcard-mode-header">
                    <h2>🎴 Flashcard Mode</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">🎴</div>
                    <h3>No flashcards available</h3>
                    <p>Add topics with descriptions to use flashcard mode.</p>
                </div>
            </div>
        );
    }

    const currentTopic = validTopics[currentIndex];

    const goNext = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % validTopics.length);
    };

    const goPrev = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + validTopics.length) % validTopics.length);
    };

    const shuffle = () => {
        setIsFlipped(false);
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * validTopics.length);
        } while (newIndex === currentIndex && validTopics.length > 1);
        setCurrentIndex(newIndex);
    };

    return (
        <div className="flashcard-mode-wrapper">
            <div className="flashcard-mode-header">
                <h2>🎴 Flashcard Mode</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {currentIndex + 1} / {validTopics.length}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
                </div>
            </div>

            <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
                <motion.div
                    className="flashcard"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="flashcard-face flashcard-front">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Question
                        </span>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{currentTopic.title}</h3>
                        <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Tap to reveal answer
                        </p>
                    </div>
                    <div className="flashcard-face flashcard-back">
                        <span style={{ fontSize: '0.8rem', color: 'var(--success-400)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Answer
                        </span>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
                            {currentTopic.description}
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="flashcard-controls">
                <button className="btn btn-ghost" onClick={goPrev}>
                    <HiOutlineArrowLeft /> Previous
                </button>
                <button className="btn btn-primary btn-sm" onClick={shuffle}>
                    <HiOutlineSwitchHorizontal /> Shuffle
                </button>
                <button className="btn btn-ghost" onClick={goNext}>
                    Next <HiOutlineArrowRight />
                </button>
            </div>

            <style>{`
        .flashcard-mode-wrapper {
          padding: 0;
        }
        .flashcard-mode-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .flashcard-mode-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .flashcard-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 32px;
        }
      `}</style>
        </div>
    );
}
