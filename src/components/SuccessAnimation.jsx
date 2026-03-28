import { motion, AnimatePresence } from 'framer-motion';
import { HiCheck } from 'react-icons/hi';
import { useEffect } from 'react';

export default function SuccessAnimation({ show, message = 'Revision Complete!', subtitle = '', onComplete }) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                if (onComplete) onComplete();
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="success-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="success-content">
                        <motion.div
                            className="success-checkmark"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                        >
                            <HiCheck />
                        </motion.div>
                        <motion.h3
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {message}
                        </motion.h3>
                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
