"use client";

import { useEffect, useRef, useState } from "react";

type Animal = "sheep" | "snake" | "jellyfish";

type AnimalData = {
  name: string;
  emoji: string;
  scale: string;
  position: string;
  rotation: string;
  correct: string;
  intro: string;
  touch: string;
  correctAudio: string;
  tryAgain: string;
};

const animals: Record<Animal, AnimalData> = {
  sheep: {
    name: "Sheep",
    emoji: "🐑",
    scale: "0.08 0.08 0.08",
    position: "0 -0.15 0.15",
    rotation: "90 0 0",
    correct: "Soft",
    intro: "/audio/animals/sheep-intro.mpeg",
    touch: "/audio/animals/sheep-touch.mpeg",
    correctAudio: "/audio/animals/sheep-correct.mp3",
    tryAgain: "/audio/animals/sheep-try-again.mp3",
  },

  snake: {
    name: "Snake",
    emoji: "🐍",
    scale: "0.025 0.025 0.025",
    position: "0 0 0.15",
    rotation: "90 0 0",
    correct: "Smooth",
    intro: "/audio/animals/snake-intro.mp3",
    touch: "/audio/animals/snake-touch.mp3",
    correctAudio: "/audio/animals/snake-correct.mp3",
    tryAgain: "/audio/animals/snake-try-again.mp3",
  },

  jellyfish: {
    name: "Jellyfish",
    emoji: "🪼",
    scale: "0.25 0.25 0.25",
    position: "0 0 0.15",
    rotation: "90 0 0",
    correct: "Smooth",
    intro: "/audio/animals/jellyfish-intro.mpeg",
    touch: "/audio/animals/jellyfish-touch.mpeg",
    correctAudio: "/audio/animals/jellyfish-correct.mpeg",
    tryAgain: "/audio/animals/jellyfish-try-again.mpeg",
  },
};

const animalOrder: Animal[] = ["sheep", "snake", "jellyfish"];

export default function AnimalsARPage() {
  const sceneRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const [aframeReady, setAframeReady] = useState(false);
  const [mindarReady, setMindarReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [targetFound, setTargetFound] = useState(false);
  const [animalIndex, setAnimalIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const currentAnimal = animalOrder[animalIndex];
  const animal = animals[currentAnimal];

  const ready = aframeReady && mindarReady;

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

        // ------------------------------------------
        // A-FRAME
        // ------------------------------------------

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

        // ------------------------------------------
        // MINDAR
        // ------------------------------------------

        const currentWindow = window as any;

        if (
          !currentWindow.AFRAME?.components?.["mindar-image"]
        ) {
          await loadScript(
            "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
            "sense-ar-mindar"
          );
        }

        if (cancelled) return;

        // ------------------------------------------
        // WAIT FOR MINDAR COMPONENT
        // ------------------------------------------

        let attempts = 0;

        const interval = window.setInterval(() => {
          attempts++;

          const checkWindow = window as any;

          if (
            checkWindow.AFRAME?.components?.["mindar-image"]
          ) {
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
      console.log("ANIMALS TARGET FOUND");

      setTargetFound(true);
    };

    const handleLost = () => {
      console.log("ANIMALS TARGET LOST");

      setTargetFound(false);
    };

    const setupTarget = () => {
      target = document.querySelector("#animalsTarget");

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

    const introAudio = createAudio(animal.intro);

    introAudio.play().catch((error) => {
      console.error("Intro audio:", error);

      setAudioPlaying(false);
    });

    introAudio.onended = () => {
      const touchAudio = createAudio(animal.touch);

      touchAudio.play().catch((error) => {
        console.error("Touch audio:", error);

        setAudioPlaying(false);
        setShowQuestion(true);
      });

      touchAudio.onended = () => {
        activeAudioRef.current = null;

        setAudioPlaying(false);
        setShowQuestion(true);
      };
    };
  };

  // ==================================================
  // ANSWER
  // ==================================================

  const handleAnswer = (answer: string) => {
    if (audioPlaying) return;

    // ------------------------------------------
    // CORRECT
    // ------------------------------------------

    if (answer === animal.correct) {
      setFeedback("Correct! Great job! ⭐");
      setAudioPlaying(true);

      const correctAudio = createAudio(animal.correctAudio);

      correctAudio.play().catch((error) => {
        console.error("Correct audio:", error);

        setAudioPlaying(false);
      });

      correctAudio.onended = () => {
        activeAudioRef.current = null;

        setAudioPlaying(false);

        if (animalIndex < animalOrder.length - 1) {
          setAnimalIndex((previous) => previous + 1);

          setFeedback("");
          setShowQuestion(false);
        } else {
          setFeedback("");
          setComplete(true);
        }
      };

      return;
    }

    // ------------------------------------------
    // WRONG
    // ------------------------------------------

    setFeedback("Try again! 💛");
    setAudioPlaying(true);

    const tryAgainAudio = createAudio(animal.tryAgain);

    tryAgainAudio.play().catch((error) => {
      console.error("Try again audio:", error);

      setAudioPlaying(false);
      setFeedback("");
      setShowQuestion(true);
    });

    tryAgainAudio.onended = () => {
      activeAudioRef.current = null;

      setAudioPlaying(false);

      // Try Again hilang selepas audio
      setFeedback("");

      // Soalan kekal
      setShowQuestion(true);
    };
  };

  // ==================================================
  // RESET
  // ==================================================

  const resetActivity = () => {
    stopCurrentAudio();

    setAnimalIndex(0);
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
            imageTargetSrc: /ar-targets/animals-target.mind;
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
              id="sheepModel"
              src="/models/sheep.glb"
            ></a-asset-item>

            <a-asset-item
              id="snakeModel"
              src="/models/snake.glb"
            ></a-asset-item>

            <a-asset-item
              id="jellyfishModel"
              src="/models/jellyfish.glb"
            ></a-asset-item>
          </a-assets>

          {/* CAMERA */}

          <a-camera
            position="0 0 0"
            look-controls="enabled: false"
          ></a-camera>

          {/* IMAGE TARGET */}

          <a-entity
            id="animalsTarget"
            mindar-image-target="targetIndex: 0"
          >
            {currentAnimal === "sheep" && !complete && (
              <a-gltf-model
                src="#sheepModel"
                position={animals.sheep.position}
                rotation={animals.sheep.rotation}
                scale={animals.sheep.scale}
              ></a-gltf-model>
            )}

            {currentAnimal === "snake" && !complete && (
              <a-gltf-model
                src="#snakeModel"
                position={animals.snake.position}
                rotation={animals.snake.rotation}
                scale={animals.snake.scale}
              ></a-gltf-model>
            )}

            {currentAnimal === "jellyfish" && !complete && (
              <a-gltf-model
                src="#jellyfishModel"
                position={animals.jellyfish.position}
                rotation={animals.jellyfish.rotation}
                scale={animals.jellyfish.scale}
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
          📖 Point the camera at the ANIMALS page
        </div>
      )}

      {/* =================================================
          ACTIVITY
      ================================================= */}

      {targetFound && !complete && (
        <>
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
              fontSize: 22,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {animal.emoji} {animal.name}
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
                background: audioPlaying ? "#d1d5db" : "#ffffff",
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
                How does the {animal.name.toLowerCase()} feel?
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                }}
              >
                {["Soft", "Rough", "Smooth"].map((texture) => (
                  <button
                    key={texture}
                    onClick={() => handleAnswer(texture)}
                    disabled={audioPlaying}
                    style={{
                      border: "none",
                      borderRadius: 18,
                      padding: "15px 8px",
                      background: audioPlaying
                        ? "#d1d5db"
                        : "#e5e7eb",
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    {texture}
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
              "linear-gradient(135deg,#fef3c7,#fde68a)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 80 }}>
            🎉
          </div>

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
            You completed Animals & Texture!
          </p>

          <div
            style={{
              fontSize: 45,
              marginTop: 15,
            }}
          >
            🐑 🐍 🪼
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