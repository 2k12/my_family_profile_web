import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for Leaflet default icon not showing
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapWidgetProps {
    value: { lat: number; lng: number } | null | string; // Assuming value might be parsed or string
    label: string;
}

export function LocationMapWidget({ value, label }: LocationMapWidgetProps) {
    // Parse value if string or undefined
    let location = { lat: -1.8312, lng: -78.1834 }; // Default to Ecuador center roughly
    let hasLocation = false;

    if (value && typeof value === 'object' && 'lat' in value && 'lng' in value) {
        location = { lat: Number(value.lat), lng: Number(value.lng) };
        hasLocation = true;
    } else if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed.lat && parsed.lng) {
                location = { lat: Number(parsed.lat), lng: Number(parsed.lng) };
                hasLocation = true;
            }
        } catch (e) {
            // Ignore parse error, use default
        }
    }

    // If we want to strictly show nothing if no location, we can return null.
    // But user asked for a default map or message. "Si no hay datos, muestra un mapa por defecto o un mensaje."
    
    return (
        <div className="space-y-2 border p-2 rounded-md">
            <label className="text-sm font-medium">{label}</label>
            {!hasLocation && <p className="text-xs text-muted-foreground">No hay ubicación registrada. Mostrando vista predeterminada.</p>}
            
            <div className="h-[300px] w-full rounded-md overflow-hidden relative z-0">
                <MapContainer center={[location.lat, location.lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {hasLocation && (
                        <Marker position={[location.lat, location.lng]}>
                            <Popup>
                                Ubicación Registrada <br /> Lat: {location.lat}, Lng: {location.lng}
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
