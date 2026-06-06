// src/components/Coverage.tsx
import React from 'react';
import { ScrollReveal } from './components/ScrollReveal';

const coverages = [
  "Accidental damage, fire, and explosion.",
  "Theft or burglary of your EV.",
  "Damage to your EV's battery pack.",
  "Protection for your EV charger.",
  "Third-party liability coverage.",
  "Personal accident cover."
];

const Coverage: React.FC = () => (
  <section id="coverage" className="py-20 bg-sky-50">
    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
      <ScrollReveal className="order-2 md:order-1">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What's Covered in our EV Insurance?</h2>
        <p className="mt-4 text-lg text-gray-600">Our EV insurance plan covers a wide range of risks, including:</p>
        <ul className="mt-8 space-y-4">
          {coverages.map((item, i) => (
            <li key={i} className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </ScrollReveal>
      <ScrollReveal className="order-1 md:order-2">
        <img src="https://placehold.co/500x500/ffffff/16a34a?text=Coverage+Details" alt="EV Battery and Charger" className="rounded-2xl shadow-xl w-full h-auto" />
      </ScrollReveal>
    </div>
  </section>
);

export default Coverage;