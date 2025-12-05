import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MapPin, 
  Droplets, 
  TreePine, 
  Church, 
  AlertTriangle, 
  Users, 
  Save, 
  Trash2, 
  LayoutDashboard, 
  PlusCircle, 
  Map,
  Filter
} from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

// --- Types & Constants ---

type TourismType = 'Wisata Air' | 'Wisata Religi' | 'Wisata Alam';
type DisasterRisk = 'Laka Air' | 'Banjir' | 'Tanah Longsor';

interface TouristSpot {
  id: string;
  name: string;
  village: string;
  district: string;
  type: TourismType;
  capacity: number;
  risks: DisasterRisk[];
  latitude?: string; // Stored as string to handle input easily, converted for map
  longitude?: string;
}

// All 19 districts in Grobogan Regency
const DISTRICTS = [
  "Brati", "Gabus", "Geyer", "Godong", "Grobogan", 
  "Gubug", "Karangrayung", "Kedungjati", "Klambu", "Kradenan", 
  "Ngaringan", "Penawangan", "Pulokulon", "Purwodadi", 
  "Tanggungharjo", "Tawangharjo", "Tegowanu", "Toroh", "Wirosari"
];

// Approximate center coordinates for each district
const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  "Brati": [-7.0289, 110.8654],
  "Gabus": [-7.1643, 111.0505],
  "Geyer": [-7.2188, 110.9009],
  "Godong": [-7.0326, 110.7107],
  "Grobogan": [-6.9959, 110.9329],
  "Gubug": [-7.0604, 110.6409],
  "Karangrayung": [-7.1158, 110.7483],
  "Kedungjati": [-7.1654, 110.6132],
  "Klambu": [-7.0097, 110.8351],
  "Kradenan": [-7.1581, 111.1378],
  "Ngaringan": [-7.0543, 111.1098],
  "Penawangan": [-7.0818, 110.8251],
  "Pulokulon": [-7.1264, 111.0028],
  "Purwodadi": [-7.0867, 110.9157],
  "Tanggungharjo": [-7.0945, 110.5835],
  "Tawangharjo": [-7.0583, 110.9856],
  "Tegowanu": [-7.0645, 110.5401],
  "Toroh": [-7.1353, 110.8927],
  "Wirosari": [-7.0955, 111.0660]
};

const TOURISM_TYPES: TourismType[] = ['Wisata Alam', 'Wisata Air', 'Wisata Religi'];
const RISK_TYPES: DisasterRisk[] = ['Laka Air', 'Banjir', 'Tanah Longsor'];

// --- Leaflet Map Component ---

const MapComponent = ({ spots }: { spots: TouristSpot[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Initialize map only once
    if (mapRef.current && !mapInstanceRef.current && window.L) {
      mapInstanceRef.current = window.L.map(mapRef.current).setView([-7.0867, 110.9157], 10); // Center on Purwodadi

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }
    
    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update markers when spots change
    if (mapInstanceRef.current && window.L) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      spots.forEach(spot => {
        let lat = parseFloat(spot.latitude || "0");
        let lng = parseFloat(spot.longitude || "0");

        // Fallback to district coordinate if invalid lat/lng
        if ((!lat || !lng) && DISTRICT_COORDINATES[spot.district]) {
          [lat, lng] = DISTRICT_COORDINATES[spot.district];
        }

        if (lat && lng) {
          const markerColor = 
            spot.type === 'Wisata Alam' ? 'green' :
            spot.type === 'Wisata Air' ? 'blue' : 'violet';
            
          // Simple custom icon using HTML would be ideal, but standard blue icon is safer for now without external assets
          // We can use standard markers and bind popups
          const marker = window.L.marker([lat, lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="text-center">
                <strong class="block text-sm font-bold text-slate-800">${spot.name}</strong>
                <span class="text-xs text-slate-500">${spot.district}</span><br/>
                <span class="text-xs px-2 py-1 rounded-full bg-slate-100 mt-1 inline-block">${spot.type}</span>
              </div>
            `);
          
          markersRef.current.push(marker);
        }
      });
      
      // Auto-fit bounds if we have markers
      if (markersRef.current.length > 0) {
        const group = new window.L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
      } else {
        // Reset to default view
        mapInstanceRef.current.setView([-7.0867, 110.9157], 10);
      }
    }
  }, [spots]);

  return <div ref={mapRef} className="h-[400px] w-full rounded-xl z-0" />;
};

// --- Components ---

const Header = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <div className="flex items-center space-x-3">
          <Map className="h-8 w-8 text-emerald-300" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Wisata Grobogan</h1>
            <p className="text-xs text-emerald-200">Sistem Input & Monitoring Data</p>
          </div>
        </div>
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'input' ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Input Data
          </button>
        </nav>
      </div>
    </div>
  </header>
);

const InputForm = ({ onAddSpot }: { onAddSpot: (spot: TouristSpot) => void }) => {
  const [formData, setFormData] = useState<Partial<TouristSpot>>({
    name: '',
    village: '',
    district: DISTRICTS[0],
    type: 'Wisata Alam',
    capacity: 0,
    risks: [],
    latitude: '',
    longitude: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.village) {
      alert("Mohon lengkapi nama dan lokasi desa.");
      return;
    }

    const newSpot: TouristSpot = {
      id: Date.now().toString(),
      name: formData.name!,
      village: formData.village!,
      district: formData.district || DISTRICTS[0],
      type: formData.type || 'Wisata Alam',
      capacity: Number(formData.capacity) || 0,
      risks: formData.risks || [],
      latitude: formData.latitude,
      longitude: formData.longitude
    };

    onAddSpot(newSpot);
    // Reset form
    setFormData({
      name: '',
      village: '',
      district: DISTRICTS[0],
      type: 'Wisata Alam',
      capacity: 0,
      risks: [],
      latitude: '',
      longitude: ''
    });
    alert("Data berhasil disimpan!");
  };

  const toggleRisk = (risk: DisasterRisk) => {
    const currentRisks = formData.risks || [];
    if (currentRisks.includes(risk)) {
      setFormData({ ...formData, risks: currentRisks.filter(r => r !== risk) });
    } else {
      setFormData({ ...formData, risks: [...currentRisks, risk] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
          <h2 className="text-xl font-semibold text-emerald-800 flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" /> Form Input Data Wisata
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Obyek Wisata</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Contoh: Bledug Kuwu"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Desa</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Nama Desa"
                  value={formData.village}
                  onChange={e => setFormData({...formData, village: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Kecamatan</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  value={formData.district}
                  onChange={e => setFormData({...formData, district: e.target.value})}
                >
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Coordinates Input */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-3 font-medium">Koordinat Peta (Opsional)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Latitude</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: -7.0867"
                    value={formData.latitude}
                    onChange={e => setFormData({...formData, latitude: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Longitude</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 110.9157"
                    value={formData.longitude}
                    onChange={e => setFormData({...formData, longitude: e.target.value})}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Jika dikosongkan, lokasi di peta akan menggunakan titik tengah kecamatan.</p>
            </div>
          </div>

          {/* Section 2: Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Wisata</label>
                <div className="space-y-2 mt-2">
                  {TOURISM_TYPES.map(type => (
                    <label key={type} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="radio" 
                        name="type" 
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        checked={formData.type === type}
                        onChange={() => setFormData({...formData, type})}
                      />
                      <span className="flex items-center text-slate-700">
                        {type === 'Wisata Alam' && <TreePine className="w-4 h-4 mr-2 text-green-600"/>}
                        {type === 'Wisata Air' && <Droplets className="w-4 h-4 mr-2 text-blue-500"/>}
                        {type === 'Wisata Religi' && <Church className="w-4 h-4 mr-2 text-purple-500"/>}
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Daya Tampung (Orang)</label>
               <div className="relative">
                 <Users className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                 <input 
                  type="number" 
                  min="0"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                 />
               </div>

               <div className="mt-6">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Potensi Kerawanan Bencana</label>
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                   {RISK_TYPES.map(risk => (
                     <label key={risk} className="flex items-center space-x-2">
                       <input 
                        type="checkbox"
                        className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                        checked={formData.risks?.includes(risk)}
                        onChange={() => toggleRisk(risk)}
                       />
                       <span className="text-slate-700 text-sm flex items-center">
                         <AlertTriangle className="w-3 h-3 mr-1 text-red-400"/> {risk}
                       </span>
                     </label>
                   ))}
                   {(!formData.risks || formData.risks.length === 0) && (
                     <p className="text-xs text-green-600 italic mt-1 font-medium">✓ Lokasi relatif aman</p>
                   )}
                 </div>
               </div>
             </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Data Wisata
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ spots, onDelete }: { spots: TouristSpot[], onDelete: (id: string) => void }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Semua');

  // Filter spots based on selection
  const filteredSpots = selectedDistrict === 'Semua' 
    ? spots 
    : spots.filter(s => s.district === selectedDistrict);

  // Calculations based on FILTERED spots
  const totalCapacity = filteredSpots.reduce((acc, curr) => acc + curr.capacity, 0);
  
  const byType = TOURISM_TYPES.map(type => ({
    type,
    count: filteredSpots.filter(s => s.type === type).length
  }));

  // For district grid, if 'Semua' is selected show all districts with counts.
  // If a district is selected, only show that district.
  const displayDistricts = selectedDistrict === 'Semua' ? DISTRICTS : [selectedDistrict];
  
  const byDistrict = displayDistricts.map(d => ({
    name: d,
    count: filteredSpots.filter(s => s.district === d).length
  }));

  const getTypeColor = (type: TourismType) => {
    switch(type) {
      case 'Wisata Alam': return 'bg-green-100 text-green-800 border-green-200';
      case 'Wisata Air': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Wisata Religi': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100';
    }
  };

  const getRiskBadge = (risks: DisasterRisk[]) => {
    if (risks.length === 0) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Aman</span>;
    return risks.map(r => (
      <span key={r} className="inline-block mr-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mb-1">
        {r}
      </span>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center text-slate-700 font-medium">
           <Filter className="w-5 h-5 mr-2 text-emerald-600" />
           Filter Dashboard
        </div>
        <div className="flex items-center w-full md:w-auto">
          <label className="mr-3 text-sm text-slate-500 whitespace-nowrap">Pilih Kecamatan:</label>
          <select 
            className="w-full md:w-64 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="Semua">Semua Kecamatan</option>
            {DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <p className="text-sm font-medium text-slate-500 uppercase">Total Obyek Wisata</p>
           <p className="text-3xl font-bold text-slate-900 mt-2">{filteredSpots.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <p className="text-sm font-medium text-slate-500 uppercase">Total Daya Tampung</p>
           <p className="text-3xl font-bold text-slate-900 mt-2">{totalCapacity.toLocaleString()}</p>
        </div>
        
        {/* Type Breakdown Mini Cards */}
        {byType.map((item) => (
           <div key={item.type} className={`p-6 rounded-xl shadow-sm border ${getTypeColor(item.type)}`}>
             <p className="text-sm font-medium uppercase opacity-80">{item.type}</p>
             <p className="text-3xl font-bold mt-2">{item.count}</p>
           </div>
        ))}
      </div>

      {/* Map Section */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-emerald-600" /> Peta Sebaran Wisata
          </h3>
        </div>
        <div className="p-1">
          <MapComponent spots={filteredSpots} />
        </div>
        <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center border-t border-slate-100">
          * Menampilkan lokasi berdasarkan koordinat atau titik tengah kecamatan
        </div>
      </div>

      {/* Dashboard Grid: By District */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <LayoutDashboard className="w-5 h-5 mr-2" /> 
          {selectedDistrict === 'Semua' ? 'Sebaran per Kecamatan' : `Data Kecamatan ${selectedDistrict}`}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {byDistrict.map((d) => (
            <div 
              key={d.name} 
              className={`p-4 rounded-lg border transition-all ${
                d.count > 0 
                ? 'bg-white border-emerald-200 shadow-sm hover:shadow-md' 
                : 'bg-slate-50 border-slate-100 opacity-60'
              }`}
            >
              <p className="text-xs text-slate-500 font-semibold uppercase">{d.name}</p>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-bold text-slate-700">{d.count}</span>
                <span className="text-[10px] text-slate-400">lokasi</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid: By Type (Detailed) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <LayoutDashboard className="w-5 h-5 mr-2" /> Detail Wisata {selectedDistrict !== 'Semua' && `di ${selectedDistrict}`}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {byType.map(cat => (
             <div key={cat.type} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className={`px-4 py-3 border-b ${getTypeColor(cat.type)} font-bold`}>
                  {cat.type} ({cat.count})
                </div>
                <div className="p-4 max-h-60 overflow-y-auto">
                  {filteredSpots.filter(s => s.type === cat.type).length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Belum ada data.</p>
                  ) : (
                    <ul className="space-y-2">
                      {filteredSpots.filter(s => s.type === cat.type).map(spot => (
                        <li key={spot.id} className="text-sm text-slate-700 flex justify-between">
                          <span>{spot.name}</span>
                          <span className="text-slate-400 text-xs bg-slate-100 px-2 py-0.5 rounded">{spot.district}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Daftar Data Wisata {selectedDistrict !== 'Semua' && `(${selectedDistrict})`}</h3>
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Obyek Wisata</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lokasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rawan Bencana</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kapasitas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredSpots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                      Tidak ada data yang ditemukan untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredSpots.map((spot) => (
                    <tr key={spot.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{spot.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{spot.district}</div>
                        <div className="text-xs text-slate-500">Desa {spot.village}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(spot.type)}`}>
                           {spot.type}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {getRiskBadge(spot.risks)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {spot.capacity.toLocaleString()} org
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => onDelete(spot.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('grobogan_tourism_data');
    if (saved) {
      try {
        setSpots(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever spots change
  useEffect(() => {
    localStorage.setItem('grobogan_tourism_data', JSON.stringify(spots));
  }, [spots]);

  const addSpot = (spot: TouristSpot) => {
    setSpots([spot, ...spots]);
    setActiveTab('dashboard'); // Switch to dashboard to see result
  };

  const deleteSpot = (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus data ini?")) {
      setSpots(spots.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="mt-6">
        {activeTab === 'input' && (
          <div className="animate-fade-in">
             <div className="text-center mb-6">
               <h2 className="text-3xl font-extrabold text-slate-800">Input Data Wisata</h2>
               <p className="text-slate-600">Kabupaten Grobogan</p>
             </div>
             <InputForm onAddSpot={addSpot} />
          </div>
        )}

        {activeTab === 'dashboard' && (
           <div className="animate-fade-in">
             <div className="text-center mb-2 px-4">
               <h2 className="text-3xl font-extrabold text-slate-800">Dashboard Pariwisata</h2>
               <p className="text-slate-600">Monitoring Sebaran dan Potensi Wisata Grobogan</p>
             </div>
             <Dashboard spots={spots} onDelete={deleteSpot} />
           </div>
        )}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);