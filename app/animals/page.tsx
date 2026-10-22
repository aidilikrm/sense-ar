"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import SheepAR from "../components/SheepAR";
import SnakeAR from "../components/SnakeAR";
import JellyfishAR from "../components/JellyfishAR";

type AnimalId = "sheep" | "snake" | "jellyfish";
type Texture = "soft" | "rough" | "smooth";

type AnimalData = {
  id: AnimalId;
  name: string;
  emoji: string;
  correctAnswer: Texture;
  correctText: string;
  introAudio: string;
  soundAudio: string;
  touchAudio: string;
  correctAudio: string;
  tryAgainAudio: string;
};

const animals: AnimalData[] = [
  {
    id: "sheep",
    name: "Sheep",
    emoji: "🐑",
    correctAnswer: "soft",
    correctText: "The sheep is soft and fluffy!",
    introAudio: "/audio/animals/sheep-intro.mpeg",
    soundAudio: "/audio/animals/sheep-sound.mp3",
    touchAudio: "/audio/animals/sheep-touch.mpeg",
    correctAudio: "/audio/animals/sheep-correct.mp3",
    tryAgainAudio: "/audio/animals/sheep-try-again.mp3",
  },

  {
    id: "snake",
    name: "Snake",
    emoji: "🐍",
    correctAnswer: "smooth",
    correctText: "The snake feels smooth!",
    introAudio: "/audio/animals/snake-intro.mp3",
    soundAudio: "/audio/animals/snake-sound.mp3",
    touchAudio: "/audio/animals/snake-touch.mp3",
    correctAudio: "/audio/animals/snake-correct.mp3",
    tryAgainAudio: "/audio/animals/snake-try-again.mp3",
  },

  {
    id: "jellyfish",
    name: "Jellyfish",
    emoji: "🪼",
    correctAnswer: "smooth",
    correctText: "The jellyfish feels smooth!",
    introAudio: "/audio/animals/jellyfish-intro.mpeg",
    soundAudio: "/audio/animals/jellyfish-sound.mp3",
    touchAudio: "/audio/animals/jellyfish-touch.mpeg",
    correctAudio: "/audio/animals/jellyfish-correct.mpeg",
    tryAgainAudio: "/audio/animals/jellyfish-try-again.mpeg",
  },
];

export default function AnimalsPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [answer, setAnswer] = useState<Texture | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [completed, setCompleted] = useState(false);

  const currentAnimal = animals[currentIndex];

  // =====================================================
  // AUDIO
  // =====================================================

  function stopAudio() {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    setIsPlaying(false);
  }

  function playAudio(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);

      currentAudioRef.current = audio;

      audio.onended = () => {
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }

        resolve();
      };

      audio.onerror = () => {
        console.error("Audio failed:", src);

        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
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

  // =====================================================
  // LISTEN
  // =====================================================

  async function playAnimalInstruction() {
    if (isPlaying) return;

    stopAudio();

    setAnswer(null);
    setShowQuestion(false);
    setIsPlaying(true);

    try {
      // 1 - Intro
      await playAudio(currentAnimal.introAudio);

      await wait(300);

      // 2 - Animal sound
      await playAudio(currentAnimal.soundAudio);

      await wait(350);

      // 3 - Touch instruction
      await playAudio(currentAnimal.touchAudio);

      await wait(250);

      setShowQuestion(true);
    } catch (error) {
      console.error(
        `${currentAnimal.name} audio error:`,
        error
      );
    } finally {
      setIsPlaying(false);
    }
  }

  // =====================================================
  // ANSWER
  // =====================================================

  async function selectAnswer(selected: Texture) {
    if (isPlaying) return;

    stopAudio();

    setAnswer(selected);
    setIsPlaying(true);

    try {
      if (selected === currentAnimal.correctAnswer) {
        await playAudio(currentAnimal.correctAudio);
      } else {
        await playAudio(currentAnimal.tryAgainAudio);

        setAnswer(null);
      }
    } catch (error) {
      console.error("Answer audio error:", error);
    } finally {
      setIsPlaying(false);
    }
  }

  // =====================================================
  // NEXT
  // =====================================================

  function nextAnimal() {
    stopAudio();

    if (currentIndex < animals.length - 1) {
      setCurrentIndex((previous) => previous + 1);

      setAnswer(null);
      setShowQuestion(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    finishActivity();
  }

  // =====================================================
  // CAMERA
  // =====================================================

  async function startCamera() {
    try {
      setLoading(true);
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera is not supported by this browser."
        );

        setLoading(false);
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
        "Unable to access camera. Please allow camera permission."
      );
    } finally {
      setLoading(false);
    }
  }

  function stopCamera() {
    stopAudio();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setAnswer(null);
    setShowQuestion(false);
  }

  // =====================================================
  // FINISH
  // =====================================================

  function finishActivity() {
    stopAudio();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

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

  // =====================================================
  // RESTART
  // =====================================================

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

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // =====================================================
  // COMPLETE PAGE
  // =====================================================

  if (completed) {
    return (
      <main className="min-h-screen bg-[#fffdf8] text-slate-800">

        <header className="border-b border-orange-100 bg-white shadow-sm">

          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">

            <Link href="/">
              <Image
                src="/images/sense-ar-logo.png"
                alt="SENSE-AR"
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

          <div className="w-full max-w-xl rounded-[36px] bg-white p-8 text-center shadow-xl md:p-12">

            <div className="text-7xl">
              🏆
            </div>

            <div className="mt-4 text-3xl">
              ⭐ ⭐ ⭐
            </div>

            <h1 className="mt-5 text-4xl font-black text-slate-900">
              Amazing Job!
            </h1>

            <p className="mt-3 text-lg font-bold text-emerald-600">
              Animals & Texture Complete!
            </p>

            <div className="mt-7 grid grid-cols-3 gap-3">

              <div className="rounded-2xl bg-orange-50 p-4">
                <div className="text-4xl">
                  🐑
                </div>

                <p className="mt-2 font-black">
                  Sheep
                </p>

                <p className="text-xs font-bold text-emerald-600">
                  Soft
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-4xl">
                  🐍
                </div>

                <p className="mt-2 font-black">
                  Snake
                </p>

                <p className="text-xs font-bold text-emerald-600">
                  Smooth
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="text-4xl">
                  🪼
                </div>

                <p className="mt-2 font-black">
                  Jellyfish
                </p>

                <p className="text-xs font-bold text-emerald-600">
                  Smooth
                </p>
              </div>

            </div>

            <button
              onClick={restartActivity}
              className="mt-8 w-full rounded-2xl bg-orange-500 px-6 py-4 font-black text-white"
            >
              🔄 Play Again
            </button>

            <Link
              href="/"
              className="mt-3 block rounded-2xl bg-slate-100 px-6 py-4 font-black text-slate-700"
            >
              🏠 Back to Home
            </Link>

          </div>

        </section>

      </main>
    );
  }

  const isCorrect =
    answer === currentAnimal.correctAnswer;

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-[#fffdf8] text-slate-800">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 shadow-sm">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">

          <Link href="/">
            <Image
              src="/images/sense-ar-logo.png"
              alt="SENSE-AR"
              width={150}
              height={90}
              className="h-[58px] w-auto object-contain"
              priority
            />
          </Link>

          <Link
            href="/"
            className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold"
          >
            ← Home
          </Link>

        </div>

      </header>

      {/* TITLE */}

      <section className="px-5 pb-3 pt-7 text-center">

        <div className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700">
          AR • Sensory Exploration
        </div>

        <h1 className="mt-4 text-3xl font-black md:text-5xl">
          Animals & Texture
        </h1>

        <p className="mt-2 text-slate-500">
          Look, listen, touch and explore.
        </p>

      </section>

      {/* PROGRESS */}

      <section className="mx-auto max-w-4xl px-5 py-4">

        <div className="flex justify-center gap-2">

          {animals.map((animal, index) => (
            <div
              key={animal.id}
              className={`h-2 w-16 rounded-full ${
                index <= currentIndex
                  ? "bg-orange-500"
                  : "bg-slate-200"
              }`}
            />
          ))}

        </div>

        <p className="mt-2 text-center text-xs font-bold text-slate-400">
          Animal {currentIndex + 1} of 3 •{" "}
          {currentAnimal.name}
        </p>

      </section>

      {/* CAMERA */}

      <section className="mx-auto max-w-4xl px-4 py-4">

        <div className="overflow-hidden rounded-[30px] bg-white shadow-xl">

          <div className="relative aspect-[4/5] overflow-hidden bg-slate-950 md:aspect-video">

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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">

                <div className="text-7xl">
                  {currentAnimal.emoji}
                </div>

                <h2 className="mt-5 text-2xl font-black text-white">
                  Meet the {currentAnimal.name}
                </h2>

                <button
                  onClick={startCamera}
                  disabled={loading}
                  className="mt-6 rounded-2xl bg-orange-500 px-8 py-4 font-black text-white"
                >
                  {loading
                    ? "Opening Camera..."
                    : "📷 Start Activity"}
                </button>

                {cameraError && (
                  <p className="mt-4 text-sm text-red-300">
                    {cameraError}
                  </p>
                )}

              </div>
            )}

            {cameraOn && (
              <>
                <div className="absolute left-4 top-4 z-30 rounded-full bg-black/50 px-4 py-2 text-xs font-black text-white">
                  ✨ SENSE-AR LIVE
                </div>

                <button
                  onClick={stopCamera}
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-xl text-white"
                >
                  ×
                </button>

                {/* 3D ANIMAL */}

                {currentAnimal.id === "sheep" && (
                  <SheepAR />
                )}

                {currentAnimal.id === "snake" && (
                  <SnakeAR />
                )}

                {currentAnimal.id === "jellyfish" && (
                  <JellyfishAR />
                )}

                <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/50 px-5 py-2 text-sm font-black text-white">
                  {currentAnimal.emoji} Look at the{" "}
                  {currentAnimal.name.toLowerCase()}
                </div>
              </>
            )}

          </div>

        </div>

      </section>

      {/* ACTIVITY */}

      {cameraOn && (
        <section className="mx-auto max-w-4xl px-4 pb-10">

          <div className="rounded-[28px] bg-white p-6 shadow-lg">

            <div className="text-center">

              <p className="text-xs font-black uppercase tracking-widest text-orange-500">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-black">
                Listen & Explore
              </h2>

              <button
                onClick={playAnimalInstruction}
                disabled={isPlaying}
                className="mt-4 w-full rounded-2xl bg-orange-500 px-6 py-4 font-black text-white disabled:bg-orange-300"
              >
                {isPlaying
                  ? "🔊 Playing..."
                  : "🔊 Listen"}
              </button>

            </div>

            <div className="mt-5 rounded-2xl bg-orange-50 p-5 text-center">

              <div className="text-4xl">
                ✋
              </div>

              <h3 className="mt-2 text-lg font-black">
                Touch the {currentAnimal.name}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Find the{" "}
                {currentAnimal.name.toLowerCase()} in
                your sensory book and feel its texture.
              </p>

            </div>

            {/* QUESTION */}

            {showQuestion && (
              <div className="mt-6">

                <p className="text-center text-xs font-black uppercase tracking-widest text-blue-500">
                  Step 2
                </p>

                <h3 className="mt-2 text-center text-xl font-black">
                  How does it feel?
                </h3>

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <button
                    onClick={() => selectAnswer("soft")}
                    disabled={isPlaying || isCorrect}
                    className="rounded-2xl bg-emerald-50 p-4 font-black text-emerald-700"
                  >
                    <div className="text-2xl">
                      ☁️
                    </div>
                    Soft
                  </button>

                  <button
                    onClick={() => selectAnswer("rough")}
                    disabled={isPlaying || isCorrect}
                    className="rounded-2xl bg-orange-50 p-4 font-black text-orange-700"
                  >
                    <div className="text-2xl">
                      🪨
                    </div>
                    Rough
                  </button>

                  <button
                    onClick={() => selectAnswer("smooth")}
                    disabled={isPlaying || isCorrect}
                    className="rounded-2xl bg-blue-50 p-4 font-black text-blue-700"
                  >
                    <div className="text-2xl">
                      💧
                    </div>
                    Smooth
                  </button>

                </div>

              </div>
            )}

            {/* CORRECT */}

            {isCorrect && (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center">

                <div className="text-5xl">
                  ⭐
                </div>

                <h3 className="mt-2 text-2xl font-black text-emerald-700">
                  Great Job!
                </h3>

                <p className="mt-2 text-sm">
                  {currentAnimal.correctText}
                </p>

                <button
                  onClick={nextAnimal}
                  className="mt-5 w-full rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white"
                >
                  {currentIndex < animals.length - 1
                    ? `Next Animal ${
                        animals[currentIndex + 1].emoji
                      }`
                    : "Finish Activity 🏆"}
                </button>

              </div>
            )}

          </div>

        </section>
      )}

    </main>
  );
}