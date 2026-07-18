/** Browser Web Speech API helpers (used instead of server TTS/STT). */

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function browserSpeechSupported() {
  return typeof window !== "undefined" && !!window.speechSynthesis && !!getSpeechRecognition();
}

/** Warm up voices so the first spoken reply is not delayed. */
export function prefetchSpeechVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  }, { once: true });
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => /en-US/i.test(v.lang) && /Google|Samantha|Neural|Natural/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang) && v.localService) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    voices[0]
  );
}

export function speakInBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    // Chrome sometimes pauses speechSynthesis mid-utterance — keep it alive
    const keepAlive = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        window.clearInterval(keepAlive);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 8_000);

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 1.15;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    const done = () => {
      window.clearInterval(keepAlive);
      resolve();
    };

    utterance.onend = done;
    utterance.onerror = done;

    // Small delay helps Chrome actually start speaking after cancel()
    window.setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 20);
  });
}

export function stopBrowserSpeech() {
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}

/** One-shot speech recognition (press stop to finish). */
export class BrowserSpeechRecognizer {
  private recognition: BrowserSpeechRecognition | null = null;
  private transcript = "";

  async start(): Promise<void> {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      throw new Error("Speech recognition is not supported in this browser. Use Chrome or Edge.");
    }

    this.transcript = "";
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          this.transcript += event.results[i][0].transcript;
        }
      }
    };

    this.recognition = recognition;
    recognition.start();
  }

  stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      const recognition = this.recognition;
      if (!recognition) {
        resolve("");
        return;
      }

      recognition.onend = () => {
        this.recognition = null;
        resolve(this.transcript.trim());
      };

      recognition.onerror = (event) => {
        this.recognition = null;
        reject(new Error(event.error || "Speech recognition failed."));
      };

      recognition.stop();
    });
  }
}
