import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interceptor global para detectar errores de conexión/servidor y normalizarlos
 * mostrando un mensaje 503 amigable al usuario cuando el servidor no responde.
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: any) => {
        // Network error / CORS failure often comes as status 0 or ProgressEvent
        const isNetworkError = err instanceof HttpErrorResponse && err.status === 0;

        // If the browser reports offline, treat as service unavailable
        const browserOffline = typeof navigator !== 'undefined' && !(navigator as any).onLine === true;

        if (isNetworkError || browserOffline || (err instanceof HttpErrorResponse && err.status >= 500)) {
          // Map network/server errors to a 503 HttpErrorResponse with a user-friendly message.
          const userFacing = new HttpErrorResponse({
            error: 'Servicio No Disponible. Contacte con TI.',
            status: 503,
            statusText: 'Service Unavailable',
            url: req.url
          });

          return throwError(() => userFacing);
        }

        return throwError(() => err);
      })
    );
  }
}
