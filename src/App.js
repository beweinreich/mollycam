import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoContainerRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState("front"); // 'user' for front, 'environment' for rear

  // Start camera on mount or when facingMode changes
  useEffect(() => {
    let stream;
    (async () => {
      if (
        videoRef.current &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    })();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Take photo
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      // Set canvas size to match video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas
        .getContext("2d")
        .drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      canvas.toBlob(
        (blob) => {
          setPhoto(blob);
        },
        "image/jpeg",
        0.95
      );
    }
  };

  // Share photo using Web Share API
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
          title: "Photo from MollyCam",
          text: "Check out this photo I took!",
        });
      } catch (e) {
        // Sharing cancelled or failed
        console.log("Sharing cancelled or failed:", e);
      }
    } else {
      // Fallback to download
      downloadPhoto();
    }
  };

  // Download photo
  const downloadPhoto = () => {
    const url = URL.createObjectURL(photo);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mollycam-photo-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export as PDF
  const exportAsPDF = async () => {
    if (!photo) return;
    try {
      // Read the photo blob as a data URL
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgData = e.target.result;
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Create an image to get its dimensions
        const img = new window.Image();
        img.onload = function () {
          const imgWidth = img.width;
          const imgHeight = img.height;
          // Calculate the best fit for full height (with white background)
          const ratio = pdfHeight / imgHeight;
          const finalWidth = imgWidth * ratio;
          const finalHeight = pdfHeight;
          const x = (pdfWidth - finalWidth) / 2;
          const y = 0;

          // Fill background with white
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

          // Draw the image
          pdf.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);
          pdf.save(
            `mollycam-photo-${new Date()
              .toISOString()
              .slice(0, 19)
              .replace(/:/g, "-")}.pdf`
          );
        };
        img.src = imgData;
      };
      reader.readAsDataURL(photo);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
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

  // Flip camera
  const handleFlip = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

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
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
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
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "max(120px, env(safe-area-inset-bottom) + 20px)",
              zIndex: 2,
              display: "flex",
              flexDirection: "row",
              gap: "16px",
            }}
          >
            <button
              onClick={takePhoto}
              style={{
                fontSize: 14,
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
            <button
              onClick={handleFlip}
              style={{
                fontSize: 14,
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
              Flip
            </button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {photo && (
        <div
          ref={photoContainerRef}
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

          {/* Share Buttons */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "max(180px, env(safe-area-inset-bottom) + 140px)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              zIndex: 4,
            }}
          >
            <button
              onClick={sharePhoto}
              style={{
                fontSize: 16,
                padding: "0.75em 1.5em",
                borderRadius: 25,
                border: "none",
                background: "rgba(255,255,255,0.85)",
                color: "#111",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              📤 Share
            </button>
            <button
              onClick={downloadPhoto}
              style={{
                fontSize: 16,
                padding: "0.75em 1.5em",
                borderRadius: 25,
                border: "none",
                background: "rgba(255,255,255,0.85)",
                color: "#111",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              💾 Download
            </button>
            <button
              onClick={exportAsPDF}
              style={{
                fontSize: 16,
                padding: "0.75em 1.5em",
                borderRadius: 25,
                border: "none",
                background: "rgba(255,255,255,0.85)",
                color: "#111",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              📄 Export as PDF
            </button>
          </div>

          <button
            onClick={handleRetake}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "max(120px, env(safe-area-inset-bottom) + 20px)",
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
