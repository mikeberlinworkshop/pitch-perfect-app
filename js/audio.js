// ============================================
// AUDIO: TTS, SPEECH RECOGNITION, VISUALIZER
// ============================================

import { state, setState } from './state.js';
import { generateSpeech } from './api.js';
import { DEFAULT_VOICE_ID } from './config.js';

let recognition = null;
let currentAudio = null;
let onSpeechResult = null;
let onRecordingEnd = null;
let accumulatedTranscript = '';

// ============================================
// SPEECH RECOGNITION
// ============================================

export function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;  // Keep listening until manually stopped or long silence
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Accumulate final transcripts
        if (finalTranscript) {
            accumulatedTranscript += (accumulatedTranscript ? ' ' : '') + finalTranscript;
        }

        // Update interim display with accumulated + current interim
        const interimEl = document.getElementById('interimTranscript');
        if (interimEl) {
            interimEl.textContent = accumulatedTranscript + (interimTranscript ? ' ' + interimTranscript : '');
        }

        // Call result callback with current state
        if (onSpeechResult) {
            onSpeechResult(accumulatedTranscript + (interimTranscript ? ' ' + interimTranscript : ''));
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Don't reset on no-speech error, just let it end naturally
        if (event.error !== 'no-speech') {
            setState('isRecording', false);
        }
    };

    recognition.onend = () => {
        setState('isRecording', false);

        // Update mic button
        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.classList.remove('recording');
        }

        // Auto-send if we have accumulated transcript
        if (accumulatedTranscript.trim() && onRecordingEnd) {
            onRecordingEnd(accumulatedTranscript.trim());
        }

        accumulatedTranscript = '';
    };
}

/**
 * Toggle recording
 * @param {Function} onResult - Called with transcript as user speaks (interim updates)
 * @param {Function} onEnd - Called with final transcript when recording ends (for auto-send)
 */
export function toggleRecording(onResult, onEnd = null) {
    if (!recognition) {
        console.warn('Speech recognition not available');
        return;
    }

    if (state.isRecording) {
        recognition.stop();
        setState('isRecording', false);
    } else {
        accumulatedTranscript = '';
        onSpeechResult = onResult;
        onRecordingEnd = onEnd;
        recognition.start();
        setState('isRecording', true);

        // Update mic button visual
        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.classList.add('recording');
            const status = document.createElement('span');
            status.className = 'mic-status';
            status.textContent = '●';
            micBtn.appendChild(status);
        }
    }
}

// ============================================
// TEXT-TO-SPEECH
// ============================================

/**
 * Speak text using ElevenLabs TTS
 */
export async function speakText(text, voiceId) {
    if (!state.voiceEnabled) return;

    try {
        setState('isAudioPlaying', true);
        startVisualizer();

        const base64Audio = await generateSpeech(text, voiceId || DEFAULT_VOICE_ID);
        const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise((resolve) => {
            currentAudio = new Audio(audioUrl);
            currentAudio.onended = () => {
                setState('isAudioPlaying', false);
                stopVisualizer();
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            currentAudio.onerror = () => {
                setState('isAudioPlaying', false);
                stopVisualizer();
                resolve();
            };
            currentAudio.play().catch(() => {
                setState('isAudioPlaying', false);
                stopVisualizer();
                resolve();
            });
        });
    } catch (error) {
        console.error('TTS error:', error);
        setState('isAudioPlaying', false);
        stopVisualizer();
    }
}

/**
 * Stop any playing audio
 */
export function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    setState('isAudioPlaying', false);
    stopVisualizer();
}

// ============================================
// AVATAR SPEAKING ANIMATION
// ============================================

function startVisualizer() {
    const avatarContainer = document.getElementById('vcAvatarContainer');
    if (avatarContainer) {
        avatarContainer.classList.add('speaking');
    }
}

function stopVisualizer() {
    const avatarContainer = document.getElementById('vcAvatarContainer');
    if (avatarContainer) {
        avatarContainer.classList.remove('speaking');
    }
}

// ============================================
// HELPERS
// ============================================

function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
}
