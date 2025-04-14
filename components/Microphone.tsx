"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

interface MicrophoneProps {
  apiKey: string;
  sendInterval: number;
}

const Microphone = ({ apiKey, sendInterval = 250 }: MicrophoneProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Refs for microphone and Deepgram connection
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramConnectionRef = useRef<ReturnType<
    typeof createClient.prototype.listen.live
  > | null>(null);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    // 1. Close Deepgram connection gracefully
    if (deepgramConnectionRef.current) {
      deepgramConnectionRef.current.finish();
      deepgramConnectionRef.current = null;
    }

    // 2. Stop the MediaRecorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    )
      mediaRecorderRef.current.stop();

    // 3. Stop microphone tracks (important!)
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
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
          if (
            event.data.size > 0 &&
            connection.getReadyState() === 1 /* OPEN */
          ) {
            connection.send(event.data);
          }
        };
        recorder.start(sendInterval);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const sentence = data.channel.alternatives[0].transcript;
        if (sentence) {
          // TODO: Update transcript, overwriting the previous interim result
          // If you want to accumulate, you might need more complex state logic
          setTranscript(sentence);
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error("Deepgram Error:", error);
        setTranscript(
          `Error: ${(error as Error).message || "Deepgram connection error"}`
        );
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
      setTranscript(
        `Error: ${
          (error as Error).message ||
          "Could not access microphone or connect to Deepgram."
        }`
      );

      stopListening();
    }
  }, [isListening, apiKey, sendInterval, stopListening]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <div>
      <h2>Real-time Transcription</h2>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? "🔴 Stop Listening" : "🎤 Start Listening"}
      </button>
      <p>Status: {isListening ? "Listening..." : "Idle"}</p>
      <div className="mt-4 border border-gray-300 p-4 min-h-20">
        <p>
          <strong>Transcript:</strong>
        </p>
        <p>{transcript || "..."}</p>
      </div>
    </div>
  );
};

export default Microphone;
