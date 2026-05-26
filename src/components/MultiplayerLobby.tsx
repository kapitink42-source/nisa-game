/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { type Chef, type ChatMessage, sounds } from "../types";
import { Users, Send, Network, MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MultiplayerLobbyProps {
  currentChef: { name: string; color: string };
  onUpdateChef: (name: string, color: string) => void;
  activeRoomId: string;
  onJoinOrCreateRoom: (roomId: string) => void;
  chefs: Chef[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export default function MultiplayerLobby({
  currentChef,
  onUpdateChef,
  activeRoomId,
  onJoinOrCreateRoom,
  chefs,
  messages,
  onSendMessage,
}: MultiplayerLobbyProps) {
  const [roomInput, setRoomInput] = useState(activeRoomId || "LOBBY-SWEET-COOPERATIVE");
  const [msgInput, setMsgInput] = useState("");

  const presetColors = [
    { name: "Blossom Pink", hex: "#f43f5e" },
    { name: "Sweet Lavender", hex: "#a855f7" },
    { name: "Mint Pearl", hex: "#10b981" },
    { name: "Sky Velvet", hex: "#0ea5e9" },
    { name: "Peach Candy", hex: "#fb923c" },
    { name: "Creamy Gold", hex: "#facc15" }
  ];

  const presetMessages = [
    "Halo koki cantik! 🌸",
    "Ayo masak crepe terenak bersama! ⭐",
    "Aku bantu potong berry segar ya! 🔪",
    "Tolong awasi suhu kompornya! 🔥",
    "Waduh, hampir hangus gosong! 😭",
    "Saus rose pasta sudah siap! 🍝",
    "Wah, hidangannya cantik sekali! 😍",
    "Sempurna! Sangat berbakat! 🎉"
  ];

  const handleSend = () => {
    if (!msgInput.trim()) return;
    onSendMessage(msgInput);
    setMsgInput("");
    sounds.playUplift();
  };

  const handlePresetClick = (txt: string) => {
    onSendMessage(txt);
    sounds.playUplift();
  };

  return (
    <div id="multiplayer-lobby-panel" className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border-2 border-[#fff1f2] shadow-xl font-sans space-y-6">
      {/* 1. Header with Connected Status */}
      <div className="flex items-center justify-between border-b border-rose-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-100/50 rounded-xl">
            <Users className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
              Sistem Multiplayer Daring
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Ruang Aktif: <span className="text-pink-500 font-extrabold">{activeRoomId}</span>
            </p>
          </div>
        </div>

        {/* Real-time Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[10px] font-bold text-emerald-600">ONLINE SYNC</span>
        </div>
      </div>

      {/* 2. Room Switcher */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 space-y-3">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          Gabung/Buat Room Baru
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            placeholder="NAMA ROOM BARU"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 uppercase focus:outline-pink-200"
          />
          <button
            onClick={() => {
              if (roomInput.trim()) {
                sounds.playBell();
                onJoinOrCreateRoom(roomInput.trim());
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-100 transition-all"
          >
            Hubungkan
          </button>
        </div>
        <p className="text-[9px] text-slate-400 italic">
          💡 Tips: Buka aplikasi ini di 2 tab browser berbeda untuk melihat sinkronisasi gerakan kedua chef secara langsung!
        </p>
      </div>

      {/* 3. Chef Customizer */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 space-y-3">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          Karakter Chef Cantik Anda
        </label>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-semibold">Nama Chef</label>
            <input
              type="text"
              value={currentChef.name}
              onChange={(e) => onUpdateChef(e.target.value, currentChef.color)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-semibold">Tema Apron/Keluarga Warna</label>
            <div className="flex flex-wrap gap-1.5">
              {presetColors.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => {
                    sounds.playPop();
                    onUpdateChef(currentChef.name, col.hex);
                  }}
                  className={`w-6 h-6 rounded-full border transition-transform relative ${
                    currentChef.color === col.hex ? "scale-110 ring-2 ring-pink-300" : ""
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Connected Chefs List */}
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider flex items-center gap-1">
          <Network className="w-3.5 h-3.5 text-pink-400" /> Koki Yang Sedang Aktif di Dapur ({chefs.length})
        </label>
        <div className="grid grid-cols-2 gap-2">
          {chefs.map((chef) => (
            <div
              key={chef.id}
              className="p-3 bg-white border border-rose-50/50 rounded-xl shadow-sm flex items-center gap-3.5 transition-shadow"
            >
              <span
                className="w-4 h-4 rounded-full border animate-pulse inline-block"
                style={{ backgroundColor: chef.color }}
              ></span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-700 block truncate">
                  {chef.name}
                </span>
                <span className="text-[9px] font-medium text-slate-400 block uppercase">
                  {chef.isAI ? "🤖 Asisten Chef AI" : "👩‍🍳 Koki Online"}
                </span>
              </div>
              <span className="px-1.5 py-0.5 bg-rose-50 text-[8px] font-extrabold text-rose-500 rounded uppercase">
                {chef.activeStation}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Live Chef Chat Room */}
      <div className="border-t border-rose-100 pt-4 space-y-3">
        <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5 text-pink-400" /> Ruang Obrolan Koki
        </label>

        {/* Message Log */}
        <div className="h-28 bg-slate-50 rounded-2xl p-3 overflow-y-auto border border-slate-100/50 space-y-2">
          {messages.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center italic mt-7">Coba kirim ucapan semangat ke dapur!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="text-xs leading-relaxed">
                <span
                  className="font-bold mr-1 text-[10px] px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: msg.senderColor }}
                >
                  {msg.senderName}
                </span>
                <span className="text-slate-600 font-medium">{msg.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Quick presets */}
        <div>
          <span className="text-[9px] font-bold text-slate-400 block mb-1">Pesanku Secara Cepat:</span>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {presetMessages.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(p)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-pink-100 border border-pink-100 text-[10px] text-rose-600 font-semibold rounded-full whitespace-nowrap transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* TextInput Box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tulis pesan penyemangat..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-pink-200"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl shadow-md cursor-pointer hover:from-pink-500 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
