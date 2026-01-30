import { Package, Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Compartment {
  id: string;
  floor: 1 | 2;
  lockerNumber: string;
  status: 'available' | 'occupied' | 'overdue' | 'maintenance';
  itemName?: string;
  borrower?: string;
  dueDate?: Date;
}

export function InventoryMonitor() {
  const compartments: Compartment[] = [
    // Floor 1 - Low Value
    { id: '1-1', floor: 1, lockerNumber: '1-01', status: 'available' },
    { id: '1-2', floor: 1, lockerNumber: '1-02', status: 'occupied', itemName: 'USB-C Hub', borrower: 'Alex J.', dueDate: new Date(Date.now() + 5 * 60 * 60 * 1000) },
    { id: '1-3', floor: 1, lockerNumber: '1-03', status: 'available' },
    { id: '1-4', floor: 1, lockerNumber: '1-04', status: 'occupied', itemName: 'Mouse', borrower: 'Sarah M.', dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000) },
    { id: '1-5', floor: 1, lockerNumber: '1-05', status: 'overdue', itemName: 'Charger', borrower: 'Mike C.', dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: '1-6', floor: 1, lockerNumber: '1-06', status: 'available' },
    { id: '1-7', floor: 1, lockerNumber: '1-07', status: 'maintenance' },
    { id: '1-8', floor: 1, lockerNumber: '1-08', status: 'available' },
    { id: '1-9', floor: 1, lockerNumber: '1-09', status: 'occupied', itemName: 'Keyboard', borrower: 'Emma L.', dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000) },
    { id: '1-10', floor: 1, lockerNumber: '1-10', status: 'available' },
    { id: '1-11', floor: 1, lockerNumber: '1-11', status: 'available' },
    { id: '1-12', floor: 1, lockerNumber: '1-12', status: 'occupied', itemName: 'HDMI Cable', borrower: 'David K.', dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000) },
    
    // Floor 2 - High Value
    { id: '2-1', floor: 2, lockerNumber: '2-01', status: 'occupied', itemName: 'MacBook Pro', borrower: 'Alex J.', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { id: '2-2', floor: 2, lockerNumber: '2-02', status: 'available' },
    { id: '2-3', floor: 2, lockerNumber: '2-03', status: 'occupied', itemName: 'Sony Camera', borrower: 'Sarah M.', dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    { id: '2-4', floor: 2, lockerNumber: '2-04', status: 'available' },
    { id: '2-5', floor: 2, lockerNumber: '2-05', status: 'maintenance' },
    { id: '2-6', floor: 2, lockerNumber: '2-06', status: 'available' },
    { id: '2-7', floor: 2, lockerNumber: '2-07', status: 'occupied', itemName: 'iPad Pro', borrower: 'Chris P.', dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000) },
    { id: '2-8', floor: 2, lockerNumber: '2-08', status: 'available' },
  ];

  const getStatusConfig = (status: Compartment['status']) => {
    switch (status) {
      case 'available':
        return {
          color: 'bg-green-100 border-green-500 hover:bg-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          label: 'Available',
        };
      case 'occupied':
        return {
          color: 'bg-blue-100 border-blue-500 hover:bg-blue-200',
          icon: Lock,
          iconColor: 'text-blue-600',
          label: 'Occupied',
        };
      case 'overdue':
        return {
          color: 'bg-red-100 border-red-500 hover:bg-red-200 animate-pulse',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          label: 'Overdue',
        };
      case 'maintenance':
        return {
          color: 'bg-slate-100 border-slate-400 hover:bg-slate-200',
          icon: AlertTriangle,
          iconColor: 'text-slate-500',
          label: 'Maintenance',
        };
    }
  };

  const floor1Compartments = compartments.filter(c => c.floor === 1);
  const floor2Compartments = compartments.filter(c => c.floor === 2);

  const floor1Stats = {
    available: floor1Compartments.filter(c => c.status === 'available').length,
    occupied: floor1Compartments.filter(c => c.status === 'occupied').length,
    overdue: floor1Compartments.filter(c => c.status === 'overdue').length,
    maintenance: floor1Compartments.filter(c => c.status === 'maintenance').length,
  };

  const floor2Stats = {
    available: floor2Compartments.filter(c => c.status === 'available').length,
    occupied: floor2Compartments.filter(c => c.status === 'occupied').length,
    overdue: floor2Compartments.filter(c => c.status === 'overdue').length,
    maintenance: floor2Compartments.filter(c => c.status === 'maintenance').length,
  };

  const CompartmentCard = ({ compartment }: { compartment: Compartment }) => {
    const config = getStatusConfig(compartment.status);
    const Icon = config.icon;

    return (
      <div
        className={`border-2 rounded-lg p-3 transition-all cursor-pointer ${config.color}`}
        title={`${compartment.lockerNumber} - ${config.label}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-900 text-sm">{compartment.lockerNumber}</span>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        {compartment.status === 'occupied' || compartment.status === 'overdue' ? (
          <div className="text-xs space-y-1">
            <p className="font-semibold text-slate-900 truncate">{compartment.itemName}</p>
            <p className="text-slate-600 truncate">{compartment.borrower}</p>
          </div>
        ) : (
          <p className={`text-xs font-medium ${config.iconColor}`}>{config.label}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-slate-900 text-xl font-bold">Real-time Inventory Monitor</h3>
            <p className="text-slate-500 text-sm">RFID-enabled locker compartments</p>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-slate-600 text-sm font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-slate-600 text-sm font-medium">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-slate-600 text-sm font-medium">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-400 rounded"></div>
            <span className="text-slate-600 text-sm font-medium">Maintenance</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Floor 1 - Low Value */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-green-900 font-bold text-lg">Floor 1: Low-Value Items</h4>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-700 font-medium">Available: <strong>{floor1Stats.available}</strong></span>
              <span className="text-blue-700 font-medium">Occupied: <strong>{floor1Stats.occupied}</strong></span>
              <span className="text-red-700 font-medium">Overdue: <strong>{floor1Stats.overdue}</strong></span>
              <span className="text-slate-600 font-medium">Maintenance: <strong>{floor1Stats.maintenance}</strong></span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {floor1Compartments.map(compartment => (
              <CompartmentCard key={compartment.id} compartment={compartment} />
            ))}
          </div>
        </div>

        {/* Floor 2 - High Value */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-amber-900 font-bold text-lg">Floor 2: High-Value Items</h4>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-700 font-medium">Available: <strong>{floor2Stats.available}</strong></span>
              <span className="text-blue-700 font-medium">Occupied: <strong>{floor2Stats.occupied}</strong></span>
              <span className="text-red-700 font-medium">Overdue: <strong>{floor2Stats.overdue}</strong></span>
              <span className="text-slate-600 font-medium">Maintenance: <strong>{floor2Stats.maintenance}</strong></span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {floor2Compartments.map(compartment => (
              <CompartmentCard key={compartment.id} compartment={compartment} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
