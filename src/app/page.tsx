'use client';
import { TerraProvider } from '@/lib/store';
import { XFarmShell } from '@/components/xfarm/XFarmShell';

export default function Page() {
  return (
    <TerraProvider>
      <XFarmShell />
    </TerraProvider>
  );
}
