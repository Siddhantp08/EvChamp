import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../Footer';

const values = [
  { icon: '💡', title: 'Innovation', desc: 'We use AI and IoT to create better EV experiences.' },
  { icon: '🔍', title: 'Transparency', desc: 'We prioritize clarity in battery health, vehicle condition, and service delivery.' },
  { icon: '🛡️', title: 'Reliability', desc: 'We build tools and services that EV users can depend on every day.' },
  { icon: '🌱', title: 'Sustainability', desc: 'We support a cleaner future through smarter mobility and green infrastructure.' },
  { icon: '📈', title: 'Growth', desc: 'We enable users, partners, and investors to participate in the growing EV economy.' },
];

const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  const goTo = (route: string) => {
    navigate(route);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const goToTopServices = () => {
    navigate('/');
    setTimeout(() => {
      const section = document.getElementById('top-services');
      if (section) {
        const rect = section.getBoundingClientRect();
        const sectionTop = window.scrollY + rect.top;
        const centeredTop = sectionTop - (window.innerHeight - rect.height) / 2;
        const targetTop = Math.max(0, centeredTop - 40);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>About EVChamp | AI-Powered EV Mobility, Battery Intelligence &amp; Infrastructure</title>
        <meta name="description" content="Learn about EVChamp, an EV ecosystem that combines AI, IoT, battery diagnostics, charging access, EV marketplace services, and sustainable infrastructure solutions for India." />
        <meta name="keywords" content="about EVChamp, EV ecosystem India, EV technology company, battery intelligence platform, smart mobility solutions" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">About EVChamp</h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
            An AI and IoT-driven electric mobility platform built to make EV ownership, fleet management, and infrastructure access simpler, smarter, and more reliable.
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Who We Are</h2>
          <p className="text-gray-600 leading-relaxed">
            We are focused on solving the everyday problems that EV users face: uncertain battery health, limited charging visibility, maintenance complexity, low resale transparency, and fragmented service access. EVChamp brings these elements together in one integrated ecosystem.
          </p>
        </div>
      </section>

      {/* Mission & Vision — side by side */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                To accelerate electric mobility by creating intelligent tools, trusted services, and scalable infrastructure that support every stage of the EV lifecycle.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Our Vision</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                To become a leading EV intelligence and infrastructure platform that helps India transition to cleaner, more efficient, and more data-driven mobility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Makes EVChamp Different</h2>
          <p className="text-gray-600 leading-relaxed">
            EVChamp is not only a marketplace or a service platform. It is a connected ecosystem built around real-world EV needs. We combine diagnostics, software, charging access, emergency support, investment opportunities, and battery intelligence into one seamless experience.
          </p>
        </div>
      </section>

      {/* What EVChamp Offers */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">What EVChamp Offers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: '🚗', label: 'EV Marketplace', desc: 'Certified pre-owned EV buying and selling' },
              { icon: '🔋', label: 'Battery Diagnostics', desc: 'Complete battery health and vehicle insights' },
              { icon: '📊', label: 'Software Plans', desc: 'Monitoring and optimization subscriptions' },
              { icon: '🛣️', label: 'Roadside Assistance', desc: 'Emergency EV support across India' },
              { icon: '⚡', label: 'Charging Network', desc: 'Station access across India' },
              { icon: '📈', label: 'INVESTYZ', desc: 'Green infrastructure investment' },
            ].map((item) => (
              <div
                key={item.label}
                className="text-left p-5 rounded-xl border border-gray-100 bg-white cursor-default select-none"
              >
                <span className="text-4xl mb-3 block">{item.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.label}</h3>
                <p className="text-xs text-gray-500 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-5 border border-gray-100 text-center">
                <span className="text-2xl block mb-2">{v.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{v.title}</h3>
                <p className="text-xs text-gray-500 leading-snug">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Who We Serve</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            EVChamp serves EV owners, used EV buyers and sellers, fleet operators, businesses, charging partners, franchise partners, and sustainability-focused investors.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={goToTopServices} className="bg-gray-900 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all text-sm">
              Explore Platform
            </button>
            <button onClick={() => goTo('/contact')} className="border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all text-sm">
              Get in Touch
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
