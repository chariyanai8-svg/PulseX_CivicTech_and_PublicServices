// Centralized API configuration supporting localhost, LAN devices (phones on same Wi-Fi), and deployed cloud environments
export const API_BASE = (import.meta as any).env?.VITE_API_URL 
  || (typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:3002/api` 
      : 'http://localhost:3002/api');
