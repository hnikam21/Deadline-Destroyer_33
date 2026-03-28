import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up the PDF.js worker from the locally installed package
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;


/**
 * Extract text content from a PDF file.
 * @param {File} file - The PDF file to extract text from
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(file, onProgress) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const textParts = [];

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (pageText) {
            textParts.push(pageText);
        }

        if (onProgress) {
            onProgress(Math.round((i / totalPages) * 100));
        }
    }

    return textParts.join('\n\n');
}

/**
 * Extract text from an image file using Tesseract.js OCR.
 * Loaded on-demand to avoid bloating initial bundle.
 * @param {File} file - The image file to OCR
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromImage(file, onProgress) {
    const Tesseract = await import('tesseract.js');
    const { createWorker } = Tesseract;

    const worker = await createWorker('eng', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
                onProgress(Math.round(m.progress * 100));
            }
        },
    });

    const imageUrl = URL.createObjectURL(file);

    try {
        const { data } = await worker.recognize(imageUrl);
        await worker.terminate();
        return data.text.trim();
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}

// Common stop words to ignore in NLP tasks
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
    'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
    'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
    'than', 'too', 'very', 'just', 'also', 'about', 'up', 'out', 'if',
    'then', 'that', 'this', 'these', 'those', 'it', 'its', 'he', 'she',
    'they', 'them', 'we', 'us', 'you', 'your', 'my', 'his', 'her', 'our',
    'their', 'what', 'which', 'who', 'whom', 'where', 'when', 'how', 'why',
]);

/**
 * Heuristically extracts a title from the text.
 * Looks for the first non-empty line that isn't too long.
 * @param {string} text 
 * @returns {string} Predicted title
 */
export function extractTitle(text) {
    if (!text || text.trim().length === 0) return '';
    const strings = text.split('\n').map(s => s.trim()).filter(s => s.length > 2);
    for (const s of strings) {
        if (s.length < 100) return s; // likely a title or heading
    }
    return 'Extracted Topic';
}

/**
 * Extracts the most frequent relevant words as tags.
 * @param {string} text
 * @param {number} maxTags
 * @returns {string[]} Array of tags
 */
export function extractTags(text, maxTags = 3) {
    if (!text || text.trim().length === 0) return [];
    const wordFreq = {};
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    
    // additional filter: ignore purely numeric words
    words.forEach(word => {
        if (isNaN(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });

    return Object.keys(wordFreq)
        .sort((a, b) => wordFreq[b] - wordFreq[a])
        .slice(0, maxTags);
}

/**
 * Generate an extractive summary from text using TF-based sentence scoring.
 * Picks the top N most informative sentences.
 * @param {string} text - The full text to summarize
 * @param {number} maxSentences - Maximum number of sentences in summary
 * @returns {string} The summary
 */
export function summarizeText(text, maxSentences = 5) {
    if (!text || text.trim().length === 0) {
        return '';
    }

    // Split into sentences (handle abbreviations somewhat)
    const sentences = text
        .replace(/([.!?])\s+/g, '$1|')
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 15); // ignore very short fragments

    if (sentences.length <= maxSentences) {
        return sentences.join(' ');
    }

    // Build word frequency map
    const wordFreq = {};
    sentences.forEach((sentence) => {
        const words = sentence
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

        words.forEach((word) => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
    });

    // Score each sentence by sum of its word frequencies
    const scored = sentences.map((sentence, index) => {
        const words = sentence
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

        const score = words.reduce((sum, w) => sum + (wordFreq[w] || 0), 0);
        // Normalize by sentence length to avoid bias toward long sentences
        const normalizedScore = words.length > 0 ? score / Math.sqrt(words.length) : 0;

        return { sentence, index, score: normalizedScore };
    });

    // Pick top N scored sentences, then sort by original order for readability
    const topSentences = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSentences)
        .sort((a, b) => a.index - b.index)
        .map((s) => s.sentence);

    return topSentences.join(' ');
}

/**
 * Determine file type and extract text accordingly.
 * @param {File} file
 * @param {function} onProgress
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file, onProgress) {
    const type = file.type;
    const name = file.name.toLowerCase();

    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        return extractTextFromPDF(file, onProgress);
    }

    if (type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(name)) {
        return extractTextFromImage(file, onProgress);
    }

    throw new Error(`Unsupported file type: ${type || name}`);
}

/**
 * Format file size for display.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
