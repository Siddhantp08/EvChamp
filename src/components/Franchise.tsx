import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../Footer';

const opportunities = [
  { icon: '⚡', title: 'Charging Station Partnerships', desc: 'Set up EV charging points and earn from a growing user base.' },
  { icon: '🔧', title: 'EV Service & Diagnostics Centers', desc: 'Offer AI-powered diagnostics and battery assessment services.' },
  { icon: '🚗', title: 'Marketplace Support Locations', desc: 'Become a hub for certified pre-owned EV transactions.' },
  { icon: '🏗️', title: 'Mobility & Infrastructure', desc: 'Collaborate on EV leasing, fleet management, and infrastructure projects.' },
];

const benefits = [
  'Entry into a fast-growing EV market',
  'Access to EVChamp technology and ecosystem',
  'Brand association with EV innovation',
  'Multiple revenue opportunities',
  'Operational support and business guidance',
  'Up to 30% ROI from Year 1',
];

const testimonials = [
  { quote: 'Joining EVChamp was the smartest business decision I made. The AI platform is a game-changer, and the support I get is incredible.', name: 'Rajesh Kumar', role: 'Pro Franchisee, Delhi' },
  { quote: 'The Master Centre model gives me so much potential. With the leasing platform and spares distribution, my revenue streams are constantly growing.', name: 'Priya Sharma', role: 'Master Franchisee, Pune' },
  { quote: 'Even with my Basic Centre, the profitability is fantastic. The demand for EV leasing is huge. I\'m already planning my second location!', name: 'Amit Singh', role: 'Pro Franchisee, Jaipur' },
];

const Franchise: React.FC = () => {
  const navigate = useNavigate();
  const goTo = (route: string) => {
    navigate(route);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>EV Franchise Partnership in India | Join the EVChamp Growth Network</title>
        <meta name="description" content="Become an EVChamp franchise partner and join a growing network built around EV charging, diagnostics, mobility services, and sustainable infrastructure." />
        <meta name="keywords" content="EV franchise India, EV business opportunity, charging franchise, EV partnership, electric mobility franchise" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Build the Future with EVChamp</h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
            EVChamp Franchise Partnership offers a business opportunity for entrepreneurs and organizations looking to enter the fast-growing electric mobility sector.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => goTo('/contact')} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-all text-sm">
              Apply Now
            </button>
            <button onClick={() => goTo('/investyz')} className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all text-sm">
              Explore INVESTYZ
            </button>
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Partner With EVChamp</h2>
          <p className="text-gray-600 leading-relaxed">
            The EV market is expanding, and the need for reliable services, diagnostics, charging infrastructure, and intelligent mobility solutions continues to rise. By partnering with EVChamp, you can participate in this growth with a proven platform and strong ecosystem support.
          </p>
        </div>
      </section>

      {/* Partnership Opportunities */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Partnership Opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {opportunities.map((item) => (
              <div key={item.title} className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                <span className="text-2xl block mb-3">{item.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Partners Gain */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Partners Gain</h2>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Key Financial Highlights</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span>Initial Investment</span>
                  <span className="font-semibold text-gray-900">From ₹15 Lacs</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span>Targeted ROI (Year 1)</span>
                  <span className="font-semibold text-green-700">Up to 30%</span>
                </div>
                <div className="flex justify-between">
                  <span>Payback Period</span>
                  <span className="font-semibold text-gray-900">~5 years</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Franchisees Are Thriving</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.quote}"</p>
                <p className="text-sm font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-14 text-center max-w-3xl">
          <h2 className="text-2xl font-bold mb-3">Don't Just Watch the EV Revolution — Lead It</h2>
          <p className="text-gray-300 text-sm mb-6">Limited opportunities available. Secure your exclusive territory and become a pioneer in India's EV service industry.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => goTo('/contact')} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-all text-sm">
              Contact Us
            </button>
            <a href="tel:+918368681769" className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all text-sm inline-block">
              Call +91 83686 81769
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Franchise;