/**
 * DEMO-OCR-MOCK — Datos ficticios solo para demos / venta. No persisten en API.
 * Eliminar: este archivo completo, OcrDemoToolbar.tsx, referencias en OcrDashboardPage,
 * OcrFacturasPage, DocumentDetailModal (props previewOnlyDocument + bloque productos).
 * Buscar en repo: DEMO-OCR-MOCK
 */

import type { OcrDocument } from '@/types/ocr.types';
import { DocumentStatus, DocumentType, OcrRole } from '@/types/ocr.types';

export const OCR_DEMO_STORAGE_ADMIN = 'lince-ocr-demo-admin';
export const OCR_DEMO_STORAGE_FACTURAS = 'lince-ocr-demo-facturas';

const MOCK_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect fill="#e4e4e7" width="640" height="400"/><text x="320" y="200" text-anchor="middle" fill="#71717a" font-family="system-ui,sans-serif" font-size="14">Vista previa demo · documento ficticio</text></svg>`,
  );

const now = new Date().toISOString();

const demoProductosRemito = [
  { codigo: 'LIN-CEM-001', descripcion: 'Cemento Portland CPC 50kg', cantidad: 120, u: 'bolsa', precioUnit: '8.450,00', subtotal: '1.014.000,00' },
  { codigo: 'LIN-HIE-02', descripcion: 'Hierro del 8 mm (barra 12 m)', cantidad: 45, u: 'un.', precioUnit: '12.300,00', subtotal: '553.500,00' },
  { codigo: 'LIN-ARE-03', descripcion: 'Arena gruesa m³', cantidad: 18, u: 'm³', precioUnit: '22.000,00', subtotal: '396.000,00' },
];

function baseDoc(partial: Omit<OcrDocument, 'id' | 'createdAt' | 'updatedAt'> & { id: string }): OcrDocument {
  return {
    ...partial,
    createdAt: now,
    updatedAt: now,
  };
}

export const DEMO_DOCUMENT_IDS = new Set([
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000013',
]);

export function isOcrDemoDocumentId(id: string): boolean {
  return DEMO_DOCUMENT_IDS.has(id);
}

export function createDemoAdminDocuments(): OcrDocument[] {
  return [
    baseDoc({
      id: '00000000-0000-4000-8000-000000000001',
      type: DocumentType.REMITO,
      status: DocumentStatus.REVISION_PENDIENTE,
      uploadedBy: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      uploadedByRole: OcrRole.OPERADOR_CAMPO,
      s3Key: 'ocr/demo/remito-ejemplo.jpg',
      s3ThumbnailKey: null,
      viewUrl: MOCK_IMG,
      extractedData: {
        numero: 'R-2026-004812',
        fecha: '28/03/2026',
        proveedor: 'Distribuidora Norte S.A.',
        destinatario: 'Lince Construcciones · Obra Ruta 9 km 42',
        total: '1.963.500,00',
        productos: JSON.stringify(demoProductosRemito),
        observaciones: 'Entrega parcial · pendiente remito complementario según OC 8841',
      },
      validationErrors: null,
      correctedBy: null,
      correctedAt: null,
      reviewedBy: null,
      approvedBy: null,
      approvedAt: null,
      rejectReason: null,
    }),
    baseDoc({
      id: '00000000-0000-4000-8000-000000000002',
      type: DocumentType.REMITO,
      status: DocumentStatus.CON_ERRORES,
      uploadedBy: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      uploadedByRole: OcrRole.OPERADOR_CAMPO,
      s3Key: 'ocr/demo/remito-borroso.jpg',
      s3ThumbnailKey: null,
      viewUrl: MOCK_IMG,
      extractedData: {
        numero: 'R-2026-—',
        fecha: '—',
        proveedor: 'Ferretería El',
        destinatario: '',
        total: '18400',
        productos: JSON.stringify([
          { codigo: '—', descripcion: 'Tornillos (línea ilegible)', cantidad: 1, u: 'caja', precioUnit: '—', subtotal: '—' },
        ]),
      },
      validationErrors: ['Campo fecha no detectado con confianza', 'Total posiblemente truncado'],
      correctedBy: null,
      correctedAt: null,
      reviewedBy: null,
      approvedBy: null,
      approvedAt: null,
      rejectReason: null,
    }),
    baseDoc({
      id: '00000000-0000-4000-8000-000000000011',
      type: DocumentType.FACTURA,
      status: DocumentStatus.VALIDO,
      uploadedBy: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      uploadedByRole: OcrRole.ADMINISTRATIVO,
      s3Key: 'ocr/demo/factura-a.pdf',
      s3ThumbnailKey: null,
      viewUrl: null,
      extractedData: {
        numero: '0003-00089214',
        fecha: '27/03/2026',
        proveedor: 'Materiales del Sur S.R.L.',
        cuit: '30-70891234-5',
        tipo: 'A',
        neto: '1.239.669,42',
        iva: '260.330,58',
        total: '1.500.000,00',
      },
      validationErrors: null,
      correctedBy: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      correctedAt: now,
      reviewedBy: null,
      approvedBy: null,
      approvedAt: null,
      rejectReason: null,
    }),
    baseDoc({
      id: '00000000-0000-4000-8000-000000000012',
      type: DocumentType.FACTURA,
      status: DocumentStatus.CON_ERRORES,
      uploadedBy: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      uploadedByRole: OcrRole.ADMINISTRATIVO,
      s3Key: 'ocr/demo/factura-scan.png',
      s3ThumbnailKey: null,
      viewUrl: MOCK_IMG,
      extractedData: {
        numero: '0003-00088—',
        fecha: '27/03/2026',
        proveedor: 'Materiales del Sur S.R.L.',
        cuit: '',
        tipo: 'A',
        neto: '1.239.669,42',
        iva: '260.330,58',
        total: '1.500.000,00',
      },
      validationErrors: ['Campo cuit no detectado', 'Número de comprobante incompleto'],
      correctedBy: null,
      correctedAt: null,
      reviewedBy: null,
      approvedBy: null,
      approvedAt: null,
      rejectReason: null,
    }),
    baseDoc({
      id: '00000000-0000-4000-8000-000000000013',
      type: DocumentType.FACTURA,
      status: DocumentStatus.REVISADO,
      uploadedBy: 'd4e5f6a7-b8c9-0123-def0-234567890123',
      uploadedByRole: OcrRole.ADMINISTRATIVO,
      s3Key: 'ocr/demo/factura-corrected.pdf',
      s3ThumbnailKey: null,
      viewUrl: null,
      extractedData: {
        numero: '0001-00012004',
        fecha: '25/03/2026',
        proveedor: 'Logística Pampeana S.A.',
        cuit: '33-65987102-9',
        tipo: 'B',
        neto: '450.000,00',
        iva: '0,00',
        total: '450.000,00',
      },
      validationErrors: null,
      correctedBy: 'd4e5f6a7-b8c9-0123-def0-234567890123',
      correctedAt: now,
      reviewedBy: null,
      approvedBy: null,
      approvedAt: null,
      rejectReason: null,
    }),
  ];
}

export function createDemoFacturasForUser(userId: string): OcrDocument[] {
  return createDemoAdminDocuments()
    .filter((d) => d.type === DocumentType.FACTURA)
    .map((d) => ({ ...d, uploadedBy: userId }));
}

export function filterDemoDocuments(
  items: OcrDocument[],
  filters: { type?: DocumentType; status?: DocumentStatus; dateFrom?: string },
): OcrDocument[] {
  return items.filter((d) => {
    if (filters.type && d.type !== filters.type) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (filters.dateFrom) {
      const t = new Date(d.createdAt).getTime();
      const from = new Date(filters.dateFrom).getTime();
      if (t < from) return false;
    }
    return true;
  });
}

export function paginateDemo<T>(items: T[], page: number, limit: number): { slice: T[]; total: number; pages: number } {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * limit;
  const slice = items.slice(start, start + limit);
  return { slice, total, pages };
}
