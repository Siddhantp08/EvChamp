import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ServiceType = 'car' | 'battery';

interface CityOption {
  label: string;
  lat: number;
  lon: number;
}

interface LiveServiceCentre {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: ServiceType;
  city: string;
  source: string;
}

interface ManagerListing {
  id: string;
  businessName: string;
  managerName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  serviceType: ServiceType;
  status: string;
}

const CITY_OPTIONS: CityOption[] = [
  { label: 'Delhi', lat: 28.6139, lon: 77.209 },
  { label: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { label: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { label: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { label: 'Pune', lat: 18.5204, lon: 73.8567 },
  { label: 'Chennai', lat: 13.0827, lon: 80.2707 },
];

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const MANAGER_STORAGE_KEY = 'evchamp-manager-service-centres';

const buildQuery = (lat: number, lon: number, type: ServiceType) => {
  if (type === 'battery') {
    return `[out:json][timeout:20];(
      node["shop"="battery"](around:12000,${lat},${lon});
      way["shop"="battery"](around:12000,${lat},${lon});
      node["name"~"battery|Battery|EV|electric", i](around:12000,${lat},${lon});
      way["name"~"battery|Battery|EV|electric", i](around:12000,${lat},${lon});
    );out center 20;`;
  }

  return `[out:json][timeout:20];(
    node["amenity"="car_repair"](around:12000,${lat},${lon});
    way["amenity"="car_repair"](around:12000,${lat},${lon});
    node["shop"="car_repair"](around:12000,${lat},${lon});
    way["shop"="car_repair"](around:12000,${lat},${lon});
  );out center 20;`;
};

const formatAddress = (tags: Record<string, string>) => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
  ].filter(Boolean);

  return tags['addr:full'] || parts.join(', ') || 'Address not available';
};

const ServiceCentres: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]);
  const [serviceType, setServiceType] = useState<ServiceType>('car');
  const [liveCentres, setLiveCentres] = useState<LiveServiceCentre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [managerListings, setManagerListings] = useState<ManagerListing[]>([]);
  const [form, setForm] = useState({
    businessName: '',
    managerName: '',
    phone: '',
    email: '',
    city: CITY_OPTIONS[0].label,
    address: '',
    serviceType: 'car' as ServiceType,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MANAGER_STORAGE_KEY);
      if (stored) {
        setManagerListings(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Unable to load manager listings:', err);
    }
  }, []);

  useEffect(() => {
    const fetchLiveData = async () => {
      setIsLoading(true);
      setError('');

      const query = buildQuery(selectedCity.lat, selectedCity.lon, serviceType);
      let lastError = '';

      for (const endpoint of OVERPASS_ENDPOINTS) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);

        try {
          const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
            method: 'GET',
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          window.clearTimeout(timeoutId);

          if (!response.ok) {
            lastError = `Source returned ${response.status}`;
            continue;
          }

          const data = await response.json() as { elements?: Array<any> };
          const mapped = (data.elements || [])
            .map((item) => {
              const tags = item.tags || {};
              return {
                id: `${item.type}-${item.id}`,
                name: tags.name || (serviceType === 'car' ? 'Car Service Centre' : 'Battery Service Centre'),
                address: formatAddress(tags),
                lat: item.lat || item.center?.lat || selectedCity.lat,
                lon: item.lon || item.center?.lon || selectedCity.lon,
                type: serviceType,
                city: selectedCity.label,
                source: 'OpenStreetMap / Overpass API',
              } as LiveServiceCentre;
            })
            .filter((item) => item.name);

          const deduped = Array.from(
            new Map(mapped.map((item) => [`${item.name}-${item.address}`, item])).values()
          ).slice(0, 12);

          setLiveCentres(deduped);
          setIsLoading(false);
          return;
        } catch (err) {
          window.clearTimeout(timeoutId);
          lastError = err instanceof Error ? err.message : 'Unable to load live centres';
        }
      }

      setLiveCentres([]);
      setError(lastError || 'Unable to load live service-centre data right now.');
      setIsLoading(false);
    };

    fetchLiveData();
  }, [selectedCity, serviceType]);

  const filteredManagerListings = useMemo(
    () => managerListings.filter((item) => item.serviceType === serviceType),
    [managerListings, serviceType]
  );

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const newListing: ManagerListing = {
      id: `${Date.now()}`,
      businessName: form.businessName,
      managerName: form.managerName,
      phone: form.phone,
      email: form.email,
      city: form.city,
      address: form.address,
      serviceType: form.serviceType,
      status: 'Pending verification',
    };

    const updated = [newListing, ...managerListings];
    setManagerListings(updated);
    localStorage.setItem(MANAGER_STORAGE_KEY, JSON.stringify(updated));
    setSubmitMessage('Service centre submitted successfully. It is now visible below as a manager listing.');
    setForm({
      businessName: '',
      managerName: '',
      phone: '',
      email: '',
      city: CITY_OPTIONS[0].label,
      address: '',
      serviceType,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-green-50 py-10 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center bg-white border border-gray-200 shadow-md rounded-lg px-4 py-2 hover:bg-sky-50 transition-all text-sky-700 font-semibold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 lg:p-10 mb-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-700 px-4 py-1.5 text-sm font-semibold mb-4">
              🔧 Real Service Centre Finder
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Find real car and battery service centres.
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
              This page uses the <strong>OpenStreetMap / Overpass API</strong> to show live nearby car service
              and battery-related service locations, plus a separate section for business manager submissions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose city</label>
                <select
                  value={selectedCity.label}
                  onChange={(e) => {
                    const city = CITY_OPTIONS.find((item) => item.label === e.target.value) || CITY_OPTIONS[0];
                    setSelectedCity(city);
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {CITY_OPTIONS.map((city) => (
                    <option key={city.label} value={city.label}>{city.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('car')}
                    className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-colors ${
                      serviceType === 'car' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Car Service
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType('battery')}
                    className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-colors ${
                      serviceType === 'battery' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Battery Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">API Source</p>
            <p className="text-xl font-bold text-gray-900">OpenStreetMap</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Current city</p>
            <p className="text-xl font-bold text-gray-900">{selectedCity.label}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Live results</p>
            <p className="text-xl font-bold text-gray-900">{liveCentres.length}</p>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Live {serviceType === 'car' ? 'Car Service Centres' : 'Battery Service Centres'} in {selectedCity.label}
            </h2>
            <span className="text-sm font-semibold text-sky-700 bg-sky-50 px-3 py-1 rounded-full">
              API-backed list
            </span>
          </div>

          {isLoading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-gray-600">
              Loading live service-centre data...
            </div>
          )}

          {!isLoading && error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 mb-4">
              {error}. Try another city or reload in a moment.
            </div>
          )}

          {!isLoading && !error && liveCentres.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-gray-600">
              No live service-centre results found for this filter right now.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveCentres.map((centre) => (
              <div key={centre.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-sky-600 mb-1">{centre.city}</p>
                    <h3 className="text-xl font-bold text-gray-900">{centre.name}</h3>
                  </div>
                  <span className="rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold">
                    Live
                  </span>
                </div>

                <p className="text-gray-600 mb-3">{centre.address}</p>
                <p className="text-xs text-gray-500 mb-4">Source: {centre.source}</p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${centre.lat},${centre.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    Open in Maps
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${centre.lat}&mlon=${centre.lon}#map=15/${centre.lat}/${centre.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View OSM
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">For business managers</h2>
            <p className="text-gray-600 mb-5">
              List your service centre so customers can discover your workshop, battery lab, or EV support desk.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Business name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
                required
              />
              <input
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                placeholder="Manager name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  required
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                >
                  {CITY_OPTIONS.map((city) => (
                    <option key={city.label} value={city.label}>{city.label}</option>
                  ))}
                </select>
                <select
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                >
                  <option value="car">Car service</option>
                  <option value="battery">Battery service</option>
                </select>
              </div>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Workshop or service centre address"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 min-h-[110px]"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-sky-600 to-green-600 text-white font-semibold px-5 py-3 rounded-xl hover:opacity-95 transition-opacity"
              >
                Submit Service Centre
              </button>
            </form>

            {submitMessage && (
              <div className="mt-4 rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm font-medium">
                {submitMessage}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Manager-listed centres</h2>
              <span className="text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                {filteredManagerListings.length} listings
              </span>
            </div>

            <div className="space-y-4">
              {filteredManagerListings.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-gray-600">
                  No business-manager listings yet for this category.
                </div>
              ) : (
                filteredManagerListings.map((listing) => (
                  <div key={listing.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{listing.businessName}</h3>
                        <p className="text-sm text-gray-600">{listing.city}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
                        {listing.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{listing.address}</p>
                    <p className="text-xs text-gray-500">
                      Contact: {listing.managerName} · {listing.phone} · {listing.email}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-sky-600 to-green-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Need urgent EV assistance?</h2>
          <p className="text-sky-50 mb-4 max-w-2xl">
            Use EVChamp RSA support for towing, battery assistance, and on-road emergency response.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/rsa-plans')}
              className="bg-white text-sky-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-sky-50 transition-colors"
            >
              View RSA Plans
            </button>
            <a
              href="tel:+919999999999"
              className="border border-white/70 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCentres;
