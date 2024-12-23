const generateTweet = async (openai, userThought) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `Generate a casual and engaging tweet that feels natural and easy to understand.

Requirements:
	•	Write in simple, everyday language.
	•	Start with a hook or an interesting idea.
	•	End with a question or call-to-action to get people talking.
	•	Keep it under 280 characters.
	•	Make it relatable and honest.
	•	Use emojis only if they fit (max 2-3).

Focus on creating a tweet that starts a fun or thoughtful conversation.`
    }, {
  role: "user",
  content: `Transform this thought into an engaging tweet:  ${userThought}`
}],
    max_tokens: 300,
    temperature: 0.85
  });

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
      content: `Transform this thought into an engaging thread:  ${userThought}`
    }],
    max_tokens: 750,
    temperature: 0.85
  });

  return response.choices[0].message.content
    .split('\n')
    .filter(tweet => tweet.trim().length > 0);
};

export { generateTweet, generateThread };
