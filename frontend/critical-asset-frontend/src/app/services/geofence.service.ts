import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, retry, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { GeoPoint, Geofence } from '../models/geofence.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  private _http = inject(HttpClient);
  private _authService = inject(AuthService);

  public geofences = signal<Geofence[]>([]);

  public geofenceMap = computed(() => {
    const map = new Map<string, Geofence>();
    this.geofences().forEach(g => map.set(g.id, g));
    return map;
  });

  constructor() {
    this._authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          this.geofences.set([]);
          return EMPTY;
        }
        return this.loadGeofencesFromApi();
      })
    ).subscribe({
      error: err => console.error('Failed to load geofences:', err)
    });
  }

  loadGeofencesFromApi(): Observable<Geofence[]> {
    return this._http.get<Geofence[]>(environment.geofenceUrl).pipe(
      retry({ count: 3, delay: 3000 }),
      tap(data => {
        const transformed = data.map(g => this._transformGeofence(g));
        this.geofences.set(transformed);
      })
    );
  }

  saveGeofence(newGeofence: Partial<Geofence>): Observable<Geofence> {
    return this._http.post<Geofence>(environment.geofenceUrl, newGeofence).pipe(
      tap(saved => {
        const transformed = this._transformGeofence(saved);
        this.geofences.update(current => [...current, transformed]);
      })
    );
  }

  toggleGeofenceActive(id: string, isActive: boolean): Observable<Geofence> {
    return this._http.patch<Geofence>(`${environment.geofenceUrl}/${id}`, { isActive }).pipe(
      tap(updated => {
        const transformed = this._transformGeofence(updated);
        this.geofences.update(current =>
          current.map(g => g.id === id ? transformed : g)
        );
      })
    );
  }

  deleteGeofence(id: string): Observable<void> {
    return this._http.delete<void>(`${environment.geofenceUrl}/${id}`).pipe(
      tap(() => {
        this.geofences.update(current => current.filter(g => g.id !== id));
      })
    );
  }

  private _transformGeofence(g: Geofence): Geofence {
    return {
      ...g,
      polygonPoints: g.boundary.coordinates[0].map((coord: number[]) => ({
        longitude: coord[0],
        latitude: coord[1]
      } as GeoPoint))
    };
  }
}
