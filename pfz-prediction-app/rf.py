import streamlit as st
import numpy as np
import pandas as pd
import folium
from streamlit_folium import st_folium
from datetime import datetime, timedelta
import os
import joblib
import hashlib
try:
    from sklearn.cluster import DBSCAN
    CLUSTERING_AVAILABLE = True
except ImportError:
    CLUSTERING_AVAILABLE = False

try:
    import geopandas as gpd
    from shapely.geometry import Point
    GEOPANDAS_AVAILABLE = True
except ImportError:
    GEOPANDAS_AVAILABLE = False

# Page config
st.set_page_config( layout="wide")

# Hide streamlit elements
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
.block-container {padding-top: 1rem; padding-bottom: 0rem; padding-left: 1rem; padding-right: 1rem;}
</style>
""", unsafe_allow_html=True)

# Configuration
class Config:
    MODEL_PATH = "models/random_forest_model.joblib"
    SCALER_PATH = "models/scaler.joblib"
    TUNISIA_SHAPEFILE = os.path.join("shp_extraction", "3qtek_TUN_0.shp")
    
    LAT_MIN, LAT_MAX = 33.0, 37.5
    LON_MIN, LON_MAX = 8.0, 12.0
    RESOLUTION = 0.05
    
    SST_RANGES = {
        1: (14, 17), 2: (14, 17), 3: (15, 18), 4: (16, 19),
        5: (18, 22), 6: (21, 25), 7: (24, 28), 8: (26, 30),
        9: (24, 28), 10: (21, 25), 11: (18, 22), 12: (15, 19)
    }
    
    CHL_RANGES = {
        1: (0.2, 0.8), 2: (0.2, 0.8), 3: (0.2, 0.7), 4: (0.15, 0.6),
        5: (0.1, 0.5), 6: (0.1, 0.4), 7: (0.08, 0.3), 8: (0.07, 0.3),
        9: (0.1, 0.4), 10: (0.12, 0.5), 11: (0.15, 0.6), 12: (0.2, 0.7)
    }

config = Config()

@st.cache_resource
def load_model():
    try:
        if os.path.exists(config.MODEL_PATH):
            model = joblib.load(config.MODEL_PATH)
            scaler = joblib.load(config.SCALER_PATH) if os.path.exists(config.SCALER_PATH) else None
            return model, scaler
    except:
        pass
    return None, None

@st.cache_resource
def load_shapefile():
    if GEOPANDAS_AVAILABLE and os.path.exists(config.TUNISIA_SHAPEFILE):
        try:
            gdf = gpd.read_file(config.TUNISIA_SHAPEFILE)
            if gdf.crs != 'EPSG:4326':
                gdf = gdf.to_crs('EPSG:4326')
            return gdf
        except:
            pass
    return None

def is_land(lat, lon):
    return ((lat > 36.5 and lat < 37.0 and lon < 10.3) or 
            (lat > 34.0 and lat < 37.0 and lon < 9.0) or
            (lat < 34.0 and lon < 9.5) or
            (lat > 36.0 and lat < 37.0 and lon > 10.5 and lon < 10.8) or
            (lat > 33.7 and lat < 33.9 and lon > 10.8 and lon < 11.1) or
            (lat > 34.6 and lat < 34.9 and lon > 11.0 and lon < 11.3))

def is_water(lat, lon, gdf=None):
    if not (config.LAT_MIN <= lat <= config.LAT_MAX and config.LON_MIN <= lon <= config.LON_MAX):
        return False
    if is_land(lat, lon):
        return False
    if gdf is not None:
        try:
            point = Point(lon, lat)
            for _, row in gdf.iterrows():
                if row.geometry and row.geometry.contains(point):
                    return False
        except:
            pass
    return True

def get_env_data(lat, lon, date_str):
    month = datetime.strptime(date_str, "%Y-%m-%d").month
    seed = int(hashlib.md5(f"{date_str}{lat}{lon}".encode()).hexdigest(), 16) % (2**31)
    np.random.seed(seed)
    
    # SST
    lat_factor = (lat - config.LAT_MIN) / (config.LAT_MAX - config.LAT_MIN)
    sst_min, sst_max = config.SST_RANGES[month]
    sst = sst_max - lat_factor * (sst_max - sst_min) + np.random.normal(0, 0.3)
    
    # Chlorophyll
    coast_dist = min(abs(lon - config.LON_MIN), abs(lat - config.LAT_MIN))
    coast_factor = max(0, 1 - coast_dist / 3)
    chl_min, chl_max = config.CHL_RANGES[month]
    chl = chl_min + (chl_max - chl_min) * (0.3 + 0.7 * coast_factor) + np.random.normal(0, 0.05)
    chl = max(0.05, chl)
    
    return sst, chl

def classify_zone(sst, chl, month):
    if month in [6, 7, 8]:  # Summer
        if chl > 0.2 and 24.0 < sst < 29.0:
            return "HIGH", 0.7 + 0.3 * np.random.random()
        elif chl > 0.1 and 22.0 < sst < 30.0:
            return "MEDIUM", 0.6 + 0.2 * np.random.random()
    elif month in [12, 1, 2]:  # Winter
        if chl > 0.4 and sst > 16.0:
            return "HIGH", 0.7 + 0.3 * np.random.random()
        elif chl > 0.25 and sst > 15.0:
            return "MEDIUM", 0.6 + 0.2 * np.random.random()
    else:  # Spring/Fall
        if chl > 0.3 and 18.0 < sst < 26.0:
            return "HIGH", 0.7 + 0.3 * np.random.random()
        elif chl > 0.15 and 16.0 < sst < 28.0:
            return "MEDIUM", 0.6 + 0.2 * np.random.random()
    return "LOW", 0.5

def predict_zone(lat, lon, date_str, model, scaler):
    sst, chl = get_env_data(lat, lon, date_str)
    month = datetime.strptime(date_str, "%Y-%m-%d").month
    
    if model is not None:
        try:
            features = np.array([sst, chl]).reshape(1, -1)
            if scaler is not None:
                features = scaler.transform(features)
            
            if hasattr(model, 'predict_proba'):
                probs = model.predict_proba(features)[0]
                pred_class = np.argmax(probs)
                confidence = probs[pred_class]
                zone_map = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
                return zone_map[pred_class], confidence, sst, chl
            else:
                pred = model.predict(features)[0]
                zone_map = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
                return zone_map.get(pred, "MEDIUM"), 0.8, sst, chl
        except:
            pass
    
    zone, conf = classify_zone(sst, chl, month)
    return zone, conf, sst, chl

def cluster_high_zones(high_zones, distance_km=12.0):
    if len(high_zones) == 0 or not CLUSTERING_AVAILABLE:
        return [], high_zones
    
    coords = np.array([[z['lat'], z['lon']] for z in high_zones])
    clustering = DBSCAN(eps=distance_km/111.0, min_samples=2)
    labels = clustering.fit_predict(coords)
    
    areas, singles = [], []
    for label in set(labels):
        indices = np.where(labels == label)[0]
        if label == -1:
            singles.extend([high_zones[i] for i in indices])
        else:
            cluster_zones = [high_zones[i] for i in indices]
            lats = [z['lat'] for z in cluster_zones]
            lons = [z['lon'] for z in cluster_zones]
            
            areas.append({
                'center_lat': np.mean(lats),
                'center_lon': np.mean(lons),
                'zones': cluster_zones,
                'count': len(cluster_zones),
                'avg_conf': np.mean([z['conf'] for z in cluster_zones]),
                'polygon': [
                    [min(lats)-0.01, min(lons)-0.01],
                    [min(lats)-0.01, max(lons)+0.01],
                    [max(lats)+0.01, max(lons)+0.01],
                    [max(lats)+0.01, min(lons)-0.01],
                    [min(lats)-0.01, min(lons)-0.01]
                ]
            })
    
    return areas, singles

def create_map(high_zones, areas, singles, date_str):
    m = folium.Map(location=[35.0, 9.5], zoom_start=7, tiles='OpenStreetMap')
    
    folium.TileLayer(
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri',
        name='Satellite',
        overlay=False,
        control=True
    ).add_to(m)
    
    # Cities
    cities = {'Tunis': (36.8, 10.18), 'Sfax': (34.74, 10.76), 'Sousse': (35.83, 10.64), 'Bizerte': (37.27, 9.87)}
    for city, (lat, lon) in cities.items():
        folium.Marker([lat, lon], popup=city, icon=folium.Icon(color='blue', icon='info-sign')).add_to(m)
    
    # Areas
    for i, area in enumerate(areas):
        folium.Polygon(
            locations=area['polygon'],
            popup=f"Area {i+1}: {area['count']} zones",
            color='darkred',
            fill=True,
            fillColor='#DC143C',
            fillOpacity=0.7
        ).add_to(m)
        
        folium.Marker(
            [area['center_lat'], area['center_lon']],
            popup=f"Area {i+1} Center",
            icon=folium.Icon(color='red', icon='star')
        ).add_to(m)
    
    # Singles
    for zone in singles:
        folium.CircleMarker(
            [zone['lat'], zone['lon']],
            radius=8,
            popup=f"HIGH Zone: {zone['conf']:.2f}",
            color='darkred',
            fill=True,
            fillColor='#DC143C'
        ).add_to(m)
    
    
    
    return m

# Main App
model, scaler = load_model()
shapefile = load_shapefile()


# Create columns for the top navigation
col1, col2, col3 = st.columns([2, 2, 3])

with col1:
    date = st.date_input("📅 Select Date", datetime.now(), 
                        min_value=datetime.now()-timedelta(30), 
                        max_value=datetime.now()+timedelta(7))





st.divider()

# Auto-generate when date changes
date_str = date.strftime("%Y-%m-%d")
cluster_dist = 12.0  # Fixed cluster distance

# Store results in session state to prevent re-computation
if 'last_date' not in st.session_state:
    st.session_state.last_date = None
if 'high_zones' not in st.session_state:
    st.session_state.high_zones = []
if 'areas' not in st.session_state:
    st.session_state.areas = []
if 'singles' not in st.session_state:
    st.session_state.singles = []
if 'coords_count' not in st.session_state:
    st.session_state.coords_count = 0

# Check if we need to regenerate
need_regenerate = (st.session_state.last_date != date_str)

if need_regenerate:
    with st.spinner("Generating predictions..."):
        # Grid
        coords = []
        lats = np.arange(config.LAT_MIN, config.LAT_MAX + config.RESOLUTION, config.RESOLUTION)
        lons = np.arange(config.LON_MIN, config.LON_MAX + config.RESOLUTION, config.RESOLUTION)
        
        for lat in lats:
            for lon in lons:
                if is_water(lat, lon, shapefile):
                    coords.append([lon, lat])
        
        # Predictions
        high_zones = []
        progress = st.progress(0)
        
        for i, (lon, lat) in enumerate(coords):
            zone, conf, sst, chl = predict_zone(lat, lon, date_str, model, scaler)
            if zone == "HIGH":
                high_zones.append({'lat': lat, 'lon': lon, 'conf': conf, 'sst': sst, 'chl': chl})
            
            if i % 100 == 0:
                progress.progress((i+1)/len(coords))
        
        progress.empty()
        
        # Clustering
        areas, singles = cluster_high_zones(high_zones, cluster_dist)
        
        # Store in session state
        st.session_state.high_zones = high_zones
        st.session_state.areas = areas
        st.session_state.singles = singles
        st.session_state.coords_count = len(coords)
        st.session_state.last_date = date_str

# Use stored results
high_zones = st.session_state.high_zones
areas = st.session_state.areas
singles = st.session_state.singles
coords_count = st.session_state.coords_count

# Display results
if high_zones:
    # Create and display map
    fishing_map = create_map(high_zones, areas, singles, date_str)
    
    # Create a placeholder for the map that won't change
    map_placeholder = st.empty()
    
    with map_placeholder.container():
        st_folium(
            fishing_map, 
            width=None, 
            height=600, 
            returned_objects=[],
            use_container_width=True
        )
    

