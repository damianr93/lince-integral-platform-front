/**
 * Terminal de campo — OPERADOR_CAMPO
 * Captura de remitos con webcam + cola offline
 * Maquetado — Pendiente de integración con backend OCR
 */

import { useState } from 'react';
import { Camera, Upload, Wifi, WifiOff, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const MOCK_QUEUE = [
  { id: '1', status: 'synced', preview: 'Remito #1234', date: '25/03/2026 14:30' },
  { id: '2', status: 'pending', preview: 'Remito capturado (sin sincronizar)', date: '25/03/2026 15:10' },
  { id: '3', status: 'error', preview: 'Remito con errores OCR', date: '24/03/2026 09:00' },
];

const MOCK_HISTORY = [
  { id: '4', preview: 'Remito #1231', status: 'APROBADO', date: '23/03/2026' },
  { id: '5', preview: 'Remito #1230', status: 'VALIDO', date: '22/03/2026' },
  { id: '6', preview: 'Remito #1229', status: 'REVISION_PENDIENTE', date: '21/03/2026' },
];

export function OcrRemitosPage() {
  const [isOnline] = useState(true);
  const [showCapture, setShowCapture] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header + connectivity */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Terminal de Remitos</h1>
          <p className="text-sm text-muted-foreground">Captura y sincronización de remitos</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {isOnline ? 'Online' : 'Offline — guardando localmente'}
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
        <Clock className="h-3.5 w-3.5" />
        Módulo en desarrollo — Webcam y sincronización no disponibles aún
      </div>

      {/* Capture area */}
      {!showCapture ? (
        <div
          onClick={() => setShowCapture(true)}
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-foreground">Capturar remito</p>
          <p className="text-sm text-muted-foreground mt-1">Toca para activar la webcam y fotografiar el remito</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-black aspect-video flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-60" />
              <p className="text-sm opacity-60">Webcam no disponible en modo maquetado</p>
              <p className="text-xs opacity-40 mt-1">Se activará con MediaDevices.getUserMedia()</p>
            </div>
          </div>
          <div className="p-4 flex gap-2 bg-card">
            <button
              onClick={() => setShowCapture(false)}
              className="flex-1 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button className="flex-1 py-2 text-sm rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
              <Camera className="h-4 w-4" />
              Capturar
            </button>
          </div>
        </div>
      )}

      {/* Upload alternative */}
      <div className="border border-dashed border-border rounded-lg p-4 text-center">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">O subí una imagen desde el dispositivo</p>
        <button className="mt-2 px-4 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:bg-accent">
          Seleccionar archivo
        </button>
      </div>

      {/* Offline queue */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Cola de sincronización</h2>
        <div className="space-y-2">
          {MOCK_QUEUE.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
              <div className={`p-1.5 rounded-full ${
                item.status === 'synced' ? 'bg-green-100 dark:bg-green-900/30' :
                item.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                {item.status === 'synced' ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                 item.status === 'pending' ? <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /> :
                 <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.preview}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                item.status === 'synced' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {item.status === 'synced' ? 'Sincronizado' : item.status === 'pending' ? 'Pendiente' : 'Error OCR'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Mis remitos recientes</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Descripción</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_HISTORY.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2.5 text-foreground">{item.preview}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      item.status === 'APROBADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.status === 'VALIDO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {item.status === 'APROBADO' ? 'Aprobado' : item.status === 'VALIDO' ? 'Válido' : 'En revisión'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
