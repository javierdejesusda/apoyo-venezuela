import type { Metadata } from 'next';
import React from 'react';

import ReportLocationForm from '@/components/report-location-form';

export const metadata: Metadata = {
  title: 'Reportar una zona',
};

export default function ReportarPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-2xl font-bold text-ink mb-2">Reportar una zona</h1>
      <p className="text-ink-soft mb-8">
        Comparte una zona afectada y que necesita ayuda. Tu reporte ayuda a coordinar la
        respuesta.
      </p>
      <ReportLocationForm />
    </div>
  );
}
