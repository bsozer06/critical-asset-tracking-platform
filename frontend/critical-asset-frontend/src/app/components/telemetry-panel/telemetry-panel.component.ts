import { Component, OnInit } from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { TelemetryPoint } from '../../models/telemetry-point.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-telemetry-panel',
  standalone: true,
  imports: [CommonModule,MatIconModule, MatTableModule, MatExpansionModule, MatInputModule, ScrollingModule],
  templateUrl: './telemetry-panel.component.html',
  styleUrls: ['./telemetry-panel.component.css']
})
export class TelemetryPanelComponent implements OnInit {
  displayedColumns: string[] = ['id', 'location', 'speed', 'date', 'expand'];
  dataSource = new MatTableDataSource<any>([]);
  filteredAssets: any[] = [];
  expandedAsset: any = null;
  filterValue = '';

  constructor(private signalR: SignalRService) {}

  ngOnInit() {
    this.signalR.telemetry$.subscribe((pt: TelemetryPoint | null) => {
      if (!pt) return;
      // Asset listte varsa güncelle, yoksa ekle
      const idx = this.dataSource.data.findIndex((a: any) => a.id === pt.assetId);
      const asset = {
        id: pt.assetId,
        location: `${pt.latitude.toFixed(5)}, ${pt.longitude.toFixed(5)}`,
        speed: pt.speedMps?.toFixed(2) ?? '-',
        date: pt.timestampUtc,
        raw: pt
      };
      if (idx > -1) {
        this.dataSource.data[idx] = asset;
      } else {
        this.dataSource.data.push(asset);
      }
      this.dataSource._updateChangeSubscription();
      this.applyFilterInternal();
    });
    this.filteredAssets = this.dataSource.data;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterValue = filterValue;
    this.applyFilterInternal();
  }

  applyFilterInternal() {
    if (!this.filterValue) {
      this.filteredAssets = this.dataSource.data;
    } else {
      this.filteredAssets = this.dataSource.data.filter(asset =>
        asset.id.toLowerCase().includes(this.filterValue) ||
        asset.location.toLowerCase().includes(this.filterValue)
      );
    }
  }

  toggleRow(asset: any) {
    this.expandedAsset = this.expandedAsset === asset ? null : asset;
  }
}
