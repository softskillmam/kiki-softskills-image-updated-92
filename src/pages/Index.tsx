
import React from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturedPrograms from '@/components/FeaturedPrograms';
import BenefitsSection from '@/components/BenefitsSection';
import TrustedPartners from '@/components/TrustedPartners';
import TestimonialsSection from '@/components/TestimonialsSection';
import ComparisonSection from '@/components/ComparisonSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <TrustedPartners />
        <FeaturedPrograms />
        <BenefitsSection />
        <TestimonialsSection />
        <ComparisonSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
