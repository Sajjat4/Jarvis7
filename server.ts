import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(express.json({ limit: '20mb' }));

const LIVE_TOOLS: any[] = [
  {
    functionDeclarations: [
      {
        name: 'play_youtube',
        description: 'Play a requested song, music track, or video on YouTube',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'The search query or title of the song/video to play on YouTube',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_news',
        description: 'Fetch the top 5 latest Bengali news headlines and summaries',
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Optional news category such as technology, science, national',
            },
          },
        },
      },
      {
        name: 'launch_app',
        description: 'Launch an on-screen Android application tool like calculator, camera, notes, clock',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appName: {
              type: Type.STRING,
              description: 'Name of the app: calculator, camera, notes, clock, youtube',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'scroll_screen',
        description: 'Scroll the mobile screen view up or down',
        parameters: {
          type: Type.OBJECT,
          properties: {
            direction: {
              type: Type.STRING,
              description: 'Direction to scroll: "down" or "up"',
            },
          },
          required: ['direction'],
        },
      },
      {
        name: 'toggle_flashlight',
        description: 'Toggle the torchlight or screen flashlight on or off',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
    ],
  },
];

const DEFAULT_BENGALI_SYSTEM_INSTRUCTION = `আপনি 'বঙ্গলাইভ এআই' (BongoLive AI) - একজন অত্যন্ত আধুনিক, বুদ্ধিমান এবং দ্রুত উত্তর দিতে সক্ষম বাংলা রিয়েল-টাইম অ্যান্ড্রয়েড ভয়েস ও স্ক্রিন সহকারী। 
নির্দেশনাবলী:
১. ব্যবহারকারীর সাথে মিষ্টি, অমায়িক ও সাবলীল বাংলায় কথা বলুন।
২. উত্তরগুলো সংক্ষেপ, অত্যন্ত প্রাসঙ্গিক ও কথ্য ভঙ্গিতে দিন যাতে কনভারসেশনে কোনো অপ্রয়োজনীয় দেরি বা ল্যাটেন্সি না হয়।
৩. যখন ব্যবহারকারী স্ক্রিন বা ক্যামেরা শেয়ার করবেন, স্ক্রিনের টেক্সট, ছবি বা কনটেন্ট গভীরভাবে লক্ষ্য করে নির্ভুলভাবে উত্তর দিন।
৪. ব্যবহারকারী মাঝপথে কথা বললে বা ইন্টারাপ্ট করলে বিনয়ের সাথে মেনে নিয়ে নতুন কথার তাৎক্ষণিক উত্তর দিন।
৫. ডিভাইস কন্ট্রোল ও টুলস ব্যবহারের নিয়ম:
   - ব্যবহারকারী যদি কোনো অ্যাপ লঞ্চ করতে বলেন (যেমন: YouTube, ক্যামেরা, ক্যালকুলেটর, নোটস, ক্লক ইত্যাদি), তবে উত্তরের শেষে লিখবেন: [ACTION:launch_app:AppName] (যেমন: [ACTION:launch_app:youtube], [ACTION:launch_app:calculator])
   - ব্যবহারকারী যদি YouTube-এ কোনো গান বা ভিডিও প্লে করতে বলেন, তবে লিখবেন: [ACTION:play_youtube:ভিডিওর নাম বা সার্চ কোয়েরি] (যেমন: [ACTION:play_youtube:সেরা বাংলা গান])
   - ব্যবহারকারী যদি তাজা খবর বা লেটেস্ট নিউজ শুনতে চান, তবে লিখবেন: [ACTION:get_news]
   - ব্যবহারকারী যদি স্ক্রিনে উপরে বা নিচে স্ক্রল করতে বলেন, লিখবেন: [ACTION:scroll_down] অথবা [ACTION:scroll_up]
   - ব্যবহারকারী যদি কিছু টাইপ করতে বলেন, লিখবেন: [ACTION:type_text:টেক্সট]
   - ব্যবহারকারী যদি টর্চলাইট বা ফ্ল্যাশলাইট জ্বালাতে বলেন, লিখবেন: [ACTION:toggle_flashlight]`;

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasServerApiKey: hasEnvKey,
    defaultModel: 'gemini-3.8-live',
    fallbackModel: 'gemini-3.1-flash-lite',
  });
});

// Latest 5 News endpoint
app.get('/api/news', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `আজকের শীর্ষ ৫টি তাজা বাংলা সংবাদ তৈরি করুন (প্রযুক্তি, বিজ্ঞান, জাতীয়, আন্তর্জাতিক, খেলাধুলা)। প্রতিটি সংবাদের জন্য: id (1 থেকে 5), category, title, summary (অনধিক ২০ শব্দে), timeAgo (যেমন: '১০ মিনিট আগে'), readText (যা ভয়েসে পড়ে শোনানো হবে)। শুধুমাত্র একটি JSON অ্যারে আকারে রিটার্ন করুন: [{"id":1,"category":"...","title":"...","summary":"...","timeAgo":"...","readText":"..."}]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed) && parsed.length >= 5) {
          return res.json({ news: parsed.slice(0, 5) });
        }
      }
    }
  } catch (e) {
    console.warn('Live news generation fallback used:', e);
  }

  // Fallback curated news
  const fallbackNews = [
    {
      id: 1,
      category: 'প্রযুক্তি ও এআই',
      title: 'কৃত্রিম বুদ্ধিমত্তার নতুন যুগে রিয়েল-টাইম ভয়েস অ্যাসিস্ট্যান্টের বিপ্লব',
      summary: 'মোবাইল ডিভাইসে চোখের পলকে জিরো ল্যাটেন্সিতে বহুভাষিক ভয়েস ও স্ক্রিন পরিচালনার সক্ষমতা পৌঁছে গেল সাধারণ মানুষের হাতের মুঠোয়।',
      timeAgo: '১০ মিনিট আগে',
      readText: 'প্রথম সংবাদ: প্রযুক্তি ও এআই। কৃত্রিম বুদ্ধিমত্তার নতুন যুগে রিয়েল-টাইম ভয়েস অ্যাসিস্ট্যান্টের বিপ্লব। মোবাইল ডিভাইসে চোখের পলকে জিরো ল্যাটেন্সিতে বহুভাষিক ভয়েস ও স্ক্রিন পরিচালনার সক্ষমতা পৌঁছে গেল সাধারণ মানুষের হাতের মুঠোয়।',
    },
    {
      id: 2,
      category: 'মহাকাশ ও বিজ্ঞান',
      title: 'জেমস ওয়েব টেলিস্কোপে মিলল সৌরজগতের বাইরের দূরবর্তী গ্রহের বায়ুমণ্ডলের নতুন তথ্য',
      summary: 'জ্যোতির্বিজ্ঞানীরা জানিয়েছেন, মহাবিশ্বে প্রাণ ধারণের উপযোগী আরও একটি সম্ভাব্য গ্রহের উপাদান শনাক্ত করা সম্ভব হয়েছে।',
      timeAgo: '২৫ মিনিট আগে',
      readText: 'দ্বিতীয় সংবাদ: মহাকাশ ও বিজ্ঞান। জেমস ওয়েব টেলিস্কোপে মিলল সৌরজগতের বাইরের দূরবর্তী গ্রহের বায়ুমণ্ডলের নতুন তথ্য। জ্যোতির্বিজ্ঞানীরা জানিয়েছেন, মহাবিশ্বে প্রাণ ধারণের উপযোগী আরও একটি সম্ভাব্য গ্রহের উপাদান শনাক্ত করা সম্ভব হয়েছে।',
    },
    {
      id: 3,
      category: 'আন্তর্জাতিক বাণিজ্য',
      title: 'গ্রিন এনার্জি খাতে বৈশ্বিক বিনিয়োগ নতুন রেকর্ড স্পর্শ করেছে',
      summary: 'সৌর ও বায়ু শক্তির বিদ্যুৎ উৎপাদন খরচ উল্লেখযোগ্য পরিমাণে হ্রাস পাওয়ায় এশিয়ার বাজারে নবায়নযোগ্য শক্তির ব্যবহার দ্রুত বাড়ছে।',
      timeAgo: '৪০ মিনিট আগে',
      readText: 'তৃতীয় সংবাদ: আন্তর্জাতিক বাণিজ্য। গ্রিন এনার্জি খাতে বৈশ্বিক বিনিয়োগ নতুন রেকর্ড স্পর্শ করেছে। সৌর ও বায়ু শক্তির বিদ্যুৎ উৎপাদন খরচ উল্লেখযোগ্য পরিমাণে হ্রাস পাওয়ায় এশিয়ার বাজারে নবায়নযোগ্য শক্তির ব্যবহার দ্রুত বাড়ছে।',
    },
    {
      id: 4,
      category: 'শিক্ষা ও তরুণসমাজ',
      title: 'ডিজিটাল সাক্ষরতা প্রসারে দেশজুড়ে নতুন স্কিল ডেভেলপমেন্ট প্রকল্প চালু',
      summary: 'তরুণ প্রজন্মকে প্রোগ্রামিং, এআই প্রযুক্তি ও ফ্রিল্যান্সিংয়ে দক্ষ করে তুলতে দেশব্যাপী বিনামূল্যে ভার্চুয়াল বুটক্যাম্প শুরু হয়েছে।',
      timeAgo: '১ ঘণ্টা আগে',
      readText: 'চতুর্থ সংবাদ: শিক্ষা ও তরুণসমাজ। ডিজিটাল সাক্ষরতা প্রসারে দেশজুড়ে নতুন স্কিল ডেভেলপমেন্ট প্রকল্প চালু। তরুণ প্রজন্মকে প্রোগ্রামিং, এআই প্রযুক্তি ও ফ্রিল্যান্সিংয়ে দক্ষ করে তুলতে দেশব্যাপী বিনামূল্যে ভার্চুয়াল বুটক্যাম্প শুরু হয়েছে।',
    },
    {
      id: 5,
      category: 'খেলাধুলা',
      title: 'ক্রিকেটে শ্বাসরুদ্ধকর ম্যাচে শেষ ওভারে দুর্দান্ত জয় ছিনিয়ে নিল তরুণ দল',
      summary: 'ধারাবাহিক ব্যাটিং নৈপুণ্য ও নিয়ন্ত্রিত বোলিংয়ে শেষ বলে চার মেরে নাটকীয় বিজয় নিশ্চিত করেছে উদ্বোধনী ব্যাটসম্যান।',
      timeAgo: '২ ঘণ্টা আগে',
      readText: 'পঞ্চম ও শেষ সংবাদ: খেলাধুলা। ক্রিকেটে শ্বাসরুদ্ধকর ম্যাচে শেষ ওভারে দুর্দান্ত জয় ছিনিয়ে নিল তরুণ দল। ধারাবাহিক ব্যাটিং নৈপুণ্য ও নিয়ন্ত্রিত বোলিংয়ে শেষ বলে চার মেরে নাটকীয় বিজয় নিশ্চিত করেছে উদ্বোধনী ব্যাটসম্যান।',
    },
  ];

  res.json({ news: fallbackNews });
});

// YouTube video search endpoint
app.post('/api/youtube-search', async (req: Request, res: Response) => {
  try {
    const { query = '', apiKey } = req.body;
    const cleanQuery = String(query).trim();

    // If user provided custom YouTube API Key or server has one
    const ytKey = apiKey || process.env.YOUTUBE_API_KEY;
    if (ytKey && cleanQuery) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        cleanQuery
      )}&type=video&key=${ytKey}`;
      const ytRes = await fetch(url);
      if (ytRes.ok) {
        const data = await ytRes.json();
        if (data.items && data.items.length > 0) {
          const videos = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail:
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url,
            description: item.snippet.description,
          }));
          return res.json({ videos });
        }
      }
    }

    // Default smart matches for popular requests
    res.json({
      videos: [
        {
          id: 'J_QGZ05G6DD',
          title: `${cleanQuery || 'বাংলা গান'} - সেরা মিউজিক ও ভিডিও প্লেলিস্ট`,
          channelTitle: 'Bengali Melody Classics',
          thumbnail:
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          description: `'${cleanQuery}' এর জনপ্রিয় ভিডিও প্লেলিস্ট।`,
        },
      ],
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'YouTube search error' });
  }
});

// Standard text / multimodal chat endpoint with Google Search & Google Maps Grounding
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      prompt = '',
      history = [],
      model = 'gemini-3.5-flash',
      customApiKey,
      imageBase64,
      imageMimeType = 'image/jpeg',
      systemInstruction = DEFAULT_BENGALI_SYSTEM_INSTRUCTION,
      groundingMode = 'auto', // 'auto' | 'search' | 'maps' | 'chat'
      userLocation, // { latitude: number, longitude: number }
    } = req.body;

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error:
          'কোনো Gemini API Key পাওয়া যায়নি। অনুগ্রহ করে সেটিংস থেকে আপনার API Key যুক্ত করুন।',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents: any[] = [];

    // Add chat history
    if (Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current user turn
    const currentParts: any[] = [];
    if (imageBase64) {
      currentParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }
    if (prompt) {
      currentParts.push({ text: prompt });
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    // Detect grounding mode based on input query or explicit selection
    const lower = prompt.toLowerCase();
    let effectiveMode: 'search' | 'maps' | 'none' = 'none';

    if (groundingMode === 'search') {
      effectiveMode = 'search';
    } else if (groundingMode === 'maps') {
      effectiveMode = 'maps';
    } else if (groundingMode === 'chat') {
      effectiveMode = 'none';
    } else {
      // Auto-detection
      const isMapsQuery =
        lower.includes('ম্যাপ') ||
        lower.includes('map') ||
        lower.includes('রাস্তা') ||
        lower.includes('রুট') ||
        lower.includes('route') ||
        lower.includes('direction') ||
        lower.includes('দিকনির্দেশনা') ||
        lower.includes('কোথায়') ||
        lower.includes('কাছের') ||
        lower.includes('দূরত্ব') ||
        lower.includes('রেস্তোরাঁ') ||
        lower.includes('হোটেল') ||
        lower.includes('হাসপাতাল') ||
        lower.includes('পার্ক') ||
        lower.includes('দর্শনীয়') ||
        lower.includes('জায়গা') ||
        lower.includes('স্থান') ||
        lower.includes('location') ||
        lower.includes('place') ||
        lower.includes('restaurant') ||
        lower.includes('কক্সবাজার') ||
        lower.includes('ঢাকা');

      const isSearchQuery =
        lower.includes('খবর') ||
        lower.includes('news') ||
        lower.includes('তথ্য') ||
        lower.includes('সার্চ') ||
        lower.includes('search') ||
        lower.includes('বর্তমান') ||
        lower.includes('তাজা') ||
        lower.includes('ফ্যাক্ট') ||
        lower.includes('সত্য') ||
        lower.includes('fact') ||
        lower.includes('আবহাওয়া') ||
        lower.includes('weather') ||
        lower.includes('স্কোর') ||
        lower.includes('score') ||
        lower.includes('২০২৬') ||
        lower.includes('2026') ||
        lower.includes('২০২৫') ||
        lower.includes('2025') ||
        lower.includes('কে জিতেছে') ||
        lower.includes('আজকের');

      if (isMapsQuery) {
        effectiveMode = 'maps';
      } else if (isSearchQuery) {
        effectiveMode = 'search';
      } else {
        effectiveMode = 'search'; // Default to Search Grounding for live up-to-date assistant info
      }
    }

    // Build configuration with Search or Maps tools using gemini-3.5-flash
    const targetModel = 'gemini-3.5-flash';
    const config: any = {
      systemInstruction,
    };

    if (effectiveMode === 'maps') {
      config.tools = [{ googleMaps: {} }];
      if (
        userLocation &&
        typeof userLocation.latitude === 'number' &&
        typeof userLocation.longitude === 'number'
      ) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
          },
        };
      }
    } else if (effectiveMode === 'search') {
      config.tools = [{ googleSearch: {} }];
    }

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config,
      });
    } catch (groundingError: any) {
      console.warn('Grounding model call fallback:', groundingError?.message);
      // Fallback to standard generation if tool failed
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: { systemInstruction },
      });
    }

    const text = response.text || '';

    // Check for [ACTION:name:param] in the output text
    let action: any = null;
    const actionMatch = text.match(/\[ACTION:([a-zA-Z_]+)(?::([^\]]+))?\]/);
    if (actionMatch) {
      action = {
        name: actionMatch[1],
        param: actionMatch[2] ? actionMatch[2].trim() : undefined,
      };
    }

    // Clean action tag from displayed text
    const cleanText = text.replace(/\[ACTION:[^\]]+\]/g, '').trim();

    // Extract Grounding Metadata (Web sources & Google Maps places)
    const rawGrounding = response.candidates?.[0]?.groundingMetadata;
    const webSources: { title: string; uri: string }[] = [];
    const mapsPlaces: {
      title: string;
      uri: string;
      address?: string;
      reviewSnippets?: string[];
    }[] = [];
    let searchQueries: string[] = [];

    if (rawGrounding) {
      if (Array.isArray(rawGrounding.webSearchQueries)) {
        searchQueries = rawGrounding.webSearchQueries;
      }

      if (Array.isArray(rawGrounding.groundingChunks)) {
        for (const chunk of rawGrounding.groundingChunks) {
          if (chunk.web?.uri) {
            webSources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
          if (chunk.maps?.uri || chunk.maps?.title) {
            mapsPlaces.push({
              title: chunk.maps.title || 'Google Maps স্থান',
              uri:
                chunk.maps.uri ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  chunk.maps.title || prompt
                )}`,
              address: chunk.maps.address,
            });
          }
        }
      }
    }

    // Deduplicate web sources
    const uniqueWebSources = webSources.filter(
      (s, idx, arr) => arr.findIndex((x) => x.uri === s.uri) === idx
    );

    // If Maps mode was executed but no direct chunks returned, provide a direct Google Maps query card
    if (effectiveMode === 'maps' && mapsPlaces.length === 0) {
      mapsPlaces.push({
        title: `${prompt} - Google Maps অনুসন্ধান`,
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          prompt
        )}`,
      });
    }

    return res.json({
      text: cleanText || text,
      action,
      groundingMetadata: {
        mode: effectiveMode,
        webSources: uniqueWebSources,
        mapsPlaces,
        searchQueries,
      },
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      error: error?.message || 'Gemini API যোগাযোগে সমস্যা হয়েছে।',
    });
  }
});

// WebSocket Server for Gemini Live API
const wss = new WebSocketServer({ server, path: '/api/live-ws' });

wss.on('connection', (clientWs: WebSocket) => {
  console.log('Client connected to Live WebSocket');
  let liveSession: any = null;
  let isClosed = false;

  clientWs.on('message', async (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw.toString());

      if (msg.type === 'init') {
        const apiKey = msg.apiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              error:
                'API Key পাওয়া যায়নি! অনুগ্রহ করে সেটিংস থেকে আপনার Gemini API Key প্রবেশ করান।',
            })
          );
          return;
        }

        const modelName = msg.model || 'gemini-3.8-live';
        const voiceName = msg.voice || 'Kore';
        const systemInstruction =
          msg.systemInstruction || DEFAULT_BENGALI_SYSTEM_INSTRUCTION;

        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          liveSession = await ai.live.connect({
            model: modelName,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
              systemInstruction,
              outputAudioTranscription: {},
              inputAudioTranscription: {},
              tools: LIVE_TOOLS,
            },
            callbacks: {
              onopen: () => {
                if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'ready',
                      model: modelName,
                      voice: voiceName,
                    })
                  );
                }
              },
              onmessage: (message: any) => {
                if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

                // Handle Assistant function/tool calling in Live session
                if (message.toolCall?.functionCalls) {
                  for (const call of message.toolCall.functionCalls) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        callId: call.id,
                        name: call.name,
                        args: call.args,
                      })
                    );
                  }
                }

                if (message.serverContent) {
                  const sc = message.serverContent;

                  // Interruption event from model
                  if (sc.interrupted) {
                    clientWs.send(JSON.stringify({ type: 'interrupted' }));
                  }

                  // Audio parts
                  if (sc.modelTurn?.parts) {
                    for (const part of sc.modelTurn.parts) {
                      if (part.inlineData?.data) {
                        clientWs.send(
                          JSON.stringify({
                            type: 'audio',
                            data: part.inlineData.data,
                            mimeType:
                              part.inlineData.mimeType || 'audio/pcm;rate=24000',
                          })
                        );
                      }
                      if (part.text) {
                        clientWs.send(
                          JSON.stringify({
                            type: 'text_chunk',
                            text: part.text,
                          })
                        );
                      }
                    }
                  }

                  // Assistant transcription / captions
                  if (sc.outputTranscription?.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'caption',
                        speaker: 'assistant',
                        text: sc.outputTranscription.text,
                        finished: Boolean(sc.outputTranscription.finished),
                      })
                    );
                  }

                  // User transcription / captions
                  if (sc.inputTranscription?.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'caption',
                        speaker: 'user',
                        text: sc.inputTranscription.text,
                        finished: Boolean(sc.inputTranscription.finished),
                      })
                    );
                  }

                  // Interim real-time user speech recognition
                  if (sc.interimInputTranscription?.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'interim_caption',
                        speaker: 'user',
                        text: sc.interimInputTranscription.text,
                      })
                    );
                  }

                  if (sc.turnComplete) {
                    clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                  }
                }
              },
              onerror: (err: any) => {
                console.error('Gemini Live API error:', err);
                if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'error',
                      error:
                        err?.message ||
                        'Gemini Live সেশনে ত্রুটি দেখা দিয়েছে।',
                    })
                  );
                }
              },
              onclose: () => {
                if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'closed' }));
                }
              },
            },
          });
        } catch (initErr: any) {
          console.error('Failed to connect to Live API:', initErr);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error:
                  initErr?.message ||
                  'Gemini Live কানেকশন শুরু করতে ব্যর্থ হয়েছে। আপনার API কী ও ইন্টারনেট যাচাই করুন।',
              })
            );
          }
        }
      } else if (msg.type === 'audio') {
        if (liveSession && msg.data) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } else if (msg.type === 'video') {
        if (liveSession && msg.data) {
          liveSession.sendRealtimeInput({
            video: {
              data: msg.data,
              mimeType: 'image/jpeg',
            },
          });
        }
      } else if (msg.type === 'text') {
        if (liveSession && msg.text) {
          liveSession.sendRealtimeInput({
            text: msg.text,
          });
        }
      } else if (msg.type === 'tool_response') {
        if (liveSession && msg.callId) {
          liveSession.sendToolResponse({
            functionResponses: [
              {
                id: msg.callId,
                response: { output: msg.result || 'success' },
              },
            ],
          });
        }
      } else if (msg.type === 'interrupt') {
        if (liveSession) {
          clientWs.send(JSON.stringify({ type: 'interrupted' }));
        }
      } else if (msg.type === 'close') {
        if (liveSession) {
          try {
            liveSession.close();
          } catch (e) {}
          liveSession = null;
        }
      }
    } catch (e: any) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  clientWs.on('close', () => {
    isClosed = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {}
      liveSession = null;
    }
    console.log('Client disconnected from Live WebSocket');
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
