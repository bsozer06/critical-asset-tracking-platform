export const environment = {
  production: false,
  signalRHubUrl: 'http://localhost:5073/hubs/telemetry',
  signalRHubUrl2: 'https://localhost:7201/hubs/telemetry',
  geofenceUrl: 'http://localhost:5073/api/geofence',
  geofenceUrl2: 'https://localhost:7201/api/geofence',
  cesiumBaseUrl: 'assets/cesium', // Angular will serve copied Cesium assets here
  cesiumIonToken: 'PUT_YOUR_CESIUM_ION_TOKEN_HERE' // Get a token from https://cesium.com/ion/tokens
};
