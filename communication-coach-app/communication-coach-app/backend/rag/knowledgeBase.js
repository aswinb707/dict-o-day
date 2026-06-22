// A small local "knowledge base" of communication-coaching rubrics.
// This is the retrieval corpus for the RAG pipeline: instead of sending the
// raw transcript to Grok with no grounding, we first retrieve the rubric
// chunks most relevant to the question + answer, and inject them into the
// prompt as context. No embedding API is required — see rag/retriever.js
// for the TF-IDF + cosine-similarity retrieval used here.

export const knowledgeBase = [
  {
    id: "articulation-rubric",
    title: "Articulation Rubric",
    tags: ["articulation", "pronunciation"],
    text: "Strong articulation means each word is pronounced distinctly enough that a listener (or speech-to-text engine) does not need to guess. Signs of weak articulation include mumbled endings, dropped syllables, run-on words without clear boundaries, and frequent self-correction mid-word. Strong articulation shows consistent pacing within words and clear consonant sounds, especially at the start and end of sentences.",
  },
  {
    id: "filler-words-rubric",
    title: "Filler Word Rubric",
    tags: ["fillers", "hesitation"],
    text: "Filler words such as um, uh, like, you know, basically, and actually are verbal placeholders used while thinking. Occasional fillers (one to two per hundred words) are natural and should not be penalized heavily. Frequent fillers (more than five per hundred words) disrupt flow and signal under-preparation or nervousness. Coaches should encourage a brief silent pause instead of a filler word.",
  },
  {
    id: "clarity-coherence-rubric",
    title: "Clarity and Coherence Rubric",
    tags: ["clarity", "coherence", "structure"],
    text: "A clear, coherent answer directly addresses the question asked, follows a logical order such as situation then action then result, or point then explanation then example, and avoids contradicting itself. High clarity answers stay on topic, define any jargon used, and reach a clear conclusion. Low clarity answers wander, repeat themselves without adding new information, or never actually answer the question.",
  },
  {
    id: "fluency-pace-rubric",
    title: "Fluency and Pace Rubric",
    tags: ["fluency", "pace", "speed"],
    text: "Conversational speaking pace for clear communication is typically one hundred ten to one hundred sixty words per minute. Speaking much faster than this can overwhelm listeners and reduce comprehension. Speaking much slower than ninety words per minute, with long unfilled pauses, can signal hesitation or low confidence. Fluency also considers whether ideas connect smoothly without abrupt restarts.",
  },
  {
    id: "intro-question-guidance",
    title: "Evaluating Self-Introduction Answers",
    tags: ["intro"],
    text: "A strong self-introduction is concise, covers who the person is and what they do or are currently working on, and ends with something that invites follow-up. It should avoid simply reciting a resume line by line and should sound natural rather than memorized word for word.",
  },
  {
    id: "behavioral-question-guidance",
    title: "Evaluating Behavioral and Challenge Answers",
    tags: ["behavioral"],
    text: "Strong answers to challenge or behavioral questions describe a specific situation, the action the speaker took, and the result or lesson learned, similar to the Situation, Task, Action, Result method. Vague answers that describe a challenge only in general terms without a concrete example score lower on clarity.",
  },
  {
    id: "explain-question-guidance",
    title: "Evaluating Explanation Answers",
    tags: ["explain"],
    text: "When asked to explain a concept or process, a strong answer breaks it into clear steps or components, uses an analogy or example for a non-expert listener, and avoids unnecessary jargon. A strong explanation would let the listener repeat the process back after hearing it once.",
  },
  {
    id: "opinion-question-guidance",
    title: "Evaluating Opinion Answers",
    tags: ["opinion"],
    text: "A strong opinion answer states a clear position early, gives at least one concrete reason or example supporting it, and optionally acknowledges a counterpoint. Weak opinion answers stay neutral throughout and never commit to a position, or list reasons without ever stating a clear stance.",
  },
  {
    id: "scenario-question-guidance",
    title: "Evaluating Scenario and Hypothetical Answers",
    tags: ["scenario"],
    text: "Strong scenario answers address the specific people and stakes described in the hypothetical, propose a concrete action or message, and consider tone, for example being direct but respectful when giving feedback. Weak answers give generic advice that could apply to any situation at all.",
  },
  {
    id: "general-communication-tips",
    title: "General Spoken Communication Best Practices",
    tags: ["general"],
    text: "Effective spoken communication balances confidence with clarity: speakers should vary sentence length, use concrete examples over abstractions, and check that their answer actually responds to what was asked rather than a related but different topic.",
  },
];
