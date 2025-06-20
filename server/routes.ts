import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFriendSchema, updateFriendSchema } from "@shared/schema";
import { z } from "zod";

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

  // Generate voice
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
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      
      res.json({ audio: base64Audio });
    } catch (error) {
      console.error("Failed to generate voice:", error);
      res.status(500).json({ error: "Failed to generate voice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
