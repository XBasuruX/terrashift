import { TerraProvider } from '@/lib/store';
import { Shell } from '@/components/Shell';
export default function Page() {
  return (
    <TerraProvider>
      <Shell />
    </TerraProvider>
  );
}
