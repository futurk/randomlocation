import React, { useState } from "react";
import {
  getRandomLocation,
  generateRandomRoute,
  getDistanceInKm,
  formatDistance,
  getGoogleMapsUrl,
  getGoogleMapsRouteUrl,
  getKomootUrl,
  LatLng,
} from "./helpers";
import Map from "./Map";
import DualRangeSlider from "./DualRangeSlider";
import {
  Moon,
  Sun,
  RefreshCw,
  LocateFixed,
  MapPin,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Info,
  Route as RouteIcon,
  Repeat,
  ArrowRight,
  Sliders,
  X,
  Github,
} from "lucide-react";

type AppMode = "single" | "route";

const getModeFromHash = (): AppMode => {
  if (typeof window !== "undefined") {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("route")) {
      return "route";
    }
  }
  return "single";
};

const RandomLocationMap = () => {
  const [appMode, setAppMode] = useState<AppMode>(getModeFromHash);

  // Sync mode changes to URL hash (#/location vs #/route)
  const switchMode = (mode: AppMode) => {
    setAppMode(mode);
    if (typeof window !== "undefined") {
      const targetHash = mode === "route" ? "#/route" : "#/location";
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, "", targetHash);
      }
    }
  };

  // Sync URL hash changes on browser Back/Forward navigation
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/location");
    }

    const handleHashChange = () => {
      const newMode = getModeFromHash();
      setAppMode(newMode);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Single Location Mode State
  const [minRadius, setMinRadius] = useState<number>(2); // Default min 2 km
  const [maxRadius, setMaxRadius] = useState<number>(20); // Default max 20 km
  const [randomLocation, setRandomLocation] = useState<LatLng | null>(null);

  // Route Planner Mode State
  const [numWaypoints, setNumWaypoints] = useState<number>(2); // 1 to 4
  const [roundTrip, setRoundTrip] = useState<boolean>(false); // One Way default
  const [minRouteDist, setMinRouteDist] = useState<number>(0); // in km
  const [maxRouteDist, setMaxRouteDist] = useState<number>(50); // in km
  const [routeResult, setRouteResult] = useState<{
    waypoints: LatLng[];
    totalDistance: number;
  } | null>(null);

  // Shared State
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationInput, setLocationInput] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showOnboardingHelp, setShowOnboardingHelp] = useState<boolean>(true);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState<boolean>(false);

  // Single Radius Change Handlers
  const handleMinRadiusChange = (val: number) => {
    if (isNaN(val)) return;
    const newMin = Math.max(0, Math.min(val, 500));
    setMinRadius(newMin);
    if (newMin > maxRadius) setMaxRadius(newMin);
  };

  const handleMaxRadiusChange = (val: number) => {
    if (isNaN(val)) return;
    const newMax = Math.max(0, Math.min(val, 500));
    setMaxRadius(newMax);
    if (newMax < minRadius) setMinRadius(newMax);
  };

  // Route Distance Change Handlers
  const handleMinRouteDistChange = (val: number) => {
    if (isNaN(val)) return;
    const newMin = Math.max(0, Math.min(val, 500));
    setMinRouteDist(newMin);
    if (newMin > maxRouteDist) setMaxRouteDist(newMin);
  };

  const handleMaxRouteDistChange = (val: number) => {
    if (isNaN(val)) return;
    const newMax = Math.max(0, Math.min(val, 500));
    setMaxRouteDist(newMax);
    if (newMax < minRouteDist) setMinRouteDist(newMax);
  };

  // Trigger Generator
  const handleGenerate = () => {
    if (!userLocation) return;

    if (appMode === "single") {
      const randomLoc = getRandomLocation(
        userLocation.lat,
        userLocation.lng,
        minRadius,
        maxRadius
      );
      setRandomLocation(randomLoc);
    } else {
      const result = generateRandomRoute(
        userLocation.lat,
        userLocation.lng,
        numWaypoints,
        minRouteDist,
        maxRouteDist,
        roundTrip
      );
      setRouteResult(result);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Single mode distance from center
  const distanceFromCenter =
    userLocation && randomLocation
      ? getDistanceInKm(
          userLocation.lat,
          userLocation.lng,
          randomLocation.lat,
          randomLocation.lng
        )
      : null;

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
            <p className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">Adventure & Route Generator</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/futurk/georandom"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${
              isDarkMode
                ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                : "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
            title="GitHub Repository"
          >
            <Github size={18} />
          </a>

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
            mode={appMode}
            randomLat={randomLocation?.lat ?? null}
            randomLng={randomLocation?.lng ?? null}
            minRadius={minRadius}
            maxRadius={maxRadius}
            routeWaypoints={routeResult?.waypoints ?? []}
            roundTrip={roundTrip}
            isDarkMode={isDarkMode}
            onMapClick={handleMapClick}
          />
        </div>

        {/* FLOATING CONTROLS: Glassmorphic panel */}
        {/* Desktop floating card panel */}
        <div className="absolute top-4 left-4 z-[999] hidden md:block w-96 max-w-full">
          <div className={`p-5 rounded-2xl border shadow-2xl transition-all duration-300 ${panelBg}`}>
            {/* Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 text-xs font-bold mb-4">
              <button
                onClick={() => switchMode("single")}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  appMode === "single"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <MapPin size={13} />
                <span>Single Location</span>
              </button>
              <button
                onClick={() => switchMode("route")}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  appMode === "route"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <RouteIcon size={13} />
                <span>Route Planner</span>
              </button>
            </div>

            {/* Center Location input with inline Locate Me button */}
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-semibold tracking-wider uppercase opacity-80 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-500" />
                Center Location
              </label>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={locationInput}
                  placeholder="Click map or type 'Lat, Lng'"
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  className={`w-full pl-3.5 pr-28 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono shadow-inner transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-neutral-950/60 border-neutral-800 text-white placeholder-neutral-600"
                      : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400"
                  }`}
                />
                <button
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className={`absolute right-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all border ${
                    isDarkMode
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                      : "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100"
                  } ${isLocating ? "cursor-wait opacity-50" : ""}`}
                  title="Fetch Browser Location"
                >
                  <LocateFixed size={12} className={isLocating ? "animate-spin" : ""} />
                  <span>{isLocating ? "Locating..." : "Locate Me"}</span>
                </button>
              </div>
            </div>

            {/* MODE 1: Single Location Controls (Dual-Thumb Slider) */}
            {appMode === "single" && (
              <div className="space-y-2 mb-5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="opacity-80">SEARCH BOUNDARIES</span>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className="flex items-center space-x-1">
                      <span className="text-[10px] text-amber-500 font-bold">MIN</span>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={minRadius}
                        onChange={(e) => handleMinRadiusChange(Number(e.target.value))}
                        className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-amber-500 text-xs focus:outline-none ${
                          isDarkMode
                            ? "bg-neutral-950/60 border-neutral-800 text-amber-500"
                            : "bg-white border-neutral-300 text-amber-600"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-amber-500">km</span>
                    </span>
                    <span className="opacity-40">—</span>
                    <span className="flex items-center space-x-1">
                      <span className="text-[10px] text-blue-500 font-bold">MAX</span>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={maxRadius}
                        onChange={(e) => handleMaxRadiusChange(Number(e.target.value))}
                        className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-blue-500 text-xs focus:outline-none ${
                          isDarkMode
                            ? "bg-neutral-950/60 border-neutral-800 text-blue-400"
                            : "bg-white border-neutral-300 text-blue-600"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-blue-500">km</span>
                    </span>
                  </div>
                </div>

                <DualRangeSlider
                  min={0}
                  max={500}
                  step={10}
                  minValue={minRadius}
                  maxValue={maxRadius}
                  onMinChange={handleMinRadiusChange}
                  onMaxChange={handleMaxRadiusChange}
                  isDarkMode={isDarkMode}
                />

                <div className="flex justify-between text-[10px] opacity-40 font-medium pt-0.5">
                  <span>0 km</span>
                  <span>250 km</span>
                  <span>500 km</span>
                </div>
              </div>
            )}

            {/* MODE 2: Route Planner Controls (Dual-Thumb Slider) */}
            {appMode === "route" && (
              <div className="space-y-3.5 mb-5">
                {/* Total Air Distance Controls */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="opacity-80">TOTAL ROUTE DISTANCE</span>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="flex items-center space-x-1">
                        <span className="text-[10px] text-amber-500 font-bold">MIN</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={minRouteDist}
                          onChange={(e) => handleMinRouteDistChange(Number(e.target.value))}
                          className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-amber-500 text-xs focus:outline-none ${
                            isDarkMode
                              ? "bg-neutral-950/60 border-neutral-800 text-amber-500"
                              : "bg-white border-neutral-300 text-amber-600"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-amber-500">km</span>
                      </span>
                      <span className="opacity-40">—</span>
                      <span className="flex items-center space-x-1">
                        <span className="text-[10px] text-blue-500 font-bold">MAX</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={maxRouteDist}
                          onChange={(e) => handleMaxRouteDistChange(Number(e.target.value))}
                          className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-blue-500 text-xs focus:outline-none ${
                            isDarkMode
                              ? "bg-neutral-950/60 border-neutral-800 text-blue-400"
                              : "bg-white border-neutral-300 text-blue-600"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-blue-500">km</span>
                      </span>
                    </div>
                  </div>

                  <DualRangeSlider
                    min={0}
                    max={500}
                    step={10}
                    minValue={minRouteDist}
                    maxValue={maxRouteDist}
                    onMinChange={handleMinRouteDistChange}
                    onMaxChange={handleMaxRouteDistChange}
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* Waypoints count and Round-trip toggle */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Waypoints Count */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold opacity-80 block">Waypoints</label>
                    <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={`wp-btn-${n}`}
                          onClick={() => setNumWaypoints(n)}
                          className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                            numWaypoints === n
                              ? "bg-blue-600 text-white shadow"
                              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Round Trip Switch */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold opacity-80 block">Route Type</label>
                    <button
                      onClick={() => setRoundTrip(!roundTrip)}
                      className={`w-full py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        roundTrip
                          ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-400"
                          : "bg-neutral-100 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-500"
                      }`}
                    >
                      {roundTrip ? <Repeat size={13} /> : <ArrowRight size={13} />}
                      <span>{roundTrip ? "Round Trip" : "One Way"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Random Generator Action Button */}
            <button
              onClick={handleGenerate}
              disabled={!userLocation}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                userLocation
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 active:scale-[0.98]"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed shadow-none"
              }`}
            >
              <RefreshCw size={16} className={!userLocation ? "" : "hover:rotate-180 transition-transform duration-500"} />
              <span>{appMode === "single" ? "Generate Random Location" : "Generate Random Route"}</span>
            </button>

            {/* SINGLE MODE: Generated location display */}
            {appMode === "single" && randomLocation && (
              <div className={`mt-5 p-4 rounded-xl border transition-all duration-300 ${cardBg}`}>
                <span className="text-[10px] font-bold tracking-wider text-red-500 uppercase block mb-1">Generated Location</span>
                <div className="text-sm font-mono font-bold tracking-tight flex items-center justify-between mb-1">
                  <span>{randomLocation.lat.toFixed(6)}, {randomLocation.lng.toFixed(6)}</span>
                  <button
                    onClick={() => copyToClipboard(`${randomLocation.lat.toFixed(6)}, ${randomLocation.lng.toFixed(6)}`)}
                    className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700/60 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                    title="Copy Coordinates"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>

                {distanceFromCenter !== null && (
                  <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1">
                    <span>📏 Distance:</span>
                    <span className="font-bold text-blue-500 font-mono">{formatDistance(distanceFromCenter)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex flex-col gap-2">
                  <a
                    href={getGoogleMapsUrl(randomLocation.lat, randomLocation.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-bold transition-all border border-blue-500/20"
                  >
                    <ExternalLink size={14} />
                    Open in Google Maps
                  </a>
                  <a
                    href={getKomootUrl(randomLocation.lat, randomLocation.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold transition-all border border-emerald-500/20"
                  >
                    <ExternalLink size={14} />
                    Open in Komoot
                  </a>
                </div>
              </div>
            )}

            {/* ROUTE MODE: Generated route display */}
            {appMode === "route" && routeResult && (
              <div className={`mt-5 p-4 rounded-xl border transition-all duration-300 ${cardBg}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">
                    Generated Route ({routeResult.waypoints.length} Waypoints)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                    {roundTrip ? "Round Trip" : "One Way"}
                  </span>
                </div>

                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1">
                  <span>📏 Total Distance:</span>
                  <span className="font-bold text-blue-500 font-mono">{formatDistance(routeResult.totalDistance)}</span>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex flex-col gap-2">
                  <a
                    href={getGoogleMapsRouteUrl(userLocation, routeResult.waypoints, roundTrip)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-bold transition-all border border-blue-500/20"
                  >
                    <ExternalLink size={14} />
                    Open Route in Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Floating Dock (Collapsed View) */}
        <div className="absolute bottom-4 left-4 right-4 z-[999] md:hidden space-y-2">
          {/* Generated Result Ribbon (Single Line) */}
          {appMode === "single" && randomLocation && (
            <div className={`px-3 py-2 rounded-xl border shadow-lg flex items-center justify-between text-xs font-mono font-bold ${cardBg}`}>
              <span className="truncate opacity-90 flex items-center gap-1">
                <span>🎲 {randomLocation.lat.toFixed(4)}, {randomLocation.lng.toFixed(4)}</span>
                {distanceFromCenter !== null && (
                  <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded ml-0.5">
                    ({formatDistance(distanceFromCenter)})
                  </span>
                )}
              </span>
              <div className="flex items-center space-x-1 shrink-0 ml-1">
                <button
                  onClick={() => copyToClipboard(`${randomLocation.lat.toFixed(6)}, ${randomLocation.lng.toFixed(6)}`)}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                  title="Copy Coordinates"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                <a
                  href={getGoogleMapsUrl(randomLocation.lat, randomLocation.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-bold"
                  title="Google Maps"
                >
                  Maps
                </a>
                <a
                  href={getKomootUrl(randomLocation.lat, randomLocation.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold"
                  title="Komoot"
                >
                  Komoot
                </a>
              </div>
            </div>
          )}

          {appMode === "route" && routeResult && (
            <div className={`px-3 py-2 rounded-xl border shadow-lg flex items-center justify-between text-xs font-mono font-bold ${cardBg}`}>
              <span className="truncate opacity-90 flex items-center gap-1">
                <span>🗺️ {routeResult.waypoints.length} Waypoints</span>
                <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded ml-0.5">
                  ({formatDistance(routeResult.totalDistance)})
                </span>
              </span>
              <div className="flex items-center space-x-1 shrink-0 ml-1">
                <a
                  href={getGoogleMapsRouteUrl(userLocation, routeResult.waypoints, roundTrip)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-bold"
                  title="Google Maps Route"
                >
                  Maps
                </a>
              </div>
            </div>
          )}

          {/* Main Control Dock */}
          <div className={`rounded-xl border shadow-xl p-2.5 flex items-center space-x-2 transition-all duration-300 ${panelBg}`}>
            {/* Filter / Settings Button */}
            <button
              onClick={() => setIsMobileSettingsOpen(true)}
              className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                isDarkMode
                  ? "bg-neutral-800 border-neutral-700 text-blue-400 hover:bg-neutral-700"
                  : "bg-neutral-100 border-neutral-300 text-blue-600 hover:bg-neutral-200"
              }`}
              title="Open Configuration"
            >
              <Sliders size={16} />
            </button>

            {/* Center Location Input with embedded GPS button */}
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={locationInput}
                placeholder="Tap map or type Lat, Lng"
                onChange={(e) => handleLocationInputChange(e.target.value)}
                className={`w-full pl-3 pr-8 py-2 rounded-lg border text-xs font-mono focus:outline-none ${
                  isDarkMode
                    ? "bg-neutral-950/60 border-neutral-800 text-white placeholder-neutral-600"
                    : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400"
                }`}
              />
              <button
                onClick={handleLocateMe}
                disabled={isLocating}
                className={`absolute right-1 p-1 rounded-md flex items-center justify-center transition-all ${
                  isDarkMode
                    ? "text-blue-400 hover:bg-blue-500/20"
                    : "text-blue-600 hover:bg-blue-100"
                } ${isLocating ? "cursor-wait opacity-50" : ""}`}
                title="Locate Me"
              >
                <LocateFixed size={14} className={isLocating ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={!userLocation}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1 shadow-md shrink-0 ${
                userLocation
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-[0.95]"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed shadow-none"
              }`}
              title="Generate"
            >
              <Sparkles size={13} />
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Mobile Expanded Drawer Modal / Bottom Sheet */}
        {isMobileSettingsOpen && (
          <div className="fixed inset-0 z-[1000] md:hidden flex flex-col justify-end bg-black/40 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <div className="flex-1" onClick={() => setIsMobileSettingsOpen(false)} />

            {/* Drawer Card */}
            <div className={`rounded-t-2xl border-t shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto transition-all ${panelBg}`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sliders size={16} className="text-blue-500" />
                  <span>Search Configuration</span>
                </h3>
                <button
                  onClick={() => setIsMobileSettingsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 1. Waypoints & Route Type (Route Mode only) */}
              {appMode === "route" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Waypoints Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold opacity-80 block">Waypoints</label>
                    <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={`m-exp-wp-${n}`}
                          onClick={() => setNumWaypoints(n)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            numWaypoints === n ? "bg-blue-600 text-white shadow" : "text-neutral-500"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Roundtrip Button */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold opacity-80 block">Route Type</label>
                    <button
                      onClick={() => setRoundTrip(!roundTrip)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        roundTrip
                          ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-400"
                          : "bg-neutral-100 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-500"
                      }`}
                    >
                      {roundTrip ? <Repeat size={14} /> : <ArrowRight size={14} />}
                      <span>{roundTrip ? "Round Trip" : "One Way"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Distance Slider */}
              {appMode === "single" ? (
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="opacity-80">SEARCH BOUNDARIES</span>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="flex items-center space-x-1">
                        <span className="text-[10px] text-amber-500 font-bold">MIN</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={minRadius}
                          onChange={(e) => handleMinRadiusChange(Number(e.target.value))}
                          className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-amber-500 text-xs focus:outline-none ${
                            isDarkMode ? "bg-neutral-950/60 border-neutral-800" : "bg-white border-neutral-300"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-amber-500">km</span>
                      </span>
                      <span className="opacity-40">—</span>
                      <span className="flex items-center space-x-1">
                        <span className="text-[10px] text-blue-500 font-bold">MAX</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={maxRadius}
                          onChange={(e) => handleMaxRadiusChange(Number(e.target.value))}
                          className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-blue-500 text-xs focus:outline-none ${
                            isDarkMode ? "bg-neutral-950/60 border-neutral-800" : "bg-white border-neutral-300"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-blue-500">km</span>
                      </span>
                    </div>
                  </div>

                  <DualRangeSlider
                    min={0}
                    max={500}
                    step={10}
                    minValue={minRadius}
                    maxValue={maxRadius}
                    onMinChange={handleMinRadiusChange}
                    onMaxChange={handleMaxRadiusChange}
                    isDarkMode={isDarkMode}
                  />
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="opacity-80">TOTAL ROUTE DISTANCE</span>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="flex items-center space-x-1">
                        <span className="text-[10px] text-amber-500 font-bold">MIN</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={minRouteDist}
                          onChange={(e) => handleMinRouteDistChange(Number(e.target.value))}
                          className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-amber-500 text-xs focus:outline-none ${
                            isDarkMode ? "bg-neutral-950/60 border-neutral-800" : "bg-white border-neutral-300"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-amber-500">km</span>
                      </span>
                      <span className="opacity-40">—</span>
                      <span className="flex items-center space-x-1">
                        <span className="text-[10px] text-blue-500 font-bold">MAX</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={maxRouteDist}
                          onChange={(e) => handleMaxRouteDistChange(Number(e.target.value))}
                          className={`w-12 px-1 py-0.5 rounded border text-right font-mono font-bold text-blue-500 text-xs focus:outline-none ${
                            isDarkMode ? "bg-neutral-950/60 border-neutral-800" : "bg-white border-neutral-300"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-blue-500">km</span>
                      </span>
                    </div>
                  </div>

                  <DualRangeSlider
                    min={0}
                    max={500}
                    step={10}
                    minValue={minRouteDist}
                    maxValue={maxRouteDist}
                    onMinChange={handleMinRouteDistChange}
                    onMaxChange={handleMaxRouteDistChange}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* 3. Mode Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase opacity-75">Generator Mode</label>
                <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 text-xs font-bold">
                  <button
                    onClick={() => switchMode("single")}
                    className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      appMode === "single"
                        ? "bg-blue-600 text-white shadow"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    <MapPin size={14} />
                    <span>Single Location</span>
                  </button>
                  <button
                    onClick={() => switchMode("route")}
                    className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      appMode === "route"
                        ? "bg-blue-600 text-white shadow"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    <RouteIcon size={14} />
                    <span>Route Planner</span>
                  </button>
                </div>
              </div>

              {/* Done Button */}
              <button
                onClick={() => setIsMobileSettingsOpen(false)}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs tracking-wide shadow-lg active:scale-[0.98] transition-all"
              >
                Apply & Done
              </button>
            </div>
          </div>
        )}

        {/* Floating instruction banners */}
        {showOnboardingHelp && (
          <div className="absolute top-4 right-4 z-[998] hidden lg:block w-72">
            <div className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 transition-all duration-300 ${panelBg}`}>
              <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold mb-1">Set a center point</h4>
                <p className="opacity-75 leading-relaxed">
                  Click anywhere on the map or click <span className="font-bold text-blue-500">Locate Me</span> to select a center point and draw the search zone.
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
