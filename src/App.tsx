/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Kitchen3D from "./components/Kitchen3D";
import KitchenSimulator from "./components/KitchenSimulator";
import RestoCustomizer from "./components/RestoCustomizer";
import MultiplayerLobby from "./components/MultiplayerLobby";
import { type Recipe, type Ingredient, type Chef, type ChatMessage, type RestaurantCustomization, RECIPES, sounds } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Sparkles, CupSoda, Heart, Award, RefreshCw, Layers } from "lucide-react";

export default function App() {
  // 1. Chef customizer
  const [currentChef, setCurrentChef] = useState({
    name: "Chef Bella",
    color: "#f43f5e", // Pink rose
  });

  // Local tab instance ID
  const tabIdRef = useRef(Math.random().toString(36).substring(2, 9));

  // 2. Active Screen / Stations state
  const [activeRecipe, setActiveRecipe] = useState<Recipe>(RECIPES[0]);
  const [activeStation, setActiveStation] = useState<"stove" | "cutting" | "assembly" | "lobby" | "idle">("idle");

  // Customization State
  const [customization, setCustomization] = useState<RestaurantCustomization>({
    wallpaper: "flowerGarden",
    flooring: "mintCheckered",
    centerpiece: "pottedTulips",
    lightingColor: "#fff0eb",
    counterColor: "#ffe4e6",
  });

  // 3. Simulated Kitchen Progress states
  const [prepProgress, setPrepProgress] = useState<{ [ingId: string]: number }>({});
  const [cookProgress, setCookProgress] = useState<{ [ingId: string]: number }>({});
  const [platedIngredients, setPlatedIngredients] = useState<string[]>([]);
  const [stoveLevel, setStoveLevel] = useState(0); // 0 = off, 1 = low, 2 = medium, 3 = high
  const [stoveTemp, setStoveTemp] = useState(0);

  // 4. Multiplayer Lobbies
  const [activeRoomId, setActiveRoomId] = useState("LOBBY-SWEET-COOPERATIVE");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);

  // Win/Plated Showcase Modal
  const [showCelebration, setShowCelebration] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Multiplayer BroadcastChannel
  const channelRef = useRef<BroadcastChannel | null>(null);

  // 5. Initialize Broadcast Channel for multi-tab sync
  useEffect(() => {
    const channelName = `sweet_pastel_kitchen_${activeRoomId}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    // Custom packet listener
    channel.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === "CHEF_PING") {
        // Send a pong back with our current state to identify ourselves
        sendBroadcast("CHEF_PONG", {
          id: tabIdRef.current,
          name: currentChef.name,
          color: currentChef.color,
          activeStation,
          position: getStationCoords(activeStation),
        });
      } else if (type === "CHEF_PONG" || type === "CHEF_UPDATE") {
        // Upsert remote chef information
        setChefs((prev) => {
          const filtered = prev.filter((c) => c.id !== payload.id);
          return [
            ...filtered,
            {
              id: payload.id,
              name: payload.name,
              color: payload.color,
              position: payload.position,
              activeStation: payload.activeStation,
              isAI: false,
            },
          ];
        });
      } else if (type === "CHAT_MESSAGE") {
        setMessages((prev) => [...prev, payload]);
      } else if (type === "KITCHEN_UPDATE") {
        // Synchronize cooking progress
        if (payload.prepProgress) setPrepProgress(payload.prepProgress);
        if (payload.cookProgress) setCookProgress(payload.cookProgress);
        if (payload.platedIngredients) setPlatedIngredients(payload.platedIngredients);
        if (payload.stoveLevel !== undefined) setStoveLevel(payload.stoveLevel);
        if (payload.stoveTemp !== undefined) setStoveTemp(payload.stoveTemp);
        if (payload.activeRecipeId && payload.activeRecipeId !== activeRecipe.id) {
          const match = RECIPES.find((r) => r.id === payload.activeRecipeId);
          if (match) setActiveRecipe(match);
        }
      } else if (type === "DECOR_UPDATE") {
        setCustomization(payload);
      }
    };

    // Broadcast our arrival
    sendBroadcast("CHEF_PING", {});

    // Periodic state broadcast to remote tabs
    const pingInterval = setInterval(() => {
      sendBroadcast("CHEF_UPDATE", {
        id: tabIdRef.current,
        name: currentChef.name,
        color: currentChef.color,
        activeStation,
        position: getStationCoords(activeStation),
      });
    }, 1500);

    return () => {
      channel.close();
      clearInterval(pingInterval);
    };
  }, [activeRoomId, currentChef, activeStation, activeRecipe]);

  // Handle AI characters if no real remote chefs are present
  useEffect(() => {
    // If we are alone in the room, populate with cute girls/pastel chefs to keep the simulation thriving!
    const activePeers = chefs.filter((c) => !c.isAI && c.id !== tabIdRef.current);
    if (activePeers.length === 0) {
      setChefs([
        {
          id: "me",
          name: currentChef.name,
          color: currentChef.color,
          position: getStationCoords(activeStation),
          activeStation,
          isAI: false,
        },
        {
          id: "ai_chloe",
          name: "Chef Chloe 🌸",
          color: "#fda4af", // Pastel Rose
          position: { x: 1.3, y: 0.5, z: -1 },
          activeStation: "cutting",
          isAI: true,
        },
        {
          id: "ai_hana",
          name: "Chef Hana 🪻",
          color: "#d8b4fe", // Purple
          position: { x: -3.5, y: 0.5, z: -1 },
          activeStation: "stove",
          isAI: true,
        },
        {
          id: "ai_stella",
          name: "Chef Stella 🌿",
          color: "#a7f3d0", // Green
          position: { x: 2, y: 0.4, z: 2.5 },
          activeStation: "lobby",
          isAI: true,
        }
      ]);
    } else {
      // Remove AI assistants if we have authentic online players
      setChefs((prev) => [
        {
          id: tabIdRef.current,
          name: currentChef.name,
          color: currentChef.color,
          position: getStationCoords(activeStation),
          activeStation,
          isAI: false,
        },
        ...activePeers,
      ]);
    }
  }, [chefs.length, currentChef, activeStation]);

  // 6. Interactive State update broadcaster
  const sendBroadcast = (type: string, payload: any) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type, payload });
    }
  };

  // Helper coordinate matching for visual 3D position
  function getStationCoords(station: string) {
    if (station === "stove") return { x: -3, y: 0.5, z: -1 };
    if (station === "cutting") return { x: -0.2, y: 0.5, z: -1 };
    if (station === "assembly") return { x: 3, y: 0.5, z: -1 };
    if (station === "lobby") return { x: 2, y: 0.4, z: 2.5 };
    return { x: 0, y: 0.5, z: 0.5 }; // central floor
  }

  // Stove Heating Simulation Engine Intervals
  useEffect(() => {
    const timer = setInterval(() => {
      // Stove cooling down / heating up logic
      if (stoveLevel > 0) {
        setStoveTemp((prev) => {
          const target = stoveLevel * 30;
          const next = prev < target ? Math.min(prev + stoveLevel * 3, 100) : Math.max(prev - 2, 0);

          // Sizzle sound based on level
          if (next > 40 && Math.random() > 0.6) {
            sounds.playSizzle(0.3);
          }

          return next;
        });

        // Heat ticks cooking progress
        setCookProgress((prev) => {
          const updated = { ...prev };
          let changed = false;

          activeRecipe.ingredients.forEach((ing) => {
            // Check if ingredient is at cooking stove
            if (ing.isLiquid || ing.name.includes("Noodles") || ing.name.includes("Batter") || ing.name.includes("Water")) {
              const currentVal = prev[ing.id] ?? 0;
              if (currentVal < 100) {
                // Ticks up based on stove speed
                updated[ing.id] = Math.min(currentVal + stoveLevel * 1.5, 105);
                changed = true;
              }
            }
          });

          if (changed) {
            sendBroadcast("KITCHEN_UPDATE", {
              prepProgress,
              cookProgress: updated,
              platedIngredients,
              stoveLevel,
              stoveTemp,
              activeRecipeId: activeRecipe.id,
            });
            return updated;
          }
          return prev;
        });
      } else {
        // Cooling down
        setStoveTemp((prev) => Math.max(prev - 3, 0));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [stoveLevel, activeRecipe, prepProgress, platedIngredients, stoveTemp]);

  // Slicing event
  const handleSliceIngredient = (ingId: string) => {
    setPrepProgress((prev) => {
      const current = prev[ingId] ?? 0;
      const next = Math.min(current + 20, 100);
      const updated = { ...prev, [ingId]: next };

      sendBroadcast("KITCHEN_UPDATE", {
        prepProgress: updated,
        cookProgress,
        platedIngredients,
        stoveLevel,
        stoveTemp,
        activeRecipeId: activeRecipe.id,
      });

      return updated;
    });
  };

  const handleAdjustStove = (level: number) => {
    setStoveLevel(level);
    sendBroadcast("KITCHEN_UPDATE", {
      prepProgress,
      cookProgress,
      platedIngredients,
      stoveLevel: level,
      stoveTemp,
      activeRecipeId: activeRecipe.id,
    });
  };

  const handleUpdateChef = (name: string, color: string) => {
    const updated = { name, color };
    setCurrentChef(updated);
  };

  const handlePlateIngredient = (ingId: string) => {
    setPlatedIngredients((prev) => {
      if (prev.includes(ingId)) return prev;
      const updated = [...prev, ingId];

      sendBroadcast("KITCHEN_UPDATE", {
        prepProgress,
        cookProgress,
        platedIngredients: updated,
        stoveLevel,
        stoveTemp,
        activeRecipeId: activeRecipe.id,
      });

      return updated;
    });
  };

  const handleUpdateCustomization = (updated: Partial<RestaurantCustomization>) => {
    setCustomization((prev) => {
      const next = { ...prev, ...updated };
      sendBroadcast("DECOR_UPDATE", next);
      return next;
    });
  };

  const handleJoinOrCreateRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setMessages([]);
    setPrepProgress({});
    setCookProgress({});
    setPlatedIngredients([]);
    setStoveLevel(0);
    setStoveTemp(0);
  };

  const handleSendMessage = (message: string) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      senderName: currentChef.name,
      senderColor: currentChef.color,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    sendBroadcast("CHAT_MESSAGE", newMsg);
  };

  const activeIngredient = activeRecipe.ingredients.find((ing) => {
    // Slicing active ingredient is the one not prepped
    if (ing.isLiquid) return false;
    const prog = prepProgress[ing.id] ?? 0;
    return prog < 100;
  }) || null;

  const handleFinishDish = () => {
    // Calculate Score based on slice precision and perfect boiling points
    let points = 80; // base

    activeRecipe.ingredients.forEach((ing) => {
      const cookVal = cookProgress[ing.id] ?? 0;
      if (ing.isLiquid || ing.name.includes("Noodles")) {
        // Perfect boiling temperature score
        if (cookVal >= 70 && cookVal <= 90) points += 10;
        else if (cookVal > 90) points -= 20; // burnt deduction
      }
    });

    if (customization.centerpiece === "pottedTulips") points += 5; // table decorations bonus
    if (chefs.length > 2) points += 5; // cooperative chef multiplier

    setFinalScore(Math.max(10, Math.min(points, 100)));
    setShowCelebration(true);
  };

  const resetKitchen = () => {
    setPrepProgress({});
    setCookProgress({});
    setPlatedIngredients([]);
    setStoveLevel(0);
    setStoveTemp(0);
    setShowCelebration(false);
  };

  return (
    <div className="min-h-screen bg-[#fffafd] pb-12 overflow-x-hidden relative font-sans text-slate-800">
      {/* Background aesthetics rings */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#ffd6e0]/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#f3e8ff]/40 rounded-full blur-3xl -z-10"></div>

      {/* Aesthetic Top Navigation Brand */}
      <header className="max-w-7xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <div id="brand" className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-pink-100 to-rose-200 text-rose-500 rounded-2xl shadow-md border border-white">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-pink-400 bg-pink-100/30 px-3 py-0.5 rounded-full">
              Bistro Manis Estetis
            </span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5 mt-0.5">
              Sweet Pastel Kitchen 3D <Heart className="w-4 h-4 fill-rose-300 text-rose-300 animate-bounce" />
            </h1>
          </div>
        </div>

        {/* Dynamic Recipe Tab bar */}
        <div className="hidden lg:flex items-center gap-3 bg-white/70 p-1.5 rounded-2xl border border-rose-100/60 shadow-sm">
          {RECIPES.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => {
                sounds.playPop();
                setActiveRecipe(recipe);
                resetKitchen();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeRecipe.id === recipe.id
                  ? "bg-rose-400 text-white shadow-md shadow-pink-100"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span>{recipe.emoji}</span>
              <span>{recipe.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid Viewport */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left column: 3D stage and active customization (7 span) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mobile recipe switcher selector */}
          <div className="lg:hidden bg-white/60 p-3 rounded-2xl border border-rose-100/60 flex gap-2 overflow-x-auto scrollbar-thin">
            {RECIPES.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => {
                  sounds.playPop();
                  setActiveRecipe(recipe);
                  resetKitchen();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeRecipe.id === recipe.id
                    ? "bg-rose-400 text-white shadow-md"
                    : "text-slate-500 bg-slate-50/50"
                }`}
              >
                {recipe.emoji} {recipe.name}
              </button>
            ))}
          </div>

          <Kitchen3D
            chefs={chefs}
            activeStation={activeStation}
            activeRecipe={activeRecipe}
            activeIngredient={activeIngredient}
            customization={customization}
            isStoveOn={stoveLevel > 0}
            stoveLevel={stoveLevel}
            onStationClick={(station) => {
              setActiveStation(station);
            }}
          />

          {/* Quick Focus station switch deck */}
          <div className="bg-white/65 backdrop-blur-md rounded-2xl p-3 border border-pink-100/50 flex flex-wrap items-center justify-around gap-2 shadow-md">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-2 block md:inline">
              Fokus Kamera 3D:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "idle", name: "Overview 🎥", color: "bg-slate-50 text-slate-600 border-slate-200" },
                { id: "stove", name: "Kompor Masak 🍳", color: "bg-orange-50 text-orange-600 border-orange-100" },
                { id: "cutting", name: "Papan Irisan 🔪", color: "bg-pink-50 text-pink-600 border-pink-100" },
                { id: "assembly", name: "Meja Plating 🍽️", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                { id: "lobby", name: "Resto Dekor 🪻", color: "bg-purple-50 text-purple-600 border-[#f5f3ff]" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    sounds.playPop();
                    setActiveStation(st.id as any);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                    activeStation === st.id
                      ? "ring-2 ring-rose-400 scale-102"
                      : "hover:bg-slate-50"
                  } ${st.color}`}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>

          {/* Resto interior customizer tab-box */}
          <RestoCustomizer
            customization={customization}
            onUpdateCustomization={handleUpdateCustomization}
          />
        </div>

        {/* Right column: Interactive kitchen workspace simulator and lobbies (5 span) */}
        <div className="lg:col-span-5 space-y-6">
          <KitchenSimulator
            activeRecipe={activeRecipe}
            activeIngredient={activeIngredient}
            stoveLevel={stoveLevel}
            stoveTemp={stoveTemp}
            prepProgress={prepProgress}
            cookProgress={cookProgress}
            platedIngredients={platedIngredients}
            isFinished={showCelebration}
            onSliceIngredient={handleSliceIngredient}
            onAdjustStove={handleAdjustStove}
            onPlateIngredient={handlePlateIngredient}
            onFinishDish={handleFinishDish}
          />

          <MultiplayerLobby
            currentChef={currentChef}
            onUpdateChef={handleUpdateChef}
            activeRoomId={activeRoomId}
            onJoinOrCreateRoom={handleJoinOrCreateRoom}
            chefs={chefs}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>
      </main>

      {/* Real-time sync connection footer bar */}
      <footer className="text-center text-[10px] text-slate-400 font-bold tracking-widest mt-12 mb-6 uppercase">
        <Sparkles className="w-3.5 h-3.5 inline-block text-pink-300 animate-spin mr-1 translate-y-[-1px]" /> Sweet Pastel Kitchen 3D &copy; 2026. Made with true love and aesthetic pastel textures.
      </footer>

      {/* Celebration Award Success Modal */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 bg-rose-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-[#ffcbd6] rounded-[36px] max-w-md w-full p-8 text-center shadow-3xl relative overflow-hidden"
            >
              {/* Confetti simulation shapes inside pink wrapper */}
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-pink-300 via-[#ffd6e0] to-[#fae8ff]" />

              <div className="w-20 h-20 bg-gradient-to-tr from-pink-100 to-rose-200 border border-rose-300/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Award className="w-10 h-10 animate-bounce" />
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-3.5 py-1 rounded-full border border-rose-100">
                HIDANGAN BERHASIL DISAJIKAN!
              </span>

              <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-4">
                Sempurna & Sangat Lezat!
              </h2>

              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Anda selesai menyajikan <strong className="text-pink-500">{activeRecipe.name}</strong> dengan tata rias piring yang luar biasa cantik bersama koki-koki andal Anda!
              </p>

              {/* Score breakdown */}
              <div className="my-6 bg-rose-50/40 border border-rose-100/60 p-4 rounded-2xl flex items-center justify-around gap-2">
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Estetika Dapur</span>
                  <span className="text-sm font-black text-rose-500 mt-0.5 block flex items-center justify-center gap-1">
                    ⭐⭐⭐⭐⭐
                  </span>
                </div>
                <div className="w-px h-10 bg-rose-100/80"></div>
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Skor Memasak</span>
                  <span className="text-lg font-black text-slate-800 tracking-tight mt-0.5 block">
                    {finalScore} / 100
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={resetKitchen}
                  className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl text-xs font-black shadow-md shadow-rose-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Masak Menu Lainnya
                </button>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-2xl text-xs font-semibold transition-all border border-slate-200/40"
                >
                  Lihat Hasil Akhir Piring
                </button>
              </div>

              <div className="mt-5 text-[9px] text-[#ff85a1] font-bold flex items-center justify-center gap-1">
                <span>🌸</span>
                <span>Kerja bagus, para koki berbakat!</span>
                <span>🌸</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
