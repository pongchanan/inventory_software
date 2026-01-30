import { ImageWithFallback } from './figma/ImageWithFallback';
import { Wifi, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  rfidId: string;
  category: string;
  floor: 1 | 2;
  status: 'Available' | 'Borrowed' | 'Under Maintenance' | 'Requires Approval';
  imageQuery: string;
}

export function AssetInventoryGrid() {
  const assets: Asset[] = [
    {
      id: '1',
      name: 'Dell Wireless Mouse',
      rfidId: 'RFID-001-LV',
      category: 'Peripherals',
      floor: 1,
      status: 'Available',
      imageQuery: 'wireless mouse',
    },
    {
      id: '2',
      name: 'USB-C Hub Adapter',
      rfidId: 'RFID-002-LV',
      category: 'Accessories',
      floor: 1,
      status: 'Available',
      imageQuery: 'usb hub adapter',
    },
    {
      id: '3',
      name: 'Portable Charger',
      rfidId: 'RFID-003-LV',
      category: 'Power',
      floor: 1,
      status: 'Borrowed',
      imageQuery: 'power bank charger',
    },
    {
      id: '4',
      name: 'MacBook Pro 16"',
      rfidId: 'RFID-101-HV',
      category: 'Laptops',
      floor: 2,
      status: 'Requires Approval',
      imageQuery: 'macbook pro laptop',
    },
    {
      id: '5',
      name: 'Sony Camera A7III',
      rfidId: 'RFID-102-HV',
      category: 'Photography',
      floor: 2,
      status: 'Requires Approval',
      imageQuery: 'sony camera professional',
    },
    {
      id: '6',
      name: 'iPad Pro 12.9"',
      rfidId: 'RFID-103-HV',
      category: 'Tablets',
      floor: 2,
      status: 'Under Maintenance',
      imageQuery: 'ipad pro tablet',
    },
  ];

  const getStatusIcon = (status: Asset['status']) => {
    switch (status) {
      case 'Available':
        return <CheckCircle className="w-4 h-4" />;
      case 'Borrowed':
        return <Clock className="w-4 h-4" />;
      case 'Under Maintenance':
        return <AlertCircle className="w-4 h-4" />;
      case 'Requires Approval':
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-green-900/30 text-green-500 border-green-500/30';
      case 'Borrowed':
        return 'bg-blue-900/30 text-blue-500 border-blue-500/30';
      case 'Under Maintenance':
        return 'bg-red-900/30 text-red-500 border-red-500/30';
      case 'Requires Approval':
        return 'bg-amber-900/30 text-amber-500 border-amber-500/30';
    }
  };

  const getFloorColor = (floor: 1 | 2) => {
    return floor === 1 ? 'border-green-500' : 'border-amber-500';
  };

  const getFloorBadge = (floor: 1 | 2) => {
    if (floor === 1) {
      return (
        <div className="flex items-center gap-1.5 bg-green-900/20 border border-green-500/30 px-2 py-1 rounded">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-500 text-xs font-medium">Floor 1: Low-Value</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 bg-amber-900/20 border border-amber-500/30 px-2 py-1 rounded">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        <span className="text-amber-500 text-xs font-medium">Floor 2: High-Value</span>
      </div>
    );
  };

  const getActionButton = (asset: Asset) => {
    if (asset.floor === 1 && asset.status === 'Available') {
      return (
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
          Borrow Info
        </button>
      );
    }
    if (asset.floor === 2 && (asset.status === 'Available' || asset.status === 'Requires Approval')) {
      return (
        <button className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
          Request/Reserve
        </button>
      );
    }
    return (
      <button className="w-full bg-slate-700 text-slate-400 py-2 px-4 rounded-lg cursor-not-allowed font-medium" disabled>
        Unavailable
      </button>
    );
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Asset Inventory</h2>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Wifi className="w-4 h-4" />
          <span>Real-time RFID Sync</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className={`bg-slate-900 border-2 ${getFloorColor(asset.floor)} rounded-lg overflow-hidden hover:shadow-lg transition-shadow`}
          >
            {/* Asset Image */}
            <div className="relative h-40 bg-slate-800">
              <ImageWithFallback
                src={`https://source.unsplash.com/featured/?${encodeURIComponent(asset.imageQuery)}`}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              {/* Floor Badge Overlay */}
              <div className="absolute top-2 left-2">
                {getFloorBadge(asset.floor)}
              </div>
            </div>
            
            {/* Asset Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-white font-semibold mb-1">{asset.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span className="font-mono">{asset.rfidId}</span>
                  <span>•</span>
                  <span>{asset.category}</span>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${getStatusColor(asset.status)}`}>
                {getStatusIcon(asset.status)}
                <span className="text-xs font-medium">{asset.status}</span>
              </div>
              
              {/* Action Button */}
              {getActionButton(asset)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
