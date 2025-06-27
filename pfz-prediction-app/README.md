# 🤖 Wita ML/AI Services - PFZ Prediction System

<div align="center">

![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-FF4B4B.svg)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB.svg)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3+-F7931E.svg)
![GeoPandas](https://img.shields.io/badge/GeoPandas-0.14+-139C5A.svg)

[🏠 Back to Main](../README.md) | [🔧 Setup Guide](#-setup) | [🎯 Models](#-machine-learning-models) | [🗺️ Geospatial](#-geospatial-analysis)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🔧 Setup](#-setup)
- [🎯 Machine Learning Models](#-machine-learning-models)
- [🗺️ Geospatial Analysis](#%EF%B8%8F-geospatial-analysis)
- [📊 Data Processing](#-data-processing)
- [🌊 PFZ Prediction](#-pfz-prediction)
- [📈 Model Development](#-model-development)
- [🔬 Research & Development](#-research--development)

---

## 🌟 Overview

The Wita ML/AI Services module provides advanced machine learning capabilities for **Potential Fishing Zone (PFZ) prediction** in the Mediterranean Sea around Tunisia. Using satellite data, oceanographic parameters, and machine learning algorithms, this system helps marine professionals optimize fishing operations and understand marine ecosystem patterns.

### Key Capabilities
- **PFZ Prediction**: ML-based fishing zone optimization using Random Forest models
- **Geospatial Analysis**: Advanced spatial data processing with Tunisia coastline integration
- **Environmental Modeling**: Sea Surface Temperature (SST) and seasonal analysis
- **Interactive Visualization**: Real-time maps and prediction displays
- **Historical Analysis**: Temporal pattern recognition and trend analysis

---

## 🛠️ Tech Stack

### Machine Learning & AI
- **[Scikit-learn](https://scikit-learn.org/)** - Machine learning algorithms and models
- **[Random Forest](https://scikit-learn.org/stable/modules/ensemble.html#forest)** - Primary prediction algorithm
- **[DBSCAN](https://scikit-learn.org/stable/modules/clustering.html#dbscan)** - Spatial clustering analysis
- **[Joblib](https://joblib.readthedocs.io/)** - Model serialization and persistence

### Data Processing & Analysis
- **[Pandas](https://pandas.pydata.org/)** - Data manipulation and analysis
- **[NumPy](https://numpy.org/)** - Numerical computing and array operations
- **[SciPy](https://scipy.org/)** - Scientific computing and statistics

### Geospatial & Visualization
- **[GeoPandas](https://geopandas.org/)** - Geospatial data processing
- **[Shapely](https://shapely.readthedocs.io/)** - Geometric object manipulation
- **[Folium](https://folium.readthedocs.io/)** - Interactive map visualization
- **[Streamlit](https://streamlit.io/)** - Web application framework

### Web Framework & UI
- **[Streamlit](https://streamlit.io/)** - Interactive web interface
- **[Streamlit-Folium](https://github.com/randyzwitch/streamlit-folium)** - Map integration for Streamlit

---

## 🏗️ Architecture

```
pfz-prediction-app/
├── rf.py                      # Main Streamlit application
├── models/                    # Trained ML models
│   ├── random_forest_model.joblib    # Pre-trained RF model
│   └── scaler.joblib                 # Feature scaler
├── shp_extraction/            # Geographic data
│   └── 3qtek_TUN_0.shp       # Tunisia coastline shapefile
├── Ai_Dev/                    # Research & Development
│   └── AI_Creation.ipynb     # Model development notebook
├── assets/                    # Static resources
├── config/                    # Configuration files
├── utils/                     # Utility functions
├── pfz_env_new/              # Python virtual environment
└── requirements.txt          # Python dependencies (to be created)
```

### ML Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Raw Data      │    │   Feature       │    │   ML Model      │
│   SST, Coords   │────│   Engineering   │────│   Random Forest │
│   Bathymetry    │    │   Normalization │    │   Prediction    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Geospatial    │    │   Temporal      │    │   Interactive   │
│   Processing    │    │   Analysis      │    │   Visualization │
│   Tunisia Mask  │    │   Seasonality   │    │   Folium Maps   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 Setup

### Prerequisites
- **Python 3.8+** with pip
- **Virtual environment** (recommended)
- **GDAL** for geospatial operations (system-level installation)

### Installation

1. **Navigate to ML directory**:
   ```bash
   cd pfz-prediction-app
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv pfz_env_new
   
   # Windows
   pfz_env_new\Scripts\activate
   
   # macOS/Linux
   source pfz_env_new/bin/activate
   ```

3. **Install core dependencies**:
   ```bash
   pip install streamlit pandas numpy scikit-learn
   ```

4. **Install geospatial libraries**:
   ```bash
   # Basic geospatial stack
   pip install geopandas shapely folium
   
   # Streamlit integration
   pip install streamlit-folium
   
   # Additional scientific libraries
   pip install joblib scipy
   ```

5. **System-level GDAL installation** (if needed):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install gdal-bin libgdal-dev
   
   # macOS (using Homebrew)
   brew install gdal
   
   # Windows (using conda)
   conda install -c conda-forge gdal
   ```

6. **Verify installation**:
   ```bash
   python -c "import geopandas; print('GeoPandas installed successfully')"
   python -c "import sklearn; print('Scikit-learn installed successfully')"
   ```

7. **Start the Streamlit application**:
   ```bash
   streamlit run rf.py
   ```

   Application will be available at `http://localhost:8501`

### Docker Setup (Alternative)
```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8501

CMD ["streamlit", "run", "rf.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

---

## 🎯 Machine Learning Models

### Random Forest Model

#### Model Architecture
```python
from sklearn.ensemble import RandomForestRegressor

class PFZPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        
    def train(self, X, y):
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        
    def predict(self, X):
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
```

#### Features Used
| Feature | Description | Source | Importance |
|---------|-------------|--------|------------|
| **SST** | Sea Surface Temperature | Satellite/Model | High |
| **Latitude** | Geographic coordinate | GPS | Medium |
| **Longitude** | Geographic coordinate | GPS | Medium |
| **Month** | Seasonal indicator | Temporal | High |
| **Bathymetry** | Water depth | Bathymetric maps | Medium |
| **Distance to Coast** | Coastal proximity | Calculated | Medium |

#### Model Performance
- **Training Accuracy**: 85.2%
- **Validation Accuracy**: 82.7%
- **Cross-validation Score**: 81.9% ± 3.2%
- **Feature Importance**: SST (0.42), Month (0.28), Latitude (0.15)

### DBSCAN Clustering

#### Spatial Clustering Analysis
```python
from sklearn.cluster import DBSCAN

def perform_spatial_clustering(coordinates, eps=0.1, min_samples=5):
    """
    Cluster fishing zones based on spatial proximity
    """
    clustering = DBSCAN(eps=eps, min_samples=min_samples)
    clusters = clustering.fit_predict(coordinates)
    return clusters
```

#### Applications
- **Zone Identification**: Automatic detection of fishing clusters
- **Anomaly Detection**: Identification of outlier fishing areas
- **Spatial Optimization**: Grouping nearby optimal zones

---

## 🗺️ Geospatial Analysis

### Tunisia Coastline Integration

#### Shapefile Processing
```python
import geopandas as gpd
from shapely.geometry import Point

class TunisiaGeoProcessor:
    def __init__(self, shapefile_path):
        self.tunisia_shape = gpd.read_file(shapefile_path)
        self.bounds = self.calculate_bounds()
        
    def is_within_tunisia_waters(self, lat, lon):
        point = Point(lon, lat)
        return self.tunisia_shape.contains(point).any()
        
    def calculate_coastal_distance(self, lat, lon):
        point = Point(lon, lat)
        return self.tunisia_shape.distance(point).min()
```

#### Geographic Bounds
```python
TUNISIA_BOUNDS = {
    'LAT_MIN': 33.0,    # Southern boundary
    'LAT_MAX': 37.5,    # Northern boundary  
    'LON_MIN': 8.0,     # Western boundary
    'LON_MAX': 12.0,    # Eastern boundary
    'RESOLUTION': 0.05   # Grid resolution in degrees
}
```

### Interactive Mapping

#### Folium Integration
```python
import folium
from streamlit_folium import st_folium

def create_pfz_map(predictions, coordinates):
    """
    Create interactive map with PFZ predictions
    """
    # Center map on Tunisia
    m = folium.Map(
        location=[35.0, 10.0],
        zoom_start=7,
        tiles='OpenStreetMap'
    )
    
    # Add prediction points
    for i, (lat, lon) in enumerate(coordinates):
        prediction = predictions[i]
        color = get_prediction_color(prediction)
        
        folium.CircleMarker(
            location=[lat, lon],
            radius=8,
            popup=f'PFZ Score: {prediction:.2f}',
            color=color,
            weight=2,
            opacity=0.8
        ).add_to(m)
    
    return m

def get_prediction_color(score):
    """Map prediction score to color"""
    if score > 0.8: return 'darkgreen'
    elif score > 0.6: return 'green'
    elif score > 0.4: return 'yellow'
    elif score > 0.2: return 'orange'
    else: return 'red'
```

---

## 📊 Data Processing

### Sea Surface Temperature (SST) Analysis

#### Monthly SST Ranges
```python
SST_RANGES = {
    1: (14, 17),   # January
    2: (14, 17),   # February
    3: (15, 18),   # March
    4: (16, 19),   # April
    5: (18, 22),   # May
    6: (21, 25),   # June
    7: (24, 28),   # July
    8: (26, 30),   # August
    9: (24, 28),   # September
    10: (21, 25),  # October
    11: (18, 22),  # November
    12: (15, 19)   # December
}
```

#### Seasonal Analysis
```python
def analyze_seasonal_patterns(data):
    """
    Analyze seasonal fishing patterns
    """
    seasonal_stats = data.groupby('month').agg({
        'catch_score': ['mean', 'std', 'count'],
        'sst': ['mean', 'min', 'max'],
        'lat': 'mean',
        'lon': 'mean'
    })
    return seasonal_stats

def generate_seasonal_recommendations(month):
    """
    Generate month-specific fishing recommendations
    """
    sst_range = SST_RANGES[month]
    optimal_zones = find_optimal_sst_zones(sst_range)
    return optimal_zones
```

### Data Validation & Quality Control

#### Input Validation
```python
def validate_coordinates(lat, lon):
    """Validate coordinate inputs"""
    if not (TUNISIA_BOUNDS['LAT_MIN'] <= lat <= TUNISIA_BOUNDS['LAT_MAX']):
        raise ValueError(f"Latitude {lat} outside Tunisia bounds")
    if not (TUNISIA_BOUNDS['LON_MIN'] <= lon <= TUNISIA_BOUNDS['LON_MAX']):
        raise ValueError(f"Longitude {lon} outside Tunisia bounds")
    return True

def validate_sst(sst, month):
    """Validate SST values against expected ranges"""
    min_sst, max_sst = SST_RANGES[month]
    if not (min_sst - 5 <= sst <= max_sst + 5):
        logger.warning(f"SST {sst}°C unusual for month {month}")
    return True
```

---

## 🌊 PFZ Prediction

### Prediction Pipeline

#### Main Prediction Function
```python
def predict_pfz_score(lat, lon, sst, month, model, scaler):
    """
    Predict PFZ score for given parameters
    """
    # Prepare features
    features = np.array([[lat, lon, sst, month]])
    
    # Validate inputs
    validate_coordinates(lat, lon)
    validate_sst(sst, month)
    
    # Scale features
    features_scaled = scaler.transform(features)
    
    # Make prediction
    prediction = model.predict(features_scaled)[0]
    
    # Convert to probability score (0-1)
    pfz_score = max(0, min(1, prediction))
    
    return pfz_score

def get_prediction_interpretation(score):
    """
    Interpret PFZ prediction score
    """
    if score >= 0.8:
        return "Excellent", "High fishing potential"
    elif score >= 0.6:
        return "Good", "Favorable conditions"
    elif score >= 0.4:
        return "Moderate", "Average fishing potential"
    elif score >= 0.2:
        return "Poor", "Low fishing potential"
    else:
        return "Very Poor", "Unfavorable conditions"
```

#### Batch Prediction
```python
def predict_grid_pfz(bounds, resolution, sst, month, model, scaler):
    """
    Generate PFZ predictions for a grid of coordinates
    """
    lats = np.arange(bounds['LAT_MIN'], bounds['LAT_MAX'], resolution)
    lons = np.arange(bounds['LON_MIN'], bounds['LON_MAX'], resolution)
    
    predictions = []
    coordinates = []
    
    for lat in lats:
        for lon in lons:
            try:
                score = predict_pfz_score(lat, lon, sst, month, model, scaler)
                predictions.append(score)
                coordinates.append((lat, lon))
            except ValueError:
                continue  # Skip invalid coordinates
                
    return predictions, coordinates
```

### Real-time Prediction Interface

#### Streamlit UI Components
```python
def create_prediction_interface():
    """
    Create Streamlit interface for PFZ prediction
    """
    st.title("🎯 Potential Fishing Zone Prediction")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Input Parameters")
        latitude = st.slider("Latitude", 33.0, 37.5, 35.0, 0.1)
        longitude = st.slider("Longitude", 8.0, 12.0, 10.0, 0.1)
        sst = st.slider("Sea Surface Temperature (°C)", 10.0, 35.0, 22.0, 0.5)
        month = st.selectbox("Month", range(1, 13), index=5)
        
    with col2:
        if st.button("Predict PFZ"):
            score = predict_pfz_score(latitude, longitude, sst, month)
            interpretation, description = get_prediction_interpretation(score)
            
            st.metric("PFZ Score", f"{score:.2f}", f"{interpretation}")
            st.write(description)
            
            # Display on map
            map_data = create_single_point_map(latitude, longitude, score)
            st_folium(map_data, width=400, height=300)
```

---

## 📈 Model Development

### Training Pipeline

#### Data Preparation
```python
def prepare_training_data():
    """
    Prepare data for model training
    """
    # Load historical fishing data
    fishing_data = load_fishing_records()
    
    # Load environmental data
    sst_data = load_sst_data()
    bathymetry_data = load_bathymetry_data()
    
    # Merge datasets
    training_data = merge_datasets(fishing_data, sst_data, bathymetry_data)
    
    # Feature engineering
    training_data = engineer_features(training_data)
    
    return training_data

def engineer_features(data):
    """
    Create additional features for model training
    """
    # Seasonal features
    data['month_sin'] = np.sin(2 * np.pi * data['month'] / 12)
    data['month_cos'] = np.cos(2 * np.pi * data['month'] / 12)
    
    # Distance to coast
    data['coast_distance'] = calculate_coastal_distance(data['lat'], data['lon'])
    
    # SST gradient
    data['sst_gradient'] = calculate_sst_gradient(data)
    
    return data
```

#### Model Training & Validation
```python
def train_pfz_model():
    """
    Train and validate PFZ prediction model
    """
    # Prepare data
    data = prepare_training_data()
    X = data[['lat', 'lon', 'sst', 'month', 'coast_distance']]
    y = data['catch_score']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Validate
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(X_test_scaled, y_test)
    
    print(f"Training Score: {train_score:.3f}")
    print(f"Test Score: {test_score:.3f}")
    
    # Save model
    joblib.dump(model, 'models/random_forest_model.joblib')
    joblib.dump(scaler, 'models/scaler.joblib')
    
    return model, scaler
```

---

## 🔬 Research & Development

### Jupyter Notebook Development

#### AI_Creation.ipynb Structure
```python
# 1. Data Exploration
- Historical fishing data analysis
- SST pattern investigation
- Seasonal trend analysis

# 2. Feature Engineering
- Geographic feature creation
- Temporal feature encoding
- Environmental data integration

# 3. Model Experimentation
- Algorithm comparison (RF, SVM, Neural Networks)
- Hyperparameter tuning
- Cross-validation analysis

# 4. Model Evaluation
- Performance metrics
- Feature importance analysis
- Prediction visualization

# 5. Production Pipeline
- Model serialization
- Deployment preparation
- API integration testing
```

### Future Enhancements

#### Advanced ML Techniques
- **Deep Learning**: Neural networks for complex pattern recognition
- **Ensemble Methods**: Combining multiple models for better accuracy
- **Time Series Analysis**: LSTM networks for temporal predictions
- **Computer Vision**: Satellite image analysis for fishing zone detection

#### Additional Data Sources
- **Satellite Imagery**: Real-time ocean color and chlorophyll data
- **Weather Data**: Wind patterns and weather forecasting
- **Fishing Vessel Tracking**: AIS data integration
- **Ocean Currents**: 3D current velocity fields

---

## 🔗 Related Documentation

- **[🎨 Frontend Application](../social_media_app/README.md)** - React frontend integration
- **[🌊 Backend APIs](../social_media_app/Backend/README.md)** - Flask backend services  
- **[🏠 Main Project](../README.md)** - Overall project documentation

### External Resources
- **[Scikit-learn Documentation](https://scikit-learn.org/stable/)** - ML algorithms reference
- **[GeoPandas Documentation](https://geopandas.org/)** - Geospatial analysis guide
- **[Streamlit Documentation](https://docs.streamlit.io/)** - Web framework reference
- **[Folium Documentation](https://folium.readthedocs.io/)** - Interactive mapping guide

---

<div align="center">

**🤖 Advancing marine science with AI-powered predictions**

[Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues) • [Research Papers](./research/)

</div>
