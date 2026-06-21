import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';

@Injectable({ providedIn: 'root' })
export class CesiumViewerService {
  private _viewer: Cesium.Viewer | null = null;

  setViewer(viewer: Cesium.Viewer): void {
    this._viewer = viewer;
  }

  getViewer(): Cesium.Viewer | null {
    return this._viewer;
  }
}
