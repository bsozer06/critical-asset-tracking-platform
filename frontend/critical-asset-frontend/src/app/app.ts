
import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { SignalRService } from './services/signalr.service';
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
    NgIf,
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

  snackbarVisible = false;
  snackbarMessage = '';
  snackbarTimeout: any;

  // Geofence properties
  activeViolations: GeofenceViolation[] = [];
  showGeofenceAlert = false;
  isDrawingGeofence = false;
  geofences: Geofence[] = [];

  constructor(private signalR: SignalRService) { }

  ngOnInit() {
    this.signalR.connectionStatus$.subscribe(status => {
      this.connectionStatus = status;
    });
    this.signalR.lastError$.subscribe(err => {
      this.lastError = err;
      if (err) {
        this.showSnackbar(err);
      }
    });
    const url = environment.signalRHubUrl;
    this.signalR.startConnection(url).catch(err => {
      // Hata zaten lastError$ ile yakalanıyor
    });
  }

  onAssetSelected(asset: TelemetryPoint) {
    // Zoom to the selected asset on the map
    if (this.cesiumMapComponent) {
      this.cesiumMapComponent.zoomToAsset(asset.assetId);
    }
  }

  /**
   * Start drawing a new geofence
   */
  // startDrawingGeofence() {
  //   if (this.cesiumMapComponent) {
  //     this.isDrawingGeofence = true;
  //     this.cesiumMapComponent.startDrawingGeofence();
  //   }
  // }

  // /**
  //  * Cancel current geofence drawing
  //  */
  // cancelGeofenceDrawing() {
  //   if (this.cesiumMapComponent) {
  //     this.cesiumMapComponent.cancelDrawing();
  //     this.isDrawingGeofence = false;
  //   }
  // }

  /**
   * Handle new geofence created
   */
  onGeofenceCreated(geofence: Geofence) {
    this.geofences.push(geofence);
    this.isDrawingGeofence = false;
    this.showSnackbar(`Geofence '${geofence.name}' created successfully`);
  }

  /**
   * Handle geofence violation detected
   */
  onViolationDetected(violation: GeofenceViolation) {
    // Add to active violations
    this.activeViolations.push(violation);
    this.showGeofenceAlert = true;

    // Play alert sound if available
    this._playAlertSound();

    // Auto-remove after 15 seconds
    setTimeout(() => {
      const index = this.activeViolations.indexOf(violation);
      if (index > -1) {
        this.activeViolations.splice(index, 1);
      }
    }, 15000);
  }

  /**
   * Handle alert dismissed
   */
  onAlertDismissed() {
    this.showGeofenceAlert = false;
    this.activeViolations = [];
  }

  private _playAlertSound() {
    // Create a simple beep sound
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
