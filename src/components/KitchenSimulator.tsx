/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { type Recipe, type Ingredient, sounds } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Flame, CheckCircle, FlameKindling, Info, Sparkles, ChefHat } from "lucide-react";

interface KitchenSimulatorProps {
  activeRecipe: Recipe | null;
  activeIngredient: Ingredient | null;
  stoveLevel: number;
  stoveTemp: number;
  prepProgress: { [ingredientId: string]: number };
  cookProgress: { [ingredientId: string]: number };
  platedIngredients: string[];
  isFinished: boolean;
  onSliceIngredient: (ingId: string) => void;
  onAdjustStove: (level: number) => void;
  onPlateIngredient: (ingId: string) => void;
  onFinishDish: () => void;
}

export default function KitchenSimulator({
  activeRecipe,
  activeIngredient,
  stoveLevel,
  stoveTemp,
  prepProgress,
  cookProgress,
  platedIngredients,
  isFinished,
  onSliceIngredient,
  onAdjustStove,
  onPlateIngredient,
  onFinishDish,
}: KitchenSimulatorProps) {
  // Stove heating tick effect
  const [activeTab, setActiveTab] = useState<"prep" | "cook" | "plate">("prep");

  useEffect(() => {
    if (activeIngredient) {
      if (activeIngredient.isLiquid) {
        setActiveTab("cook");
      } else {
        setActiveTab("prep");
      }
    }
  }, [activeIngredient]);

  if (!activeRecipe) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-pink-50/40 rounded-3xl border-2 border-dashed border-pink-100 text-center min-h-[300px]">
        <ChefHat className="w-12 h-12 text-pink-300 animate-bounce mb-3" />
        <h3 className="text-lg font-semibold text-slate-700 font-sans">Belum ada Resep Aktif</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Silakan pilih resep hidangan manis di menu samping untuk membuka simulasi memasak interaktif!
        </p>
      </div>
    );
  }

  const allIngredientsPrepared = activeRecipe.ingredients.every((ing) => {
    const isSliced = (prepProgress[ing.id] ?? 0) >= 100;
    return isSliced || ing.isLiquid;
  });

  const allIngredientsCooked = activeRecipe.ingredients.every((ing) => {
    // Only liquid or specific items need hot boiling/cooking
    if (ing.isLiquid || ing.name.includes("Noodles") || ing.name.includes("Batter") || ing.name.includes("Water")) {
      return (cookProgress[ing.id] ?? 0) >= 100;
    }
    return true;
  });

  const allIngredientsPlated = activeRecipe.ingredients.every((ing) =>
    platedIngredients.includes(ing.id)
  );

  return (
    <div id="kitchen-simulator-panel" className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border-2 border-[#fff1f2] shadow-xl font-sans">
      {/* Active Dish Headers */}
      <div className="flex items-start justify-between border-b border-rose-100 pb-4 mb-5">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-400 bg-rose-50 px-2.5 py-0.5 rounded-full">
            MEMASAK AKTIF
          </span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1">
            {activeRecipe.displayName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {activeRecipe.description}
          </p>
        </div>
        <div className="text-3xl p-2 bg-gradient-to-tr from-pink-50 to-rose-100 border border-rose-200/50 rounded-2xl shadow-sm">
          {activeRecipe.emoji}
        </div>
      </div>

      {/* Steps Checkbox Checklist */}
      <div className="mb-6 bg-rose-50/30 rounded-2xl p-4 border border-rose-100/30">
        <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1 mb-2.5 uppercase tracking-wider">
          <Info className="w-3.5 h-3.5" /> Panduan Memasak Sukses
        </h4>
        <div className="space-y-2">
          {activeRecipe.steps.map((step, index) => {
            // Check step success conditionally to glow green
            let finished = false;
            if (index === 0) finished = true; // always show prep start
            if (index === 1 && allIngredientsPrepared) finished = true;
            if (index === 2 && allIngredientsPrepared && allIngredientsCooked) finished = true;
            if (index === 3 && allIngredientsPlated) finished = true;
            if (index === 4 && isFinished) finished = true;

            return (
              <div
                key={index}
                className={`flex gap-2 items-start text-xs rounded-xl p-1.5 px-2.5 transition-all ${
                  finished
                    ? "bg-emerald-50/50 text-emerald-700"
                    : "text-slate-500"
                }`}
              >
                <div className="mt-0.5">
                  <CheckCircle className={`w-3.5 h-3.5 ${finished ? "text-emerald-500" : "text-slate-300"}`} />
                </div>
                <span className={finished ? "line-through opacity-80" : ""}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator Station Sub-Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-rose-50/50 rounded-2xl mb-6 border border-pink-100/50">
        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab("prep");
          }}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "prep"
              ? "bg-white text-rose-500 shadow-sm"
              : "text-slate-400 hover:text-rose-400"
          }`}
        >
          🔪 Talenan (Prep)
        </button>
        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab("cook");
          }}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "cook"
              ? "bg-white text-rose-500 shadow-sm"
              : "text-slate-400 hover:text-rose-400"
          }`}
        >
          🍳 Kompor (Cook)
        </button>
        <button
          onClick={() => {
            sounds.playPop();
            setActiveTab("plate");
          }}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "plate"
              ? "bg-white text-rose-500 shadow-sm"
              : "text-slate-400 hover:text-rose-400"
          }`}
        >
          🍽️ Piring (Plate)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          {activeTab === "prep" && (
            <motion.div
              key="prep-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Bahan Makanan Talenan
                </span>
                <div className="space-y-3">
                  {activeRecipe.ingredients
                    .filter((ing) => !ing.isLiquid)
                    .map((ing) => {
                      const prog = prepProgress[ing.id] ?? 0;
                      const done = prog >= 100;

                      return (
                        <div
                          key={ing.id}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-50 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1 mr-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full inline-block border shadow-inner"
                                style={{ backgroundColor: ing.color }}
                              ></span>
                              <span className="text-xs font-bold text-slate-700">
                                {ing.displayName}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200/40">
                              <div
                                className="bg-gradient-to-r from-rose-300 to-pink-400 h-full transition-all duration-300 rounded-full"
                                style={{ width: `${prog}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            {done ? (
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                Selesai Diiris 👍
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  sounds.playChop();
                                  onSliceIngredient(ing.id);
                                }}
                                className="py-1 px-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-200 hover:shadow-lg transition-all"
                              >
                                🔪 Iris Tipis
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "cook" && (
            <motion.div
              key="cook-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Heat controls */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-700">Atur Tingkat Api Kompor</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Suhu koki ideal: di atas garis Hijau!</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-100 rounded-full">
                    <Flame className={`w-3.5 h-3.5 ${stoveLevel > 0 ? "text-rose-500 animate-pulse" : "text-slate-300"}`} />
                    <span className="text-xs font-bold text-rose-600">Level {stoveLevel}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {["Off", "Kecil", "Sedang", "Besar"].map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playPop();
                        onAdjustStove(idx);
                        if (idx > 0) sounds.playSizzle(idx * 0.4);
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        stoveLevel === idx
                          ? "bg-rose-400 text-white border-rose-300 shadow-md shadow-rose-100 font-extrabold"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sub-item stoves cooking progress */}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 mt-4 border-t border-slate-100 pt-3">
                  Penyelesaian Saus & Panggang
                </span>

                <div className="space-y-3">
                  {activeRecipe.ingredients
                    .filter(
                      (ing) =>
                        ing.isLiquid ||
                        ing.name.includes("Noodles") ||
                        ing.name.includes("Batter") ||
                        ing.name.includes("Water")
                    )
                    .map((ing) => {
                      const prog = cookProgress[ing.id] ?? 0;
                      // Determine status
                      let statusText = "Masih Dingin/Mentah";
                      let statusColor = "text-slate-400 bg-slate-50";
                      if (prog > 10 && prog < 70) {
                        statusText = "Mulai Masak... 🔥";
                        statusColor = "text-orange-500 bg-orange-50";
                      } else if (prog >= 70 && prog <= 90) {
                        statusText = "Matang Sempurna! ⭐";
                        statusColor = "text-emerald-500 bg-emerald-50 border-emerald-100 border";
                      } else if (prog > 90) {
                        statusText = "Waduh, Hangus Gosong! 😭";
                        statusColor = "text-rose-600 bg-rose-50 border-rose-100 border";
                      }

                      return (
                        <div
                          key={ing.id}
                          className="bg-white p-3 rounded-xl border border-rose-50 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700">{ing.displayName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40 relative">
                            {/* Target golden perfect zone marker */}
                            <div className="absolute left-[70%] right-[10%] bg-emerald-400/20 h-full border-l border-r border-emerald-500/50"></div>
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                prog > 90 ? "bg-red-500 animate-bounce" : prog >= 70 ? "bg-emerald-400" : "bg-orange-400"
                              }`}
                              style={{ width: `${Math.min(prog, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "plate" && (
            <motion.div
              key="plate-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Tata di Piring Keramik Emas
                </span>

                <div className="space-y-3">
                  {activeRecipe.ingredients.map((ing) => {
                    const isPrepped = (prepProgress[ing.id] ?? 0) >= 100 || ing.isLiquid;
                    const isCooked =
                      !(ing.isLiquid || ing.name.includes("Noodles") || ing.name.includes("Batter") || ing.name.includes("Water")) ||
                      (cookProgress[ing.id] ?? 0) >= 70;
                    const isReadyToPlate = isPrepped && isCooked;

                    const isPlated = platedIngredients.includes(ing.id);

                    return (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-50 shadow-sm"
                      >
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: ing.color }}
                          ></span>
                          {ing.displayName}
                        </span>

                        <div>
                          {isPlated ? (
                            <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-100 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Sudah di Piring
                            </span>
                          ) : (
                            <button
                              disabled={!isReadyToPlate}
                              onClick={() => {
                                sounds.playPop();
                                onPlateIngredient(ing.id);
                              }}
                              className={`py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                                isReadyToPlate
                                  ? "bg-rose-400 hover:bg-rose-500 text-white shadow-md shadow-rose-100"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              {isReadyToPlate ? "🍽️ Letakkan di Piring" : "Selesaikan Dulu"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Completion button */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <button
                    disabled={!allIngredientsPlated}
                    onClick={() => {
                      sounds.playBell();
                      onFinishDish();
                    }}
                    className={`w-full py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all ${
                      allIngredientsPlated
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white shadow-rose-200 scale-102 hover:scale-105"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    🎉 Sajikan Hidangan Sempurna!
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
