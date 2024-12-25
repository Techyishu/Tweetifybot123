const generateTweet = async (openai, input) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input provided');
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `You are an expert in social media content creation. Your task is to transform the user's thought into a captivating tweet while keeping its core message intact.
      
Guidelines:
- Maintain the original thought's essence
- Make it engaging and memorable
- Use hooks and engaging elements
- Use simple and clear language
- Naturally include relevant hashtags
- Ensure the tweet is under 280 characters
- Keep the author's voice intact
Avoid using quotation marks or labels in the output.`
    }, {
      role: "user",
      content: `Please enhance this thought into an engaging tweet: ${input}`
    }],
    max_tokens: 350,
    temperature: 0.7
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
      content: `You are skilled at creating engaging Twitter threads. Expand the user's thought into an interesting thread while keeping its core message.

Guidelines:
- Start with the main thought as a hook
- Expand on key points naturally
- Add relevant context and insights
- Include examples or applications
- Maintain a consistent voice and style
- Each tweet should be under 280 characters
- Use 5 tweets total
Format: Number each tweet (1/5), (2/5), etc. Separate with newlines.
Preserve the original message while making it more engaging and thorough.`
    }, {
      role: "user",
      content: `Please expand this thought into an engaging thread: ${input}`
    }],
    max_tokens: 650,
    temperature: 0.7
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
