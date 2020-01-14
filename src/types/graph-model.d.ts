declare module 'graph-model' {
  export interface Node {
    label: string;
    rank: number;
    horizontalPosition: number;
    children: string[];
    parents: string[];
    canMove: boolean;
  }

  export interface Nodes {
    [key: string]: Node;
  }

  export interface Layout {
    nodeCoordinates: NodeCoordinates;
    edges: Edges;
  }

  export interface NodeCoordinates {
    [key: string]: Coordinate;
  }

  export interface Coordinate {
    x: number;
    y: number;
  }

  export interface Edges {
    [key: string]: Edge;
  }

  export interface Edge {
    start: string;
    end: string;
    points: Array<Coordinate>;
  }

  export interface ExpandedNodes {
    [key: string]: {
      width: number;
      height: number;
    };
  }
}
