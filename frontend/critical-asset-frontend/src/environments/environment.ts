export const environment = {
  production: false,
  signalRHubUrl: 'http://localhost:5073/hubs/telemetry',
  signalRHubUrl2: 'https://localhost:7201/hubs/telemetry',
  // geofenceUrl: 'https://localhost:5073/api/geofence',
  geofenceUrl: 'https://localhost:7201/api/geofence',
  cesiumBaseUrl: 'assets/cesium', // Angular will serve copied Cesium assets here
  cesiumIonToken: '' // Put your Cesium Ion token here if you want basemaps
};
