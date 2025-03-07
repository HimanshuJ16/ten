import CTA from "@/components/landing-page/sections/cta";
import FAQ from "@/components/landing-page/sections/faq";
import Features from "@/components/landing-page/sections/features";
import Footer from "@/components/landing-page/sections/footer";
import Header from "@/components/landing-page/sections/header";
import Hero from "@/components/landing-page/sections/hero";
import HowItWorks from "@/components/landing-page/sections/how-it-works";
import Problem from "@/components/landing-page/sections/problem";
import Solution from "@/components/landing-page/sections/solution";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Features />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
