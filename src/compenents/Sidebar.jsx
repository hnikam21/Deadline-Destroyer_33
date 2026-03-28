import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
    HiOutlineViewGrid,
    HiOutlinePlusCircle,
    HiOutlineCollection,
    HiOutlineRefresh,
    HiOutlineChartBar,
    HiOutlineMenu,
    HiOutlineX,
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { path: '/add', icon: HiOutlinePlusCircle, label: 'Add Topic' },
    { path: '/topics', icon: HiOutlineCollection, label: 'All Topics' },
    { path: '/revision', icon: HiOutlineRefresh, label: 'Revision' },
    { path: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
];

export default function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    return (
        <>
            {/* Mobile toggle */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
            </button>

            {/* Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="sidebar-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <rect width="28" height="28" rx="8" fill="url(#logoGrad)" />
                                <path d="M8 14L12 18L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <defs>
                                    <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                                        <stop stopColor="#6366F1" />
                                        <stop offset="1" stopColor="#8B5CF6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="logo-text">
                            <span className="logo-name">RecallX</span>
                            <span className="logo-tagline">Smart Retention</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setMobileOpen(false)}
                            end={item.path === '/'}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            className="sidebar-link-bg"
                                            layoutId="activeNav"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className="sidebar-link-icon" />
                                    <span className="sidebar-link-label">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-footer-card">
                        <p className="sidebar-footer-text">🧠 Keep learning!</p>
                        <p className="sidebar-footer-sub">Consistency is the key to retention.</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
