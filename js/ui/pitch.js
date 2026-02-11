// ============================================
// PITCH SIMULATION SCREEN
// ============================================

import { state, setState, getCurrentSlide } from '../state.js';
import { getVCResponse } from '../api.js';
import { getPersonaAvatar } from '../personas.js';
import { speakText, toggleRecording, stopAudio } from '../audio.js';
import { MAX_EXCHANGES_PER_SLIDE, MAX_QA_EXCHANGES } from '../config.js';

let navigate = null;

export function initPitch(nav) {
    navigate = nav;
}

export function renderPitch() {
    const screen = document.getElementById('screen-pitch');
    if (!screen) return;

    const persona = state.selectedPersona;
    const slide = getCurrentSlide();
    const totalSlides = state.slides.length;
    const currentNum = state.currentSlideIndex + 1;
    const isQA = state.pitchPhase === 'qa';

    screen.innerHTML = `
        <div class="pitch-layout">
            <!-- Left: Slide Viewer -->
            <div class="slide-panel">
                <div class="slide-nav">
                    <span class="slide-indicator">${isQA ? 'Q&A Round' : `Slide ${currentNum} of ${totalSlides}`}</span>
                    <div class="slide-controls">
                        ${!isQA ? `
                            <button class="btn btn-ghost btn-sm" id="prevSlideBtn" ${state.currentSlideIndex === 0 ? 'disabled' : ''}>
                                <i data-lucide="chevron-left"></i>
                            </button>
                            <button class="btn btn-ghost btn-sm" id="nextSlideBtn">
                                <i data-lucide="chevron-right"></i>
                                ${state.currentSlideIndex < totalSlides - 1 ? 'Next Slide' : 'Start Q&A'}
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-sm" id="endPitchBtn">
                                <i data-lucide="check"></i> End Pitch
                            </button>
                        `}
                    </div>
                </div>
                <div class="slide-viewer">
                    ${isQA
            ? `<div class="qa-overlay">
                            <i data-lucide="message-circle"></i>
                            <h3>Q&A Round</h3>
                            <p>The VC is asking deeper follow-up questions about your pitch.</p>
                        </div>`
            : `<img src="${slide?.imageDataUrl || ''}" alt="Slide ${currentNum}" class="slide-image" />`
        }
                </div>
                <!-- Slide thumbnails strip -->
                <div class="slide-strip">
                    ${state.slides.map((s, i) => `
                        <div class="slide-thumb ${i === state.currentSlideIndex ? 'active' : ''} ${i < state.currentSlideIndex ? 'done' : ''}" data-slide="${i}">
                            <img src="${s.imageDataUrl}" alt="Slide ${i + 1}" />
                            <span>${i + 1}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Right: Chat -->
            <div class="chat-panel">
                <div class="vc-header">
                    <div class="vc-avatar-container" id="vcAvatarContainer">
                        <div class="vc-avatar-ring"></div>
                        <div class="vc-avatar-ring"></div>
                        <div class="vc-avatar-ring"></div>
                        <div class="vc-avatar" style="border-color: ${persona.color}">
                            <img src="${getPersonaAvatar(persona)}" alt="${persona.name}" />
                        </div>
                    </div>
                    <div class="vc-info">
                        <h3>${persona.name}</h3>
                        <p>${persona.title}</p>
                    </div>
                    <button class="btn btn-ghost btn-sm" id="voiceToggle" title="Toggle voice">
                        <i data-lucide="${state.voiceEnabled ? 'volume-2' : 'volume-x'}"></i>
                    </button>
                </div>

                <div class="chat-messages" id="chatMessages">
                    ${state.conversationHistory.length === 0 ? `
                        <div class="chat-intro">
                            <p><strong>${persona.name}</strong> is ready to hear your pitch.</p>
                            <p class="hint">${isQA ? 'Answer the VC\'s questions.' : 'Present your slides — explain what\'s on screen. The VC may interrupt with questions.'}</p>
                        </div>
                    ` : ''}
                    ${state.conversationHistory.map(msg => `
                        <div class="chat-message ${msg.role}">
                            ${msg.role === 'vc' ? `<div class="msg-avatar"><img src="${getPersonaAvatar(persona)}" /></div>` : ''}
                            <div class="msg-bubble ${msg.role}" ${msg.role === 'vc' ? `style="border-color: ${persona.color}"` : ''}>
                                <p>${msg.content}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="chat-input-area">
                    <div id="interimTranscript" class="interim-transcript"></div>
                    <div class="voice-input-section">
                        <button class="btn btn-voice" id="micBtn">
                            <div class="mic-icon-wrap">
                                <i data-lucide="mic"></i>
                            </div>
                            <span class="mic-label" id="micLabel">Tap to speak</span>
                        </button>
                        <p class="voice-hint" id="voiceHint">Tap the microphone, speak, then tap again when done.</p>
                        <div class="recording-indicator hidden" id="recordingIndicator">
                            <div class="pulse-ring"></div>
                            <span>Listening... tap again when done</span>
                        </div>
                    </div>
                    <div class="loading-indicator hidden" id="loadingIndicator">
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>${persona.name} is thinking...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupPitchEvents();
    scrollToBottom();

    // Show VC intro on first load
    if (state.conversationHistory.length === 0 && !state.vcIntroShown) {
        showVCIntro();
    }
}

async function showVCIntro() {
    const persona = state.selectedPersona;
    if (!persona.introMessage) return;

    state.vcIntroShown = true;

    // Small delay for effect
    await new Promise(r => setTimeout(r, 800));

    // Remove chat intro
    const intro = document.querySelector('.chat-intro');
    if (intro) intro.remove();

    // Add VC intro message
    addMessage('vc', persona.introMessage);

    // Speak the intro
    if (state.voiceEnabled) {
        await speakText(persona.introMessage, persona.voiceId);
    }
}

function setupPitchEvents() {
    // Voice input with tap-to-toggle
    const micBtn = document.getElementById('micBtn');
    const recordingIndicator = document.getElementById('recordingIndicator');
    const voiceHint = document.getElementById('voiceHint');
    const micLabel = document.getElementById('micLabel');
    let isRecording = false;
    let currentTranscript = '';

    const handleMicClick = () => {
        if (isRecording) {
            // Stop recording
            isRecording = false;
            micBtn?.classList.remove('recording');
            recordingIndicator?.classList.add('hidden');
            voiceHint?.classList.remove('hidden');
            if (micLabel) micLabel.textContent = 'Tap to speak';

            // Stop the recognition
            toggleRecording(() => {});

            // Clear interim transcript
            const interimEl = document.getElementById('interimTranscript');
            if (interimEl) interimEl.textContent = '';

            // Send the message if we have transcript
            if (currentTranscript.trim()) {
                sendVoiceMessage(currentTranscript.trim());
            }
            currentTranscript = '';
        } else {
            // Start recording
            isRecording = true;
            micBtn?.classList.add('recording');
            recordingIndicator?.classList.remove('hidden');
            voiceHint?.classList.add('hidden');
            if (micLabel) micLabel.textContent = 'Tap to send';
            currentTranscript = '';

            toggleRecording((transcript) => {
                currentTranscript = transcript;
                // Show interim transcript
                const interimEl = document.getElementById('interimTranscript');
                if (interimEl) {
                    interimEl.textContent = transcript;
                }
            });
        }
    };

    // Single click handler for tap-to-toggle
    micBtn?.addEventListener('click', handleMicClick);

    // Voice toggle
    const voiceToggle = document.getElementById('voiceToggle');
    voiceToggle?.addEventListener('click', () => {
        state.voiceEnabled = !state.voiceEnabled;
        renderPitch();
        if (window.lucide) lucide.createIcons();
    });

    // Slide navigation
    const prevBtn = document.getElementById('prevSlideBtn');
    const nextBtn = document.getElementById('nextSlideBtn');

    prevBtn?.addEventListener('click', () => {
        if (state.currentSlideIndex > 0) {
            state.currentSlideIndex--;
            state.currentSlideExchanges = 0;
            renderPitch();
            if (window.lucide) lucide.createIcons();
        }
    });

    nextBtn?.addEventListener('click', advanceSlide);

    // End pitch
    const endBtn = document.getElementById('endPitchBtn');
    endBtn?.addEventListener('click', () => {
        setState('pitchPhase', 'done');
        navigate('coaching');
    });

    // Slide thumb clicks
    document.querySelectorAll('.slide-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            if (state.pitchPhase !== 'qa') {
                state.currentSlideIndex = parseInt(thumb.dataset.slide);
                state.currentSlideExchanges = 0;
                renderPitch();
                if (window.lucide) lucide.createIcons();
            }
        });
    });
}

function advanceSlide() {
    if (state.currentSlideIndex < state.slides.length - 1) {
        state.currentSlideIndex++;
        state.currentSlideExchanges = 0;
        state.currentSlideWords = 0;
        renderPitch();
        if (window.lucide) lucide.createIcons();
    } else {
        // Move to Q&A phase
        setState('pitchPhase', 'qa');
        state.qaExchanges = 0;

        // Add VC Q&A opener
        const persona = state.selectedPersona;
        addMessage('vc', `Okay, thanks for walking me through the deck. I have some questions. Let me start with the thing I'm most curious about...`);

        // Get first Q&A question
        getVCQuestion();
    }
}

async function sendVoiceMessage(message) {
    if (!message) return;

    // Track words spoken on this slide
    const wordCount = message.split(/\s+/).length;
    state.currentSlideWords += wordCount;

    // Add user message
    addMessage('user', message);
    setLoading(true);

    try {
        const slide = getCurrentSlide();
        const slideContext = slide ? `Slide ${slide.pageNumber}: ${slide.text}` : '';

        // Pass word count context for interruption timing
        const { response, scores } = await getVCResponse(
            message,
            state.selectedPersona,
            slideContext,
            state.conversationHistory,
            state.pitchPhase,
            state.currentSlideWords
        );

        // Store scores
        if (scores) state.turnScores.push(scores);

        // Add VC response
        addMessage('vc', response);

        // Speak the response
        if (state.voiceEnabled) {
            await speakText(response, state.selectedPersona.voiceId);
        }

        // Track exchanges
        if (state.pitchPhase === 'presenting') {
            state.currentSlideExchanges++;
        } else if (state.pitchPhase === 'qa') {
            state.qaExchanges++;
            if (state.qaExchanges >= MAX_QA_EXCHANGES) {
                // Auto-end Q&A
                addMessage('vc', "I think that's a good place to stop. Let me give you my overall thoughts.");
                setTimeout(() => {
                    setState('pitchPhase', 'done');
                    navigate('coaching');
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error getting VC response:', error);
        addMessage('vc', "Sorry, I lost my train of thought. Could you repeat that?");
    }

    setLoading(false);
}

async function getVCQuestion() {
    setLoading(true);
    try {
        const allSlideContext = state.slides.map((s, i) =>
            `Slide ${i + 1}: ${s.text}`
        ).join('\n\n');

        const { response, scores } = await getVCResponse(
            '[The founder has finished presenting and is ready for Q&A]',
            state.selectedPersona,
            allSlideContext,
            state.conversationHistory,
            'qa'
        );

        if (scores) state.turnScores.push(scores);
        addMessage('vc', response);

        if (state.voiceEnabled) {
            await speakText(response, state.selectedPersona.voiceId);
        }
    } catch (error) {
        console.error('Error getting VC question:', error);
    }
    setLoading(false);
}

function addMessage(role, content) {
    state.conversationHistory.push({ role, content, slide: state.currentSlideIndex });

    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    // Remove intro if present
    const intro = messagesDiv.querySelector('.chat-intro');
    if (intro) intro.remove();

    const persona = state.selectedPersona;
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role}`;
    msgEl.innerHTML = `
        ${role === 'vc' ? `<div class="msg-avatar"><img src="${getPersonaAvatar(persona)}" /></div>` : ''}
        <div class="msg-bubble ${role}" ${role === 'vc' ? `style="border-color: ${persona.color}"` : ''}>
            <p>${content}</p>
        </div>
    `;

    // Animate in
    msgEl.style.opacity = '0';
    msgEl.style.transform = 'translateY(10px)';
    messagesDiv.appendChild(msgEl);
    requestAnimationFrame(() => {
        msgEl.style.transition = 'all 0.3s ease';
        msgEl.style.opacity = '1';
        msgEl.style.transform = 'translateY(0)';
    });

    scrollToBottom();
}

function setLoading(loading) {
    const indicator = document.getElementById('loadingIndicator');
    const micBtn = document.getElementById('micBtn');
    const voiceSection = document.querySelector('.voice-input-section');

    if (indicator) indicator.classList.toggle('hidden', !loading);
    if (micBtn) micBtn.disabled = loading;
    if (voiceSection) voiceSection.classList.toggle('disabled', loading);
}

function scrollToBottom() {
    const messagesDiv = document.getElementById('chatMessages');
    if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}
