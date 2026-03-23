import ecoLogo from "@/assets/eco-logo.png";

const Footer = () => (
  <footer className="py-10 px-6 border-t border-border">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <img src={ecoLogo} alt="EcoScan" className="w-7 h-7" />
        <span className="font-display font-semibold">EcoScan</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Built with TensorFlow · FastAPI · Streamlit · React
      </p>
    </div>
  </footer>
);

export default Footer;
