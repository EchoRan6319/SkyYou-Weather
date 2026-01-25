import { useState, useEffect } from 'react';
import { WeatherLocation } from '../types';
import { DEFAULT_LOCATIONS, LOCATIONS_STORAGE_KEY, CURRENT_LOC_STORAGE_KEY, TRANSLATIONS } from '../constants';

export const useLocations = (language: string) => {
    const t = (TRANSLATIONS as any)[language];

    const [locations, setLocations] = useState<WeatherLocation[]>(() => {
        let initial = DEFAULT_LOCATIONS;
        try {
            const saved = localStorage.getItem(LOCATIONS_STORAGE_KEY);
            if (saved) initial = JSON.parse(saved);
        } catch (e) {
            console.warn("Locations load failed", e);
        }

        const hasGPS = initial.some(l => l.isCurrentLocation);
        if (!hasGPS) {
            const placeholder: WeatherLocation = {
                id: 'current_gps',
                name: t.loading,
                district: '',
                coords: { lat: 39.9042, lon: 116.4074 },
                isCurrentLocation: true
            };
            return [placeholder, ...initial.filter(l => l.id !== 'current_gps')];
        }
        return initial;
    });

    const [currentLocationId, setCurrentLocationId] = useState<string>(() => {
        const savedId = localStorage.getItem(CURRENT_LOC_STORAGE_KEY);
        return savedId || 'current_gps';
    });

    useEffect(() => {
        localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations));
    }, [locations]);

    useEffect(() => {
        localStorage.setItem(CURRENT_LOC_STORAGE_KEY, currentLocationId);
    }, [currentLocationId]);

    const addLocation = (newLoc: WeatherLocation) => {
        if (locations.some(l => l.id === newLoc.id)) return;
        if (locations.some(l => l.name === newLoc.name && l.district === newLoc.district && !l.isCurrentLocation)) return;

        setLocations([...locations, newLoc]);
        setCurrentLocationId(newLoc.id);
    };

    const deleteLocation = (id: string) => {
        const newLocations = locations.filter(l => l.id !== id);
        setLocations(newLocations);
        if (currentLocationId === id) {
            setCurrentLocationId(newLocations[0]?.id || 'current_gps');
        }
    };

    const updateLocation = (id: string, updates: Partial<WeatherLocation>) => {
        setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, ...updates } : loc));
    };

    return {
        locations,
        currentLocationId,
        setCurrentLocationId,
        addLocation,
        deleteLocation,
        updateLocation,
        setLocations
    };
};
