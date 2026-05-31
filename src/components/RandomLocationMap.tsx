import React, { useState, useEffect } from "react";
import { getRandomLocation } from "./helpers";
import Map from "./Map";
import {
  Moon,
  Sun,
  RefreshCw,
  Navigation,
  Sliders,
  MapPin,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Info,
} from "lucide-react";

const RandomLocationMap = () => {
  const [radius, setRadius] = useState<number>(10); // Default to 10 km
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationInput, setLocationInput] = useState<string>("");
  const [randomLocation, setRandomLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showOnboardingHelp, setShowOnboardingHelp] = useState<boolean>(true);

  const generateRandomLocation = () => {
    if (userLocation) {
      const randomLoc = getRandomLocation(
        userLocation.lat,
        userLocation.lng,
        radius
      );
      setRandomLocation(randomLoc);
    }
  };

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocationInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setIsLocating(false);
          setShowOnboardingHelp(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          alert("Unable to retrieve your location. Please enter coordinates manually or click the map.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    const parts = value.split(",");
    if (parts.length === 2) {
      const lat = Number(parts[0].trim());
      const lng = Number(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setUserLocation({ lat, lng });
        setShowOnboardingHelp(false);
      }
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    setLocationInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setShowOnboardingHelp(false);
  };

  const copyToClipboard = () => {
    if (randomLocation) {
      const text = `${randomLocation.lat.toFixed(6)}, ${randomLocation.lng.toFixed(6)}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Glassmorphic panel classes
  const panelBg = isDarkMode
    ? "bg-neutral-900/85 border-neutral-800 text-white backdrop-blur-md"
    : "bg-white/85 border-neutral-200 text-neutral-900 backdrop-blur-md";

  const cardBg = isDarkMode
    ? "bg-neutral-800/80 border-neutral-700/50"
    : "bg-neutral-50/90 border-neutral-200";

  return (
    <div className={`h-screen h-[100dvh] flex flex-col overflow-hidden font-sans ${isDarkMode ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-900"}`}>
      {/* Premium minimal header */}
      <header className={`h-16 px-6 flex justify-between items-center border-b transition-colors duration-300 z-10 ${
        isDarkMode ? "bg-neutral-900/40 border-neutral-800/50" : "bg-white/40 border-neutral-200/50"
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">GeoRandom</h1>
            <p className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Adventure Generator</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl border transition-all duration-300 ${
              isDarkMode
                ? "bg-neutral-900 border-neutral-800 text-yellow-400 hover:bg-neutral-800"
                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main map & dashboard section */}
      <main className="flex-1 relative w-full overflow-hidden">
        {/* Interactive map (Full Viewport) */}
        <div className="absolute inset-0 z-0">
          <Map
            centerLat={userLocation?.lat ?? null}
            centerLng={userLocation?.lng ?? null}
            randomLat={randomLocation?.lat ?? null}
            randomLng={randomLocation?.lng ?? null}
            radius={radius}
            isDarkMode={isDarkMode}
            onMapClick={handleMapClick}
          />
        </div>

        {/* FLOATING CONTROLS: Glassmorphic panel */}
        {/* Desktop floating card panel */}
        <div className="absolute top-4 left-4 z-[999] hidden md:block w-96 max-w-full">
          <div className={`p-5 rounded-2xl border shadow-2xl transition-all duration-300 ${panelBg}`}>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2 mb-4">
              <Sliders size={18} className="text-blue-500" />
              Search Configuration
            </h2>

            {/* Locate me & Center input */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold tracking-wider uppercase opacity-80 flex items-center gap-1.5">
                  <MapPin size={14} className="text-blue-500" />
                  Center Location
                </label>
                <button
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all border ${
                    isDarkMode
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                      : "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <Navigation size={12} className={isLocating ? "animate-spin" : ""} />
                  {isLocating ? "Locating..." : "Locate Me"}
                </button>
              </div>

              <input
                type="text"
                value={locationInput}
                placeholder="Click map or type 'Lat, Lng'"
                onChange={(e) => handleLocationInputChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono shadow-inner transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-neutral-950/60 border-neutral-800 text-white placeholder-neutral-600"
                    : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400"
                }`}
              />
            </div>

            {/* Radius slider */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="opacity-80">SEARCH RADIUS</span>
                <span className="text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">{radius} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] opacity-50 font-medium">
                <span>1 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>

            {/* Random Generator Action Button */}
            <button
              onClick={generateRandomLocation}
              disabled={!userLocation}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                userLocation
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 active:scale-[0.98]"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed shadow-none"
              }`}
            >
              <RefreshCw size={16} className={!userLocation ? "" : "hover:rotate-180 transition-transform duration-500"} />
              Generate Random Location
            </button>

            {/* Generated coordinates display */}
            {randomLocation && (
              <div className={`mt-5 p-4 rounded-xl border transition-all duration-300 ${cardBg}`}>
                <span className="text-[10px] font-bold tracking-wider text-red-500 uppercase block mb-1">Generated Location</span>
                <div className="text-sm font-mono font-bold tracking-tight flex items-center justify-between mb-3">
                  <span>{randomLocation.lat.toFixed(6)}, {randomLocation.lng.toFixed(6)}</span>
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700/60 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                    title="Copy Coordinates"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${randomLocation.lat},${randomLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline"
                >
                  <ExternalLink size={14} />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Mobile floating panel bottom sheet */}
        <div className="absolute bottom-4 left-4 right-4 z-[999] md:hidden">
          <div className={`rounded-xl border shadow-xl p-3.5 space-y-2.5 transition-all duration-300 ${panelBg}`}>
            {/* Generated display inside the bottom sheet (Single Line) */}
            {randomLocation && (
              <div className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs font-mono font-bold ${cardBg}`}>
                <span className="truncate opacity-90">🎲 {randomLocation.lat.toFixed(5)}, {randomLocation.lng.toFixed(5)}</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={copyToClipboard}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                    title="Copy Coordinates"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${randomLocation.lat},${randomLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-blue-500"
                    title="Open in Maps"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {/* Row 1: Coordinates Input, Locate Me, and Generate Actions */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={locationInput}
                  placeholder="Tap map or type Lat, Lng"
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-none ${
                    isDarkMode
                      ? "bg-neutral-950/60 border-neutral-800 text-white placeholder-neutral-600"
                      : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400"
                  }`}
                />
              </div>

              <button
                onClick={handleLocateMe}
                disabled={isLocating}
                className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                  isDarkMode
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                    : "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100"
                } ${isLocating ? "cursor-wait opacity-50" : ""}`}
                title="Locate Me"
              >
                <Navigation size={13} className={isLocating ? "animate-spin" : ""} />
              </button>

              <button
                onClick={generateRandomLocation}
                disabled={!userLocation}
                className={`px-3 py-2 rounded-lg font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1 shadow-md shrink-0 ${
                  userLocation
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-[0.95]"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed shadow-none"
                }`}
                title="Generate Random Location"
              >
                <Sparkles size={12} />
                <span>Generate</span>
              </button>
            </div>

            {/* Row 2: Range Slider & Selection Badge */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 flex items-center">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
              </div>
              <div className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border shrink-0 ${
                isDarkMode ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-600"
              }`}>
                {radius} km
              </div>
            </div>
          </div>
        </div>

        {/* Floating instruction banners */}
        {showOnboardingHelp && (
          <div className="absolute top-4 right-4 z-[998] hidden lg:block w-72">
            <div className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 transition-all duration-300 ${panelBg}`}>
              <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold mb-1">Set a center point</h4>
                <p className="opacity-75 leading-relaxed">
                  Click anywhere on the map or click <span className="font-bold text-blue-500">Locate Me</span> to select a center point and draw the search circle.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RandomLocationMap;
