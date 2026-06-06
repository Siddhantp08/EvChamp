// src/components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => (
  <footer className="bg-gray-900 text-white">
    <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
        <div>
          <h3 className="text-lg font-bold mb-3">EVChamp</h3>
          <p className="text-gray-400 text-sm leading-relaxed">India's leading AI & IoT-driven EV fleet management platform.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Platform</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
            <li><a href="/buy-used-ev" className="text-gray-400 hover:text-white transition-colors">EV Marketplace</a></li>
            <li><a href="/buy-plans" className="text-gray-400 hover:text-white transition-colors">IoT & Software Plans</a></li>
            <li><a href="/zipbattery" className="text-gray-400 hover:text-white transition-colors">ZipBattery</a></li>
            <li><a href="/franchise" className="text-gray-400 hover:text-white transition-colors">Franchise</a></li>
            <li><a href="/investyz" className="text-gray-400 hover:text-white transition-colors">INVESTYZ</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Use</a></li>
            <li><a href="/refund" className="text-gray-400 hover:text-white transition-colors">Refund & Cancellation</a></li>
            <li><a href="/delete-account" className="text-red-400/70 hover:text-red-300 transition-colors">Delete Account</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Contact</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><span className="font-medium text-white">ZipBolt Technologies Pvt Ltd</span></li>
            <li>MGF Metropolis Mall, MG Road,<br />Gurgaon, Haryana – 122002</li>
            <li>Phone: <a href="tel:+918368681769" className="hover:text-white transition-colors">+91 83686 81769</a></li>
            <li>Email: <a href="mailto:hello@zip-bolt.com" className="hover:text-white transition-colors">hello@zip-bolt.com</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-gray-800 pt-6 text-center text-gray-500 text-xs">
        <p>&copy; 2026 EVChamp. All Rights Reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;