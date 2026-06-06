import React from 'react';

const Header: React.FC = () => (
  <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
        </svg>
        <span className="text-2xl font-bold font-serif text-green-700">EV Champ</span>
      </div>
      <nav className="hidden md:flex items-center space-x-8">
        <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">Features</a>
        <a href="#coverage" className="text-gray-600 hover:text-green-600 transition-colors">Coverage</a>
        <a href="#testimonials" className="text-gray-600 hover:text-green-600 transition-colors">Testimonials</a>
        <a href="#faq" className="text-gray-600 hover:text-green-600 transition-colors">FAQ</a>
      </nav>
      <a href="https://evchamp.in/plans" className="cta-gradient text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all bg-gradient-to-r from-green-500 to-green-700">
        Buy Plans
      </a>
      <a href="/rent-ev" className="cta-gradient text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all bg-gradient-to-r from-blue-500 to-blue-700 ml-4">
        Rent EV
      </a>
    </div>
  </header>
);


export default Header;
