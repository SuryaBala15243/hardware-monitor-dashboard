import React, { useState, useEffect } from 'react';
import SensorCard from './components/SensorCard';
import MapView from './components/MapView';
import './index.css';

// REF: Hardcoded Hardware Locations (St. Joseph's College of Engineering)
const LOCATIONS = [
  // Main Entrance / Admin Block
  { id: 'drainage-1', name: 'Main Drainage Line', ip: 'http://192.168.1.177', lat: 12.8698765, lng: 80.2184272 },
  // Canteen / Mess Area (Approximate short distance away)
  { id: 'drainage-2', name: 'Treatment Plant Inlet', ip: 'http://192.168.1.178', lat: 12.8705000, lng: 80.2190000 },
  // Hostel / Rear Gate (Approximate short distance away)
  { id: 'drainage-3', name: 'Sector 4 Outlet', ip: 'http://192.168.1.179', lat: 12.8690000, lng: 80.2180000 }
];

function App() {
  const [isLive, setIsLive] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [connectionStatus, setConnectionStatus] = useState('Connected (Demo)');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // View State: 'dashboard' or 'map'
  const [viewMode, setViewMode] = useState('dashboard');
  const [userLocation, setUserLocation] = useState(null);

  const [sensors, setSensors] = useState({
    gas: { value: 45, status: 'safe' },
    water: { value: 80, status: 'safe' },
    ultrasonic: { value: 120, status: 'safe' }
  });

  // Helper to determine status based on thresholds
  const calculateStatus = (type, value) => {
    if (type === 'gas') {
      if (value > 200) return 'danger';
      if (value > 100) return 'warning';
      return 'safe';
    }
    if (type === 'water') {
      if (value < 10) return 'danger';
      if (value < 30) return 'warning';
      return 'safe';
    }
    if (type === 'ultrasonic') {
      // Distance sensor: Low distance = Full/Blockage (Danger)
      if (value < 20) return 'danger';
      if (value < 50) return 'warning';
      return 'safe';
    }
    return 'safe';
  };

  const handeFindNearest = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
        setViewMode('map'); // Switch to Map View
      },
      (error) => {
        console.error("Error obtaining location", error);
        setLoadingLocation(false);
        // Fallback: Just switch to map anyway, centered on default
        setViewMode('map');
      }
    );
  };

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setViewMode('dashboard');
  };

  useEffect(() => {
    let interval;

    if (!isLive) {
      // DEMO MODE simulation
      setConnectionStatus('Simulating Data...');
      interval = setInterval(() => {
        setSensors(prev => {
          const newGas = Math.max(0, Math.min(500, prev.gas.value + (Math.random() * 20 - 10)));
          const newWater = Math.max(0, Math.min(100, prev.water.value + (Math.random() * 10 - 5)));
          const newDist = Math.max(0, Math.min(200, prev.ultrasonic.value + (Math.random() * 10 - 5)));

          return {
            gas: { value: Math.floor(newGas), status: calculateStatus('gas', newGas) },
            water: { value: Math.floor(newWater), status: calculateStatus('water', newWater) },
            ultrasonic: { value: Math.floor(newDist), status: calculateStatus('ultrasonic', newDist) }
          };
        });
      }, 2000);
    } else {
      // LIVE MODE fetching
      setConnectionStatus(`Connecting to ${selectedLocation.name}...`);

      const fetchData = async () => {
        try {
          // Important: ensure URL ends correctly
          const url = selectedLocation.ip.endsWith('/data') ? selectedLocation.ip : `${selectedLocation.ip}/data`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();

          setSensors({
            gas: { value: data.gas, status: calculateStatus('gas', data.gas) },
            water: { value: data.water, status: calculateStatus('water', data.water) },
            ultrasonic: { value: data.distance, status: calculateStatus('ultrasonic', data.distance) }
          });
          setConnectionStatus(`Live: ${selectedLocation.name}`);
        } catch (error) {
          console.error("Fetch error:", error);
          setConnectionStatus('Connection Failed (Retrying...)');
        }
      };

      fetchData();
      interval = setInterval(fetchData, 2000);
    }

    return () => clearInterval(interval);
  }, [isLive, selectedLocation]);

  // If in Map Mode, render MapView
  if (viewMode === 'map') {
    return (
      <MapView
        locations={LOCATIONS}
        onSelectLocation={handleSelectLocation}
        userLocation={userLocation}
        onBack={() => setViewMode('dashboard')}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Hardware Monitor</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time Environment Sensing</p>
      </div>

      <div className="controls-container">
        <div className="control-group">
          <button
            className={`toggle-btn ${!isLive ? 'active' : ''}`}
            onClick={() => setIsLive(false)}
          >
            Demo Mode
          </button>
          <button
            className={`toggle-btn ${isLive ? 'active' : ''}`}
            onClick={() => setIsLive(true)}
          >
            Live Mode
          </button>
        </div>

        {isLive && (
          <div className="control-group">
            <select
              className="location-select"
              value={selectedLocation.id}
              onChange={(e) => {
                const loc = LOCATIONS.find(l => l.id === e.target.value);
                setSelectedLocation(loc);
              }}
            >
              {LOCATIONS.map(loc => (
                <option key={loc.id} value={loc.id}>
                  📍 {loc.name}
                </option>
              ))}
            </select>

            <button
              className="action-btn"
              onClick={handeFindNearest}
              disabled={loadingLocation}
              title="View on Map"
            >
              {loadingLocation ? '📍 Locating...' : '🗺️ Map View'}
            </button>
          </div>
        )}

        <div className="control-group" style={{ marginLeft: 'auto', fontSize: '0.9rem', color: isLive && connectionStatus.includes('Failed') ? 'var(--danger-color)' : 'var(--safe-color)' }}>
          ● {connectionStatus}
        </div>
      </div>

      <div className="dashboard-grid">
        <SensorCard
          name="Gas Sensor"
          value={sensors.gas.value}
          unit="PPM"
          status={sensors.gas.status}
        />
        <SensorCard
          name="Water Level"
          value={sensors.water.value}
          unit="%"
          status={sensors.water.status}
        />
        <SensorCard
          name="Ultrasonic Sensor"
          value={sensors.ultrasonic.value}
          unit="cm"
          status={sensors.ultrasonic.status}
        />
      </div>
    </div>
  );
}

export default App;
