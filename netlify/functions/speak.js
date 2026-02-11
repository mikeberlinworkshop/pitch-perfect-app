// ============================================
// ELEVENLABS TTS FUNCTION
// Converts text to speech
// ============================================

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { text, voiceId } = JSON.parse(event.body);

        if (!text) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Text required' }) };
        }

        const voice = voiceId || 'ErXwobaYiN019PkySvjV';

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API error:', response.status, errorText);
            return { statusCode: response.status, headers, body: JSON.stringify({ error: 'ElevenLabs API error', details: errorText }) };
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        return { statusCode: 200, headers, body: JSON.stringify({ audio: base64Audio }) };

    } catch (error) {
        console.error('Function error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
    }
};
