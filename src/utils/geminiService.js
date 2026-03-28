/**
 * Gemini AI Service for RecallX
 * Uses Google Gemini 2.0 Flash via REST API
 */

const GEMINI_API_KEY = 'AIzaSyAf2Jh30uydTqBo4bzWsHYE7KQfS7ZJR7I';
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

// ─── Core API call with retry for rate limits ───
async function callGemini(prompt, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
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
            // Rate limited — wait and retry
            const waitSec = [3, 8, 15][attempt] || 10;
            console.warn(`Gemini rate limited (attempt ${attempt + 1}/${retries}), retrying in ${waitSec}s...`);
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

    throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
}

// ─── 1. Summarize a topic ────────────────────────
export async function summarizeTopic(title, description) {
    if (!description || description.trim().length < 20) {
        return null; // Not enough content to summarize
    }

    const cacheKey = `recallx_ai_summary_${title.slice(0, 30)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

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
}

// ─── 2. Analyze learning pace ────────────────────
export async function analyzeLearningPace(topics) {
    if (!topics || topics.length === 0) {
        return {
            pace: 'new',
            emoji: '🆕',
            label: 'Just Started',
            message: 'Welcome to RecallX! Add your first topic to begin your learning journey.',
            priorities: [],
        };
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

    const topicSummary = topics
        .sort((a, b) => (a.revisionCount || 0) - (b.revisionCount || 0))
        .slice(0, 8)
        .map(t => `- "${t.title}": ${t.revisionCount || 0} revisions, ${overdueTopics.includes(t) ? 'OVERDUE' : 'on track'}`)
        .join('\n');

    const prompt = `You are an AI learning coach for a spaced repetition study app called RecallX.

Here is the student's data:
- Total topics: ${totalTopics}
- Total revisions completed: ${totalRevisions}  
- Weak topics (≤1 revision): ${weakTopics.length}
- Strong topics (≥4 revisions): ${strongTopics.length}
- Topics overdue: ${overdueTopics.length}
- Topics due today: ${dueToday.length}
- Days active in last 7 days: ${last7Days.size}/7

Topic details (sorted by weakest first):
${topicSummary}

Based on this data, respond in EXACTLY this JSON format (no markdown fences):
{
  "pace": "crushing|steady|slipping|new",
  "emoji": "<one emoji>",
  "label": "<2-3 word label>",
  "message": "<2-3 sentence personalized motivational message with specific advice based on the data. Reference actual topic names if any are overdue.>",
  "priorities": ["<topic name 1>", "<topic name 2>", "<topic name 3>"]
}

Rules:
- "crushing": active 5+ days, few overdue, strong topics growing
- "steady": active 3-4 days, some progress
- "slipping": many overdue, inactive days, weak topics piling up
- "new": fewer than 3 total revisions
- priorities = the 3 topics most in need of revision (weakest/overdue first)
- Keep the message warm but direct. Be specific.`;

    try {
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
        console.warn('Gemini pace analysis parse error:', err);
        // Fallback based on simple heuristics
        const isSlipping = overdueTopics.length > totalTopics * 0.4;
        const isCrushing = last7Days.size >= 5 && strongTopics.length >= totalTopics * 0.3;

        return {
            pace: isSlipping ? 'slipping' : isCrushing ? 'crushing' : 'steady',
            emoji: isSlipping ? '⚠️' : isCrushing ? '🚀' : '📈',
            label: isSlipping ? 'Falling Behind' : isCrushing ? 'Crushing It' : 'Steady Progress',
            message: isSlipping
                ? `You have ${overdueTopics.length} overdue topics. Try to revise at least a few today to get back on track!`
                : isCrushing
                    ? `Amazing work! You've been consistent and ${strongTopics.length} topics are strong. Keep up this momentum!`
                    : `You're making progress. Focus on your weakest topics to level up faster.`,
            priorities: overdueTopics.slice(0, 3).map(t => t.title),
        };
    }
}
