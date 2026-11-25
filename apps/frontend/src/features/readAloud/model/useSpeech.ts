import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeForSpeech, splitSentences } from "../lib/normalizeForSpeech";

const speechSynthesis =
  typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;

const findRuVoice = () =>
  speechSynthesis
    ?.getVoices()
    .find((v) => v.lang.toLowerCase().startsWith("ru")) ?? null;

export function useSpeech() {
  const [voice, setVoice] = useState(findRuVoice);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // номер текущей озвучки
  // события отменённой реплики не должны сбрасывать состояние новой (в гонке)
  const token = useRef(0);

  useEffect(() => {
    if (!speechSynthesis) return;
    // в Chrome голоса подгружаются асинхронно, список может быть пуст
    const update = () => setVoice(findRuVoice());
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", update);
      token.current++;
      speechSynthesis.cancel();
    };
  }, []);

  const toggle = useCallback(
    (index: number, text: string) => {
      if (!speechSynthesis || !voice) return;
      const mine = ++token.current;
      speechSynthesis.cancel();

      // повторное нажатие на читаемый шаг — остановка
      if (activeIndex === index) {
        setActiveIndex(null);
        return;
      }

      const chunks = splitSentences(normalizeForSpeech(text));
      if (chunks.length === 0) return;
      setActiveIndex(index);
      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        const finish = () => {
          if (token.current === mine && index === chunks.length - 1) {
            setActiveIndex(null);
          }
        };
        utterance.onend = finish;
        utterance.onerror = finish;
        speechSynthesis.speak(utterance);
      });
    },
    [voice, activeIndex],
  );

  return { supported: voice !== null, activeIndex, toggle };
}
