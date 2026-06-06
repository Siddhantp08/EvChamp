import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Footer from '../Footer';

const inquiryTypes = [
  'EV Marketplace Support',
  'Battery Diagnostics & Vehicle Inquiry',
  'IoT Hardware & Software Plans',
  'Charging Station Partnership',
  'Roadside Assistance',
  'Franchise Partnership',
  'INVESTYZ Investment Inquiry',
  'ZipBattery & AI Assistance',
  'General Inquiry',
];

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
      setFormData({ name: '', email: '', company: '', inquiryType: '', message: '' });
    } catch {
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Contact EVChamp | EV Marketplace, Charging, Fleet Solutions &amp; Partnerships</title>
        <meta name="description" content="Contact EVChamp for EV marketplace support, charging network inquiries, IoT plans, software subscriptions, roadside assistance, franchise partnerships, and investments." />
        <meta name="keywords" content="contact EVChamp, EV support India, EV partnership contact, EV fleet solutions, EV business inquiry" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-18 text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Let's Connect</h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
            Have a question about EVChamp services, partnerships, marketplace listings, charging access, franchise opportunities, or investment solutions? Our team will guide you to the right place.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <span className="text-3xl block mb-3">✅</span>
                  <h3 className="text-lg font-bold text-green-800 mb-2">Thank You!</h3>
                  <p className="text-sm text-green-700">Your message has been received. Our team will get back to you as soon as possible.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-4 text-sm font-medium text-green-700 hover:text-green-800 underline">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder="Company name (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inquiry Type *</label>
                    <select name="inquiryType" value={formData.inquiryType} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm">
                      <option value="">Select inquiry type</option>
                      {inquiryTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder="Tell us how we can help..." />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-all text-sm disabled:opacity-60">
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">ZipBolt Technologies Pvt Ltd</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="text-gray-700">MGF Metropolis Mall, MG Road, Gurgaon, Haryana – 122002</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <a href="tel:+918368681769" className="text-gray-700 hover:text-green-700">+91 83686 81769</a>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <a href="mailto:contact@zipsureai.com" className="text-gray-700 hover:text-green-700">contact@zipsureai.com</a>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-2">How We Can Help</h3>
                <ul className="text-xs text-gray-500 space-y-1.5">
                  <li>• EV marketplace support</li>
                  <li>• Battery diagnostics & vehicle inquiries</li>
                  <li>• IoT hardware & software plans</li>
                  <li>• Charging station partnerships</li>
                  <li>• Roadside assistance</li>
                  <li>• Franchise partnership requests</li>
                  <li>• INVESTYZ investment inquiries</li>
                  <li>• ZipBattery & AI assistance support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-10 text-center max-w-3xl">
          <p className="text-gray-600 text-sm">
            EVChamp is building the future of electric mobility, and we are always open to new users, partners, and collaborators.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
