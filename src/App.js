import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoContainerRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

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
    if (!photoContainerRef.current) return;

    try {
      // Create a temporary container for the PDF
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "800px";
      tempContainer.style.height = "600px";
      tempContainer.style.background = "#000";
      tempContainer.style.display = "flex";
      tempContainer.style.flexDirection = "column";
      tempContainer.style.alignItems = "center";
      tempContainer.style.justifyContent = "center";
      tempContainer.style.padding = "20px";
      tempContainer.style.boxSizing = "border-box";

      // Add the photo
      const img = document.createElement("img");
      img.src = URL.createObjectURL(photo);
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";
      tempContainer.appendChild(img);

      document.body.appendChild(tempContainer);

      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: "#000",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit in PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      // Center the image
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

      // Save PDF
      pdf.save(
        `mollycam-photo-${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-")}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPhoto(null);
    setShowShareOptions(false);
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

          {/* Share Options Button */}
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 180,
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
            Share Options
          </button>

          {/* Share Options Menu */}
          {showShareOptions && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 240,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                zIndex: 5,
                background: "rgba(0,0,0,0.9)",
                padding: "15px",
                borderRadius: "15px",
                border: "1px solid rgba(255,255,255,0.2)",
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
                }}
              >
                📄 Export as PDF
              </button>
            </div>
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
