// ============================================
// API CALLS
// ============================================

import { API_ENDPOINTS } from './config.js';
import { state } from './state.js';

/**
 * Call Claude API via Netlify function
 */
export async function callClaude(messages, systemPrompt) {
    const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, system: systemPrompt })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error?.message || error.error || 'API call failed');
    }

    const data = await response.json();
    return data.content[0].text;
}

/**
 * Generate speech using ElevenLabs
 */
export async function generateSpeech(text, voiceId) {
    const response = await fetch(API_ENDPOINTS.speak, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'TTS call failed');
    }

    const data = await response.json();
    return data.audio;
}

/**
 * Get VC response during pitch
 * Sends slide content + founder message, gets in-character response with scores
 */
export async function getVCResponse(userMessage, persona, slideContext, conversationHistory, pitchPhase, slideWordCount = 0) {
    const messages = conversationHistory.map(msg => ({
        role: msg.role === 'vc' ? 'assistant' : 'user',
        content: msg.content
    }));
    messages.push({ role: 'user', content: userMessage });

    let phaseInstructions = '';
    if (pitchPhase === 'qa') {
        phaseInstructions = `\n\nYou are now in the Q&A portion after the presentation. Ask deeper follow-up questions based on everything you've seen in the deck. Dig into weaknesses you noticed. This is your chance to really probe.`;
    } else if (pitchPhase === 'feedback') {
        phaseInstructions = `\n\nThe founder has paused to get coaching feedback. Break character temporarily and provide direct, actionable coaching. Be constructive but honest. Focus on 2-3 specific things they could improve right now. Format as bullet points. After they resume, you'll go back to being in character.`;
    } else {
        phaseInstructions = `\n\nThe founder is currently presenting their pitch deck. ${slideContext ? `They are showing a slide with this content:\n---\n${slideContext}\n---\nAsk questions relevant to this specific slide content and what they're saying about it.` : ''}`;
    }

    // Add industry context for Industry Expert persona
    const industryContext = persona.id === 'industry-expert' && state.selectedIndustry
        ? `\n\nIMPORTANT: This startup is in the ${state.selectedIndustry} vertical. You are an expert investor who specializes in ${state.selectedIndustry}. Draw on deep domain knowledge of this specific industry — regulations, distribution channels, key players, technical challenges, and common failure modes. Ask questions that only a true ${state.selectedIndustry} specialist would know to ask.`
        : '';

    // Control interruption aggressiveness based on how much founder has said
    let interruptionGuidance = '';
    if (pitchPhase === 'presenting') {
        if (slideWordCount < 50) {
            interruptionGuidance = `\n\nINTERRUPTION GUIDANCE: The founder has only said ~${slideWordCount} words on this slide. Let them talk more. Give a brief encouraging response like "Go on..." or "Okay, tell me more" or just nod along with "Mm-hmm, interesting." Do NOT ask probing questions yet — let them finish their thought first.`;
        } else if (slideWordCount < 100) {
            interruptionGuidance = `\n\nINTERRUPTION GUIDANCE: The founder has said ~${slideWordCount} words on this slide. You can ask ONE clarifying question if something genuinely doesn't add up, but otherwise let them continue presenting.`;
        } else {
            interruptionGuidance = `\n\nINTERRUPTION GUIDANCE: The founder has now said ~${slideWordCount} words on this slide — they've had time to explain. Now you can push back, ask hard questions, or challenge claims that don't hold up.`;
        }
    }

    const systemPrompt = persona.systemPrompt + industryContext + phaseInstructions + interruptionGuidance +
        `\n\nIMPORTANT: This is attempt ${conversationHistory.length === 0 ? '#1' : 'ongoing'}. Stay in character at all times.`;

    const response = await callClaude(messages, systemPrompt);

    // Parse scores
    const scoreMatch = response.match(/\[SCORES: ([^\]]+)\]/);
    const interruptMatch = response.match(/\[SHOULD_INTERRUPT: (true|false)\]/);

    let cleanResponse = response;
    let scores = null;
    let shouldInterrupt = false;

    if (scoreMatch) {
        cleanResponse = cleanResponse.replace(scoreMatch[0], '').trim();
        scores = {};
        scoreMatch[1].split(' ').forEach(pair => {
            const [key, val] = pair.split('=');
            scores[key] = parseInt(val);
        });
    }

    if (interruptMatch) {
        cleanResponse = cleanResponse.replace(interruptMatch[0], '').trim();
        shouldInterrupt = interruptMatch[1] === 'true';
    }

    return { response: cleanResponse, scores, shouldInterrupt };
}

/**
 * Check if VC should interrupt on current slide (pre-check before founder finishes)
 */
export async function checkForInterruption(persona, slideContent, founderWords) {
    const systemPrompt = `You are evaluating whether to interrupt a founder mid-pitch. 
Based on your investment style and priorities, should you interrupt right now?

Your style: ${persona.interruptionStyle}

The current slide says: "${slideContent}"
The founder is saying: "${founderWords}"

Respond ONLY with a JSON object:
{"interrupt": true/false, "question": "Your interruption question if true, empty string if false"}

Only interrupt if there's something genuinely worth jumping in on. Don't interrupt on every slide.`;

    try {
        const response = await callClaude(
            [{ role: 'user', content: 'Should you interrupt?' }],
            systemPrompt
        );
        const parsed = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{"interrupt":false}');
        return parsed;
    } catch {
        return { interrupt: false, question: '' };
    }
}

/**
 * Generate coaching and suggested answers
 */
export async function generateCoaching(persona, slides, conversationHistory) {
    const transcript = conversationHistory.map(m =>
        `${m.role === 'vc' ? 'VC' : 'FOUNDER'}: ${m.content}`
    ).join('\n');

    const slidesSummary = slides.map((s, i) =>
        `Slide ${i + 1}: ${s.text?.substring(0, 200) || '[image only]'}`
    ).join('\n');

    const systemPrompt = `You are a pitch coaching expert analyzing a founder's pitch to a VC.

The VC's style: ${persona.name} — ${persona.description}

The deck had ${slides.length} slides:
${slidesSummary}

Here's the full transcript:
${transcript}

Provide coaching in this exact JSON format:
{
    "overall_feedback": "2-3 sentences of high-level feedback",
    "tough_moments": [
        {
            "vc_question": "The exact question the VC asked",
            "founder_answer": "What the founder actually said (summarized)",
            "what_good_looks_like": "How a strong founder would answer this specific question, using information from their own deck",
            "suggested_followup": "A proactive follow-up the founder could add to strengthen their position"
        }
    ],
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}

Focus on the 3-5 most important moments. Make "what_good_looks_like" specific to THIS startup — reference their actual slides and data.`;

    const response = await callClaude(
        [{ role: 'user', content: 'Analyze this pitch and provide coaching.' }],
        systemPrompt
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse coaching response');
    return JSON.parse(jsonMatch[0]);
}

/**
 * Generate final dual-scorecard results
 */
export async function generateResults(persona, slides, conversationHistory, attempt) {
    const transcript = conversationHistory.map(m =>
        `${m.role === 'vc' ? 'VC' : 'FOUNDER'}: ${m.content}`
    ).join('\n');

    const slidesSummary = slides.map((s, i) =>
        `Slide ${i + 1}: ${s.text?.substring(0, 200) || '[image only]'}`
    ).join('\n');

    const systemPrompt = `You are an expert evaluating a founder's pitch to a VC investor.

VC Style: ${persona.name} — ${persona.description}
This is attempt #${attempt}.

Deck (${slides.length} slides):
${slidesSummary}

Transcript:
${transcript}

Score the pitch on TWO separate dimensions. Return JSON:
{
    "business_quality": {
        "overall_score": 0-100,
        "overall_label": "Investor Ready" | "Almost There" | "Needs Work" | "Early Stage",
        "market_opportunity": 0-100,
        "defensibility": 0-100,
        "business_model": 0-100,
        "traction": 0-100,
        "team_fit": 0-100,
        "summary": "1-2 sentences on business quality"
    },
    "pitch_delivery": {
        "overall_score": 0-100,
        "overall_label": "Investor Ready" | "Almost There" | "Needs Work" | "Early Stage",
        "clarity": 0-100,
        "storytelling": 0-100,
        "objection_handling": 0-100,
        "presence": 0-100,
        "coachability": 0-100,
        "summary": "1-2 sentences on pitch delivery"
    },
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"],
    "verdict": "2-3 sentences — would this VC take the meeting? Why or why not?"
}`;

    const response = await callClaude(
        [{ role: 'user', content: 'Evaluate this pitch and provide scores.' }],
        systemPrompt
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse results');
    return JSON.parse(jsonMatch[0]);
}
