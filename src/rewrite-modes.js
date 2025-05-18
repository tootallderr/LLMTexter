/**
 * Smart Text Rewriter - Rewrite Modes
 * 
 * This module contains all the predefined rewrite modes for the Smart Text Rewriter script.
 * You can add or modify modes here.
 */

const REWRITE_MODES = {
    trump: {
        name: '🧑‍💼 Donald Trump',
        description: 'Bold, self-assured, uses superlatives, simple language, often repeats phrases for emphasis, adds humor with exaggeration',
        prompt: 'Rewrite the following text as if Donald Trump was saying it. Be bold, self-assured, use superlatives, simple language, often repeat phrases for emphasis, and add humor with exaggeration:'
    },
    theoVon: {
        name: '🎤 Theo Von',
        description: 'Southern charm, quirky analogies, offbeat humor, conversational, uses unexpected metaphors',
        prompt: 'Rewrite the following text with Theo Von\'s style. Use Southern charm, quirky analogies, offbeat humor, conversational tone, and unexpected metaphors:'
    },
    joeyDiaz: {
        name: '🔥 Joey Diaz',
        description: 'Raw, energetic, uses strong language, streetwise humor, direct and unfiltered, often includes personal anecdotes',
        prompt: 'Rewrite the following text in Joey Diaz\'s style. Be raw, energetic, use strong language, streetwise humor, direct and unfiltered, and include personal anecdotes where appropriate:'
    },
    academic: {
        name: '📚 Academic',
        description: 'Clean, professional, formal tone, precise vocabulary, well-structured sentences',
        prompt: 'Rewrite the following text in an academic style. Use clean, professional, formal tone, precise vocabulary, and well-structured sentences:'
    },
    casual: {
        name: '😎 Casual Millennial',
        description: 'Relaxed, uses slang and emojis, conversational, friendly, pop culture references',
        prompt: 'Rewrite the following text in a casual millennial style. Be relaxed, use slang and emojis, conversational, friendly, and include pop culture references:'
    },
    flirty: {
        name: '❤️ Guy looking for a girlfriend',
        description: 'Flirty, lighthearted, sincere, a bit self-deprecating, playful compliments',
        prompt: 'Rewrite the following text as if it\'s written by someone looking for a girlfriend. Make it flirty, lighthearted, sincere, a bit self-deprecating, with playful compliments:'
    },
    explicit: {
        name: '🌶️ Adult / Explicit',
        description: 'Mature themes, direct, uses explicit language, not suitable for all audiences',
        prompt: 'Rewrite the following text in an explicit, adult style. Include mature themes, be direct, use explicit language (note: not suitable for all audiences):'
    },
    factCheck: {
        name: '🕵️ Fact Check',
        description: 'Objective, cites sources, corrects errors, neutral and informative',
        prompt: 'Fact check the following text. Be objective, cite sources where possible, correct errors, and maintain a neutral and informative tone:'
    },
    mockOpponent: {
        name: '🤡 Make Opponent\'s Point Look Silly',
        description: 'Sarcastic, uses irony, highlights flaws humorously, playful ridicule',
        prompt: 'Rewrite the following text to make the opponent\'s point look silly. Be sarcastic, use irony, highlight flaws humorously, and include playful ridicule:'
    },
    strongerArgument: {
        name: '🌟 Overshadow with a Stronger Argument',
        description: 'Confident, assertive, presents superior logic, persuasive tone',
        prompt: 'Rewrite the following text to overshadow with a stronger argument. Be confident, assertive, present superior logic, and use a persuasive tone:'
    },
    diplomatic: {
        name: '🤝 Diplomatic / Neutral Tone',
        description: 'Balanced, non-confrontational, seeks common ground, respectful',
        prompt: 'Rewrite the following text in a diplomatic, neutral tone. Be balanced, non-confrontational, seek common ground, and maintain a respectful tone:'
    },
    creative: {
        name: '🧑‍🎨 Creative / Playful Rewrite',
        description: 'Imaginative, uses wordplay, whimsical, fun and engaging',
        prompt: 'Rewrite the following text in a creative, playful way. Be imaginative, use wordplay, be whimsical, and make it fun and engaging:'
    },
    kids: {
        name: '🧑‍🏫 Simplify for Kids',
        description: 'Simple words, short sentences, clear explanations, friendly tone',
        prompt: 'Rewrite the following text for children. Use simple words, short sentences, clear explanations, and a friendly tone:'
    },
    technical: {
        name: '🧑‍🔬 Technical / Jargon-heavy',
        description: 'Uses domain-specific terminology, detailed, assumes expert audience',
        prompt: 'Rewrite the following text in a technical, jargon-heavy style. Use domain-specific terminology, be detailed, and assume an expert audience:'
    },
    sarcastic: {
        name: '🧑‍🎤 Sarcastic / Satirical',
        description: 'Mocking, uses irony and exaggeration, witty, exposes absurdities',
        prompt: 'Rewrite the following text in a sarcastic, satirical style. Be mocking, use irony and exaggeration, be witty, and expose absurdities:'
    },
    // Custom modes will be added dynamically
};

// Export the modes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = REWRITE_MODES;
}
