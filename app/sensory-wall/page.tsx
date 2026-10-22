"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ButtonsAR from "../components/ButtonsAR";

type Texture =
  | "soft"
  | "rough"
  | "smooth"
  | "fluffy"
  | "hard"
  | "frizzy";

type WallItemId =
  | "buttons"
  | "whitewall"
  | "redwall"
  | "blackwall";

type WallItem = {
  id: WallItemId;
  name: string;
  shortName: string;
  emoji: string;
  correctTexture: Texture;
  introAudio: string;
  touchAudio: string;
  correctAudio: string;
  tryAgainAudio: string;
  hasAR: boolean;
  instruction: string;
};

const wallItems: WallItem[] = [
  {
    id: "buttons",
    name: "Buttons",
    shortName: "Buttons",
    emoji: "🔘",
    correctTexture: "hard",
    introAudio: "/audio/sensory-wall/buttons-intro.mp3",
    touchAudio: "/audio/sensory-wall/buttons-touch.mp3",
    correctAudio: "/audio/sensory-wall/buttons-correct.mp3",
    tryAgainAudio: "/audio/sensory-wall/buttons-try-again.mp3",
    hasAR: true,
    instruction:
      "Find the buttons in your sensory book. Touch them with your fingers and feel the texture.",
  },
  {
    id: "whitewall",
    name: "White Wall",
    shortName: "White Wall",
    emoji: "⬜",
    correctTexture: "frizzy",
    introAudio: "/audio/sensory-wall/whitewall-intro.mp3",
    touchAudio: "/audio/sensory-wall/whitewall-touch.mp3",
    correctAudio: "/audio/sensory-wall/whitewall-correct.mp3",
    tryAgainAudio: "/audio/sensory-wall/whitewall-try-again.mp3",
    hasAR: false,
    instruction:
      "Find the White Wall in your sensory book. Touch it carefully and feel its texture.",
  },
  {
    id: "redwall",
    name: "Red Wall",
    shortName: "Red Wall",
    emoji: "🟥",
    correctTexture: "soft",
    introAudio: "/audio/sensory-wall/redwall-intro.mp3",
    touchAudio: "/audio/sensory-wall/redwall-touch.mp3",
    correctAudio: "/audio/sensory-wall/redwall-correct.mp3",
    tryAgainAudio: "/audio/sensory-wall/redwall-try-again.mp3",
    hasAR: false,
    instruction:
      "Find the Red Wall in your sensory book. Touch it carefully and feel its texture.",
  },
  {
    id: "blackwall",
    name: "Black Wall",
    shortName: "Black Wall",
    emoji: "⬛",
    correctTexture: "smooth",
    introAudio: "/audio/sensory-wall/blackwall-intro.mp3",
    touchAudio: "/audio/sensory-wall/blackwall-touch.mp3",
    correctAudio: "/audio/sensory-wall/blackwall-correct.mp3",
    tryAgainAudio: "/audio/sensory-wall/blackwall-try-again.mp3",
    hasAR: false,
    instruction:
      "Find the Black Wall in your sensory book. Touch it carefully and feel its texture.",
  },
];

const textureChoices: {
  id: Texture;
  label: string;
  emoji: string;
}[] = [
  { id: "soft", label: "Soft", emoji: "☁️" },
  { id: "rough", label: "Rough", emoji: "🪨" },
  { id: "smooth", label: "Smooth", emoji: "💧" },
  { id: "fluffy", label: "Fluffy", emoji: "🧶" },
  { id: "hard", label: "Hard", emoji: "🧱" },
  { id: "frizzy", label: "Frizzy", emoji: "〰️" },
];

export default function SensoryWallPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [showQuestion, setShowQuestion] = useState(false);
  const [answer, setAnswer] = useState<Texture | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentItem = wallItems[currentIndex];

  const isCorrect =
    answer === currentItem.correctTexture;

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsPlaying(false);
  }

  function playAudio(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);

      audioRef.current = audio;

      audio.onended = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }

        resolve();
      };

      audio.onerror = () => {
        console.error("Audio failed:", src);

        if (audioRef.current === audio) {
          audioRef.current = null;
        }

        reject(new Error(`Audio failed: ${src}`));
      };

      audio.play().catch((error) => {
        console.error("Audio play error:", src, error);
        reject(error);
      });
    });
  }

  function wait(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function playInstruction() {
    if (isPlaying) return;

    stopAudio();

    setAnswer(null);
    setShowQuestion(false);
    setIsPlaying(true);

    try {
      await playAudio(currentItem.introAudio);

      await wait(350);

      await playAudio(currentItem.touchAudio);

      await wait(300);

      setShowQuestion(true);
    } catch (error) {
      console.error("Sensory Wall audio error:", error);
    } finally {
      setIsPlaying(false);
    }
  }

  async function selectAnswer(selected: Texture) {
    if (isPlaying || isCorrect) return;

    stopAudio();

    setAnswer(selected);
    setIsPlaying(true);

    try {
      if (selected === currentItem.correctTexture) {
        await playAudio(currentItem.correctAudio);
      } else {
        await playAudio(currentItem.tryAgainAudio);

        setAnswer(null);
      }
    } catch (error) {
      console.error("Answer audio error:", error);
    } finally {
      setIsPlaying(false);
    }
  }

  async function startCamera() {
    try {
      setLoading(true);
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera is not supported by this browser."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOn(true);
    } catch (error) {
      console.error("Camera error:", error);

      setCameraError(
        "Unable to access the camera. Please allow camera permission and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function stopCamera() {
    stopAudio();

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setShowQuestion(false);
    setAnswer(null);
  }

  function nextItem() {
    stopAudio();

    if (currentIndex < wallItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setAnswer(null);
      setShowQuestion(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      finishActivity();
    }
  }

  function finishActivity() {
    stopAudio();

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setCompleted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function restartActivity() {
    stopAudio();

    setCurrentIndex(0);
    setAnswer(null);
    setShowQuestion(false);
    setCompleted(false);
    setCameraError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  if (completed) {
    return (
      <main className="min-h-screen bg-[#fffdf8] text-slate-800">
        <header className="border-b border-orange-100 bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <Link href="/">
              <Image
                src="/images/sense-ar-logo.png"
                alt="SENSE-AR Logo"
                width={150}
                height={90}
                className="h-[58px] w-auto object-contain"
                priority
              />
            </Link>

            <Link
              href="/"
              className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700"
            >
              ← Home
            </Link>
          </div>
        </header>

        <section className="flex min-h-[78vh] items-center justify-center px-5 py-12">
          <div className="w-full max-w-2xl rounded-[36px] border border-yellow-100 bg-white p-8 text-center shadow-xl md:p-12">
            <div className="text-7xl">🏆</div>

            <div className="mt-4 text-3xl">
              ⭐ ⭐ ⭐
            </div>

            <h1 className="mt-5 text-3xl font-black text-slate-900 md:text-4xl">
              Amazing Job!
            </h1>

            <p className="mt-3 text-lg font-bold text-emerald-600">
              Sensory Wall Complete!
            </p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              You explored four different sensory
              surfaces and discovered how each one feels.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
              {wallItems.map((item) => {
                const texture = textureChoices.find(
                  (choice) =>
                    choice.id === item.correctTexture
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-orange-50 p-4"
                  >
                    <div className="text-4xl">
                      {item.emoji}
                    </div>

                    <p className="mt-2 text-sm font-black text-slate-800">
                      {item.shortName}
                    </p>

                    <p className="mt-1 text-xs font-black text-emerald-600">
                      {texture?.emoji} {texture?.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={restartActivity}
              className="mt-8 w-full rounded-2xl bg-orange-500 px-6 py-4 font-black text-white shadow-lg transition hover:bg-orange-600"
            >
              🔄 Play Again
            </button>

            <Link
              href="/"
              className="mt-3 block w-full rounded-2xl bg-slate-100 px-6 py-4 font-black text-slate-700 transition hover:bg-slate-200"
            >
              🏠 Back to Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] text-slate-800">
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/">
            <Image
              src="/images/sense-ar-logo.png"
              alt="SENSE-AR Logo"
              width={150}
              height={90}
              className="h-[58px] w-auto object-contain"
              priority
            />
          </Link>

          <Link
            href="/"
            className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-orange-100"
          >
            ← Home
          </Link>
        </div>
      </header>

      <section className="px-5 pb-3 pt-7 text-center">
        <div className="inline-flex rounded-full bg-purple-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-purple-700">
          Sensory • Tactile Exploration
        </div>

        <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
          Sensory Wall
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 md:text-base">
          Touch, explore and discover different
          textures in your sensory book.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{
              width: `${
                ((currentIndex + 1) / wallItems.length) *
                100
              }%`,
            }}
          />
        </div>

        <p className="mt-2 text-center text-xs font-bold text-slate-400">
          {currentItem.emoji} {currentItem.name} •{" "}
          {currentIndex + 1} of {wallItems.length}
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-4 md:px-5">
        <div className="overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-xl">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950 md:aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${
                cameraOn ? "block" : "hidden"
              }`}
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-950 to-orange-900 p-6 text-center">
                <div className="text-7xl">
                  ✋
                </div>

                <h2 className="mt-5 text-2xl font-black text-white">
                  Explore the Sensory Wall
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-orange-100">
                  Start the camera and explore the
                  sensory surfaces in your book.
                </p>

                <button
                  onClick={startCamera}
                  disabled={loading}
                  className="mt-6 rounded-2xl bg-orange-500 px-8 py-4 font-black text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {loading
                    ? "Opening Camera..."
                    : "📷 Start Activity"}
                </button>

                {cameraError && (
                  <p className="mt-4 max-w-sm rounded-xl bg-red-500/20 px-4 py-3 text-xs font-bold text-red-200">
                    {cameraError}
                  </p>
                )}
              </div>
            )}

            {cameraOn && (
              <>
                {currentItem.id === "buttons" && (
                  <ButtonsAR />
                )}

                <div className="pointer-events-none absolute left-4 top-4 z-30">
                  <div className="rounded-full bg-black/45 px-4 py-2 text-[10px] font-black text-white backdrop-blur-md">
                    {currentItem.hasAR
                      ? "✨ SENSE-AR LIVE"
                      : "✋ PHYSICAL SENSORY"}
                  </div>
                </div>

                <button
                  onClick={stopCamera}
                  aria-label="Close activity"
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-xl font-bold text-white"
                >
                  ×
                </button>

                {!currentItem.hasAR && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
                    <div className="rounded-[28px] bg-black/45 px-7 py-6 text-center text-white backdrop-blur-sm">
                      <div className="text-6xl">
                        {currentItem.emoji}
                      </div>

                      <p className="mt-3 text-xl font-black">
                        Find the {currentItem.name}
                      </p>

                      <p className="mt-1 max-w-xs text-sm text-white/85">
                        Look at your sensory book and
                        touch the real surface.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
                  <div className="whitespace-nowrap rounded-full bg-black/50 px-5 py-2.5 text-sm font-black text-white backdrop-blur-md">
                    {currentItem.emoji}{" "}
                    {currentItem.hasAR
                      ? `Look at the ${currentItem.name}`
                      : `Touch the ${currentItem.name}`}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {cameraOn && (
        <section className="mx-auto max-w-4xl px-4 pb-8 md:px-5">
          <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-lg md:p-7">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Listen & Explore
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Listen carefully and follow the
                instruction.
              </p>

              <button
                onClick={playInstruction}
                disabled={isPlaying}
                className={`mt-4 w-full rounded-2xl px-6 py-4 text-base font-black text-white shadow-lg transition ${
                  isPlaying
                    ? "cursor-not-allowed bg-orange-300"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isPlaying
                  ? "🔊 Playing..."
                  : "🔊 Listen"}
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-orange-50 p-5 text-center">
              <div className="text-4xl">
                {currentItem.emoji}
              </div>

              <h3 className="mt-2 text-lg font-black text-slate-900">
                Touch the {currentItem.name}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">
                {currentItem.instruction}
              </p>
            </div>

            {showQuestion && (
              <div className="mt-6">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                  Step 2
                </p>

                <h3 className="mt-2 text-center text-xl font-black text-slate-900">
                  How does it feel?
                </h3>

                <p className="mt-1 text-center text-sm text-slate-500">
                  Choose your answer.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {textureChoices.map((texture) => {
                    const selected =
                      answer === texture.id;

                    const selectedCorrect =
                      selected &&
                      texture.id ===
                        currentItem.correctTexture;

                    const selectedWrong =
                      selected && !selectedCorrect;

                    return (
                      <button
                        key={texture.id}
                        onClick={() =>
                          selectAnswer(texture.id)
                        }
                        disabled={
                          isPlaying || isCorrect
                        }
                        className={`rounded-2xl border-2 px-3 py-4 font-black transition disabled:cursor-not-allowed ${
                          selectedCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : selectedWrong
                              ? "border-red-400 bg-red-400 text-white"
                              : "border-slate-100 bg-slate-50 text-slate-700 hover:border-orange-300 hover:bg-orange-50"
                        }`}
                      >
                        <div className="text-3xl">
                          {texture.emoji}
                        </div>

                        <div className="mt-1 text-sm">
                          {texture.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isCorrect && (
              <div className="mt-6 rounded-[24px] bg-gradient-to-r from-emerald-50 to-yellow-50 p-6 text-center">
                <div className="text-5xl">
                  ⭐
                </div>

                <h3 className="mt-2 text-2xl font-black text-emerald-700">
                  Great Job!
                </h3>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  The {currentItem.name} feels{" "}
                  {currentItem.correctTexture}!
                </p>

                <div className="mt-4 text-2xl">
                  ⭐ ⭐ ⭐
                </div>

                <button
                  onClick={nextItem}
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white shadow-lg transition hover:bg-emerald-600"
                >
                  {currentIndex <
                  wallItems.length - 1
                    ? `Next: ${
                        wallItems[currentIndex + 1]
                          .name
                      } →`
                    : "Finish Activity 🏆"}
                </button>
              </div>
            )}

            {answer && !isCorrect && (
              <div className="mt-5 rounded-2xl bg-orange-50 p-5 text-center">
                <div className="text-3xl">
                  🤔
                </div>

                <h3 className="mt-2 font-black text-orange-700">
                  Let&apos;s Try Again!
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Touch the {currentItem.name} one
                  more time and feel the texture
                  carefully.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-5 pb-12">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-purple-50 p-3">
            <div className="text-xl">👀</div>
            <p className="mt-1 text-[10px] font-bold text-purple-700">
              Visual
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-3">
            <div className="text-xl">🔊</div>
            <p className="mt-1 text-[10px] font-bold text-blue-700">
              Auditory
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-3">
            <div className="text-xl">✋</div>
            <p className="mt-1 text-[10px] font-bold text-orange-700">
              Tactile
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="text-xl">🧠</div>
            <p className="mt-1 text-[10px] font-bold text-emerald-700">
              Recognition
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Image
            src="/images/sense-ar-logo.png"
            alt="SENSE-AR Logo"
            width={90}
            height={55}
            className="h-[40px] w-auto object-contain"
          />

          <p className="text-xs font-semibold text-slate-400">
            Touch • Learn • Explore
          </p>
        </div>
      </footer>
    </main>
  );
}