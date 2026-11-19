import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import type { VariableId } from "@/lib/types";

export const GLOBE_RADIUS = 1;
export const PIN_HEIGHT = 0.055;
export const PIN_RADIUS = 0.014;
export const ICON_MARKER_SIZE = 0.068;

const UP_AXIS = new Vector3(0, 1, 0);
const iconTextureCache = new Map<string, CanvasTexture>();

function hexToCss(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

function drawVariableGlyph(
  ctx: CanvasRenderingContext2D,
  variable: VariableId,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (variable) {
    case "temperature": {
      // Thermometer: stem + bulb + side ticks
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.roundRect(56, 30, 16, 46, 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(64, 83, 14, 0, Math.PI * 2);
      ctx.fill();

      // Inner mercury column
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(64, 48);
      ctx.lineTo(64, 80);
      ctx.stroke();

      // Graduation ticks
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(78, 42);
      ctx.lineTo(85, 42);
      ctx.moveTo(78, 53);
      ctx.lineTo(83, 53);
      ctx.moveTo(78, 64);
      ctx.lineTo(85, 64);
      ctx.stroke();
      break;
    }
    case "precipitation": {
      // Cloud silhouette
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(42, 69);
      ctx.arc(44, 59, 11, Math.PI * 0.5, Math.PI * 1.45);
      ctx.arc(60, 49, 15, Math.PI * 1.05, Math.PI * 1.9);
      ctx.arc(78, 56, 13, Math.PI * 1.35, Math.PI * 0.5);
      ctx.closePath();
      ctx.stroke();

      // Three angled raindrops
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(47, 79);
      ctx.lineTo(43, 91);
      ctx.moveTo(63, 79);
      ctx.lineTo(59, 93);
      ctx.moveTo(79, 79);
      ctx.lineTo(75, 91);
      ctx.stroke();
      break;
    }
    case "solar": {
      // Central sun disc
      ctx.beginPath();
      ctx.arc(64, 64, 15, 0, Math.PI * 2);
      ctx.fill();

      // 8 radiating rays
      ctx.lineWidth = 5.5;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const inner = 23;
        const outer = 34;
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(angle) * inner, 64 + Math.sin(angle) * inner);
        ctx.lineTo(64 + Math.cos(angle) * outer, 64 + Math.sin(angle) * outer);
        ctx.stroke();
      }
      break;
    }
    case "humidity": {
      // Water droplet
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(64, 30);
      ctx.bezierCurveTo(64, 30, 88, 58, 88, 74);
      ctx.arc(64, 74, 24, 0, Math.PI);
      ctx.bezierCurveTo(40, 58, 64, 30, 64, 30);
      ctx.closePath();
      ctx.stroke();

      // Inner specular highlight arc
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(64, 74, 13, Math.PI * 0.62, Math.PI * 0.95);
      ctx.stroke();
      break;
    }
    default: {
      const exhaustive: never = variable;
      throw new Error(`Unhandled variable: ${String(exhaustive)}`);
    }
  }
}

export function getVariableIconTexture(
  variable: VariableId,
  colorHex: number,
): CanvasTexture {
  const quantized = colorHex & 0xffffff;
  const key = `${variable}:${quantized}`;
  const cached = iconTextureCache.get(key);
  if (cached) {
    return cached;
  }

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const cssColor = hexToCss(quantized);

    // Dark obsidian disc for contrast over MODIS clouds, polar ice, and night lights
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(4, 9, 15, 0.95)";
    ctx.fill();

    // Slope-colored outer ring
    ctx.lineWidth = 7;
    ctx.strokeStyle = cssColor;
    ctx.stroke();

    // Symbolic variable glyph
    drawVariableGlyph(ctx, variable, cssColor);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  iconTextureCache.set(key, texture);
  return texture;
}

export type VariableIconMarkerHandle = {
  group: Group;
  sprite: Sprite;
  material: SpriteMaterial;
  update: (variable: VariableId, colorHex: number) => void;
  dispose: () => void;
};

export function createVariableIconMarker(
  variable: VariableId,
  colorHex: number,
  size: number = ICON_MARKER_SIZE,
): VariableIconMarkerHandle {
  // Small obsidian anchor base on the exact lat/lon surface point
  const anchorGeometry = new CylinderGeometry(
    PIN_RADIUS * 0.85,
    PIN_RADIUS * 0.85,
    0.004,
    16,
  );
  anchorGeometry.translate(0, 0.002, 0);
  const anchorMaterial = new MeshBasicMaterial({ color: 0x04090f });
  const anchor = new Mesh(anchorGeometry, anchorMaterial);

  let currentVar = variable;
  let currentHex = colorHex & 0xffffff;

  const material = new SpriteMaterial({
    map: getVariableIconTexture(currentVar, currentHex),
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new Sprite(material);
  sprite.scale.set(size, size, 1);
  sprite.position.set(0, size * 0.52, 0);

  const group = new Group();
  group.add(anchor);
  group.add(sprite);

  const update = (nextVariable: VariableId, nextColorHex: number) => {
    const quantized = nextColorHex & 0xffffff;
    if (nextVariable === currentVar && quantized === currentHex) {
      return;
    }
    currentVar = nextVariable;
    currentHex = quantized;
    material.map = getVariableIconTexture(currentVar, currentHex);
    material.needsUpdate = true;
  };

  const dispose = () => {
    anchorGeometry.dispose();
    anchorMaterial.dispose();
    material.dispose();
  };

  return { group, sprite, material, update, dispose };
}

export function latLonToVector3(
  latitude: number,
  longitude: number,
  radius: number = GLOBE_RADIUS,
): Vector3 {
  const theta = ((90 - latitude) * Math.PI) / 180;
  const phi = ((longitude + 180) * Math.PI) / 180;
  const sinTheta = Math.sin(theta);
  return new Vector3(
    -radius * Math.cos(phi) * sinTheta,
    radius * Math.cos(theta),
    radius * Math.sin(phi) * sinTheta,
  );
}

export function orientGroupOnSphere(
  group: Group,
  latitude: number,
  longitude: number,
  radius: number = GLOBE_RADIUS,
): Vector3 {
  const surface = latLonToVector3(latitude, longitude, radius);
  group.position.copy(surface);
  const normal = surface.clone().normalize();
  const quat = new Quaternion().setFromUnitVectors(UP_AXIS, normal);
  group.quaternion.copy(quat);
  return surface;
}

export function createAtmosphereHaloMesh(
  radius: number = GLOBE_RADIUS,
  glowHex: number = 0x38bdf8,
): {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  geometry: SphereGeometry;
  material: ShaderMaterial;
} {
  const geometry = new SphereGeometry(radius * 1.065, 48, 36);
  const material = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(glowHex) },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(max(0.0, 0.58 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.4);
        gl_FragColor = vec4(uColor, intensity * 0.55);
      }
    `,
    blending: AdditiveBlending,
    side: BackSide,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  return { mesh, geometry, material };
}
