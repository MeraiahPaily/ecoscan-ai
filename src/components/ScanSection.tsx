import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Recycle, Leaf, Image as ImageIcon, X, Loader2 } from "lucide-react";

type Result = {
  label: "Recyclable" | "Organic";
  confidence: number;
};

const mockClassify = (): Promise<Result> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const isRecyclable = Math.random() > 0.5;
      resolve({
        label: isRecyclable ? "Recyclable" : "Organic",
        confidence: Math.round(85 + Math.random() * 14),
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
            Drop an image below and let EcoScan's AI do the rest.
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
              <p className="font-semibold text-lg mb-1">
                Drag & drop an image here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse your files
              </p>
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
                    <span className="text-muted-foreground font-medium">
                      Analyzing image…
                    </span>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl p-6 text-center ${
                      result.label === "Recyclable"
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-accent/20 border border-accent/40"
                    }`}
                  >
                    {result.label === "Recyclable" ? (
                      <Recycle className="w-12 h-12 text-primary mx-auto mb-3" />
                    ) : (
                      <Leaf className="w-12 h-12 text-eco-lime mx-auto mb-3" />
                    )}
                    <h3 className="text-2xl font-bold font-display mb-1">
                      {result.label}
                    </h3>
                    <p className="text-muted-foreground">
                      Confidence: {result.confidence}%
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Demo mode — connect to the FastAPI backend for real predictions.
        </p>
      </div>
    </section>
  );
};

export default ScanSection;
