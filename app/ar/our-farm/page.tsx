"use client";

import { useEffect, useRef, useState } from "react";

const farmItems = [
  {
    name: "Strawberry",
    emoji: "🍓",
    model: "#strawberryModel",
    correct: "Soft",
    choices: ["Soft", "Rough", "Hard"],
    intro: "/audio/our-farm/strawberry-intro.mpeg",
    touch: "/audio/our-farm/strawberry-touch.mpeg",
    correctAudio: "/audio/our-farm/strawberry-correct.mpeg",
    tryAgain: "/audio/our-farm/strawberry-try-again.mpeg",
    scale: "4.12 4.12 4.12",
  },
  {
    name: "Watermelon",
    emoji: "🍉",
    model: "#watermelonModel",
    correct: "Soft",
    choices: ["Hard", "Soft", "Rough"],
    intro: "/audio/our-farm/watermelon-intro.mpeg",
    touch: "/audio/our-farm/watermelon-touch.mpeg",
    correctAudio: "/audio/our-farm/watermelon-correct.mpeg",
    tryAgain: "/audio/our-farm/watermelon-try-again.mpeg",
    scale: "2.12 2.12 2.12",
  },
  {
    name: "Aubergine",
    emoji: "🍆",
    model: "#aubergineModel",
    correct: "Soft",
    choices: ["Rough", "Hard", "Soft"],
    intro: "/audio/our-farm/aubergine-intro.mpeg",
    touch: "/audio/our-farm/aubergine-touch.mpeg",
    correctAudio: "/audio/our-farm/aubergine-correct.mpeg",
    tryAgain: "/audio/our-farm/aubergine-try-again.mpeg",
    scale: "0.12 0.12 0.12",
  },
  {
    name: "Grapes",
    emoji: "🍇",
    model: "#grapesModel",
    correct: "Fluffy",
    choices: ["Smooth", "Fluffy", "Hard"],
    intro: "/audio/our-farm/grapes-intro.mpeg",
    touch: "/audio/our-farm/grapes-touch.mpeg",
    correctAudio: "/audio/our-farm/grapes-correct.mpeg",
    tryAgain: "/audio/our-farm/grapes-try-again.mpeg",
    scale: "0.12 0.12 0.12",
  },
];

export default function OurFarmARPage() {
  const sceneRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const [aframeReady, setAframeReady] = useState(false);
  const [mindarReady, setMindarReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [targetFound, setTargetFound] = useState(false);
  const [itemIndex, setItemIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const ready = aframeReady && mindarReady;
  const current = farmItems[itemIndex];

  // ==================================================
  // LOAD A-FRAME -> MINDAR
  // ==================================================

  useEffect(() => {
    let cancelled = false;

    const loadScript = (src: string, id: string) => {
      return new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(id);

        if (existing) {
          existing.remove();
        }

        const script = document.createElement("script");

        script.id = id;
        script.src = src;
        script.async = false;

        script.onload = () => {
          resolve();
        };

        script.onerror = () => {
          reject(new Error(`${id} failed to load`));
        };

        document.head.appendChild(script);
      });
    };

    const startLibraries = async () => {
      try {
        setLoadError("");

        const win = window as any;

        // A-FRAME
        if (!win.AFRAME) {
          await loadScript(
            "https://aframe.io/releases/1.6.0/aframe.min.js",
            "sense-ar-aframe"
          );
        }

        if (cancelled) return;

        if (!(window as any).AFRAME) {
          throw new Error("A-Frame failed to start");
        }

        setAframeReady(true);

        // MINDAR
        const currentWindow = window as any;

        if (!currentWindow.AFRAME?.components?.["mindar-image"]) {
          await loadScript(
            "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
            "sense-ar-mindar"
          );
        }

        if (cancelled) return;

        // WAIT FOR MINDAR COMPONENT
        let attempts = 0;

        const interval = window.setInterval(() => {
          attempts++;

          const checkWindow = window as any;

          if (checkWindow.AFRAME?.components?.["mindar-image"]) {
            window.clearInterval(interval);

            setMindarReady(true);
            return;
          }

          if (attempts >= 50) {
            window.clearInterval(interval);

            setLoadError("MindAR failed to start.");
          }
        }, 200);
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setLoadError("AR libraries failed to load.");
        }
      }
    };

    startLibraries();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==================================================
  // AUDIO
  // ==================================================

  const stopCurrentAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
  };

  const createAudio = (src: string) => {
    stopCurrentAudio();

    const audio = new Audio(src);

    activeAudioRef.current = audio;

    return audio;
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  // ==================================================
  // TARGET FOUND / LOST
  // ==================================================

  useEffect(() => {
    if (!ready || !sceneRef.current) return;

    const scene = sceneRef.current;

    let target: Element | null = null;

    const handleFound = () => {
      console.log("OUR FARM TARGET FOUND");

      setTargetFound(true);
    };

    const handleLost = () => {
      console.log("OUR FARM TARGET LOST");

      setTargetFound(false);
    };

    const setupTarget = () => {
      target = document.querySelector("#ourFarmTarget");

      if (!target) return;

      target.addEventListener("targetFound", handleFound);
      target.addEventListener("targetLost", handleLost);
    };

    if (scene.hasLoaded) {
      setupTarget();
    } else {
      scene.addEventListener("loaded", setupTarget);
    }

    return () => {
      scene.removeEventListener("loaded", setupTarget);

      if (target) {
        target.removeEventListener("targetFound", handleFound);
        target.removeEventListener("targetLost", handleLost);
      }
    };
  }, [ready]);

  // ==================================================
  // LISTEN
  // INTRO -> TOUCH -> QUESTION
  // ==================================================

  const handleListen = () => {
    if (audioPlaying) return;

    setFeedback("");
    setShowQuestion(false);
    setAudioPlaying(true);

    // INTRO
    const introAudio = createAudio(current.intro);

    introAudio.play().catch((error) => {
      console.error("Intro audio:", error);

      setAudioPlaying(false);
    });

    introAudio.onended = () => {
      // TOUCH
      const touchAudio = createAudio(current.touch);

      touchAudio.play().catch((error) => {
        console.error("Touch audio:", error);

        setAudioPlaying(false);
        setShowQuestion(true);
      });

      touchAudio.onended = () => {
        activeAudioRef.current = null;

        setAudioPlaying(false);

        // QUESTION ONLY AFTER TOUCH AUDIO FINISHES
        setShowQuestion(true);
      };
    };
  };

  // ==================================================
  // ANSWER
  // ==================================================

  const handleAnswer = (answer: string) => {
    if (audioPlaying) return;

    // ==================================================
    // CORRECT
    // ==================================================

    if (answer === current.correct) {
      setFeedback("Great job! ⭐");
      setAudioPlaying(true);

      const correctAudio = createAudio(current.correctAudio);

      correctAudio.play().catch((error) => {
        console.error("Correct audio:", error);

        setAudioPlaying(false);
      });

      correctAudio.onended = () => {
        activeAudioRef.current = null;

        setAudioPlaying(false);

        // NEXT FARM ITEM
        if (itemIndex < farmItems.length - 1) {
          setItemIndex((previous) => previous + 1);

          setShowQuestion(false);
          setFeedback("");

          return;
        }

        // ALL COMPLETED
        setFeedback("");
        setComplete(true);
      };

      return;
    }

    // ==================================================
    // WRONG
    // ==================================================

    setFeedback("Try again! 💛");
    setAudioPlaying(true);

    const tryAgainAudio = createAudio(current.tryAgain);

    tryAgainAudio.play().catch((error) => {
      console.error("Try again audio:", error);

      activeAudioRef.current = null;

      setAudioPlaying(false);
      setFeedback("");

      // SAME QUESTION
      setShowQuestion(true);
    });

    tryAgainAudio.onended = () => {
      activeAudioRef.current = null;

      setAudioPlaying(false);
      setFeedback("");

      // REMAIN ON SAME ITEM
      setShowQuestion(true);
    };
  };

  // ==================================================
  // RESET
  // ==================================================

  const resetActivity = () => {
    stopCurrentAudio();

    setItemIndex(0);
    setShowQuestion(false);
    setFeedback("");
    setComplete(false);
    setAudioPlaying(false);
  };

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* =================================================
          AR SCENE
      ================================================= */}

      {ready && (
        <a-scene
          ref={sceneRef}
          mindar-image="
            imageTargetSrc: /ar-targets/our-farm-target.mind;
            autoStart: true;
            uiScanning: yes;
          "
          embedded
          renderer="
            colorManagement: true;
            physicallyCorrectLights: true;
          "
          color-space="sRGB"
          vr-mode-ui="enabled: false"
          device-orientation-permission-ui="enabled: false"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {/* MODELS */}

          <a-assets>
            <a-asset-item
              id="strawberryModel"
              src="/models/strawberry.glb"
            ></a-asset-item>

            <a-asset-item
              id="watermelonModel"
              src="/models/watermelon.glb"
            ></a-asset-item>

            <a-asset-item
              id="aubergineModel"
              src="/models/eggplant.glb"
            ></a-asset-item>

            <a-asset-item
              id="grapesModel"
              src="/models/grapes.glb"
            ></a-asset-item>
          </a-assets>

          {/* CAMERA */}

          <a-camera
            position="0 0 0"
            look-controls="enabled: false"
          ></a-camera>

          {/* IMAGE TARGET */}

          <a-entity
            id="ourFarmTarget"
            mindar-image-target="targetIndex: 0"
          >
            {!complete && (
              <a-gltf-model
                key={current.name}
                src={current.model}
                position="0 0 0.15"
                rotation="90 0 0"
                scale={current.scale}
              ></a-gltf-model>
            )}
          </a-entity>
        </a-scene>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#111827",
            color: "white",
            textAlign: "center",
            padding: 30,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
            }}
          >
            Loading AR...
          </div>

          <div
            style={{
              marginTop: 18,
              lineHeight: 1.8,
            }}
          >
            A-Frame: {aframeReady ? "✓" : "..."}
            <br />
            MindAR: {mindarReady ? "✓" : "..."}
          </div>

          {loadError && (
            <div
              style={{
                marginTop: 20,
                padding: "12px 18px",
                borderRadius: 15,
                background: "rgba(239,68,68,0.25)",
              }}
            >
              ⚠️ {loadError}
            </div>
          )}
        </div>
      )}

      {/* =================================================
          SCANNING
      ================================================= */}

      {ready && !targetFound && !complete && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            width: "90%",
            maxWidth: 430,
            padding: "15px 20px",
            borderRadius: 20,
            background: "rgba(0,0,0,0.72)",
            color: "white",
            textAlign: "center",
            fontWeight: 800,
            fontSize: 17,
          }}
        >
          📖 Point the camera at the OUR FARM page
        </div>
      )}

      {/* =================================================
          ACTIVITY
      ================================================= */}

      {targetFound && !complete && (
        <>
          {/* CURRENT FARM ITEM */}

          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              padding: "12px 25px",
              borderRadius: 30,
              background: "rgba(255,255,255,0.94)",
              fontSize: 21,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {current.emoji} {current.name}
          </div>

          {/* PROGRESS */}

          <div
            style={{
              position: "absolute",
              top: 80,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              padding: "7px 16px",
              borderRadius: 20,
              background: "rgba(0,0,0,0.65)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {itemIndex + 1} / {farmItems.length}
          </div>

          {/* LISTEN */}

          {!showQuestion && (
            <button
              onClick={handleListen}
              disabled={audioPlaying}
              style={{
                position: "absolute",
                bottom: 45,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 30,
                border: "none",
                borderRadius: 30,
                padding: "17px 35px",
                background: audioPlaying
                  ? "#d1d5db"
                  : "#ffffff",
                fontSize: 19,
                fontWeight: 900,
                minWidth: 220,
              }}
            >
              {audioPlaying
                ? "🔊 Listen..."
                : "🔊 Listen & Touch"}
            </button>
          )}

          {/* QUESTION */}

          {showQuestion && (
            <div
              style={{
                position: "absolute",
                bottom: 25,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 30,
                width: "92%",
                maxWidth: 450,
                padding: 18,
                borderRadius: 25,
                background: "rgba(255,255,255,0.96)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                  marginBottom: 15,
                }}
              >
                How does the {current.name.toLowerCase()} feel?
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                }}
              >
                {current.choices.map((choice) => (
                  <button
                    key={choice}
                    disabled={audioPlaying}
                    onClick={() => handleAnswer(choice)}
                    style={{
                      border: "none",
                      borderRadius: 18,
                      padding: "15px 7px",
                      background: audioPlaying
                        ? "#d1d5db"
                        : "#e5e7eb",
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              {feedback && (
                <div
                  style={{
                    marginTop: 15,
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  {feedback}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =================================================
          COMPLETE
      ================================================= */}

      {complete && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
            background:
              "linear-gradient(135deg,#dcfce7,#fef3c7)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 80 }}>🎉</div>

          <h1
            style={{
              fontSize: 34,
              margin: "10px 0 0",
              fontWeight: 900,
            }}
          >
            Great Job!
          </h1>

          <p
            style={{
              fontSize: 20,
              marginTop: 10,
            }}
          >
            You completed Our Farm!
          </p>

          <div
            style={{
              fontSize: 48,
              marginTop: 15,
            }}
          >
            🍓 🍉 🍆 🍇 ⭐
          </div>

          <button
            onClick={resetActivity}
            style={{
              marginTop: 35,
              border: "none",
              borderRadius: 30,
              padding: "16px 32px",
              background: "#111827",
              color: "white",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            🔄 Play Again
          </button>
        </div>
      )}
    </main>
  );
}