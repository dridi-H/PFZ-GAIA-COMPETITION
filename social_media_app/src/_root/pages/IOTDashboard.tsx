import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Waves,
  Database,
  RefreshCw,
  Signal,
  Clock,
  MapPin,
  Server,
  Zap,
  TrendingUp,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';

// Configuration
const SUPABASE_URL = 'https://bbcgcqauabclojpkdman.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiY2djcWF1YWJjbG9qcGtkbWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg4NzYsImV4cCI6MjA2NTMyNDg3Nn0.a8OKv2h9QkQ8BY26BYakLSgR77LMbY4MmrVAx_WwD6g';
const FLASK_SERVER_URL = 'http://localhost:5000';

// Type definitions matching your exact Supabase table
interface SensorReading {
  id?: number;
  device_eui: string;
  device_name: string;
  timestamp: string;
  raw_data?: any;
  
  // Environmental sensors
  temperature?: number;
  pressure?: number;
  humidity?: number;
  
  // Water quality sensors (exact table columns)
  ph_value?: number;
  tds_value?: number;
  water_quality_code?: number;
  
  // Sensor status (boolean columns)
  ph_sensor_status?: boolean;
  tds_sensor_status?: boolean;
  
  // GPS
  gps_latitude?: number;
  gps_longitude?: number;
  
  // Thermal data
  thermal_min?: number;
  thermal_max?: number;
  thermal_avg?: number;
  thermal_pixels?: number[];
  
  // LoRaWAN metadata
  rssi?: number;
  snr?: number;
  f_cnt?: number;
  
  created_at?: string;
}

interface WaterQualityStatus {
  label: string;
  color: string;
  bgColor: string;
}

interface PHStatus {
  label: string;
  color: string;
}

const CleanIoTDashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [thermalData, setThermalData] = useState<number[] | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isReceivingLiveData, setIsReceivingLiveData] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [flaskServerStatus, setFlaskServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [recentUpdates, setRecentUpdates] = useState<string[]>([]);

  // Check Flask server status
  const checkFlaskServer = async (): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${FLASK_SERVER_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setFlaskServerStatus('online');
        const data = await response.json();
        console.log('🟢 Flask server online:', data);
      } else {
        setFlaskServerStatus('offline');
      }
    } catch (error) {
      console.error('🔴 Flask server check failed:', error);
      setFlaskServerStatus('offline');
    }
  };

  // Add update to recent updates log
  const addRecentUpdate = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const updateMessage = `${timestamp}: ${message}`;
    setRecentUpdates(prev => [updateMessage, ...prev.slice(0, 4)]);
  };

  // Fetch latest data from Supabase
  const fetchLatestData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=timestamp.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Database error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setError('No data available yet. Waiting for ChirpStack webhook data...');
        setConnectionStatus('connecting');
        setLoading(false);
        return;
      }
      
      const record = data[0] as SensorReading;
      console.log('📊 Latest data:', record);
      
      // Check if this is new data
      if (!sensorData || record.timestamp !== sensorData.timestamp) {
        setSensorData(record);
        addRecentUpdate(`New data received from ${record.device_name}`);
        
        // Set thermal data if available
        if (record.thermal_pixels && record.thermal_pixels.length === 64) {
          setThermalData(record.thermal_pixels);
        }
      }
      
      setLastUpdate(new Date());
      setConnectionStatus('connected');
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(`Database error: ${error}`);
      setConnectionStatus('error');
      setLoading(false);
    }
  }, [sensorData]);

  // Fetch historical data
  const fetchHistoricalData = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=timestamp.desc&limit=10`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data as SensorReading[]);
        console.log(`📈 Loaded ${data.length} historical records`);
      }
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
    }
  };

  // Simulate ChirpStack data
  const simulateChirpStackData = async (): Promise<void> => {
    try {
      setIsReceivingLiveData(true);
      console.log('🎲 Sending simulated data to Flask server...');
      
      const testData = {
        deviceInfo: {
          deviceName: 'LORA_WATER_SENSOR',
          devEui: '0080e1150500dc41'
        },
        time: new Date().toISOString(),
        fCnt: Math.floor(Math.random() * 1000),
        object: {
          temperatureSensor: {
            2: 25 + Math.random() * 10,  // Ambient temperature
            10: (29 + Math.random() * 4 + 100) * 10,  // Thermal min
            11: (32 + Math.random() * 4 + 100) * 10,  // Thermal max
            12: (30.5 + Math.random() * 2 + 100) * 10  // Thermal avg
          },
          barometer: {
            1: 1013 + Math.random() * 30  // Atmospheric pressure
          },
          humiditySensor: {
            3: 60 + Math.random() * 30  // Humidity
          },
          analogInput: {
            5: 6.5 + Math.random() * 1.5,  // pH value
            6: 150 + Math.random() * 100,  // TDS value
            7: 36.7 + Math.random() * 0.2,  // GPS Latitude
            8: 10.4 + Math.random() * 0.2   // GPS Longitude
          },
          digitalInput: {
            9: Math.floor(Math.random() * 3),  // Water quality code
            // Thermal pixels (channels 30-93)
            ...Object.fromEntries(
              Array.from({ length: 64 }, (_, i) => [
                (30 + i).toString(),
                Math.floor((Math.random() * 15 + 25 + 20) * 2.55)
              ])
            )
          }
        },
        rxInfo: [{
          rssi: -70 - Math.random() * 30,
          snr: 5 + Math.random() * 10
        }]
      };

      const response = await fetch(`${FLASK_SERVER_URL}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Simulation successful:', result);
        addRecentUpdate('Simulated data sent successfully');
        setTimeout(fetchLatestData, 1000);
      } else {
        throw new Error(`Webhook failed: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Simulation error:', error);
      setError(`Simulation failed: ${error}`);
      addRecentUpdate(`Simulation failed: ${error}`);
    } finally {
      setIsReceivingLiveData(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLatestData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLatestData]);

  // Initial data load
  useEffect(() => {
    fetchLatestData();
    fetchHistoricalData();
    checkFlaskServer();
    
    const serverCheckInterval = setInterval(checkFlaskServer, 30000);
    
    return () => clearInterval(serverCheckInterval);
  }, [fetchLatestData]);

  // Helper functions
  const getWaterQualityStatus = (code: number): WaterQualityStatus => {
    const statuses: { [key: number]: WaterQualityStatus } = {
      0: { label: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-100' },
      1: { label: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-100' },
      2: { label: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
      3: { label: 'Poor', color: 'text-orange-500', bgColor: 'bg-orange-100' },
      4: { label: 'Bad', color: 'text-red-500', bgColor: 'bg-red-100' },
      5: { label: 'Dangerous', color: 'text-red-700', bgColor: 'bg-red-200' }
    };
    return statuses[code] || { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100' };
  };

  const getPHStatus = (ph: number): PHStatus => {
    if (ph < 6.5) return { label: 'Acidic', color: 'text-red-500' };
    if (ph > 8.5) return { label: 'Basic', color: 'text-purple-500' };
    return { label: 'Neutral', color: 'text-green-500' };
  };

  const getTrend = (currentValue: number | undefined, sensorType: keyof SensorReading): string => {
    if (!currentValue || historicalData.length < 2) return '';
    
    const previousValue = historicalData[1]?.[sensorType] as number;
    if (!previousValue) return '';
    
    const diff = currentValue - previousValue;
    if (Math.abs(diff) < 0.1) return '→';
    return diff > 0 ? '↗' : '↘';
  };

  // Render thermal heatmap
  const renderThermalHeatmap = (): JSX.Element => {
    if (!thermalData || thermalData.length !== 64) {
      return (
        <div className="w-full h-32 bg-gray-800 rounded flex items-center justify-center border border-gray-600">
          <span className="text-gray-400 text-sm">No thermal data</span>
        </div>
      );
    }
    
    const minTemp = Math.min(...thermalData);
    const maxTemp = Math.max(...thermalData);
    
    return (
      <div className="grid grid-cols-8 gap-1 w-full max-w-xs mx-auto">
        {thermalData.map((temp: number, i: number) => {
          const intensity = (temp - minTemp) / (maxTemp - minTemp);
          const hue = (1 - intensity) * 240;
          return (
            <div
              key={i}
              className="aspect-square rounded-sm border border-gray-600 transition-colors duration-300"
              style={{
                backgroundColor: `hsl(${hue}, 100%, ${50 + intensity * 30}%)`
              }}
              title={`${temp.toFixed(1)}°C`}
            />
          );
        })}
      </div>
    );
  };

  // Loading screen
  if (loading && !sensorData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <div className="text-center">
              <p className="text-gray-300 mb-2">Loading IoT Dashboard...</p>
              <p className="text-xs text-gray-500">Connecting to Supabase database</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeSinceUpdate = sensorData ? 
    Math.floor((new Date().getTime() - new Date(sensorData.timestamp).getTime()) / 1000) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-blue-500 p-3 rounded-lg">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Live IoT Water Quality Dashboard</h1>
            <p className="text-gray-400 text-sm mb-3">
              ChirpStack → Flask Server → Supabase • Device: {sensorData?.device_name || 'Waiting...'}
            </p>
            
            {/* Status Row */}
            <div className="flex items-center gap-6 mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm ${
                  connectionStatus === 'connected' ? 'text-green-400' : 
                  connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {connectionStatus === 'connected' ? 'Live Data' : 
                   connectionStatus === 'connecting' ? 'Waiting' : 'Error'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span className={`text-sm ${
                  flaskServerStatus === 'online' ? 'text-green-400' : 
                  flaskServerStatus === 'offline' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  Flask: {flaskServerStatus}
                </span>
              </div>
              
              {sensorData && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {timeSinceUpdate < 60 ? `${timeSinceUpdate}s ago` : `${Math.floor(timeSinceUpdate / 60)}m ago`}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Database className="w-4 h-4" />
                {historicalData.length} records
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                  autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                disabled={!autoRefresh}
              >
                <option value={2}>2s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={fetchLatestData}
              className="bg-gray-600 hover:bg-gray-700 p-3 rounded-lg transition-colors"
              disabled={loading}
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={simulateChirpStackData}
              disabled={isReceivingLiveData}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-3 rounded-lg transition-colors"
              title="Simulate ChirpStack Data"
            >
              <Server className={`w-5 h-5 ${isReceivingLiveData ? 'animate-pulse' : ''}`} />
            </button>
            <button 
              onClick={fetchHistoricalData}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors"
              title="Load Historical Data"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recent Updates */}
        {recentUpdates.length > 0 && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Recent Updates</h3>
            <div className="space-y-1">
              {recentUpdates.map((update, index) => (
                <div key={index} className={`text-xs ${index === 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  {update}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="text-yellow-400 font-semibold">Waiting for Data</h3>
                <p className="text-gray-300 text-sm mt-1">{error}</p>
                <div className="mt-3 text-xs text-gray-400">
                  <p>Flask webhook: <code className="bg-gray-800 px-2 py-1 rounded">{FLASK_SERVER_URL}/webhook</code></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Summary */}
        {sensorData && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">
                  {sensorData.temperature ? sensorData.temperature.toFixed(1) : '--'}°C
                  <span className="text-sm ml-1">{getTrend(sensorData.temperature, 'temperature')}</span>
                </div>
                <div className="text-xs text-gray-400">Temperature</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">
                  {sensorData.ph_value ? sensorData.ph_value.toFixed(2) : '--'}
                  <span className="text-sm ml-1">{getTrend(sensorData.ph_value, 'ph_value')}</span>
                </div>
                <div className="text-xs text-gray-400">pH</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-cyan-400">
                  {sensorData.tds_value ? sensorData.tds_value.toFixed(0) : '--'}
                  <span className="text-sm ml-1">{getTrend(sensorData.tds_value, 'tds_value')}</span>
                </div>
                <div className="text-xs text-gray-400">TDS (ppm)</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">
                  {sensorData.rssi || '--'}
                </div>
                <div className="text-xs text-gray-400">RSSI (dBm)</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${sensorData.water_quality_code !== undefined ? getWaterQualityStatus(sensorData.water_quality_code).color : 'text-gray-400'}`}>
                  {sensorData.water_quality_code !== undefined ? getWaterQualityStatus(sensorData.water_quality_code).label : 'Unknown'}
                </div>
                <div className="text-xs text-gray-400">Quality</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          
          {/* Environmental */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Wind className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold">Environmental</h3>
              {sensorData?.temperature && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Temperature</span>
                <span className="font-semibold">
                  {sensorData?.temperature ? sensorData.temperature.toFixed(1) : '--'}°C
                  <span className="text-sm ml-1">{getTrend(sensorData?.temperature, 'temperature')}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Pressure</span>
                <span className="font-semibold">
                  {sensorData?.pressure ? sensorData.pressure.toFixed(0) : '--'} hPa
                  <span className="text-sm ml-1">{getTrend(sensorData?.pressure, 'pressure')}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Humidity</span>
                <span className="font-semibold">
                  {sensorData?.humidity ? sensorData.humidity.toFixed(1) : '--'}%
                  <span className="text-sm ml-1">{getTrend(sensorData?.humidity, 'humidity')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* pH Level */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Droplets className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold">pH Level</h3>
              {sensorData?.ph_value && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {sensorData?.ph_value ? sensorData.ph_value.toFixed(2) : '--'}
                <div className="text-sm text-gray-400 mt-1">
                  {getTrend(sensorData?.ph_value, 'ph_value')}
                </div>
              </div>
              {sensorData?.ph_value ? (
                <div className={`text-sm px-3 py-1 rounded-full inline-block ${getPHStatus(sensorData.ph_value).color} bg-opacity-20`}>
                  {getPHStatus(sensorData.ph_value).label}
                </div>
              ) : (
                <div className="text-sm px-3 py-1 rounded-full inline-block text-gray-500 bg-gray-700">
                  No Data
                </div>
              )}
            </div>
            {sensorData?.ph_value && (
              <div className="mt-4 h-2 bg-gradient-to-r from-red-500 via-green-500 to-purple-500 rounded-full">
                <div 
                  className="h-2 bg-white rounded-full shadow-sm transition-all duration-300"
                  style={{ 
                    width: '4px', 
                    marginLeft: `${Math.max(0, Math.min(100, (sensorData.ph_value / 14) * 100))}%` 
                  }}
                />
              </div>
            )}
          </div>

          {/* TDS */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Waves className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-semibold">TDS</h3>
              {sensorData?.tds_value && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {sensorData?.tds_value ? sensorData.tds_value.toFixed(0) : '--'} ppm
                <div className="text-sm text-gray-400 mt-1">
                  {getTrend(sensorData?.tds_value, 'tds_value')}
                </div>
              </div>
              {sensorData?.water_quality_code !== undefined ? (
                <div className={`text-sm px-3 py-1 rounded-full inline-block text-gray-900 ${getWaterQualityStatus(sensorData.water_quality_code).bgColor}`}>
                  {getWaterQualityStatus(sensorData.water_quality_code).label}
                </div>
              ) : (
                <div className="text-sm px-3 py-1 rounded-full inline-block text-gray-500 bg-gray-700">
                  No Classification
                </div>
              )}
            </div>
          </div>

          {/* GPS */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold">GPS Location</h3>
              {sensorData?.gps_latitude && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Latitude</span>
                <span className="font-semibold">{sensorData?.gps_latitude ? sensorData.gps_latitude.toFixed(4) : '--'}°N</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Longitude</span>
                <span className="font-semibold">{sensorData?.gps_longitude ? sensorData.gps_longitude.toFixed(4) : '--'}°E</span>
              </div>
              <div className="text-center">
                <div className="text-sm px-3 py-1 rounded-full inline-block bg-red-200 text-red-800">
                  Tunisia
                </div>
              </div>
            </div>
          </div>

          {/* LoRaWAN Signal */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Signal className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold">LoRaWAN Signal</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">RSSI</span>
                <span className={`font-semibold ${sensorData?.rssi && sensorData.rssi > -80 ? 'text-green-400' : sensorData?.rssi && sensorData.rssi > -100 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {sensorData?.rssi || '--'} dBm
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">SNR</span>
                <span className={`font-semibold ${sensorData?.snr && sensorData.snr > 5 ? 'text-green-400' : sensorData?.snr && sensorData.snr > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {sensorData?.snr ? sensorData.snr.toFixed(1) : '--'} dB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Frame</span>
                <span className="font-semibold text-purple-400">{sensorData?.f_cnt || '--'}</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold">System Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">ChirpStack</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <span className={`text-sm ${connectionStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {connectionStatus === 'connected' ? 'Live' : 'Waiting'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Flask Server</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${flaskServerStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${flaskServerStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                    {flaskServerStatus === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Supabase</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Water Sensors</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sensorData?.ph_value || sensorData?.tds_value ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className={`text-sm ${sensorData?.ph_value || sensorData?.tds_value ? 'text-green-400' : 'text-gray-400'}`}>
                    {sensorData?.ph_value || sensorData?.tds_value ? 'Active' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Thermal Camera</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${thermalData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className={`text-sm ${thermalData ? 'text-green-400' : 'text-yellow-400'}`}>
                    {thermalData ? 'Active' : 'Standby'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thermal Camera Section */}
        <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-600">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold">Thermal Camera (AMG8833)</h3>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${thermalData ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>{thermalData ? `Live • ${thermalData.length} pixels` : 'No Data'}</span>
              </div>
              <button
                onClick={() => {
                  const img = document.querySelector('#thermal-flask-image') as HTMLImageElement;
                  if (img) {
                    img.src = `${FLASK_SERVER_URL}/thermal-image?nocache=${Date.now()}`;
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
              >
                Refresh Image
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Temperature Stats */}
            <div>
              <h4 className="text-sm font-medium mb-4 text-gray-300">Temperature Statistics</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Minimum</span>
                  <span className="font-semibold text-blue-400">
                    {sensorData?.thermal_min ? sensorData.thermal_min.toFixed(1) : '--'}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Maximum</span>
                  <span className="font-semibold text-red-400">
                    {sensorData?.thermal_max ? sensorData.thermal_max.toFixed(1) : '--'}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average</span>
                  <span className="font-semibold text-yellow-400">
                    {sensorData?.thermal_avg ? sensorData.thermal_avg.toFixed(1) : '--'}°C
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Sensor Info</div>
                  <div className="text-xs text-green-400">8x8 Pixel Array</div>
                  <div className="text-xs text-blue-400">64 Temperature Points</div>
                </div>
              </div>
            </div>

            {/* Raw Heatmap */}
            <div>
              <h4 className="text-sm font-medium mb-4 text-gray-300">Raw Heatmap (8x8)</h4>
              {renderThermalHeatmap()}
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-400">Direct AMG8833 Data</div>
                {thermalData && (
                  <div className="text-xs text-green-400 mt-1">
                    Last update: {new Date().toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            {/* Flask Server Image */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-medium mb-4 text-gray-300">Flask Server Thermal Image</h4>
              <div className="bg-gray-900 rounded-lg p-2 border border-gray-600 h-64">
                <img 
                  id="thermal-flask-image"
                  src={`${FLASK_SERVER_URL}/thermal-image?nocache=${Date.now()}`}
                  alt="Flask Server Thermal" 
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'none';
                  }}
                />
                <div 
                  className="w-full h-full bg-gray-800 rounded flex items-center justify-center text-gray-400 text-sm"
                  style={{ display: 'none' }}
                >
                  <div className="text-center">
                    <Server className="w-8 h-8 mx-auto mb-2" />
                    <div>Flask server thermal image unavailable</div>
                    <div className="text-xs mt-1">Check if Flask server is running</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-400">Matplotlib Generated • 64x64 Resolution</div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Trends */}
        {historicalData.length > 1 && (
          <div className="mb-8 bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold">Historical Trends</h3>
              <span className="text-sm text-gray-400">Last {historicalData.length} readings</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Temperature Trend */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-300">Environmental Temperature</h4>
                <div className="space-y-2">
                  {historicalData.slice(0, 5).map((reading, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        {new Date(reading.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium ${index === 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                        {reading.temperature ? reading.temperature.toFixed(1) : '--'}°C
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* pH Trend */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-300">pH Level</h4>
                <div className="space-y-2">
                  {historicalData.slice(0, 5).map((reading, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        {new Date(reading.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium ${index === 0 ? 'text-purple-400' : 'text-gray-300'}`}>
                        {reading.ph_value ? reading.ph_value.toFixed(2) : '--'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TDS Trend */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-300">TDS</h4>
                <div className="space-y-2">
                  {historicalData.slice(0, 5).map((reading, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        {new Date(reading.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium ${index === 0 ? 'text-cyan-400' : 'text-gray-300'}`}>
                        {reading.tds_value ? reading.tds_value.toFixed(0) : '--'} ppm
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signal Strength Trend */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-300">Signal Strength</h4>
                <div className="space-y-2">
                  {historicalData.slice(0, 5).map((reading, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        {new Date(reading.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium ${index === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                        {reading.rssi || '--'} dBm
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        
          

      </div>
    </div>
  );
};

export default CleanIoTDashboard;