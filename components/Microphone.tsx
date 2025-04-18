"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import microphoneOff from "../public/assets/icons/microphone-off.svg";
import microphoneOn from "../public/assets/icons/microphone-on.svg";
import { Button } from "./ui/button";

interface MicrophoneProps {
  sendInterval: number;
}

const Microphone = ({ sendInterval = 250 }: MicrophoneProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Refs for microphone and Deepgram connection
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramConnectionRef = useRef<ReturnType<typeof createClient.prototype.listen.live> | null>(null);

  useEffect(() => {
    const fetchApi = async () => {
      const response = await fetch("/api/deepgram-auth");
      const data = await response.json();
      setApiKey(data.apiKey);
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
    if (isListening) return;

    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" }); // Adjust mimeType if needed

      const deepgram = createClient(apiKey);
      const connection = deepgram.listen.live({
        model: "nova-3",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        punctuate: true,
      });

      // --- Deepgram Event Listeners ---
      connection.on(LiveTranscriptionEvents.Open, () => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1 /* OPEN */) {
            connection.send(event.data);
          }
        };
        recorder.start(sendInterval);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const sentence = data.channel.alternatives[0].transcript;
        if (sentence) setTranscript(sentence);
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error("Deepgram Error:", error);
        stopListening();
      });

      connection.on(LiveTranscriptionEvents.Close, (event) => {
        stopListening();
      });

      // Store references
      mediaRecorderRef.current = recorder;
      deepgramConnectionRef.current = connection;

      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone or starting Deepgram:", error);
      stopListening();
    }
  }, [isListening, sendInterval, stopListening, apiKey]);

  // Cleanup effect when component unmounts
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
