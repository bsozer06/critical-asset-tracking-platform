
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { SignalRService } from './services/signalr.service';
import { environment } from '../environments/environment';
import { CesiumMapComponent } from "./components/cesium-map/cesium-map.component";
import { ConnectionStatusBadgeComponent } from './components/connection-status-badge/connection-status-badge.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CesiumMapComponent, ConnectionStatusBadgeComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error' = 'disconnected';
  lastError: string | null = null;

  snackbarVisible = false;
  snackbarMessage = '';
  snackbarTimeout: any;

  constructor(private signalR: SignalRService) {}

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
