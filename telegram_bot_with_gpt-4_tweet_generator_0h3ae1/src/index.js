import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { generateTweet, generateThread } from './generator.js';

dotenv.config();

// Initialize bot with polling error handling
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Error handling for polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
  // Attempt to restart polling after a delay
  setTimeout(() => {
    try {
      bot.stopPolling();
      bot.startPolling();
    } catch (e) {
      console.error('Failed to restart polling:', e);
    }
  }, 5000);
});

// Error handling for general bot errors
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

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

// Wrap bot methods in try-catch blocks
const safeSendMessage = async (chatId, text, options = {}) => {
  try {
    return await bot.sendMessage(chatId, text, options);
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

const safeDeleteMessage = async (chatId, messageId) => {
  try {
    return await bot.deleteMessage(chatId, messageId);
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

bot.onText(/\/tweet (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userThought = match[1];

  try {
    const loadingMsg = await safeSendMessage(chatId, '✨ Enhancing your thought into a tweet...');
    if (loadingMsg) {
      const tweet = await generateTweet(openai, userThought);
      await safeDeleteMessage(chatId, loadingMsg.message_id);
      await safeSendMessage(chatId, `🎯 Enhanced Tweet:\n\n${tweet}\n\n🔄 Use /regenerate for a different version.`);
      saveLastRequest(chatId, 'tweet', userThought);
    }
  } catch (error) {
    console.error('Tweet generation error:', error);
    await safeSendMessage(chatId, '❌ Sorry, there was an error enhancing your thought.');
  }
});

bot.onText(/\/thread (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userThought = match[1];

  try {
    const loadingMsg = await safeSendMessage(chatId, '✨ Expanding your thought into a thread...');
    if (loadingMsg) {
      const thread = await generateThread(openai, userThought);
      await safeDeleteMessage(chatId, loadingMsg.message_id);
      await safeSendMessage(chatId, `🧵 Enhanced Thread:\n\n${thread.join('\n\n')}\n\n🔄 Use /regenerate for a different version.`);
      saveLastRequest(chatId, 'thread', userThought);
    }
  } catch (error) {
    console.error('Thread generation error:', error);
    await safeSendMessage(chatId, '❌ Sorry, there was an error expanding your thought.');
  }
});

bot.onText(/\/regenerate/, async (msg) => {
  const chatId = msg.chat.id;
  const lastRequest = getLastRequest(chatId);

  if (!lastRequest) {
    return await safeSendMessage(chatId, '⚠️ No recent content to regenerate. Share your thought using /tweet or /thread first.');
  }

  try {
    const loadingMsg = await safeSendMessage(chatId, `🔄 Creating a fresh ${lastRequest.type} from your thought...`);
    if (loadingMsg) {
      const content = lastRequest.type === 'tweet' 
        ? await generateTweet(openai, lastRequest.thought)
        : await generateThread(openai, lastRequest.thought);

      await safeDeleteMessage(chatId, loadingMsg.message_id);
      
      if (lastRequest.type === 'tweet') {
        await safeSendMessage(chatId, `🎯 New Version:\n\n${content}\n\n🔄 Use /regenerate to try again.`);
      } else {
        await safeSendMessage(chatId, `🧵 New Thread Version:\n\n${content.join('\n\n')}\n\n🔄 Use /regenerate to try again.`);
      }
      
      saveLastRequest(chatId, lastRequest.type, lastRequest.thought);
    }
  } catch (error) {
    console.error('Regeneration error:', error);
    await safeSendMessage(chatId, '❌ Sorry, there was an error regenerating your content.');
  }
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await safeSendMessage(chatId, 
    '👋 Welcome to your Thought Enhancer!\n\n' +
    '🎯 Share your thoughts and I\'ll make them shine:\n\n' +
    '🐦 /tweet [your thought] - Transform into an engaging tweet\n' +
    '🧵 /thread [your thought] - Expand into an insightful thread\n' +
    '🔄 /regenerate - Get a fresh version of your last enhancement'
  );
});

// Handle connection errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

console.log('Bot started successfully! Press Ctrl+C to stop.');
