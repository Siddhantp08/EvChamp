import React from 'react';

import partner1 from '../assets/partners/partner1.jpg';
import partner2 from '../assets/partners/partner2.png';
import partner3 from '../assets/partners/partner3.jpg';
import partner4 from '../assets/partners/partner4.png';
import partner5 from '../assets/partners/partner5.jpg';
import partner6 from '../assets/partners/partner6.png';
import partner7 from '../assets/partners/partner7.png';
import partner8 from '../assets/partners/partner8.png';
import partner9 from '../assets/partners/partner9.png';

const partners = [
  { name: 'Vision Mechatronics', logo: partner1 },
  { name: 'TAHAWAL', logo: partner2 },
  { name: 'EPSL Trigeneration', logo: partner3 },
  { name: 'Sensing, Modelling, Analytics', logo: partner4 },
  { name: 'SungEel HiTech', logo: partner5 },
  { name: 'Tata .ev', logo: partner6 },
  { name: 'LIUM GO', logo: partner7 },
  { name: 'Chari Karo', logo: partner8 },
  { name: 'eee-Taxi', logo: partner9 },
];

const PartnersCarousel: React.FC = () => {
  // Duplicate the list for a seamless infinite loop
  const doubled = [...partners, ...partners];

  return (
    <div className="w-full overflow-hidden">
      <div className="flex partners-scroll">
        {doubled.map((partner, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 mx-10 flex items-center justify-center"
            style={{ width: '220px', height: '110px' }}
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-h-24 max-w-full object-contain transition-all duration-300 opacity-90 hover:opacity-100"
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes partners-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .partners-scroll {
          animation: partners-marquee 28s linear infinite;
          width: max-content;
        }
        .partners-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default PartnersCarousel;
