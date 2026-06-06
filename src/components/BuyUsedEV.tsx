import React, { useState } from 'react';
import { FaBatteryFull, FaTachometerAlt, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';

// Re-using images from assets
import nexonImg from '../assets/tata-nexon.jpg';
import mgzsevImg from '../assets/mgzsev.jpg';
import konaImg from '../assets/honda-kona-ev.jpg';
import tiagoevImg from '../assets/tiagoev.jpg';

// Import new images
import tigorImg from '../assets/tigor.png';
import veritoImg from '../assets/verito.png';
import expressTImg from '../assets/expresst.png';

interface UsedEVCard {
  id: number;
  name: string;
  brand: string;
  image: string;
  year: number;
  kmsDriven: string;
  batteryHealth: string;
  price: number;
  available: boolean;
}

const usedEVs: UsedEVCard[] = [
  { id: 1, name: "Nexon EV", brand: "Tata", image: nexonImg, year: 2022, kmsDriven: "15,000 km", batteryHealth: "95%", price: 1250000, available: false },
  { id: 2, name: "ZSEV", brand: "MG", image: mgzsevImg, year: 2021, kmsDriven: "22,000 km", batteryHealth: "92%", price: 1400000, available: true },
  { id: 3, name: "Kona Electric", brand: "Hyundai", image: konaImg, year: 2022, kmsDriven: "18,000 km", batteryHealth: "94%", price: 1550000, available: false },
  { id: 5, name: "Tiago EV", brand: "Tata", image: tiagoevImg, year: 2023, kmsDriven: "5,000 km", batteryHealth: "99%", price: 750000, available: true },
  { id: 6, name: "Tigor EV", brand: "Tata", image: tigorImg, year: 2022, kmsDriven: "25,000 km", batteryHealth: "91%", price: 450000, available: true },
  { id: 7, name: "Express-T EV", brand: "Tata", image: expressTImg, year: 2021, kmsDriven: "40,000 km", batteryHealth: "88%", price: 350000, available: true },
  { id: 8, name: "eVerito", brand: "Mahindra", image: veritoImg, year: 2020, kmsDriven: "55,000 km", batteryHealth: "85%", price: 250000, available: true },
];

const BuyUsedEV: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [selectedCar, setSelectedCar] = useState<UsedEVCard | null>(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  const handleEnquireNow = (car: UsedEVCard) => {
    if (!user) {
      alert('Please sign in to enquire about a used EV.');
      return;
    }
    setSelectedCar(car);
    setShowEnquiryModal(true);
  };

  const BackArrow = FaArrowLeft as React.ElementType;
  const TachometerIcon = FaTachometerAlt as React.ElementType;
  const BatteryIcon = FaBatteryFull as React.ElementType;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>EV Marketplace India | Buy Certified Pre-Owned EVs with Battery Diagnostics</title>
        <meta name="description" content="Buy certified pre-owned EVs with complete battery diagnostics, transparent vehicle data, and trusted marketplace support from EVChamp." />
        <meta name="keywords" content="buy used EV in India, certified pre-owned EVs, EV battery diagnostics, EV marketplace India" />
      </Helmet>

      {/* Back Button */}
      <div className="static sm:absolute sm:top-24 sm:left-6 z-10 px-4 sm:px-0 pt-4 sm:pt-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-700 bg-white/80 border border-gray-200 px-4 py-2 rounded-lg hover:bg-white transition-all text-sm shadow-sm"
        >
          <BackArrow className="text-lg" />
          <span className="font-semibold">Back</span>
        </button>
      </div>
      
      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 pb-10 sm:pb-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Buy Certified Pre-Owned EVs</h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
            Explore certified pre-owned electric vehicles with detailed battery health insights and condition reports. Make informed decisions with complete transparency.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
            <span className="bg-white/10 px-3 py-1.5 rounded-full">✓ Battery Health Assessment</span>
            <span className="bg-white/10 px-3 py-1.5 rounded-full">✓ Verified Listings</span>
            <span className="bg-white/10 px-3 py-1.5 rounded-full">✓ Trusted Transactions</span>
          </div>
        </div>
      </section>

      {/* EV Cards Grid */}
      <section className="py-10 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {usedEVs.map((car) => (
              <div
                key={car.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => car.available && handleEnquireNow(car)}
              >
                <div className="relative">
                  <img src={car.image} alt={`${car.brand} ${car.name}`} className="w-full h-48 object-cover" />
                  {car.available ? (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Available</div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Sold</div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{car.brand} {car.name}</h3>
                      <p className="text-gray-600">{car.year} Model</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">₹{car.price.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Asking Price</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2"><TachometerIcon className="text-blue-500" /><span>{car.kmsDriven}</span></div>
                    <div className="flex items-center space-x-2"><BatteryIcon className="text-green-500" /><span>{car.batteryHealth} Health</span></div>
                  </div>
                  <button
                    disabled={!car.available}
                    className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {car.available ? 'Enquire Now' : 'Sold Out'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Modal */}
      {showEnquiryModal && selectedCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Enquiry for {selectedCar.brand} {selectedCar.name}</h2>
            <p className="mb-6 text-gray-600">Our team will contact you shortly with further details. Please confirm your contact information.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={user?.firstName || user?.username || ''} readOnly className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={user?.primaryEmailAddress?.emailAddress || ''} readOnly className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button onClick={() => setShowEnquiryModal(false)} className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                <button onClick={() => { alert('Thank you for your enquiry! Our team will be in touch.'); setShowEnquiryModal(false); }} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Confirm Enquiry</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyUsedEV;