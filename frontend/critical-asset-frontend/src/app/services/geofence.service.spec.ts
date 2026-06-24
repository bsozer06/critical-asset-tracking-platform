
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

});
