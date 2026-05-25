export interface Driver {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  active: boolean;
  lastSessionAt?: string | null;
}

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  speedMetersPerSecond?: number | null;
  recordedAtMillis: number;
}

export interface DriverListItem extends Driver {
  assignedRouteId: string | null;
  assigned: boolean;
  location: DriverLocation | null;
}
