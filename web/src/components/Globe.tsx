"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  MathUtils,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PerspectiveCamera,
  type SphereGeometry,
} from "three";
import {
  applyGlobeMarkerDisplay,
  createGlobeMarkerBadgeElement,
  type GlobeMarkerDisplayMode,
  type GlobeMarkerMeta,
} from "@/components/globeMarkerBadge";
import {
  GIBS_LAYERS,
  getGibsLayer,
  type GibsLayerId,
} from "@/lib/gibsLayers";
import {
  GLOBE_RADIUS,
  PIN_HEIGHT,
  PIN_RADIUS,
  createAtmosphereHaloMesh,
  latLonToVector3,
} from "@/lib/globeGeo";
import { getRegionType } from "@/lib/regionMeta";
import { slopeColorHex, slopeSpan } from "@/lib/slopeColor";
import type { Region, VariableId } from "@/lib/types";

const FLY_MS = 800;

type Fly = {
  from: Vector3;
  to: Vector3;
  started: number;
};

type MarkerGroup = {
  group: Group;
  pin: Mesh;
  hit: Mesh;
  labelEl: HTMLDivElement;
};

type OrbitControlsHandle = {
  enabled: boolean;
  target: Vector3;
  update: () => void;
  dispose: () => void;
};

type GlobeProps = {
  regions: Region[];
  slopes: Record<string, number>;
  markerMeta: GlobeMarkerMeta[];
  variable: VariableId;
  selectedId: string | null;
  onSelect: (regionId: string) => void;
};

function GlobeInner({
  regions,
  slopes,
  markerMeta,
  variable,
  selectedId,
  onSelect,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const slopesRef = useRef(slopes);
  const markerMetaRef = useRef(markerMeta);
  const variableRef = useRef(variable);
  const hoveredIdRef = useRef<string | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsHandle | null>(null);
  const regionsRef = useRef(regions);
  const flyRef = useRef<Fly | null>(null);
  const lastFlyTargetRef = useRef<string | null>(null);
  const globeMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const [gibsLayer, setGibsLayer] = useState<GibsLayerId>("blue-marble");
  const [textureState, setTextureState] = useState<"loading" | "ready" | "error">("loading");
  const [textureError, setTextureError] = useState<string | null>(null);

  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;
  slopesRef.current = slopes;
  markerMetaRef.current = markerMeta;
  variableRef.current = variable;
  regionsRef.current = regions;

  const regionLayoutKey = regions
    .map((region) => `${region.id}:${region.latitude}:${region.longitude}`)
    .join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || regions.length === 0) {
      return;
    }

    let disposed = false;
    let cleanupScene: (() => void) | undefined;
    let frame = 0;

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      const { CSS2DObject, CSS2DRenderer } = await import(
        "three/addons/renderers/CSS2DRenderer.js"
      );
      if (disposed) {
        return;
      }

    const metaById = new Map(markerMetaRef.current.map((m) => [m.regionId, m]));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(1.4, 0.55, 2.35);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x04090f, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.inset = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.35;
    controls.maxDistance = 6;
    controls.rotateSpeed = 0.55;
    controlsRef.current = controls;

    const earth = new THREE.Group();
    scene.add(earth);
    const atmosphereHalo = createAtmosphereHaloMesh(GLOBE_RADIUS, 0x38bdf8);
    scene.add(atmosphereHalo.mesh);
    const markerGroups = new Map<string, MarkerGroup>();
    const hitTargets: Mesh[] = [];

    const pinGeometry = new THREE.ConeGeometry(PIN_RADIUS, PIN_HEIGHT, 12);
    pinGeometry.translate(0, PIN_HEIGHT / 2 + 0.0025, 0);
    const collarGeometry = new THREE.CylinderGeometry(PIN_RADIUS * 1.65, PIN_RADIUS * 1.65, 0.004, 16);
    collarGeometry.translate(0, 0.002, 0);
    const collarMaterial = new THREE.MeshBasicMaterial({ color: 0x04090f });
    const hitGeometry = new THREE.SphereGeometry(PIN_RADIUS * 1.35, 12, 12);

    for (const region of regions) {
      const meta = metaById.get(region.id);
      const group = new THREE.Group();
      const surface = latLonToVector3(region.latitude, region.longitude, GLOBE_RADIUS);
      group.position.copy(surface);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surface.clone().normalize());

      const collar = new THREE.Mesh(collarGeometry, collarMaterial);
      group.add(collar);

      const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b4a });
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      group.add(pin);

      const hitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const hit = new THREE.Mesh(hitGeometry, hitMaterial);
      hit.position.y = PIN_HEIGHT * 0.55;
      hit.userData.regionId = region.id;
      group.add(hit);
      hitTargets.push(hit);

      const labelEl = createGlobeMarkerBadgeElement(
        meta ?? {
          regionId: region.id,
          regionName: region.name,
          regionType: getRegionType(region.id),
          slopePerDecade: 0,
          unit: "°C",
          significance: "not_significant",
        },
        variableRef.current,
        region.id === selectedRef.current,
      );
      labelEl.style.pointerEvents = "auto";
      labelEl.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(region.id);
      });
      const label = new CSS2DObject(labelEl);
      label.position.set(0, PIN_HEIGHT + 0.06, 0);
      group.add(label);

      earth.add(group);
      markerGroups.set(region.id, { group, pin, hit, labelEl });
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let cancelled = false;
    let globeMaterial: MeshBasicMaterial | null = null;
    let globeGeometry: SphereGeometry | null = null;

    loader.load(
      getGibsLayer(gibsLayer).wmsUrl,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48);
        globeMaterial = new THREE.MeshBasicMaterial({ map: texture });
        globeMaterialRef.current = globeMaterial;
        const mesh = new THREE.Mesh(globeGeometry, globeMaterial);
        earth.add(mesh);
        setTextureState("ready");
        setTextureError(null);
      },
      undefined,
      () => {
        if (cancelled) {
          return;
        }
        setTextureState("error");
        setTextureError("NASA GIBS imagery layer failed to load.");
      },
    );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown: { x: number; y: number } | null = null;

    let lastWidth = 0;
    let lastHeight = 0;
    const resize = () => {
      const width = Math.floor(container.clientWidth);
      const height = Math.floor(container.clientHeight);
      if (width === 0 || height === 0) {
        return;
      }
      if (width === lastWidth && height === lastHeight) {
        return;
      }
      lastWidth = width;
      lastHeight = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      labelRenderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
      flyRef.current = null;
      controls.enabled = true;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerDown) {
        return;
      }
      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      pointerDown = null;
      if (dx * dx + dy * dy > 16) {
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      const regionId = hits[0]?.object.userData.regionId;
      if (typeof regionId === "string") {
        onSelectRef.current(regionId);
      }
    };
    let hoverFrame = 0;
    let pendingHoverEvent: PointerEvent | null = null;
    const runHoverPick = () => {
      hoverFrame = 0;
      const event = pendingHoverEvent;
      pendingHoverEvent = null;
      if (!event) {
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      const regionId = hits[0]?.object.userData.regionId;
      hoveredIdRef.current = typeof regionId === "string" ? regionId : null;
    };
    const onPointerMove = (event: PointerEvent) => {
      pendingHoverEvent = event;
      if (hoverFrame !== 0) {
        return;
      }
      hoverFrame = window.requestAnimationFrame(runHoverPick);
    };
    const onPointerLeave = () => {
      hoveredIdRef.current = null;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    const cameraWorld = new THREE.Vector3();
    const viewDir = new THREE.Vector3();
    const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
    const markerWorld = new THREE.Vector3();
    const markerNormal = new THREE.Vector3();

    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      const fly = flyRef.current;
      const flying = Boolean(fly);
      if (fly) {
        const t = Math.min(1, (performance.now() - fly.started) / FLY_MS);
        const eased = 1 - (1 - t) ** 3;
        camera.position.lerpVectors(fly.from, fly.to, eased);
        if (t >= 1) {
          flyRef.current = null;
          controls.enabled = true;
          controls.target.set(0, 0, 0);
          controls.update();
        }
      }

      const span = slopeSpan(slopesRef.current);
      const metaMap = new Map(markerMetaRef.current.map((m) => [m.regionId, m]));
      const activeVariable = variableRef.current;

      camera.getWorldPosition(cameraWorld);

      for (const [id, marker] of markerGroups) {
        const selected = id === selectedRef.current;
        marker.group.scale.setScalar(selected ? 1.2 : 1);

        const slope = slopesRef.current[id];
        const pinMaterial = marker.pin.material;
        if (pinMaterial instanceof THREE.MeshBasicMaterial) {
          pinMaterial.color.set(
            typeof slope === "number" ? slopeColorHex(slope, span) : 0x94a3b8,
          );
        }

        marker.group.getWorldPosition(markerWorld);
        markerNormal.copy(markerWorld).normalize();
        viewDir.copy(cameraWorld).sub(markerWorld).normalize();
        const facing = markerNormal.dot(viewDir);
        const onFront = facing > 0.12;

        let displayMode: GlobeMarkerDisplayMode = "hidden";
        if (onFront) {
          if (selected) {
            displayMode = "full";
          } else if (canHover && id === hoveredIdRef.current) {
            displayMode = "compact";
          }
        }

        const meta = metaMap.get(id);
        if (meta) {
          applyGlobeMarkerDisplay(marker.labelEl, meta, activeVariable, selected, displayMode);
        }

        const labelInteractive = displayMode !== "hidden";
        marker.labelEl.style.opacity = onFront ? "1" : "0";
        marker.labelEl.style.pointerEvents = labelInteractive ? "auto" : "none";
      }

      if (!flying) {
        controls.update();
      }
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    tick();

    cleanupScene = () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (hoverFrame !== 0) {
        window.cancelAnimationFrame(hoverFrame);
      }
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      if (controlsRef.current === controls) {
        controlsRef.current = null;
      }
      pinGeometry.dispose();
      collarGeometry.dispose();
      collarMaterial.dispose();
      hitGeometry.dispose();
      atmosphereHalo.geometry.dispose();
      atmosphereHalo.material.dispose();
      for (const marker of markerGroups.values()) {
        const pinMat = marker.pin.material;
        const hitMat = marker.hit.material;
        if (pinMat instanceof THREE.Material) {
          pinMat.dispose();
        }
        if (hitMat instanceof THREE.Material) {
          hitMat.dispose();
        }
      }
      globeGeometry?.dispose();
      if (globeMaterial) {
        globeMaterial.map?.dispose();
        globeMaterial.dispose();
      }
      if (globeMaterialRef.current === globeMaterial) {
        globeMaterialRef.current = null;
      }
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
      if (cameraRef.current === camera) {
        cameraRef.current = null;
      }
    };
    })();

    return () => {
      disposed = true;
      cleanupScene?.();
    };
  }, [regionLayoutKey]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || !selectedId) {
      return;
    }
    const region = regionsRef.current.find((item) => item.id === selectedId);
    if (!region) {
      return;
    }
    const flyKey = `${selectedId}:${region.latitude}:${region.longitude}`;
    if (lastFlyTargetRef.current === flyKey) {
      return;
    }
    lastFlyTargetRef.current = flyKey;

    const distance = MathUtils.clamp(camera.position.length(), 1.35, 6);
    controls.enabled = false;
    flyRef.current = {
      from: camera.position.clone(),
      to: latLonToVector3(region.latitude, region.longitude, distance),
      started: performance.now(),
    };
  }, [selectedId]);

  useEffect(() => {
    const mat = globeMaterialRef.current;
    if (!mat) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const THREE = await import("three");
      if (cancelled) return;
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const layer = getGibsLayer(gibsLayer);
      loader.load(layer.wmsUrl, (texture) => {
        if (cancelled || !globeMaterialRef.current) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        const prevMap = globeMaterialRef.current.map;
        globeMaterialRef.current.map = texture;
        globeMaterialRef.current.needsUpdate = true;
        prevMap?.dispose();
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [gibsLayer]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      <div
        className="glass-pill absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-pill p-1"
        role="group"
        aria-label="NASA GIBS imagery layer"
      >
        {GIBS_LAYERS.map((layer) => {
          const active = layer.id === gibsLayer;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setGibsLayer(layer.id)}
              data-agent-action={`select-gibs-${layer.id}`}
              className={`rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title={layer.attribution}
            >
              {layer.shortLabel}
            </button>
          );
        })}
      </div>
      {textureState === "loading" ? (
        <div className="glass-pill pointer-events-none absolute bottom-4 left-4 rounded-pill px-3.5 py-1.5 font-mono text-xs text-slate-300">
          Loading NASA GIBS Blue Marble…
        </div>
      ) : textureState === "ready" ? (
        <div className="glass-pill pointer-events-none absolute bottom-4 left-4 hidden rounded-pill px-3.5 py-1.5 font-mono text-[11px] text-slate-400 sm:block">
          Drag to orbit · Hover pin for telemetry · Click to inspect trend ·{" "}
          <span className="text-sky-300">Blue declining</span> ·{" "}
          <span className="text-rose-300">Red rising</span>
        </div>
      ) : null}
      {textureState === "error" && textureError ? (
        <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-red-300">
          {textureError}
        </p>
      ) : null}
    </div>
  );
}

function compareGlobeProps(prev: GlobeProps, next: GlobeProps): boolean {
  if (prev.selectedId !== next.selectedId || prev.variable !== next.variable) {
    return false;
  }
  if (prev.slopes !== next.slopes) {
    const prevKeys = Object.keys(prev.slopes);
    const nextKeys = Object.keys(next.slopes);
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    for (const key of prevKeys) {
      if (prev.slopes[key] !== next.slopes[key]) {
        return false;
      }
    }
  }
  if (prev.regions.length !== next.regions.length) {
    return false;
  }
  for (let i = 0; i < prev.regions.length; i++) {
    const a = prev.regions[i];
    const b = next.regions[i];
    if (a.id !== b.id || a.latitude !== b.latitude || a.longitude !== b.longitude) {
      return false;
    }
  }
  if (prev.markerMeta.length !== next.markerMeta.length) {
    return false;
  }
  for (let i = 0; i < prev.markerMeta.length; i++) {
    const a = prev.markerMeta[i];
    const b = next.markerMeta[i];
    if (
      a.regionId !== b.regionId ||
      a.slopePerDecade !== b.slopePerDecade ||
      a.significance !== b.significance ||
      a.unit !== b.unit
    ) {
      return false;
    }
  }
  return true;
}

export const Globe = memo(GlobeInner, compareGlobeProps);
