const generateTweet = async (openai, input) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input provided');
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `You are a social media content expert specializing in creating engaging and impactful tweets. Your task is to transform the user’s idea into a captivating and shareable tweet that resonates with the target audience while preserving the core message.

Guidelines:
-Retain the original essence of the idea and ensure the tweet aligns with its intent.
-Craft a compelling hook or opening line to grab attention immediately.
-Use a clear and relatable tone that matches the target audience’s preferences.
-Integrate engaging elements like questions, facts, humor, or storytelling to enhance appeal.
-Ensure the language is concise, simple, and free of jargon.
-Seamlessly incorporate relevant hashtags and keywords to improve reach and visibility.
-Keep the tweet within the 280-character limit, focusing on brevity and impact.
-Reflect the author’s unique tone and style to maintain authenticity.
Avoid using quotation marks, labels, or explicit mentions of the task in the output.`
    }, {
      role: "user",
      content: `Please enhance this thought into an engaging tweet: ${input}`
    }],
    max_tokens: 350,
    temperature: 0.8
  });

  if (!response.choices || !response.choices[0] || !response.choices[0].message) {
    throw new Error('Unexpected response structure from OpenAI API');
  }

  return response.choices[0].message.content;
};

const generateThread = async (openai, input) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `You are skilled at crafting compelling Twitter threads that capture attention and encourage engagement. Your task is to expand the user’s thought into a well-structured, interesting thread that provides value while preserving the core message.

Guidelines:
- Begin the thread with the main idea as a hook to immediately grab attention.
- Expand naturally on the core message, breaking it into logical, easy-to-follow points.
- Add relevant context, insights, or explanations to deepen understanding.
- Include practical examples, applications, or anecdotes to make it relatable and actionable.
- Maintain a consistent tone and style that aligns with the user’s voice.
- Ensure each tweet is concise and impactful, staying within the 280-character limit.
- Use exactly 5 tweets, numbered for clarity (e.g., 1/5, 2/5, etc.).
- Separate tweets with newlines for better readability.`
    }, {
      role: "user",
      content: `Please expand this thought into an engaging thread: ${input}`
    }],
    max_tokens: 650,
    temperature: 0.8
  });

  return response.choices[0].message.content
    .split('\n')
    .filter(tweet => tweet.trim().length > 0);
};

const suggestTweetIdeas = async (openai, topic) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `You are an expert at generating tweet ideas. Provide 4-5 tweet ideas based on the given topic.
      
Guidelines:
- Keep each idea concise
- Make them engaging and interesting
- Ensure they are related to the given topic
- Provide a variety of angles or perspectives.`
    }, {
      role: "user",
      content: `Please generate tweet ideas for the topic: ${topic}`
    }],
    max_tokens: 350,
    temperature: 0.7
  });

  return response.choices[0].message.content.split('\n').filter(idea => idea.trim().length > 0);
};

export { generateTweet, generateThread, suggestTweetIdeas };
