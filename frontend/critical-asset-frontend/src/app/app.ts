import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SignalRService } from './services/signalr.service';
import { AuthService, CurrentUser } from './services/auth.service';
import { environment } from '../environments/environment';
import { CesiumMapComponent } from "./components/cesium-map/cesium-map.component";
import { ConnectionStatusBadgeComponent } from './components/connection-status-badge/connection-status-badge.component';
import { TelemetryPanelComponent } from "./components/telemetry-panel/telemetry-panel.component";
import { GeofenceAlertComponent } from './components/geofence-alert/geofence-alert.component';
import { TelemetryPoint } from './models/telemetry-point.model';
import { GeofenceViolation, Geofence } from './models/geofence.model';
import { GeofencePanelComponent } from "./components/geofence-panel/geofence-panel.component";

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    CesiumMapComponent,
    ConnectionStatusBadgeComponent,
    TelemetryPanelComponent,
    GeofenceAlertComponent,
    GeofencePanelComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  @ViewChild(CesiumMapComponent) cesiumMapComponent?: CesiumMapComponent;
  @ViewChild(TelemetryPanelComponent) telemetryPanelComponent?: TelemetryPanelComponent;

  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error' = 'disconnected';
  lastError: string | null = null;
  currentUser: CurrentUser | null = null;

  snackbarVisible = false;
  snackbarMessage = '';
  snackbarTimeout: any;

  activeViolations: GeofenceViolation[] = [];
  showGeofenceAlert = false;
  isDrawingGeofence = false;
  geofences: Geofence[] = [];

  constructor(
    private signalR: SignalRService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.signalR.connectionStatus$.subscribe(status => {
      this.connectionStatus = status;
    });
    this.signalR.lastError$.subscribe(err => {
      this.lastError = err;
      if (err) {
        this.showSnackbar(err);
      }
    });
    this.signalR.violation$.subscribe(violation => {
      if (violation) this.onViolationDetected(violation);
    });

    // Only start SignalR after authentication is confirmed
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.signalR.startConnection(environment.signalRHubUrl).catch(_err => {});
      } else {
        this.signalR.stopConnection();
      }
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  onAssetSelected(asset: TelemetryPoint) {
    if (this.cesiumMapComponent) {
      this.cesiumMapComponent.zoomToAsset(asset.assetId);
    }
  }

  onGeofenceCreated(geofence: Geofence) {
    this.geofences.push(geofence);
    this.isDrawingGeofence = false;
    this.showSnackbar(`Geofence '${geofence.name}' created successfully`);
  }

  onViolationDetected(violation: GeofenceViolation) {
    this.activeViolations.push(violation);
    this.showGeofenceAlert = true;

    this._playAlertSound();

    setTimeout(() => {
      const index = this.activeViolations.indexOf(violation);
      if (index > -1) {
        this.activeViolations.splice(index, 1);
      }
    }, 15000);
  }

  onAlertDismissed() {
    this.showGeofenceAlert = false;
    this.activeViolations = [];
  }

  private _playAlertSound() {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  showSnackbar(message: string) {
    this.snackbarMessage = message;
    this.snackbarVisible = true;
    if (this.snackbarTimeout) {
      clearTimeout(this.snackbarTimeout);
    }
    this.snackbarTimeout = setTimeout(() => {
      this.snackbarVisible = false;
    }, 4000);
  }
}
