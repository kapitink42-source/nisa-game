/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  id: string;
  name: string;
  displayName: string;
  color: string;
  slicedCount: number;
  maxSlices: number;
  cookStatus: "raw" | "good" | "burnt";
  cookProgress: number; // 0 to 100
  isLiquid?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  emoji: string;
  ingredients: Ingredient[];
  steps: string[];
}

export interface Chef {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number; z: number };
  targetPosition?: { x: number; y: number; z: number };
  activeStation: "stove" | "cutting" | "assembly" | "lobby" | "idle";
  isAI: boolean;
  activeActivity?: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderColor: string;
  message: string;
  timestamp: string;
}

export interface RestaurantCustomization {
  wallpaper: "flowerGarden" | "cozyCream" | "auroraWave" | "goldRibbon";
  flooring: "mintCheckered" | "pinkMarble" | "pastelOak";
  centerpiece: "pottedTulips" | "lavenderVase" | "pinkRoses" | "cozyCandle";
  lightingColor: string; // e.g., "#fff0eb"
  counterColor: string; // e.g., "#ffe4e6"
}

export interface KitchenState {
  roomId: string;
  activeRecipeId: string;
  stepIndex: number;
  stoveLevel: number; // 0 (off) to 3 (high)
  stoveTemp: number; // 0 to 100
  prepProgress: { [ingredientId: string]: number }; // percentage sliced (0-100)
  cookProgress: { [ingredientId: string]: number }; // percentage cooked (0-100)
  platedIngredients: string[]; // ids of plated ingredients
  isFinished: boolean;
  score: number;
}

// Sound Utility using Web Audio API for soft pastel cooking interactions (chops, sizzles, bells)
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playChop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playSizzle(duration = 0.5) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    
    // Create soft aesthetic pink sizzle using a white noise approximation
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2500;
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playBell() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
    osc2.frequency.setValueAtTime(1320, this.ctx.currentTime); // E6

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.8);
    osc2.stop(this.ctx.currentTime + 0.8);
  }

  playUplift() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
    notes.forEach((freq, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + index * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.45);
    });
  }
}

export const sounds = new SoundManager();

export const DECORATIONS = {
  wallpapers: [
    { id: "flowerGarden", name: "Blossom Bouquet", desc: "Pastel flower wreaths on a cream wall", color: "#fff0f3", bgClass: "bg-[radial-gradient(#ffe4e6_1px,transparent_1px)] [background-size:16px_16px]" },
    { id: "cozyCream", name: "Cream Silk Velvet", desc: "Solid royal silk beige", color: "#fdf8f5", bgClass: "bg-[#fdf8f5]" },
    { id: "auroraWave", name: "Aurora Lilac Wave", desc: "Elegant soft purple wave ripples", color: "#faf5ff", bgClass: "bg-gradient-to-tr from-[#fae8ff] to-[#f5f3ff]" },
    { id: "goldRibbon", name: "Gold Ribbon Stripe", desc: "Classic vertical gold & rose pink stripe", color: "#fff7ed", bgClass: "bg-[linear-gradient(90deg,transparent_50%,rgba(244,63,94,0.03)_50%)] [background-size:24px_100%]" }
  ],
  floorings: [
    { id: "mintCheckered", name: "Minty Ribbon Tile", desc: "Pastel pink & mint green grids", color: "#ecfdf5", texture: "checkered" },
    { id: "pinkMarble", name: "Elegant Rose Marble", desc: "Soft white marble with pink lines", color: "#fff1f2", texture: "marble" },
    { id: "pastelOak", name: "Herringbone Peach Oak", desc: "Light wood boards patterned elegant", color: "#fef3c7", texture: "wood" }
  ],
  centerpieces: [
    { id: "pottedTulips", name: "Lovely Pink Tulips", emoji: "🌷", desc: "Potted spring tulips in gold vase" },
    { id: "lavenderVase", name: "Calming Lavender Bunch", emoji: "🪻", desc: "Fragrant French lavender in glass vase" },
    { id: "pinkRoses", name: "Sweet Juliet Roses", emoji: "🌹", desc: "Beautiful garden roses tied in ribbon" },
    { id: "cozyCandle", name: "Scented Berry Candle", emoji: "🕯️", desc: "Warm ambient glow with strawberry aroma" }
  ]
};

export const RECIPES: Recipe[] = [
  {
    id: "crepe",
    name: "Matcha Strawberry Crepe",
    displayName: "Pastel Matcha Strawberry Crepe 🍓",
    description: "Crepe tipis rasa Matcha Jepang otentik dengan irisan buah stroberi segar dan krim vanila yang lembut.",
    color: "#e2f1e4", // Matcha Green
    emoji: "🥞",
    ingredients: [
      { id: "crepe_paste", name: "Matcha Batter", displayName: "Batter Matcha", color: "#a3e635", slicedCount: 0, maxSlices: 1, cookStatus: "raw", cookProgress: 0, isLiquid: true },
      { id: "crepe_strawberry", name: "Fresh Strawberry", displayName: "Strawberry Segar", color: "#f43f5e", slicedCount: 0, maxSlices: 5, cookStatus: "raw", cookProgress: 0 },
      { id: "crepe_cream", name: "Chantilly Cream", displayName: "Krim Chantilly", color: "#ffffff", slicedCount: 0, maxSlices: 1, cookStatus: "good", cookProgress: 100 }
    ],
    steps: [
      "Siapkan Adonan Matcha dan bumbu.",
      "Potong iris Strawberry Segar di talenan sampai tipis.",
      "Kocok Krim Chantilly sampai mengembang sempurna.",
      "Panggang Batter Matcha di atas wajan dengan suhu sedang sampai matang sempurna.",
      "Susun batter, krim, dan stroberi di atas piring saji, lalu sajikan!"
    ]
  },
  {
    id: "souffle",
    name: "Aesthetic Soufflé Pancakes",
    displayName: "Cloud Fluffy Soufflé Pancakes 🥞",
    description: "Pancake ultra lembut asal Tokyo setinggi awan, disiram sirup mawar, mentega pastel, dan blueberry segar.",
    color: "#fff1f2", // Soft Pink Rose
    emoji: "🍰",
    ingredients: [
      { id: "souffle_batter", name: "Souffle Meringue", displayName: "Meringue Souffle", color: "#fffbeb", slicedCount: 0, maxSlices: 1, cookStatus: "raw", cookProgress: 0, isLiquid: true },
      { id: "souffle_blueberry", name: "Organic Blueberry", displayName: "Blueberry Organik", color: "#6366f1", slicedCount: 0, maxSlices: 3, cookStatus: "raw", cookProgress: 0 },
      { id: "souffle_maple", name: "Rose Honey Syrup", displayName: "Sirup Madu Mawar", color: "#fda4af", slicedCount: 0, maxSlices: 1, cookStatus: "good", cookProgress: 100 }
    ],
    steps: [
      "Tuangkan adonan Meringue Souffle perlahan di wajan dengan api kecil.",
      "Bilas dan bersihkan Blueberry Organik.",
      "Tutup wajan dan biarkan adonan pancake mengembang menguning lembut.",
      "Tuangkan Sirup Madu Mawar di atas piring hangat.",
      "Plating pancake tumpuk 3, taburkan blueberry, dan sajikan dengan mentega harum!"
    ]
  },
  {
    id: "pasta",
    name: "Creamy Beetroot Rose Pasta",
    displayName: "Creamy Beetroot Rose Pasta 🍝",
    description: "Pasta Fettuccine premium dengan saus merah muda (beetroot & cream) bertabur minyak jamur truffle yang harum dan keju parmesan.",
    color: "#fae8ff", // Lavender Pink
    emoji: "🍝",
    ingredients: [
      { id: "pasta_noodle", name: "Fettuccine Noodles", displayName: "Pasta Fettuccine", color: "#fef08a", slicedCount: 0, maxSlices: 1, cookStatus: "raw", cookProgress: 0 },
      { id: "pasta_sauce", name: "Beetroot Pink Cream", displayName: "Krim Bit Merah Muda", color: "#fda4af", slicedCount: 0, maxSlices: 1, cookStatus: "raw", cookProgress: 0, isLiquid: true },
      { id: "pasta_mushroom", name: "Porcini Mushroom", displayName: "Jamur Porcini", color: "#d97706", slicedCount: 0, maxSlices: 4, cookStatus: "raw", cookProgress: 0 }
    ],
    steps: [
      "Rebus pasta Fettuccine di dalam panci air mendidih sampai al dente.",
      "Iris Jamur Porcini tipis-tipis di atas talenan kayu.",
      "Tumis Krim Bit Merah Muda dengan mentega dan Jamur Porcini di atas kompor.",
      "Campurkan pasta yang sudah ditiriskan ke dalam saus mawar kental.",
      "Sajikan di piring keramik mahal dengan sentuhan tangkai oregano estetis."
    ]
  },
  {
    id: "sakura_tea",
    name: "Sakura Blossom High Tea",
    displayName: "Sakura Tea & Blossom Macarons 🫖",
    description: "Satu set teh bunga sakura Jepang hangat beraroma vanili segar, dilengkapi dengan macaron stroberi pastel yang krispi manis.",
    color: "#fff5f5", // Blossom White Pink
    emoji: "🍵",
    ingredients: [
      { id: "tea_water", name: "Purified Water", displayName: "Air Murni Teh", color: "#bfdbfe", slicedCount: 0, maxSlices: 1, cookStatus: "raw", cookProgress: 0, isLiquid: true },
      { id: "tea_sakura", name: "Salted Sakura Petals", displayName: "Kelopak Sakura", color: "#f472b6", slicedCount: 0, maxSlices: 3, cookStatus: "raw", cookProgress: 0 },
      { id: "tea_macaron", name: "Strawberry Macarons", displayName: "Macaron Stroberi", color: "#f43f5e", slicedCount: 0, maxSlices: 1, cookStatus: "good", cookProgress: 100 }
    ],
    steps: [
      "Rebus Air Murni Teh di teko sampai bersuhu 90 derajat Celsius.",
      "Masukkan Kelopak Sakura kering ke dalam saringan teh kramik.",
      "Diamkan teh menyeduh hingga air berwarna merah muda transparan.",
      "Tata Macaron Stroberi cantik di piring tingkat emas.",
      "Tuang teh harum ke cangkir gelas pastel hangat secara elegan."
    ]
  }
];
