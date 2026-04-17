const key = 'AIzaSyAf2Jh30uydTqBo4bzWsHYE7KQfS7ZJR7I';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello' }] }] }),
  });
  console.log('STATUS:', res.status);
  const body = await res.text();
  console.log('BODY:', body.substring(0, 600));
} catch (e) {
  console.error('FETCH ERROR:', e.message);
}
