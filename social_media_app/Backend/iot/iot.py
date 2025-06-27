from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import logging
import io
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime, timezone
import requests
import os
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Supabase configuration
SUPABASE_URL = 'https://bbcgcqauabclojpkdman.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiY2djcWF1YWJjbG9qcGtkbWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg4NzYsImV4cCI6MjA2NTMyNDg3Nn0.a8OKv2h9QkQ8BY26BYakLSgR77LMbY4MmrVAx_WwD6g'

# Store latest thermal data globally
latest_thermal_data = None

def store_in_supabase(record):
    """Store sensor data in Supabase with your exact table structure"""
    try:
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        # Log what we're about to insert
        logger.info(f"💾 Storing record with {len(record)} fields")
        for key, value in record.items():
            if key == 'raw_data':
                logger.info(f"  {key}: [ChirpStack data object]")
            elif key == 'thermal_pixels' and value:
                logger.info(f"  {key}: [Array of {len(value)} pixels]")
            else:
                logger.info(f"  {key}: {value}")
        
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/sensor_readings',
            headers=headers,
            json=record
        )
        
        if response.status_code in [200, 201]:
            logger.info(f"✅ Data stored successfully in Supabase")
            return True
        else:
            logger.error(f"❌ Supabase error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Failed to store data: {e}")
        return False

def process_chirpstack_data(data):
    """Process ChirpStack webhook data based on your C code and table structure"""
    try:
        obj = data.get('object', {})
        device_info = data.get('deviceInfo', {})
        rx_info = data.get('rxInfo', [])
        
        logger.info(f"🔍 Processing data from device: {device_info.get('deviceName', 'Unknown')}")
        
        # Log available data for debugging
        if 'analogInput' in obj:
            logger.info(f"📊 analogInput: {obj['analogInput']}")
        if 'temperatureSensor' in obj:
            logger.info(f"📊 temperatureSensor: {obj['temperatureSensor']}")
        if 'barometer' in obj:
            logger.info(f"📊 barometer: {obj['barometer']}")
        if 'humiditySensor' in obj:
            logger.info(f"📊 humiditySensor: {obj['humiditySensor']}")

        # Based on your C code channel mapping:
        
        # Environmental sensors
        temperature = obj.get('temperatureSensor', {}).get('2')  # Channel 2: Ambient temperature
        pressure = obj.get('barometer', {}).get('1')             # Channel 1: Barometric pressure  
        humidity = obj.get('humiditySensor', {}).get('3')        # Channel 3: Humidity

        # Water quality sensors from analogInput
        ph_value = obj.get('analogInput', {}).get('5')           # Channel 5: pH value
        tds_value = obj.get('analogInput', {}).get('6')          # Channel 6: TDS value
        
        # Water temperature from temperatureSensor (Channel 4 from your C code)
        water_temp_raw = obj.get('temperatureSensor', {}).get('4')
        water_temp = water_temp_raw / 10.0 if water_temp_raw else None
        
        # Turbidity from analogInput (Channel 7 might be turbidity based on your C code)
        # Note: Your C code shows channel 7 could be turbidity, but your data shows GPS coordinates
        # We'll check both possibilities
        potential_turbidity = obj.get('analogInput', {}).get('7')
        
        # GPS coordinates from analogInput
        # If channel 7 is turbidity, GPS might be in channels 8-9
        gps_latitude = obj.get('analogInput', {}).get('8')       # Channel 8: Latitude 
        gps_longitude = obj.get('analogInput', {}).get('9')      # Channel 9: Longitude
        
        # If no GPS in 8-9, then 7-8 might be GPS coordinates
        if gps_latitude is None and gps_longitude is None:
            gps_latitude = obj.get('analogInput', {}).get('7')   # Channel 7: Latitude
            gps_longitude = obj.get('analogInput', {}).get('8')  # Channel 8: Longitude
            potential_turbidity = None  # Then channel 7 is not turbidity

        # Water quality classification from digitalInput
        water_quality_code = None
        digital_input = obj.get('digitalInput', {})
        
        # Check channels 9 and 18 for water quality code
        for channel in ['9', '18']:
            if channel in digital_input:
                water_quality_code = int(digital_input[channel])
                logger.info(f"🏷️ Found water quality code: {water_quality_code} in channel {channel}")
                break

        # Thermal sensors from temperatureSensor (channels 10-12)
        thermal_min_raw = obj.get('temperatureSensor', {}).get('10')
        thermal_max_raw = obj.get('temperatureSensor', {}).get('11') 
        thermal_avg_raw = obj.get('temperatureSensor', {}).get('12')

        # Apply scaling: Your C code does (value + 100.0f) * 10.0f, so reverse: (value / 10.0f) - 100.0f
        thermal_min = (thermal_min_raw / 10.0) - 100.0 if thermal_min_raw else None
        thermal_max = (thermal_max_raw / 10.0) - 100.0 if thermal_max_raw else None
        thermal_avg = (thermal_avg_raw / 10.0) - 100.0 if thermal_avg_raw else None

        # Extract thermal pixel array from digitalInput (channels 30-93)
        thermal_pixels = []
        if digital_input:
            logger.info(f"🌡️ Processing thermal pixels...")
            for i in range(64):  # 8x8 = 64 pixels
                channel = str(30 + i)
                if channel in digital_input:
                    pixel_value = digital_input[channel]
                    # Convert back to temperature: reverse of (temp + 20.0) * 2.55
                    temp = (pixel_value / 2.55) - 20.0
                    thermal_pixels.append(temp)
            
            logger.info(f"🌡️ Extracted {len(thermal_pixels)} thermal pixels")
            
            # Pad to 64 pixels if needed
            while len(thermal_pixels) < 64:
                thermal_pixels.append(thermal_pixels[-1] if thermal_pixels else 25.0)
            
            # Store globally for thermal image generation
            global latest_thermal_data
            if len(thermal_pixels) >= 60:
                latest_thermal_data = thermal_pixels[:64]

        # LoRaWAN metadata
        rssi = rx_info[0]['rssi'] if rx_info else None
        snr = rx_info[0]['snr'] if rx_info else None

        # Sensor status determination (boolean values for your table)
        ph_sensor_status = ph_value is not None  # True if active, False if inactive
        tds_sensor_status = tds_value is not None  # True if active, False if inactive

        # Create record matching your EXACT Supabase table structure
        # Note: Excluding water_temp and turbidity since they don't exist in your table
        processed = {
            # Required fields
            'device_eui': device_info.get('devEui', 'unknown'),
            'device_name': device_info.get('deviceName', 'Unknown Device'),
            'timestamp': data.get('time', datetime.now(timezone.utc).isoformat()),
            'raw_data': data,  # REQUIRED: Store complete ChirpStack data
            
            # Environmental sensors
            'temperature': float(temperature) if temperature is not None else None,
            'pressure': float(pressure) if pressure is not None else None,
            'humidity': float(humidity) if humidity is not None else None,
            
            # Water quality sensors (only fields that exist in your table)
            'ph_value': float(ph_value) if ph_value is not None else None,
            'tds_value': float(tds_value) if tds_value is not None else None,
            'water_quality_code': water_quality_code,
            
            # Sensor status (your extra columns)
            'ph_sensor_status': ph_sensor_status,
            'tds_sensor_status': tds_sensor_status,
            
            # GPS coordinates
            'gps_latitude': float(gps_latitude) if gps_latitude is not None else None,
            'gps_longitude': float(gps_longitude) if gps_longitude is not None else None,
            
            # Thermal data
            'thermal_min': thermal_min,
            'thermal_max': thermal_max,
            'thermal_avg': thermal_avg,
            'thermal_pixels': thermal_pixels if thermal_pixels else None,
            
            # LoRaWAN metadata
            'rssi': int(rssi) if rssi is not None else None,
            'snr': float(snr) if snr is not None else None,
            'f_cnt': int(data.get('fCnt')) if data.get('fCnt') is not None else None
        }

        # Log what we found (including data we can't store due to missing columns)
        log_message = f"✅ Processed data: temp={processed['temperature']}, ph={processed['ph_value']}, tds={processed['tds_value']}, thermal_pixels={len(thermal_pixels) if thermal_pixels else 0}"
        
        if water_temp:
            log_message += f", water_temp={water_temp:.1f} (COLUMN MISSING)"
        if potential_turbidity:
            log_message += f", turbidity={potential_turbidity:.1f} (COLUMN MISSING)"
            
        logger.info(log_message)
        
        return processed
        
    except Exception as e:
        logger.error(f"❌ Error processing ChirpStack data: {e}")
        import traceback
        traceback.print_exc()
        return None

@app.route('/webhook', methods=['POST'])
def webhook():
    """ChirpStack webhook endpoint"""
    try:
        data = request.get_json()
        logger.info(f"📡 Received webhook from ChirpStack")
        
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        # Process the ChirpStack data
        processed_data = process_chirpstack_data(data)
        
        if not processed_data:
            return jsonify({'error': 'Failed to process data'}), 400
        
        # Store in Supabase
        if store_in_supabase(processed_data):
            return jsonify({
                'status': 'success',
                'message': 'Data processed and stored successfully',
                'device': processed_data['device_name'],
                'timestamp': processed_data['timestamp']
            }), 200
        else:
            return jsonify({'error': 'Failed to store data in Supabase'}), 500
            
    except Exception as e:
        logger.error(f"❌ Webhook error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/sensor-data', methods=['GET'])
def get_sensor_data():
    """Get latest sensor data from Supabase"""
    try:
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        }
        
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=timestamp.desc&limit=1',
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"📊 Retrieved {len(data)} records from Supabase")
            return jsonify(data), 200
        else:
            logger.error(f"❌ Supabase query error: {response.status_code}")
            return jsonify({'error': 'Database query failed'}), 500
            
    except Exception as e:
        logger.error(f"❌ API error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/thermal-image')
def thermal_image():
    """Generate thermal image from latest thermal data"""
    try:
        global latest_thermal_data
        
        if not latest_thermal_data or len(latest_thermal_data) != 64:
            # Generate dummy thermal data for testing
            logger.warning("⚠️ No thermal data available, generating dummy data")
            latest_thermal_data = [25 + np.random.random() * 10 for _ in range(64)]
        
        # Reshape to 8x8 grid
        thermal_array = np.array(latest_thermal_data).reshape(8, 8)
        
        # Create interpolated image for better visualization
        from scipy.interpolate import griddata
        
        # Original 8x8 coordinates
        x_orig, y_orig = np.meshgrid(np.arange(8), np.arange(8))
        points = np.column_stack((x_orig.ravel(), y_orig.ravel()))
        values = thermal_array.ravel()
        
        # High resolution grid (64x64)
        x_new, y_new = np.meshgrid(np.linspace(0, 7, 64), np.linspace(0, 7, 64))
        
        # Interpolate
        interpolated = griddata(points, values, (x_new, y_new), method='cubic', fill_value=np.mean(values))
        
        # Create figure
        plt.figure(figsize=(8, 8), dpi=100)
        plt.imshow(interpolated, cmap='inferno', interpolation='bilinear')
        plt.colorbar(label='Temperature (°C)', shrink=0.8)
        plt.title(f'AMG8833 Thermal Camera\n{datetime.now(timezone.utc).strftime("%H:%M:%S UTC")}', fontsize=14)
        plt.xlabel('X Position')
        plt.ylabel('Y Position')
        plt.tight_layout()
        
        # Save to BytesIO
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100)
        img_buffer.seek(0)
        plt.close()  # Important: close the figure to free memory
        
        return send_file(img_buffer, mimetype='image/png')
        
    except Exception as e:
        logger.error(f"❌ Thermal image error: {e}")
        
        # Return a simple error image
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.text(0.5, 0.5, 'No Thermal Data\nAvailable', 
                ha='center', va='center', fontsize=16, 
                bbox=dict(boxstyle="round,pad=0.5", facecolor="lightgray"))
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        ax.set_title('AMG8833 Thermal Camera', fontsize=14)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', bbox_inches='tight')
        img_buffer.seek(0)
        plt.close()
        
        return send_file(img_buffer, mimetype='image/png')

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'thermal_data_available': latest_thermal_data is not None,
        'thermal_pixels_count': len(latest_thermal_data) if latest_thermal_data else 0,
        'version': '2.0.0',
        'service': 'IoT Dashboard Backend (Custom for Supabase)'
    }), 200

@app.route('/test')
def test():
    """Simple test endpoint"""
    return jsonify({
        'message': 'Flask server is running!',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'status': 'OK',
        'supabase_url': SUPABASE_URL
    }), 200

@app.route('/debug/table-info')
def debug_table_info():
    """Debug endpoint to check Supabase table structure"""
    try:
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        }
        
        # Get table info by trying to fetch one record
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/sensor_readings?select=*&limit=1',
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'status': 'success',
                'records_found': len(data),
                'sample_record': data[0] if data else None,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'status_code': response.status_code,
                'error': response.text,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }), response.status_code
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/debug/test-minimal-insert')
def debug_test_minimal_insert():
    """Test minimal insert with required fields only"""
    try:
        test_record = {
            'device_eui': 'debug_test_device',
            'device_name': 'Debug Test Device',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'raw_data': {'test': 'minimal_insert', 'debug': True},
            'temperature': 25.0,
            'rssi': -65
        }
        
        if store_in_supabase(test_record):
            return jsonify({
                'status': 'success',
                'message': 'Minimal insert successful',
                'test_record': test_record,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Insert failed',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }), 500
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/')
def index():
    """Basic info endpoint"""
    return jsonify({
        'service': 'IoT Dashboard Backend',
        'version': '2.0.0',
        'description': 'Custom Flask server for Supabase sensor_readings table',
        'status': 'running',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'endpoints': {
            'webhook': '/webhook (POST) - ChirpStack webhook',
            'sensor_data': '/api/sensor-data (GET) - Latest sensor data',
            'thermal_image': '/thermal-image (GET) - Thermal camera image',
            'health': '/health (GET) - Health check',
            'test': '/test (GET) - Simple test',
            'debug_table': '/debug/table-info (GET) - Table structure',
            'debug_insert': '/debug/test-minimal-insert (GET) - Test insert'
        },
        'table_structure': {
            'matched_columns': [
                'device_eui', 'device_name', 'timestamp', 'raw_data',
                'temperature', 'pressure', 'humidity', 'ph_value', 'tds_value',
                'gps_latitude', 'gps_longitude', 'thermal_min', 'thermal_max',
                'thermal_avg', 'thermal_pixels', 'rssi', 'snr', 'f_cnt'
            ],
            'extra_columns': [
                'id', 'ph_sensor_status', 'tds_sensor_status', 
                'water_quality_code', 'created_at'
            ]
        }
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Custom IoT Dashboard Flask Server...")
    logger.info(f"📡 Webhook URL: http://localhost:5000/webhook")
    logger.info(f"🌡️ Thermal image URL: http://localhost:5000/thermal-image")
    logger.info(f"🔍 Debug URLs:")
    logger.info(f"  - Health: http://localhost:5000/health")
    logger.info(f"  - Test: http://localhost:5000/test")
    logger.info(f"  - Table info: http://localhost:5000/debug/table-info")
    logger.info(f"  - Test insert: http://localhost:5000/debug/test-minimal-insert")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)