# app.py - Tunisia Ocean API with Auto Yesterday Data (J-1) and File Cleanup
from flask import Flask, jsonify, request
from flask_cors import CORS
import copernicusmarine
import xarray as xr
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import tempfile
import os
import subprocess
from typing import Dict, List, Any, Optional
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import math
import shutil
import glob

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TunisiaOceanAPI:
    """Tunisia Ocean API with auto yesterday data (J-1) and file cleanup"""
    
    # Tunisia-specific geographic bounds
    TUNISIA_BOUNDS = {
        'minimum_longitude': 8.0,
        'maximum_longitude': 12.5,
        'minimum_latitude': 30.0,
        'maximum_latitude': 38.5
    }
    
    # Real Copernicus Marine datasets for Tunisia region
    DATASETS = {
        'sea_surface_temperature': {
            'id': 'cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m',
            'variables': ['thetao'],
            'depth_range': (0.49402499198913574, 0.49402499198913574),
            'unit': '°C',
            'name': 'Sea Surface Temperature',
            'color': '#EF4444',
            'description': 'Mediterranean sea surface temperature around Tunisia'
        },
        'chlorophyll': {
            'id': 'cmems_mod_glo_bgc-pft_anfc_0.25deg_P1D-m',
            'variables': ['chl'],
            'depth_range': (0.4940253794193268, 0.4940253794193268),
            'unit': 'mg/m³',
            'name': 'Chlorophyll-a',
            'color': '#10B981',
            'description': 'Phytoplankton concentration in Tunisian waters'
        },
        'salinity': {
            'id': 'cmems_obs-mob_glo_phy-sss_mynrt_smos-asc_P1D',
            'variables': ['Sea_Surface_Salinity'],
            'depth_range': None,
            'unit': 'PSU',
            'name': 'Sea Surface Salinity',
            'color': '#3B82F6',
            'description': 'Salt concentration in Mediterranean (Tunisia region)'
        },
        'ocean_currents': {
            'id': 'cmems_mod_glo_phy_anfc_merged-uv_PT1H-i',
            'variables': ['uo', 'vo'],
            'depth_range': (0.49402499198913574, 0.49402499198913574),
            'unit': 'm/s',
            'name': 'Ocean Currents',
            'color': '#8B5CF6',
            'description': 'Water circulation around Tunisia coast'
        }
    }
    
    # Tunisia coastal cities and measurement points
    TUNISIA_LOCATIONS = [
        {"name": "Tunis Bay", "city": "Tunis", "lat": 36.8190, "lng": 10.1658},
        {"name": "Bizerte Harbor", "city": "Bizerte", "lat": 37.2744, "lng": 9.8739},
        {"name": "Sfax Coast", "city": "Sfax", "lat": 34.7398, "lng": 10.7982},
        {"name": "Sousse Beach", "city": "Sousse", "lat": 35.8256, "lng": 10.6411},
        {"name": "Monastir Bay", "city": "Monastir", "lat": 35.7643, "lng": 10.8113},
        {"name": "Gabes Gulf", "city": "Gabes", "lat": 33.8815, "lng": 10.0982},
        {"name": "Mahdia Coast", "city": "Mahdia", "lat": 35.5047, "lng": 11.0624},
        {"name": "Hammamet Bay", "city": "Hammamet", "lat": 36.4000, "lng": 10.6167},
        {"name": "Kelibia Peninsula", "city": "Kelibia", "lat": 36.8469, "lng": 11.0936},
        {"name": "Zarzis Coast", "city": "Zarzis", "lat": 33.5000, "lng": 11.1167},
        {"name": "La Goulette Port", "city": "Tunis", "lat": 36.8189, "lng": 10.3050},
        {"name": "Nabeul Coast", "city": "Nabeul", "lat": 36.4561, "lng": 10.7376}
    ]
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.username = os.getenv('COPERNICUS_USERNAME')
        self.password = os.getenv('COPERNICUS_PASSWORD')
        self.authenticated = False
        self.use_mock_data = True
        
        # Supabase connection
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("❌ Supabase credentials missing!")
            self.supabase = None
        else:
            self.supabase: Client = create_client(supabase_url, supabase_key)
            logger.info("✅ Connected to Supabase")
        
        if not self.username or not self.password:
            logger.warning("⚠️ Copernicus credentials not found - using mock data")
            self.use_mock_data = True
        else:
            logger.info(f"✅ Credentials loaded for: {self.username}")
            self._authenticate()
    
    def get_yesterday_date(self) -> str:
        """Get yesterday's date in YYYY-MM-DD format (J-1)"""
        yesterday = datetime.now() - timedelta(days=1)
        return yesterday.strftime('%Y-%m-%d')
    
    def cleanup_temp_files(self):
        """Clean up all temporary NetCDF files from PC"""
        try:
            # Clean up temp directory
            temp_files = glob.glob(os.path.join(self.temp_dir, "*.nc"))
            for file_path in temp_files:
                try:
                    os.remove(file_path)
                    logger.info(f"🗑️ Deleted: {os.path.basename(file_path)}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not delete {file_path}: {e}")
            
            # Also clean any .nc files in current directory
            current_dir_files = glob.glob("*.nc")
            for file_path in current_dir_files:
                try:
                    os.remove(file_path)
                    logger.info(f"🗑️ Deleted from current dir: {file_path}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not delete {file_path}: {e}")
            
            logger.info("✅ File cleanup completed")
            
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {e}")
    
    def _authenticate(self):
        """Authenticate with Copernicus Marine Service"""
        try:
            logger.info("🔐 Authenticating with Copernicus Marine Service...")
            
            # Set environment variables for authentication
            os.environ['COPERNICUSMARINE_SERVICE_USERNAME'] = self.username
            os.environ['COPERNICUSMARINE_SERVICE_PASSWORD'] = self.password
            
            # Test authentication by describing a dataset
            logger.info("🧪 Testing dataset access...")
            result = copernicusmarine.describe(dataset_id='cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m')
            
            logger.info("✅ Authentication successful!")
            self.authenticated = True
            self.use_mock_data = False
            return True
            
        except Exception as e:
            logger.error(f"❌ Authentication failed: {e}")
            self.use_mock_data = True
            return False
    
    def check_cache(self, parameter: str, date: str) -> Optional[List[Dict]]:
        """Check if data exists in Supabase cache"""
        if not self.supabase:
            return None
            
        try:
            logger.info(f"🔍 Checking cache for {parameter} on {date}")
            
            response = self.supabase.table('oceanographic_data').select('*').eq(
                'parameter_type', parameter
            ).eq('date', date).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"✅ Found {len(response.data)} cached points for {parameter}")
                return response.data
            else:
                logger.info(f"❌ No cache found for {parameter} on {date}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Cache check error: {e}")
            return None
    
    def store_in_cache(self, parameter: str, date: str, data: List[Dict]) -> bool:
        """Store data in Supabase cache and cleanup files"""
        if not self.supabase or not data:
            return False
            
        try:
            logger.info(f"💾 Storing {len(data)} points in cache for {parameter}")
            
            # Prepare data for Supabase
            cache_data = []
            for point in data:
                cache_point = {
                    'parameter_type': parameter,
                    'date': date,
                    'latitude': point['latitude'],
                    'longitude': point['longitude'],
                    'location_name': point.get('location_name', 'Tunisia Coast'),
                    'value': point.get('value'),
                    'u_velocity': point.get('u_velocity'),
                    'v_velocity': point.get('v_velocity'),
                    'speed': point.get('speed'),
                    'direction': point.get('direction'),
                    'unit': self.DATASETS[parameter]['unit'],
                    'data_source': 'Copernicus Marine Service' if self.authenticated else 'Mock Data'
                }
                cache_data.append(cache_point)
            
            # Insert data with upsert to handle duplicates
            response = self.supabase.table('oceanographic_data').upsert(
                cache_data, 
                on_conflict='parameter_type,date,latitude,longitude'
            ).execute()
            
            logger.info(f"✅ Successfully cached {len(data)} points")
            
            # Cleanup files after successful storage
            self.cleanup_temp_files()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Cache storage error: {e}")
            # Still cleanup files even if caching failed
            self.cleanup_temp_files()
            return False
    
    def fetch_dataset(self, dataset_key: str, date: str = None) -> Dict[str, Any]:
        """Fetch a specific dataset from Copernicus or cache (defaults to yesterday J-1)"""
        
        # Use yesterday's date if no date specified
        if date is None:
            date = self.get_yesterday_date()
        
        logger.info(f"📅 Fetching data for date: {date} (J-1 auto mode)")
        
        # Check cache first
        cached_data = self.check_cache(dataset_key, date)
        if cached_data:
            formatted_data = self._format_cached_data(cached_data)
            return {
                'status': 'success_cached',
                'parameter': dataset_key,
                'data': formatted_data,
                'metadata': {
                    'source': 'Supabase Cache',
                    'parameter': self.DATASETS[dataset_key]['name'],
                    'unit': self.DATASETS[dataset_key]['unit'],
                    'points_count': len(formatted_data),
                    'region': 'Tunisia',
                    'date': date,
                    'is_yesterday': True
                }
            }
        
        # If no cache, fetch fresh data
        if self.use_mock_data or not self.authenticated:
            return self._generate_mock_data(dataset_key, date)
            
        try:
            dataset_config = self.DATASETS[dataset_key]
            
            logger.info(f"🌊 Fetching {dataset_config['name']} data from Copernicus for {date}")
            
            output_path = os.path.join(
                self.temp_dir, 
                f'tunisia_{dataset_key}_{date}_{int(datetime.now().timestamp())}.nc'
            )
            
            # Prepare subset parameters
            subset_params = {
                'dataset_id': dataset_config['id'],
                'variables': dataset_config['variables'],
                'minimum_longitude': self.TUNISIA_BOUNDS['minimum_longitude'],
                'maximum_longitude': self.TUNISIA_BOUNDS['maximum_longitude'],
                'minimum_latitude': self.TUNISIA_BOUNDS['minimum_latitude'],
                'maximum_latitude': self.TUNISIA_BOUNDS['maximum_latitude'],
                'start_datetime': f"{date}T00:00:00",
                'end_datetime': f"{date}T23:59:59",
                'output_filename': output_path
            }
            
            # Add depth range if specified
            if dataset_config['depth_range']:
                subset_params['minimum_depth'] = dataset_config['depth_range'][0]
                subset_params['maximum_depth'] = dataset_config['depth_range'][1]
            
            # Set environment variables (important!)
            os.environ['COPERNICUSMARINE_SERVICE_USERNAME'] = self.username
            os.environ['COPERNICUSMARINE_SERVICE_PASSWORD'] = self.password
            
            # Fetch data using copernicusmarine.subset
            logger.info("📡 Downloading data from Copernicus...")
            copernicusmarine.subset(**subset_params)
            
            # Process data
            if not os.path.exists(output_path):
                logger.error(f"❌ NetCDF file not created: {output_path}")
                # Cleanup and return mock data
                self.cleanup_temp_files()
                return self._generate_mock_data(dataset_key, date)
            
            ds = xr.open_dataset(output_path)
            processed_data = self._process_dataset(ds, dataset_key, dataset_config)
            
            ds.close()
            
            # Store in cache (this will also cleanup files)
            if processed_data:
                self.store_in_cache(dataset_key, date, processed_data)
            else:
                # Cleanup files if no data to store
                self.cleanup_temp_files()
                
            return {
                'status': 'success',
                'parameter': dataset_key,
                'data': processed_data,
                'metadata': {
                    'source': 'Copernicus Marine Service (Real Data)',
                    'dataset_id': dataset_config['id'],
                    'parameter': dataset_config['name'],
                    'unit': dataset_config['unit'],
                    'points_count': len(processed_data),
                    'date': date,
                    'region': 'Tunisia',
                    'is_yesterday': True,
                    'files_cleaned': True
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching {dataset_key}: {str(e)}")
            # Cleanup files on error
            self.cleanup_temp_files()
            return self._generate_mock_data(dataset_key, date)
    
    def _process_dataset(self, ds: xr.Dataset, dataset_key: str, config: Dict) -> List[Dict]:
        """Process xarray dataset into standardized format"""
        data_points = []
        
        try:
            # Get coordinates - handle different naming conventions
            if 'latitude' in ds.coords:
                lats = ds.latitude.values
            elif 'lat' in ds.coords:
                lats = ds.lat.values
            else:
                logger.error("❌ No latitude coordinate found")
                return []
            
            if 'longitude' in ds.coords:
                lons = ds.longitude.values
            elif 'lon' in ds.coords:
                lons = ds.lon.values
            else:
                logger.error("❌ No longitude coordinate found")
                return []
            
            times = pd.to_datetime(ds.time.values)
            
            # Sampling strategy - get reasonable number of points
            lat_step = max(1, len(lats) // 10)
            lon_step = max(1, len(lons) // 10)
            
            logger.info(f"Processing {dataset_key}: {len(lats)} lats, {len(lons)} lons, {len(times)} times")
            
            for i, time in enumerate(times):
                if i >= 1:  # Only process first time step
                    break
                    
                for lat_idx in range(0, len(lats), lat_step):
                    for lon_idx in range(0, len(lons), lon_step):
                        try:
                            lat_val = float(lats[lat_idx])
                            lon_val = float(lons[lon_idx])
                            
                            # Skip points outside Tunisia bounds
                            if (lat_val < self.TUNISIA_BOUNDS['minimum_latitude'] or 
                                lat_val > self.TUNISIA_BOUNDS['maximum_latitude'] or
                                lon_val < self.TUNISIA_BOUNDS['minimum_longitude'] or 
                                lon_val > self.TUNISIA_BOUNDS['maximum_longitude']):
                                continue
                            
                            # Find closest Tunisia location
                            closest_location = self._find_closest_location(lat_val, lon_val)
                            
                            point_data = {
                                'id': f"real_{dataset_key}_{lat_idx}_{lon_idx}_{i}",
                                'date': time.strftime('%Y-%m-%d'),
                                'latitude': lat_val,
                                'longitude': lon_val,
                                'parameter': dataset_key,
                                'location_name': closest_location['name']
                            }
                            
                            # Extract variable values based on dataset type
                            if dataset_key == 'ocean_currents':
                                # Handle U and V components
                                try:
                                    if 'depth' in ds.dims and config['depth_range']:
                                        u_val = float(ds.uo.isel(time=i, latitude=lat_idx, longitude=lon_idx, depth=0).values)
                                        v_val = float(ds.vo.isel(time=i, latitude=lat_idx, longitude=lon_idx, depth=0).values)
                                    else:
                                        u_val = float(ds.uo.isel(time=i, latitude=lat_idx, longitude=lon_idx).values)
                                        v_val = float(ds.vo.isel(time=i, latitude=lat_idx, longitude=lon_idx).values)
                                    
                                    if not (np.isnan(u_val) or np.isnan(v_val)):
                                        point_data.update({
                                            'u_velocity': round(u_val, 4),
                                            'v_velocity': round(v_val, 4),
                                            'speed': round(np.sqrt(u_val**2 + v_val**2), 4),
                                            'direction': round(np.degrees(np.arctan2(v_val, u_val)), 2)
                                        })
                                        data_points.append(point_data)
                                except Exception:
                                    continue
                            
                            else:
                                # Handle single variable datasets
                                var_name = config['variables'][0]
                                
                                try:
                                    if 'depth' in ds.dims and config['depth_range']:
                                        value = float(ds[var_name].isel(time=i, latitude=lat_idx, longitude=lon_idx, depth=0).values)
                                    else:
                                        value = float(ds[var_name].isel(time=i, latitude=lat_idx, longitude=lon_idx).values)
                                    
                                    if not np.isnan(value):
                                        point_data['value'] = round(value, 4)
                                        data_points.append(point_data)
                                except Exception:
                                    continue
                                    
                        except (IndexError, ValueError, KeyError):
                            continue
                            
        except Exception as e:
            logger.error(f"Error processing {dataset_key}: {e}")
            
        return data_points
    
    def _find_closest_location(self, lat: float, lon: float) -> Dict:
        """Find the closest Tunisia location to given coordinates"""
        min_distance = float('inf')
        closest_location = self.TUNISIA_LOCATIONS[0]
        
        for location in self.TUNISIA_LOCATIONS:
            distance = math.sqrt((lat - location['lat'])**2 + (lon - location['lng'])**2)
            if distance < min_distance:
                min_distance = distance
                closest_location = location
        
        return closest_location
    
    def _format_cached_data(self, cached_data: List[Dict]) -> List[Dict]:
        """Format cached data from Supabase"""
        formatted_data = []
        
        for point in cached_data:
            formatted_point = {
                'id': str(point['id']),
                'date': point['date'],
                'latitude': float(point['latitude']),
                'longitude': float(point['longitude']),
                'parameter': point['parameter_type'],
                'location_name': point.get('location_name', 'Tunisia Coast')
            }
            
            # Add parameter-specific fields
            if point.get('value') is not None:
                formatted_point['value'] = float(point['value'])
            if point.get('u_velocity') is not None:
                formatted_point['u_velocity'] = float(point['u_velocity'])
            if point.get('v_velocity') is not None:
                formatted_point['v_velocity'] = float(point['v_velocity'])
            if point.get('speed') is not None:
                formatted_point['speed'] = float(point['speed'])
            if point.get('direction') is not None:
                formatted_point['direction'] = float(point['direction'])
                
            formatted_data.append(formatted_point)
        
        return formatted_data
    
    def _generate_mock_data(self, dataset_key: str, date: str) -> Dict[str, Any]:
        """Generate mock data for testing"""
        config = self.DATASETS[dataset_key]
        mock_data = []
        
        for i, loc in enumerate(self.TUNISIA_LOCATIONS):
            point_data = {
                'id': f"mock_{dataset_key}_{i}",
                'date': date,
                'latitude': loc['lat'],
                'longitude': loc['lng'],
                'parameter': dataset_key,
                'location_name': loc['name']
            }
            
            # Generate appropriate mock values based on parameter
            if dataset_key == 'sea_surface_temperature':
                point_data['value'] = round(np.random.uniform(18, 26), 2)
            elif dataset_key == 'chlorophyll':
                point_data['value'] = round(np.random.uniform(0.5, 15), 3)
            elif dataset_key == 'salinity':
                point_data['value'] = round(np.random.uniform(35, 39), 2)
            elif dataset_key == 'ocean_currents':
                u_val = np.random.uniform(-0.5, 0.5)
                v_val = np.random.uniform(-0.5, 0.5)
                point_data.update({
                    'u_velocity': round(u_val, 4),
                    'v_velocity': round(v_val, 4),
                    'speed': round(np.sqrt(u_val**2 + v_val**2), 4),
                    'direction': round(np.degrees(np.arctan2(v_val, u_val)), 2)
                })
            else:
                point_data['value'] = round(np.random.uniform(0, 100), 2)
                
            mock_data.append(point_data)
        
        return {
            'status': 'success_mock',
            'parameter': dataset_key,
            'data': mock_data,
            'metadata': {
                'source': 'Mock Data (Demo Mode)',
                'parameter': config['name'],
                'unit': config['unit'],
                'points_count': len(mock_data),
                'date': date,
                'is_yesterday': True
            }
        }
    
    def get_comprehensive_data(self, date: str = None, parameters: List[str] = None) -> Dict[str, Any]:
        """Fetch comprehensive oceanographic data (defaults to yesterday J-1)"""
        try:
            # Use yesterday's date if no date specified
            if date is None:
                date = self.get_yesterday_date()
            
            parameters = parameters or list(self.DATASETS.keys())
            logger.info(f"🇹🇳 Fetching comprehensive Tunisia data for {date} (J-1): {', '.join(parameters)}")
            
            results = {}
            combined_data = []
            
            # Fetch each parameter
            for param in parameters:
                if param in self.DATASETS:
                    result = self.fetch_dataset(param, date)
                    results[param] = result
                    
                    # Add to combined dataset
                    for point in result.get('data', []):
                        combined_data.append(point)
            
            return {
                'status': 'success',
                'data': combined_data,
                'individual_parameters': results,
                'metadata': {
                    'source': 'Copernicus Marine Service' if self.authenticated else 'Mock Data',
                    'parameters': [self.DATASETS[p]['name'] for p in parameters],
                    'date': date,
                    'total_points': len(combined_data),
                    'authenticated': self.authenticated,
                    'region': 'Tunisia',
                    'cache_enabled': self.supabase is not None,
                    'is_yesterday': True,
                    'auto_cleanup': True
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error in comprehensive data fetch: {e}")
            # Cleanup files on error
            self.cleanup_temp_files()
            return {
                'status': 'error',
                'message': str(e),
                'data': []
            }

# Initialize API
tunisia_api = TunisiaOceanAPI()

# Flask Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    yesterday_date = tunisia_api.get_yesterday_date()
    return jsonify({
        'status': 'healthy',
        'service': 'Tunisia Ocean Monitoring API',
        'authenticated': tunisia_api.authenticated,
        'using_real_data': tunisia_api.authenticated and not tunisia_api.use_mock_data,
        'username': tunisia_api.username if tunisia_api.username else 'Not configured',
        'available_parameters': list(tunisia_api.DATASETS.keys()),
        'datasets_count': len(tunisia_api.DATASETS),
        'region': 'Tunisia Mediterranean',
        'supabase_connected': tunisia_api.supabase is not None,
        'auto_mode': 'Yesterday (J-1) data',
        'yesterday_date': yesterday_date,
        'auto_cleanup': True,
        'message': f'Ready for Tunisia oceanographic monitoring with auto J-1 data ({yesterday_date})!'
    })

@app.route('/api/tunisia-data', methods=['GET'])
def get_tunisia_data():
    """Get Tunisia data - defaults to yesterday (J-1) if no date specified"""
    try:
        # Get date from request or use yesterday
        start_date = request.args.get('start_date')
        if not start_date:
            start_date = tunisia_api.get_yesterday_date()
            logger.info(f"📅 No date specified, using yesterday: {start_date}")
        
        # Parameters
        parameters = request.args.get('parameters', '').split(',') if request.args.get('parameters') else None
        if parameters:
            parameters = [p.strip() for p in parameters if p.strip() in tunisia_api.DATASETS]
        
        logger.info(f"🇹🇳 Tunisia API request: {start_date} (J-1 mode), params: {parameters}")
        
        result = tunisia_api.get_comprehensive_data(start_date, parameters)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in Tunisia endpoint: {str(e)}")
        # Cleanup files on error
        tunisia_api.cleanup_temp_files()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/parameter/<parameter_name>', methods=['GET'])
def get_single_parameter(parameter_name):
    """Get single parameter - defaults to yesterday (J-1) if no date specified"""
    try:
        if parameter_name not in tunisia_api.DATASETS:
            return jsonify({
                'status': 'error', 
                'message': f'Parameter {parameter_name} not available',
                'available_parameters': list(tunisia_api.DATASETS.keys())
            }), 400
        
        # Get date from request or use yesterday
        date = request.args.get('date')
        if not date:
            date = tunisia_api.get_yesterday_date()
            logger.info(f"📅 No date specified, using yesterday: {date}")
        
        logger.info(f"🌊 Single parameter request: {parameter_name} for {date}")
        
        result = tunisia_api.fetch_dataset(parameter_name, date)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in parameter endpoint: {str(e)}")
        # Cleanup files on error
        tunisia_api.cleanup_temp_files()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/yesterday-data', methods=['GET'])
def get_yesterday_data():
    """Explicitly get yesterday's data (J-1) - NEW ENDPOINT"""
    try:
        yesterday = tunisia_api.get_yesterday_date()
        parameters = request.args.get('parameters', '').split(',') if request.args.get('parameters') else None
        
        if parameters:
            parameters = [p.strip() for p in parameters if p.strip() in tunisia_api.DATASETS]
        
        logger.info(f"🇹🇳 Explicit yesterday data request: {yesterday}, params: {parameters}")
        
        result = tunisia_api.get_comprehensive_data(yesterday, parameters)
        result['metadata']['explicit_yesterday'] = True
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in yesterday endpoint: {str(e)}")
        tunisia_api.cleanup_temp_files()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/test-copernicus', methods=['GET'])
def test_copernicus_connection():
    """Test Copernicus Marine Service connection"""
    try:
        if not tunisia_api.username or not tunisia_api.password:
            return jsonify({
                'status': 'error',
                'message': 'Copernicus credentials not configured',
                'authenticated': False
            })
        
        return jsonify({
            'status': 'success' if tunisia_api.authenticated else 'warning',
            'message': 'Copernicus connection successful' if tunisia_api.authenticated else 'Authentication failed',
            'authenticated': tunisia_api.authenticated,
            'username': tunisia_api.username,
            'can_fetch_real_data': tunisia_api.authenticated and not tunisia_api.use_mock_data,
            'auto_mode': 'Yesterday (J-1) data with cleanup',
            'yesterday_date': tunisia_api.get_yesterday_date()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'authenticated': False
        }), 500

@app.route('/api/clear-cache', methods=['POST'])
def clear_cache():
    """Clear all cached data"""
    try:
        if not tunisia_api.supabase:
            return jsonify({
                'status': 'error',
                'message': 'Supabase not connected'
            }), 500
        
        # Clear oceanographic data
        tunisia_api.supabase.table('oceanographic_data').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # Also cleanup any remaining temp files
        tunisia_api.cleanup_temp_files()
        
        logger.info("🗑️ Cache and temp files cleared successfully")
        
        return jsonify({
            'status': 'success',
            'message': 'Cache and temp files cleared successfully',
            'timestamp': datetime.now().isoformat(),
            'yesterday_date': tunisia_api.get_yesterday_date()
        })
        
    except Exception as e:
        logger.error(f"❌ Error clearing cache: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/cleanup-files', methods=['POST'])
def manual_cleanup():
    """Manually cleanup temporary files - NEW ENDPOINT"""
    try:
        tunisia_api.cleanup_temp_files()
        
        return jsonify({
            'status': 'success',
            'message': 'Temporary files cleaned up successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error in manual cleanup: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/locations', methods=['GET'])
def get_tunisia_locations():
    """Get all Tunisia coastal monitoring locations"""
    return jsonify({
        'status': 'success',
        'locations': tunisia_api.TUNISIA_LOCATIONS,
        'total_locations': len(tunisia_api.TUNISIA_LOCATIONS),
        'region': 'Tunisia Mediterranean Coast',
        'auto_mode': 'Yesterday (J-1) data',
        'yesterday_date': tunisia_api.get_yesterday_date()
    })

@app.route('/api/datasets', methods=['GET'])
def get_available_datasets():
    """Get information about all available datasets"""
    datasets_info = {}
    for key, config in tunisia_api.DATASETS.items():
        datasets_info[key] = {
            'name': config['name'],
            'description': config['description'],
            'unit': config['unit'],
            'color': config['color'],
            'variables': config['variables'],
            'has_depth': config['depth_range'] is not None
        }
    
    return jsonify({
        'status': 'success',
        'datasets': datasets_info,
        'total_count': len(datasets_info),
        'region': 'Tunisia',
        'auto_mode': 'Yesterday (J-1) data with cleanup',
        'yesterday_date': tunisia_api.get_yesterday_date()
    })

@app.route('/api/cache-status', methods=['GET'])
def get_cache_status():
    """Get cache system status"""
    try:
        if not tunisia_api.supabase:
            return jsonify({
                'cache_enabled': False, 
                'message': 'Supabase not connected',
                'auto_mode': 'Yesterday (J-1) data',
                'yesterday_date': tunisia_api.get_yesterday_date()
            })
        
        # Get cache stats
        response = tunisia_api.supabase.table('oceanographic_data').select('parameter_type', count='exact').execute()
        
        # Get cache stats by parameter
        cache_stats = {}
        for param in tunisia_api.DATASETS.keys():
            param_response = tunisia_api.supabase.table('oceanographic_data').select('date', count='exact').eq('parameter_type', param).execute()
            cache_stats[param] = len(param_response.data) if param_response.data else 0
        
        return jsonify({
            'cache_enabled': True,
            'supabase_connected': True,
            'total_cached_points': len(response.data) if response.data else 0,
            'cache_stats': cache_stats,
            'auto_mode': 'Yesterday (J-1) data with cleanup',
            'yesterday_date': tunisia_api.get_yesterday_date(),
            'auto_cleanup': True
        })
        
    except Exception as e:
        return jsonify({
            'cache_enabled': False,
            'error': str(e),
            'auto_mode': 'Yesterday (J-1) data',
            'yesterday_date': tunisia_api.get_yesterday_date()
        }), 500

@app.route('/api/system-info', methods=['GET'])
def get_system_info():
    """Get system information - NEW ENDPOINT"""
    try:
        yesterday = tunisia_api.get_yesterday_date()
        
        # Check temp directory
        temp_files = glob.glob(os.path.join(tunisia_api.temp_dir, "*.nc"))
        current_dir_files = glob.glob("*.nc")
        
        return jsonify({
            'status': 'success',
            'system': {
                'auto_mode': 'Yesterday (J-1) data',
                'yesterday_date': yesterday,
                'auto_cleanup': True,
                'temp_directory': tunisia_api.temp_dir,
                'temp_files_count': len(temp_files),
                'current_dir_nc_files': len(current_dir_files),
                'authenticated': tunisia_api.authenticated,
                'cache_enabled': tunisia_api.supabase is not None
            },
            'features': [
                'Automatic yesterday (J-1) data fetching',
                'Automatic file cleanup after storage',
                'Supabase caching system',
                'Tunisia coastal focus',
                'Real-time oceanographic data'
            ]
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found',
        'available_endpoints': [
            '/api/health',
            '/api/tunisia-data',
            '/api/yesterday-data (NEW)',
            '/api/parameter/<parameter_name>',
            '/api/locations',
            '/api/datasets',
            '/api/test-copernicus',
            '/api/clear-cache',
            '/api/cleanup-files (NEW)',
            '/api/cache-status',
            '/api/system-info (NEW)'
        ],
        'auto_mode': 'Yesterday (J-1) data with cleanup'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    # Cleanup files on server errors
    tunisia_api.cleanup_temp_files()
    return jsonify({
        'status': 'error',
        'message': 'Internal server error',
        'auto_cleanup': 'Files cleaned on error'
    }), 500

# CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# Cleanup function for graceful shutdown
def cleanup_on_exit():
    """Cleanup function called on application exit"""
    logger.info("🔄 Application shutdown - cleaning up temp files...")
    tunisia_api.cleanup_temp_files()

import atexit
atexit.register(cleanup_on_exit)

if __name__ == '__main__':
    yesterday_date = tunisia_api.get_yesterday_date()
    
    print("\n" + "="*60)
    print("🇹🇳 TUNISIA OCEAN MONITORING API SERVER")
    print("="*60)
    print(f"🌊 Region: Tunisia Mediterranean Coast")
    print(f"📍 Locations: {len(tunisia_api.TUNISIA_LOCATIONS)} coastal cities")
    print(f"📊 Parameters: {len(tunisia_api.DATASETS)} oceanographic datasets")
    print(f"🔐 Copernicus: {'✅ Authenticated' if tunisia_api.authenticated else '❌ Using Mock Data'}")
    print(f"💾 Supabase: {'✅ Connected' if tunisia_api.supabase else '❌ Not Connected'}")
    print(f"📅 Auto Mode: Yesterday (J-1) data - {yesterday_date}")
    print(f"🗑️ Auto Cleanup: ✅ Files deleted after storage")
    print(f"🚀 Server: Starting on http://localhost:3001")
    print("="*60)
    print(f"📝 New Features:")
    print(f"   • Automatic yesterday data fetching")
    print(f"   • Automatic file cleanup after storage")
    print(f"   • /api/yesterday-data endpoint")
    print(f"   • /api/cleanup-files endpoint")
    print(f"   • /api/system-info endpoint")
    print("="*60)
    
    logger.info("🚀 Starting Tunisia Ocean Monitoring API Server...")
    logger.info(f"🔐 Authentication status: {tunisia_api.authenticated}")
    logger.info(f"📊 Available datasets: {len(tunisia_api.DATASETS)}")
    logger.info(f"🇹🇳 Monitoring {len(tunisia_api.TUNISIA_LOCATIONS)} Tunisia locations")
    logger.info(f"📅 Auto mode: Yesterday (J-1) data - {yesterday_date}")
    logger.info(f"🗑️ Auto cleanup: Enabled")
    
    app.run(debug=True, host='0.0.0.0', port=3001)