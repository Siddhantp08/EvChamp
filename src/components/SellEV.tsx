import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';

// Import vehicle images
import nexonEvImage from '../assets/tata-nexon.jpg';
import mgZsEvImage from '../assets/mgzsev.jpg';
import tigorEvImage from '../assets/tigor.png';
import konaElectricImage from '../assets/honda-kona-ev.jpg';

interface Vehicle {
  id: string;
  sellerName: string;
  vehicleModel: string;
  brand: string;
  year: number;
  price: number;
  mileage: number;
  batteryHealth: number;
  diagnosticScore: number;
  vehicleCondition: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  images: string[];
  location: string;
  certifiedBy: string;
  listingDate: string;
}

const SellEV: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const [showListingForm, setShowListingForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicleModel: '',
    brand: '',
    year: '',
    price: '',
    mileage: '',
    location: '',
    description: '',
    contactNumber: ''
  });

  // Sample vehicles (in production, this would come from your backend)
  const sampleVehicles: Vehicle[] = [
    {
      id: '1',
      sellerName: 'Rajesh Kumar',
      vehicleModel: 'Nexon EV Max',
      brand: 'Tata',
      year: 2023,
      price: 1450000,
      mileage: 12000,
      batteryHealth: 98,
      diagnosticScore: 9.5,
      vehicleCondition: 'Excellent',
      images: [nexonEvImage],
      location: 'Mumbai, Maharashtra',
      certifiedBy: 'EVChamp Diagnostics',
      listingDate: '2026-03-15'
    },
    {
      id: '2',
      sellerName: 'Priya Sharma',
      vehicleModel: 'ZS EV',
      brand: 'MG',
      year: 2022,
      price: 1850000,
      mileage: 18500,
      batteryHealth: 94,
      diagnosticScore: 9.0,
      vehicleCondition: 'Excellent',
      images: [mgZsEvImage],
      location: 'Delhi NCR',
      certifiedBy: 'EVChamp Diagnostics',
      listingDate: '2026-03-18'
    },
    {
      id: '3',
      sellerName: 'Amit Patel',
      vehicleModel: 'Tigor EV',
      brand: 'Tata',
      year: 2021,
      price: 950000,
      mileage: 25000,
      batteryHealth: 89,
      diagnosticScore: 8.5,
      vehicleCondition: 'Good',
      images: [tigorEvImage],
      location: 'Bangalore, Karnataka',
      certifiedBy: 'EVChamp Diagnostics',
      listingDate: '2026-03-20'
    },
    {
      id: '4',
      sellerName: 'Sneha Reddy',
      vehicleModel: 'Kona Electric',
      brand: 'Hyundai',
      year: 2020,
      price: 1650000,
      mileage: 32000,
      batteryHealth: 85,
      diagnosticScore: 8.2,
      vehicleCondition: 'Good',
      images: [konaElectricImage],
      location: 'Hyderabad, Telangana',
      certifiedBy: 'EVChamp Diagnostics',
      listingDate: '2026-03-22'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      alert('Please sign in to list your vehicle');
      return;
    }
    
    // Here you would send the data to your backend with user's Clerk data
    const submissionData = {
      ...formData,
      userId: user?.id,
      userEmail: user?.primaryEmailAddress?.emailAddress,
      userName: user?.fullName || `${user?.firstName} ${user?.lastName}`,
      submittedAt: new Date().toISOString()
    };
    
    console.log('Submitting vehicle listing:', submissionData);
    
    // Success message and reset form
    alert('Vehicle listing submitted successfully! Our team will contact you within 24 hours to schedule a comprehensive battery diagnostic test and vehicle inspection. The certification process takes 2-3 days.');
    
    // Reset form and close modal
    setShowListingForm(false);
    setFormData({
      vehicleModel: '',
      brand: '',
      year: '',
      price: '',
      mileage: '',
      location: '',
      description: '',
      contactNumber: ''
    });
  };

  const handleBookInspection = (vehicle: Vehicle) => {
    if (!isSignedIn) {
      alert('Please sign in to book an inspection');
      return;
    }
    setSelectedVehicle(vehicle);
  };

  const initRazorpayPayment = (vehicle: Vehicle) => {
    // Razorpay integration
    const options = {
      key: 'YOUR_RAZORPAY_KEY', // Replace with your Razorpay key
      amount: 50000, // ₹500 inspection fee in paise
      currency: 'INR',
      name: 'EVChamp',
      description: `Inspection Fee for ${vehicle.vehicleModel}`,
      image: '/logo192.png',
      handler: function (response: any) {
        alert(`Inspection booked successfully! Payment ID: ${response.razorpay_payment_id}`);
        setSelectedVehicle(null);
        // Here you would send the payment details to your backend
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#10B981'
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  const getBatteryHealthColor = (health: number) => {
    if (health >= 95) return 'text-green-600';
    if (health >= 85) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConditionBadgeColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Sell Your EV Online | EVChamp EV Marketplace India</title>
        <meta name="description" content="Sell your electric vehicle with complete battery diagnostics and accurate vehicle information. Increase buyer confidence with EVChamp's trusted EV marketplace." />
        <meta name="keywords" content="sell EV online, sell electric vehicle India, EV marketplace, EV battery diagnostics" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Sell Your EV with Confidence
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
              Present your vehicle with complete battery diagnostics and accurate information. EVChamp helps increase buyer trust and supports a smoother selling process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  if (!isSignedIn) {
                    alert('Please sign in to list your vehicle');
                    return;
                  }
                  setShowListingForm(true);
                }}
                className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                List Your EV
              </button>
              <button
                onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-green-500 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                Browse EVs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. List Your Vehicle</h3>
              <p className="text-gray-600">Fill out the form with your EV details and upload photos</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Get Certified</h3>
              <p className="text-gray-600">Our experts conduct battery diagnostics and vehicle inspection</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Sell with Confidence</h3>
              <p className="text-gray-600">Buyers can book test drives and complete purchase via Razorpay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Form Modal */}
      {showListingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">List Your EV</h2>
                <button onClick={() => setShowListingForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmitListing} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select name="brand" value={formData.brand} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select Brand</option>
                    <option value="Tata">Tata</option>
                    <option value="MG">MG</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Mahindra">Mahindra</option>
                    <option value="Ather">Ather</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., Nexon EV Max" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" name="year" value={formData.year} onChange={handleInputChange} required min="2015" max="2026" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="2023" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
                  <input type="number" name="mileage" value={formData.mileage} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="15000" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Price (₹)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="1500000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Mumbai, Maharashtra" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Tell buyers about your vehicle's condition, features, and why you're selling..."></textarea>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong> After submission, our team will contact you within 24 hours to schedule a comprehensive battery diagnostic test and vehicle inspection. The certification process takes 2-3 days.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowListingForm(false)} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
                  Submit Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Inspection Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Book Inspection</h2>
                <button onClick={() => setSelectedVehicle(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{selectedVehicle.vehicleModel}</h3>
              <p className="text-gray-600 mb-4">{selectedVehicle.location}</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Inspection Fee</p>
                <p className="text-3xl font-bold text-gray-900">₹500</p>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Comprehensive battery diagnostic test
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete vehicle condition report
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Test drive opportunity
                </div>
              </div>
              <button
                onClick={() => initRazorpayPayment(selectedVehicle)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Pay ₹500 & Book Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace */}
      <div id="marketplace" className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Certified Pre-Owned EVs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {sampleVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                <img src={vehicle.images[0]} alt={vehicle.vehicleModel} className="w-full h-56 object-cover" />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{vehicle.vehicleModel}</h3>
                      <p className="text-gray-600">{vehicle.brand} • {vehicle.year}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getConditionBadgeColor(vehicle.vehicleCondition)}`}>
                      {vehicle.vehicleCondition}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-blue-600">₹{(vehicle.price / 100000).toFixed(2)}L</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Battery Health</p>
                      <p className={`text-2xl font-bold ${getBatteryHealthColor(vehicle.batteryHealth)}`}>
                        {vehicle.batteryHealth}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Diagnostic Score</p>
                      <p className="text-2xl font-bold text-green-600">{vehicle.diagnosticScore}/10</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {vehicle.mileage.toLocaleString()} km driven
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {vehicle.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Certified by {vehicle.certifiedBy}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookInspection(vehicle)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                  >
                    Book Test Drive & Inspection
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnostic Certificate Info */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">EVChamp Diagnostic Certificate</h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Battery Health Assessment</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">State of Health (SOH) Analysis</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Remaining Capacity Testing</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Cell Balance Verification</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Thermal Management Check</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Vehicle Condition Report</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Mechanical Inspection</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Electronics & Software Check</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Body & Paint Condition</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Document Verification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Sell Your EV?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get the best value for your electric vehicle with our certified diagnostic process
          </p>
          <button
            onClick={() => {
              if (!isSignedIn) {
                alert('Please sign in to list your vehicle');
                return;
              }
              setShowListingForm(true);
            }}
            className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all text-lg"
          >
            List Your EV Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellEV;
