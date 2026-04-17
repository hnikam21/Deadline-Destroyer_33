/**
 * Local AI — client-side summarization, flashcard & quiz generation.
 * Works entirely offline, no API key needed.
 * Used as the primary engine, with Gemini as an optional upgrade.
 */

// ─── Stop words ──────────────────────────────────
const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'to','of','in','for','on','with','at','by','from','as','into','through',
  'during','before','after','above','below','between','and','but','or','not',
  'no','nor','so','yet','both','either','neither','each','every','all','any',
  'few','more','most','other','some','such','than','too','very','just','also',
  'about','up','out','if','then','that','this','these','those','it','its',
  'he','she','they','them','we','us','you','your','my','his','her','our',
  'their','what','which','who','whom','where','when','how','why','there',
  'here','only','own','same','while','because','until','over','under','again',
]);

// ─── Sentence splitter ───────────────────────────
function splitSentences(text) {
  return text
    .replace(/([.!?])\s+/g, '$1|||')
    .split('|||')
    .map(s => s.trim())
    .filter(s => s.length > 15);
}

// ─── Word tokenizer ─────────────────────────────
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// ─── TF-IDF-like sentence scoring ────────────────
function scoreSentences(sentences) {
  // Build word frequency across all sentences
  const wordFreq = {};
  sentences.forEach(s => {
    tokenize(s).forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
  });

  return sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    if (words.length === 0) return { sentence, index, score: 0 };
    const score = words.reduce((sum, w) => sum + (wordFreq[w] || 0), 0) / Math.sqrt(words.length);
    return { sentence, index, score };
  });
}

// ═══════════════════════════════════════════════════
// 1. SUMMARIZE
// ═══════════════════════════════════════════════════
export function localSummarize(title, description) {
  if (!description || description.trim().length < 20) return null;

  const sentences = splitSentences(description);
  if (sentences.length <= 4) {
    return formatSummary(title, sentences);
  }

  const scored = scoreSentences(sentences);
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence);

  return formatSummary(title, topSentences);
}

function formatSummary(title, keyPoints) {
  const bullets = keyPoints.map(s => `• ${s}`).join('\n');
  return `📌 **Key Concepts:**\n${bullets}\n\n🧠 **Remember:** Focus on understanding the core ideas of "${title}" rather than memorizing details.\n\n💡 **Quick Tip:** Try explaining this topic to someone else — it's the best way to find gaps in your understanding.`;
}

// ═══════════════════════════════════════════════════
// 2. GENERATE MCQ TEST
// ═══════════════════════════════════════════════════
export function localGenerateMCQ(title, description) {
  if (!description || description.trim().length < 30) {
    throw new Error('Not enough notes to generate a quiz. Please add more description.');
  }

  const sentences = splitSentences(description);
  const scored = scoreSentences(sentences);
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // Extract key terms for distractor generation
  const allWords = tokenize(description);
  const wordFreq = {};
  allWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const keyTerms = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);

  const questions = [];
  const usedSentences = new Set();

  // Strategy 1: Fill-in-the-blank questions
  for (const { sentence, index } of topSentences) {
    if (questions.length >= 5) break;
    if (usedSentences.has(index)) continue;

    const words = tokenize(sentence);
    const importantWords = words.filter(w => wordFreq[w] >= 2 && w.length > 3);
    if (importantWords.length === 0) continue;

    const targetWord = importantWords[Math.floor(Math.random() * importantWords.length)];
    const blankedSentence = sentence.replace(
      new RegExp(`\\b${targetWord}\\b`, 'i'),
      '______'
    );

    // Generate distractors from key terms
    const distractors = keyTerms
      .filter(t => t !== targetWord && t.length > 2)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    if (distractors.length < 3) {
      // Pad with generic distractors
      const fillers = ['variable', 'function', 'process', 'method', 'system', 'structure', 'algorithm', 'value'];
      while (distractors.length < 3) {
        const filler = fillers[distractors.length];
        if (filler !== targetWord) distractors.push(filler);
      }
    }

    const options = [targetWord, ...distractors.slice(0, 3)];
    // Shuffle options
    const shuffled = options.sort(() => Math.random() - 0.5);
    const correctAnswer = shuffled.indexOf(targetWord);

    // Capitalize first letter of each option
    const formattedOptions = shuffled.map(o => o.charAt(0).toUpperCase() + o.slice(1));

    questions.push({
      question: `Complete the statement: "${blankedSentence}"`,
      options: formattedOptions,
      correctAnswer,
    });
    usedSentences.add(index);
  }

  // Strategy 2: True/False style (as MCQ) if we need more questions
  for (const { sentence, index } of topSentences) {
    if (questions.length >= 5) break;
    if (usedSentences.has(index)) continue;

    const shortSentence = sentence.length > 100 ? sentence.substring(0, 100) + '...' : sentence;

    questions.push({
      question: `Which of the following is true about "${title}"?`,
      options: [
        shortSentence.replace(/\.$/, ''),
        `${title} is unrelated to ${keyTerms[0] || 'computing'}`,
        `None of the above applies to ${title}`,
        `${title} was deprecated in modern usage`,
      ],
      correctAnswer: 0,
    });
    usedSentences.add(index);
  }

  // If we still don't have 5, add concept questions
  while (questions.length < 5) {
    const termIdx = questions.length;
    const term = keyTerms[termIdx] || title.toLowerCase();

    questions.push({
      question: `What is a key concept related to "${title}"?`,
      options: [
        capitalizeFirst(keyTerms[termIdx] || 'core concept'),
        'Unrelated terminology',
        'Deprecated feature',
        'External dependency',
      ],
      correctAnswer: 0,
    });
  }

  return questions.slice(0, 5);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ═══════════════════════════════════════════════════
// 3. LEARNING PACE ANALYSIS (heuristic)
// ═══════════════════════════════════════════════════
export function localAnalyzePace(topics) {
  if (!topics || topics.length === 0) {
    return {
      pace: 'new',
      emoji: '🆕',
      label: 'Just Started',
      message: 'Welcome to RecallX! Add your first topic to begin your learning journey.',
      priorities: [],
    };
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

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

  // Revision frequency — days active in last 7 days
  const last7Days = new Set();
  topics.forEach(t => {
    (t.revisions || []).forEach(r => {
      const rd = new Date(r);
      const diff = Math.floor((now - rd) / (1000 * 60 * 60 * 24));
      if (diff <= 7) last7Days.add(rd.toDateString());
    });
  });

  const activeDays = last7Days.size;
  const isSlipping = overdueTopics.length > totalTopics * 0.4 || (activeDays <= 1 && totalRevisions > 3);
  const isCrushing = activeDays >= 5 && strongTopics.length >= totalTopics * 0.3;
  const isNew = totalRevisions < 3;

  let pace, emoji, label, message;

  if (isNew) {
    pace = 'new';
    emoji = '🌱';
    label = 'Getting Started';
    message = `You've added ${totalTopics} topic${totalTopics > 1 ? 's' : ''} — great start! Complete your first few revisions to build momentum. Consistency is more important than volume.`;
  } else if (isCrushing) {
    pace = 'crushing';
    emoji = '🚀';
    label = 'Crushing It';
    message = `Incredible consistency! You've been active ${activeDays} out of the last 7 days, and ${strongTopics.length} of your topics are at strong retention. Keep this pace and you'll master everything.`;
  } else if (isSlipping) {
    pace = 'slipping';
    emoji = '⚠️';
    label = 'Falling Behind';
    const overdueNames = overdueTopics.slice(0, 2).map(t => `"${t.title}"`).join(' and ');
    message = `You have ${overdueTopics.length} overdue topic${overdueTopics.length > 1 ? 's' : ''}, including ${overdueNames}. Try to revise at least 2-3 topics today to get back on track!`;
  } else {
    pace = 'steady';
    emoji = '📈';
    label = 'Steady Progress';
    message = `You're making solid progress with ${totalRevisions} total revisions across ${totalTopics} topics. Focus on your ${weakTopics.length} weak topic${weakTopics.length !== 1 ? 's' : ''} to level up faster.`;
  }

  // Priorities: overdue first, then weakest
  const priorities = [
    ...overdueTopics.slice(0, 2),
    ...weakTopics.filter(t => !overdueTopics.includes(t)).slice(0, 1),
  ].slice(0, 3).map(t => t.title);

  return { pace, emoji, label, message, priorities };
}
