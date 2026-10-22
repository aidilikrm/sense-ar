"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import StrawberryAR from "../components/StrawberryAR";
import WatermelonAR from "../components/WatermelonAR";
import AubergineAR from "../components/AubergineAR";
import GrapesAR from "../components/GrapesAR";

// ======================================================
// TYPES
// ======================================================

type Texture = "soft" | "rough" | "smooth" | "fluffy";

type FarmItemId =
  | "strawberry"
  | "watermelon"
  | "aubergine"
  | "grapes";

type FarmItem = {
  id: FarmItemId;
  name: string;
  emoji: string;
  correctTexture: Texture;
  introAudio: string;
  touchAudio: string;
  correctAudio: string;
  tryAgainAudio: string;
};

// ======================================================
// FARM ITEMS
// ======================================================

const farmItems: FarmItem[] = [
  {
    id: "strawberry",
    name: "Strawberry",
    emoji: "🍓",
    correctTexture: "soft",
    introAudio: "/audio/our-farm/strawberry-intro.mpeg",
    touchAudio: "/audio/our-farm/strawberry-touch.mpeg",
    correctAudio: "/audio/our-farm/strawberry-correct.mpeg",
    tryAgainAudio: "/audio/our-farm/strawberry-try-again.mpeg",
  },
  {
    id: "watermelon",
    name: "Watermelon",
    emoji: "🍉",
    correctTexture: "soft",
    introAudio: "/audio/our-farm/watermelon-intro.mpeg",
    touchAudio: "/audio/our-farm/watermelon-touch.mpeg",
    correctAudio: "/audio/our-farm/watermelon-correct.mpeg",
    tryAgainAudio: "/audio/our-farm/watermelon-try-again.mpeg",
  },
  {
    id: "aubergine",
    name: "Aubergine",
    emoji: "🍆",
    correctTexture: "soft",
    introAudio: "/audio/our-farm/aubergine-intro.mpeg",
    touchAudio: "/audio/our-farm/aubergine-touch.mpeg",
    correctAudio: "/audio/our-farm/aubergine-correct.mpeg",
    tryAgainAudio: "/audio/our-farm/aubergine-try-again.mpeg",
  },
  {
    id: "grapes",
    name: "Grapes",
    emoji: "🍇",
    correctTexture: "fluffy",
    introAudio: "/audio/our-farm/grapes-intro.mpeg",
    touchAudio: "/audio/our-farm/grapes-touch.mpeg",
    correctAudio: "/audio/our-farm/grapes-correct.mpeg",
    tryAgainAudio: "/audio/our-farm/grapes-try-again.mpeg",
  },
];

// ======================================================
// TEXTURE CHOICES
// ======================================================

const textureChoices: {
  id: Texture;
  label: string;
  emoji: string;
}[] = [
  {
    id: "soft",
    label: "Soft",
    emoji: "☁️",
  },
  {
    id: "rough",
    label: "Rough",
    emoji: "🪨",
  },
  {
    id: "smooth",
    label: "Smooth",
    emoji: "💧",
  },
  {
    id: "fluffy",
    label: "Fluffy",
    emoji: "🧶",
  },
];

// ======================================================
// PAGE
// ======================================================

export default function OurFarmPage() {
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

  const currentItem = farmItems[currentIndex];

  const isCorrect =
    answer === currentItem.correctTexture;

  // ======================================================
  // STOP AUDIO
  // ======================================================

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsPlaying(false);
  }

  // ======================================================
  // PLAY AUDIO
  // ======================================================

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

        reject(
          new Error(`Audio failed: ${src}`)
        );
      };

      audio.play().catch((error) => {
        console.error(
          "Audio play error:",
          src,
          error
        );

        reject(error);
      });
    });
  }

  // ======================================================
  // WAIT
  // ======================================================

  function wait(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // ======================================================
  // LISTEN
  // ======================================================

  async function playInstruction() {
    if (isPlaying) return;

    stopAudio();

    setAnswer(null);
    setShowQuestion(false);
    setIsPlaying(true);

    try {
      // INTRO
      await playAudio(
        currentItem.introAudio
      );

      await wait(350);

      // TOUCH INSTRUCTION
      await playAudio(
        currentItem.touchAudio
      );

      await wait(300);

      // SHOW QUESTION
      setShowQuestion(true);
    } catch (error) {
      console.error(
        "Farm audio sequence error:",
        error
      );
    } finally {
      setIsPlaying(false);
    }
  }

  // ======================================================
  // SELECT ANSWER
  // ======================================================

  async function selectAnswer(
    selected: Texture
  ) {
    if (isPlaying || isCorrect) return;

    stopAudio();

    setAnswer(selected);
    setIsPlaying(true);

    try {
      if (
        selected ===
        currentItem.correctTexture
      ) {
        await playAudio(
          currentItem.correctAudio
        );
      } else {
        await playAudio(
          currentItem.tryAgainAudio
        );

        setAnswer(null);
      }
    } catch (error) {
      console.error(
        "Answer audio error:",
        error
      );
    } finally {
      setIsPlaying(false);
    }
  }

  // ======================================================
  // START CAMERA
  // ======================================================

  async function startCamera() {
    try {
      setLoading(true);
      setCameraError("");

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
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
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      setCameraOn(true);
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setCameraError(
        "Unable to access the camera. Please allow camera permission and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // STOP CAMERA
  // ======================================================

  function stopCamera() {
    stopAudio();

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraOn(false);
    setShowQuestion(false);
    setAnswer(null);
  }

  // ======================================================
  // NEXT FARM ITEM
  // ======================================================

  function nextItem() {
    stopAudio();

    setAnswer(null);
    setShowQuestion(false);

    if (
      currentIndex <
      farmItems.length - 1
    ) {
      setCurrentIndex(
        (previous) => previous + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    finishActivity();
  }

  // ======================================================
  // FINISH
  // ======================================================

  function finishActivity() {
    stopAudio();

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraOn(false);
    setCompleted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ======================================================
  // RESTART
  // ======================================================

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

  // ======================================================
  // CLEAN UP
  // ======================================================

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, []);

  // ======================================================
  // AR MODEL
  // ======================================================

  function renderARModel() {
    switch (currentItem.id) {
      case "strawberry":
        return <StrawberryAR />;

      case "watermelon":
        return <WatermelonAR />;

      case "aubergine":
        return <AubergineAR />;

      case "grapes":
        return <GrapesAR />;

      default:
        return null;
    }
  }

  // ======================================================
  // COMPLETE SCREEN
  // ======================================================

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

        {/* COMPLETE */}

        <section className="flex min-h-[78vh] items-center justify-center px-5 py-12">

          <div className="w-full max-w-2xl rounded-[36px] border border-yellow-100 bg-white p-8 text-center shadow-xl md:p-12">

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
              Our Farm Complete!
            </p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              You explored all the farm items
              and discovered their different
              textures.
            </p>

            {/* FARM RESULTS */}

            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">

              {farmItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-orange-50 p-4"
                >
                  <div className="text-5xl">
                    {item.emoji}
                  </div>

                  <p className="mt-2 text-sm font-black text-slate-800">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs font-black text-emerald-600">
                    {item.correctTexture ===
                    "soft"
                      ? "☁️ Soft"
                      : "🧶 Fluffy"}
                  </p>
                </div>
              ))}

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

  // ======================================================
  // MAIN PAGE
  // ======================================================

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

        <div className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
          AR • Visual Recognition
        </div>

        <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
          Our Farm
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 md:text-base">
          Explore the farm and discover
          different textures.
        </p>

      </section>

      {/* PROGRESS */}

      <section className="mx-auto max-w-4xl px-5 py-4">

        <div className="flex items-center justify-center gap-2">

          {farmItems.map(
            (item, index) => (
              <div
                key={item.id}
                className={`h-2 flex-1 rounded-full ${
                  index <= currentIndex
                    ? "bg-orange-500"
                    : "bg-slate-200"
                }`}
              />
            )
          )}

        </div>

        <p className="mt-2 text-center text-xs font-bold text-slate-400">
          {currentItem.emoji}{" "}
          {currentItem.name} •{" "}
          {currentIndex + 1} of{" "}
          {farmItems.length}
        </p>

      </section>

      {/* CAMERA / AR */}

      <section className="mx-auto max-w-4xl px-4 py-4 md:px-5">

        <div className="overflow-hidden rounded-[30px] border border-orange-100 bg-white shadow-xl">

          <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950 md:aspect-video">

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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 to-emerald-800 p-6 text-center">

                <div className="text-7xl">
                  {currentItem.emoji}
                </div>

                <h2 className="mt-5 text-2xl font-black text-white">
                  Meet the {currentItem.name}
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-emerald-100">
                  Start the camera and explore
                  the{" "}
                  {currentItem.name.toLowerCase()}{" "}
                  in your sensory book.
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

                {/* 3D MODEL */}

                {renderARModel()}

                {/* LIVE LABEL */}

                <div className="pointer-events-none absolute left-4 top-4 z-30">

                  <div className="rounded-full bg-black/45 px-4 py-2 text-[10px] font-black text-white backdrop-blur-md">
                    ✨ SENSE-AR LIVE
                  </div>

                </div>

                {/* CLOSE */}

                <button
                  onClick={stopCamera}
                  aria-label="Close activity"
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-xl font-bold text-white"
                >
                  ×
                </button>

                {/* MODEL NAME */}

                <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">

                  <div className="whitespace-nowrap rounded-full bg-black/50 px-5 py-2.5 text-sm font-black text-white backdrop-blur-md">
                    {currentItem.emoji} Look at the{" "}
                    {currentItem.name.toLowerCase()}
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
                Listen & Explore
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Listen carefully and follow
                the activity.
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

            {/* TOUCH */}

            <div className="mt-5 rounded-2xl bg-orange-50 p-5 text-center">

              <div className="text-4xl">
                {currentItem.emoji}
              </div>

              <h3 className="mt-2 text-lg font-black text-slate-900">
                Touch the {currentItem.name}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">
                Find the{" "}
                {currentItem.name.toLowerCase()}{" "}
                in your sensory book. Touch it
                with your fingers and feel the
                texture.
              </p>

            </div>

            {/* STEP 2 */}

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

                {/* TEXTURES */}

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

                  {textureChoices.map(
                    (texture) => {
                      const selected =
                        answer === texture.id;

                      const selectedCorrect =
                        selected &&
                        texture.id ===
                          currentItem.correctTexture;

                      const selectedWrong =
                        selected &&
                        !selectedCorrect;

                      return (
                        <button
                          key={texture.id}
                          onClick={() =>
                            selectAnswer(
                              texture.id
                            )
                          }
                          disabled={
                            isPlaying ||
                            isCorrect
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
                    }
                  )}

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
                  The{" "}
                  {currentItem.name.toLowerCase()}{" "}
                  feels{" "}
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
                  farmItems.length - 1
                    ? `Next: ${
                        farmItems[
                          currentIndex + 1
                        ].name
                      } →`
                    : "Finish Activity 🏆"}
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
                  Touch the{" "}
                  {currentItem.name.toLowerCase()}{" "}
                  one more time and feel the
                  texture carefully.
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
              ✋
            </div>
            <p className="mt-1 text-[10px] font-bold text-orange-700">
              Tactile
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="text-xl">
              🌱
            </div>
            <p className="mt-1 text-[10px] font-bold text-emerald-700">
              Recognition
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