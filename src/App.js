import React, { useRef, useState, useEffect } from "react";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);

  // Start camera on mount
  useEffect(() => {
    let stream;
    (async () => {
      if (
        videoRef.current &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    })();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Take photo
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        setPhoto(blob);
      }, "image/jpeg");
    }
  };

  // Share photo
  const sharePhoto = async () => {
    if (
      navigator.canShare &&
      navigator.canShare({
        files: [new File([photo], "photo.jpg", { type: "image/jpeg" })],
      })
    ) {
      try {
        await navigator.share({
          files: [new File([photo], "photo.jpg", { type: "image/jpeg" })],
          title: "Photo",
        });
      } catch (e) {
        // Sharing cancelled or failed
      }
    } else {
      alert("Sharing not supported on this device/browser.");
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPhoto(null);
    setStreaming(true);
    // Restart camera if needed
    if (videoRef.current && !videoRef.current.srcObject) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        videoRef.current.srcObject = stream;
      });
    }
  };

  // Stop camera when photo is taken
  useEffect(() => {
    if (photo && videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      setStreaming(false);
    }
  }, [photo]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {!photo && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              objectFit: "cover",
              zIndex: 1,
              background: "#000",
            }}
          />
          <button
            onClick={takePhoto}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 60,
              zIndex: 2,
              fontSize: 20,
              padding: "1em 2.5em",
              borderRadius: 30,
              border: "none",
              background: "rgba(255,255,255,0.85)",
              color: "#111",
              fontWeight: 600,
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              cursor: "pointer",
            }}
          >
            Take Photo
          </button>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {photo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
            height: "100vh",
            background: "#000",
            position: "fixed",
            inset: 0,
            zIndex: 3,
          }}
        >
          <img
            src={URL.createObjectURL(photo)}
            alt="Captured"
            style={{
              width: "100vw",
              height: "100vh",
              objectFit: "contain",
              background: "#000",
            }}
          />
          {navigator.canShare && (
            <button
              onClick={sharePhoto}
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 120,
                fontSize: 18,
                padding: "1em 2em",
                borderRadius: 30,
                border: "none",
                background: "rgba(255,255,255,0.85)",
                color: "#111",
                fontWeight: 600,
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                cursor: "pointer",
                zIndex: 4,
              }}
            >
              Share
            </button>
          )}
          <button
            onClick={handleRetake}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 60,
              fontSize: 16,
              padding: "0.75em 2em",
              borderRadius: 30,
              border: "none",
              background: "rgba(255,255,255,0.85)",
              color: "#111",
              fontWeight: 600,
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              cursor: "pointer",
              zIndex: 4,
            }}
          >
            Retake
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
