const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

export const API_BASE = (import.meta as any).env?.VITE_API_URL 
  || (isLocal ? `${window.location.protocol}//${window.location.hostname}:3002/api` : '/api');

