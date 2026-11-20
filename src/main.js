import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import playerModelUrl from './Business_Female_01.glb?url';

const app = document.querySelector('#app');
document.body.style.cssText = 'margin:0;overflow:hidden;background:#9bb8c7;font-family:Arial,sans-serif';
app.style.cssText = 'position:fixed;inset:0;overflow:hidden';
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eb8c8);
scene.fog = new THREE.FogExp2(0x9eb8c8, 0.0028);

const camera = new THREE.PerspectiveCamera( sixtyFive(), innerWidth / innerHeight, 0.1, 900 );
function sixtyFive(){ return 65; }
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.domElement.style.touchAction='none';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdceeff,0x65715b,1.65));
const sun = new THREE.DirectionalLight(0xffe5c2,3.0);
sun.position.set(-65,100,45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-100; sun.shadow.camera.right=100;
sun.shadow.camera.top=100; sun.shadow.camera.bottom=-100;
sun.shadow.bias=-0.00015;
scene.add(sun);

const mat=(color,roughness=0.85,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const materials={
 grass:mat(0x637b4d), asphalt:mat(0x30363a), line:mat(0xd8d1b6),
 sidewalk:mat(0x9a9b91), concrete:mat(0xb6ad9b), brick:mat(0xa66e50),
 plaster:mat(0xd1c5ad), roof:mat(0x514b46), glass: new THREE.MeshStandardMaterial({color:0x668b9c,roughness:.22,metalness:.35}),
 darkGlass:new THREE.MeshStandardMaterial({color:0x253d49,roughness:.18,metalness:.4}),
 bark:mat(0x57402f), leaf:mat(0x405d38), leaf2:mat(0x587247),
 white:mat(0xe5e1d6), black:mat(0x202326,.55), rubber:mat(0x17191a,.95),
 skin:new THREE.MeshStandardMaterial({color:0x9b6749,roughness:.78,metalness:0}), shirt:mat(0x17191b,.96), pants:mat(0x252a30,.92), shoe:mat(0xe5e5df,.62)
};

function box(parent,w,h,d,material,x,y,z,cast=true){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 m.position.set(x,y,z); m.castShadow=cast; m.receiveShadow=true; parent.add(m); return m;
}
function cylinder(parent,rt,rb,h,material,x,y,z,segments=12){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);
 m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function sphere(parent,r,material,x,y,z,sx=1,sy=1,sz=1){
 const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),material);
 m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=true; parent.add(m); return m;
}

// Large terrain with a subtle natural color variation.
const ground= new THREE.Mesh(new THREE.PlaneGeometry(700,700,1,1),materials.grass);
ground.rotation.x=-Math.PI/2; ground.position.y=-.08; ground.receiveShadow=true; scene.add(ground);

// Main avenue, sidewalks, lane markings and side streets.
function road(x,z,w,d){
 box(scene,w,.12,d,materials.asphalt,x,.0,z,false);
}
road(0,0,13,520);
road(-48,0,9,520); road(48,0,9,520);
road(0,-58,180,10); road(0,58,180,10);
for(let z=-245;z<250;z+=12){
 box(scene,.16,.025,5,materials.line,0,.075,z,false);
}
for(const side of [-1,1]){
 box(scene,2.3,.18,520,materials.sidewalk,side*7.65,.12,0,false);
 box(scene,2.3,.18,520,materials.sidewalk,side*10.5,.12,0,false);
 for(let z=-240;z<250;z+=5){
  box(scene,2.3,.19,.12,materials.concrete,side*7.65,.22,z,false);
 }
}

// Town blocks: distinct buildings with real facades, rooflines, windows and doors.
const windowMat=materials.glass;
function building(x,z,w,d,h,wall,seed=0){
 const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
 box(g,w,h,d,wall,0,h/2,0);
 box(g,w+.35,.28,d+.35,materials.roof,0,h+.12,0);
 box(g,w*.94,.18,d*.94,materials.concrete,0,.12,0);
 const floors=Math.max(1,Math.floor((h-1.5)/3.1));
 const cols=Math.max(2,Math.floor(w/2.25));
 for(let f=0;f<floors;f++){
  for(let c=0;c<cols;c++){
   const wx=-w/2+(c+.5)*w/cols;
   const wy=1.65+f*3.05;
   box(g,.92,1.28,.09,windowMat,wx,wy,d/2+.055,false);
   box(g,1.02,.09,.13,materials.white,wx,wy-.7,d/2+.08,false);
   box(g,.08,1.35,.13,materials.white,wx-.51,wy,d/2+.08,false);
   box(g,.08,1.35,.13,materials.white,wx+.51,wy,d/2+.08,false);
  }
 }
 box(g,1.25,2.25,.12,materials.roof,0,1.15,d/2+.08);
 box(g,.08,2.1,.15,materials.white,-.66,1.15,d/2+.16);
 return g;
}
const facades=[0xc7b69b,0xb9b0a0,0xc8c0b1,0xa98c72,0xd0c8b8,0x9faaa6];
for(let z=-220;z<=220;z+=32){
 for(const side of [-1,1]){
  const x=side*(18+Math.sin(z*.08)*2);
  const height=10+((Math.abs(z/32)%3)*3);
  building(x,z,12,17,height,mat(facades[Math.abs(Math.floor(z/32))%facades.length]));
  building(side*34,z+9,15,19,8+((Math.abs(z/32)%2)*4),mat(facades[(Math.abs(Math.floor(z/32))+2)%facades.length]));
 }
}

// Street lamps and trees create scale and depth.
const lampMetal=mat(0x343a3b,.42,.65);
const lampGlow=new THREE.MeshStandardMaterial({color:0xffe7b5,emissive:0xffd28a,emissiveIntensity:1.5});
for(let z=-225;z<230;z+=28){
 for(const side of [-1,1]){
  const x=side*11.8;
  cylinder(scene,.09,.12,5.8,lampMetal,x,2.9,z,10);
  const arm=box(scene,.12,.12,1.25,lampMetal,x-side*.55,5.65,z,false); arm.rotation.y=side*.08;
  sphere(scene,.19,lampGlow,x-side*1.05,5.55,z,1.35,.55,.65);
 }
}
function tree(x,z,scale=1){
 const g=new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(scale); scene.add(g);
 cylinder(g,.22,.34,3.2,materials.bark,0,1.6,0,9);
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5;
  sphere(g,1.35, i%2?materials.leaf:materials.leaf2,Math.cos(a)*.65,3.65+(i%2)*.3,Math.sin(a)*.65,1,1.1,1);
 }
 sphere(g,1.35,materials.leaf,0,4.35,0,1.1,1.05,1.1);
}
for(let z=-230;z<235;z+=17){
 for(const side of [-1,1]){
  tree(side*(14.5+(Math.sin(z)*.5)),z,0.85+(Math.abs(Math.sin(z*.13))*.35));
  if(Math.abs(z%64)>12) tree(side*(58+Math.sin(z*.1)*8),z+5,.9);
 }
}

// Park strips and distant low hills.
for(const side of [-1,1]){
 const park=box(scene,16,.04,120,mat(0x71865b),side*77,-.01,0,false);
}
for(let i=0;i<24;i++){
 const hill=sphere(scene,1,mat(i%2?0x74886b:0x839078),-290+i*25,-8,-260,18+Math.random()*12,8+Math.random()*8,20);
 hill.castShadow=false;
}

// Detailed player rig, with articulated limbs and a grounded human silhouette.
const player=new THREE.Group(); scene.add(player);
const torso= new THREE.Group(); player.add(torso);
const skin=materials.skin;
const shirt=materials.shirt;
const limbGeo=new THREE.CapsuleGeometry(.115,.48,5,10);
function limb(parent,material,x,y,z){
 const m=new THREE.Mesh(limbGeo,material); m.position.set(x,y,z); m.castShadow=true; parent.add(m); return m;
}
const body= new THREE.Mesh(new THREE.CapsuleGeometry(.31,.64,8,16),shirt);
body.position.y=1.28; body.castShadow=true; body.receiveShadow=true; torso.add(body);
// Black hoodie details: hood, front pouch, seams and drawstrings.
const hood=sphere(torso,.245,shirt,0,1.72,-.13,1.08,.92,.72);
const hoodOpening=sphere(torso,.155,mat(0x090a0b),0,1.76,-.205,1,.9,.42);
const pouch=box(torso,.39,.22,.075,mat(0x222426),0,1.12,.278);
pouch.rotation.x=-.08;
for(const side of [-1,1]){
 const cord=cylinder(torso,.012,.012,.24,mat(0xbdbbb4),side*.065,1.55,.29,7);
 cord.rotation.x=.12;
 sphere(torso,.018,mat(0xbdbbb4),side*.065,1.42,.29,.8,1.2,.8);
}
const logoCanvas=document.createElement('canvas');
logoCanvas.width=512; logoCanvas.height=256;
const logoCtx=logoCanvas.getContext('2d');
logoCtx.clearRect(0,0,512,256);
logoCtx.fillStyle='#f1f0e9'; logoCtx.textAlign='center';
logoCtx.font='900 112px Arial'; logoCtx.fillText('SKA',256,125);
logoCtx.font='bold 34px Arial'; logoCtx.fillText('ADVENTURE',256,174);
const logoTexture=new THREE.CanvasTexture(logoCanvas);
const logo=new THREE.Mesh(new THREE.PlaneGeometry(.34,.17),new THREE.MeshBasicMaterial({map:logoTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
logo.position.set(0,1.42,.304); torso.add(logo);
const neck=cylinder(torso,.09,.1,.2,skin,0,1.79,0,12);
const head=sphere(torso,.235,skin,0,2.03,0,1,1.13,.95);
// Facial structure and features, facing the character's forward (+Z) direction.
const eyeWhite=new THREE.MeshStandardMaterial({color:0xe9e4dc,roughness:.42});
const iris=mat(0x382b22,.35), hairMat=mat(0x211c19,.86), browMat=mat(0x30251f,.9);
for(const side of [-1,1]){
 sphere(torso,.045,skin,side*.235,2.02,0,.72,1.15,.82); // ears
 sphere(torso,.032,eyeWhite,side*.088,2.075,.199,1,.8,.48);
 sphere(torso,.017,iris,side*.088,2.075,.224,1,1,.55);
 sphere(torso,.009,materials.black,side*.088,2.075,.233,1,1,.5);
 const brow=sphere(torso,.047,browMat,side*.088,2.132,.194,1,.22,.42);
 brow.rotation.z=side*.1;
}
const nose=sphere(torso,.052,skin,0,2.005,.225,.62,.8,.78);
const mouth=sphere(torso,.043,mat(0x684238,.8),0,1.94,.207,.8,.18,.25);
const chin=sphere(torso,.105,skin,0,1.89,.105,.9,.48,.75);
// Hair cap and separate side locks instead of a smooth featureless ball.
const hair= new THREE.Mesh(new THREE.SphereGeometry(.24,24,16),hairMat);
hair.position.set(0,2.145,-.015); hair.scale.set(1, .57, 1); torso.add(hair);
// Layered swept-up hair locks for a less generic silhouette.
for(let i=0;i<7;i++){
 const lock=sphere(torso,.085,hairMat,(i-3)*.052,2.235+Math.sin(i*.7)*.035,.025,.72,1.45,.72);
 lock.rotation.z=-.28-(i*.035);
}
for(const side of [-1,1]){
 sphere(torso,.09,hairMat,side*.19,2.08,.005,.65,1.1,.85);
}

const pants=materials.pants;
const leftLeg=new THREE.Group(); leftLeg.position.set(-.14,.92,0); torso.add(leftLeg);
const rightLeg=new THREE.Group(); rightLeg.position.set(.14,.92,0); torso.add(rightLeg);
limb(leftLeg,pants,0,-.34,0); box(leftLeg,.25,.16,.46,materials.shoe,0,-.67,.12);
limb(rightLeg,pants,0,-.34,0); box(rightLeg,.25,.16,.46,materials.shoe,0,-.67,.12);
for(const leg of [leftLeg,rightLeg]){
 box(leg,.255,.045,.47,mat(0xb8b9b5),0,-.745,.13,false);
}
const leftArm=new THREE.Group(); leftArm.position.set(-.37,1.53,0); torso.add(leftArm);
const rightArm=new THREE.Group(); rightArm.position.set(.37,1.53,0); torso.add(rightArm);
limb(leftArm,shirt,0,-.27,0); limb(leftArm,skin,0,-.66,0);
limb(rightArm,shirt,0,-.27,0); limb(rightArm,skin,0,-.66,0);
for(const arm of [leftArm,rightArm]){
 sphere(arm,.105,skin,0,-.83,.005,1,.85,.8);
 for(let finger=0;finger<4;finger++){
  const fx=(finger-1.5)*.045;
  const digit=limb(arm,skin,fx,-.91,.025);
  digit.scale.set(.25,.48,.25);
 }
}
player.position.set(0,0,18);

// Load the uploaded GLB character and use its embedded animations when available.
let characterMixer = null;
let characterActions = {};
let activeCharacterAction = null;
let characterAnimationState = '';
const characterLoader = new GLTFLoader();
characterLoader.setMeshoptDecoder(MeshoptDecoder);
characterLoader.load(playerModelUrl, (gltf) => {
 const character = gltf.scene;
 const bounds = new THREE.Box3().setFromObject(character);
 const size = bounds.getSize(new THREE.Vector3());
 const center = bounds.getCenter(new THREE.Vector3());
 const targetHeight = 2.15;
 const scale = targetHeight / Math.max(size.y, 0.001);
 character.scale.setScalar(scale);
 character.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
 character.traverse((object) => {
  if (object.isMesh) {
   object.castShadow = true;
   object.receiveShadow = true;
  }
 });
 player.add(character);
 // Use the uploaded model instead of the procedural placeholder.
 torso.visible = false;
 if (gltf.animations && gltf.animations.length) {
  characterMixer = new THREE.AnimationMixer(character);
  const findClip = (pattern) => gltf.animations.find((clip) => pattern.test(clip.name));
  const idleClip = findClip(/idle|stand|breath/i) || gltf.animations[0];
  const walkClip = findClip(/walk|walking/i) || idleClip;
  const runClip = findClip(/run|running|jog/i) || walkClip;
  characterActions = {
   idle: characterMixer.clipAction(idleClip),
   walk: characterMixer.clipAction(walkClip),
   run: characterMixer.clipAction(runClip)
  };
  setCharacterAnimation('idle');
 }
}, undefined, (error) => {
 console.error('Could not load SKA Adventure GLB character:', error);
 const modelError = document.createElement('div');
 modelError.style.cssText = 'position:fixed;left:12px;right:12px;top:110px;z-index:20;padding:12px 14px;border-radius:10px;background:#541f1feF;color:#fff;font:13px Arial,sans-serif;line-height:1.45;white-space:normal;overflow-wrap:anywhere';
 modelError.textContent = '3D character could not load: ' + (error?.message || error?.type || 'Unknown loading error');
 app.appendChild(modelError);
});
function setCharacterAnimation(state) {
 if (!characterMixer || !characterActions[state] || characterAnimationState === state) return;
 const nextAction = characterActions[state];
 if (activeCharacterAction && activeCharacterAction !== nextAction) activeCharacterAction.fadeOut(0.18);
 nextAction.reset().fadeIn(0.18).play();
 activeCharacterAction = nextAction;
 characterAnimationState = state;
}

// Parked vehicles along the road.
function car(x,z,color){
 const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
 const paint=new THREE.MeshStandardMaterial({color,metalness:.58,roughness:.3});
 box(g,2.05,.62,4.2,paint,0,.85,0);
 box(g,1.62,.72,2.25,materials.darkGlass,0,1.48,-.12);
 box(g,1.92,.14,4.05,materials.black,0,.53,0);
 for(const sx of [-1,1]) for(const sz of [-1,1]){
  const wheel=cylinder(g,.39,.39,.22,materials.rubber,sx*1.02,.48,sz*1.35,18);
  wheel.rotation.z=Math.PI/2;
  cylinder(g,.2,.2,.235,mat(0x9da3a4,.25,.8),sx*1.02,.48,sz*1.35,16).rotation.z=Math.PI/2;
 }
 box(g,.42,.16,.08,lampGlow,-.65,.92,2.13,false);
 box(g,.42,.16,.08,lampGlow,.65,.92,2.13,false);
 return g;
}
car(-5.1,-22,0x7f3330); car(5.1,42,0x394b5c);
car(-5.1,93,0xc1bdb2);

// World interaction and responsive controls.
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
const control=document.createElement('div');
control.style.cssText='position:fixed;left:22px;bottom:22px;width:124px;height:124px;border:2px solid #ffffff99;border-radius:50%;background:#17252c55;z-index:5;touch-action:none;backdrop-filter:blur(4px)';
const knob=document.createElement('div');
knob.style.cssText='position:absolute;width:52px;height:52px;left:34px;top:34px;border-radius:50%;background:#e8edf0cc;border:1px solid #fff';
control.appendChild(knob); app.appendChild(control);
let moveX=0,moveY=0,dragging=false,runHeld=false;
function joystick(e){
 const r=control.getBoundingClientRect(),dx=e.clientX-(r.left+62),dy=e.clientY-(r.top+62);
 const len=Math.hypot(dx,dy),scale=len>39?39/len:1,x=dx*scale,y=dy*scale;
 knob.style.left=(36+x)+'px';knob.style.top=(36+y)+'px';moveX=x/39;moveY=y/39;
}
control.addEventListener('pointerdown',e=>{dragging=true;control.setPointerCapture(e.pointerId);joystick(e)});
control.addEventListener('pointermove',e=>{if(dragging)joystick(e)});
function resetStick(){dragging=false;moveX=moveY=0;knob.style.left='34px';knob.style.top='34px'}
control.addEventListener('pointerup',resetStick);control.addEventListener('pointercancel',resetStick);
// Mobile sprint control.
const runButton=document.createElement('button');
runButton.type='button'; runButton.textContent='RUN';
runButton.setAttribute('aria-label','Hold to run');
runButton.style.cssText='position:fixed;right:24px;bottom:38px;z-index:6;width:76px;height:76px;border-radius:50%;border:2px solid #ffffffbb;background:#17252cbb;color:#fff;font-weight:800;letter-spacing:1px;font-size:14px;touch-action:none;box-shadow:0 4px 16px #0005';
app.appendChild(runButton);
runButton.addEventListener('pointerdown',e=>{e.preventDefault();runHeld=true;runButton.style.background='#286b42dd';runButton.setPointerCapture(e.pointerId)});
function stopRun(){runHeld=false;runButton.style.background='#17252cbb'}
runButton.addEventListener('pointerup',stopRun);runButton.addEventListener('pointercancel',stopRun);runButton.addEventListener('lostpointercapture',stopRun);

const hud=document.createElement('div');
hud.style.cssText='position:fixed;top:16px;left:16px;z-index:4;color:#fff;text-shadow:0 2px 5px #000;background:#15232bb8;border:1px solid #ffffff35;border-radius:10px;padding:10px 13px;font-size:13px;letter-spacing:.3px;backdrop-filter:blur(8px)';
hud.innerHTML='<strong style="font-size:17px;letter-spacing:1.4px">SKA ADVENTURE</strong><div style="margin-top:5px;color:#d6e2e7">OPEN WORLD · CITY DISTRICT</div>';
app.appendChild(hud);
const hint=document.createElement('div');
hint.style.cssText='position:fixed;right:14px;bottom:20px;z-index:4;padding:9px 12px;border-radius:9px;background:#15232bb8;color:#fff;font-size:12px;border:1px solid #ffffff35';
hint.textContent='Move: joystick · Hold RUN to sprint · Drag: 360° camera';
app.appendChild(hint);

const clock=new THREE.Clock();
const desiredCamera=new THREE.Vector3();
const lookTarget=new THREE.Vector3();
let walkTime=0;

// 360-degree camera: drag anywhere on the world view to orbit around the player.
let cameraYaw=0, cameraPitch=0.22, cameraDistance=10.5;
let cameraPointer=null, lastPointerX=0, lastPointerY=0;
renderer.domElement.addEventListener('pointerdown',e=>{
 cameraPointer=e.pointerId; lastPointerX=e.clientX; lastPointerY=e.clientY;
 renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(cameraPointer!==e.pointerId)return;
 const dx=e.clientX-lastPointerX,dy=e.clientY-lastPointerY;
 lastPointerX=e.clientX;lastPointerY=e.clientY;
 cameraYaw-=dx*.008;
 cameraPitch=THREE.MathUtils.clamp(cameraPitch+dy*.006,-.12,1.05);
});
function stopCameraDrag(e){if(cameraPointer===e.pointerId)cameraPointer=null}
renderer.domElement.addEventListener('pointerup',stopCameraDrag);
renderer.domElement.addEventListener('pointercancel',stopCameraDrag);
renderer.domElement.addEventListener('wheel',e=>{
 cameraDistance=THREE.MathUtils.clamp(cameraDistance+e.deltaY*.012,5.5,22);
},{passive:true});
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 let x=moveX+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
 let y=moveY+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 const length=Math.hypot(x,y); if(length>1){x/=length;y/=length}
 const moving=Math.hypot(x,y)>.08;
 if (characterMixer) {
  setCharacterAnimation(moving ? ((runHeld || keys.shift) ? 'run' : 'walk') : 'idle');
  characterMixer.update(dt);
 }
 if(moving){
  const sprinting=runHeld||keys.shift;
  const speed=sprinting?8.2:5.2;
  player.position.x+=x*speed*dt;
  player.position.z+=y*speed*dt;
  player.position.x=THREE.MathUtils.clamp(player.position.x,-95,95);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-245,245);
  player.rotation.y=Math.atan2(x,y);
  walkTime+=dt*10;
  leftLeg.rotation.x=Math.sin(walkTime)*.58;
  rightLeg.rotation.x=-Math.sin(walkTime)*.58;
  leftArm.rotation.x=-Math.sin(walkTime)*.38;
  rightArm.rotation.x=Math.sin(walkTime)*.38;
  torso.position.y=Math.abs(Math.sin(walkTime*2))*.025;
 }else{
  leftLeg.rotation.x=THREE.MathUtils.damp(leftLeg.rotation.x,0,10,dt);
  rightLeg.rotation.x=THREE.MathUtils.damp(rightLeg.rotation.x,0,10,dt);
  leftArm.rotation.x=THREE.MathUtils.damp(leftArm.rotation.x,0,10,dt);
  rightArm.rotation.x=THREE.MathUtils.damp(rightArm.rotation.x,0,10,dt);
  torso.position.y=THREE.MathUtils.damp(torso.position.y,0,10,dt);
  torso.rotation.x=THREE.MathUtils.damp(torso.rotation.x,0,8,dt);
 }
 const horizontalDistance=Math.cos(cameraPitch)*cameraDistance;
 desiredCamera.set(
  player.position.x+Math.sin(cameraYaw)*horizontalDistance,
  player.position.y+2.2+Math.sin(cameraPitch)*cameraDistance,
  player.position.z+Math.cos(cameraYaw)*horizontalDistance
 );
 camera.position.lerp(desiredCamera,1-Math.exp(-4*dt));
 lookTarget.set(player.position.x,1.25,player.position.z-1.4);
 camera.lookAt(lookTarget);
 renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
