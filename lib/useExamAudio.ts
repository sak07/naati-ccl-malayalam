import { useCallback, useRef, useState, useEffect } from 'react';

// Helper: play a single tone via Web Audio API
function playTone(
  audioCtx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  peakGain = 0.35
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * "Listen now" chime — a single soft downward tone played BEFORE
 * the dialogue audio starts, to cue the candidate to pay attention.
 * Mirrors the real NAATI exam behaviour.
 */
export function playReadyChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // A soft mid-tone: 660 Hz (E5), 0.6 s
      playTone(audioCtx, 660, audioCtx.currentTime, 0.55, 0.28);
      setTimeout(resolve, 700); // wait for tone + small gap before dialogue
    } catch {
      resolve();
    }
  });
}

/**
 * "Start speaking" chime — a NAATI-style ascending double-beep
 * played AFTER the dialogue and BEFORE the recording window opens.
 * The two-beep pattern is instantly recognisable from the real exam.
 */
export function playExamChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const t = audioCtx.currentTime;
      // First beep: 880 Hz (A5), 0.3 s
      playTone(audioCtx, 880, t, 0.30, 0.38);
      // Second beep: 1046 Hz (C6), 0.3 s — slightly higher, starts 0.38 s later
      playTone(audioCtx, 1046, t + 0.38, 0.30, 0.38);
      // Resolve after both beeps finish + a brief settle gap
      setTimeout(resolve, 900);
    } catch {
      resolve();
    }
  });
}

// Hook to speak text using correct voice/language
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, isHindi: boolean, onEnd?: () => void) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Find matching voice
    const voices = synthRef.current.getVoices();
    if (isHindi) {
      // Find Hindi voice
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.includes('Hindi'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
      // Real NAATI exam pace — deliberate and clear, not rushed
      utterance.rate = 0.72;
    } else {
      // Find English voice (prefer AU or standard EN)
      const englishVoice = voices.find(v => v.lang.startsWith('en-AU') || v.lang.startsWith('en-GB') || v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.lang = 'en-AU';
      // Real NAATI exam pace — measured Australian English delivery
      utterance.rate = 0.78;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      if (onEnd) onEnd();
    };

    synthRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeaking(false);
    }
  }, []);

  return { speak, stop, speaking };
}

// Hook to handle audio recording
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setAudioUrl(null);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks on the stream to turn off the microphone light
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Error starting audio recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const clearRecording = useCallback(() => {
    setAudioUrl(null);
    setRecording(false);
  }, []);

  return {
    recording,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording
  };
}
