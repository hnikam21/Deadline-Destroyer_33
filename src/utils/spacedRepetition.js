// Spaced repetition intervals in days
const REVISION_INTERVALS = [1, 2, 5, 10, 20, 30];

export function getNextRevisionDate(revisionCount, baseDate = new Date()) {
  const intervalIndex = Math.min(revisionCount, REVISION_INTERVALS.length - 1);
  const daysToAdd = REVISION_INTERVALS[intervalIndex];
  const next = new Date(baseDate);
  next.setDate(next.getDate() + daysToAdd);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

export function getRetentionStatus(revisionCount) {
  if (revisionCount <= 1) return 'weak';
  if (revisionCount <= 3) return 'medium';
  return 'strong';
}

export function getRetentionLabel(status) {
  const labels = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };
  return labels[status] || 'Unknown';
}

export function getRetentionColor(status) {
  const colors = {
    weak: '#EF4444',
    medium: '#F59E0B',
    strong: '#10B981',
  };
  return colors[status] || '#6B7280';
}

export function isTopicDueToday(topic) {
  if (!topic.nextRevisionDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(topic.nextRevisionDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate <= today;
}

export function isTopicAtRisk(topic) {
  if (!topic.nextRevisionDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(topic.nextRevisionDate);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  return diffDays > 0;
}

export function isTopicCompleted(topic) {
  return topic.revisionCount >= REVISION_INTERVALS.length;
}

export function calculateStreak(allTopics) {
  const allRevisions = [];
  allTopics.forEach((topic) => {
    if (topic.revisions) {
      topic.revisions.forEach((rev) => allRevisions.push(new Date(rev)));
    }
  });

  if (allRevisions.length === 0) return 0;

  const dateSet = new Set(
    allRevisions.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.toDateString();
    })
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(today);

  // Check if today has revisions, if not check yesterday
  if (!dateSet.has(checkDate.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!dateSet.has(checkDate.toDateString())) {
      return 0;
    }
  }

  while (dateSet.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

export function getRevisionsPerDay(allTopics, days = 7) {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();

    let count = 0;
    allTopics.forEach((topic) => {
      if (topic.revisions) {
        topic.revisions.forEach((rev) => {
          const revDate = new Date(rev);
          revDate.setHours(0, 0, 0, 0);
          if (revDate.toDateString() === dateStr) count++;
        });
      }
    });

    result.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count,
    });
  }

  return result;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getRevisionSchedulePreview(baseDate = new Date()) {
  return REVISION_INTERVALS.map((days, index) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    return {
      revision: index + 1,
      days,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
}
