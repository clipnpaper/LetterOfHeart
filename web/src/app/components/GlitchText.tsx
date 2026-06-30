import { useState, useEffect } from "react";

// Hangul character pool for glitch characters
const HANGUL_CHARS = "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후그느드르므브스으즈츠크트프흐기니디리미비시이지치키티피히ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ";

interface GlitchTextProps {
  text: string;
}

export function GlitchText({ text }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      return;
    }

    let frame = 0;
    const maxFrames = 30; // Glitch duration: 30 frames
    const fps = 30;       // 30 FPS
    const intervalTime = 1000 / fps; // ~33.3ms per frame

    const interval = setInterval(() => {
      frame++;
      if (frame >= maxFrames) {
        // Simultaneously recover to the original text on the 30th frame
        setDisplayText(text);
        clearInterval(interval);
      } else {
        // Simultaneously show glitched Korean characters for all letters
        const glitched = text
          .split("")
          .map((char) => {
            // Keep spaces or quotes untouched for better readability/layout
            if (char === " " || char === '"' || char === "'") {
              return char;
            }
            const randomIndex = Math.floor(Math.random() * HANGUL_CHARS.length);
            return HANGUL_CHARS[randomIndex];
          })
          .join("");
        setDisplayText(glitched);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayText}</span>;
}
