import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Recycle, Leaf, X, Loader2,
  Wine, Shirt, Apple, Newspaper, Package, Cpu, Droplets, Utensils,
} from "lucide-react";

const WASTE_TYPES = [
  { type: "Plastic", category: "Recyclable", icon: Wine, color: "147 65% 45%" },
  { type: "Paper", category: "Recyclable", icon: Newspaper, color: "35 80% 50%" },
  { type: "Glass", category: "Recyclable", icon: Droplets, color: "200 60% 50%" },
  { type: "Metal", category: "Recyclable", icon: Cpu, color: "220 15% 50%" },
  { type: "Cardboard", category: "Recyclable", icon: Package, color: "25 55% 45%" },
  { type: "Clothes", category: "Recyclable", icon: Shirt, color: "280 45% 55%" },
  { type: "Food / Compost", category: "Organic", icon: Apple, color: "80 60% 42%" },
  { type: "Yard Waste", category: "Organic", icon: Leaf, color: "140 50% 38%" },
  { type: "Kitchen Scraps", category: "Organic", icon: Utensils, color: "15 65% 48%" },
] as const;

type Result = {
  category: "Recyclable" | "Organic";
  wasteType: string;
  confidence: number;
  icon: typeof Wine;
  color: string;
  breakdown: { type: string; pct: number }[];
};

const mockClassify = (): Promise<Result> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const primary = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
      const others = WASTE_TYPES.filter((w) => w.type !== primary.type)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const mainPct = Math.round(70 + Math.random() * 25);
      let remaining = 100 - mainPct;
      const breakdown = [{ type: primary.type, pct: mainPct }];
      others.forEach((o, i) => {
        const pct = i < 2 ? Math.round(remaining * (0.3 + Math.random() * 0.4)) : remaining;
        breakdown.push({ type: o.type, pct: Math.max(pct, 1) });
        remaining -= pct;
      });

      resolve({
        category: primary.category,
        wasteType: primary.type,
        confidence: mainPct,
        icon: primary.icon,
        color: primary.color,
        breakdown,
      });
    }, 2000);
  });

const ScanSection = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setLoading(true);
    const res = await mockClassify();
    setResult(res);
    setLoading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setPreview(null);
    setResult(null);
    setLoading(false);
  };

  return (
    <section id="scan" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            Upload &amp; Classify
          </h2>
          <p className="text-muted-foreground">
            Drop an image below and let EcoScan's AI identify the waste type.
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {!preview ? (
            <label
              className={`upload-zone rounded-xl flex flex-col items-center justify-center py-20 cursor-pointer ${
                dragOver ? "drag-over" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-primary mb-4" />
              <p className="font-semibold text-lg mb-1">Drag & drop an image here</p>
              <p className="text-sm text-muted-foreground">or click to browse your files</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Uploaded item"
                  className="w-full max-h-96 object-contain bg-muted rounded-xl"
                />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 p-2 rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-3 py-6"
                  >
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-muted-foreground font-medium">Analyzing image…</span>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    {/* Main result */}
                    <div
                      className={`rounded-xl p-6 text-center ${
                        result.category === "Recyclable"
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-accent/20 border border-accent/40"
                      }`}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: `hsl(${result.color} / 0.15)` }}
                      >
                        <result.icon
                          className="w-8 h-8"
                          style={{ color: `hsl(${result.color})` }}
                        />
                      </div>
                      <h3 className="text-2xl font-bold font-display">{result.wasteType}</h3>
                      <span
                        className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
                          result.category === "Recyclable"
                            ? "bg-primary/15 text-primary"
                            : "text-eco-lime bg-eco-lime/15"
                        }`}
                      >
                        {result.category === "Recyclable" ? "♻️" : "🌿"} {result.category}
                      </span>
                      <p className="text-muted-foreground mt-2">
                        Confidence: {result.confidence}%
                      </p>
                    </div>

                    {/* Breakdown */}
                    <div className="rounded-xl border border-border p-5">
                      <p className="text-sm font-semibold font-display mb-3">Probability Breakdown</p>
                      <div className="space-y-3">
                        {result.breakdown.map((b) => {
                          const info = WASTE_TYPES.find((w) => w.type === b.type);
                          return (
                            <div key={b.type} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                                {b.type}
                              </span>
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{
                                    background: `hsl(${info?.color || "0 0% 60%"})`,
                                  }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${b.pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                              </div>
                              <span className="text-xs font-medium w-10 text-right">
                                {b.pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Waste type legend */}
        <motion.div
          className="mt-8 grid grid-cols-3 sm:grid-cols-5 gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {WASTE_TYPES.map((w) => (
            <div
              key={w.type}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `hsl(${w.color} / 0.12)` }}
              >
                <w.icon className="w-4 h-4" style={{ color: `hsl(${w.color})` }} />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight">{w.type}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  w.category === "Recyclable"
                    ? "bg-primary/10 text-primary"
                    : "bg-eco-lime/10 text-eco-lime"
                }`}
              >
                {w.category}
              </span>
            </div>
          ))}
        </motion.div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Demo mode — connect to the FastAPI backend for real predictions.
        </p>
      </div>
    </section>
  );
};

export default ScanSection;
