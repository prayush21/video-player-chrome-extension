import React, { useState, useRef } from "react";
import { SettingsIcon, SpeedIcon } from "./icons";

interface SettingsMenuProps {
  currentRate: number;
  onRateChange: (rate: number) => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5];

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  currentRate,
  onRateChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getRateIndex = (rate: number) => PLAYBACK_RATES.indexOf(rate);
  const currentIndex = getRateIndex(currentRate);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    updateRateFromPosition(e.clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateRateFromPosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateRateFromPosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateRateFromPosition = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percentage * (PLAYBACK_RATES.length - 1));
    const newRate = PLAYBACK_RATES[index];

    if (newRate !== currentRate) {
      onRateChange(newRate);
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const formatRateLabel = (rate: number) => {
    return rate === 1 ? "1x (Normal)" : `${rate}x`;
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        style={{
          padding: "8px",
          borderRadius: "50%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        aria-label="Playback Speed"
        onMouseEnter={(e) => {
          setIsHovered(true);
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* <SettingsIcon /> */}
        <SpeedIcon size={20} />
      </button>

      {/* Slider popup */}
      {(isHovered || isDragging) && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: "0",
            marginBottom: "8px",
            width: "420px",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            padding: "24px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => !isDragging && setIsHovered(false)}
        >
          <h3
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "24px",
              margin: "0 0 24px 0",
            }}
          >
            Playback Speed
          </h3>

          {/* Slider track */}
          <div
            ref={sliderRef}
            style={{
              position: "relative",
              height: "8px",
              backgroundColor: "#555555",
              borderRadius: "9999px",
              cursor: "pointer",
              marginBottom: "40px",
            }}
            onClick={handleSliderClick}
            onMouseDown={handleMouseDown}
          >
            {/* Progress fill */}
            <div
              style={{
                position: "absolute",
                height: "100%",
                backgroundColor: "#888888",
                borderRadius: "9999px",
                pointerEvents: "none",
                zIndex: 10,
                width: `${(currentIndex / (PLAYBACK_RATES.length - 1)) * 100}%`,
              }}
            />

            {/* Rate markers */}
            {PLAYBACK_RATES.map((rate, index) => {
              const position = (index / (PLAYBACK_RATES.length - 1)) * 100;
              const isActive = index === currentIndex;

              return (
                <div
                  key={rate}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${position}%`,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    zIndex: 20,
                  }}
                >
                  {/* Marker dot */}
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: isActive
                        ? "3px solid white"
                        : "3px solid #999999",
                      backgroundColor: isActive ? "white" : "#1a1a1a",
                      transition: "all 0.2s",
                      transform: isActive ? "scale(1.25)" : "scale(1)",
                      boxShadow: isActive
                        ? "0 4px 6px rgba(0, 0, 0, 0.3)"
                        : "none",
                    }}
                  />

                  {/* Active indicator (larger circle) */}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "48px",
                        height: "48px",
                        border: "3px solid white",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Rate labels */}
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "space-between",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              paddingLeft: "8px",
              paddingRight: "8px",
            }}
          >
            {PLAYBACK_RATES.map((rate, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  key={rate}
                  style={{
                    width:
                      index === 0 || index === PLAYBACK_RATES.length - 1
                        ? "auto"
                        : "80px",
                    textAlign:
                      index === 0
                        ? "left"
                        : index === PLAYBACK_RATES.length - 1
                        ? "right"
                        : "center",
                    color: isActive ? "white" : "#9ca3af",
                    fontWeight: isActive ? "600" : "500",
                    transition: "all 0.2s",
                  }}
                >
                  {formatRateLabel(rate)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
