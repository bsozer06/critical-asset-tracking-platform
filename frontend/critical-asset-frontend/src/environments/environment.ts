export const environment = {
  production: false,
  signalRHubUrl: 'https://localhost:7201/hubs/telemetry', // adjust if different
//   signalRHubUrl: 'http://localhost:5073/hubs/telemetry', // adjust if different
  cesiumBaseUrl: 'assets/cesium', // Angular will serve copied Cesium assets here
  cesiumIonToken: '' // Put your Cesium Ion token here if you want basemaps
};
