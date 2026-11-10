"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { MeshBasicMaterial } from "three";
import {
  GIBS_LAYERS,
  getGibsLayer,
  type GibsLayerId,
} from "@/lib/gibsLayers";
import {
  GLOBE_RADIUS,
  createAtmosphereHaloMesh,
  createSlopePinMesh,
  latLonToVector3,
  orientGroupOnSphere,
} from "@/lib/globeGeo";
import { formatCoord } from "@/lib/labels";
import { slopeColorHex, slopeSpan } from "@/lib/slopeColor";
import { getVariablePalette } from "@/lib/variableMeta";
import type { Region, VariableId } from "@/lib/types";

const FLY_S = 0.85;
const CAMERA_DISTANCE = 2.3;

type SplitGlobeProps = {
  regionA: Region;
  regionB: Region;
  slopes: Record<string, number>;
  variable: VariableId;
};

export function SplitGlobe({ regionA, regionB, slopes, variable }: SplitGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinMatARef = useRef<MeshBasicMaterial | null>(null);
  const pinMatBRef = useRef<MeshBasicMaterial | null>(null);
  const matARef = useRef<MeshBasicMaterial | null>(null);
  const matBRef = useRef<MeshBasicMaterial | null>(null);
  const slopesRef = useRef(slopes);
  slopesRef.current = slopes;

  const [gibsLayer, setGibsLayer] = useState<GibsLayerId>("blue-marble");
  const [textureState, setTextureState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const span = slopeSpan(slopes);
    const slopeA = slopes[regionA.id];
    const slopeB = slopes[regionB.id];
    if (pinMatARef.current) {
      pinMatARef.current.color.setHex(
        typeof slopeA === "number" ? slopeColorHex(slopeA, span) : 0xff6b4a,
      );
    }
    if (pinMatBRef.current) {
      pinMatBRef.current.color.setHex(
        typeof slopeB === "number" ? slopeColorHex(slopeB, span) : 0xff6b4a,
      );
    }
  }, [slopes, regionA.id, regionB.id, variable]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;
    let frame = 0;

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

      if (disposed) {
        return;
      }

      const fullWidth = Math.max(2, container.clientWidth);
      const halfWidth = Math.floor(fullWidth / 2);
      const height = Math.max(2, container.clientHeight);

      const sceneA = new THREE.Scene();
      const sceneB = new THREE.Scene();

      const cameraA = new THREE.PerspectiveCamera(42, halfWidth / height, 0.1, 50);
      const cameraB = new THREE.PerspectiveCamera(42, halfWidth / height, 0.1, 50);
      cameraA.position.set(1.4, 0.55, 2.4);
      cameraB.position.set(1.4, 0.55, 2.4);

      const rendererA = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      rendererA.setClearColor(0x04090f, 1);
      rendererA.outputColorSpace = THREE.SRGBColorSpace;
      rendererA.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererA.setSize(halfWidth, height);
      rendererA.domElement.style.position = "absolute";
      rendererA.domElement.style.left = "0";
      rendererA.domElement.style.top = "0";
      container.appendChild(rendererA.domElement);

      const rendererB = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      rendererB.setClearColor(0x04090f, 1);
      rendererB.outputColorSpace = THREE.SRGBColorSpace;
      rendererB.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererB.setSize(halfWidth, height);
      rendererB.domElement.style.position = "absolute";
      rendererB.domElement.style.left = `${halfWidth}px`;
      rendererB.domElement.style.top = "0";
      container.appendChild(rendererB.domElement);

      const controlsA = new OrbitControls(cameraA, rendererA.domElement);
      controlsA.enableDamping = true;
      controlsA.dampingFactor = 0.08;
      controlsA.enablePan = false;
      controlsA.minDistance = 1.4;
      controlsA.maxDistance = 5;

      const controlsB = new OrbitControls(cameraB, rendererB.domElement);
      controlsB.enableDamping = true;
      controlsB.dampingFactor = 0.08;
      controlsB.enablePan = false;
      controlsB.minDistance = 1.4;
      controlsB.maxDistance = 5;

      const earthA = new THREE.Group();
      const earthB = new THREE.Group();
      sceneA.add(earthA);
      sceneB.add(earthB);

      const haloA = createAtmosphereHaloMesh(GLOBE_RADIUS, 0x38bdf8);
      const haloB = createAtmosphereHaloMesh(GLOBE_RADIUS, 0x38bdf8);
      sceneA.add(haloA.mesh);
      sceneB.add(haloB.mesh);

      const currentSlopes = slopesRef.current;
      const span = slopeSpan(currentSlopes);
      const colorA =
        typeof currentSlopes[regionA.id] === "number"
          ? slopeColorHex(currentSlopes[regionA.id], span)
          : 0xff6b4a;
      const colorB =
        typeof currentSlopes[regionB.id] === "number"
          ? slopeColorHex(currentSlopes[regionB.id], span)
          : 0xff6b4a;

      const pinObjA = createSlopePinMesh(colorA);
      orientGroupOnSphere(pinObjA.group, regionA.latitude, regionA.longitude, GLOBE_RADIUS);
      earthA.add(pinObjA.group);
      pinMatARef.current = pinObjA.material;

      const pinObjB = createSlopePinMesh(colorB);
      orientGroupOnSphere(pinObjB.group, regionB.latitude, regionB.longitude, GLOBE_RADIUS);
      earthB.add(pinObjB.group);
      pinMatBRef.current = pinObjB.material;

      const targetCamA = latLonToVector3(
        regionA.latitude,
        regionA.longitude,
        CAMERA_DISTANCE,
      );
      const targetCamB = latLonToVector3(
        regionB.latitude,
        regionB.longitude,
        CAMERA_DISTANCE,
      );

      gsap.to(cameraA.position, {
        x: targetCamA.x,
        y: targetCamA.y,
        z: targetCamA.z,
        duration: FLY_S,
        ease: "power2.out",
        onUpdate: () => controlsA.update(),
      });

      gsap.to(cameraB.position, {
        x: targetCamB.x,
        y: targetCamB.y,
        z: targetCamB.z,
        duration: FLY_S,
        ease: "power2.out",
        onUpdate: () => controlsB.update(),
      });

      const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48);
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin("anonymous");
      let sharedTexture: import("three").Texture | null = null;
      let matA: MeshBasicMaterial | null = null;
      let matB: MeshBasicMaterial | null = null;

      textureLoader.load(
        getGibsLayer(gibsLayer).wmsUrl,
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }
          sharedTexture = texture;
          texture.colorSpace = THREE.SRGBColorSpace;
          matA = new THREE.MeshBasicMaterial({ map: texture });
          matB = new THREE.MeshBasicMaterial({ map: texture });
          matARef.current = matA;
          matBRef.current = matB;
          earthA.add(new THREE.Mesh(geometry, matA));
          earthB.add(new THREE.Mesh(geometry, matB));
          setTextureState("ready");
        },
        undefined,
        () => {
          if (!disposed) {
            setTextureState("error");
          }
        },
      );

      const animate = () => {
        if (disposed) {
          return;
        }
        frame = requestAnimationFrame(animate);
        controlsA.update();
        controlsB.update();
        rendererA.render(sceneA, cameraA);
        rendererB.render(sceneB, cameraB);
      };
      animate();

      const handleResize = () => {
        if (disposed || !container) {
          return;
        }
        const newHalf = Math.max(1, Math.floor(container.clientWidth / 2));
        const newHeight = Math.max(1, container.clientHeight);

        cameraA.aspect = newHalf / newHeight;
        cameraA.updateProjectionMatrix();
        rendererA.setSize(newHalf, newHeight);

        cameraB.aspect = newHalf / newHeight;
        cameraB.updateProjectionMatrix();
        rendererB.setSize(newHalf, newHeight);
        rendererB.domElement.style.left = `${newHalf}px`;
      };

      const observer = new ResizeObserver(handleResize);
      observer.observe(container);

      cleanup = () => {
        disposed = true;
        pinMatARef.current = null;
        pinMatBRef.current = null;
        matARef.current = null;
        matBRef.current = null;
        if (frame) {
          cancelAnimationFrame(frame);
        }
        gsap.killTweensOf(cameraA.position);
        gsap.killTweensOf(cameraB.position);
        observer.disconnect();
        controlsA.dispose();
        controlsB.dispose();
        pinObjA.dispose();
        pinObjB.dispose();
        haloA.geometry.dispose();
        haloA.material.dispose();
        haloB.geometry.dispose();
        haloB.material.dispose();
        geometry.dispose();
        matA?.dispose();
        matB?.dispose();
        sharedTexture?.dispose();
        rendererA.dispose();
        rendererB.dispose();
        rendererA.domElement.remove();
        rendererB.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [regionA, regionB]);

  useEffect(() => {
    if (!matARef.current || !matBRef.current) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const THREE = await import("three");
      if (cancelled) return;
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(getGibsLayer(gibsLayer).wmsUrl, (texture) => {
        if (cancelled || !matARef.current || !matBRef.current) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        const prevMap = matARef.current.map;
        matARef.current.map = texture;
        matARef.current.needsUpdate = true;
        matBRef.current.map = texture;
        matBRef.current.needsUpdate = true;
        prevMap?.dispose();
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [gibsLayer]);

  const slopeA = slopes[regionA.id];
  const slopeB = slopes[regionB.id];
  const unit = getVariablePalette(variable).unitLabel;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full bg-[#04090f]">
        {textureState === "loading" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-xs text-slate-400">
              Calibrating dual NASA GIBS globes…
            </p>
          </div>
        )}
        {textureState === "error" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-xs text-red-400">
              Failed to load NASA GIBS imagery texture
            </p>
          </div>
        )}
      </div>

      {/* GIBS Layer Switcher */}
      <div
        className="glass-pill absolute left-4 top-4 z-20 inline-flex items-center gap-1 rounded-pill p-1"
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

      {/* Calibrated Telemetry Seam & Reticle */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-sky-300/25 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="glass-pill flex h-8 w-8 items-center justify-center rounded-full border border-white/15 font-mono text-[10px] font-semibold tracking-wider text-slate-300">
          VS
        </div>
      </div>

      {/* Region A Telemetry Pill */}
      <div className="glass-pill pointer-events-none absolute bottom-4 left-4 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Region A
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {formatCoord(regionA.latitude, regionA.longitude)}
          </span>
        </div>
        <p className="mt-0.5 font-display text-sm font-semibold text-white">{regionA.name}</p>
        {typeof slopeA === "number" && (
          <p
            className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${
              slopeA > 0 ? "text-rose-300" : slopeA < 0 ? "text-sky-300" : "text-slate-300"
            }`}
          >
            {slopeA >= 0 ? "+" : ""}
            {slopeA.toFixed(3)} {unit}
          </p>
        )}
      </div>

      {/* Region B Telemetry Pill */}
      <div className="glass-pill pointer-events-none absolute bottom-4 right-4 rounded-xl px-3.5 py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-[10px] text-slate-500">
            {formatCoord(regionB.latitude, regionB.longitude)}
          </span>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Region B
          </span>
        </div>
        <p className="mt-0.5 font-display text-sm font-semibold text-white">{regionB.name}</p>
        {typeof slopeB === "number" && (
          <p
            className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${
              slopeB > 0 ? "text-rose-300" : slopeB < 0 ? "text-sky-300" : "text-slate-300"
            }`}
          >
            {slopeB >= 0 ? "+" : ""}
            {slopeB.toFixed(3)} {unit}
          </p>
        )}
      </div>
    </div>
  );
}
