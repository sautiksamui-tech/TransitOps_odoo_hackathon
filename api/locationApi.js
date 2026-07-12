const BASE_URL = "http://localhost:5000";

export async function searchAddress(query) {
    const response = await fetch(
        `${BASE_URL}/api/location/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
        throw new Error("Failed to search location");
    }

    return await response.json();
}

export async function reverseGeocode(lat, lon) {
    const response = await fetch(
        `${BASE_URL}/api/location/reverse?lat=${lat}&lon=${lon}`
    );

    if (!response.ok) {
        throw new Error("Failed to reverse geocode");
    }

    return await response.json();
}