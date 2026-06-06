import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from '../Footer';

const features = [
  { icon: '📊', title: 'Real-Time EV Insights', desc: 'Monitor vehicle behavior, performance metrics, and status at any moment.' },
  { icon: '🔋', title: 'Predictive Battery Analytics', desc: 'Understand degradation patterns and optimize charging to extend battery life.' },
  { icon: '🔧', title: 'Instant Troubleshooting', desc: 'Get AI-powered diagnostics and fix guidance when issues arise.' },
  { icon: '⚡', title: 'Charging Guidance', desc: 'Smart recommendations for when, where, and how to charge most efficiently.' },
  { icon: '📈', title: 'Performance Understanding', desc: 'Deep insights into driving patterns, energy consumption, and efficiency.' },
  { icon: '💡', title: 'Usage Recommendations', desc: 'Personalized tips to improve range, reduce wear, and optimize costs.' },
];

const SmarterEVAssistance: React.FC = () => {
  const navigate = useNavigate();
  const goTo = (route: string) => {
    navigate(route);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>AI EV Assistance | Predictive Battery Analytics and Smart Troubleshooting by EVChamp</title>
        <meta name="description" content="Meet EVChamp Smarter EV Assistance, your AI-powered co-pilot for real-time EV insights, battery analytics, troubleshooting, and smarter charging decisions." />
        <meta name="keywords" content="AI EV assistant, EV troubleshooting tool, predictive battery analytics, EV co-pilot, smart EV support" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Your Intelligent Co-Pilot for Electric Mobility</h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
            EVChamp Smarter EV Assistance helps you make better EV decisions in real time. Understand vehicle behavior, improve charging decisions, and troubleshoot issues quickly with AI-powered intelligence.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => goTo('/buy-plans')} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-all text-sm">
              Get Started
            </button>
            <button onClick={() => goTo('/contact')} className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all text-sm">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">What It Does</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Cards */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Drive Smarter, Charge Faster</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">For EV Owners</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get help when you need it, understand your EV better, and make more informed charging and usage decisions.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">For Fleets</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Support operators and drivers with instant intelligence that can help reduce downtime and improve efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-14 text-center max-w-3xl">
          <h2 className="text-2xl font-bold mb-3">Better Visibility. Faster Support. Smarter Decisions.</h2>
          <p className="text-gray-300 text-sm mb-6">EVChamp Smarter EV Assistance turns complex EV data into useful, practical guidance.</p>
          <button onClick={() => goTo('/buy-plans')} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-all text-sm">
            Explore Plans
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SmarterEVAssistance;
