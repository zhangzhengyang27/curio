/**
 * 百度地图 BMapGL 全局类型声明
 * 从 ai-datav 项目迁移而来
 */

type BMapGLMap = {
  centerAndZoom: (point: unknown, zoom: number) => void;
  enableScrollWheelZoom: (isOpen?: boolean) => void;
  setHeading: (heading: number) => void;
  setTilt: (tilt: number) => void;
  addOverlay: (overlay: unknown) => void;
  openInfoWindow: (infoWindow: unknown, point: unknown) => void;
  addEventListener: (type: string, handler: (event: unknown) => void) => void;
  removeEventListener: (type: string, handler: (event: unknown) => void) => void;
  removeOverlay: (overlay: unknown) => void;
  clearOverlays: () => void;
  setViewport: (view: unknown[]) => void;
  getZoom: () => number;
  setZoom: (zoom: number) => void;
  getCenter: () => unknown;
  getPanes: () => BMapGLPanes;
  pointToOverlayPixel: (point: unknown) => BMapGLOverlayPixel;
  startViewAnimation: (animation: unknown) => void;
  cancelViewAnimation: (animation: unknown) => void;
  setMapStyleV2: (options: { styleId: string }) => void;
  setMapType: (mapType: number) => void;
  addControl: (control: unknown) => void;
  removeControl: (control: unknown) => void;
  addTileLayer: (layer: unknown) => void;
  removeTileLayer: (layer: unknown) => void;
  destroy: () => void;
};

type BMapGLViewAnimation = unknown;

type BMapGLLibTrackAnimation = {
  start: () => void;
  cancel: () => void;
};

type BMapGLHeatmapOverlay = {
  setDataSet: (dataset: {
    max: number;
    data: { lng: number; lat: number; count: number }[];
  }) => void;
  show: () => void;
  hide: () => void;
};

type BMapGLMarkerClusterer = {
  addMarker: (marker: unknown) => void;
  addMarkers: (markers: unknown[]) => void;
  clearMarkers: () => void;
  setStyles: (styles: Record<string, unknown>[]) => void;
};

type BMapGLLuShu = {
  start: () => void;
  stop: () => void;
  pause: () => void;
  clear: () => void;
};

type BMapGLCurveLine = {
  enableEditing: () => void;
  disableEditing: () => void;
};

type BMapGLDrawingManager = {
  open: () => void;
  close: () => void;
  setDrawingMode: (mode: string) => void;
  getDrawingMode: () => string;
  clearOverlays: () => void;
  addEventListener: (type: string, handler: (event: unknown) => void) => void;
  removeEventListener: (type: string, handler: (event: unknown) => void) => void;
};

type BMapGLDistanceTool = {
  open: () => void;
  close: () => void;
  addEventListener: (type: string, handler: (event: unknown) => void) => void;
  removeEventListener: (type: string, handler: (event: unknown) => void) => void;
};

type BMapGLRichMarker = {
  setContent: (content: string | HTMLElement) => void;
};

type BMapGLInfoBox = {
  open: (anchor: unknown) => void;
  close: () => void;
  setContent: (content: string | HTMLElement) => void;
};

type BMapGLBoundary = {
  get: (name: string, callback: (result: { boundaries: string[] }) => void) => void;
};

type BMapGLDrivingRoute = {
  search: (start: string | unknown, end: string | unknown) => void;
  getStatus: () => number;
};

type BMapGLTransitRoute = {
  search: (start: string | unknown, end: string | unknown) => void;
  getStatus: () => number;
};

type BMapGLLocalSearch = {
  search: (keyword: string) => void;
  searchNearby: (keyword: string, center: unknown, radius: number) => void;
  getStatus: () => number;
};

type BMapGLOverlayPixel = {
  x: number;
  y: number;
};

type BMapGLPanes = {
  labelPane: HTMLElement;
};

type BMapGLOverlay = {
  initialize: (map: unknown) => HTMLElement;
  draw: () => void;
};

type BMapGLInfoWindow = {
  open: (map: unknown, anchor: unknown) => void;
  close: () => void;
  setContent: (content: string | HTMLElement) => void;
};

type MapvglView = {
  addLayer: (layer: unknown) => void;
  destroy?: () => void;
};

type BMapGLIcon = unknown;

type BMapGLPointCollection = {
  addEventListener: (type: string, handler: (event: unknown) => void) => void;
  removeEventListener: (type: string, handler: (event: unknown) => void) => void;
};

type BMapGLMarker = {
  addEventListener: (type: string, handler: (event: unknown) => void) => void;
  removeEventListener: (type: string, handler: (event: unknown) => void) => void;
  enableDragging: () => void;
  disableDragging: () => void;
  getPosition: () => unknown;
  setPosition: (point: unknown) => void;
  setIcon: (icon: unknown) => void;
};

type BMapGLGeocoder = {
  getPoint: (address: string, callback: (point: unknown) => void, city?: string) => void;
  getLocation: (
    point: unknown,
    callback: (result: { address: string; addressComponents?: unknown }) => void,
  ) => void;
};

type BMapGLBusLineSearch = {
  getBusList: (keyword: string) => void;
  getBusLine: (item: unknown) => void;
  clearResults: () => void;
};

type BMapGLAutocomplete = {
  addEventListener: (type: string, handler: (event: unknown) => void) => void;
  removeEventListener: (type: string, handler: (event: unknown) => void) => void;
  setInputValue: (value: string) => void;
};

type BMapGLTrafficLayer = {
  show: () => void;
  hide: () => void;
};

type BMapGLDistrictLayer = {
  setStyles: (styles: Record<string, unknown>) => void;
  show: () => void;
  hide: () => void;
};

type BMapGLGeoUtils = {
  getPolygonArea: (polygon: unknown) => number;
  getPolygonLength: (polygon: unknown) => number;
};

interface Window {
  BMapGL?: {
    Map: new (container: string | HTMLElement) => BMapGLMap;
    Point: new (lng: number, lat: number) => unknown;
    Size: new (width: number, height: number) => unknown;
    Marker: new (point: unknown, options?: Record<string, unknown>) => BMapGLMarker;
    Polyline: new (points: unknown[], options?: Record<string, unknown>) => unknown;
    Polygon: new (points: unknown, options?: Record<string, unknown>) => unknown;
    Boundary: new () => BMapGLBoundary;
    DrivingRoute: new (
      map: unknown,
      options: {
        renderOptions?: { map?: unknown; panel?: string | HTMLElement; autoViewport?: boolean };
        onSearchComplete?: (result: unknown) => void;
      },
    ) => BMapGLDrivingRoute;
    TransitRoute: new (
      map: unknown,
      options: {
        renderOptions?: { map?: unknown; panel?: string | HTMLElement; autoViewport?: boolean };
        onSearchComplete?: (result: unknown) => void;
      },
    ) => BMapGLTransitRoute;
    LocalSearch: new (
      map: unknown,
      options: {
        renderOptions?: { map?: unknown; panel?: string | HTMLElement; autoViewport?: boolean };
        onSearchComplete?: (result: unknown) => void;
      },
    ) => BMapGLLocalSearch;
    Overlay: new () => BMapGLOverlay;
    InfoWindow: new (
      content: string | HTMLElement,
      options?: Record<string, unknown>,
    ) => BMapGLInfoWindow;
    Label: new (
      content: string,
      options: { position: unknown; offset?: unknown },
    ) => {
      setStyle: (style: Record<string, string>) => void;
    };
    ViewAnimation: new (
      keyFrames: unknown[],
      options: { duration: number; delay: number; interation: string },
    ) => BMapGLViewAnimation;
    ScaleControl: new (options?: { anchor?: number; offset?: unknown }) => unknown;
    ZoomControl: new (options?: { anchor?: number; offset?: unknown }) => unknown;
    MapTypeControl: new (options?: {
      mapTypes?: number[];
      anchor?: number;
      offset?: unknown;
    }) => unknown;
    LocationControl: new (options?: { anchor?: number; offset?: unknown }) => unknown;
    Icon: new (url: string, size: unknown, opts?: Record<string, unknown>) => BMapGLIcon;
    PointCollection: new (
      points: unknown[],
      options?: Record<string, unknown>,
    ) => BMapGLPointCollection;
    Geocoder: new () => BMapGLGeocoder;
    BusLineSearch: new (
      map: unknown,
      options?: Record<string, unknown>,
    ) => BMapGLBusLineSearch;
    Autocomplete: new (options: {
      input: string | HTMLElement;
      location?: unknown;
    }) => BMapGLAutocomplete;
    TrafficLayer: new (options?: Record<string, unknown>) => BMapGLTrafficLayer;
    DistrictLayer?: new (options: Record<string, unknown>) => BMapGLDistrictLayer;
  };
  BMAP_EARTH_MAP: number;
  BMAP_NORMAL_MAP: number;
  BMAP_HYBRID_MAP: number;
  BMAP_SATELLITE_MAP: number;
  BMAP_POINT_SHAPE_CIRCLE: number;
  BMAP_POINT_SHAPE_STAR: number;
  BMAP_POINT_SHAPE_SQUARE: number;
  BMAP_POINT_SHAPE_BUTTERFLY: number;
  BMAP_ANCHOR_TOP_LEFT: number;
  BMAP_ANCHOR_TOP_RIGHT: number;
  BMAP_ANCHOR_BOTTOM_LEFT: number;
  BMAP_ANCHOR_BOTTOM_RIGHT: number;
  BMAP_DRAWING_MARKER: string;
  BMAP_DRAWING_CIRCLE: string;
  BMAP_DRAWING_POLYLINE: string;
  BMAP_DRAWING_POLYGON: string;
  BMAP_DRAWING_RECTANGLE: string;
  BMapGLLib?: {
    TrackAnimation: new (
      map: unknown,
      polyline: unknown,
      options: {
        overallView: boolean;
        tilt: number;
        duration: number;
        delay: number;
      },
    ) => BMapGLLibTrackAnimation;
    HeatmapOverlay: new (options: {
      radius?: number;
      visible?: boolean;
      opacity?: number;
      gradient?: Record<number, string>;
    }) => BMapGLHeatmapOverlay;
    MarkerClusterer: new (
      map: unknown,
      options: {
        markers?: unknown[];
        gridSize?: number;
        maxZoom?: number;
        minClusterSize?: number;
        isAverageCenter?: boolean;
        styles?: Record<string, unknown>[];
      },
    ) => BMapGLMarkerClusterer;
    LuShu: new (
      map: unknown,
      path: unknown[],
      options: {
        landmarkPois?: { lng: number; lat: number; html: string; pauseTime: number }[];
        icon?: unknown;
        speed?: number;
        defaultContent?: string;
        enableRotation?: boolean;
        autoView?: boolean;
        geodesic?: boolean;
      },
    ) => BMapGLLuShu;
    CurveLine: new (
      points: unknown[],
      options: {
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
      },
    ) => BMapGLCurveLine;
    DrawingManager: new (map: unknown, options: Record<string, unknown>) => BMapGLDrawingManager;
    DistanceTool: new (
      map: unknown,
      options: {
        followText?: string;
        unit?: string;
        lineColor?: string;
        lineStroke?: number;
        opacity?: number;
        lineStyle?: string;
      },
    ) => BMapGLDistanceTool;
    RichMarker: new (
      content: string | HTMLElement,
      position: unknown,
      options?: {
        anchor?: unknown;
        enableDragging?: boolean;
      },
    ) => BMapGLRichMarker;
    InfoBox: new (
      map: unknown,
      content: string | HTMLElement,
      options?: Record<string, unknown>,
    ) => BMapGLInfoBox;
    GeoUtils?: BMapGLGeoUtils;
  };
  mapvgl?: {
    View: new (options: { map: unknown }) => MapvglView;
    PointLayer: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    FlyLineLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    ShapeLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    HeatmapLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    LineTripLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    WallLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    LinePointLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    IconLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
    LineLayer?: new (options: Record<string, unknown>) => {
      setData: (data: unknown[]) => void;
    };
  };
  __baiduMapLoader?: Promise<void>;
}
