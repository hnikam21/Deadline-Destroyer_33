import { getNextRevisionDate, generateId } from './spacedRepetition';

/**
 * Generates realistic seed data with 15+ topics across multiple subjects
 * and a full week of simulated revision history.
 */
export function generateSeedData() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Helper to create a date N days ago
    const daysAgo = (n) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d;
    };

    // Helper to create a revision timestamp on a given day at a random hour
    const revisionOn = (daysBack, hour = 10) => {
        const d = daysAgo(daysBack);
        d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        return d.toISOString();
    };

    const topics = [
        // ──── DSA ────
        {
            id: generateId(),
            title: 'Binary Search Algorithm',
            description:
                'Binary search works on sorted arrays by repeatedly dividing the search interval in half.\n\n' +
                'Time Complexity: O(log n)\nSpace Complexity: O(1) iterative, O(log n) recursive\n\n' +
                'Key conditions: Array must be sorted. Compare target with middle element. Narrow search space each step.',
            tags: ['DSA', 'Algorithms', 'Searching'],
            flashcards: [],
            createdDate: daysAgo(7).toISOString(),
            revisionCount: 4,
            nextRevisionDate: getNextRevisionDate(4, daysAgo(0)),
            revisions: [revisionOn(6, 9), revisionOn(5, 14), revisionOn(3, 11), revisionOn(1, 16)],
        },
        {
            id: generateId(),
            title: 'Merge Sort',
            description:
                'Divide and conquer algorithm that splits array into halves, sorts each, then merges.\n\n' +
                'Time: O(n log n) worst/avg/best\nSpace: O(n)\nStable: Yes\n\n' +
                'Great for linked lists and external sorting. Always guaranteed O(n log n).',
            tags: ['DSA', 'Algorithms', 'Sorting'],
            flashcards: [],
            createdDate: daysAgo(7).toISOString(),
            revisionCount: 3,
            nextRevisionDate: getNextRevisionDate(3, daysAgo(1)),
            revisions: [revisionOn(6, 10), revisionOn(4, 15), revisionOn(1, 10)],
        },
        {
            id: generateId(),
            title: 'Dynamic Programming – Knapsack',
            description:
                '0/1 Knapsack: Given weights and values of n items, put items in a knapsack of capacity W.\n\n' +
                'Recurrence: dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w-wt[i]])\n' +
                'Time: O(n*W), Space: O(n*W) can be optimized to O(W).\n\n' +
                'Variants: Unbounded, fractional (greedy), subset sum.',
            tags: ['DSA', 'Dynamic Programming'],
            flashcards: [],
            createdDate: daysAgo(6).toISOString(),
            revisionCount: 2,
            nextRevisionDate: getNextRevisionDate(2, daysAgo(2)),
            revisions: [revisionOn(5, 11), revisionOn(2, 9)],
        },
        {
            id: generateId(),
            title: 'Graph Traversal – BFS & DFS',
            description:
                'BFS: Uses queue, level-order traversal. Good for shortest path in unweighted graphs.\n' +
                'DFS: Uses stack/recursion, explores as deep as possible first.\n\n' +
                'Applications:\n- BFS: Shortest path, level order, connected components\n' +
                '- DFS: Cycle detection, topological sort, connected components, pathfinding',
            tags: ['DSA', 'Graphs', 'Algorithms'],
            flashcards: [],
            createdDate: daysAgo(5).toISOString(),
            revisionCount: 2,
            nextRevisionDate: getNextRevisionDate(2, daysAgo(1)),
            revisions: [revisionOn(4, 14), revisionOn(1, 17)],
        },
        {
            id: generateId(),
            title: 'Linked List Operations',
            description:
                'Singly linked list: Each node has data + next pointer.\nDoubly linked list: Each node has data + next + prev.\n\n' +
                'Key operations:\n- Insertion: O(1) at head, O(n) at position\n- Deletion: O(1) at head, O(n) at position\n- Search: O(n)\n- Reverse: O(n)\n\n' +
                'Common patterns: Two pointers, fast & slow (Floyd\'s), dummy head node.',
            tags: ['DSA', 'Data Structures'],
            flashcards: [],
            createdDate: daysAgo(5).toISOString(),
            revisionCount: 1,
            nextRevisionDate: getNextRevisionDate(1, daysAgo(3)),
            revisions: [revisionOn(3, 12)],
        },

        // ──── Machine Learning ────
        {
            id: generateId(),
            title: 'Linear Regression',
            description:
                'Predicts continuous output based on linear relationship between features and target.\n\n' +
                'Equation: y = mx + b (simple) or y = X·w + b (multivariate)\n' +
                'Loss: Mean Squared Error (MSE)\n' +
                'Optimization: Gradient Descent or Normal Equation\n\n' +
                'Assumptions: Linearity, independence, homoscedasticity, normality of residuals.',
            tags: ['ML', 'Supervised Learning', 'Statistics'],
            flashcards: [],
            createdDate: daysAgo(7).toISOString(),
            revisionCount: 5,
            nextRevisionDate: getNextRevisionDate(5, daysAgo(0)),
            revisions: [revisionOn(7, 8), revisionOn(5, 10), revisionOn(3, 14), revisionOn(1, 9), revisionOn(0, 11)],
        },
        {
            id: generateId(),
            title: 'Neural Network Basics',
            description:
                'Artificial neural networks inspired by biological neurons.\n\n' +
                'Components: Input layer → Hidden layers → Output layer\n' +
                'Activation functions: ReLU, Sigmoid, Tanh, Softmax\n' +
                'Training: Forward propagation → Loss calculation → Backpropagation → Weight update\n\n' +
                'Key concepts: Learning rate, epochs, batch size, overfitting, regularization (L1/L2, dropout).',
            tags: ['ML', 'Deep Learning', 'Neural Networks'],
            flashcards: [],
            createdDate: daysAgo(6).toISOString(),
            revisionCount: 3,
            nextRevisionDate: getNextRevisionDate(3, daysAgo(0)),
            revisions: [revisionOn(5, 16), revisionOn(3, 10), revisionOn(0, 15)],
        },
        {
            id: generateId(),
            title: 'Decision Trees & Random Forests',
            description:
                'Decision Tree: Splits data based on feature thresholds to minimize impurity (Gini / Entropy).\n\n' +
                'Random Forest: Ensemble of decision trees trained on random subsets (bagging).\n' +
                'Advantages: Handles non-linear data, feature importance, no scaling needed.\n' +
                'Disadvantages: Overfitting (single tree), interpretability (forest).',
            tags: ['ML', 'Supervised Learning'],
            flashcards: [],
            createdDate: daysAgo(4).toISOString(),
            revisionCount: 1,
            nextRevisionDate: getNextRevisionDate(1, daysAgo(2)),
            revisions: [revisionOn(2, 13)],
        },

        // ──── Web Development ────
        {
            id: generateId(),
            title: 'React Hooks – useEffect',
            description:
                'useEffect handles side effects in functional components.\n\n' +
                'Syntax: useEffect(callback, [dependencies])\n\n' +
                '- No deps: runs after every render\n- Empty []: runs once on mount\n- [dep]: runs when dep changes\n\n' +
                'Cleanup: return a function from callback for cleanup (subscriptions, timers).\n' +
                'Common pitfalls: Missing dependencies, infinite loops, stale closures.',
            tags: ['React', 'Web Dev', 'JavaScript'],
            flashcards: [],
            createdDate: daysAgo(6).toISOString(),
            revisionCount: 4,
            nextRevisionDate: getNextRevisionDate(4, daysAgo(1)),
            revisions: [revisionOn(6, 9), revisionOn(4, 11), revisionOn(2, 15), revisionOn(1, 8)],
        },
        {
            id: generateId(),
            title: 'CSS Flexbox Layout',
            description:
                'Flexbox is a one-dimensional layout model for arranging items in rows or columns.\n\n' +
                'Container: display: flex; flex-direction; justify-content; align-items; flex-wrap\n' +
                'Items: flex-grow; flex-shrink; flex-basis; align-self; order\n\n' +
                'Common patterns: centering, holy grail layout, equal height columns, sticky footer.',
            tags: ['CSS', 'Web Dev', 'Layout'],
            flashcards: [],
            createdDate: daysAgo(5).toISOString(),
            revisionCount: 2,
            nextRevisionDate: getNextRevisionDate(2, daysAgo(0)),
            revisions: [revisionOn(4, 10), revisionOn(0, 14)],
        },
        {
            id: generateId(),
            title: 'REST API Design Principles',
            description:
                'REST (Representational State Transfer) is an architectural style for APIs.\n\n' +
                'Key principles:\n- Stateless: Each request contains all info needed\n- Resource-based: URLs represent resources\n' +
                '- HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove)\n' +
                '- Status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error\n\n' +
                'Best practices: versioning, pagination, filtering, HATEOAS, authentication.',
            tags: ['API', 'Web Dev', 'Backend'],
            flashcards: [],
            createdDate: daysAgo(3).toISOString(),
            revisionCount: 1,
            nextRevisionDate: getNextRevisionDate(1, daysAgo(1)),
            revisions: [revisionOn(1, 16)],
        },

        // ──── Operating Systems ────
        {
            id: generateId(),
            title: 'Process vs Thread',
            description:
                'Process: Independent execution unit with its own memory space.\n' +
                'Thread: Lightweight unit within a process sharing the same memory.\n\n' +
                'Key differences:\n- Memory: Processes isolated, threads share heap\n' +
                '- Creation: Processes slower, threads faster\n- Communication: IPC for processes, shared memory for threads\n' +
                '- Crash: Process crash doesn\'t affect others, thread crash can crash process\n\n' +
                'Concurrency models: Multi-processing, multi-threading, async I/O.',
            tags: ['OS', 'Systems', 'Concurrency'],
            flashcards: [],
            createdDate: daysAgo(7).toISOString(),
            revisionCount: 3,
            nextRevisionDate: getNextRevisionDate(3, daysAgo(2)),
            revisions: [revisionOn(6, 11), revisionOn(4, 9), revisionOn(2, 14)],
        },
        {
            id: generateId(),
            title: 'Virtual Memory & Paging',
            description:
                'Virtual memory maps virtual addresses to physical addresses via page tables.\n\n' +
                'Page: Fixed-size block of virtual memory\nFrame: Fixed-size block of physical memory\n' +
                'Page fault: Requested page not in RAM, must be loaded from disk.\n\n' +
                'Replacement algorithms: FIFO, LRU, Optimal, Clock\n' +
                'TLB (Translation Lookaside Buffer): Cache for page table entries.',
            tags: ['OS', 'Memory Management'],
            flashcards: [],
            createdDate: daysAgo(4).toISOString(),
            revisionCount: 1,
            nextRevisionDate: getNextRevisionDate(1, daysAgo(1)),
            revisions: [revisionOn(1, 11)],
        },

        // ──── Database ────
        {
            id: generateId(),
            title: 'SQL Joins Explained',
            description:
                'Joins combine rows from two or more tables based on related columns.\n\n' +
                'Types:\n- INNER JOIN: Only matching rows from both tables\n' +
                '- LEFT JOIN: All rows from left + matching from right\n' +
                '- RIGHT JOIN: All rows from right + matching from left\n' +
                '- FULL OUTER JOIN: All rows from both tables\n' +
                '- CROSS JOIN: Cartesian product\n\n' +
                'Performance: Use indexes on join columns, avoid joining on calculated fields.',
            tags: ['Database', 'SQL'],
            flashcards: [],
            createdDate: daysAgo(6).toISOString(),
            revisionCount: 3,
            nextRevisionDate: getNextRevisionDate(3, daysAgo(0)),
            revisions: [revisionOn(5, 10), revisionOn(3, 15), revisionOn(0, 9)],
        },
        {
            id: generateId(),
            title: 'Database Normalization',
            description:
                'Process of organizing data to reduce redundancy and dependency.\n\n' +
                '1NF: Atomic values, no repeating groups\n' +
                '2NF: 1NF + no partial dependencies (all non-key attributes depend on full primary key)\n' +
                '3NF: 2NF + no transitive dependencies\n' +
                'BCNF: Every determinant is a candidate key\n\n' +
                'Denormalization: Sometimes used for read performance at cost of write complexity.',
            tags: ['Database', 'SQL', 'Design'],
            flashcards: [],
            createdDate: daysAgo(3).toISOString(),
            revisionCount: 0,
            nextRevisionDate: getNextRevisionDate(0, daysAgo(3)),
            revisions: [],
        },

        // ──── Math / Probability ────
        {
            id: generateId(),
            title: 'Bayes Theorem',
            description:
                'P(A|B) = P(B|A) · P(A) / P(B)\n\n' +
                'Prior probability: P(A) — initial belief\n' +
                'Likelihood: P(B|A) — probability of evidence given hypothesis\n' +
                'Posterior: P(A|B) — updated belief after observing evidence\n' +
                'Evidence: P(B) — total probability of evidence\n\n' +
                'Applications: Spam filtering, medical diagnosis, machine learning (Naive Bayes).',
            tags: ['Math', 'Probability', 'ML'],
            flashcards: [],
            createdDate: daysAgo(5).toISOString(),
            revisionCount: 2,
            nextRevisionDate: getNextRevisionDate(2, daysAgo(1)),
            revisions: [revisionOn(4, 13), revisionOn(1, 10)],
        },
        {
            id: generateId(),
            title: 'Big-O Notation',
            description:
                'Describes the upper bound of an algorithm\'s time/space complexity.\n\n' +
                'Common complexities (best to worst):\n' +
                'O(1) → O(log n) → O(n) → O(n log n) → O(n²) → O(2ⁿ) → O(n!)\n\n' +
                'Rules:\n- Drop constants: O(2n) = O(n)\n- Drop lower terms: O(n² + n) = O(n²)\n' +
                '- Worst case unless specified\n- Multiply nested loops, add sequential ones.',
            tags: ['DSA', 'Math', 'Algorithms'],
            flashcards: [],
            createdDate: daysAgo(7).toISOString(),
            revisionCount: 5,
            nextRevisionDate: getNextRevisionDate(5, daysAgo(0)),
            revisions: [revisionOn(7, 9), revisionOn(5, 11), revisionOn(3, 10), revisionOn(1, 14), revisionOn(0, 10)],
        },

        // ──── Networking ────
        {
            id: generateId(),
            title: 'TCP vs UDP',
            description:
                'TCP (Transmission Control Protocol):\n- Connection-oriented (3-way handshake)\n' +
                '- Reliable, ordered delivery\n- Flow control & congestion control\n- Slower, used for: HTTP, FTP, email\n\n' +
                'UDP (User Datagram Protocol):\n- Connectionless\n- No guaranteed delivery or ordering\n' +
                '- Faster, lower overhead\n- Used for: DNS, video streaming, gaming, VoIP',
            tags: ['Networking', 'Protocols'],
            flashcards: [],
            createdDate: daysAgo(4).toISOString(),
            revisionCount: 2,
            nextRevisionDate: getNextRevisionDate(2, daysAgo(0)),
            revisions: [revisionOn(3, 15), revisionOn(0, 12)],
        },
    ];

    return topics;
}

/**
 * Seeds localStorage with demo data if no topics exist for the specific user.
 */
export function seedIfEmpty(userId) {
    if (!userId) return false;
    
    // Fallback to global if needed or use user-specific prefix
    const STORAGE_KEY = `recallx_topics_${userId}`;
    
    try {
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
            const parsed = JSON.parse(existing);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return false; // Already has data
            }
        }
        const seed = generateSeedData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return true;
    } catch (e) {
        console.error('Failed to seed data:', e);
        return false;
    }
}
