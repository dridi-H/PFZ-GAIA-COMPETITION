# 🌊 Wita Backend - Flask API Services

<div align="center">

![Flask](https://img.shields.io/badge/Flask-3.0.0-000000.svg)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.0.0-3ECF8E.svg)
![Copernicus Marine](https://img.shields.io/badge/Copernicus-Marine-0066CC.svg)

[🏠 Back to Frontend](../README.md) | [🔧 Setup Guide](#-setup) | [📡 API Endpoints](#-api-endpoints) | [🌊 Ocean Data](#-ocean-data)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🔧 Setup](#-setup)
- [📡 API Endpoints](#-api-endpoints)
- [🌊 Ocean Data Integration](#-ocean-data-integration)
- [📊 IoT Services](#-iot-services)
- [🔄 Real-time Features](#-real-time-features)
- [📝 Configuration](#-configuration)

---

## 🌟 Overview

The Wita backend consists of two main Flask applications that handle different aspects of the marine ecosystem platform:

1. **Main API Server** (`app.py`) - Ocean data processing and Tunisia marine API
2. **IoT Service** (`iot/iot.py`) - IoT sensor data collection and thermal imaging

### Key Capabilities
- **Ocean Data Processing**: Real-time Mediterranean sea data from Copernicus Marine
- **IoT Integration**: Sensor data collection and storage
- **Thermal Imaging**: Advanced thermal data processing and visualization
- **Real-time Analytics**: Live data streaming to frontend dashboards
- **Geographic Analysis**: Tunisia-specific oceanographic data

---

## 🛠️ Tech Stack

### Core Technologies
- **[Flask 3.0.0](https://flask.palletsprojects.com/)** - Lightweight web framework
- **[Python 3.8+](https://python.org/)** - Core programming language
- **[Flask-CORS](https://flask-cors.readthedocs.io/)** - Cross-origin resource sharing

### Data Processing & Analysis
- **[Copernicus Marine](https://marine.copernicus.eu/)** - Satellite oceanographic data
- **[xarray](https://xarray.pydata.org/)** - Multi-dimensional data analysis
- **[pandas](https://pandas.pydata.org/)** - Data manipulation and analysis
- **[NumPy](https://numpy.org/)** - Numerical computing

### Database & Storage
- **[Supabase](https://supabase.io/)** - PostgreSQL database and real-time subscriptions
- **[python-dotenv](https://pypi.org/project/python-dotenv/)** - Environment variable management

### Visualization & Imaging
- **[Matplotlib](https://matplotlib.org/)** - Data visualization and thermal imaging
- **[Pillow (PIL)](https://pillow.readthedocs.io/)** - Image processing
- **[NetCDF4](https://unidata.github.io/netcdf4-python/)** - Scientific data formats

---

## 🏗️ Architecture

```
Backend/
├── app.py                     # Main Ocean API Server
├── iot/                       # IoT Services Module
│   ├── iot.py                 # IoT sensor processing
│   └── .env                   # IoT-specific environment
├── requirements.txt           # Python dependencies
└── .env                       # Main environment variables
```

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Main API      │    │ Copernicus      │
│   React App     │────│   Flask Server  │────│ Marine Service  │
│   Port: 5173    │    │   Port: 5000    │    │ External API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   IoT Service   │    │   Supabase      │
                       │   Flask Server  │────│   Database      │
                       │   Port: 5001    │    │   Real-time DB  │
                       └─────────────────┘    └─────────────────┘
```

---

## 🔧 Setup

### Prerequisites
- **Python 3.8+** with pip
- **Virtual environment** (recommended)
- **Supabase account** and project
- **Copernicus Marine account** (for ocean data)

### Installation

1. **Navigate to backend directory**:
   ```bash
   cd social_media_app/Backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create `.env` file in Backend directory:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Copernicus Marine (optional - for ocean data)
   COPERNICUS_USERNAME=your_username
   COPERNICUS_PASSWORD=your_password
   
   # API Configuration
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

5. **IoT Service Configuration**:
   Create `.env` file in `iot/` directory:
   ```env
   # Supabase Configuration (same as main)
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # ChirpStack Configuration (for LoRaWAN)
   CHIRPSTACK_API_URL=your_chirpstack_api_url
   CHIRPSTACK_API_KEY=your_api_key
   ```

6. **Start the services**:
   ```bash
   # Main API server
   python app.py
   
   # IoT service (in new terminal)
   cd iot
   python iot.py
   ```

### 🌐 Webhook Development with ngrok

For **IoT webhook integration** with external services like **ChirpStack**, you'll need to expose your local development server to the internet using **ngrok**.

#### ngrok Setup

1. **Install ngrok**:
   ```bash
   # Windows (using Chocolatey)
   choco install ngrok
   
   # macOS (using Homebrew)
   brew install ngrok/ngrok/ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Sign up and get auth token**:
   - Create account at [ngrok.com](https://ngrok.com)
   - Get your auth token from dashboard
   - Configure ngrok:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

3. **Expose IoT service** (runs on port 5001):
   ```bash
   ngrok http 5001
   ```

4. **Configure ChirpStack webhook**:
   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - In ChirpStack console, set webhook URL to: `https://abc123.ngrok.io/webhook`

5. **Test webhook** with curl:
   ```bash
   curl -X POST https://your-ngrok-url.ngrok.io/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "deviceName": "test-device",
       "data": "SGVsbG8gV29ybGQ=",
       "fPort": 1
     }'
   ```

#### Production Webhook Setup
For production, use a **static domain** or **cloud deployment**:
- **Static ngrok domains**: `ngrok http --domain=your-domain.ngrok.io 5001`
- **Cloud deployment**: Use services like **Heroku**, **Railway**, or **DigitalOcean**
- **Custom domain**: Configure DNS and SSL certificates

### Deployment Considerations
- Use **Gunicorn** for production WSGI server
- Configure **Nginx** for reverse proxy
- Set up **SSL certificates** for HTTPS
- Use **environment-specific** configuration files

---

## 📡 API Endpoints

### Main Ocean API Server (`app.py`)

#### 🌊 Tunisia Ocean Data
```http
GET /api/tunisia/data
```
**Description**: Get real-time Mediterranean sea data around Tunisia
**Parameters**:
- `parameter` (optional): Specific data type (sst, currents, waves, etc.)
- `date` (optional): Specific date (defaults to yesterday)
- `limit` (optional): Number of data points to return

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "point_001",
      "date": "2025-06-26",
      "latitude": 36.8,
      "longitude": 10.2,
      "parameter": "sea_surface_temperature",
      "value": 24.5,
      "location_name": "Gulf of Tunis"
    }
  ],
  "metadata": {
    "source": "Copernicus Marine Service",
    "total_points": 156,
    "region": "Tunisia Mediterranean",
    "parameters": ["sst", "currents", "waves"],
    "auto_cleanup": true
  }
}
```

#### 🗄️ Data Management
```http
GET /api/cache/status
POST /api/cache/clear
GET /api/health
```

### IoT Service API (`iot/iot.py`)

#### 📊 Sensor Data
```http
POST /api/iot/webhook
GET /api/iot/sensors
GET /api/iot/sensor/{device_id}/data
```

#### 🌡️ Thermal Imaging
```http
GET /api/iot/thermal/latest
GET /api/iot/thermal/image/{sensor_id}
POST /api/iot/thermal/analysis
```

**Thermal Image Response**:
```http
Content-Type: image/png
X-Thermal-Stats: max=32.5,min=18.2,avg=25.8
```

---

## 🌊 Ocean Data Integration

### Copernicus Marine Service Integration

The backend integrates with the **Copernicus Marine Environment Monitoring Service (CMEMS)** to provide real-time oceanographic data for the Tunisia region.

#### Supported Datasets
| Parameter | Dataset ID | Description |
|-----------|------------|-------------|
| **Sea Surface Temperature** | `cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m` | Daily SST at 0.083° resolution |
| **Ocean Currents** | `cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m` | Surface current velocity (U/V) |
| **Wave Height** | `cmems_mod_glo_wav_anfc_0.083deg_PT3H-i` | Significant wave height |
| **Chlorophyll-a** | `cmems_obs-oc_glo_bgc-plankton_nrt_l3-multi-4km_P1D` | Ocean color and productivity |
| **Sea Level** | `cmems_obs-sl_glo_phy-ssh_nrt_allsat-l4-duacs_PT1H` | Sea level anomaly |

#### Geographic Bounds
```python
TUNISIA_BOUNDS = {
    'minimum_longitude': 8.0,
    'maximum_longitude': 12.5,
    'minimum_latitude': 30.0,
    'maximum_latitude': 38.5
}
```

#### Data Processing Pipeline
1. **Automatic Data Fetching**: Daily automatic retrieval of J-1 (yesterday) data
2. **Geographic Filtering**: Tunisia-specific coastal data extraction
3. **Data Validation**: Quality control and outlier detection
4. **Caching**: Intelligent caching system for performance
5. **Cleanup**: Automatic temporary file management

---

## 📊 IoT Services

### Sensor Data Collection

#### Supported Sensor Types
- **Environmental Sensors**: Temperature, humidity, pressure
- **Water Quality**: pH, TDS (Total Dissolved Solids), conductivity
- **Thermal Cameras**: AMG8833 thermal imaging arrays
- **GPS Tracking**: Location and movement data
- **Marine Sensors**: Salinity, water temperature, depth

#### Data Flow
```
LoRaWAN Device → ChirpStack → Webhook → IoT Service → Supabase → Frontend
```

#### ChirpStack Webhook Integration

The IoT service provides a **webhook endpoint** (`/webhook`) that receives real-time data from **ChirpStack LoRaWAN Network Server**. This enables automatic processing of sensor data from marine IoT devices.

**Webhook URL Configuration**:
- **Development**: Use **ngrok** to expose local server: `https://your-ngrok-url.ngrok.io/webhook`
- **Production**: Deploy to cloud and configure static URL

**Supported Payload Format**:
```json
{
  "deviceName": "marine-sensor-001",
  "deviceEUI": "1234567890abcdef",
  "data": "base64_encoded_sensor_data",
  "fPort": 1,
  "fCnt": 42,
  "rxInfo": [...],
  "txInfo": {...}
}
```

**Webhook Security**:
- Validates incoming requests from ChirpStack
- Processes base64-encoded sensor payloads
- Implements error handling and logging

#### Thermal Image Processing
```python
def process_thermal_data(thermal_pixels):
    """
    Process 8x8 thermal array into visualization
    """
    # Convert to numpy array
    thermal_array = np.array(thermal_pixels).reshape(8, 8)
    
    # Apply color mapping
    plt.imshow(thermal_array, cmap='hot', interpolation='bilinear')
    
    # Generate heatmap image
    return generate_thermal_image(thermal_array)
```

### Real-time Data Storage

#### Supabase Table Schema
```sql
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_eui TEXT NOT NULL,
    device_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,
    
    -- Environmental data
    temperature REAL,
    pressure REAL,
    humidity REAL,
    
    -- Water quality
    ph_value REAL,
    tds_value REAL,
    water_quality_code INTEGER,
    
    -- Sensor status
    ph_sensor_status BOOLEAN,
    tds_sensor_status BOOLEAN,
    thermal_sensor_status BOOLEAN,
    
    -- Location
    latitude REAL,
    longitude REAL,
    
    -- Thermal imaging
    thermal_pixels REAL[],
    thermal_max REAL,
    thermal_min REAL,
    thermal_avg REAL
);
```

---

## 🔄 Real-time Features

### Live Data Streaming
- **WebSocket Support**: Real-time data push to frontend
- **Automatic Updates**: Periodic data refresh from external sources
- **Event-driven Updates**: Immediate processing of incoming sensor data

### Caching Strategy
```python
class CacheManager:
    def __init__(self):
        self.cache_enabled = True
        self.max_age = timedelta(hours=24)
        self.auto_cleanup = True
    
    def get_cached_data(self, date, parameter):
        # Intelligent cache retrieval
        pass
    
    def store_data(self, data, metadata):
        # Efficient data storage with TTL
        pass
```

### Performance Optimization
- **Data Compression**: Efficient storage of large datasets
- **Intelligent Caching**: Smart cache invalidation and refresh
- **Batch Processing**: Bulk operations for better performance
- **Connection Pooling**: Optimized database connections

---

## 📝 Configuration

### Environment Variables

#### Main API (.env)
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Optional - Ocean Data
COPERNICUS_USERNAME=your_username
COPERNICUS_PASSWORD=your_password

# Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
HOST=0.0.0.0

# Data Configuration
ENABLE_CACHE=true
CACHE_TTL=86400
AUTO_CLEANUP=true
MAX_DATA_POINTS=1000
```

#### IoT Service (iot/.env)
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# ChirpStack Integration
CHIRPSTACK_API_URL=https://your-chirpstack.com
CHIRPSTACK_API_KEY=your_api_key

# Thermal Imaging
THERMAL_RESOLUTION=8x8
THERMAL_COLORMAP=hot
THERMAL_INTERPOLATION=bilinear

# Server Configuration
IOT_PORT=5001
```

### Logging Configuration
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
```

---

## 🔗 Related Documentation

- **[🎨 Frontend Application](../README.md)** - React frontend documentation
- **[🤖 ML/AI Services](../../pfz-prediction-app/README.md)** - Machine learning components
- **[🏠 Main Project](../../README.md)** - Overall project documentation

### External APIs
- **[Copernicus Marine](https://marine.copernicus.eu/)** - Ocean data source
- **[Supabase](https://supabase.io/docs)** - Database and real-time features
- **[ChirpStack](https://www.chirpstack.io/)** - LoRaWAN network server

---

<div align="center">

**🌊 Powering marine data insights with real-time ocean intelligence**

[Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues) • [API Documentation](./API.md)

</div>
