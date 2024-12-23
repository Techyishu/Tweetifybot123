import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { generateTweet, generateThread } from './generator.js';

dotenv.config();

// Validate environment variables
const validateEnv = () => {
  const requiredEnvVars = {
    'TELEGRAM_BOT_TOKEN': process.env.TELEGRAM_BOT_TOKEN,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

try {
  // Validate environment variables before starting the bot
  validateEnv();

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
    polling: true,
    // Add error handling for polling errors
    onlyFirstMatch: true,
    request: {
      timeout: 30000
    }
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Handle polling errors
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
    if (error.message.includes('ETELEGRAM: 404')) {
      console.error('Invalid Telegram bot token. Please check your TELEGRAM_BOT_TOKEN in .env file');
      process.exit(1);
    }
  });

  // Rest of your bot code remains the same...
  const userLastRequests = new Map();

  const saveLastRequest = (chatId, type, thought) => {
    userLastRequests.set(chatId, { type, thought, timestamp: Date.now() });
  };

  const getLastRequest = (chatId) => {
    const request = userLastRequests.get(chatId);
    if (!request || Date.now() - request.timestamp > 300000) {
      return null;
    }
    return request;
  };

  bot.onText(/\/tweet (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userThought = match[1];

    try {
      const loadingMsg = await bot.sendMessage(chatId, '✨ Enhancing your thought into a tweet...');
      const tweet = await generateTweet(openai, userThought);
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      bot.sendMessage(chatId, `🎯 Enhanced Tweet:\n\n${tweet}\n\n🔄 Use /regenerate for a different version.`);
      saveLastRequest(chatId, 'tweet', userThought);
    } catch (error) {
      console.error('Tweet generation error:', error);
      bot.sendMessage(chatId, '❌ Sorry, there was an error enhancing your thought.');
    }
  });

  bot.onText(/\/thread (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userThought = match[1];

    try {
      const loadingMsg = await bot.sendMessage(chatId, '✨ Expanding your thought into a thread...');
      const thread = await generateThread(openai, userThought);
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      bot.sendMessage(chatId, `🧵 Enhanced Thread:\n\n${thread.join('\n\n')}\n\n🔄 Use /regenerate for a different version.`);
      saveLastRequest(chatId, 'thread', userThought);
    } catch (error) {
      console.error('Thread generation error:', error);
      bot.sendMessage(chatId, '❌ Sorry, there was an error expanding your thought.');
    }
  });

  bot.onText(/\/regenerate/, async (msg) => {
    const chatId = msg.chat.id;
    const lastRequest = getLastRequest(chatId);

    if (!lastRequest) {
      return bot.sendMessage(chatId, '⚠️ No recent content to regenerate. Share your thought using /tweet or /thread first.');
    }

    try {
      const loadingMsg = await bot.sendMessage(chatId, `🔄 Creating a fresh ${lastRequest.type} from your thought...`);
      
      const content = lastRequest.type === 'tweet' 
        ? await generateTweet(openai, lastRequest.thought)
        : await generateThread(openai, lastRequest.thought);

      await bot.deleteMessage(chatId, loadingMsg.message_id);
      
      if (lastRequest.type === 'tweet') {
        bot.sendMessage(chatId, `🎯 New Version:\n\n${content}\n\n🔄 Use /regenerate to try again.`);
      } else {
        bot.sendMessage(chatId, `🧵 New Thread Version:\n\n${content.join('\n\n')}\n\n🔄 Use /regenerate to try again.`);
      }
      
      saveLastRequest(chatId, lastRequest.type, lastRequest.thought);
    } catch (error) {
      console.error('Regeneration error:', error);
      bot.sendMessage(chatId, '❌ Sorry, there was an error regenerating your content.');
    }
  });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
      '👋 Welcome to your Thought Enhancer!\n\n' +
      '🎯 Share your thoughts and I\'ll make them shine:\n\n' +
      '🐦 /tweet [your thought] - Transform into an engaging tweet\n' +
      '🧵 /thread [your thought] - Expand into an insightful thread\n' +
      '🔄 /regenerate - Get a fresh version of your last enhancement'
    );
  });

  console.log('Bot started successfully! Make sure you have set up your bot with @BotFather and copied the correct token.');

} catch (error) {
  console.error('Startup error:', error.message);
  process.exit(1);
}
