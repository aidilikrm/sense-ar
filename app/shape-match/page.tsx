"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Answer = 3 | 4 | 5 | 6;

const answers: Answer[] = [3, 4, 5, 6];
const correctAnswer: Answer = 5;

export default function ShapeMatchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [showQuestion, setShowQuestion] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);

  const isCorrect = answer === correctAnswer;

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
      await playAudio(
        "/audio/shape-match/shape-intro.mpeg"
      );

      await wait(350);

      await playAudio(
        "/audio/shape-match/shape-touch.mpeg"
      );

      await wait(300);

      setShowQuestion(true);
    } catch (error) {
      console.error(
        "Shape Match audio sequence error:",
        error
      );
    } finally {
      setIsPlaying(false);
    }
  }

  // =====================================================
  // ANSWER
  // =====================================================

  async function selectAnswer(selected: Answer) {
    if (isPlaying || isCorrect) return;

    stopAudio();

    setAnswer(selected);
    setIsPlaying(true);

    try {
      if (selected === correctAnswer) {
        await playAudio(
          "/audio/shape-match/shape-correct.mpeg"
        );
      } else {
        await playAudio(
          "/audio/shape-match/shape-try-again.mpeg"
        );

        setAnswer(null);
      }
    } catch (error) {
      console.error(
        "Shape Match answer audio error:",
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

  // =====================================================
  // FINISH
  // =====================================================

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
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // =====================================================
  // COMPLETE
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
              Shape Match Complete!
            </p>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              You counted the triangles correctly!
            </p>

            <div className="mx-auto mt-7 max-w-xs rounded-[30px] bg-purple-50 p-6">
              <div className="flex justify-center gap-2 text-4xl">
                <span>🔺</span>
                <span>🔺</span>
                <span>🔺</span>
                <span>🔺</span>
                <span>🔺</span>
              </div>

              <p className="mt-4 text-lg font-black text-slate-800">
                Five Triangles
              </p>

              <p className="mt-1 font-black text-emerald-600">
                ✓ Correct!
              </p>
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

  // =====================================================
  // MAIN
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
        <div className="inline-flex rounded-full bg-purple-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-purple-700">
          Visual • Counting • Shape Recognition
        </div>

        <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
          Shape Match
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 md:text-base">
          Look carefully at the shapes in your
          sensory book and count the triangles.
        </p>
      </section>

      {/* PROGRESS */}

      <section className="mx-auto max-w-4xl px-5 py-4">
        <div className="h-2 w-full rounded-full bg-orange-500" />

        <p className="mt-2 text-center text-xs font-bold text-slate-400">
          🔺 Count the Triangles • 1 of 1
        </p>
      </section>

      {/* CAMERA */}

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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-950 to-indigo-800 p-6 text-center">
                <div className="flex gap-2 text-5xl">
                  🔺 🔵 🟩
                </div>

                <h2 className="mt-5 text-2xl font-black text-white">
                  Let&apos;s Count the Shapes!
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-purple-100">
                  Start the camera and look at the
                  Shape Match activity in your sensory
                  book.
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
                <div className="pointer-events-none absolute left-4 top-4 z-30">
                  <div className="rounded-full bg-black/45 px-4 py-2 text-[10px] font-black text-white backdrop-blur-md">
                    👀 SHAPE EXPLORATION
                  </div>
                </div>

                <button
                  onClick={stopCamera}
                  aria-label="Close activity"
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-xl font-bold text-white"
                >
                  ×
                </button>

                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
                  <div className="rounded-[28px] bg-black/40 px-7 py-6 text-center text-white backdrop-blur-sm">
                    <div className="text-5xl">
                      🔺
                    </div>

                    <p className="mt-3 text-xl font-black">
                      Find the Triangles
                    </p>

                    <p className="mt-1 max-w-xs text-sm text-white/85">
                      Look at the shapes in your
                      sensory book.
                    </p>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
                  <div className="whitespace-nowrap rounded-full bg-black/50 px-5 py-2.5 text-sm font-black text-white backdrop-blur-md">
                    🔺 Count the triangles
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ACTIVITY */}

      {cameraOn && (
        <section className="mx-auto max-w-4xl px-4 pb-8 md:px-5">
          <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-lg md:p-7">
            {/* STEP 1 */}

            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Listen & Look
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Listen carefully and look at the
                shapes in your sensory book.
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

            <div className="mt-5 rounded-2xl bg-purple-50 p-5 text-center">
              <div className="text-5xl">
                🔺
              </div>

              <h3 className="mt-2 text-lg font-black text-slate-900">
                Count the Triangles
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">
                Look carefully at your sensory book.
                Count each triangle one by one.
              </p>
            </div>

            {/* QUESTION */}

            {showQuestion && (
              <div className="mt-6">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                  Step 2
                </p>

                <h3 className="mt-2 text-center text-xl font-black text-slate-900">
                  How many triangles can you find?
                </h3>

                <p className="mt-1 text-center text-sm text-slate-500">
                  Choose your answer.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {answers.map((number) => {
                    const selected =
                      answer === number;

                    const selectedCorrect =
                      selected &&
                      number === correctAnswer;

                    const selectedWrong =
                      selected && !selectedCorrect;

                    return (
                      <button
                        key={number}
                        onClick={() =>
                          selectAnswer(number)
                        }
                        disabled={
                          isPlaying || isCorrect
                        }
                        className={`rounded-2xl border-2 px-4 py-6 transition disabled:cursor-not-allowed ${
                          selectedCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : selectedWrong
                              ? "border-red-400 bg-red-400 text-white"
                              : "border-slate-100 bg-slate-50 text-slate-700 hover:border-purple-300 hover:bg-purple-50"
                        }`}
                      >
                        <div className="text-4xl font-black">
                          {number}
                        </div>

                        <div className="mt-2 text-xs font-bold">
                          Triangles
                        </div>
                      </button>
                    );
                  })}
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
                  There are five triangles!
                </p>

                <div className="mt-4 flex justify-center gap-1 text-2xl">
                  🔺 🔺 🔺 🔺 🔺
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
                  Look at the triangles one more time
                  and count them carefully.
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
            <div className="text-xl">
              👀
            </div>

            <p className="mt-1 text-[10px] font-bold text-purple-700">
              Visual
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-3">
            <div className="text-xl">
              🔊
            </div>

            <p className="mt-1 text-[10px] font-bold text-blue-700">
              Auditory
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-3">
            <div className="text-xl">
              🔺
            </div>

            <p className="mt-1 text-[10px] font-bold text-orange-700">
              Shapes
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="text-xl">
              🔢
            </div>

            <p className="mt-1 text-[10px] font-bold text-emerald-700">
              Counting
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