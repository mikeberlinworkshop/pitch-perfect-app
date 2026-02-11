// ============================================
// AUDIO: TTS, SPEECH RECOGNITION, VISUALIZER
// ============================================

import { state, setState } from './state.js';
import { generateSpeech } from './api.js';
import { DEFAULT_VOICE_ID } from './config.js';

let recognition = null;
let currentAudio = null;
let onSpeechResult = null;

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
    recognition.continuous = false;
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

        // Update interim display
        const interimEl = document.getElementById('interimTranscript');
        if (interimEl) interimEl.textContent = interimTranscript;

        if (finalTranscript && onSpeechResult) {
            onSpeechResult(finalTranscript);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setState('isRecording', false);
    };

    recognition.onend = () => {
        setState('isRecording', false);
        // Update mic button
        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.querySelector('.mic-status')?.remove();
        }
    };
}

/**
 * Toggle recording
 */
export function toggleRecording(callback) {
    if (!recognition) {
        console.warn('Speech recognition not available');
        return;
    }

    if (state.isRecording) {
        recognition.stop();
        setState('isRecording', false);
    } else {
        onSpeechResult = callback;
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
// AUDIO VISUALIZER
// ============================================

let visualizerInterval = null;

function startVisualizer() {
    const bars = document.querySelectorAll('.visualizer-bar');
    if (bars.length === 0) return;

    visualizerInterval = setInterval(() => {
        bars.forEach(bar => {
            const height = Math.random() * 100;
            bar.style.height = `${Math.max(10, height)}%`;
        });
    }, 100);
}

function stopVisualizer() {
    if (visualizerInterval) {
        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }
    document.querySelectorAll('.visualizer-bar').forEach(bar => {
        bar.style.height = '10%';
    });
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
