const generateTweet = async (openai, userThought) => {
  if (!userThought || typeof userThought !== 'string') {
    throw new Error('Invalid user thought provided');
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `You are an expert social media content enhancer. Your job is to take someone's thoughts and transform them into a powerful, engaging tweet while maintaining their core message and tone.

Guidelines:
- Preserve the original thought's essence
- Make it more impactful and memorable
- Add hooks and engagement elements
- Use clear, concise language
- Include relevant hashtags naturally
- Stay under 280 characters
- Maintain the author's voice
Do not include quotation marks or labels in the output.`
    }, {
      role: "user",
      content: `Transform this thought into an engaging tweet: ${userThought}`
    }],
    max_tokens: 150,
    temperature: 0.7
  });

  if (!response.choices || !response.choices[0] || !response.choices[0].message) {
    throw new Error('Unexpected response structure from OpenAI API');
  }

  return response.choices[0].message.content;
};

const generateThread = async (openai, userThought) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `You are an expert at transforming thoughts into compelling Twitter threads. Take the user's thought and expand it into an engaging thread while maintaining their core message.

Guidelines:
- Start with the main thought as a hook
- Expand on key points naturally
- Add relevant context and insights
- Include examples or applications
- Maintain consistent voice and style
- Each tweet under 280 characters
- Use 5 tweets total
Format: Number each tweet (1/5), (2/5), etc. Separate with newlines.
Preserve the original message while making it more engaging and thorough.`
    }, {
      role: "user",
      content: `Transform this thought into an engaging thread: ${userThought}`
    }],
    max_tokens: 650,
    temperature: 0.7
  });

  return response.choices[0].message.content
    .split('\n')
    .filter(tweet => tweet.trim().length > 0);
};

export { generateTweet, generateThread };
