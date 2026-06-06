import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './components/Header';
import Testimonials from './Testimonials';
import Footer from './Footer';
import BuyPlans from './components/BuyPlans';
import RentEV from './components/RentEV';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import RefundPolicy from './components/RefundPolicy';
import PaymentSuccess from './components/PaymentSuccess';
import { SignUp, UserProfile, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import SmartSignIn from './components/SmartSignIn';
import Franchise from './components/Franchise';
import BuyUsedEV from './components/BuyUsedEV';
import ServiceCentres from './components/ServiceCentres';
import ZipBattery from './components/ZipBattery';
import AdvanceAnalysis from './components/AdvanceAnalysis';
import DeleteAccount from './components/DeleteAccount';
import RSAPlans from './components/RSAPlans';
import SellEV from './components/SellEV';
import ServicesShowcase from './components/ServicesShowcase';
import { ScrollReveal } from './components/ScrollReveal';
import AboutUs from './components/AboutUs';
import ChargingNetwork from './components/ChargingNetwork';
import Investyz from './components/Investyz';
import ContactUs from './components/ContactUs';
import SmarterEVAssistance from './components/SmarterEVAssistance';
import Zeflash from './components/Zeflash';
import ZeVaultPage from './components/ZeVaultPage';
import Blog from './components/Blog';

import PartnersCarousel from './components/PartnersCarousel';
import ChatbotPopup from './components/ChatbotPopup';

function HomePage() {
  const navigate = useNavigate();
  const goTo = (route: string) => {
    navigate(route);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const scrollToTopServices = () => {
    const section = document.getElementById('top-services');
    if (section) {
      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const centeredTop = sectionTop - (window.innerHeight - rect.height) / 2;
      const targetTop = Math.max(0, centeredTop - 40);

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="home-page bg-white min-h-screen w-full overflow-x-hidden">
      <Helmet>
        <title>EVChamp | AI &amp; IoT-Driven EV Fleet Management Platform in India</title>
        <meta name="description" content="EVChamp is an AI & IoT-driven EV ecosystem for fleet management, certified pre-owned EVs, battery diagnostics, charging stations, roadside assistance, franchise partnerships, and green infrastructure investment." />
        <meta name="keywords" content="EV fleet management platform, AI EV platform India, IoT for EVs, EV marketplace, battery diagnostics, EV charging network" />
      </Helmet>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          backgroundImage: "url('/bg-hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-900/40 to-slate-900/25" />

        <div className="relative container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center max-w-4xl">
          <div className="rounded-2xl bg-black/20 backdrop-blur-[2px] px-4 py-8 sm:px-8 sm:py-10 shadow-xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6 text-white drop-shadow-sm">
              Powering the Future of Electric Mobility with AI and IoT
            </h1>
            <p className="text-white/95 text-base sm:text-lg leading-relaxed mb-8 max-w-3xl mx-auto drop-shadow-sm">
              From certified pre-owned EVs and battery diagnostics to IoT hardware, software subscriptions, charging access, roadside assistance, and smart EV support — EVChamp brings every part of the EV journey into one connected platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={scrollToTopServices} className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-all text-sm shadow-sm">
                Explore Platform
              </button>
              <button onClick={() => goTo('/sign-up')} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-all text-sm shadow-sm">
                Get Started
              </button>
              <button onClick={() => goTo('https://play.google.com/apps/internaltest/4701215861025087123')} className="border border-white/50 bg-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/15 transition-all text-sm backdrop-blur-sm">
                Talk to Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Get the EVChamp App */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Mobile App</p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Get the EVChamp app</h2>
          <p className="text-gray-500 text-xs mb-5">Explore EVChamp services, charging support, and EV assistance from one place.</p>

          <div className="flex flex-col sm:flex-row gap-5 items-center">
            {/* QR Code — custom image */}
            <div className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">Scan to Visit</span>
              <img
                src="/evchamp-qr.jpg"
                alt="Scan to visit EVChamp website"
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>

            {/* Right side */}
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-1">Scan to Open EVChamp</h3>
              <p className="text-gray-500 text-xs mb-3">
                Point your phone's camera at the QR code to instantly open the EVChamp website. App Store &amp; direct APK downloads are coming soon!
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-2 mb-2">
                <a
                  href="https://play.google.com/store/apps/details?id=com.evchamp.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500 text-green-700 text-xs font-medium bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.76A1.52 1.52 0 0 1 2 22.3V1.7A1.52 1.52 0 0 1 3.18.24L13.8 11 3.18 23.76Zm11.67-8.05-2.55-2.71 2.57-2.57 3.04 1.7a1.52 1.52 0 0 1 0 2.64l-3.06 .94ZM4.37 24l9.33-9.33 2.12 2.26L5.16 24.5A1.52 1.52 0 0 1 4.37 24Zm0-24a1.52 1.52 0 0 1 .79.5l10.66 7.07-2.12 2.26L4.37 0Z"/>
                  </svg>
                  Download on Play Store
                </a>
              </div>
              <p className="text-xs text-gray-400 mb-3">Download the EVChamp app via Google Play internal test.</p>

              {/* Feature bullets */}
              <ul className="space-y-1.5">
                {[
                  { title: 'Instant Access', desc: 'Scan once and open the platform right in your browser' },
                  { title: 'Works on All Devices', desc: 'Compatible with any Android or iOS phone camera' },
                  { title: 'Always Up-to-Date', desc: 'Website always reflects the latest EVChamp features' },
                ].map((f) => (
                  <li key={f.title} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{f.title}</p>
                      <p className="text-xs text-gray-500">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase — existing tiles */}
      <section id="top-services">
        <ScrollReveal className="home-section-shell" duration={850} threshold={0.15}>
          <ServicesShowcase />
        </ScrollReveal>
      </section>

      {/* Audience Cards — compact */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">Built for a Smarter EV Future</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">For Individuals</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Buy or sell EVs with confidence, access battery diagnostics, get help when needed, and discover nearby charging support.</p>
              <button onClick={() => goTo('/buy-used-ev')} className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
                Explore Marketplace →
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">For Fleets & Businesses</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Monitor vehicle performance, reduce downtime, improve operational efficiency, and manage EV assets with real-time intelligence.</p>
              <button onClick={() => goTo('/buy-plans')} className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
                View Plans →
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">For Investors & Partners</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Explore sustainable infrastructure investment opportunities and franchise models built for long-term growth in India's EV ecosystem.</p>
              <button onClick={() => goTo('/investyz')} className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
                Learn About INVESTYZ →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Banner */}
      <section className="bg-white border-y border-gray-100">
        <div className="py-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-8 text-center">Our Partners</h2>
          <PartnersCarousel />
        </div>
      </section>

      {/* Testimonials */}
      <ScrollReveal duration={900} delay={80} threshold={0.15}>
        <Testimonials />
      </ScrollReveal>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-14 text-center max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Join the EVChamp Network</h2>
          <p className="text-gray-300 text-base mb-8">Be part of the next generation of electric mobility in India.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => goTo('/sign-up')} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-all text-sm">
              Get Started Free
            </button>
            <button onClick={() => goTo('https://play.google.com/apps/internaltest/4701215861025087123')} className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all text-sm">
              Contact Us
            </button>
          </div>
        </div>
      </section>

      


<Footer />
    </div>
  );
}

function UserSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-semibold">Back</span>
            </button>
          </div>
          
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your profile, security, and preferences</p>
          </div>
          
          {/* User Profile Component */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
            <UserProfile routing="path" path="/user" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={window.location.pathname} />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <div className="min-w-0 w-full">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in" element={<SmartSignIn />} />
          <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" forceRedirectUrl="/" fallbackRedirectUrl="/" />} />
          <Route path="/user" element={<UserSettingsPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/buy-plans" element={
            <ProtectedRoute>
              <BuyPlans />
            </ProtectedRoute>
          } />
          <Route path="/rent-ev" element={
            <ProtectedRoute>
              <RentEV />
            </ProtectedRoute>
          } />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/franchise" element={<Franchise />} />
          <Route path="/sell-ev" element={<SellEV />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/charging-network" element={
            <ProtectedRoute>
              <ChargingNetwork />
            </ProtectedRoute>
          } />
          <Route path="/zeflash" element={<Zeflash />} />
          <Route path="/zevault" element={<ZeVaultPage />} />
          <Route path="/investyz" element={<Investyz />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="https://play.google.com/apps/internaltest/4701215861025087123" element={<ContactUs />} />
          <Route path="/ev-assistance" element={<SmarterEVAssistance />} />
          <Route path="/zipbattery" element={<ZipBattery />} />
          <Route path="/advance-analysis" element={
            <ProtectedRoute>
              <AdvanceAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/buy-used-ev" element={
            <ProtectedRoute>
              <BuyUsedEV />
            </ProtectedRoute>
          } />
          <Route path="/service-centres" element={
            <ProtectedRoute>
              <ServiceCentres />
            </ProtectedRoute>
          } />
          <Route path="/delete-account" element={
            <ProtectedRoute>
              <DeleteAccount />
            </ProtectedRoute>
          } />
          <Route path="/rsa-plans" element={
            <ProtectedRoute>
              <RSAPlans />
            </ProtectedRoute>
          } />
        </Routes>

        {/* Floating Chatbot Popup (RAG-powered) */}
        <ChatbotPopup />
      </div>
    </Router>
  );
}

export default App;