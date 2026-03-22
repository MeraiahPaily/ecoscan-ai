import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ScanSection from "@/components/ScanSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <ScanSection />
    <FeaturesSection />
    <Footer />
  </div>
);

export default Index;
