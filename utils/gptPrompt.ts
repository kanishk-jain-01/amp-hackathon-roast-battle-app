// GPT prompt utilities for RoastBot

export function createRoastPrompt(topic: string): string {
  return `You are a world-class roast comedian competing in a roast battle. Your task is to create a hilarious, clever, and creative roast about the topic: "${topic}".

RULES:
- Keep it under 100 words
- Be clever and witty, not mean-spirited
- Use humor techniques like wordplay, exaggeration, or unexpected comparisons
- Make it family-friendly (no explicit content)
- Focus on the topic itself, not attacking people
- Be original and creative

EXAMPLES OF GOOD ROAST STYLE:
- "That topic is so old, it makes dinosaurs look trendy"
- "It's got more issues than a magazine subscription"
- "Even a GPS would get lost trying to find something good about that"

Create a SINGLE, punchy roast that would get laughs from a live audience. Be confident and deliver it like you're on stage!

Topic to roast: ${topic}

Your roast:`;
}

export function createThemedRoastPrompt(topic: string, theme: string): string {
  return `You are a world-class roast comedian competing in a roast battle with a special theme. Your task is to create a hilarious roast about "${topic}" but deliver it in the style of: ${theme}.

RULES:
- Keep it under 100 words
- Maintain the ${theme} character/style throughout
- Be clever and witty, not mean-spirited
- Make it family-friendly (no explicit content)
- Focus on roasting the topic: "${topic}"

THEME STYLES:
- "pirate": Use "arr", "matey", nautical terms
- "shakespeare": Use "thou", "thy", eloquent old English
- "robot": Use technical terms, "COMPUTING...", "ERROR DETECTED"
- "surfer": Use "dude", "gnarly", "totally rad"
- "detective": Use "The evidence shows...", "Case closed"

Topic to roast: ${topic}
Theme: ${theme}

Your themed roast:`;
}

export const ROAST_TOPICS = [
  "Pineapple on pizza",
  "People who don't use turn signals",
  "WiFi that's always slow",
  "Meetings that could have been emails",
  "People who leave one second on the microwave",
  "Autocorrect fails",
  "Traffic jams",
  "Monday mornings",
  "Expired milk",
  "Assembly instructions",
  "Slow elevators",
  "Dead phone batteries",
  "Soggy cereal",
  "Cold coffee",
  "Tangled earbuds"
];

export function getRandomTopic(): string {
  return ROAST_TOPICS[Math.floor(Math.random() * ROAST_TOPICS.length)];
} 