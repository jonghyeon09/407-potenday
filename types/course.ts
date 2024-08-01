export interface Location {
  id: number;
  name: string;
  visited: boolean;
  coordinate: [number, number];
}

export type Course = Location[][];
export type LocationIndex = [number, number];
