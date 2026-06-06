import React from 'react';

const Hero: React.FC = () => (
  <section className="hero-gradient pt-16 pb-20 bg-gradient-to-br from-sky-100 to-sky-50">
    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
      <div className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
          India's First & Only <br className="hidden md:block" />
          <span className="text-green-600">EV-Specific Coverage</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto md:mx-0">
          Protect your Electric Vehicle with a comprehensive insurance plan that covers everything from the battery to the charger. Drive with peace of mind.
        </p>
        <div className="mt-8">
          <a href="#quote" className="inline-block bg-gradient-to-r from-green-500 to-green-700 text-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            Get an Instant Quote
          </a>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-medium text-gray-700">Battery Coverage</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-medium text-gray-700">Charger Included</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-medium text-gray-700">24/7 Assistance</span>
          </div>
        </div>
      </div>
      <div>
        <img src="https://placehold.co/600x400/34d399/ffffff?text=EV+Illustration" alt="Electric Vehicle Illustration" className="rounded-lg shadow-2xl w-full h-auto" />
      </div>
    </div>
  </section>
);

export default Hero; 
