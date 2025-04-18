"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import microphoneOff from "../public/assets/icons/microphone-off.svg";
import microphoneOn from "../public/assets/icons/microphone-on.svg";
import { Button } from "./ui/button";

interface MicrophoneProps {
  sendInterval: number;
  onTranscriptUpdate: (transcript: string) => void;
}

const Microphone = ({ sendInterval = 250, onTranscriptUpdate }: MicrophoneProps) => {
  const [isListening, setIsListening] = useState(false);
  const [apiKey, setApiKey] = useState("");

  // Refs for microphone and Deepgram connection
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramConnectionRef = useRef<ReturnType<typeof createClient.prototype.listen.live> | null>(null);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const response = await fetch("/api/deepgram-auth"); // Ensure this endpoint exists and works
        if (!response.ok) {
          throw new Error(`API fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.apiKey) {
          console.warn("Deepgram API key not received from backend.");
        }
        setApiKey(data.apiKey);
      } catch (error) {
        console.error("Failed to fetch Deepgram API key:", error);
      }
    };
    fetchApi();
  }, []);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    // 1. Close Deepgram connection gracefully
    if (deepgramConnectionRef.current) {
      deepgramConnectionRef.current.finish();
      deepgramConnectionRef.current = null;
    }

    // 2. Stop the MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();

    // 3. Stop microphone tracks (important!)
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    // 4. Clean up refs and state
    mediaRecorderRef.current = null;
    setIsListening(false);
  }, [isListening]);

  const startListening = useCallback(async () => {
    // Prevent starting if already listening or API key isn't ready
    if (isListening || !apiKey) {
      if (!apiKey) console.error("Cannot start listening: Deepgram API key is missing.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine a suitable mimeType, 'audio/webm' is common
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg;codecs=opus"; // Fallback, check browser compatibility
      console.log(`Using mimeType: ${mimeType}`);

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder; // Store ref immediately

      const deepgram = createClient(apiKey);
      const connection = deepgram.listen.live({
        model: "nova-3",
        language: "en-US",
        smart_format: true,
        interim_results: true, // Keep true for real-time feedback
        punctuate: true,
        // encoding: 'opus', // Add encoding if needed based on mimeType/Deepgram requirements
        // sample_rate: 16000, // Specify if needed
      });
      deepgramConnectionRef.current = connection; // Store ref immediately

      // --- Deepgram Event Listeners ---
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("Deepgram connection opened. Starting MediaRecorder.");
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1 /* WebSocket.OPEN */) {
            connection.send(event.data);
          }
        };
        // Start recording and sending data chunks periodically
        recorder.start(sendInterval);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const sentence = data.channel.alternatives[0].transcript;

        if (sentence && data.is_final) {
          onTranscriptUpdate(sentence); // Pass the final transcript up
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error("Deepgram Error:", error);
        stopListening();
      });

      connection.on(LiveTranscriptionEvents.Close, () => stopListening());

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        stopListening();
      };

      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone or starting Deepgram:", error);
      stopListening();
    }
  }, [isListening, sendInterval, stopListening, apiKey, onTranscriptUpdate]);

  // Clean up after component dismounts
  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <div className="flex items-center justify-center">
      <Button className="min-w-9 rounded-xl bg-transparent p-2 transition-all" onClick={isListening ? stopListening : startListening}>
        {isListening ? (
          <Image src={microphoneOn} alt="microphoneOn" width={24} height={24} />
        ) : (
          <Image src={microphoneOff} alt="microphoneOff" width={24} height={24} />
        )}
      </Button>
    </div>
  );
};

export default Microphone;
