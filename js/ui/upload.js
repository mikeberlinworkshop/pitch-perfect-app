// ============================================
// UPLOAD SCREEN UI
// ============================================

import { state, setState } from '../state.js';
import { parsePDF, parseImages, getFileType } from '../pdf.js';
import { personas, getPersonaAvatar } from '../personas.js';

let navigate = null;

export function initUpload(nav) {
    navigate = nav;
}

export function renderUpload() {
    const screen = document.getElementById('screen-upload');
    if (!screen) return;

    screen.innerHTML = `
        <div class="upload-container">
            <div class="upload-header">
                <div class="logo-mark">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="8" fill="url(#paint0_linear_app)"/>
                        <path d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8ZM16 22C12.6863 22 10 19.3137 10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22Z" fill="white" fill-opacity="0.2"/>
                        <path d="M16 13C14.3431 13 13 14.3431 13 16C13 17.6569 14.3431 19 16 19C17.6569 19 19 17.6569 19 16C19 14.3431 17.6569 13 16 13Z" fill="white"/>
                        <path d="M21.5 10.5L24 8M24 8H21M24 8V11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <defs>
                            <linearGradient id="paint0_linear_app" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#F59E0B"/>
                                <stop offset="1" stop-color="#D97706"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h1>Pitch Perfect</h1>
                <p class="subtitle">Practice your pitch. Get real VC feedback.</p>
            </div>

            <div class="upload-section">
                <h2>1. Upload Your Deck</h2>
                <div class="dropzone" id="dropzone">
                    <div class="dropzone-content">
                        <i data-lucide="upload-cloud" class="dropzone-icon"></i>
                        <p class="dropzone-text">Drag & drop your pitch deck here</p>
                        <p class="dropzone-hint">PDF or images (JPG, PNG)</p>
                        <button class="btn btn-secondary" id="browseBtn">Browse Files</button>
                        <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple hidden />
                    </div>
                    <div class="dropzone-loading hidden" id="dropzoneLoading">
                        <div class="spinner"></div>
                        <p>Parsing slides...</p>
                    </div>
                </div>

                <div class="slide-preview ${state.slides.length > 0 ? '' : 'hidden'}" id="slidePreview">
                    <div class="upload-success" id="uploadSuccess">
                        <i data-lucide="check-circle"></i>
                        <span>Deck uploaded successfully!</span>
                    </div>
                    <div class="slide-preview-header">
                        <span id="slideCount">${state.slides.length} slides ready</span>
                        <button class="btn btn-ghost btn-sm" id="clearDeck">
                            <i data-lucide="x"></i> Clear
                        </button>
                    </div>
                    <div class="slide-thumbnails" id="slideThumbnails">
                        ${state.slides.map((s, i) => `<img src="${s.imageDataUrl}" alt="Slide ${i+1}" />`).join('')}
                    </div>
                </div>
            </div>

            <div class="persona-section ${state.slides.length === 0 ? 'disabled' : ''}" id="personaSection">
                <h2>2. Choose Your VC</h2>
                <div class="persona-grid">
                    ${personas.map(p => `
                        <div class="persona-card ${state.selectedPersona?.id === p.id ? 'selected' : ''}" data-persona="${p.id}">
                            <div class="persona-avatar" style="border-color: ${p.color}">
                                <img src="${getPersonaAvatar(p)}" alt="${p.name}" />
                            </div>
                            <h3>${p.name}</h3>
                            <p class="persona-title">${p.title}</p>
                            <p class="persona-desc">${p.description}</p>
                            <div class="persona-interrupt">
                                <i data-lucide="zap"></i>
                                <span>${p.interruptionStyle}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="industry-section ${state.selectedPersona?.id !== 'industry-expert' ? 'hidden' : ''}" id="industrySection">
                <h2>3. Select Your Industry</h2>
                <p class="section-hint">The Industry Expert will tailor questions to your specific vertical.</p>
                <div class="industry-grid">
                    ${['Fintech', 'Healthcare', 'Climate / Cleantech', 'Agriculture', 'Logistics', 'Real Estate', 'Education', 'Other'].map(industry => `
                        <button class="industry-chip ${state.selectedIndustry === industry ? 'selected' : ''}" data-industry="${industry}">
                            ${industry}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="start-section ${(!state.slides.length || !state.selectedPersona || (state.selectedPersona?.id === 'industry-expert' && !state.selectedIndustry)) ? 'disabled' : ''}">
                <button class="btn btn-primary btn-lg" id="startPitchBtn" ${(!state.slides.length || !state.selectedPersona || (state.selectedPersona?.id === 'industry-expert' && !state.selectedIndustry)) ? 'disabled' : ''}>
                    <i data-lucide="play"></i>
                    Start Pitching
                </button>
            </div>
        </div>
    `;

    // Event listeners
    setupDropzone();
    setupPersonaSelection();
    setupStartButton();
}

function setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const clearBtn = document.getElementById('clearDeck');

    if (!dropzone) return;

    browseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput?.click();
    });

    dropzone.addEventListener('click', () => fileInput?.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        await handleFiles(e.dataTransfer.files);
    });

    fileInput?.addEventListener('change', async (e) => {
        await handleFiles(e.target.files);
    });

    clearBtn?.addEventListener('click', () => {
        setState('slides', []);
        setState('deckFileName', null);
        renderUpload();
        if (window.lucide) lucide.createIcons();
    });
}

async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const loading = document.getElementById('dropzoneLoading');
    const content = document.querySelector('.dropzone-content');
    if (loading) loading.classList.remove('hidden');
    if (content) content.classList.add('hidden');

    try {
        const firstFile = fileList[0];
        const fileType = getFileType(firstFile);

        let slides;
        if (fileType === 'pdf') {
            slides = await parsePDF(firstFile);
            setState('deckFileName', firstFile.name);
        } else if (fileType === 'image') {
            slides = await parseImages(fileList);
            setState('deckFileName', `${fileList.length} images`);
        } else {
            throw new Error('Unsupported file type. Please upload a PDF or images.');
        }

        setState('slides', slides);
        renderUpload();
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('File parsing error:', error);
        alert('Error parsing file: ' + error.message);
        if (loading) loading.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }
}

function setupPersonaSelection() {
    document.querySelectorAll('.persona-card').forEach(card => {
        card.addEventListener('click', () => {
            const personaId = card.dataset.persona;
            const persona = personas.find(p => p.id === personaId);
            setState('selectedPersona', persona);

            // Update selection visual
            document.querySelectorAll('.persona-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // Show/hide industry section for Industry Expert
            const industrySection = document.getElementById('industrySection');
            if (industrySection) {
                if (personaId === 'industry-expert') {
                    industrySection.classList.remove('hidden');
                } else {
                    industrySection.classList.add('hidden');
                    setState('selectedIndustry', null);
                }
            }

            // Enable start button (unless Industry Expert without industry selected)
            updateStartButton();
        });
    });

    // Industry chip selection
    document.querySelectorAll('.industry-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const industry = chip.dataset.industry;
            setState('selectedIndustry', industry);

            // Update selection visual
            document.querySelectorAll('.industry-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');

            // Enable start button
            updateStartButton();
        });
    });
}

function updateStartButton() {
    const startBtn = document.getElementById('startPitchBtn');
    const startSection = startBtn?.closest('.start-section');

    const isReady = state.slides.length > 0 &&
                    state.selectedPersona &&
                    (state.selectedPersona.id !== 'industry-expert' || state.selectedIndustry);

    if (startBtn) startBtn.disabled = !isReady;
    if (startSection) startSection.classList.toggle('disabled', !isReady);
}

function setupStartButton() {
    const startBtn = document.getElementById('startPitchBtn');
    startBtn?.addEventListener('click', () => {
        const isReady = state.slides.length > 0 &&
                        state.selectedPersona &&
                        (state.selectedPersona.id !== 'industry-expert' || state.selectedIndustry);

        if (isReady) {
            navigate('pitch');
        }
    });
}
