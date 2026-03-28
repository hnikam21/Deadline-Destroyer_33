import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineLightningBolt,
    HiOutlineChartBar,
    HiOutlineBookOpen,
    HiOutlineClipboardList,
    HiOutlineAcademicCap,
    HiOutlineSparkles,
    HiOutlineClock,
    HiOutlineTrendingUp,
} from 'react-icons/hi';

/* ───────────── tiny particle canvas ───────────── */
function ParticleField() {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const animFrame = useRef(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        let w = (cvs.width = window.innerWidth);
        let h = (cvs.height = window.innerHeight);

        const COUNT = 80;
        particles.current = Array.from({ length: COUNT }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 0.5,
            o: Math.random() * 0.5 + 0.15,
        }));

        function draw() {
            ctx.clearRect(0, 0, w, h);
            for (const p of particles.current) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(139,92,246,${p.o})`;
                ctx.fill();
            }
            // draw lines between nearby particles
            for (let i = 0; i < particles.current.length; i++) {
                for (let j = i + 1; j < particles.current.length; j++) {
                    const a = particles.current[i];
                    const b = particles.current[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }
            animFrame.current = requestAnimationFrame(draw);
        }
        draw();

        const onResize = () => {
            w = cvs.width = window.innerWidth;
            h = cvs.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);
        return () => {
            cancelAnimationFrame(animFrame.current);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="intro-particle-canvas" />;
}

/* ───────────── floating icons behind hero ───────────── */
const FLOATING_ICONS = [
    { Icon: HiOutlineBookOpen, x: '12%', y: '18%', delay: 0, size: 28 },
    { Icon: HiOutlineChartBar, x: '80%', y: '12%', delay: 1.2, size: 32 },
    { Icon: HiOutlineAcademicCap, x: '88%', y: '60%', delay: 0.6, size: 26 },
    { Icon: HiOutlineClock, x: '8%', y: '72%', delay: 1.8, size: 24 },
    { Icon: HiOutlineTrendingUp, x: '70%', y: '82%', delay: 2.2, size: 30 },
    { Icon: HiOutlineSparkles, x: '25%', y: '85%', delay: 0.9, size: 22 },
];

/* ───────────── feature data ───────────── */
const FEATURES = [
    {
        icon: <HiOutlineLightningBolt />,
        title: 'Spaced Repetition Engine',
        desc: 'Scientifically-proven scheduling that boosts long-term retention by up to 200%. Topics reappear at optimal intervals.',
        color: '#6366F1',
    },
    {
        icon: <HiOutlineBookOpen />,
        title: 'Smart Flashcards',
        desc: 'Interactive flip-cards with confidence ratings. Weak topics get prioritised so you focus where it matters most.',
        color: '#8B5CF6',
    },
    {
        icon: <HiOutlineChartBar />,
        title: 'Deep Analytics',
        desc: 'Track streaks, mastery curves, and revision history. Beautiful charts help you visualise your learning journey.',
        color: '#10B981',
    },
    {
        icon: <HiOutlineClipboardList />,
        title: 'Topic Management',
        desc: 'Add topics with notes, tags, and even extract text from PDFs & images. Everything organised in one place.',
        color: '#F59E0B',
    },
];

/* ───────────── main component ───────────── */
export default function IntroPage({ onEnter }) {
    const [phase, setPhase] = useState('boot'); // boot → hero → features → ready
    const [typedText, setTypedText] = useState('');
    const targetText = 'RecallX';
    const [showCursor, setShowCursor] = useState(true);

    /* Typing effect for title */
    useEffect(() => {
        if (phase !== 'boot') return;
        let i = 0;
        const iv = setInterval(() => {
            i++;
            setTypedText(targetText.slice(0, i));
            if (i >= targetText.length) {
                clearInterval(iv);
                setTimeout(() => setPhase('hero'), 600);
            }
        }, 140);
        return () => clearInterval(iv);
    }, [phase]);

    /* Blinking cursor */
    useEffect(() => {
        const iv = setInterval(() => setShowCursor((c) => !c), 530);
        return () => clearInterval(iv);
    }, []);

    /* Advance phases via scroll or timeout */
    const advance = useCallback(() => {
        setPhase((p) => {
            if (p === 'hero') return 'features';
            if (p === 'features') return 'ready';
            return p;
        });
    }, []);

    /* auto-advance from hero */
    useEffect(() => {
        if (phase === 'hero') {
            const t = setTimeout(advance, 3200);
            return () => clearTimeout(t);
        }
    }, [phase, advance]);

    /* keyboard / scroll listener */
    useEffect(() => {
        const handler = (e) => {
            if (e.type === 'wheel' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                if (phase === 'hero' || phase === 'features') advance();
                if (phase === 'ready') onEnter();
            }
        };
        window.addEventListener('keydown', handler);
        window.addEventListener('wheel', handler, { passive: true });
        return () => {
            window.removeEventListener('keydown', handler);
            window.removeEventListener('wheel', handler);
        };
    }, [phase, advance, onEnter]);

    return (
        <div className="intro-page" id="intro-page">
            <ParticleField />

            {/* Animated background orbs */}
            <div className="intro-orb intro-orb-1" />
            <div className="intro-orb intro-orb-2" />
            <div className="intro-orb intro-orb-3" />

            {/* Floating icons */}
            {FLOATING_ICONS.map(({ Icon, x, y, delay, size }, i) => (
                <motion.div
                    key={i}
                    className="intro-floating-icon"
                    style={{ left: x, top: y }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.18, scale: 1, y: [0, -12, 0] }}
                    transition={{
                        opacity: { delay: 1 + delay, duration: 0.6 },
                        scale: { delay: 1 + delay, duration: 0.6 },
                        y: { delay: 1 + delay, duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' },
                    }}
                >
                    <Icon size={size} />
                </motion.div>
            ))}

            {/* ░░ BOOT PHASE — typing title ░░ */}
            <AnimatePresence mode="wait">
                {phase === 'boot' && (
                    <motion.div
                        key="boot"
                        className="intro-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="intro-boot-title">
                            <span className="intro-typed">{typedText}</span>
                            <span className={`intro-cursor ${showCursor ? '' : 'intro-cursor-hide'}`}>|</span>
                        </div>
                        <motion.p
                            className="intro-boot-sub"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: typedText.length > 4 ? 1 : 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            Initializing your learning engine…
                        </motion.p>
                    </motion.div>
                )}

                {/* ░░ HERO PHASE — tagline + XP bar ░░ */}
                {phase === 'hero' && (
                    <motion.div
                        key="hero"
                        className="intro-center"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <motion.div
                            className="intro-hero-badge"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
                        >
                            <HiOutlineSparkles /> KNOWLEDGE RETENTION SYSTEM
                        </motion.div>

                        <motion.h1
                            className="intro-hero-title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            Never Forget
                            <br />
                            <span className="intro-gradient-text">What You Learn</span>
                        </motion.h1>

                        <motion.p
                            className="intro-hero-desc"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            RecallX uses <strong>science-backed spaced repetition</strong> to turn your study sessions
                            into lasting knowledge. Track, revise, and master any topic — all from one dashboard.
                        </motion.p>

                        {/* XP style progress bar */}
                        <motion.div
                            className="intro-xp-bar"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '100%' }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            <div className="intro-xp-track">
                                <motion.div
                                    className="intro-xp-fill"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ delay: 1, duration: 2, ease: 'easeInOut' }}
                                />
                            </div>
                            <div className="intro-xp-labels">
                                <span>LOADING MISSION BRIEF</span>
                                <span className="intro-xp-pct">
                                    <CountUp end={100} duration={2000} delay={1000} />%
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ░░ FEATURES PHASE — cards ░░ */}
                {phase === 'features' && (
                    <motion.div
                        key="features"
                        className="intro-center intro-features-wrap"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.h2
                            className="intro-section-title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <HiOutlineAcademicCap /> Your Arsenal
                        </motion.h2>
                        <motion.p
                            className="intro-section-sub"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            Everything you need to conquer your study goals
                        </motion.p>

                        <div className="intro-features-grid">
                            {FEATURES.map((f, i) => (
                                <motion.div
                                    key={i}
                                    className="intro-feature-card"
                                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.25 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ '--feat-color': f.color }}
                                >
                                    <div className="intro-feature-icon">{f.icon}</div>
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.button
                            className="intro-continue-btn"
                            onClick={advance}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Continue <span className="intro-btn-arrow">→</span>
                        </motion.button>
                    </motion.div>
                )}

                {/* ░░ READY PHASE — final call-to-action ░░ */}
                {phase === 'ready' && (
                    <motion.div
                        key="ready"
                        className="intro-center intro-ready-wrap"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Glowing ring */}
                        <motion.div
                            className="intro-ready-ring"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 18 }}
                        >
                            <div className="intro-ready-ring-inner">
                                <HiOutlineLightningBolt size={48} />
                            </div>
                        </motion.div>

                        <motion.h2
                            className="intro-ready-title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            Mission Ready
                        </motion.h2>
                        <motion.p
                            className="intro-ready-sub"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Your personalised learning HQ awaits. Sign in or create an account to begin your journey.
                        </motion.p>

                        {/* Stats preview */}
                        <motion.div
                            className="intro-stats-row"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="intro-stat-pill">
                                <span className="intro-stat-num">5x</span>
                                <span className="intro-stat-label">Faster Recall</span>
                            </div>
                            <div className="intro-stat-pill">
                                <span className="intro-stat-num">200%</span>
                                <span className="intro-stat-label">Better Retention</span>
                            </div>
                            <div className="intro-stat-pill">
                                <span className="intro-stat-num">∞</span>
                                <span className="intro-stat-label">Topics</span>
                            </div>
                        </motion.div>

                        <motion.button
                            id="intro-enter-btn"
                            className="intro-enter-btn"
                            onClick={onEnter}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.75 }}
                            whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <span className="intro-enter-text">Enter RecallX</span>
                            <span className="intro-enter-icon">⚡</span>
                        </motion.button>

                        <motion.span
                            className="intro-skip-hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.45 }}
                            transition={{ delay: 1.2 }}
                        >
                            Press Enter or scroll to continue
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom phase dots */}
            <div className="intro-phase-dots">
                {['boot', 'hero', 'features', 'ready'].map((p) => (
                    <span key={p} className={`intro-dot ${phase === p ? 'intro-dot-active' : ''}`} />
                ))}
            </div>
        </div>
    );
}

/* ─── count-up helper ─── */
function CountUp({ end, duration = 2000, delay = 0 }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let start = null;
        let frame;
        const t = setTimeout(() => {
            function step(ts) {
                if (!start) start = ts;
                const progress = Math.min((ts - start) / duration, 1);
                setVal(Math.floor(progress * end));
                if (progress < 1) frame = requestAnimationFrame(step);
            }
            frame = requestAnimationFrame(step);
        }, delay);
        return () => {
            clearTimeout(t);
            cancelAnimationFrame(frame);
        };
    }, [end, duration, delay]);
    return <>{val}</>;
}
