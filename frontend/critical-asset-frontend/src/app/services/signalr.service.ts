import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { Telemetry } from '../models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  private telemetrySubject = new Subject<Telemetry>();

  public telemetry$ = this.telemetrySubject.asObservable();

  connect(clearance: string = 'UNCLASSIFIED', hubUrl = '/hubs/telemetry') {
    // Build full URL — if API hosted at different origin, supply absolute URL
    const url = `${hubUrl}?clearance=${encodeURIComponent(clearance)}`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.on('telemetry-received', (data: any) => {
      // backend sends TelemetryPoint object; adapt if necessary
      const telemetry: Telemetry = {
        assetId: data.assetId ?? data.AssetId ?? data.assetId,
        timestampUtc: data.timestampUtc ?? data.TimestampUtc ?? new Date().toISOString(),
        latitude: data.latitude ?? data.Latitude ?? 0,
        longitude: data.longitude ?? data.Longitude ?? 0,
        altitudeMeters: data.altitudeMeters ?? data.AltitudeMeters ?? 0,
        speedMetersPerSecond: data.speedMps ?? data.speedMps ?? data.speedMps ?? 0,
        headingDegrees: data.headingDeg ?? data.headingDeg ?? data.headingDeg ?? 0,
        classification: data.classification ?? data.classification
      };
      this.telemetrySubject.next(telemetry);
    });

    return this.hubConnection.start();
  }

  disconnect() {
    return this.hubConnection?.stop();
  }
}
