// src/components/Testimonials.tsx
import React from 'react';
import { ScrollReveal } from './components/ScrollReveal';

const testimonials = [
  {
    quote: "The AI-powered app has transformed how I manage my EV. Real-time battery monitoring and predictive maintenance alerts give me complete peace of mind.",
    name: "Rohan Sharma",
    role: "Tesla Model 3 Owner",
    img: "https://placehold.co/48x48/22c55e/ffffff?text=RS"
  },
  {
    quote: "The IoT device installation was super easy and the dashboard provides amazing insights about my vehicle's health. Love the smart features!",
    name: "Priya Patel",
    role: "Tata Nexon EV Owner",
    img: "https://placehold.co/48x48/22c55e/ffffff?text=PP"
  },
  {
    quote: "The smart buyback and warranty tracking features are incredible. The app helps me make informed decisions about my EV investment.",
    name: "Ankit Kumar",
    role: "Hyundai Kona Owner",
    img: "https://placehold.co/48x48/22c55e/ffffff?text=AK"
  }
];

const Testimonials: React.FC = () => (
  <section id="testimonials" className="py-12 sm:py-20 bg-gray-50">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">What Our Customers Say</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <ScrollReveal key={i} delay={i * 100}>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <p className="text-gray-600 mb-6">"{t.quote}"</p>
              <div className="flex items-center">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-gray-800">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
