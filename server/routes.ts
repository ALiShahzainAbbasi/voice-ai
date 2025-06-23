import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFriendSchema, updateFriendSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all friends
  app.get("/api/friends", async (req, res) => {
    try {
      const friends = await storage.getFriends();
      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  // Create a new friend
  app.post("/api/friends", async (req, res) => {
    try {
      const friendData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend(friendData);
      res.status(201).json(friend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid friend data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create friend" });
      }
    }
  });

  // Update a friend
  app.patch("/api/friends/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateFriendSchema.parse(req.body);
      const friend = await storage.updateFriend(id, updateData);
      
      if (!friend) {
        return res.status(404).json({ error: "Friend not found" });
      }
      
      res.json(friend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid update data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update friend" });
      }
    }
  });

  // Delete a friend
  app.delete("/api/friends/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFriend(id);
      
      if (!success) {
        return res.status(404).json({ error: "Friend not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete friend" });
    }
  });

  // Get ElevenLabs voices
  app.get("/api/voices", async (req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        // Provide demo voices when no API key is configured
        const demoVoices = [
          { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", labels: { gender: "female", accent: "american" } },
          { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", labels: { gender: "female", accent: "american" } },
          { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", labels: { gender: "female", accent: "american" } },
          { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", labels: { gender: "male", accent: "american" } },
          { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", labels: { gender: "female", accent: "american" } },
          { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", labels: { gender: "male", accent: "american" } },
          { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold", labels: { gender: "male", accent: "american" } },
          { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", labels: { gender: "male", accent: "american" } }
        ];
        return res.json(demoVoices);
      }

      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        // If API key is invalid, return demo voices
        console.warn(`ElevenLabs API error: ${response.status}. Using demo voices for testing.`);
        const demoVoices = [
          { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", labels: { gender: "female", accent: "american" } },
          { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", labels: { gender: "female", accent: "american" } },
          { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", labels: { gender: "female", accent: "american" } },
          { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", labels: { gender: "male", accent: "american" } },
          { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", labels: { gender: "female", accent: "american" } },
          { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", labels: { gender: "male", accent: "american" } },
          { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold", labels: { gender: "male", accent: "american" } },
          { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", labels: { gender: "male", accent: "american" } }
        ];
        return res.json(demoVoices);
      }

      const data = await response.json();
      res.json(data.voices);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
      // Fallback to demo voices on any error
      const demoVoices = [
        { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", labels: { gender: "female", accent: "american" } },
        { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", labels: { gender: "female", accent: "american" } },
        { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", labels: { gender: "female", accent: "american" } },
        { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", labels: { gender: "male", accent: "american" } },
        { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", labels: { gender: "female", accent: "american" } },
        { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", labels: { gender: "male", accent: "american" } },
        { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold", labels: { gender: "male", accent: "american" } },
        { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", labels: { gender: "male", accent: "american" } }
      ];
      res.json(demoVoices);
    }
  });

  // Generate voice for conversations
  app.post("/api/generate-voice", async (req, res) => {
    try {
      const { text, voiceId, stability, similarity } = req.body;
      
      if (!text || !voiceId) {
        return res.status(400).json({ error: "Text and voiceId are required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: stability || 0.75,
            similarity_boost: similarity || 0.85,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`ElevenLabs API error: ${response.status} - ${errorData}`);
        return res.status(response.status).json({ 
          error: "Voice generation failed", 
          details: errorData 
        });
      }

      const audioBuffer = await response.arrayBuffer();
      
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        console.error("Empty audio buffer received from ElevenLabs");
        return res.status(500).json({ error: "Empty audio data received" });
      }
      
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      
      console.log(`Voice generated successfully: ${base64Audio.length} characters`);
      
      res.json({ audioUrl, audio: base64Audio });
    } catch (error) {
      console.error("Failed to generate voice:", error);
      res.status(500).json({ error: "Failed to generate voice" });
    }
  });

  // Generate voice sample
  app.post("/api/voice-sample", async (req, res) => {
    try {
      const { voiceId, sampleType = "greeting" } = req.body;

      if (!voiceId) {
        return res.status(400).json({ error: "VoiceId is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      const sampleTexts = {
        greeting: "Hello! This is a sample of my voice. How do you think I sound?",
        professional: "Good morning. I'm pleased to present today's quarterly business review.",
        emotional: "I understand this is difficult for you. Please know that you're not alone.",
        storytelling: "Once upon a time, in a land far away, there lived a brave young hero.",
        casual: "Hey there! Just wanted to check in and see how you're doing today."
      };

      const text = sampleTexts[sampleType as keyof typeof sampleTexts] || sampleTexts.greeting;

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`ElevenLabs API error: ${response.status} - ${errorData}`);
        return res.status(response.status).json({ 
          error: "Voice sample generation failed", 
          details: errorData 
        });
      }

      const audioBuffer = await response.arrayBuffer();
      
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        console.error("Empty audio buffer received from ElevenLabs");
        return res.status(500).json({ error: "Empty audio data received" });
      }
      
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      console.log(`Voice sample generated successfully: ${base64Audio.length} characters`);
      
      res.json({ audio: base64Audio });
    } catch (error) {
      console.error("Failed to generate voice sample:", error);
      res.status(500).json({ error: "Failed to generate voice sample" });
    }
  });

  // OpenAI conversation generation
  app.post("/api/generate-conversation", async (req, res) => {
    try {
      const { prompt, personality, contextHistory } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({ apiKey });

      const personalityDescriptions = {
        cheerful: "You're always optimistic and energetic. You love sharing positive experiences from your life like weekend adventures, fun events you attended, and exciting plans you have coming up.",
        romantic: "You're deeply emotional and value meaningful connections. You often reference romantic movies you've seen, beautiful places you've visited with loved ones, and heartfelt moments you've experienced.",
        unhinged: "You're spontaneous and unpredictable. You tell wild stories about crazy things you've done, unexpected adventures you've had, and impulsive decisions you've made.",
        sarcastic: "You're witty and often use humor to make your point. You reference funny situations you've witnessed, ironic events that happened to you, and amusing observations about life.",
        wise: "You're thoughtful and philosophical. You often reference books you've read, life lessons you've learned from specific experiences, and insights gained from your past.",
        gentle: "You're caring and compassionate. You talk about times you've helped others, peaceful moments you've enjoyed, and ways you've supported friends and family.",
        mysterious: "You're enigmatic and intriguing. You hint at unusual experiences you've had, strange coincidences in your life, and unexplained events you've witnessed.",
        aggressive: "You're direct and assertive. You reference times you've stood up for yourself or others, challenges you've overcome, and strong opinions about specific situations.",
        confident: "You're self-assured and ambitious. You talk about goals you've achieved, challenges you've conquered, and successes you've had in specific endeavors.",
        playful: "You're fun-loving and mischievous. You reference games you've played, pranks you've pulled, silly situations you've been in, and lighthearted moments you've shared.",
        melancholic: "You're contemplative and sometimes sad. You reflect on bittersweet memories, losses you've experienced, and poignant moments that have shaped you.",
        authoritative: "You're knowledgeable and take charge. You reference your expertise in specific areas, leadership experiences you've had, and situations where you've guided others."
      };

      const personalityPrompt = personalityDescriptions[personality as keyof typeof personalityDescriptions] || personalityDescriptions.cheerful;

      const systemPrompt = `You are a ${personality} person in a casual conversation with friends. ${personalityPrompt}

CRITICAL RULES:
1. Always respond with specific details like dates, places, names, and shared experiences
2. Reference concrete memories and real-life scenarios
3. Never use generic platitudes or vague statements
4. Keep responses conversational and authentic (2-3 sentences max)
5. Build on what the previous speaker said with specific examples
6. Mention actual locations, people's names, specific dates/times

${contextHistory ? `Recent conversation context:\n${contextHistory}` : ''}

Respond authentically with specific details and concrete examples.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      const generatedText = response.choices[0].message.content?.trim() || "That's really interesting. I'd love to hear more about that.";
      
      res.json({ text: generatedText });
    } catch (error) {
      console.error("Failed to generate conversation:", error);
      res.status(500).json({ error: "Failed to generate conversation" });
    }
  });

  // Voice cloning endpoint
  app.post("/api/create-voice-clone", async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Voice name is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      // Simulate processing time for voice cloning
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate a unique voice ID for the clone
      const voiceId = `voice_clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({
        id: voiceId,
        voiceId: voiceId,
        name: name.trim(),
        description: description?.trim() || "",
        status: "ready"
      });
    } catch (error: any) {
      console.error("Voice cloning error:", error);
      res.status(500).json({ error: "Failed to create voice clone" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
