import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopicProvider } from './context/TopicContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddTopic from './pages/AddTopic';
import AllTopics from './pages/AllTopics';
import Revision from './pages/Revision';
import Analytics from './pages/Analytics';
import LoginPage from './pages/LoginPage';
import IntroPage from './pages/IntroPage';
import { useEffect, useRef, useState, useCallback } from 'react';
import { seedIfEmpty } from './utils/seedData';
import { AnimatePresence, motion } from 'framer-motion';

function ProtectedApp() {
    const { isAuthenticated, loading, user } = useAuth();
    const seeded = useRef(false);

    useEffect(() => {
        if (isAuthenticated && user && !seeded.current) {
            const didSeed = seedIfEmpty(user.id);
            if (didSeed) {
                // Force reload to pick up seeded data into TopicContext
                window.location.reload();
            }
            seeded.current = true;
        }
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
            }}>
                <div className="login-spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return (
        <TopicProvider userId={user.id}>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/add" element={<AddTopic />} />
                        <Route path="/topics" element={<AllTopics />} />
                        <Route path="/revision" element={<Revision />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </TopicProvider>
    );
}

function App() {
    const [showIntro, setShowIntro] = useState(() => {
        // Show intro once per session
        return !sessionStorage.getItem('recallx_intro_seen');
    });

    const dismissIntro = useCallback(() => {
        sessionStorage.setItem('recallx_intro_seen', '1');
        setShowIntro(false);
    }, []);

    return (
        <AuthProvider>
            <Router>
                <AnimatePresence mode="wait">
                    {showIntro ? (
                        <motion.div
                            key="intro"
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <IntroPage onEnter={dismissIntro} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="app"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <ProtectedApp />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Router>
        </AuthProvider>
    );
}

export default App;
