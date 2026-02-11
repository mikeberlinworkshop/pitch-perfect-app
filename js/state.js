// ============================================
// STATE MANAGEMENT
// ============================================

export const state = {
    currentScreen: 'upload',

    // Deck
    slides: [],              // Array of { imageDataUrl, text, pageNumber }
    deckFileName: null,

    // Persona
    selectedPersona: null,
    selectedIndustry: null,  // For Industry Expert persona

    // Pitch state
    currentSlideIndex: 0,
    pitchPhase: 'presenting', // 'presenting' | 'qa' | 'done'
    conversationHistory: [],  // Full conversation for current pitch
    slideConversations: [],   // Conversation grouped by slide
    currentSlideExchanges: 0,
    currentSlideWords: 0,     // Track words spoken on current slide
    qaExchanges: 0,

    // Scoring (accumulated from per-turn scores)
    turnScores: [],

    // Results
    results: null,
    coaching: null,

    // Attempts
    currentAttempt: 1,

    // Audio
    isAudioPlaying: false,
    isRecording: false,
    voiceEnabled: true,

    // VC intro
    vcIntroShown: false,

    // Live feedback
    feedbackExpanded: false,
    liveFeedback: '',
    currentSentiment: 'neutral'  // 'positive', 'neutral', 'skeptical'
};

const listeners = new Map();

export function subscribe(key, callback) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(callback);
    return () => listeners.get(key).delete(callback);
}

export function setState(key, value) {
    const oldValue = state[key];
    state[key] = value;
    if (listeners.has(key)) {
        listeners.get(key).forEach(cb => {
            try { cb(value, oldValue); } catch (e) { console.error(`State listener error [${key}]:`, e); }
        });
    }
}

export function resetPitch() {
    state.currentSlideIndex = 0;
    state.pitchPhase = 'presenting';
    state.conversationHistory = [];
    state.slideConversations = [];
    state.currentSlideExchanges = 0;
    state.currentSlideWords = 0;
    state.qaExchanges = 0;
    state.turnScores = [];
    state.results = null;
    state.coaching = null;
    state.vcIntroShown = false;
    state.feedbackExpanded = false;
    state.liveFeedback = '';
    state.currentSentiment = 'neutral';
}

export function resetAll() {
    resetPitch();
    state.slides = [];
    state.deckFileName = null;
    state.selectedPersona = null;
    state.selectedIndustry = null;
    state.currentAttempt = 1;
    state.isAudioPlaying = false;
    state.isRecording = false;
}

export function getCurrentSlide() {
    return state.slides[state.currentSlideIndex] || null;
}
