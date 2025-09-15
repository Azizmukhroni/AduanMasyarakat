import { updateLocationInput } from './form-validation.js';

// Global variables
let map = null;
let marker = null;

/**
 * Inisialisasi peta Leaflet
 */
function initMap() {
    try {
        // Default location (contoh: Jakarta)
        const defaultLocation = [-6.2088, 106.8456];
        
        // Inisialisasi peta
        const mapContainer = document.getElementById('location-map');
        if (!mapContainer) {
            console.error("Map container not found!");
            return;
        }
        
        map = L.map('location-map').setView(defaultLocation, 13);
        
        // Tambahkan tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Tambahkan marker
        marker = L.marker(defaultLocation, {
            draggable: true
        }).addTo(map);
        
        // Event ketika marker dipindahkan
        marker.on('dragend', function() {
            updateLocationInput(marker);
        });
        
        // Event ketika peta diklik
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updateLocationInput(marker);
        });
        
        // Coba dapatkan lokasi pengguna
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const userLocation = [
                        position.coords.latitude,
                        position.coords.longitude
                    ];
                    
                    map.setView(userLocation, 15);
                    marker.setLatLng(userLocation);
                    updateLocationInput(marker);
                },
                function(error) {
                    console.error("Error getting location:", error);
                    // Tetap gunakan lokasi default
                    updateLocationInput(marker);
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
            updateLocationInput(marker);
        }
    } catch (error) {
        console.error("Error initializing map:", error);
    }
}

// Export functions
export { initMap, map, marker };