import { motion } from "framer-motion";
import { Cpu, Zap, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Deep Learning Model",
    desc: "TensorFlow & Keras CNN trained on thousands of waste images for accurate classification.",
  },
  {
    icon: Zap,
    title: "Real-Time Results",
    desc: "FastAPI backend processes uploads and returns predictions in milliseconds.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    desc: "Images are processed on the server and never stored — your data stays yours.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track classification history and view waste trends with Pandas-powered insights.",
  },
];

const FeaturesSection = () => (
  <section className="py-24 px-6 bg-secondary/30">
    <div className="max-w-5xl mx-auto">
      <motion.h2
        className="text-3xl md:text-4xl font-bold font-display text-center mb-14"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        How It Works
      </motion.h2>

      <div className="grid sm:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass-card rounded-xl p-6 hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="w-11 h-11 rounded-lg eco-gradient flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-bold font-display text-lg mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
