// ============================================
// RESULTS / SCORECARD SCREEN
// ============================================

import { state, resetPitch, resetAll } from '../state.js';
import { getPersonaAvatar } from '../personas.js';
import { DIMENSION_LABELS, getScoreColor, getScoreLabel } from '../config.js';

let navigate = null;

export function initResults(nav) {
    navigate = nav;
}

export function renderResults() {
    const screen = document.getElementById('screen-results');
    if (!screen) return;

    const results = state.results;
    const persona = state.selectedPersona;

    if (!results) {
        screen.innerHTML = `<div class="results-container"><p>No results available.</p></div>`;
        return;
    }

    const biz = results.business_quality;
    const pitch = results.pitch_delivery;

    screen.innerHTML = `
        <div class="results-container">
            <div class="results-header">
                <h1>Your Scorecard</h1>
                <p class="results-subtitle">Feedback from ${persona.name} — Attempt #${state.currentAttempt}</p>
            </div>

            <div class="dual-scorecard">
                <!-- Business Quality -->
                <div class="scorecard-panel">
                    <div class="scorecard-header biz">
                        <span class="scorecard-emoji">🏢</span>
                        <h2>Business Quality</h2>
                        <p class="scorecard-q">"Would I invest?"</p>
                    </div>
                    <div class="score-hero" style="color: ${getScoreColor(biz.overall_score)}">
                        <span class="score-number">${biz.overall_score}</span>
                        <span class="score-label">${biz.overall_label || getScoreLabel(biz.overall_score)}</span>
                    </div>
                    <p class="score-summary">${biz.summary}</p>
                    <div class="dimension-bars">
                        ${renderDimensionBar('market_opportunity', biz.market_opportunity)}
                        ${renderDimensionBar('defensibility', biz.defensibility)}
                        ${renderDimensionBar('business_model', biz.business_model)}
                        ${renderDimensionBar('traction', biz.traction)}
                        ${renderDimensionBar('team_fit', biz.team_fit)}
                    </div>
                </div>

                <!-- Pitch Delivery -->
                <div class="scorecard-panel">
                    <div class="scorecard-header delivery">
                        <span class="scorecard-emoji">🎤</span>
                        <h2>Pitch Delivery</h2>
                        <p class="scorecard-q">"Did you sell it?"</p>
                    </div>
                    <div class="score-hero" style="color: ${getScoreColor(pitch.overall_score)}">
                        <span class="score-number">${pitch.overall_score}</span>
                        <span class="score-label">${pitch.overall_label || getScoreLabel(pitch.overall_score)}</span>
                    </div>
                    <p class="score-summary">${pitch.summary}</p>
                    <div class="dimension-bars">
                        ${renderDimensionBar('clarity', pitch.clarity)}
                        ${renderDimensionBar('storytelling', pitch.storytelling)}
                        ${renderDimensionBar('objection_handling', pitch.objection_handling)}
                        ${renderDimensionBar('presence', pitch.presence)}
                        ${renderDimensionBar('coachability', pitch.coachability)}
                    </div>
                </div>
            </div>

            <!-- Verdict -->
            <div class="verdict-section">
                <div class="verdict-avatar" style="border-color: ${persona.color}">
                    <img src="${getPersonaAvatar(persona)}" />
                </div>
                <div class="verdict-content">
                    <h3>${persona.name}'s Verdict</h3>
                    <p>${results.verdict}</p>
                </div>
            </div>

            <!-- Strengths & Improvements -->
            <div class="results-feedback">
                <div class="feedback-col">
                    <h3><i data-lucide="trending-up"></i> Strengths</h3>
                    <ul>${results.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div class="feedback-col">
                    <h3><i data-lucide="alert-circle"></i> To Improve</h3>
                    <ul>${results.improvements.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
            </div>

            <div class="results-actions">
                <button class="btn btn-secondary" id="retryBtn">
                    <i data-lucide="rotate-ccw"></i> Pitch Again
                </button>
                <button class="btn btn-secondary" id="coachingBtn">
                    <i data-lucide="book-open"></i> View Coaching
                </button>
                <button class="btn btn-primary" id="newDeckBtn">
                    <i data-lucide="upload"></i> New Deck
                </button>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Events
    document.getElementById('retryBtn')?.addEventListener('click', () => {
        state.currentAttempt++;
        resetPitch();
        navigate('pitch');
    });

    document.getElementById('coachingBtn')?.addEventListener('click', () => {
        navigate('coaching');
    });

    document.getElementById('newDeckBtn')?.addEventListener('click', () => {
        resetAll();
        navigate('upload');
    });
}

function renderDimensionBar(key, score) {
    const label = DIMENSION_LABELS[key] || key;
    const color = getScoreColor(score);
    return `
        <div class="dim-bar">
            <div class="dim-label">
                <span>${label}</span>
                <span class="dim-score" style="color: ${color}">${score}</span>
            </div>
            <div class="dim-track">
                <div class="dim-fill" style="width: ${score}%; background: ${color}"></div>
            </div>
        </div>
    `;
}
