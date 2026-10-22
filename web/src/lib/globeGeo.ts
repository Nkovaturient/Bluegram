import {
  AdditiveBlending,
  BackSide,
  Color,
  ConeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";

export const GLOBE_RADIUS = 1;
export const PIN_HEIGHT = 0.055;
export const PIN_RADIUS = 0.014;

const UP_AXIS = new Vector3(0, 1, 0);

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

export function createSlopePinMesh(colorHex: number): {
  group: Group;
  pin: Mesh<ConeGeometry, MeshBasicMaterial>;
  geometry: ConeGeometry;
  material: MeshBasicMaterial;
} {
  const geometry = new ConeGeometry(PIN_RADIUS * 1.25, PIN_HEIGHT * 1.2, 12);
  geometry.translate(0, (PIN_HEIGHT * 1.2) / 2, 0);
  const material = new MeshBasicMaterial({ color: colorHex });
  const pin = new Mesh(geometry, material);
  const group = new Group();
  group.add(pin);
  return { group, pin, geometry, material };
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
