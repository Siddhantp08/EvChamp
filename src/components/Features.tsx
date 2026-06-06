import React from 'react';
import { ScrollReveal } from './ScrollReveal';

const Features: React.FC = () => (
  <section id="features" className="py-12 sm:py-20 bg-transparent">
    <div className="container mx-auto px-4 sm:px-6">
      <ScrollReveal className="text-center mb-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700 mb-3 text-center">ZipBattery</h2>
        <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">ZipBattery extends the lifespan of Li-ion batteries by combining it with our AI-based Technology. It has a vision to provide a world with greener, smarter and longer lasting lithium ion batteries. </p>
        <a
          href="/zipbattery"
          className="inline-block bg-gradient-to-r from-orange-400 to-red-600 text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition mt-6"
        >
          Explore ZipBattery Opportunities
        </a>
      </ScrollReveal>
    </div>
  </section>
);

export default Features; 