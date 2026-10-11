import { useState } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { ContactModal } from './ContactModal';
import { FinalCta, Footer, GuideSection, HowSection, ProblemSection, ResponsibilitySection, SolutionSection, TechSection } from './Sections';

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = () => setDemoOpen(true);
  return (
    <div>
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }} className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-espresso focus:px-4 focus:py-2 focus:text-cream">
        გადასვლა ძირითად შინაარსზე
      </a>
      <Header onDemo={openDemo} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero onDemo={openDemo} />
        <ProblemSection />
        <SolutionSection />
        <HowSection />
        <ResponsibilitySection />
        <TechSection />
        <GuideSection />
        <FinalCta onDemo={openDemo} />
      </main>
      <Footer />
      <ContactModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
