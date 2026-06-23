
import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { TelemetryPoint } from '../models/telemetry-point.model';
import { GeofenceViolation } from '../models/geofence.model';

@Injectable({ providedIn: 'root' })
export class SignalRService {

  private _telemetrySubject = new BehaviorSubject<TelemetryPoint | null>(null);
  public telemetry$ = this._telemetrySubject.asObservable();
  private _violationSubject = new BehaviorSubject<GeofenceViolation | null>(null);
  public violation$ = this._violationSubject.asObservable();
  private _connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting' | 'error'>('disconnected');
  public connectionStatus$ = this._connectionStatusSubject.asObservable();
  private _lastErrorSubject = new BehaviorSubject<string | null>(null);
  public lastError$ = this._lastErrorSubject.asObservable();
  private _hubConnection!: signalR.HubConnection;

  constructor(private ngZone: NgZone) { }


  public async startConnection(hubUrl: string) {
    this._hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl) // e.g. http://localhost:5000/hubs/telemetry
      .withAutomaticReconnect()
      .build();

    this._hubConnection.on('telemetry-received', (data: any) => {
      this.ngZone.run(() => {
        this._telemetrySubject.next(data as TelemetryPoint);
      });
    });

    this._hubConnection.on('violation-detected', (data: any) => {
      this.ngZone.run(() => {
        this._violationSubject.next(data as GeofenceViolation);
      });
    });

    this._hubConnection.onreconnecting((error: Error | undefined) => {
      this.ngZone.run(() => {
        this._connectionStatusSubject.next('reconnecting');
        this._lastErrorSubject.next(error ? error.message : 'Reconnecting...');
      });
    });

    this._hubConnection.onreconnected(() => {
      this.ngZone.run(() => {
        this._connectionStatusSubject.next('connected');
        this._lastErrorSubject.next(null);
      });
    });

    this._hubConnection.onclose((error: Error | undefined) => {
      this.ngZone.run(() => {
        this._connectionStatusSubject.next('disconnected');
        if (error) {
          this._lastErrorSubject.next(error.message);
        }
      });
    });

    try {
      await this._hubConnection.start();
      this.ngZone.run(() => {
        this._connectionStatusSubject.next('connected');
        this._lastErrorSubject.next(null);
      });
      console.log('SignalR connected');
    } catch (err: any) {
      this.ngZone.run(() => {
        this._connectionStatusSubject.next('error');
        this._lastErrorSubject.next(err?.message || 'Unknown error');
      });
      throw err;
    }
  }

  public stopConnection() {
    if (this._hubConnection) {
      this._hubConnection.stop();
      this._connectionStatusSubject.next('disconnected');
    }
  }
}
