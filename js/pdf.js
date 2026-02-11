// ============================================
// PDF PARSING & SLIDE MANAGEMENT
// ============================================

/**
 * Parse a PDF file into slides (images + text)
 * Uses pdf.js from CDN (loaded in index.html)
 */
export async function parsePDF(file) {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) throw new Error('PDF.js not loaded');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const slides = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // Render to canvas for image
        const scale = 2; // High res
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Extract text
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ').trim();

        slides.push({
            pageNumber: i,
            imageDataUrl,
            text: text || `[Slide ${i} - primarily visual content]`,
            width: viewport.width,
            height: viewport.height
        });
    }

    return slides;
}

/**
 * Parse image files into slides
 */
export async function parseImages(files) {
    const slides = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageDataUrl = await readFileAsDataURL(file);

        slides.push({
            pageNumber: i + 1,
            imageDataUrl,
            text: `[Slide ${i + 1} - image: ${file.name}]`,
            width: 0,
            height: 0
        });
    }

    return slides;
}

/**
 * Read a file as data URL
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Detect if file is PDF or image
 */
export function getFileType(file) {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    // Check extension fallback
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
    return 'unknown';
}
