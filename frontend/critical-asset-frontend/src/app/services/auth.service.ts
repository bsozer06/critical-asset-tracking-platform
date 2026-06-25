import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  accessToken: string;
  email: string;
  role: string;
}

export interface CurrentUser {
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authUrl = environment.authUrl;
  private _accessToken: string | null = null;
  private _currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  public currentUser$ = this._currentUser$.asObservable();
  public isAuthenticated$ = this._currentUser$.pipe(map(u => u !== null));

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(tap(res => this.setSession(res)));
  }

  register(email: string, password: string, role: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/register`, { email, password, role }, { withCredentials: true })
      .pipe(tap(res => this.setSession(res)));
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/refresh`, {}, { withCredentials: true })
      .pipe(tap(res => this.setSession(res)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.authUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  tryRestoreSession(): Observable<AuthResponse> {
    return this.refresh();
  }

  getAccessToken(): string | null {
    return this._accessToken;
  }

  isAdmin(): boolean {
    return this._currentUser$.value?.role === 'Admin';
  }

  private setSession(res: AuthResponse): void {
    this._accessToken = res.accessToken;
    this._currentUser$.next({ email: res.email, role: res.role });
  }

  private clearSession(): void {
    this._accessToken = null;
    this._currentUser$.next(null);
  }
}
