export const appParams = {
  appId: import.meta.env.VITE_BASE44_APP_ID || 'scaverse',
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  functionsVersion: null,
  appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || '',
};
