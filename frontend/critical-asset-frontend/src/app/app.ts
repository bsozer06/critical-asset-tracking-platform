import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SignalRService } from './services/signalr.service';
import { environment } from '../environments/environment';
import { CesiumMapComponent } from "./components/cesium-map/cesium-map.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CesiumMapComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
    constructor(private signalR: SignalRService) {}
  
    async ngOnInit() {
      try {
        const url = environment.signalRHubUrl;
        await this.signalR.startConnection(url);
      } catch (err) {
        console.error('SignalR failed to start', err);
      }
  }
}
