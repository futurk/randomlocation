import React from "react";

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
  isDarkMode?: boolean;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step = 10,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  isDarkMode = true,
}) => {
  const minPercent = Math.max(0, Math.min(100, ((minValue - min) / (max - min)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((maxValue - min) / (max - min)) * 100));

  return (
    <div className="relative w-full h-6 flex items-center select-none">
      {/* Background Track */}
      <div className={`absolute w-full h-1.5 rounded-lg ${isDarkMode ? "bg-neutral-800" : "bg-neutral-200"}`} />

      {/* Active Range Highlight */}
      <div
        className="absolute h-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-blue-500"
        style={{
          left: `${minPercent}%`,
          width: `${Math.max(0, maxPercent - minPercent)}%`,
        }}
      />

      {/* Min Value Input Dragger */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minValue}
        onChange={(e) => {
          const value = Math.min(Number(e.target.value), maxValue);
          onMinChange(value);
        }}
        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none focus:outline-none z-20
          [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-pointer"
      />

      {/* Max Value Input Dragger */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxValue}
        onChange={(e) => {
          const value = Math.max(Number(e.target.value), minValue);
          onMaxChange(value);
        }}
        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none focus:outline-none z-30
          [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
};

export default DualRangeSlider;
