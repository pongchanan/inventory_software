import React from 'react';
import { Info, Lock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AssetInventoryGridProps {
  searchQuery: string;
}

export function AssetInventoryGrid({ searchQuery }: AssetInventoryGridProps) {
  const assets = [
    // Floor 1: Low-Value Items
    {
      id: 'RFID-001',
      name: 'Dell Latitude Laptop',
      category: 'Computers',
      floor: 1,
      status: 'Available',
      image: 'https://images.unsplash.com/photo-1642943038577-eb4a59549766?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzY5Njk2NDkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'RFID-002',
      name: 'iPad Pro 11"',
      category: 'Tablets',
      floor: 1,
      status: 'Borrowed',
      image: 'https://images.unsplash.com/photo-1568918460973-fe7f54f82482?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZXQlMjBkZXZpY2UlMjBlbGVjdHJvbmljfGVufDF8fHx8MTc2OTYyNjI1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'RFID-003',
      name: 'Sony WH-1000XM4',
      category: 'Audio',
      floor: 1,
      status: 'Available',
      image: 'https://images.unsplash.com/photo-1629555258982-b920af8da52d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwYXVkaW8lMjBlcXVpcG1lbnR8ZW58MXx8fHwxNzY5NzMzNjY1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'RFID-004',
      name: 'Logitech Webcam',
      category: 'Peripherals',
      floor: 1,
      status: 'Under Maintenance',
      image: 'https://images.unsplash.com/photo-1642943038577-eb4a59549766?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzY5Njk2NDkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    // Floor 2: High-Value Items
    {
      id: 'RFID-101',
      name: 'Canon EOS R5',
      category: 'Cameras',
      floor: 2,
      status: 'Requires Approval',
      image: 'https://images.unsplash.com/photo-1764557359097-f15dd0c0a17b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBwaG90b2dyYXBoeSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3Njk2OTc4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'RFID-102',
      name: 'Epson Projector',
      category: 'Presentation',
      floor: 2,
      status: 'Requires Approval',
      image: 'https://images.unsplash.com/photo-1761388559873-40bfb05f39e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9qZWN0b3IlMjBwcmVzZW50YXRpb24lMjBlcXVpcG1lbnR8ZW58MXx8fHwxNzY5NzQxMzE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'RFID-103',
      name: 'Zeiss Microscope',
      category: 'Lab Equipment',
      floor: 2,
      status: 'Borrowed',
      image: 'https://images.unsplash.com/photo-1732400333616-8efa4f385a03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWNyb3Njb3BlJTIwbGFib3JhdG9yeSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3Njk3MTgxNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'RFID-104',
      name: 'Sony A7 III Camera',
      category: 'Cameras',
      floor: 2,
      status: 'Requires Approval',
      image: 'https://images.unsplash.com/photo-1764557359097-f15dd0c0a17b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBwaG90b2dyYXBoeSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3Njk2OTc4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
  ];

  const filteredAssets = assets.filter((asset) => {
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.id.toLowerCase().includes(query) ||
      asset.category.toLowerCase().includes(query)
    );
  });

  const floor1Assets = filteredAssets.filter((asset) => asset.floor === 1);
  const floor2Assets = filteredAssets.filter((asset) => asset.floor === 2);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Borrowed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Under Maintenance':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Requires Approval':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const renderAssetCard = (asset: typeof assets[0]) => {
    const isFloor1 = asset.floor === 1;
    const floorColor = isFloor1 ? 'green' : 'amber';
    const floorBg = isFloor1 ? 'bg-green-500/5' : 'bg-amber-500/5';
    const floorBorder = isFloor1 ? 'border-green-500/20' : 'border-amber-500/20';

    return (
      <div
        key={asset.id}
        className={`${floorBg} ${floorBorder} border rounded-xl overflow-hidden hover:shadow-xl transition-all group`}
      >
        {/* Image */}
        <div className="relative h-48 bg-slate-800 overflow-hidden">
          <ImageWithFallback
            src={asset.image}
            alt={asset.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Floor Badge */}
          <div
            className={`absolute top-3 left-3 px-3 py-1 rounded-lg ${
              isFloor1
                ? 'bg-green-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            } text-xs font-semibold flex items-center gap-1`}
          >
            {!isFloor1 && <Lock className="w-3 h-3" />}
            Floor {asset.floor}: {isFloor1 ? 'Low-Value' : 'High-Value'}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">{asset.name}</h3>
            <p className="text-sm text-slate-400">{asset.category}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">{asset.id}</span>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyles(
                asset.status
              )}`}
            >
              {asset.status}
            </span>
          </div>

          {/* Action Button */}
          {isFloor1 ? (
            <button
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                asset.status === 'Available'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              } flex items-center justify-center gap-2`}
              disabled={asset.status !== 'Available'}
            >
              <Info className="w-4 h-4" />
              {asset.status === 'Available' ? 'Borrow Info' : 'Not Available'}
            </button>
          ) : (
            <button
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                asset.status === 'Requires Approval'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              } flex items-center justify-center gap-2`}
              disabled={asset.status !== 'Requires Approval'}
            >
              <Lock className="w-4 h-4" />
              {asset.status === 'Requires Approval' ? 'Request / Reserve' : 'Not Available'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Floor 1: Low-Value Items */}
      {floor1Assets.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-slate-100">
              Floor 1: Low-Value Assets
            </h2>
            <span className="text-sm text-slate-400">({floor1Assets.length} items)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {floor1Assets.map(renderAssetCard)}
          </div>
        </div>
      )}

      {/* Floor 2: High-Value Items */}
      {floor2Assets.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-amber-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-slate-100">
              Floor 2: High-Value Assets
            </h2>
            <span className="text-sm text-slate-400">({floor2Assets.length} items)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {floor2Assets.map(renderAssetCard)}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No assets found matching your search.</p>
        </div>
      )}
    </div>
  );
}
