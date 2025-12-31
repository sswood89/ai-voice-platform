/**
 * Sample Scripts for Voice Cloning
 * Designed to cover diverse phonemes and speech patterns for optimal voice cloning
 */

export interface CloneScript {
  id: string;
  name: string;
  duration: string;
  description: string;
  text: string;
  category: 'general' | 'professional' | 'conversational';
}

export const CLONE_SCRIPTS: CloneScript[] = [
  {
    id: 'general-purpose',
    name: 'General Purpose',
    duration: '~60 seconds',
    description: 'Covers diverse phonemes and natural speech patterns. Best for all-around use.',
    category: 'general',
    text: `Hello, and welcome! Today I'd like to share some thoughts with you.

The weather outside is absolutely beautiful. The sun is shining brightly, and there's a gentle breeze that makes everything feel fresh and alive. I wonder if we should take a walk later?

Numbers are fascinating when you think about them. One, two, three, four, five. Ten, twenty, thirty, forty, fifty. One hundred, one thousand, one million!

Let me ask you something important: What brings you the most joy in life? Is it spending time with family? Perhaps traveling to new places? Or maybe it's the simple pleasure of a good book and a cup of tea.

Technology continues to evolve at an incredible pace. From smartphones to artificial intelligence, the world is changing faster than ever before. It's truly remarkable to witness.

Thank you so much for listening. I hope this message finds you well, and I look forward to speaking with you again soon!`,
  },
  {
    id: 'professional-business',
    name: 'Professional / Business',
    duration: '~90 seconds',
    description: 'Formal tone suitable for business personas, presentations, and professional contexts.',
    category: 'professional',
    text: `Good morning, and thank you for joining this presentation. My name is your AI assistant, and I'll be guiding you through today's discussion.

First, let's review the quarterly results. Our revenue increased by twelve percent compared to the previous quarter, reaching a total of four point seven million dollars. Customer satisfaction scores remain exceptionally high at ninety-three percent.

Moving forward, I'd like to address three key strategic initiatives. Number one: expanding our market presence in the Asia-Pacific region. Number two: investing in research and development for next-generation products. And number three: strengthening our partnerships with industry leaders.

The implementation timeline is as follows. Phase one begins in January and concludes in March. Phase two runs from April through July. The final phase extends from August to December, with a comprehensive review scheduled for the new year.

Do you have any questions about the metrics we've discussed? I'm happy to provide additional context or clarification on any of these points.

In conclusion, the outlook for the upcoming fiscal year is positive. Our team remains committed to delivering exceptional value to all stakeholders. Thank you for your attention, and please don't hesitate to reach out if you need further information.`,
  },
  {
    id: 'casual-conversational',
    name: 'Casual / Conversational',
    duration: '~60 seconds',
    description: 'Relaxed, friendly tone perfect for chat personas and casual interactions.',
    category: 'conversational',
    text: `Hey there! How's it going? I'm so glad we get to chat today!

So, I was thinking... have you ever tried making homemade pizza? It's actually way easier than you'd expect! You just need some flour, yeast, a bit of olive oil, and whatever toppings you're craving. My personal favorite? Pepperoni with extra cheese. Yum!

Oh man, speaking of food, I watched this amazing cooking show last night. The chef made this incredible chocolate soufflé that literally melted in your mouth. I was like, "Wow, I need to learn how to make that!"

What else is new? Oh yeah! I finally started that book everyone's been recommending. You know the one? It's really good so far. Can't wait to see how it ends!

Anyway, I should probably get going soon. But hey, it was really nice catching up with you! Let's do this again sometime, okay? Maybe we can grab coffee or something. Take care, and talk to you later! Bye!`,
  },
  {
    id: 'phonetic-comprehensive',
    name: 'Phonetic Coverage',
    duration: '~75 seconds',
    description: 'Scientifically designed to cover all English phonemes for maximum voice accuracy.',
    category: 'general',
    text: `Please listen carefully as I demonstrate various sounds in the English language.

The quick brown fox jumps over the lazy dog. She sells seashells by the seashore. Peter Piper picked a peck of pickled peppers.

Let's practice some specific sounds. The "th" sound: think, thought, through, three, fourth, fifth. The "sh" sound: ship, shadow, shower, fashion, emotion. The "ch" sound: church, chocolate, teacher, nature.

Now for some vowel sounds. The long "a" in day, play, and vacation. The short "i" in sit, trip, and kitten. The "oo" sound in moon, food, and beautiful.

Here are some challenging combinations. Strength, twelfth, rhythm, sixth. The entrepreneur analyzed the algorithm thoroughly.

Numbers and letters: A, B, C, D, E, F, G. One, two, three, four, five, six, seven, eight, nine, ten. Twenty-three, forty-five, sixty-seven, eighty-nine.

Finally, some expressions: Oh really? That's wonderful! I can't believe it! Are you serious? What a surprise! Absolutely fantastic!

This concludes our phonetic demonstration. Thank you for your patience.`,
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    duration: '~90 seconds',
    description: 'Narrative style with emotional range, perfect for audiobook or podcast personas.',
    category: 'general',
    text: `Once upon a time, in a small village nestled between rolling hills and a sparkling river, there lived a young inventor named Maya.

Maya had always been curious about how things worked. As a child, she would take apart clocks just to see the gears turn. Her workshop was filled with half-finished gadgets and sketches of impossible machines.

One stormy night, while thunder rumbled outside her window, Maya had a breakthrough. "That's it!" she exclaimed, jumping up from her workbench. Her eyes sparkled with excitement as she realized she had finally solved the puzzle that had haunted her for years.

But there was a problem. A big one. She needed a special crystal that could only be found in the Forgotten Mountains, a place no one had visited in generations. The journey would be dangerous. Some said it was impossible.

"I have to try," Maya whispered to herself, determination burning in her heart. She packed her bag, said goodbye to her beloved cat Whiskers, and stepped out into the rain.

The adventure had begun. Little did she know that this journey would change not only her life, but the fate of the entire kingdom.

To be continued...`,
  },
];

/**
 * Get all available clone scripts
 */
export function getCloneScripts(): CloneScript[] {
  return CLONE_SCRIPTS;
}

/**
 * Get a specific script by ID
 */
export function getCloneScript(id: string): CloneScript | undefined {
  return CLONE_SCRIPTS.find((script) => script.id === id);
}

/**
 * Get scripts by category
 */
export function getScriptsByCategory(category: CloneScript['category']): CloneScript[] {
  return CLONE_SCRIPTS.filter((script) => script.category === category);
}

/**
 * Get the recommended script for first-time users
 */
export function getRecommendedScript(): CloneScript {
  return CLONE_SCRIPTS[0]; // General Purpose
}
