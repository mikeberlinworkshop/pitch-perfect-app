// ============================================
// CONFIGURATION
// ============================================

// ElevenLabs Voice IDs for VC personas
export const VOICE_IDS = {
    'The Metrics Hawk': 'VR6AewLTigWG4xSOukaG',      // Arnold - authoritative male
    'The Market Skeptic': 'ErXwobaYiN019PkySvjV',     // Antoni - sharp male
    'The Warm-but-Tough': '21m00Tcm4TlvDq8ikWAM',     // Rachel - poised female
    'The Industry Expert': 'VR6AewLTigWG4xSOukaG',    // Arnold - knowledgeable male
};

export const DEFAULT_VOICE_ID = 'ErXwobaYiN019PkySvjV';

// API Endpoints (Netlify Functions)
export const API_ENDPOINTS = {
    chat: '/.netlify/functions/chat',
    speak: '/.netlify/functions/speak'
};

// Business Quality scoring dimensions
export const BUSINESS_DIMENSIONS = [
    'market_opportunity',
    'defensibility',
    'business_model',
    'traction',
    'team_fit'
];

// Pitch Delivery scoring dimensions
export const DELIVERY_DIMENSIONS = [
    'clarity',
    'storytelling',
    'objection_handling',
    'presence',
    'coachability'
];

// Labels for display
export const DIMENSION_LABELS = {
    market_opportunity: 'Market Opportunity',
    defensibility: 'Defensibility',
    business_model: 'Business Model',
    traction: 'Traction & Evidence',
    team_fit: 'Founder-Market Fit',
    clarity: 'Clarity',
    storytelling: 'Storytelling',
    objection_handling: 'Objection Handling',
    presence: 'Confidence & Presence',
    coachability: 'Coachability'
};

// Conversation limits per slide
export const MAX_EXCHANGES_PER_SLIDE = 4;
export const MAX_QA_EXCHANGES = 6;

// Score labels
export function getScoreLabel(score) {
    if (score >= 80) return 'Investor Ready';
    if (score >= 65) return 'Almost There';
    if (score >= 45) return 'Needs Work';
    return 'Early Stage';
}

export function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#f59e0b';
    if (score >= 45) return '#f97316';
    return '#ef4444';
}
