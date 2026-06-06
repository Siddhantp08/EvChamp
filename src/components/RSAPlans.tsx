import React, { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useUser } from '@clerk/clerk-react';
import razorpayService from '../services/razorpayService';

interface RSAPlan {
  id: number;
  name: string;
  price: number;
  duration: string;
  tagline: string;
  features: string[];
  idealFor: string;
  highlight?: boolean;
  badge?: string;
}

const rsaPlans: RSAPlan[] = [
  {
    id: 1,
    name: 'RSA Basic',
    price: 999,
    duration: 'Annual',
    tagline: 'Essential roadside cover for everyday EV riders',
    features: [
      'Emergency towing (up to 25 km)',
      'On-site battery jump assistance',
      'Flat tyre support',
      '24×7 helpline access',
      'Minor on-road repairs',
    ],
    idealFor: 'Individual EV owners & daily commuters',
  },
  {
    id: 2,
    name: 'RSA Standard',
    price: 1999,
    duration: 'Annual',
    tagline: 'Comprehensive cover with faster response',
    features: [
      'Emergency towing (up to 75 km)',
      'On-site battery charging & swap assistance',
      'Flat tyre & minor mechanical support',
      'Priority 24×7 helpline',
      'Fuel / charge delivery assistance',
      'Hotel & cab arrangement (1 incident/year)',
      'Key lockout assistance',
    ],
    idealFor: 'Regular EV users & small fleet operators',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 3,
    name: 'RSA Premium',
    price: 3499,
    duration: 'Annual',
    tagline: 'Full-spectrum protection for fleets & power users',
    features: [
      'Emergency towing (unlimited distance)',
      'Dedicated fleet support executive',
      'On-site battery diagnostics & repair',
      'Flat tyre, mechanical & electrical support',
      'Priority dispatch — response within 45 min',
      'Hotel, cab & relay driving (3 incidents/year)',
      'Key lockout & accident management',
      'Monthly health check reminder',
      'Trip breakdown protection (intercity)',
    ],
    idealFor: 'Fleet owners, ride-sharing operators & enterprises',
    badge: 'Best Value',
  },
];

const RSAPlans: React.FC = () => {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<RSAPlan | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const detailsSectionRef = useRef<HTMLDivElement>(null);

  const handleSelect = (plan: RSAPlan) => {
    setSelectedPlan(plan);
    setShowDetails(false);
  };

  const handleOrderClick = () => {
    setShowDetails(true);
    setTimeout(() => {
      detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePayment = async () => {
    if (!user) {
      alert('Please sign in to proceed with payment.');
      return;
    }
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      await razorpayService.initializePayment(
        selectedPlan.price,
        `EVChamp RSA Plan: ${selectedPlan.name}`,
        `Roadside Assistance - ${selectedPlan.name} (${selectedPlan.duration})`,
        user.primaryEmailAddress?.emailAddress || undefined,
        user.firstName || user.username || undefined
      );
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>EV Roadside Assistance India | Emergency EV Support by EVChamp</title>
        <meta name="description" content="24/7 EV roadside assistance across India — battery jump-start, towing, flat tyre support, and more. Choose from Basic, Standard, or Premium RSA plans." />
        <meta name="keywords" content="EV roadside assistance, emergency EV support India, EV towing, battery assistance, EVChamp RSA" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-18 text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">EV Roadside Assistance</h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
            Never get stranded again. Round-the-clock emergency support for your electric vehicle — from towing to battery assistance and beyond.
          </p>
        </div>
      </section>

      <div className="py-10 sm:py-12">

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-12">
          {[
            { icon: '🕐', label: '24×7 Support' },
            { icon: '⚡', label: 'EV Specialists' },
            { icon: '🚗', label: 'Pan-India Network' },
            { icon: '🛡️', label: '100% Reliable' },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100">
              <span className="text-xl">{badge.icon}</span>
              <span className="text-sm font-semibold text-gray-700">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {rsaPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleSelect(plan)}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 cursor-pointer md:hover:scale-105 md:hover:shadow-2xl overflow-hidden
                ${selectedPlan?.id === plan.id
                  ? 'border-orange-500 ring-4 ring-orange-200'
                  : plan.highlight
                  ? 'border-orange-300'
                  : 'border-gray-100'}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <div className={`text-xs font-bold px-3 py-1 rounded-bl-xl text-white
                    ${plan.badge === 'Most Popular' ? 'bg-orange-500' : 'bg-green-600'}`}>
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Card header bar */}
              <div className={`h-2 w-full ${plan.highlight ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`} />

              <div className="p-6 sm:p-8">
                {/* Selected badge */}
                {selectedPlan?.id === plan.id && (
                  <span className="inline-block mb-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    ✓ Selected
                  </span>
                )}

                <h3 className="text-2xl font-bold mb-1 text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4 italic">{plan.tagline}</p>

                <div className="flex items-baseline mb-1">
                  <span className="text-3xl font-extrabold text-orange-600">₹{plan.price.toLocaleString()}</span>
                  <span className="text-gray-400 ml-2 text-sm">/ {plan.duration}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Per vehicle · GST included</p>

                <p className="text-sm text-gray-700 mb-5">
                  Ideal for: <span className="font-semibold text-gray-800">{plan.idealFor}</span>
                </p>

                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base
                    ${selectedPlan?.id === plan.id
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-400'
                      : 'bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600 shadow-md hover:shadow-lg'}`}
                  onClick={(e) => { e.stopPropagation(); handleSelect(plan); }}
                >
                  {selectedPlan?.id === plan.id ? '✓ Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* What's Covered Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">What RSA Covers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🚐', title: 'Emergency Towing', desc: 'Get towed to the nearest service centre or charging station when your EV breaks down.' },
              { icon: '⚡', title: 'Battery Assistance', desc: 'On-site battery diagnostics, jump start, or emergency charge to get you moving.' },
              { icon: '🔧', title: 'Minor Repairs', desc: 'On-road minor mechanical and electrical fixes to resolve common breakdown issues.' },
              { icon: '🛞', title: 'Tyre Support', desc: "Flat tyre change or repair assistance so you're never stuck on the roadside." },
              { icon: '🗝️', title: 'Key Lockout', desc: "Professional lockout assistance if you're locked out of your EV." },
              { icon: '🏨', title: 'Hotel & Cab Arrangement', desc: 'Emergency stay and cab arrangement if breakdown leaves you stranded far from home.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start space-x-4">
                <div className="text-3xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & CTA */}
        {selectedPlan && !showDetails && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Your Selection</h2>
            <div className="flex items-center justify-between bg-orange-50 rounded-xl px-5 py-4 border border-orange-100 mb-6">
              <div>
                <p className="font-bold text-orange-700 text-lg">{selectedPlan.name}</p>
                <p className="text-sm text-gray-500">{selectedPlan.duration} · Per vehicle</p>
              </div>
              <div className="text-2xl font-extrabold text-orange-600">₹{selectedPlan.price.toLocaleString()}</div>
            </div>
            <button
              onClick={handleOrderClick}
              className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
            >
              Proceed to Order
            </button>
          </div>
        )}

        {/* Details / Payment Form */}
        {showDetails && selectedPlan && (
          <div ref={detailsSectionRef} className="max-w-lg mx-auto mt-8 bg-white rounded-2xl shadow-2xl p-10 border border-gray-200 mb-16">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Order</h3>
            <div className="mb-6 bg-orange-50 rounded-xl p-4 border-l-4 border-orange-400">
              <p className="font-semibold text-orange-700 mb-1">{selectedPlan.name}</p>
              <p className="text-sm text-gray-600">{selectedPlan.tagline}</p>
              <p className="text-xl font-extrabold text-orange-600 mt-2">₹{selectedPlan.price.toLocaleString()} / {selectedPlan.duration}</p>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Enter your email" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Enter your phone number" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Vehicle Registration No.</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="e.g. DL01AB1234" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">EV Model</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="e.g. Ather 450X, Ola S1 Pro" />
              </div>
              <button
                type="button"
                className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-orange-500 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing Payment...' : `Pay ₹${selectedPlan.price.toLocaleString()}`}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default RSAPlans;
