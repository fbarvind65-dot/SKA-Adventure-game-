
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 35, 120);

const camera = new THREE.PerspectiveCamera(
  65, window.innerWidth / window.innerHeight, 0.1, 500
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(10, 20, 10);
sun.castShadow = true;
scene.add(sun);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x398b42 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Road
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 200),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
scene.add(road);

// Human character
const player = new THREE.Group();
scene.add(player);

function part(parent, geometry, color, x, y, z) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// Body
part(player, new THREE.CapsuleGeometry(0.35, 0.75, 4, 8),
  0x2455cc, 0, 1.35, 0);

// Head
part(player, new THREE.SphereGeometry(0.27, 20, 16),
  0xe2ad83, 0, 2.15, 0);

// Hair
part(player, new THREE.SphereGeometry(0.28, 20, 12),
  0x29201b, 0, 2.32, 0);

// Arms
const leftArm = part(player,
  new THREE.CapsuleGeometry(0.11, 0.55, 4, 8),
  0xe2ad83, -0.46, 1.42, 0);

const rightArm = part(player,
  new THREE.CapsuleGeometry(0.11, 0.55, 4, 8),
  0xe2ad83, 0.46, 1.42, 0);

// Legs
const leftLeg = part(player,
  new THREE.CapsuleGeometry(0.14, 0.55, 4, 8),
  0x222b40, -0.17, 0.48, 0);

const rightLeg = part(player,
  new THREE.CapsuleGeometry(0.14, 0.55, 4, 8),
  0x222b40, 0.17, 0.48, 0);

player.position.y = 0;

// Trees
for (let i = 0; i < 35; i++) {
  const x = (Math.random() - 0.5) * 65;
  const z = (Math.random() - 0.5) * 100;

  if (Math.abs(x) < 7) continue;

  part(scene, new THREE.CylinderGeometry(0.18, 0.25, 2),
    0x684326, x, 1, z);

  part(scene, new THREE.ConeGeometry(1.3, 3, 8),
    0x176b30, x, 3, z);
}

// Mobile joystick
const joystick = document.createElement('div');
joystick.style.cssText = `
position:fixed;bottom:35px;left:30px;
width:120px;height:120px;border-radius:50%;
background:#ffffff55;border:2px solid white;
touch-action:none;z-index:10;
`;
document.body.appendChild(joystick);

const knob = document.createElement('div');
knob.style.cssText = `
position:absolute;left:35px;top:35px;
width:50px;height:50px;border-radius:50%;
background:#ffffffcc;
`;
joystick.appendChild(knob);

let moveX = 0;
let moveY = 0;
let active = false;

function updateJoystick(e) {
  const rect = joystick.getBoundingClientRect();
  const dx = e.clientX - (rect.left + 60);
  const dy = e.clientY - (rect.top + 60);
  const distance = Math.min(40, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);

  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  knob.style.left = `${35 + x}px`;
  knob.style.top = `${35 + y}px`;

  moveX = x / 40;
  moveY = y / 40;
}

joystick.addEventListener('pointerdown', e => {
  active = true;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener('pointermove', e => {
  if (active) updateJoystick(e);
});

function stopMove() {
  active = false;
  moveX = 0;
  moveY = 0;
  knob.style.left = '35px';
  knob.style.top = '35px';
}

joystick.addEventListener('pointerup', stopMove);
joystick.addEventListener('pointercancel', stopMove);

// Camera
camera.position.set(0, 5, 8);

let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const moving = Math.abs(moveX) + Math.abs(moveY) > 0.1;

  if (moving) {
    const speed = 5 * delta;

    player.position.x += moveX * speed;
    player.position.z += moveY * speed;

    player.rotation.y = Math.atan2(moveX, moveY);

    const t = performance.now() * 0.01;
    leftLeg.rotation.x = Math.sin(t) * 0.65;
    rightLeg.rotation.x = -Math.sin(t) * 0.65;
    leftArm.rotation.x = -Math.sin(t) * 0.4;
    rightArm.rotation.x = Math.sin(t) * 0.4;
  } else {
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;
    leftArm.rotation.x = 0;
    rightArm.rotation.x = 0;
  }

  const target = new THREE.Vector3(
    player.position.x,
    3.5,
    player.position.z + 7
  );

  camera.position.lerp(target, 0.08);
  camera.lookAt(
    player.position.x,
    1.2,
    player.position.z
  );

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
