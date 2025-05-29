import streamlit as st
import pandas as pd
import pickle
import folium
from streamlit_folium import folium_static
import geocoder

# Load recommender
try:
    with open('CS_rec.pkl', 'rb') as f:
        recommender = pickle.load(f)
except FileNotFoundError:
    st.error("Error: 'CS_rec.pkl' not found. Please ensure the model file is in the same directory.")
    st.stop()

# Initialize location in session state using geocoder IP
if 'user_location' not in st.session_state:
    g = geocoder.ip('me')
    if g.ok:
        st.session_state.user_location = {'lat': g.latlng[0], 'lon': g.latlng[1]}
    else:
        st.session_state.user_location = {'lat': None, 'lon': None}

# Function to validate lat/lon
def validate_coords(lat_str, lon_str):
    try:
        lat = float(lat_str)
        lon = float(lon_str)
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return None, None
        return lat, lon
    except:
        return None, None

# Title & subtitle
st.markdown('<h1 style="text-align:center; color:#1e3a8a;">EV Charging Station Finder</h1>', unsafe_allow_html=True)
st.markdown('<h3 style="text-align:center; color:#374151;">Find the nearest electric vehicle charging stations in India</h3>', unsafe_allow_html=True)

# Button to autofill coords from IP location
if st.button("Use My Approximate IP Location"):
    if st.session_state.user_location['lat'] and st.session_state.user_location['lon']:
        st.session_state.latitude = str(st.session_state.user_location['lat'])
        st.session_state.longitude = str(st.session_state.user_location['lon'])
    else:
        st.warning("Could not determine your location from IP.")

# Manual coordinate input form with autofill from session state
with st.form(key='location_form'):
    col1, col2 = st.columns(2)
    with col1:
        latitude = st.text_input("Latitude", value=st.session_state.get('latitude', ''), placeholder="e.g., 28.4595")
    with col2:
        longitude = st.text_input("Longitude", value=st.session_state.get('longitude', ''), placeholder="e.g., 77.0266")
    submit_button = st.form_submit_button(label="Find Nearest Stations")

# On form submit, validate & process
if submit_button:
    user_lat, user_lon = validate_coords(latitude, longitude)
    if user_lat is None or user_lon is None:
        st.error("Please enter valid latitude and longitude values.")
    else:
        # Save to session state
        st.session_state.latitude = str(user_lat)
        st.session_state.longitude = str(user_lon)

        # Find nearest stations
        nearest_stations = recommender.find_nearest(user_lat, user_lon)

        st.subheader("Nearest 5 Charging Stations")
        st.table(nearest_stations[['name', 'state', 'city', 'address', 'distance']].style.format({'distance': '{:.2f} km'}))

        # Folium map
        m = folium.Map(location=[user_lat, user_lon], zoom_start=12, tiles="CartoDB Positron")
        folium.Marker([user_lat, user_lon], popup="Your Location", icon=folium.Icon(color="red", icon="user")).add_to(m)
        for idx, row in nearest_stations.iterrows():
            folium.Marker(
                [row['lattitude'], row['longitude']],
                popup=f"{row['name']}<br>{row['address']}<br>Distance: {row['distance']:.2f} km",
                icon=folium.Icon(color="green", icon="bolt")
            ).add_to(m)
        st.subheader("Map of Charging Stations")
        folium_static(m)
