"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CrocodileAR from "../components/CrocodileAR";

type Texture = "soft" | "rough" | "smooth";

export default function CrocodilePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [showQuestion, setShowQuestion] = useState(false);
  const [answer, setAnswer] = useState<Texture | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);

  // =====================================================
  // AUDIO
  // =====================================================

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

  // =====================================================
  // LISTEN
  // =====================================================

  async function playInstruction() {
    if (isPlaying) return;

    stopAudio();

    setAnswer(null);
    setShowQuestion(false);
    setIsPlaying(true);

    try {
      // INTRO
      await playAudio(
        "/audio/crocodile/crocodileteeth-intro.mpeg"
      );

      await wait(400);

      // TOUCH INSTRUCTION
      await playAudio(
        "/audio/crocodile/crocodileteeth-touch.mpeg"
      );

      await wait(300);

      setShowQuestion(true);
    } catch (error) {
      console.error(
        "Crocodile audio error:",
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
      // CORRECT ANSWER = ROUGH
      if (selected === "rough") {
        await playAudio(
          "/audio/crocodile/crocodileteeth-correct.mpeg"
        );

        setIsPlaying(false);
        return;
      }

      // WRONG
      await playAudio(
        "/audio/crocodile/crocodileteeth-try-again.mpeg"
      );

      setAnswer(null);
    } catch (error) {
      console.error(
        "Answer audio error:",
        error
      );
    } finally {
      setIsPlaying(false);
    }
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
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setShowQuestion(false);
    setAnswer(null);
  }

  // =====================================================
  // FINISH
  // =====================================================

  function finishActivity() {
    stopAudio();

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
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
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
    };
  }, []);

  // =====================================================
  // COMPLETE SCREEN
  // =====================================================

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

          <div className="w-full max-w-xl rounded-[36px] bg-white p-8 text-center shadow-xl md:p-12">

            <div className="text-7xl">
              🐊
            </div>

            <div className="mt-4 text-3xl">
              ⭐ ⭐ ⭐
            </div>

            <h1 className="mt-5 text-4xl font-black text-slate-900">
              Amazing Job!
            </h1>

            <p className="mt-3 text-lg font-bold text-emerald-600">
              Crocodile Texture Complete!
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-3xl bg-emerald-50 p-6">

              <div className="text-5xl">
                🐊
              </div>

              <h2 className="mt-3 text-xl font-black text-slate-800">
                Crocodile
              </h2>

              <p className="mt-1 font-bold text-emerald-600">
                Rough
              </p>

            </div>

            <button
              onClick={restartActivity}
              className="mt-8 w-full rounded-2xl bg-orange-500 px-6 py-4 font-black text-white shadow-lg"
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

  const isCorrect = answer === "rough";

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

      {/* TITLE */}

      <section className="px-5 pb-3 pt-7 text-center">

        <div className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
          AR • Sensory Exploration
        </div>

        <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
          Crocodile Texture
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Look, listen, touch and explore.
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
                cameraOn
                  ? "block"
                  : "hidden"
              }`}
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">

                <div className="text-7xl">
                  🐊
                </div>

                <h2 className="mt-5 text-2xl font-black text-white">
                  Meet the Crocodile
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Start the camera to explore.
                </p>

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
                  <p className="mt-4 text-sm font-bold text-red-300">
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

                <CrocodileAR />

                <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/50 px-5 py-2 text-sm font-black text-white">
                  🐊 Look at the crocodile
                </div>
              </>
            )}

          </div>

        </div>

      </section>

      {/* INTERACTION */}

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
                onClick={playInstruction}
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
                Touch the Crocodile
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Find the crocodile in your sensory book
                and feel the texture with your fingers.
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

                <p className="mt-1 text-center text-sm text-slate-500">
                  Choose your answer.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <button
                    onClick={() =>
                      selectAnswer("soft")
                    }
                    disabled={
                      isPlaying || isCorrect
                    }
                    className="rounded-2xl bg-emerald-50 p-4 font-black text-emerald-700"
                  >
                    <div className="text-2xl">
                      ☁️
                    </div>
                    Soft
                  </button>

                  <button
                    onClick={() =>
                      selectAnswer("rough")
                    }
                    disabled={
                      isPlaying || isCorrect
                    }
                    className={`rounded-2xl p-4 font-black ${
                      isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    <div className="text-2xl">
                      🪨
                    </div>
                    Rough
                  </button>

                  <button
                    onClick={() =>
                      selectAnswer("smooth")
                    }
                    disabled={
                      isPlaying || isCorrect
                    }
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

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  The crocodile feels rough!
                </p>

                <button
                  onClick={finishActivity}
                  className="mt-5 w-full rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white"
                >
                  Finish Activity 🏆
                </button>

              </div>
            )}

          </div>

        </section>
      )}

    </main>
  );
}