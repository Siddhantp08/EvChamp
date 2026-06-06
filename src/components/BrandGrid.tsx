import React from 'react';
import BrandCard from './BrandCard';

export interface Brand {
  name: string;
  image: string;
  description: string;
  price: string;
}

interface BrandGridProps {
  brands: Brand[];
}

const BrandGrid: React.FC<BrandGridProps> = ({ brands }) => (
  <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
    {brands.map((brand) => (
      <BrandCard key={brand.name} {...brand} />
    ))}
  </div>
);

export default BrandGrid; 