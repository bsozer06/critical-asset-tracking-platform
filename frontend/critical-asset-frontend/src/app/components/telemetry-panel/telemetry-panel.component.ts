import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
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
  styleUrls: ['./telemetry-panel.component.css'],
  // animations: [
  //   trigger('rowExpandAnimation', [
  //     state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden', opacity: 0 })),
  //     state('expanded', style({ height: '*', visibility: 'visible', opacity: 1 })),
  //     transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  //   ])
  // ]
})
export class TelemetryPanelComponent implements OnInit {
  displayedColumns: string[] = ['id', 'location', 'speed', 'date', 'expand'];
  dataSource = new MatTableDataSource<any>([]);
  filteredAssets: any[] = [];
  expandedAssetId: string | null = null;
  filterValue = '';

  constructor(private signalR: SignalRService) {}

  /**
   * Initializes the component by subscribing to the SignalR telemetry stream.
   * 
   * On receiving a new telemetry point, updates the asset list in the data source:
   * - If the asset already exists, its data is updated.
   * - If the asset does not exist, it is added to the list.
   * 
   * Each asset entry includes its ID, formatted location, speed, timestamp, and the raw telemetry data.
   * After updating the data source, applies the internal filter to refresh the displayed list.
   * 
   * Also initializes the filtered assets list with the current data source.
   */
  ngOnInit() {
    this.signalR.telemetry$.subscribe((pt: TelemetryPoint | null) => {
      if (!pt) return;
      const currentData = [...this.dataSource.data];
      const idx = currentData.findIndex((a: any) => a.id === pt.assetId);
      const asset = {
        id: pt.assetId,
        location: `${pt.latitude.toFixed(5)}, ${pt.longitude.toFixed(5)}`,
        speed: pt.speedMps?.toFixed(2) ?? '-',
        date: pt.timestampUtc,
        raw: pt
      };
      if (idx > -1) {
        currentData[idx] = asset;
      } else {
        currentData.push(asset);
      }
      this.dataSource.data = currentData;
      this.applyFilterInternal();
    });
    this.filteredAssets = [...this.dataSource.data];
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterValue = filterValue;
    this.applyFilterInternal();
  }

  applyFilterInternal() {
    if (!this.filterValue) {
      this.filteredAssets = [...this.dataSource.data];
    } else {
      this.filteredAssets = this.dataSource.data.filter(asset =>
        asset.id.toLowerCase().includes(this.filterValue) ||
        asset.location.toLowerCase().includes(this.filterValue)
      );
    }
  }

  toggleRow(asset: any) {
    this.expandedAssetId = this.expandedAssetId === asset.id ? null : asset.id;
    console.log('expandedAssetId', this.expandedAssetId);
  }

  isExpanded(asset: any) {
    return this.expandedAssetId === asset.id;
  }

  isExpansionDetailRow = (_: number, row: any) => this.isExpanded(row);
}
