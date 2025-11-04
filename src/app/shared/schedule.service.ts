import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private _data = signal<any[] | null>(null);
  readonly data = this._data.asReadonly();

  constructor(private http: HttpClient) {}

  async fetch(): Promise<any[]> {
    // Return cached if available
    const cached = this._data();
    if (cached) {
      return cached;
    }

    try {
      const url = `${environment.apiUrl}/cronactivdiarias`;
      const resp = await firstValueFrom(this.http.get<any[]>(url));
      const arr = Array.isArray(resp) ? resp : [];
      this._data.set(arr);
      return arr;
    } catch (e) {
      // Log the error so callers can inspect console/network issues
      console.error('[ScheduleService] fetch error', e);
      
      // DATOS ORIGINALES COMPLETOS - 10 actividades
      const mockData = [
        {
          actividad_descripcion: 'Factoraje (Lupita)',
          archivo_nombre: 'factoraje.xlsx',
          dias_carga: '5',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'Relación de pagos (Lupita)',
          archivo_nombre: 'relacion_pagos.xlsx',
          dias_carga: '2',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'Pipeline Transporte (Ricardo)',
          archivo_nombre: 'pipeline_transporte.xlsx',
          dias_carga: '1',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'Tarifario transporte (Ricardo) SAF tiene también las tarifas, pero faltan los comentarios',
          archivo_nombre: 'tarifario_transporte.xlsx',
          dias_carga: '4',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'Reporte de evidencias pendientes (Blanquita) Se Puede sacar de SAF y se vuelve tabla dinámica',
          archivo_nombre: 'evidencias_pendientes.xlsx',
          dias_carga: '4',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'Pronóstico de cobranza (Chio) SAF: los días pronosticados pueden variar desde: valija 10 días, portal 8 días de desfase.',
          archivo_nombre: 'pronostico_cobranza.xlsx',
          dias_carga: '4',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'Balance general, estado de resultados y balanza de comprobación (SAICO)',
          archivo_nombre: 'balance_general.xlsx',
          dias_carga: '5',
          frecuencia: 'Mensual',
          frequency: 'Mensual'
        },
        {
          actividad_descripcion: 'Pipeline Comercial (Edgar)',
          archivo_nombre: 'pipeline_comercial.xlsx',
          dias_carga: '5',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'Cartera de clientes SAF',
          archivo_nombre: 'cartera_clientes.xlsx',
          dias_carga: '5',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        },
        {
          actividad_descripcion: 'OnTime',
          archivo_nombre: 'ontime_report.xlsx',
          dias_carga: '5',
          frecuencia: 'Semanal',
          frequency: 'Semanal'
        }
      ];
      
      this._data.set(mockData);
      return mockData;
    }
  }

  clear() {
    this._data.set(null);
  }
}
