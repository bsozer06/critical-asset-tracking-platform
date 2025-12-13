
import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { TelemetryPoint } from '../models/telemetry-point.model';

@Injectable({ providedIn: 'root' })
export class SignalRService {

  private hubConnection!: signalR.HubConnection;
  private telemetrySubject = new BehaviorSubject<TelemetryPoint | null>(null);
  public telemetry$ = this.telemetrySubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting' | 'error'>('disconnected');
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private lastErrorSubject = new BehaviorSubject<string | null>(null);
  public lastError$ = this.lastErrorSubject.asObservable();

  constructor(private ngZone: NgZone) {}


  public async startConnection(hubUrl: string) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl) // e.g. http://localhost:5000/hubs/telemetry
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('telemetry-received', (data: any) => {
      this.ngZone.run(() => {
        this.telemetrySubject.next(data as TelemetryPoint);
      });
    });

    this.hubConnection.onreconnecting((error) => {
      this.ngZone.run(() => {
        this.connectionStatusSubject.next('reconnecting');
        this.lastErrorSubject.next(error ? error.message : 'Reconnecting...');
      });
    });

    this.hubConnection.onreconnected(() => {
      this.ngZone.run(() => {
        this.connectionStatusSubject.next('connected');
        this.lastErrorSubject.next(null);
      });
    });

    this.hubConnection.onclose((error) => {
      this.ngZone.run(() => {
        this.connectionStatusSubject.next('disconnected');
        if (error) {
          this.lastErrorSubject.next(error.message);
        }
      });
    });

    try {
      await this.hubConnection.start();
      this.ngZone.run(() => {
        this.connectionStatusSubject.next('connected');
        this.lastErrorSubject.next(null);
      });
      console.log('SignalR connected');
    } catch (err: any) {
      this.ngZone.run(() => {
        this.connectionStatusSubject.next('error');
        this.lastErrorSubject.next(err?.message || 'Unknown error');
      });
      throw err;
    }
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.connectionStatusSubject.next('disconnected');
    }
  }
}
