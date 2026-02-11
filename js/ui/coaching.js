// ============================================
// COACHING SCREEN
// ============================================

import { state, setState, resetPitch } from '../state.js';
import { generateCoaching, generateResults } from '../api.js';
import { getPersonaAvatar } from '../personas.js';

let navigate = null;

export function initCoaching(nav) {
    navigate = nav;
}

export async function renderCoaching() {
    const screen = document.getElementById('screen-coaching');
    if (!screen) return;

    const persona = state.selectedPersona;

    // Show loading state
    screen.innerHTML = `
        <div class="coaching-container">
            <div class="coaching-loading" id="coachingLoading">
                <div class="coaching-avatar" style="border-color: ${persona.color}">
                    <img src="${getPersonaAvatar(persona)}" alt="${persona.name}" />
                </div>
                <h2>${persona.name} is reviewing your pitch...</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <p class="loading-step" id="loadingStep">Analyzing your responses...</p>
            </div>
            <div class="coaching-content hidden" id="coachingContent"></div>
        </div>
    `;

    // Animate progress
    animateProgress();

    try {
        // Generate both coaching and results in parallel
        const [coaching, results] = await Promise.all([
            generateCoaching(persona, state.slides, state.conversationHistory),
            generateResults(persona, state.slides, state.conversationHistory, state.currentAttempt)
        ]);

        state.coaching = coaching;
        state.results = results;

        // Show coaching content
        renderCoachingContent(coaching, persona);
    } catch (error) {
        console.error('Error generating coaching:', error);
        document.getElementById('coachingLoading').innerHTML = `
            <h2>Error generating feedback</h2>
            <p>${error.message}</p>
            <button class="btn btn-primary" onclick="window.app.navigate('pitch')">Try Again</button>
        `;
    }
}

function renderCoachingContent(coaching, persona) {
    const loading = document.getElementById('coachingLoading');
    const content = document.getElementById('coachingContent');
    if (!loading || !content) return;

    loading.classList.add('hidden');
    content.classList.remove('hidden');

    content.innerHTML = `
        <div class="coaching-header">
            <div class="coaching-avatar-sm" style="border-color: ${persona.color}">
                <img src="${getPersonaAvatar(persona)}" />
            </div>
            <div>
                <h2>Feedback from ${persona.name}</h2>
                <p class="coaching-subtitle">Attempt #${state.currentAttempt}</p>
            </div>
        </div>

        <div class="coaching-overall">
            <p>${coaching.overall_feedback}</p>
        </div>

        <div class="coaching-sections">
            <div class="coaching-section strengths">
                <h3><i data-lucide="thumbs-up"></i> Strengths</h3>
                <ul>
                    ${coaching.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>

            <div class="coaching-section improvements">
                <h3><i data-lucide="target"></i> Areas to Improve</h3>
                <ul>
                    ${coaching.improvements.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        </div>

        <h3 class="section-title"><i data-lucide="message-square"></i> Key Moments — What Good Looks Like</h3>
        <div class="tough-moments">
            ${coaching.tough_moments.map((m, i) => `
                <div class="moment-card">
                    <div class="moment-header">
                        <span class="moment-number">${i + 1}</span>
                        <div class="moment-question">
                            <strong>VC asked:</strong> ${m.vc_question}
                        </div>
                    </div>
                    <div class="moment-body">
                        <div class="moment-yours">
                            <span class="moment-label">Your answer</span>
                            <p>${m.founder_answer}</p>
                        </div>
                        <div class="moment-good">
                            <span class="moment-label good">What good looks like</span>
                            <p>${m.what_good_looks_like}</p>
                        </div>
                        ${m.suggested_followup ? `
                            <div class="moment-followup">
                                <span class="moment-label followup">Suggested follow-up</span>
                                <p>${m.suggested_followup}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="coaching-actions">
            <button class="btn btn-secondary" id="tryAgainBtn">
                <i data-lucide="rotate-ccw"></i> Try Again
            </button>
            <button class="btn btn-primary" id="viewScoresBtn">
                <i data-lucide="bar-chart-3"></i> View Full Scorecard
            </button>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Event listeners
    document.getElementById('tryAgainBtn')?.addEventListener('click', () => {
        state.currentAttempt++;
        resetPitch();
        navigate('pitch');
    });

    document.getElementById('viewScoresBtn')?.addEventListener('click', () => {
        navigate('results');
    });
}

function animateProgress() {
    const fill = document.getElementById('progressFill');
    const step = document.getElementById('loadingStep');
    if (!fill || !step) return;

    const steps = [
        'Analyzing your responses...',
        'Evaluating business fundamentals...',
        'Assessing pitch delivery...',
        'Generating personalized coaching...'
    ];

    let current = 0;
    const interval = setInterval(() => {
        current++;
        if (current >= steps.length) {
            clearInterval(interval);
            return;
        }
        step.textContent = steps[current];
        fill.style.width = `${(current / steps.length) * 100}%`;
    }, 1500);
}
