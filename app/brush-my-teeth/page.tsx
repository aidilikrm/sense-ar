"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import CrocodileAR from "../components/CrocodileAR";

type Texture = "soft" | "rough" | "smooth";

export default function BrushMyTeethPage() {
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
  // LISTEN & EXPLORE
  // =====================================================

  async function playInstruction() {
    if (isPlaying) return;

    stopAudio();

    setAnswer(null);
    setShowQuestion(false);
    setIsPlaying(true);

    try {
      // 1. INTRO
      await playAudio(
        "/audio/crocodile/crocodileteeth-intro.mpeg"
      );

      await wait(350);

      // 2. TOUCH INSTRUCTION
      await playAudio(
        "/audio/crocodile/crocodileteeth-touch.mpeg"
      );

      await wait(300);

      // 3. SHOW QUESTION
      setShowQuestion(true);
    } catch (error) {
      console.error(
        "Crocodile audio sequence error:",
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
      // CORRECT = ROUGH
      if (selected === "rough") {
        await playAudio(
          "/audio/crocodile/crocodileteeth-correct.mpeg"
        );

        return;
      }

      // WRONG
      await playAudio(
        "/audio/crocodile/crocodileteeth-try-again.mpeg"
      );

      // Allow child to answer again
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
  // CLEAN UP
  // =====================================================

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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
  // ACTIVITY COMPLETE
  // =====================================================

  if (completed) {
    return (
      <main className="min-h-screen bg-[#fffdf8] text-slate-800">

        {/* HEADER */}

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

        {/* COMPLETE CARD */}

        <section className="flex min-h-[78vh] items-center justify-center px-5 py-12">

          <div className="w-full max-w-xl rounded-[36px] border border-yellow-100 bg-white p-8 text-center shadow-xl md:p-12">

            <div className="text-7xl">
              🏆
            </div>

            <div className="mt-4 text-3xl">
              ⭐ ⭐ ⭐
            </div>

            <h1 className="mt-5 text-3xl font-black text-slate-900 md:text-4xl">
              Amazing Job!
            </h1>

            <p className="mt-3 text-lg font-bold text-emerald-600">
              Brush My Teeth Complete!
            </p>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              You explored the crocodile teeth and discovered
              their texture.
            </p>

            <div className="mx-auto mt-7 max-w-sm rounded-[28px] bg-emerald-50 p-6">

              <div className="text-6xl">
                🐊
              </div>

              <h2 className="mt-3 text-xl font-black text-slate-800">
                Crocodile Teeth
              </h2>

              <div className="mx-auto mt-3 inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-emerald-600 shadow-sm">
                🪨 Rough
              </div>

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

  const isCorrect = answer === "rough";

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-[#fffdf8] text-slate-800">

      {/* HEADER */}

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

      {/* TITLE */}

      <section className="px-5 pb-3 pt-7 text-center">

        <div className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-700">
          AR • Self-Care Skills
        </div>

        <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
          Brush My Teeth
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 md:text-base">
          Meet the crocodile and explore its teeth.
        </p>

      </section>

      {/* PROGRESS */}

      <section className="mx-auto max-w-4xl px-5 py-4">

        <div className="flex justify-center">

          <div className="h-2 w-32 rounded-full bg-orange-500" />

        </div>

        <p className="mt-2 text-center text-xs font-bold text-slate-400">
          Crocodile Teeth
        </p>

      </section>

      {/* CAMERA / AR */}

      <section className="mx-auto max-w-4xl px-4 py-4 md:px-5">

        <div className="overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-xl">

          <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950 md:aspect-video">

            {/* CAMERA */}

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

            {/* CAMERA OFF */}

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center">

                <div className="text-7xl">
                  🐊
                </div>

                <h2 className="mt-5 text-2xl font-black text-white">
                  Meet the Crocodile
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">
                  Start the camera and explore the
                  crocodile&apos;s teeth.
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

            {/* CAMERA ON */}

            {cameraOn && (
              <>

                <div className="pointer-events-none absolute left-4 top-4 z-30">

                  <div className="rounded-full bg-black/45 px-4 py-2 text-[10px] font-black text-white backdrop-blur-md">
                    ✨ SENSE-AR LIVE
                  </div>

                </div>

                <button
                  onClick={stopCamera}
                  aria-label="Close activity"
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-xl font-bold text-white"
                >
                  ×
                </button>

                {/* CROCODILE 3D */}

                <CrocodileAR />

                {/* LABEL */}

                <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">

                  <div className="whitespace-nowrap rounded-full bg-black/50 px-5 py-2.5 text-sm font-black text-white backdrop-blur-md">
                    🐊 Look at the crocodile
                  </div>

                </div>

              </>
            )}

          </div>

        </div>

      </section>

      {/* INTERACTION */}

      {cameraOn && (
        <section className="mx-auto max-w-4xl px-4 pb-8 md:px-5">

          <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-lg md:p-7">

            {/* STEP 1 */}

            <div className="text-center">

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Listen & Explore
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Listen carefully and follow the activity.
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

            {/* TOUCH CARD */}

            <div className="mt-5 rounded-2xl bg-orange-50 p-5 text-center">

              <div className="text-4xl">
                🦷
              </div>

              <h3 className="mt-2 text-lg font-black text-slate-900">
                Touch the Crocodile Teeth
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">
                Find the crocodile teeth in your sensory
                book. Touch them with your fingers and feel
                the texture.
              </p>

            </div>

            {/* QUESTION */}

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

                <div className="mt-5 grid grid-cols-3 gap-2 md:gap-3">

                  {/* SOFT */}

                  <button
                    onClick={() => selectAnswer("soft")}
                    disabled={isPlaying || isCorrect}
                    className={`rounded-2xl border-2 px-2 py-4 font-black transition disabled:cursor-not-allowed ${
                      answer === "soft"
                        ? "border-red-400 bg-red-400 text-white"
                        : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                    }`}
                  >
                    <div className="text-2xl">
                      ☁️
                    </div>

                    <div className="mt-1 text-sm">
                      Soft
                    </div>
                  </button>

                  {/* ROUGH */}

                  <button
                    onClick={() => selectAnswer("rough")}
                    disabled={isPlaying || isCorrect}
                    className={`rounded-2xl border-2 px-2 py-4 font-black transition disabled:cursor-not-allowed ${
                      answer === "rough" && isCorrect
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-orange-100 bg-orange-50 text-orange-700 hover:border-orange-300"
                    }`}
                  >
                    <div className="text-2xl">
                      🪨
                    </div>

                    <div className="mt-1 text-sm">
                      Rough
                    </div>
                  </button>

                  {/* SMOOTH */}

                  <button
                    onClick={() => selectAnswer("smooth")}
                    disabled={isPlaying || isCorrect}
                    className={`rounded-2xl border-2 px-2 py-4 font-black transition disabled:cursor-not-allowed ${
                      answer === "smooth"
                        ? "border-red-400 bg-red-400 text-white"
                        : "border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="text-2xl">
                      💧
                    </div>

                    <div className="mt-1 text-sm">
                      Smooth
                    </div>
                  </button>

                </div>

              </div>
            )}

            {/* CORRECT */}

            {isCorrect && (
              <div className="mt-6 rounded-[24px] bg-gradient-to-r from-emerald-50 to-yellow-50 p-6 text-center">

                <div className="text-5xl">
                  ⭐
                </div>

                <h3 className="mt-2 text-2xl font-black text-emerald-700">
                  Great Job!
                </h3>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  The crocodile teeth feel rough!
                </p>

                <div className="mt-4 text-2xl">
                  ⭐ ⭐ ⭐
                </div>

                <button
                  onClick={finishActivity}
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white shadow-lg transition hover:bg-emerald-600"
                >
                  Finish Activity 🏆
                </button>

              </div>
            )}

            {/* WRONG */}

            {answer && !isCorrect && (
              <div className="mt-5 rounded-2xl bg-orange-50 p-5 text-center">

                <div className="text-3xl">
                  🤔
                </div>

                <h3 className="mt-2 font-black text-orange-700">
                  Let&apos;s Try Again!
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Touch the crocodile teeth one more time.
                  Are they soft, rough or smooth?
                </p>

              </div>
            )}

          </div>

        </section>
      )}

      {/* MULTISENSORY */}

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
            <div className="text-xl">🪥</div>
            <p className="mt-1 text-[10px] font-bold text-emerald-700">
              Self-Care
            </p>
          </div>

        </div>

      </section>

      {/* FOOTER */}

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