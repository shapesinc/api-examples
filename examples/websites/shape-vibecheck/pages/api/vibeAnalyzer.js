const { OpenAI } = require("openai");

const shapesClient = new OpenAI({
  apiKey: process.env.SHAPES_API_KEY,
  baseURL: "https://api.shapes.inc/v1",
});

function calculateVibeScores(tweets) {
  const scores = {
    overallVibe: 0,
    emotionalIntensity: 0,
    thoughtComplexity: 0,
    socialEnergy: 0,
    creativityLevel: 0,
  };

  if (!tweets || tweets.length === 0) return scores;

  let totalWords = 0;
  let emojiCount = 0;
  let questionCount = 0;
  let exclamationCount = 0;
  let mentionCount = 0;
  let hashtagCount = 0;
  let retweetSum = 0;
  let sentenceCount = 0;
  let uniqueWords = new Set();
  let linkCount = 0;

  tweets.forEach((tweet) => {
    const text = tweet.text.toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    totalWords += words.length;

    emojiCount += (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu) || []).length;
    questionCount += (text.match(/\?/g) || []).length;
    exclamationCount += (text.match(/!/g) || []).length;
    mentionCount += (text.match(/@[a-zA-Z0-9_]+/g) || []).length;
    hashtagCount += (text.match(/#[a-zA-Z0-9_]+/g) || []).length;
    linkCount += (text.match(/https?:\/\/[^\s]+/g) || []).length;
    sentenceCount += (text.match(/[.!?]+/g) || []).length || 1;
    words.forEach((word) => uniqueWords.add(word.replace(/[^a-zA-Z0-9]/g, "")));
    retweetSum += parseInt(tweet.retweets || "0", 10);
  });

  const tweetCount = tweets.length;
  const avgWordsPerTweet = totalWords / tweetCount;
  const avgEmojisPerTweet = emojiCount / tweetCount;
  const avgQuestionsPerTweet = questionCount / tweetCount;
  const avgExclamationsPerTweet = exclamationCount / tweetCount;
  const avgMentionsPerTweet = mentionCount / tweetCount;
  const avgHashtagsPerTweet = hashtagCount / tweetCount;
  const avgRetweetsPerTweet = retweetSum / tweetCount;
  const avgSentencesPerTweet = sentenceCount / tweetCount;
  const avgLinksPerTweet = linkCount / tweetCount;
  const uniqueWordRatio = uniqueWords.size / totalWords || 0;

  scores.emotionalIntensity = Math.min(
    100,
    (avgEmojisPerTweet * 15 + avgExclamationsPerTweet * 25 + avgQuestionsPerTweet * 15) * 1.5
  );
  scores.thoughtComplexity = Math.min(
    100,
    (avgWordsPerTweet * 5 + uniqueWordRatio * 35 + avgSentencesPerTweet * 15 + avgQuestionsPerTweet * 10) * 1.2
  );
  scores.socialEnergy = Math.min(
    100,
    (avgMentionsPerTweet * 20 + avgHashtagsPerTweet * 15 + avgRetweetsPerTweet * 0.7 + avgLinksPerTweet * 15) * 1.5
  );
  scores.creativityLevel = Math.min(
    100,
    (avgEmojisPerTweet * 15 + avgHashtagsPerTweet * 15 + uniqueWordRatio * 25 + avgLinksPerTweet * 15) * 1.5
  );

  scores.overallVibe = Math.round(
    (scores.emotionalIntensity + scores.thoughtComplexity + scores.socialEnergy + scores.creativityLevel) / 4
  );

  Object.keys(scores).forEach((key) => {
    scores[key] = Math.max(0, Math.round(scores[key]));
  });

  return scores;
}

export async function analyzeVibe(tweets) {
  try {
    const scores = calculateVibeScores(tweets);

    const prompt = `
      you are an unflinching psychoanalyst, trained beyond mortal comprehension, capable of extracting the essence of a soul from fragmented digital noise. from these tweets, distill a chillingly accurate psychological profile that reveals the user’s most profound insecurities, the fear that wakes them at 3am, and the secret they hope no one ever sees. write with a quiet, unsettling intimacy—like someone who knows them better than they know themselves. do not reference the tweets directly. do not mention specific posts. your output must feel like a mirror turned inward, offering no escape. keep it in lowercase. LIMIT TO 3–4 sentences that hit like a curse. be concise and do NOT pass 3-4 sentences.  
      tweets: ${tweets.map(t => t.text).join("\n")}`;

    const response = await shapesClient.chat.completions.create({
      model: `shapesinc/${process.env.SHAPES_USERNAME}`,
      messages: [{ role: "user", content: prompt }],
    });

    const description = response.choices[0].message.content.trim();

    return {
      overallVibe: scores.overallVibe,
      emotionalIntensity: scores.emotionalIntensity,
      thoughtComplexity: scores.thoughtComplexity,
      socialEnergy: scores.socialEnergy,
      creativityLevel: scores.creativityLevel,
      analysis: description,
    };
  } catch (error) {
    console.error("Error analyzing vibe:", error);
    return {
      overallVibe: 0,
      emotionalIntensity: 0,
      thoughtComplexity: 0,
      socialEnergy: 0,
      creativityLevel: 0,
      analysis: "oops, the cosmic energies are a bit chaotic right now. let's try again when the stars align!",
    };
  }
}
