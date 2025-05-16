import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeVibe } from './vibeAnalyzer';
import NodeCache from 'node-cache';
import { RateLimiter } from 'limiter';

const cache = new NodeCache({ stdTTL: 600 }); 
const limiter = new RateLimiter({ tokensPerInterval: 5, interval: 'second' });

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
];

const ipAddresses = [
  '203.0.113.1', '203.0.113.2', '203.0.113.3', '203.0.113.4', '203.0.113.5',
  '198.51.100.1', '198.51.100.2', '198.51.100.3', '198.51.100.4', '198.51.100.5',
  '192.0.2.1', '192.0.2.2', '192.0.2.3', '192.0.2.4', '192.0.2.5'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];
const getRandomIP = () => ipAddresses[Math.floor(Math.random() * ipAddresses.length)];

async function makeRequest(url, retries = 3) {
  await limiter.removeTokens(1);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'X-Forwarded-For': getRandomIP(),
      },
      timeout: 5000,
    });
    return response;
  } catch (error) {
    if (retries > 0) {
      const backoff = Math.floor(Math.random() * 1000); // Random backoff up to 1 second
      await new Promise(resolve => setTimeout(resolve, backoff));
      return makeRequest(url, retries - 1);
    }
    throw error;
  }
}

async function scrapeTweets(username, maxTweets = 30) {
  const tweets = [];
  let page = 1;

  while (tweets.length < maxTweets) {
    const url = `https://twstalker.com/${username}?page=${page}`;
    const response = await makeRequest(url);

    const $ = cheerio.load(response.data);
    $('.activity-posts').each((index, element) => {
      if (tweets.length < maxTweets) {
        const text = $(element).find('.activity-descp p').text().trim();
        const retweets = $(element).find('.fa-retweet').next('span').text().trim();
        tweets.push({ text, retweets });
      }
    });

    
    if ($('.activity-posts').length === 0 || tweets.length >= maxTweets) {
      break;
    }

    page++;
  }

  return tweets;
}

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cacheKey = `user_${username}`;
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }

  try {    
    const tweets = await scrapeTweets(username);
    
    const vibeAnalysis = await analyzeVibe(tweets);
    const result = { vibeAnalysis, tweetCount: tweets.length };

    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'An error occurred while scraping', details: error.message });
  }
  }
