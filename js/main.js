// ============================================
// MAIN APPLICATION ENTRY
// ============================================

import { state, setState, resetAll } from './state.js';
import { setupSpeechRecognition } from './audio.js';

import { initUpload, renderUpload } from './ui/upload.js';
import { initPitch, renderPitch } from './ui/pitch.js';
import { initCoaching, renderCoaching } from './ui/coaching.js';
import { initResults, renderResults } from './ui/results.js';

// ============================================
// NAVIGATION
// ============================================

const screens = {
    upload: renderUpload,
    pitch: renderPitch,
    coaching: renderCoaching,
    results: renderResults
};

function navigate(screenName) {
    if (!screens[screenName]) {
        console.error(`Unknown screen: ${screenName}`);
        return;
    }

    setState('currentScreen', screenName);

    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Show target
    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) screen.classList.add('active');

    // Home button visibility
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.style.display = screenName === 'upload' ? 'none' : 'flex';
    }

    // Render
    screens[screenName]();

    // Refresh icons
    if (window.lucide) lucide.createIcons();
    window.scrollTo(0, 0);
}

function goHome() {
    resetAll();
    navigate('upload');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Pitch Perfect initializing...');

    try {
        setupSpeechRecognition();

        initUpload(navigate);
        initPitch(navigate);
        initCoaching(navigate);
        initResults(navigate);

        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) homeBtn.addEventListener('click', goHome);

        window.app = { navigate, goHome };

        navigate('upload');
        console.log('Pitch Perfect ready!');
    } catch (error) {
        console.error('Init error:', error);
    }
});
