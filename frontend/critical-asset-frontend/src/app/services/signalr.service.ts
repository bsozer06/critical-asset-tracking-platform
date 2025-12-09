import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { TelemetryPoint } from '../models/telemetry-point.model';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  private telemetrySubject = new BehaviorSubject<TelemetryPoint | null>(null);
  public telemetry$ = this.telemetrySubject.asObservable();

  constructor(private ngZone: NgZone) {}

  public async startConnection(hubUrl: string) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl) // e.g. http://localhost:5000/hubs/telemetry
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('telemetry-received', (data: any) => {
      // run inside Angular zone to trigger change detection
      this.ngZone.run(() => {
        this.telemetrySubject.next(data as TelemetryPoint);
      });
    });

    await this.hubConnection.start();
    console.log('SignalR connected');
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
