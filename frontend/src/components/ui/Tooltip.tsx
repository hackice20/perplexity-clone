import React, { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (isVisible && tooltipRef.current && containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const tooltip = tooltipRef.current.getBoundingClientRect();
        const gap = container.height + 8;

        let x = 0;
        let y = 0;

        switch (position) {
          case "top":
            x = container.width / 2 - tooltip.width / 2;
            y = -(tooltip.height + gap);
            break;
          case "bottom":
            x = container.width / 2 - tooltip.width / 2;
            y = container.height + gap;
            break;
          case "left":
            x = -(tooltip.width + gap);
            y = container.height / 2 - tooltip.height / 2;
            break;
          case "right":
            x = container.width + gap;
            y = container.height / 2 - tooltip.height / 2;
            break;
        }

        setCoords({ x, y });
      }
    };

    if (isVisible) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isVisible, position]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      <div
        ref={tooltipRef}
        style={{
          transform: `translate(${coords.x}px, ${coords.y}px)`,
          display: isVisible ? "block" : "none",
        }}
        className={`
            absolute z-50 px-3 py-2 text-sm font-medium
            text-gray-50 bg-neutral-900 rounded-lg shadow-lg
            backdrop-blur-sm bg-opacity-90
            border border-gray-700/50
            ${isVisible ? "opacity-100" : "opacity-0"}
          `}
      >
        {content}
        <div
          className={`
            absolute w-2 h-2 bg-neutral-900 rotate-45
            border-gray-700/50
            ${position === "bottom" ? "border-t border-l -top-1 left-1/2 -translate-x-1/2" : ""}
            ${position === "top" ? "border-b border-r -bottom-1 left-1/2 -translate-x-1/2" : ""}
            ${position === "left" ? "border-t border-r -right-1 top-1/2 -translate-y-1/2" : ""}
            ${position === "right" ? "border-b border-l -left-1 top-1/2 -translate-y-1/2" : ""}
          `}
        />
      </div>
    </div>
  );
};

export default Tooltip;