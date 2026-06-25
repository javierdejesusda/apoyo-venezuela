import type { Metadata } from 'next';
import React from 'react';

import { Megaphone } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import ReportLocationForm from '@/components/report-location-form';

export const metadata: Metadata = {
  title: 'Reportar una zona',
};

export default function ReportarPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl py-8">
      <PageHeader
        icon={Megaphone}
        eyebrow="Reportar"
        title="Reportar una zona"
        description="Comparte una zona afectada que necesita ayuda. Tu reporte ayuda a coordinar la respuesta, zona por zona."
      />
      <div className="mt-8">
        <ReportLocationForm />
      </div>
    </div>
  );
}
