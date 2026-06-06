import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../Footer';

const Zeflash: React.FC = () => {
  const navigate = useNavigate();

  const goTo = (route: string) => {
    navigate(route);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Zeflash | Rapid AI EV Battery Diagnostics</title>
        <meta name="description" content="Zeflash is a rapid AI-powered EV battery diagnostics platform for fast, field-ready health checks with SoP, SoF, and instant actionable reports." />
        <meta name="keywords" content="Zeflash, EV battery diagnostics, rapid EV testing, SoP, SoF, battery health report, AI battery analysis" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 max-w-5xl text-center">
          <img src="/zeflash-logo.png" alt="Zeflash Logo" className="h-16 sm:h-20 w-auto mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Zeflash: Rapid AI Diagnostics & Power
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto mb-8">
            Quick 20-minute EV and battery diagnostics during charging. Zeflash combines fast charger testing with
            battery physics-driven AI to reveal real performance, aging behavior, and safety condition on the spot.
          </p>
        </div>
      </section>

      {/* Embedded Zeflash Website */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">Explore Zeflash</h2>
          <p className="text-gray-500 text-center text-sm mb-6">Browse the full Zeflash platform below.</p>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg w-full" style={{ height: '80vh', minHeight: '500px' }}>
            <iframe
              src="https://zeflash.app"
              title="Zeflash Website"
              className="w-full h-full"
              style={{ border: 'none', width: '100%', height: '100%' }}
              allow="fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            />
          </div>
        </div>
      </section>

      {/* For Partners */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
          <div className="flex justify-center">
            <div onClick={() => navigate('/contact')}
              className="group rounded-2xl p-6 border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer max-w-md w-full">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900">For Businesses & Partners</h3>
                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">ZipSureAI</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Join a growing charging ecosystem that supports EV adoption and improves infrastructure availability.
              </p>
              <div className="flex items-center justify-between">
                <img src="/ZipsureAI Logo.png" alt="ZipsureAI" className="h-10 w-auto object-contain" />
                <span className="text-sm font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">Open ZipSureAI →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 text-center max-w-3xl">
          <p className="text-gray-300 text-base mb-6">EVChamp's charging network is part of a larger mission to make electric mobility easier, more accessible, and more dependable across India.</p>
          <button onClick={() => goTo('/contact')} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-all text-sm">
            Partner With Us
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Zeflash;
