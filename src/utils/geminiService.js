/**
 * Gemini AI Service for RecallX
 * Uses Google Gemini 2.0 Flash via REST API
 * 
 * Includes: request queue, rate-limit cooldown, long backoff, graceful fallbacks.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Cache helpers ───────────────────────────────
function getCached(key) {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        // Cache valid for 10 minutes
        if (Date.now() - ts > 10 * 60 * 1000) {
            sessionStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function setCache(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* quota exceeded — ignore */ }
}

// ─── Rate-limit cooldown ─────────────────────────
// After hitting a 429, block all requests for a cooldown period
let rateLimitCooldownUntil = 0;
const COOLDOWN_MS = 90_000; // 90 seconds cooldown after a rate limit hit

function isInCooldown() {
    return Date.now() < rateLimitCooldownUntil;
}

function startCooldown() {
    rateLimitCooldownUntil = Date.now() + COOLDOWN_MS;
    console.warn(`Gemini rate limited — entering ${COOLDOWN_MS / 1000}s cooldown until ${new Date(rateLimitCooldownUntil).toLocaleTimeString()}`);
}

// ─── Serial request queue ────────────────────────
// Ensures only one Gemini call runs at a time to avoid burning through the free tier
let queuePromise = Promise.resolve();

function enqueue(fn) {
    queuePromise = queuePromise.then(fn, fn);
    return queuePromise;
}

// ─── Core API call with retry for rate limits ───
async function callGemini(prompt, retries = 3) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    if (isInCooldown()) {
        const remaining = Math.ceil((rateLimitCooldownUntil - Date.now()) / 1000);
        throw new Error(`Rate limited — please wait ${remaining}s before trying again.`);
    }

    // Wrap the actual call in the serial queue
    return enqueue(async () => {
        for (let attempt = 0; attempt < retries; attempt++) {
            // Re-check cooldown before each attempt
            if (isInCooldown()) {
                const remaining = Math.ceil((rateLimitCooldownUntil - Date.now()) / 1000);
                throw new Error(`Rate limited — please wait ${remaining}s before trying again.`);
            }

            const res = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            });

            if (res.status === 429) {
                // Rate limited — longer exponential backoff
                const waitSec = [10, 30, 60][attempt] || 30;
                console.warn(`Gemini rate limited (attempt ${attempt + 1}/${retries}), retrying in ${waitSec}s...`);

                if (attempt === retries - 1) {
                    // Last attempt failed — start global cooldown
                    startCooldown();
                    throw new Error('Gemini API rate limit exceeded. Please wait about 90 seconds and try again.');
                }

                await new Promise(r => setTimeout(r, waitSec * 1000));
                continue;
            }

            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(`Gemini API error (${res.status}): ${errText}`);
            }

            const json = await res.json();
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Empty response from Gemini');
            return text.trim();
        }

        startCooldown();
        throw new Error('Gemini API rate limit exceeded. Please wait about 90 seconds and try again.');
    });
}

// ─── 1. Summarize a topic ────────────────────────
export async function summarizeTopic(title, description) {
    if (!description || description.trim().length < 20) {
        return null; // Not enough content to summarize
    }

    const cacheKey = `recallx_ai_summary_${title.slice(0, 30)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Try Gemini first, fall back to local
    try {
        const prompt = `You are a study assistant. A student is learning the topic "${title}".

Here are their notes:
"""
${description.slice(0, 3000)}
"""

Provide a concise, well-structured summary to help them revise quickly. Format:

📌 **Key Concepts:** (2-3 bullet points of the most important ideas)

🧠 **Remember:** (1-2 critical things they must not forget)

💡 **Quick Tip:** (One practical study tip for this topic)

Keep it short and punchy — this is for quick revision, not a textbook.`;

        const result = await callGemini(prompt);
        setCache(cacheKey, result);
        return result;
    } catch (err) {
        console.warn('Gemini summarize failed, using local fallback:', err.message);
        const { localSummarize } = await import('./localAI.js');
        const local = localSummarize(title, description);
        if (local) setCache(cacheKey, local);
        return local;
    }
}

// ─── 2. Generate MCQ Test ──────────────────────────
export async function generateMCQTest(title, description) {
    if (!description || description.trim().length < 50) {
        throw new Error('Not enough notes to generate a quiz. Please add more description.');
    }

    try {
        const prompt = `You are a strict but fair teacher generating a 5-question multiple-choice quiz on the topic "${title}".

Here are the student's study notes:
"""
${description.slice(0, 4000)}
"""

Based ONLY on the provided notes (do not invent external facts), generate 5 multiple-choice questions. 
Each question should test core understanding, not just trivia. Ensure answers are explicitly or implicitly found in the notes.
If the notes are too short to create 5 distinct questions, make the questions as varied as possible.

Return the result in EXACTLY this JSON format (no markdown code blocks, just raw JSON array):
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1
  }
]
- "correctAnswer" should be the zero-based index of the correct option in the "options" array.
- Make exactly 5 questions.
- Provide precisely 4 options per question.`;

        const raw = await callGemini(prompt);
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed) || parsed.length !== 5) {
            throw new Error('Invalid JSON structure returned');
        }
        return parsed;
    } catch (err) {
        console.warn('Gemini MCQ failed, using local fallback:', err.message);
        const { localGenerateMCQ } = await import('./localAI.js');
        return localGenerateMCQ(title, description);
    }
}

// ─── 3. Analyze learning pace ────────────────────
export async function analyzeLearningPace(topics) {
    // Import local fallback up front
    const { localAnalyzePace } = await import('./localAI.js');

    if (!topics || topics.length === 0) {
        return localAnalyzePace(topics);
    }

    const cacheKey = `recallx_ai_pace_${topics.length}_${topics.reduce((s, t) => s + t.revisionCount, 0)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Build stats for the prompt
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);

    const totalTopics = topics.length;
    const totalRevisions = topics.reduce((s, t) => s + (t.revisionCount || 0), 0);
    const weakTopics = topics.filter(t => (t.revisionCount || 0) <= 1);
    const strongTopics = topics.filter(t => (t.revisionCount || 0) >= 4);

    const overdueTopics = topics.filter(t => {
        if (!t.nextRevisionDate) return false;
        const due = new Date(t.nextRevisionDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    });

    const dueToday = topics.filter(t => {
        if (!t.nextRevisionDate) return false;
        const due = new Date(t.nextRevisionDate);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === today.getTime();
    });

    // Revision frequency — how many days in the last week had revisions
    const last7Days = new Set();
    topics.forEach(t => {
        (t.revisions || []).forEach(r => {
            const rd = new Date(r);
            const diff = Math.floor((now - rd) / (1000 * 60 * 60 * 24));
            if (diff <= 7) last7Days.add(rd.toDateString());
        });
    });

    // Average test scores
    let totalScore = 0;
    let totalTests = 0;
    topics.forEach(t => {
        if (t.testScores && t.testScores.length > 0) {
            t.testScores.forEach(scoreObj => {
                totalScore += scoreObj.score;
                totalTests++;
            });
        }
    });
    const avgScorePct = totalTests > 0 ? Math.round((totalScore / (totalTests * 5)) * 100) : null;

    const topicSummary = topics
        .sort((a, b) => (a.revisionCount || 0) - (b.revisionCount || 0))
        .slice(0, 8)
        .map(t => `- "${t.title}": ${t.revisionCount || 0} revisions, ${overdueTopics.includes(t) ? 'OVERDUE' : 'on track'}`)
        .join('\n');

    try {
        const prompt = `You are an AI learning coach for a spaced repetition study app called RecallX.

Here is the student's data:
- Total topics: ${totalTopics}
- Total revisions completed: ${totalRevisions}  
- Weak topics (≤1 revision): ${weakTopics.length}
- Strong topics (≥4 revisions): ${strongTopics.length}
- Topics overdue: ${overdueTopics.length}
- Topics due today: ${dueToday.length}
- Days active in last 7 days: ${last7Days.size}/7
- Recent quiz average: ${avgScorePct !== null ? avgScorePct + '% (out of 100)' : 'No tests taken yet'}

Topic details (sorted by weakest first):
${topicSummary}

Based on this data, respond in EXACTLY this JSON format (no markdown fences):
{
  "pace": "crushing|steady|slipping|new",
  "emoji": "<one emoji>",
  "label": "<2-3 word label>",
  "message": "<2-3 sentence personalized motivational message with specific advice based on the data. Reference actual topic names if any are overdue. Address quiz scores if they exist.>",
  "priorities": ["<topic name 1>", "<topic name 2>", "<topic name 3>"]
}

Rules:
- "crushing": active 5+ days, few overdue, strong topics growing OR high quiz average (80%+)
- "steady": active 3-4 days, some progress
- "slipping": many overdue, inactive days, weak topics piling up OR low quiz average (< 50%) despite revisions
- "new": fewer than 3 total revisions
- priorities = the 3 topics most in need of revision (weakest/overdue first)
- Keep the message warm but direct. Be specific.`;

        const raw = await callGemini(prompt);

        // Parse JSON — handle cases where Gemini wraps in code fences
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const result = {
            pace: parsed.pace || 'steady',
            emoji: parsed.emoji || '📊',
            label: parsed.label || 'Analyzing...',
            message: parsed.message || 'Keep learning and revising your topics!',
            priorities: Array.isArray(parsed.priorities) ? parsed.priorities.slice(0, 3) : [],
        };

        setCache(cacheKey, result);
        return result;
    } catch (err) {
        console.warn('Gemini pace analysis failed, using local fallback:', err.message);
        const result = localAnalyzePace(topics);
        setCache(cacheKey, result);
        return result;
    }
}
