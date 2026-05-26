/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DECORATIONS, type RestaurantCustomization, sounds } from "../types";
import { Wallpaper, HelpCircle, Sparkles, Check } from "lucide-react";

interface RestoCustomizerProps {
  customization: RestaurantCustomization;
  onUpdateCustomization: (updated: Partial<RestaurantCustomization>) => void;
}

export default function RestoCustomizer({
  customization,
  onUpdateCustomization,
}: RestoCustomizerProps) {
  const lightingPresets = [
    { name: "Cahaya Lilin Lilac", hex: "#fae8ff", desc: "Lavender warm tint", label: "🪻" },
    { name: "Sinar Sunset Mawar", hex: "#fff0eb", desc: "Soft rosy gold shine", label: "🌸" },
    { name: "Sejuk Mint Breeze", hex: "#f0fdf4", desc: "Fresh sage clean glow", label: "🌿" },
    { name: "Sutra Putih Klasik", hex: "#ffffff", desc: "Neutral premium studio", label: "💡" },
  ];

  return (
    <div id="restaurant-customizer-panel" className="bg-white/75 backdrop-blur-md rounded-3xl p-6 border-2 border-[#fff1f2] shadow-xl font-sans space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
        <div className="p-2 bg-pink-100/50 rounded-xl">
          <Wallpaper className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            Kustomisasi Desain Interior
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold">
            Atur kombinasi warna pastel feminin yang estetik & sangat elegan!
          </p>
        </div>
      </div>

      {/* 1. Wallpaper List */}
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">
          Style Dinding (Wallpaper)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DECORATIONS.wallpapers.map((wp) => {
            const active = wp.id === customization.wallpaper;
            return (
              <button
                key={wp.id}
                onClick={() => {
                  sounds.playPop();
                  onUpdateCustomization({ wallpaper: wp.id as any });
                }}
                className={`p-3 rounded-2xl text-left border-2 transition-all relative overflow-hidden ${
                  active
                    ? "border-pink-300 bg-pink-50/20"
                    : "border-slate-100 hover:border-pink-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: wp.color }}
                  ></div>
                  <span className="text-xs font-bold text-slate-700">{wp.name}</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">{wp.desc}</p>
                {active && (
                  <div className="absolute top-1 right-1 bg-pink-400 text-white p-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Flooring List */}
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">
          Style Lantai (Flooring)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DECORATIONS.floorings.map((fl) => {
            const active = fl.id === customization.flooring;
            return (
              <button
                key={fl.id}
                onClick={() => {
                  sounds.playPop();
                  onUpdateCustomization({ flooring: fl.id as any });
                }}
                className={`p-2.5 rounded-xl border-2 text-center transition-all relative ${
                  active
                    ? "border-pink-300 bg-pink-50/10"
                    : "border-slate-100 hover:border-pink-50 bg-white"
                }`}
              >
                <span className="text-[11px] font-bold text-slate-700 block truncate">{fl.name}</span>
                <div
                  className="w-full h-1.5 rounded-full mt-1.5 border"
                  style={{ backgroundColor: fl.color }}
                ></div>
                {active && (
                  <div className="absolute top-0.5 right-0.5 bg-pink-400 text-white p-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Centerpiece Flower / Ornament */}
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">
          Pajangan Meja Tamu Bistro
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DECORATIONS.centerpieces.map((cp) => {
            const active = cp.id === customization.centerpiece;
            return (
              <button
                key={cp.id}
                onClick={() => {
                  sounds.playPop();
                  onUpdateCustomization({ centerpiece: cp.id as any });
                }}
                className={`p-3 rounded-2xl flex items-center gap-2.5 border-2 text-left transition-all relative ${
                  active
                    ? "border-pink-300 bg-pink-50/20 shadow-md shadow-pink-50"
                    : "border-slate-100 hover:border-pink-100 bg-white"
                }`}
              >
                <span className="text-2xl">{cp.emoji}</span>
                <div>
                  <span className="text-xs font-bold text-slate-700 block truncate leading-tight">
                    {cp.name}
                  </span>
                  <span className="text-[9px] text-slate-400 block">{cp.desc}</span>
                </div>
                {active && (
                  <div className="absolute top-1 right-1 bg-pink-400 text-white p-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Lighting Ambient Glow */}
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">
          Warna Sinar Lampu (Glow)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {lightingPresets.map((lp) => {
            const active = lp.hex === customization.lightingColor;
            return (
              <button
                key={lp.hex}
                onClick={() => {
                  sounds.playPop();
                  onUpdateCustomization({ lightingColor: lp.hex });
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  active
                    ? "border-pink-300 bg-pink-50/30 font-bold shadow-sm"
                    : "border-slate-100 hover:border-pink-50 bg-white"
                }`}
              >
                <span className="text-lg block mb-0.5">{lp.label}</span>
                <span className="text-[10px] text-slate-600 font-medium block truncate">
                  {lp.name.split(" ")[1] || "Glow"}
                </span>
                <div
                  className="w-full h-1 rounded-full mt-1 border border-slate-300/30 mx-auto"
                  style={{ backgroundColor: lp.hex }}
                ></div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Elegant design banner */}
      <div className="p-3.5 bg-gradient-to-tr from-pink-50 to-[#fae8ff] rounded-2xl border border-pink-100/50 flex gap-2.5 items-center">
        <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
        <p className="text-[10px] text-pink-600 font-semibold leading-relaxed">
          Pilihan desain interior di atas langsung merubah visual lantai, dinding, sinar, dan pajangan bunga di model panggung 3D secara instan!
        </p>
      </div>
    </div>
  );
}
