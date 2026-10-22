"use client";

import { useEffect, useRef, useState } from "react";

export default function BrushMyTeethARPage() {
  const sceneRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const [aframeReady, setAframeReady] = useState(false);
  const [mindarReady, setMindarReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [targetFound, setTargetFound] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

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

        script.onload = () => resolve();

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

        // WAIT UNTIL MINDAR READY
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
  // TARGET DETECTION
  // ==================================================

  useEffect(() => {
    if (!ready || !sceneRef.current) return;

    const scene = sceneRef.current;

    let target: Element | null = null;

    const handleFound = () => {
      console.log("BRUSH MY TEETH TARGET FOUND");
      setTargetFound(true);
    };

    const handleLost = () => {
      console.log("BRUSH MY TEETH TARGET LOST");
      setTargetFound(false);
    };

    const setupTarget = () => {
      target = document.querySelector("#brushTeethTarget");

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
  // LISTEN & TOUCH
  // INTRO -> TOUCH TEETH -> QUESTION
  // ==================================================

  const handleListen = () => {
    if (audioPlaying) return;

    setShowQuestion(false);
    setFeedback("");
    setAudioPlaying(true);

    // INTRO
    const introAudio = createAudio(
      "/audio/crocodile/crocodileteeth-intro.mpeg"
    );

    introAudio.play().catch((error) => {
      console.error("Crocodile intro audio:", error);
      setAudioPlaying(false);
    });

    introAudio.onended = () => {
      // TOUCH TEETH
      const touchAudio = createAudio(
        "/audio/crocodile/crocodileteeth-touch.mpeg"
      );

      touchAudio.play().catch((error) => {
        console.error("Crocodile touch audio:", error);

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

    // CORRECT = ROUGH
    if (answer === "Rough") {
      setFeedback("Correct! Great job! ⭐");
      setAudioPlaying(true);

      const correctAudio = createAudio(
        "/audio/crocodile/crocodileteeth-correct.mpeg"
      );

      correctAudio.play().catch((error) => {
        console.error("Crocodile correct audio:", error);
        setAudioPlaying(false);
      });

      correctAudio.onended = () => {
        activeAudioRef.current = null;

        setAudioPlaying(false);
        setFeedback("");
        setComplete(true);
      };

      return;
    }

    // WRONG
    setFeedback("Try again! 💛");
    setAudioPlaying(true);

    const tryAgainAudio = createAudio(
      "/audio/crocodile/crocodileteeth-try-again.mpeg"
    );

    tryAgainAudio.play().catch((error) => {
      console.error("Crocodile try again audio:", error);

      activeAudioRef.current = null;

      setAudioPlaying(false);
      setFeedback("");
      setShowQuestion(true);
    });

    tryAgainAudio.onended = () => {
      activeAudioRef.current = null;

      setAudioPlaying(false);
      setFeedback("");

      // KEEP SAME QUESTION
      setShowQuestion(true);
    };
  };

  // ==================================================
  // PLAY AGAIN
  // ==================================================

  const resetActivity = () => {
    stopCurrentAudio();

    setShowQuestion(false);
    setAudioPlaying(false);
    setFeedback("");
    setComplete(false);
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
          AR CAMERA
      ================================================= */}

      {ready && (
        <a-scene
          ref={sceneRef}
          mindar-image="
            imageTargetSrc: /ar-targets/brush-my-teeth-target.mind;
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
          {/* CROCODILE MODEL */}

          <a-assets>
            <a-asset-item
              id="crocodileModel"
              src="/models/crocodile.glb"
            ></a-asset-item>
          </a-assets>

          {/* CAMERA */}

          <a-camera
            position="0 0 0"
            look-controls="enabled: false"
          ></a-camera>

          {/* IMAGE TARGET */}

          <a-entity
            id="brushTeethTarget"
            mindar-image-target="targetIndex: 0"
          >
            {!complete && (
              <a-gltf-model
                src="#crocodileModel"
                position="0 0 0.15"
                rotation="90 0 0"
                scale="0.08 0.08 0.08"
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
          FIND PAGE
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
            fontSize: 17,
            fontWeight: 800,
          }}
        >
          🐊 Point the camera at the CROCODILE page
        </div>
      )}

      {/* =================================================
          ACTIVITY
      ================================================= */}

      {targetFound && !complete && (
        <>
          {/* TITLE */}

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
            🐊 Brush My Teeth
          </div>

          {/* LISTEN BUTTON */}

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
                padding: 20,
                borderRadius: 25,
                background: "rgba(255,255,255,0.96)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 5,
                }}
              >
                🐊🦷
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 5,
                }}
              >
                How do the crocodile&apos;s teeth feel?
              </div>

              <div
                style={{
                  fontSize: 14,
                  marginBottom: 17,
                }}
              >
                Touch the teeth on your book.
              </div>

              {/* ANSWERS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 9,
                }}
              >
                {["Soft", "Rough", "Smooth"].map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleAnswer(choice)}
                    disabled={audioPlaying}
                    style={{
                      border: "none",
                      borderRadius: 18,
                      padding: "16px 5px",
                      background: audioPlaying
                        ? "#d1d5db"
                        : "#dcfce7",
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              {/* FEEDBACK */}

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
              "linear-gradient(135deg,#dcfce7,#dbeafe)",
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
            You completed Brush My Teeth!
          </p>

          <div
            style={{
              fontSize: 55,
              marginTop: 15,
            }}
          >
            🐊 🦷 ⭐
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