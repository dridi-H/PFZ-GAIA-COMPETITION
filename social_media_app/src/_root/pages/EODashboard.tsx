import React, { useState, useEffect } from 'react';
import { 
  Calendar, Droplets, Thermometer, Activity, Download, Filter, 
  MapPin, TrendingUp, AlertTriangle, RefreshCw, Navigation, 
  BarChart3, Globe, Satellite, Database, Clock, Server,
  CheckCircle, XCircle, Eye, Trash2, Info
} from 'lucide-react';

interface TunisiaDataPoint {
  id: string;
  date: string;
  latitude: number;
  longitude: number;
  parameter: string;
  location_name: string;
  value?: number;
  u_velocity?: number;
  v_velocity?: number;
  speed?: number;
  direction?: number;
}

interface TunisiaAPIResponse {
  status: string;
  data: TunisiaDataPoint[];
  individual_parameters?: Record<string, any>;
  metadata: {
    source: string;
    parameters?: string[];
    date?: string;
    total_points?: number;
    region?: string;
    bounds?: any;
    coastal_locations?: number;
    cache_enabled?: boolean;
    is_yesterday?: boolean;
    auto_cleanup?: boolean;
    files_cleaned?: boolean;
  };
  message?: string;
}

interface CacheStatus {
  cache_enabled: boolean;
  cache_stats?: Record<string, number>;
  total_cached_dates?: number;
  total_cached_points?: number;
  auto_mode?: string;
  yesterday_date?: string;
  auto_cleanup?: boolean;
  message?: string;
  error?: string;
}

interface TunisiaLocation {
  name: string;
  lat: number;
  lng: number;
  city: string;
}

interface SystemInfo {
  status: string;
  system: {
    auto_mode: string;
    yesterday_date: string;
    auto_cleanup: boolean;
    temp_directory: string;
    temp_files_count: number;
    current_dir_nc_files: number;
    authenticated: boolean;
    cache_enabled: boolean;
  };
  features: string[];
}

const TunisiaDashboard = () => {
  const [selectedParams, setSelectedParams] = useState<string[]>(['sea_surface_temperature', 'chlorophyll', 'salinity']);
  const [selectedDate, setSelectedDate] = useState<string>(''); // Will be set to yesterday
  const [oceanData, setOceanData] = useState<TunisiaDataPoint[]>([]);
  const [individualData, setIndividualData] = useState<Record<string, any>>({});
  const [selectedLocation, setSelectedLocation] = useState<TunisiaDataPoint | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<TunisiaAPIResponse['metadata'] | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [tunisiaLocations, setTunisiaLocations] = useState<TunisiaLocation[]>([]);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);

  const API_BASE_URL = 'http://localhost:3001/api';

  // Tunisia-specific parameters
  const parameterConfig = {
    sea_surface_temperature: {
      label: 'Sea Surface Temperature',
      unit: '°C',
      color: '#EF4444',
      icon: Thermometer,
      description: 'Mediterranean water temperature around Tunisia'
    },
    chlorophyll: {
      label: 'Chlorophyll-a',
      unit: 'mg/m³',
      color: '#10B981',
      icon: Activity,
      description: 'Algae concentration in Tunisian coastal waters'
    },
    salinity: {
      label: 'Sea Surface Salinity',
      unit: 'PSU',
      color: '#3B82F6',
      icon: Droplets,
      description: 'Salt concentration in Mediterranean Sea (Tunisia)'
    },
    ocean_currents: {
      label: 'Ocean Currents',
      unit: 'm/s',
      color: '#8B5CF6',
      icon: Navigation,
      description: 'Water movement around Tunisian coast'
    }
  };

  // Get yesterday's date
  const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  // Initialize with yesterday's date
  useEffect(() => {
    const yesterdayDate = getYesterdayDate();
    setSelectedDate(yesterdayDate);
    console.log(`📅 Auto-setting date to yesterday: ${yesterdayDate}`);
  }, []);

  // Fetch Tunisia oceanographic data (automatically uses yesterday if in auto mode)
  const fetchTunisiaData = async (useAutoMode: boolean = true) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🇹🇳 Fetching Tunisia oceanographic data...');
      
      let endpoint = `${API_BASE_URL}/tunisia-data`;
      const params = new URLSearchParams();
      
      if (useAutoMode) {
        // Use the special yesterday endpoint for automatic J-1 data
        endpoint = `${API_BASE_URL}/yesterday-data`;
        console.log('📅 Using auto yesterday (J-1) mode');
      } else {
        // Use manual date selection
        params.append('start_date', selectedDate);
        params.append('end_date', selectedDate);
        console.log(`📅 Using manual date: ${selectedDate}`);
      }
      
      if (selectedParams.length > 0) {
        params.append('parameters', selectedParams.join(','));
      }
      
      const finalUrl = params.toString() ? `${endpoint}?${params}` : endpoint;
      console.log(`🔗 Fetching from: ${finalUrl}`);
      
      const response = await fetch(finalUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result: TunisiaAPIResponse = await response.json();
      
      console.log('📊 Tunisia API Response:', result);
      
      if (result.status === 'success' || result.status === 'success_mock' || result.status === 'success_cached') {
        setOceanData(result.data || []);
        setIndividualData(result.individual_parameters || {});
        setApiInfo(result.metadata);
        setLastUpdated(new Date().toLocaleTimeString());
        
        // Update selected date to the actual date returned by API
        if (result.metadata.date) {
          setSelectedDate(result.metadata.date);
        }
        
        if (result.message) {
          console.log('ℹ️ API Message:', result.message);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch Tunisia data');
      }
      
    } catch (err) {
      console.error('❌ Error fetching Tunisia data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Tunisia data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cache status
  const fetchCacheStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cache-status`);
      const result: CacheStatus = await response.json();
      setCacheStatus(result);
      console.log('💾 Cache Status:', result);
    } catch (err) {
      console.error('Error fetching cache status:', err);
    }
  };

  // Fetch system info
  const fetchSystemInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system-info`);
      const result: SystemInfo = await response.json();
      setSystemInfo(result);
      console.log('🖥️ System Info:', result);
    } catch (err) {
      console.error('Error fetching system info:', err);
    }
  };

  // Cleanup files manually
  const cleanupFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanup-files`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('🗑️ Files cleaned up successfully');
        fetchSystemInfo(); // Refresh system info
      }
    } catch (err) {
      console.error('Error cleaning up files:', err);
    }
  };

  // Fetch Tunisia locations
  const fetchTunisiaLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`);
      const result = await response.json();
      if (result.status === 'success') {
        setTunisiaLocations(result.locations);
      }
    } catch (err) {
      console.error('Error fetching Tunisia locations:', err);
    }
  };

  // Check API health
  const checkAPIHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const health = await response.json();
      console.log('🔗 Tunisia API Health:', health);
      return health;
    } catch (err) {
      console.error('❌ Tunisia API Health Check Failed:', err);
      return null;
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchTunisiaData(isAutoMode);
    }
  }, [selectedParams, isAutoMode]); // Removed selectedDate dependency when in auto mode

  useEffect(() => {
    checkAPIHealth();
    fetchCacheStatus();
    fetchSystemInfo();
    fetchTunisiaLocations();
  }, []);

  const handleRefresh = () => {
    fetchTunisiaData(isAutoMode);
    fetchCacheStatus();
    fetchSystemInfo();
  };

  const handleParameterToggle = (param: string) => {
    setSelectedParams(prev => 
      prev.includes(param) 
        ? prev.filter(p => p !== param)
        : [...prev, param]
    );
  };

  const handleModeToggle = () => {
    const newAutoMode = !isAutoMode;
    setIsAutoMode(newAutoMode);
    
    if (newAutoMode) {
      // Switch to auto mode - use yesterday
      const yesterdayDate = getYesterdayDate();
      setSelectedDate(yesterdayDate);
      console.log('📅 Switched to auto mode (yesterday)');
    } else {
      console.log('📅 Switched to manual mode');
    }
    
    // Fetch data with new mode
    setTimeout(() => fetchTunisiaData(newAutoMode), 100);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setIsAutoMode(false); // Switch to manual mode when date is manually changed
    fetchTunisiaData(false);
  };

  const getDataSourceBadge = (source: string) => {
    if (source.includes('Cache')) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
          <Database className="w-3 h-3" />
          Cached
        </span>
      );
    } else if (source.includes('Mock')) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
          <Eye className="w-3 h-3" />
          Demo
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
          <Satellite className="w-3 h-3" />
          Live
        </span>
      );
    }
  };

  const getParameterStats = (paramKey: string) => {
    const paramData = individualData[paramKey];
    if (!paramData || !paramData.data) return null;
    
    const values = paramData.data
      .map((point: TunisiaDataPoint) => point.value || point.speed)
      .filter((val: any): val is number => val !== undefined && !isNaN(val));
    
    if (values.length === 0) return null;
    
    const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, count: values.length };
  };

  const renderLocationCard = (point: TunisiaDataPoint) => {
    const config = parameterConfig[point.parameter as keyof typeof parameterConfig];
    if (!config) return null;

    let displayValue = '';
    if (point.value !== undefined) {
      displayValue = `${point.value.toFixed(3)} ${config.unit}`;
    } else if (point.speed !== undefined) {
      displayValue = `${point.speed.toFixed(3)} ${config.unit}`;
    }

    return (
      <div 
        key={point.id}
        className="bg-dark-3 rounded-lg p-4 border border-dark-4 hover:border-primary-500 transition-colors cursor-pointer"
        onClick={() => setSelectedLocation(selectedLocation?.id === point.id ? null : point)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <config.icon className="w-4 h-4" style={{ color: config.color }} />
            <h4 className="font-medium text-white text-sm">{point.location_name}</h4>
          </div>
          {getDataSourceBadge(individualData[point.parameter]?.metadata?.source || '')}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-light-3">Value:</span>
            <span className="text-white font-medium">{displayValue}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-light-3">Coordinates:</span>
            <span className="text-white">{point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}</span>
          </div>
          
          {point.parameter === 'ocean_currents' && point.direction !== undefined && (
            <div className="flex justify-between">
              <span className="text-light-3">Direction:</span>
              <span className="text-white">{point.direction.toFixed(0)}°</span>
            </div>
          )}
        </div>
        
        {selectedLocation?.id === point.id && (
          <div className="mt-4 pt-3 border-t border-dark-4">
            <div className="text-xs text-light-3 space-y-1">
              <div>Parameter: {config.label}</div>
              <div>Date: {point.date}</div>
              <div>Region: Tunisia</div>
              {apiInfo?.is_yesterday && <div className="text-blue-400">Yesterday (J-1) Data</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-1 min-h-screen bg-dark-1">
      <div className="common-container">
        {/* Header */}
        <div className="max-w-full flex-start gap-4 justify-start w-full">
          <div className="bg-gradient-to-br from-red-500 to-white p-3 rounded-xl">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">🇹🇳</span>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              Tunisia Ocean Monitoring Dashboard
            </h1>
            <p className="text-light-3 text-sm">
              Auto J-1 oceanographic data for Tunisian coastal waters with intelligent caching
            </p>
            {apiInfo && (
              <div className="flex flex-wrap gap-4 text-xs text-light-4 mt-2">
                <span>Region: {apiInfo.region || 'Tunisia'}</span>
                <span>• {apiInfo.total_points || 0} measurements</span>
                {apiInfo.is_yesterday && <span className="text-blue-400">• Yesterday (J-1) Data</span>}
                {apiInfo.auto_cleanup && <span className="text-green-400">• Auto Cleanup</span>}
                {apiInfo.cache_enabled && <span className="text-blue-400">• Supabase Cache Active</span>}
                {lastUpdated && <span>• Updated: {lastUpdated}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="mt-6 p-6 bg-dark-2 rounded-xl border border-dark-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Auto/Manual Mode Toggle */}
              <div className="flex items-center gap-3 p-3 bg-dark-3 rounded-lg border border-dark-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-light-2">Mode:</span>
                </div>
                <button
                  onClick={handleModeToggle}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    isAutoMode 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-dark-4 text-light-3 hover:bg-dark-2'
                  }`}
                >
                  {isAutoMode ? 'Auto J-1' : 'Manual'}
                </button>
                {cacheStatus?.yesterday_date && (
                  <span className="text-xs text-light-4">
                    Yesterday: {cacheStatus.yesterday_date}
                  </span>
                )}
              </div>

              {/* Date Picker (only visible in manual mode) */}
              <div className={`flex items-center gap-2 transition-opacity ${isAutoMode ? 'opacity-50' : 'opacity-100'}`}>
                <Calendar className="w-4 h-4 text-light-3" />
                <input
                  type="date"
                  value={selectedDate}
                  max={getYesterdayDate()}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={isAutoMode}
                  className={`bg-dark-3 border border-dark-4 rounded px-3 py-2 text-white text-sm ${
                    isAutoMode ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                />
                <span className="text-xs text-light-4">
                  {isAutoMode ? 'Auto Mode' : 'Manual Mode'}
                </span>
              </div>
              
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 px-4 py-2 rounded text-white text-sm transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm transition-colors">
                <Download className="w-4 h-4" />
                Export Tunisia Data
              </button>

              {/* Manual Cleanup Button */}
              <button 
                onClick={cleanupFiles}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white text-sm transition-colors"
                title="Manually cleanup temporary files"
              >
                <Trash2 className="w-4 h-4" />
                Cleanup Files
              </button>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-4">
              {systemInfo && (
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-400">
                    Temp Files: {systemInfo.system.temp_files_count + systemInfo.system.current_dir_nc_files}
                  </span>
                </div>
              )}
              
              {cacheStatus && (
                <div className="flex items-center gap-2">
                  {cacheStatus.cache_enabled ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">
                        Cache: {cacheStatus.total_cached_points || 0} points
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">Cache: Disabled</span>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-light-3" />
                <span className="text-sm text-light-3">Tunisia Focus</span>
              </div>
            </div>
          </div>

          {/* Parameter Selection */}
          <div className="mt-4 border-t border-dark-4 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-light-3" />
              <span className="text-sm text-light-2">Tunisia Parameters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(parameterConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleParameterToggle(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedParams.includes(key)
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-3 text-light-3 hover:bg-dark-4'
                  }`}
                >
                  <config.icon className="w-4 h-4" />
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Error fetching Tunisia data</span>
            </div>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        )}

        {apiInfo?.source === 'Supabase Cache' && !loading && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400">
              <Database className="w-4 h-4" />
              <span className="font-medium">Data Served from Cache!</span>
            </div>
            <p className="text-sm text-blue-300 mt-1">
              Fast loading from Supabase database - {apiInfo.total_points} cached points
              {apiInfo.is_yesterday && ' (Yesterday J-1 data)'}
            </p>
          </div>
        )}

        {apiInfo?.source?.includes('Copernicus') && !loading && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <Satellite className="w-4 h-4" />
              <span className="font-medium">Fresh Satellite Data Downloaded!</span>
            </div>
            <p className="text-sm text-green-300 mt-1">
              New data cached in Supabase for faster future access
              {apiInfo.auto_cleanup && ' • Files automatically cleaned up'}
              {apiInfo.is_yesterday && ' • Yesterday (J-1) data'}
            </p>
          </div>
        )}

        {/* Auto Mode Info */}
        {isAutoMode && !loading && (
          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-purple-400">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Auto J-1 Mode Active</span>
            </div>
            <p className="text-sm text-purple-300 mt-1">
              Automatically fetching yesterday's data ({selectedDate}) with auto file cleanup
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-32 mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-light-3">
              {isAutoMode 
                ? `Fetching yesterday's data (${selectedDate})...` 
                : `Fetching Tunisia data for ${selectedDate}...`}
            </span>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!loading && (
          <>
            {/* Navigation Tabs */}
            <div className="mt-6 flex gap-1 p-1 bg-dark-2 rounded-lg">
              {[
                { id: 'overview', label: 'Overview', icon: Globe },
                { id: 'parameters', label: 'Parameters', icon: BarChart3 },
                { id: 'locations', label: 'Coastal Cities', icon: MapPin },
                { id: 'system', label: 'System Status', icon: Server },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-light-3 hover:text-white hover:bg-dark-3'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Parameter Statistics */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedParams.map(paramKey => {
                      const config = parameterConfig[paramKey as keyof typeof parameterConfig];
                      const stats = getParameterStats(paramKey);
                      
                      if (!config) return null;
                      
                      return (
                        <div key={paramKey} className="bg-dark-2 rounded-lg border border-dark-4 p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div 
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: `${config.color}20` }}
                            >
                              <config.icon 
                                className="w-6 h-6" 
                                style={{ color: config.color }} 
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">{config.label}</h3>
                              <p className="text-sm text-light-3">{config.description}</p>
                            </div>
                            {getDataSourceBadge(individualData[paramKey]?.metadata?.source || '')}
                          </div>
                          
                          {stats ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-light-3 text-sm">Tunisia Average:</span>
                                <span className="text-white font-medium">
                                  {stats.avg.toFixed(2)} {config.unit}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-light-3 text-sm">Range:</span>
                                <span className="text-white font-medium">
                                  {stats.min.toFixed(2)} - {stats.max.toFixed(2)} {config.unit}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-light-3 text-sm">Coastal Points:</span>
                                <span className="text-white font-medium">{stats.count}</span>
                              </div>
                              
                              {/* Visual indicator */}
                              <div className="w-full bg-dark-4 rounded-full h-2 mt-3">
                                <div 
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: '80%',
                                    backgroundColor: config.color 
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <span className="text-light-4 text-sm">No data available</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tunisia Information */}
                  <div className="space-y-4">
                    <div className="bg-dark-2 rounded-lg border border-dark-4 p-6">
                      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        Tunisia Coast Summary
                      </h3>
                      
                      {oceanData.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-light-3">Total Points:</span>
                              <div className="text-white font-medium">{oceanData.length}</div>
                            </div>
                            <div>
                              <span className="text-light-3">Coastal Cities:</span>
                              <div className="text-white font-medium">{tunisiaLocations.length}</div>
                            </div>
                            <div>
                              <span className="text-light-3">Parameters:</span>
                              <div className="text-white font-medium">{selectedParams.length}</div>
                            </div>
                            <div>
                              <span className="text-light-3">Mode:</span>
                              <div className={`font-medium ${isAutoMode ? 'text-blue-400' : 'text-orange-400'}`}>
                                {isAutoMode ? 'Auto J-1' : 'Manual'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-dark-4">
                            <div className="text-sm text-light-3 space-y-1">
                              <div>Region: Mediterranean Sea (Tunisia)</div>
                              <div>Date: {selectedDate} {apiInfo?.is_yesterday && '(Yesterday)'}</div>
                              {apiInfo?.auto_cleanup && <div className="text-green-400">Auto Cleanup: Active</div>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="text-light-4 text-sm">No Tunisia data available</span>
                        </div>
                      )}
                    </div>

                    {/* System Status Summary */}
                    <div className="bg-dark-2 rounded-lg border border-dark-4 p-6">
                      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Server className="w-5 h-5 text-primary-500" />
                        System Status
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-light-3">Source:</span>
                          <span className="text-white">{apiInfo?.source || 'Loading...'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-3">Mode:</span>
                          <span className={`${isAutoMode ? 'text-blue-400' : 'text-orange-400'}`}>
                            {isAutoMode ? 'Auto J-1' : 'Manual'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-3">Date:</span>
                          <span className="text-white">{selectedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-light-3">Cache:</span>
                          <span className={`${cacheStatus?.cache_enabled ? 'text-green-400' : 'text-red-400'}`}>
                            {cacheStatus?.cache_enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        {systemInfo && (
                          <div className="flex justify-between">
                            <span className="text-light-3">Temp Files:</span>
                            <span className="text-white">
                              {systemInfo.system.temp_files_count + systemInfo.system.current_dir_nc_files}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'parameters' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {selectedParams.map(paramKey => {
                    const config = parameterConfig[paramKey as keyof typeof parameterConfig];
                    const paramData = individualData[paramKey];
                    
                    if (!config) return null;
                    
                    return (
                      <div key={paramKey} className="bg-dark-2 rounded-lg border border-dark-4 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <config.icon className="w-6 h-6" style={{ color: config.color }} />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{config.label}</h3>
                            <p className="text-sm text-light-3">{config.description}</p>
                          </div>
                          {getDataSourceBadge(paramData?.metadata?.source || '')}
                        </div>
                        
                        {paramData?.data && paramData.data.length > 0 ? (
                          <div className="space-y-3">
                            {paramData.data.map((point: TunisiaDataPoint, index: number) => {
                              let displayValue = '';
                              
                              if (point.value !== undefined) {
                                displayValue = `${point.value.toFixed(3)} ${config.unit}`;
                              } else if (point.speed !== undefined) {
                                displayValue = `${point.speed.toFixed(3)} ${config.unit}`;
                              }
                              
                              return (
                                <div key={index} className="flex items-center justify-between py-2 border-b border-dark-4 last:border-b-0">
                                  <div>
                                    <div className="text-sm text-white">{point.location_name}</div>
                                    <div className="text-xs text-light-3">
                                      {point.latitude.toFixed(3)}°, {point.longitude.toFixed(3)}°
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-white">{displayValue}</div>
                                    {point.direction !== undefined && (
                                      <div className="text-xs text-light-3">
                                        Direction: {point.direction.toFixed(0)}°
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-light-4">
                            No Tunisia data available for this parameter
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'locations' && (
                <div className="bg-dark-2 rounded-lg border border-dark-4 p-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary-500" />
                    Tunisia Coastal Locations ({oceanData.length} measurements)
                    {apiInfo?.is_yesterday && (
                      <span className="text-sm font-normal text-blue-400 ml-2">(Yesterday J-1)</span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {oceanData.map((point) => renderLocationCard(point))}
                  </div>
                  
                  {oceanData.length === 0 && (
                    <div className="text-center py-12">
                      <MapPin className="w-12 h-12 text-light-4 mx-auto mb-3" />
                      <p className="text-light-3">No Tunisia coastal data available</p>
                      <p className="text-light-4 text-sm mt-2">
                        {isAutoMode 
                          ? 'Try refreshing or switching to manual mode' 
                          : 'Try selecting different parameters or date'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'system' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* System Information */}
                  <div className="bg-dark-2 rounded-lg border border-dark-4 p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Server className="w-6 h-6 text-primary-500" />
                      System Information
                    </h3>
                    
                    {systemInfo ? (
                      <div className="space-y-6">
                        {/* Mode Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-dark-3 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-blue-400" />
                              <span className="font-medium text-white">Auto Mode</span>
                            </div>
                            <div className="text-lg font-bold text-blue-400">
                              {systemInfo.system.auto_mode}
                            </div>
                            <div className="text-xs text-light-3">Yesterday: {systemInfo.system.yesterday_date}</div>
                          </div>

                          <div className="bg-dark-3 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Trash2 className="w-5 h-5 text-green-400" />
                              <span className="font-medium text-white">Auto Cleanup</span>
                            </div>
                            <div className={`text-lg font-bold ${systemInfo.system.auto_cleanup ? 'text-green-400' : 'text-red-400'}`}>
                              {systemInfo.system.auto_cleanup ? 'Enabled' : 'Disabled'}
                            </div>
                            <div className="text-xs text-light-3">Files auto-deleted after storage</div>
                          </div>
                        </div>

                        {/* File Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-dark-3 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="w-5 h-5 text-orange-400" />
                              <span className="font-medium text-white">Temp Files</span>
                            </div>
                            <div className="text-lg font-bold text-orange-400">
                              {systemInfo.system.temp_files_count}
                            </div>
                            <div className="text-xs text-light-3">In temp directory</div>
                          </div>

                          <div className="bg-dark-3 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="w-5 h-5 text-purple-400" />
                              <span className="font-medium text-white">NC Files</span>
                            </div>
                            <div className="text-lg font-bold text-purple-400">
                              {systemInfo.system.current_dir_nc_files}
                            </div>
                            <div className="text-xs text-light-3">In current directory</div>
                          </div>
                        </div>

                        {/* Authentication Status */}
                        <div className="bg-dark-3 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-3">Authentication & Cache</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-light-3">Copernicus:</span>
                              <div className={`font-medium ${systemInfo.system.authenticated ? 'text-green-400' : 'text-red-400'}`}>
                                {systemInfo.system.authenticated ? 'Authenticated' : 'Not Authenticated'}
                              </div>
                            </div>
                            <div>
                              <span className="text-light-3">Supabase:</span>
                              <div className={`font-medium ${systemInfo.system.cache_enabled ? 'text-green-400' : 'text-red-400'}`}>
                                {systemInfo.system.cache_enabled ? 'Connected' : 'Disconnected'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="bg-dark-3 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-3">Active Features</h4>
                          <div className="space-y-2">
                            {systemInfo.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-light-3">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Server className="w-12 h-12 text-light-4 mx-auto mb-3" />
                        <p className="text-light-3">Loading system information...</p>
                      </div>
                    )}
                  </div>

                  {/* Cache Management */}
                  <div className="bg-dark-2 rounded-lg border border-dark-4 p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Database className="w-6 h-6 text-primary-500" />
                      Cache Management
                    </h3>
                    
                    {cacheStatus ? (
                      <div className="space-y-6">
                        {/* Cache Status Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-dark-3 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {cacheStatus.cache_enabled ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                              <span className="font-medium text-white">Cache Status</span>
                            </div>
                            <div className={`text-lg font-bold ${cacheStatus.cache_enabled ? 'text-green-400' : 'text-red-400'}`}>
                              {cacheStatus.cache_enabled ? 'Active' : 'Disabled'}
                            </div>
                            {cacheStatus.error && (
                              <div className="text-xs text-red-400 mt-1">{cacheStatus.error}</div>
                            )}
                          </div>

                          <div className="bg-dark-3 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="w-5 h-5 text-blue-400" />
                              <span className="font-medium text-white">Total Points</span>
                            </div>
                            <div className="text-lg font-bold text-blue-400">
                              {cacheStatus.total_cached_points || 0}
                            </div>
                            <div className="text-xs text-light-3">Cached measurements</div>
                          </div>
                        </div>

                        {/* Cache Statistics by Parameter */}
                        {cacheStatus.cache_enabled && cacheStatus.cache_stats && (
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-4">
                              Cache by Parameter
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {Object.entries(cacheStatus.cache_stats).map(([param, count]) => {
                                const config = parameterConfig[param as keyof typeof parameterConfig];
                                if (!config) return null;

                                return (
                                  <div key={param} className="bg-dark-3 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <config.icon 
                                          className="w-5 h-5" 
                                          style={{ color: config.color }} 
                                        />
                                        <span className="font-medium text-white">{config.label}</span>
                                      </div>
                                      <span className="text-white font-bold">{count}</span>
                                    </div>
                                    <div className="w-full bg-dark-4 rounded-full h-2 mt-2">
                                      <div 
                                        className="h-2 rounded-full"
                                        style={{ 
                                          width: `${Math.min(100, (count / 30) * 100)}%`,
                                          backgroundColor: config.color 
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Auto Mode Information */}
                        <div className="bg-dark-3 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-3">Auto Mode Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-light-3">Mode:</span>
                              <span className="text-blue-400">{cacheStatus.auto_mode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-light-3">Yesterday Date:</span>
                              <span className="text-white">{cacheStatus.yesterday_date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-light-3">Auto Cleanup:</span>
                              <span className={`${cacheStatus.auto_cleanup ? 'text-green-400' : 'text-red-400'}`}>
                                {cacheStatus.auto_cleanup ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cache Benefits */}
                        <div className="bg-dark-3 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            System Benefits
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-medium text-green-400 mb-2">✅ Auto J-1 Mode</h5>
                              <ul className="space-y-1 text-sm text-light-3">
                                <li>• Automatic yesterday data fetching</li>
                                <li>• No manual date selection needed</li>
                                <li>• Always fresh J-1 oceanographic data</li>
                                <li>• Intelligent cache checking</li>
                                <li>• Seamless user experience</li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-blue-400 mb-2">🗑️ Auto Cleanup</h5>
                              <ul className="space-y-1 text-sm text-light-3">
                                <li>• Automatic file deletion after storage</li>
                                <li>• No disk space accumulation</li>
                                <li>• Clean temporary directories</li>
                                <li>• Efficient resource management</li>
                                <li>• Manual cleanup also available</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Database className="w-12 h-12 text-light-4 mx-auto mb-3" />
                        <p className="text-light-3">Loading cache information...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TunisiaDashboard;