"use client";

import { useEffect, useRef, useState } from "react";

export default function ZipperSkillsARPage() {
  const sceneRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const [aframeReady, setAframeReady] = useState(false);
  const [mindarReady, setMindarReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [targetFound, setTargetFound] = useState(false);
  const [instructionReady, setInstructionReady] = useState(false);
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
      console.log("ZIPPER TARGET FOUND");
      setTargetFound(true);
    };

    const handleLost = () => {
      console.log("ZIPPER TARGET LOST");
      setTargetFound(false);
    };

    const setupTarget = () => {
      target = document.querySelector("#zipperTarget");

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
  // INTRO -> ZIPPER INSTRUCTION -> ACTIVITY
  // ==================================================

  const handleListen = () => {
    if (audioPlaying) return;

    setInstructionReady(false);
    setFeedback("");
    setAudioPlaying(true);

    // INTRO
    const introAudio = createAudio(
      "/audio/zipper-skills/zipper-intro.mp3"
    );

    introAudio.play().catch((error) => {
      console.error("Zipper intro audio:", error);
      setAudioPlaying(false);
    });

    introAudio.onended = () => {
      // ZIPPER INSTRUCTION
      const touchAudio = createAudio(
        "/audio/zipper-skills/zipper-touch.mp3"
      );

      touchAudio.play().catch((error) => {
        console.error("Zipper touch audio:", error);

        setAudioPlaying(false);
        setInstructionReady(true);
      });

      touchAudio.onended = () => {
        activeAudioRef.current = null;

        setAudioPlaying(false);

        // SHOW ACTIVITY BUTTONS
        setInstructionReady(true);
      };
    };
  };

  // ==================================================
  // TRY AGAIN
  // ==================================================

  const handleTryAgain = () => {
    if (audioPlaying) return;

    setFeedback("Try again! 💛");
    setAudioPlaying(true);

    const audio = createAudio(
      "/audio/zipper-skills/zipper-try-again.mp3"
    );

    audio.play().catch((error) => {
      console.error("Zipper try again audio:", error);

      activeAudioRef.current = null;

      setAudioPlaying(false);
      setFeedback("");
      setInstructionReady(true);
    });

    audio.onended = () => {
      activeAudioRef.current = null;

      setAudioPlaying(false);
      setFeedback("");

      // STAY ON SAME ACTIVITY
      setInstructionReady(true);
    };
  };

  // ==================================================
  // I DID IT
  // ==================================================

  const handleSuccess = () => {
    if (audioPlaying) return;

    setFeedback("Great job! ⭐");
    setAudioPlaying(true);

    const audio = createAudio(
      "/audio/zipper-skills/zipper-correct.mp3"
    );

    audio.play().catch((error) => {
      console.error("Zipper correct audio:", error);
      setAudioPlaying(false);
    });

    audio.onended = () => {
      activeAudioRef.current = null;

      setAudioPlaying(false);
      setFeedback("");
      setComplete(true);
    };
  };

  // ==================================================
  // PLAY AGAIN
  // ==================================================

  const resetActivity = () => {
    stopCurrentAudio();

    setInstructionReady(false);
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
            imageTargetSrc: /ar-targets/zipper-skills-target.mind;
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
          {/* CAMERA */}

          <a-camera
            position="0 0 0"
            look-controls="enabled: false"
          ></a-camera>

          {/* IMAGE TARGET */}

          <a-entity
            id="zipperTarget"
            mindar-image-target="targetIndex: 0"
          ></a-entity>
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
          🤐 Point the camera at the ZIPPER page
        </div>
      )}

      {/* =================================================
          ZIPPER ACTIVITY
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
            🤐 Zipper Skills
          </div>

          {/* LISTEN BUTTON */}

          {!instructionReady && (
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
                : "🔊 Listen & Try"}
            </button>
          )}

          {/* PHYSICAL ACTIVITY */}

          {instructionReady && (
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
                  fontSize: 34,
                  marginBottom: 5,
                }}
              >
                🤏
              </div>

              <div
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                }}
              >
                Try the zipper on your book!
              </div>

              <div
                style={{
                  fontSize: 15,
                  marginTop: 7,
                  marginBottom: 18,
                }}
              >
                Pull it up and down.
              </div>

              {/* BUTTONS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <button
                  onClick={handleTryAgain}
                  disabled={audioPlaying}
                  style={{
                    border: "none",
                    borderRadius: 18,
                    padding: "16px 10px",
                    background: audioPlaying
                      ? "#d1d5db"
                      : "#fef3c7",
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  🔄 Try Again
                </button>

                <button
                  onClick={handleSuccess}
                  disabled={audioPlaying}
                  style={{
                    border: "none",
                    borderRadius: 18,
                    padding: "16px 10px",
                    background: audioPlaying
                      ? "#d1d5db"
                      : "#dcfce7",
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  ⭐ I Did It!
                </button>
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
              "linear-gradient(135deg,#dbeafe,#fef3c7)",
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
            You completed Zipper Skills!
          </p>

          <div
            style={{
              fontSize: 55,
              marginTop: 15,
            }}
          >
            🤐 ⭐
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