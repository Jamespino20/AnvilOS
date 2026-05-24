/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/sections/StatsBar";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Testimonials } from "@/components/sections/Testimonials";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { ContactForm } from "@/components/sections/ContactForm";
import { BottomCTA } from "@/components/sections/BottomCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        <StatsBar />
        <FeaturesGrid />
        <WhyChooseUs />
        <Testimonials />
        <Pricing />
        <FAQ />
        <ContactForm />
        <BottomCTA />
      </main>
      <Footer />
    </>
  );
}
