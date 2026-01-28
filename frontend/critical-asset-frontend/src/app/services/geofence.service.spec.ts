// import { GeofenceService } from './geofence.service';
// import { Geofence, GeoPoint } from '../models/geofence.model';
// import { TelemetryPoint } from '../models/telemetry-point.model';

// describe('GeofenceService', () => {
//     let service: GeofenceService;

//     beforeEach(() => {
//         service = new GeofenceService();
//     });

//     it('should be created', () => {
//         expect(service).toBeTruthy();
//     });

//     describe('isPointInPolygon', () => {
//         const square: GeoPoint[] = [
//             { latitude: 0, longitude: 0 },
//             { latitude: 0, longitude: 1 },
//             { latitude: 1, longitude: 1 },
//             { latitude: 1, longitude: 0 }
//         ];
//         it('should return true for point inside polygon', () => {
//             expect(service.isPointInPolygon({ latitude: 0.5, longitude: 0.5 }, square)).toBeTrue();
//         });
//         it('should return false for point outside polygon', () => {
//             expect(service.isPointInPolygon({ latitude: 2, longitude: 2 }, square)).toBeFalse();
//         });
//         it('should return false for polygon with less than 3 points', () => {
//             expect(service.isPointInPolygon({ latitude: 0, longitude: 0 }, [{ latitude: 0, longitude: 0 }])).toBeFalse();
//         });
//     });

//     describe('geofence management', () => {
//         const geofence = {
//             id: 'g1',
//             name: 'Test',
//             polygon: [
//                 { latitude: 0, longitude: 0 },
//                 { latitude: 0, longitude: 1 },
//                 { latitude: 1, longitude: 1 },
//                 { latitude: 1, longitude: 0 }
//             ],
//             enabled: true,
//             alertOnEntry: true,
//             alertOnExit: true
//         } as Geofence;
//         it('should add and get geofence', () => {
//             service.addGeofence(geofence);
//             expect(service.getGeofence('g1')).toEqual(geofence);
//             expect(service.getGeofences().length).toBe(1);
//         });
//         it('should remove geofence', () => {
//             service.addGeofence(geofence);
//             service.removeGeofence('g1');
//             expect(service.getGeofence('g1')).toBeUndefined();
//         });
//     });

//     describe('checkGeofenceViolations', () => {
//         const geofence = {
//             id: 'g1',
//             name: 'Test',
//             polygon: [
//                 { latitude: 0, longitude: 0 },
//                 { latitude: 0, longitude: 1 },
//                 { latitude: 1, longitude: 1 },
//                 { latitude: 1, longitude: 0 }
//             ],
//             enabled: true,
//             alertOnEntry: true,
//             alertOnExit: true
//         } as Geofence;
//         const assetId = 'asset1';
//         it('should detect entry and exit violations', () => {
//             service.addGeofence(geofence);
//             // Asset outside
//             let telemetry: TelemetryPoint = {
//                 latitude: 2, longitude: 2, timestampUtc: new Date().toISOString(), assetId
//             };
//             let violations = service.checkGeofenceViolations(assetId, telemetry);
//             expect(violations.length).toBe(0);
//             // Asset enters
//             telemetry = { latitude: 0.5, longitude: 0.5, timestampUtc: new Date().toISOString(), assetId };
//             violations = service.checkGeofenceViolations(assetId, telemetry);
//             expect(violations.length).toBe(1);
//             expect(violations[0].violationType).toBe('ENTRY');
//             // Asset exits
//             telemetry = { latitude: 2, longitude: 2, timestampUtc: new Date().toISOString(), assetId };
//             violations = service.checkGeofenceViolations(assetId, telemetry);
//             expect(violations.length).toBe(1);
//             expect(violations[0].violationType).toBe('EXIT');
//         });
//     });

//     it('should clear violations', () => {
//         service.clearViolations();
//         expect(service.getViolations().length).toBe(0);
//     });
// });
