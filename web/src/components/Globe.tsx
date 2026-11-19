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
  ICON_MARKER_SIZE,
  createAtmosphereHaloMesh,
  createVariableIconMarker,
  latLonToVector3,
  type VariableIconMarkerHandle,
} from "@/lib/globeGeo";
import { getRegionType } from "@/lib/regionMeta";
import { slopeColorHex, slopeSpan } from "@/lib/slopeColor";
import { fetchGlobalEonetEvents } from "@/lib/stats";
import type { GlobalEonetEvent, Region, VariableId } from "@/lib/types";

const FLY_MS = 800;

type Fly = {
  from: Vector3;
  to: Vector3;
  started: number;
};

type MarkerGroup = {
  group: Group;
  iconMarker: VariableIconMarkerHandle;
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
  const eonetGroupRef = useRef<Group | null>(null);
  const [gibsLayer, setGibsLayer] = useState<GibsLayerId>("blue-marble");
  const loadedGibsLayerRef = useRef<GibsLayerId>("blue-marble");
  const [layerLoading, setLayerLoading] = useState<GibsLayerId | null>(null);
  const [layerSwitchError, setLayerSwitchError] = useState<string | null>(null);
  const [showEonetHazards, setShowEonetHazards] = useState(true);
  const [eonetEvents, setEonetEvents] = useState<GlobalEonetEvent[]>([]);
  const [eonetLoading, setEonetLoading] = useState(true);
  const [eonetRendering, setEonetRendering] = useState(false);
  const [textureState, setTextureState] = useState<"loading" | "ready" | "error">("loading");
  const [textureError, setTextureError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setEonetLoading(true);
    fetchGlobalEonetEvents(controller.signal)
      .then((events) => {
        if (!controller.signal.aborted) {
          setEonetEvents(events);
        }
      })
      .catch(() => {
        // Ignore abort on unmount / strict-mode remount
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setEonetLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

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
    const eonetGroup = new THREE.Group();
    earth.add(eonetGroup);
    eonetGroupRef.current = eonetGroup;
    const atmosphereHalo = createAtmosphereHaloMesh(GLOBE_RADIUS, 0x38bdf8);
    scene.add(atmosphereHalo.mesh);
    const markerGroups = new Map<string, MarkerGroup>();
    const hitTargets: Mesh[] = [];

    const hitGeometry = new THREE.SphereGeometry(ICON_MARKER_SIZE * 0.55, 12, 12);

    for (const region of regions) {
      const meta = metaById.get(region.id);
      const group = new THREE.Group();
      const surface = latLonToVector3(region.latitude, region.longitude, GLOBE_RADIUS);
      group.position.copy(surface);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surface.clone().normalize());

      const iconMarker = createVariableIconMarker(
        variableRef.current,
        0xff6b4a,
        ICON_MARKER_SIZE,
      );
      group.add(iconMarker.group);

      const hitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const hit = new THREE.Mesh(hitGeometry, hitMaterial);
      hit.position.y = ICON_MARKER_SIZE * 0.52;
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
      label.position.set(0, ICON_MARKER_SIZE + 0.045, 0);
      group.add(label);

      earth.add(group);
      markerGroups.set(region.id, { group, iconMarker, hit, labelEl });
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
        const colorHex =
          typeof slope === "number" ? slopeColorHex(slope, span) : 0x94a3b8;
        marker.iconMarker.update(activeVariable, colorHex);

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
      hitGeometry.dispose();
      atmosphereHalo.geometry.dispose();
      atmosphereHalo.material.dispose();
      for (const marker of markerGroups.values()) {
        marker.iconMarker.dispose();
        const hitMat = marker.hit.material;
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
      if (eonetGroupRef.current === eonetGroup) {
        eonetGroupRef.current = null;
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
    if (!mat || gibsLayer === loadedGibsLayerRef.current) {
      setLayerLoading(null);
      setLayerSwitchError(null);
      return;
    }
    let cancelled = false;
    setLayerLoading(gibsLayer);
    setLayerSwitchError(null);
    void (async () => {
      const THREE = await import("three");
      if (cancelled) return;
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const layer = getGibsLayer(gibsLayer);
      loader.load(
        layer.wmsUrl,
        (texture) => {
          if (cancelled || !globeMaterialRef.current) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          const prevMap = globeMaterialRef.current.map;
          globeMaterialRef.current.map = texture;
          globeMaterialRef.current.needsUpdate = true;
          prevMap?.dispose();
          loadedGibsLayerRef.current = gibsLayer;
          setLayerLoading(null);
        },
        undefined,
        () => {
          if (cancelled) return;
          setLayerLoading(null);
          setLayerSwitchError(`Unable to load ${layer.shortLabel}`);
        },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [gibsLayer]);

  useEffect(() => {
    const group = eonetGroupRef.current;
    if (!group) {
      return;
    }
    group.visible = showEonetHazards;
    if (!showEonetHazards || eonetEvents.length === 0) {
      setEonetRendering(false);
      return;
    }

    let cancelled = false;
    let disposeHazards: (() => void) | undefined;
    setEonetRendering(true);

    void (async () => {
      const THREE = await import("three");
      if (cancelled || !eonetGroupRef.current) return;
      const targetGroup = eonetGroupRef.current;
      while (targetGroup.children.length > 0) {
        targetGroup.remove(targetGroup.children[0]);
      }

      const ringGeo = new THREE.RingGeometry(0.011, 0.019, 20);
      ringGeo.rotateX(-Math.PI / 2);
      ringGeo.translate(0, 0.0035, 0);
      const dotGeo = new THREE.SphereGeometry(0.006, 10, 10);
      dotGeo.translate(0, 0.004, 0);

      const fireMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        side: THREE.DoubleSide,
      });
      const stormMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
      });
      const volcanoMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
      });

      const up = new THREE.Vector3(0, 1, 0);

      for (const ev of eonetEvents) {
        const catLower = ev.category.toLowerCase();
        const mat = catLower.includes("fire")
          ? fireMat
          : catLower.includes("volcan")
            ? volcanoMat
            : stormMat;

        const node = new THREE.Group();
        const surface = latLonToVector3(ev.latitude, ev.longitude, GLOBE_RADIUS);
        node.position.copy(surface);
        node.quaternion.setFromUnitVectors(up, surface.clone().normalize());

        node.add(new THREE.Mesh(ringGeo, mat));
        node.add(new THREE.Mesh(dotGeo, mat));
        targetGroup.add(node);
      }

      disposeHazards = () => {
        ringGeo.dispose();
        dotGeo.dispose();
        fireMat.dispose();
        stormMat.dispose();
        volcanoMat.dispose();
      };
      if (!cancelled) {
        setEonetRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      disposeHazards?.();
    };
  }, [eonetEvents, showEonetHazards, textureState]);

  const eonetBusy = eonetLoading || eonetRendering;
  const activeLoadingLabel = layerLoading
    ? `Loading NASA GIBS ${getGibsLayer(layerLoading).shortLabel}…`
    : eonetBusy && showEonetHazards
      ? "Syncing NASA EONET hazards…"
      : null;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <div
          className="glass-pill inline-flex items-center gap-1 rounded-pill p-1"
          role="group"
          aria-label="NASA GIBS imagery layer"
        >
          {GIBS_LAYERS.map((layer) => {
            const active = layer.id === gibsLayer;
            const isLoadingThis = layerLoading === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => setGibsLayer(layer.id)}
                aria-busy={isLoadingThis}
                data-agent-action={`select-gibs-${layer.id}`}
                className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                  active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={layer.attribution}
              >
                {isLoadingThis && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-sky-300/30 border-t-sky-300"
                    aria-hidden="true"
                  />
                )}
                <span>{layer.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowEonetHazards((prev) => !prev)}
          aria-pressed={showEonetHazards}
          aria-busy={eonetBusy}
          data-agent-action="toggle-eonet-3d-hazards"
          title="Toggle live NASA EONET v3 natural hazard rings on the 3D globe"
          className={`glass-pill inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-mono text-[10px] font-medium transition-all ${
            showEonetHazards
              ? "border-amber-400/45 bg-amber-500/15 text-amber-200"
              : "border-white/10 text-slate-400 hover:text-slate-200"
          }`}
        >
          {eonetBusy ? (
            <span
              className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-amber-300/30 border-t-amber-300"
              aria-hidden="true"
            />
          ) : (
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                showEonetHazards ? "animate-pulse bg-amber-400" : "bg-slate-500"
              }`}
            />
          )}
          <span>
            {eonetLoading
              ? "EONET Hazards…"
              : `EONET Hazards (${eonetEvents.length})`}
          </span>
        </button>

        {activeLoadingLabel ? (
          <div
            role="status"
            aria-live="polite"
            className="glass-pill inline-flex items-center gap-2 rounded-pill border border-sky-400/30 bg-[#04090f]/85 px-3 py-1.5 font-mono text-[10px] text-sky-200"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-sky-300/30 border-t-sky-300"
              aria-hidden="true"
            />
            <span>{activeLoadingLabel}</span>
          </div>
        ) : layerSwitchError ? (
          <div
            role="status"
            aria-live="polite"
            className="glass-pill inline-flex items-center gap-1.5 rounded-pill border border-rose-400/35 bg-rose-950/70 px-3 py-1.5 font-mono text-[10px] text-rose-200"
          >
            <span>{layerSwitchError}</span>
          </div>
        ) : null}
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
