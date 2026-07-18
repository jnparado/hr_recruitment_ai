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

export function speakInBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
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
