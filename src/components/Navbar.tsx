import ecoLogo from "@/assets/eco-logo.png";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
    <div className="max-w-5xl mx-auto flex items-center justify-between glass-card rounded-full px-6 py-3">
      <div className="flex items-center gap-2">
        <img src={ecoLogo} alt="EcoScan" className="w-8 h-8" />
        <span className="font-display font-bold text-lg">EcoScan</span>
      </div>
      <a
        href="#scan"
        className="px-5 py-2 rounded-full eco-gradient text-primary-foreground text-sm font-semibold"
      >
        Try Now
      </a>
    </div>
  </nav>
);

export default Navbar;
