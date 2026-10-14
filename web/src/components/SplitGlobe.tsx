"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  MathUtils,
  Vector3,
  type Group,
  type Mesh,
  type PerspectiveCamera,
  type SphereGeometry,
} from "three";
import { slopeColorHex, slopeSpan } from "@/lib/slopeColor";
import type { Region, VariableId } from "@/lib/types";

const GIBS_BLUE_MARBLE =
  "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=BlueMarble_ShadedRelief_Bathymetry&FORMAT=image/jpeg&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=2048&HEIGHT=1024&STYLES=";

const GLOBE_RADIUS = 1;
const FLY_MS = 800;

type SplitGlobeProps = {
  regionA: Region;
  regionB: Region;
  slopes: Record<string, number>;
  variable: VariableId;
};

export function SplitGlobe({ regionA, regionB, slopes, variable }: SplitGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [textureState, setTextureState] = useState<"loading" | "ready" | "error">("loading");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mounted) {
      return;
    }

    let disposed = false;
    let cleanupSceneA: (() => void) | undefined;
    let cleanupSceneB: (() => void) | undefined;
    let frameA = 0;
    let frameB = 0;

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

      if (disposed) {
        return;
      }

      const width = container.clientWidth / 2;
      const height = container.clientHeight;

      const sceneA = new THREE.Scene();
      const sceneB = new THREE.Scene();

      const cameraA = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      cameraA.position.z = 2.5;
      const cameraB = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      cameraB.position.z = 2.5;

      const rendererA = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererA.setSize(width, height);
      rendererA.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererA.domElement.style.position = "absolute";
      rendererA.domElement.style.left = "0";
      rendererA.domElement.style.top = "0";
      container.appendChild(rendererA.domElement);

      const rendererB = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rendererB.setSize(width, height);
      rendererB.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererB.domElement.style.position = "absolute";
      rendererB.domElement.style.left = `${width}px`;
      rendererB.domElement.style.top = "0";
      container.appendChild(rendererB.domElement);

      const controlsA = new OrbitControls(cameraA, rendererA.domElement);
      controlsA.enableDamping = true;
      controlsA.dampingFactor = 0.05;
      controlsA.enablePan = false;
      controlsA.minDistance = 1.5;
      controlsA.maxDistance = 4;

      const controlsB = new OrbitControls(cameraB, rendererB.domElement);
      controlsB.enableDamping = true;
      controlsB.dampingFactor = 0.05;
      controlsB.enablePan = false;
      controlsB.minDistance = 1.5;
      controlsB.maxDistance = 4;

      const ambientA = new THREE.AmbientLight(0xffffff, 0.8);
      sceneA.add(ambientA);
      const ambientB = new THREE.AmbientLight(0xffffff, 0.8);
      sceneB.add(ambientB);

      const directionalA = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalA.position.set(5, 3, 5);
      sceneA.add(directionalA);
      const directionalB = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalB.position.set(5, 3, 5);
      sceneB.add(directionalB);

      const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin("anonymous");

      textureLoader.load(
        GIBS_BLUE_MARBLE,
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }

          const materialA = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            metalness: 0.1,
          });
          const materialB = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            metalness: 0.1,
          });

          const globeA = new THREE.Mesh(geometry, materialA);
          sceneA.add(globeA);
          const globeB = new THREE.Mesh(geometry, materialB);
          sceneB.add(globeB);

          flyToRegion(globeA, controlsA, regionA.latitude, regionA.longitude);
          flyToRegion(globeB, controlsB, regionB.latitude, regionB.longitude);

          setTextureState("ready");
        },
        undefined,
        (error) => {
          console.error("Failed to load texture:", error);
          setTextureState("error");
        }
      );

      const animate = () => {
        if (disposed) {
          return;
        }
        frameA = requestAnimationFrame(animate);
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
        const newWidth = container.clientWidth / 2;
        const newHeight = container.clientHeight;

        cameraA.aspect = newWidth / newHeight;
        cameraA.updateProjectionMatrix();
        rendererA.setSize(newWidth, newHeight);

        cameraB.aspect = newWidth / newHeight;
        cameraB.updateProjectionMatrix();
        rendererB.setSize(newWidth, newHeight);
        rendererB.domElement.style.left = `${newWidth}px`;
      };

      window.addEventListener("resize", handleResize);

      cleanupSceneA = () => {
        disposed = true;
        if (frameA) {
          cancelAnimationFrame(frameA);
        }
        window.removeEventListener("resize", handleResize);
        controlsA.dispose();
        rendererA.dispose();
        geometry.dispose();
        sceneA.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (obj.material instanceof THREE.Material) {
              obj.material.dispose();
            }
          }
        });
        container.removeChild(rendererA.domElement);
      };

      cleanupSceneB = () => {
        if (frameB) {
          cancelAnimationFrame(frameB);
        }
        controlsB.dispose();
        rendererB.dispose();
        sceneB.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (obj.material instanceof THREE.Material) {
              obj.material.dispose();
            }
          }
        });
        container.removeChild(rendererB.domElement);
      };
    })();

    return () => {
      disposed = true;
      cleanupSceneA?.();
      cleanupSceneB?.();
    };
  }, [regionA, regionB, mounted]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-[#04090f]">
        {textureState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-slate-500">Loading globes…</p>
          </div>
        )}
        {textureState === "error" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-red-400">Failed to load globe textures</p>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/10 bg-[#0c1520]/90 px-3 py-2 backdrop-blur-sm">
        <p className="text-xs font-medium text-slate-300">{regionA.name}</p>
        <p className="text-[10px] text-slate-500">Region A</p>
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg border border-white/10 bg-[#0c1520]/90 px-3 py-2 backdrop-blur-sm">
        <p className="text-xs font-medium text-slate-300">{regionB.name}</p>
        <p className="text-[10px] text-slate-500">Region B</p>
      </div>
    </div>
  );
}

function flyToRegion(
  globe: Mesh<SphereGeometry>,
  controls: { target: Vector3; update: () => void },
  latitude: number,
  longitude: number
) {
  const phi = MathUtils.degToRad(90 - latitude);
  const theta = MathUtils.degToRad(longitude);
  const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
  const y = GLOBE_RADIUS * Math.cos(phi);
  const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
  
  const target = new Vector3(x, y, z);
  
  gsap.to(controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: FLY_MS / 1000,
    ease: "power2.inOut",
    onUpdate: () => controls.update(),
  });

  globe.rotation.y = -theta;
  globe.rotation.x = phi - Math.PI / 2;
}
