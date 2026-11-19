const initialAssets = [
  { id: 'LT-104', kind: 'laptop', status: 'available', holder: '' },
  { id: 'DT-207', kind: 'desktop', status: 'assigned', holder: 'B' },
  { id: 'MN-302', kind: 'monitor', status: 'maintenance', holder: '' },
] as const;
type AssetStatus = (typeof initialAssets)[number]['status'];
type Asset = {
  id: string;
  kind: (typeof initialAssets)[number]['kind'];
  status: AssetStatus;
  holder: string;
};
type Action = 'checkout' | 'checkin' | 'damaged';
type AuditEvent = {
  action: Action;
  asset: string;
  holder: string;
  status: AssetStatus;
  description: string;
};
export const demoEmployees = ['A', 'B'] as const;

export function createAssetDemo() {
  let assets: Asset[] = [];
  const events: AuditEvent[] = [];
  function reset() {
    assets = initialAssets.map((asset) => ({ ...asset }));
    events.length = 0;
  }
  reset();
  return {
    get assets() {
      return assets;
    },
    events,
    reset,
    act(action: Action, id: string, employee: string, description: string) {
      const asset = assets.find((item) => item.id === id);
      if (!asset) return 'assetRequired';
      if (action === 'checkout') {
        if (asset.status !== 'available') return 'unavailable';
        if (!demoEmployees.some((id) => id === employee))
          return 'employeeRequired';
        if (employee === 'B') return 'offboardingEmployee';
        asset.holder = employee;
        asset.status = 'assigned';
      } else {
        if (asset.status !== 'assigned') return 'notAssigned';
        if (action === 'damaged' && !description.trim())
          return 'descriptionRequired';
        asset.status = action === 'damaged' ? 'maintenance' : 'available';
      }
      events.unshift({
        action,
        asset: asset.id,
        holder: asset.holder,
        status: asset.status,
        description: action === 'damaged' ? description.trim() : '',
      });
      if (action !== 'checkout') asset.holder = '';
      return 'updated';
    },
  };
}
