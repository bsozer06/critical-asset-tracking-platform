
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GeofenceService } from './geofence.service';
import { Geofence, GeoPoint, GeofenceViolation } from '../models/geofence.model';
import { TelemetryPoint } from '../models/telemetry-point.model';

describe('GeofenceService', () => {
	let service: GeofenceService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule]
		});
		service = TestBed.inject(GeofenceService);
		// Testlerde API çağrısı yapılmasın diye geofences'ı manuel set edelim
		service.geofences.set([]);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('isPointInPolygon', () => {
		const square: GeoPoint[] = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 1 },
			{ latitude: 1, longitude: 1 },
			{ latitude: 1, longitude: 0 }
		];
		it('should return true for point inside polygon', () => {
			expect(service.isPointInPolygon({ latitude: 0.5, longitude: 0.5 }, square)).toBeTrue();
		});
		it('should return false for point outside polygon', () => {
			expect(service.isPointInPolygon({ latitude: 2, longitude: 2 }, square)).toBeFalse();
		});
		it('should return false for polygon with less than 3 points', () => {
			expect(service.isPointInPolygon({ latitude: 0, longitude: 0 }, [{ latitude: 0, longitude: 0 }])).toBeFalse();
		});
	});

	describe('checkGeofenceViolations', () => {
		const geofence: Geofence = {
			id: 'g1',
			name: 'Test',
			description: 'Test geofence for unit testing',
			isActive: true,
			alertOnEntry: true,
			alertOnExit: true,
			boundary: { type: 'Polygon', coordinates: [[[0,0],[0,1],[1,1],[1,0],[0,0]]] },
			polygonPoints: [
				{ latitude: 0, longitude: 0 },
				{ latitude: 0, longitude: 1 },
				{ latitude: 1, longitude: 1 },
				{ latitude: 1, longitude: 0 },
				{ latitude: 0, longitude: 0 }
			]
		};
		const assetId = 'asset1';
		beforeEach(() => {
			service.geofences.set([geofence]);
			service.violations.set([]);
		});
		it('should detect entry and exit violations', () => {
			// Asset outside
			let telemetry: TelemetryPoint = {
				latitude: 2, longitude: 2, timestampUtc: new Date().toISOString(), assetId
			};
			let violations = service.checkGeofenceViolations(assetId, telemetry);
			expect(violations.length).toBe(0);
			// Asset enters
			telemetry = { latitude: 0.5, longitude: 0.5, timestampUtc: new Date().toISOString(), assetId };
			violations = service.checkGeofenceViolations(assetId, telemetry);
			expect(violations.length).toBe(1);
			expect(violations[0].violationType).toBe('ENTRY');
			// Asset exits
			telemetry = { latitude: 2, longitude: 2, timestampUtc: new Date().toISOString(), assetId };
			violations = service.checkGeofenceViolations(assetId, telemetry);
			expect(violations.length).toBe(1);
			expect(violations[0].violationType).toBe('EXIT');
		});
	});

	it('should clear violations', () => {
		service.violations.set([
			{ geofenceId: 'g1', assetId: 'a1', violationType: 'ENTRY', timestamp: new Date(), location: { latitude: 0, longitude: 0 } }
		]);
		service.violations.set([]);
		expect(service.violations().length).toBe(0);
	});
});
