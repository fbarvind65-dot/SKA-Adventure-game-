import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import playerModelUrl from './Business_Female_01.glb?url';

const app = document.querySelector('#app');
document.body.style.cssText = 'margin:0;overflow:hidden;background:#9bb8c7;font-family:Arial,sans-serif;overscroll-behavior:none;touch-action:none';
app.style.cssText = 'position:fixed;inset:0;width:100%;height:100dvh;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none';
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eb8c8);
scene.fog = new THREE.FogExp2(0x9eb8c8, 0.0028);

const camera = new THREE.PerspectiveCamera( sixtyFive(), innerWidth / innerHeight, 0.1, 900 );
function sixtyFive(){ return 65; }
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));
renderer.domElement.style.touchAction='none';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

// Try to enter immersive landscape mode after the player's first tap.
// Browsers only allow orientation locking after a user gesture; installed
// versions also declare landscape in the web app manifest.
let landscapeRequested=false;
async function requestLandscape(){
 try{
  if(!document.fullscreenElement && app.requestFullscreen) await app.requestFullscreen();
 }catch(error){ console.info('Fullscreen request was not accepted:',error); }
 try{
  if(screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
 }catch(error){ console.info('Landscape lock needs an installed app or manual rotation:',error); }
}
app.addEventListener('pointerdown',requestLandscape,{once:true});

// Mobile-friendly fullscreen button. Fullscreen starts only after a user tap.
const fullButton=document.createElement('button');
fullButton.type='button';
fullButton.textContent='⛶';
fullButton.setAttribute('aria-label','Enter fullscreen');
fullButton.style.cssText='position:fixed;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));z-index:8;width:42px;height:42px;border:1px solid #ffffff88;border-radius:12px;background:#15232bd9;color:#fff;font-size:25px;line-height:1;touch-action:manipulation';
app.appendChild(fullButton);
fullButton.addEventListener('click',requestLandscape);


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
 // Raised parapet and rooftop service structures break up flat roof silhouettes.
 box(g,w+.12,.42,.18,materials.concrete,0,h+.43,-d/2+.12,false);
 box(g,w+.12,.42,.18,materials.concrete,0,h+.43,d/2-.12,false);
 box(g,.18,.42,d,materials.concrete,-w/2+.12,h+.43,0,false);
 box(g,.18,.42,d,materials.concrete,w/2-.12,h+.43,0,false);
 box(g,1.35,.9,1.15,materials.roof,w*.23,h+.72,-d*.18);
 box(g,1.05,.12,.9,materials.concrete,w*.23,h+1.2,-d*.18,false);
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
   // Deep stone sill and lintel add realistic depth to each window.
   box(g,1.12,.11,.22,materials.concrete,wx,wy-.73,d/2+.12,false);
   box(g,1.12,.09,.18,materials.concrete,wx,wy+.73,d/2+.10,false);
   // Selected windows receive small metal balconies.
   if((c+f+seed)%4===0){
    box(g,1.25,.12,.72,materials.concrete,wx,wy-.83,d/2+.38,false);
    const railMat=mat(0x454b4c,.48,.62);
    box(g,1.2,.055,.055,railMat,wx,wy-.28,d/2+.72,false);
    for(let post=0;post<5;post++){
     box(g,.035,.55,.035,railMat,wx-.58+post*.29,wy-.56,d/2+.72,false);
    }
   }
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
 const targetHeight = 2.35;
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
const vehicles=[];
function car(x,z,color){
 const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g); vehicles.push(g);
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
control.style.cssText='position:fixed;left:max(18px,env(safe-area-inset-left));bottom:max(24px,env(safe-area-inset-bottom));width:clamp(124px,22vw,150px);height:clamp(124px,22vw,150px);border:2px solid #ffffffaa;border-radius:50%;background:#17252c66;z-index:5;touch-action:none;backdrop-filter:blur(5px)';
const knob=document.createElement('div');
knob.style.cssText='position:absolute;width:54px;height:54px;left:calc(50% - 27px);top:calc(50% - 27px);border-radius:50%;background:#e8edf0dd;border:2px solid #fff;box-shadow:0 2px 8px #0005';
control.appendChild(knob); app.appendChild(control);
let moveX=0,moveY=0,dragging=false,runHeld=false;
function joystick(e){
 const r=control.getBoundingClientRect(),radius=r.width/2,limit=radius-29,dx=e.clientX-(r.left+radius),dy=e.clientY-(r.top+radius);
 const len=Math.hypot(dx,dy),scale=len>limit?limit/len:1,x=dx*scale,y=dy*scale;
 knob.style.left=`calc(50% - 27px + ${x}px)`;knob.style.top=`calc(50% - 27px + ${y}px)`;moveX=x/limit;moveY=y/limit;
}
control.addEventListener('pointerdown',e=>{dragging=true;control.setPointerCapture(e.pointerId);joystick(e)});
control.addEventListener('pointermove',e=>{if(dragging)joystick(e)});
function resetStick(){dragging=false;moveX=moveY=0;knob.style.left='calc(50% - 27px)';knob.style.top='calc(50% - 27px)'}
control.addEventListener('pointerup',resetStick);control.addEventListener('pointercancel',resetStick);
// Mobile sprint control.
const runButton=document.createElement('button');
runButton.type='button'; runButton.innerHTML='<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="15.5" cy="4.5" r="2"/><path d="m13 8-3 4 4 2 2 6M10 12l-4 2-2 5M13 8l4 2 3 4M8 7l3 1"/></svg>';
runButton.setAttribute('aria-label','Hold to run');
runButton.style.cssText='position:fixed;right:max(22px,env(safe-area-inset-right));bottom:max(38px,env(safe-area-inset-bottom));z-index:10000;width:clamp(64px,13vw,82px);height:clamp(64px,13vw,82px);display:flex;align-items:center;justify-content:center;border-radius:50%;border:2px solid #ffffffdd;background:#17252cdd;color:#fff;touch-action:none;box-shadow:0 4px 16px #0006';
app.appendChild(runButton);

// Context-aware mobile action buttons. Controls appear only when their action is available.
const actionIcons={
 JUMP:'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V4M5 11l7-7 7 7"/></svg>',
 FPP:'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
 MAP:'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 'GET IN':'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 13 2-6h14l2 6v6h-3v-2H6v2H3zM5 13h14M7 10h.01M17 10h.01"/></svg>',
 EXIT:'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h6v18h-6M10 17l5-5-5-5M15 12H3"/></svg>'
};
function makeActionButton(label, right, top, color='#17252cdd'){
 const b=document.createElement('button');
 b.type='button'; b.innerHTML=actionIcons[label]||'';
 b.setAttribute('aria-label',label);
 b.title=label;
 b.style.cssText=`position:fixed;right:${right};top:${top};z-index:10000;width:58px;height:58px;min-width:58px;min-height:58px;padding:0;display:flex;align-items:center;justify-content:center;border:2px solid #ffffffdd;border-radius:50%;background:${color};color:#fff;box-shadow:0 4px 14px #0009;touch-action:manipulation;visibility:visible;opacity:1;pointer-events:auto`;
 b.addEventListener('pointerdown',e=>e.stopPropagation());
 document.body.appendChild(b);
 return b;
}
const jumpButton=makeActionButton('JUMP','max(22px,env(safe-area-inset-right))','auto');
jumpButton.style.bottom='max(118px,calc(env(safe-area-inset-bottom) + 105px))';
const viewButton=makeActionButton('FPP','max(22px,env(safe-area-inset-right))','auto');
viewButton.style.bottom='max(178px,calc(env(safe-area-inset-bottom) + 165px))';
const mapButton=makeActionButton('MAP','max(22px,env(safe-area-inset-right))','auto');
mapButton.style.bottom='max(238px,calc(env(safe-area-inset-bottom) + 225px))';
const vehicleButton=makeActionButton('GET IN','50%','calc(50% + 35px)','#1c6846dd');
vehicleButton.style.right='50%'; vehicleButton.style.transform='translateX(50%)';
const exitVehicleButton=makeActionButton('EXIT','50%','calc(50% + 35px)','#7a3b2ddd');
exitVehicleButton.style.right='50%'; exitVehicleButton.style.transform='translateX(50%)';

let jumpVelocity=0, jumpActive=false, isDriving=false, activeVehicle=null, nearbyVehicle=null;
let firstPerson=false, mapOpen=false;
const mapPanel=document.createElement('div');
mapPanel.style.cssText='position:fixed;right:14px;top:68px;z-index:8;width:150px;height:150px;border:2px solid #ffffffaa;border-radius:12px;background:#17252cdd;color:#fff;display:none;overflow:hidden;pointer-events:none';
mapPanel.innerHTML='<div style="padding:6px 8px;font:700 11px Arial">CITY MAP</div><div style="position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:50%;background:#4cff91;box-shadow:0 0 0 5px #4cff9144"></div><div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#aab6bc88"></div><div style="position:absolute;top:50%;left:0;right:0;height:2px;background:#aab6bc88"></div>';
document.body.appendChild(mapPanel);
function toast(message){
 let t=document.getElementById('ska-action-toast');
 if(!t){t=document.createElement('div');t.id='ska-action-toast';t.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:15;padding:9px 13px;border-radius:10px;background:#15232beF;color:white;font:700 13px Arial,sans-serif;pointer-events:none';document.body.appendChild(t)}
 t.textContent=message;
}
jumpButton.addEventListener('click',()=>{
 if(!jumpActive&&!isDriving){jumpVelocity=6.2;jumpActive=true;}
});
viewButton.addEventListener('click',()=>{
 firstPerson=!firstPerson;
 cameraDistance=firstPerson?0.25:8.5;
 viewButton.setAttribute('aria-label',firstPerson?'Third-person view':'First-person view');
});
mapButton.addEventListener('click',()=>{
 mapOpen=!mapOpen; mapPanel.style.display=mapOpen?'block':'none';
});
vehicleButton.addEventListener('click',()=>{
 if(!nearbyVehicle||isDriving)return;
 activeVehicle=nearbyVehicle; isDriving=true; player.visible=false;
 player.position.copy(activeVehicle.position);
 toast('Driving · Use joystick to move · EXIT to leave');
});
exitVehicleButton.addEventListener('click',()=>{
 if(!isDriving||!activeVehicle)return;
 player.position.set(activeVehicle.position.x+2.2,0,activeVehicle.position.z);
 player.visible=true; isDriving=false; activeVehicle=null;
 toast('You left the vehicle');
});
runButton.addEventListener('pointerdown',e=>{e.preventDefault();runHeld=true;runButton.style.background='#286b42dd';runButton.setPointerCapture(e.pointerId)});
function stopRun(){runHeld=false;runButton.style.background='#17252cbb'}
runButton.addEventListener('pointerup',stopRun);runButton.addEventListener('pointercancel',stopRun);runButton.addEventListener('lostpointercapture',stopRun);

const hud=document.createElement('div');
hud.style.cssText='position:fixed;top:max(14px,env(safe-area-inset-top));left:max(14px,env(safe-area-inset-left));z-index:4;color:#fff;text-shadow:0 2px 5px #000;background:#15232bd9;border:1px solid #ffffff45;border-radius:12px;padding:10px 13px;font-size:clamp(12px,2.5vw,14px);letter-spacing:.3px;backdrop-filter:blur(8px);pointer-events:none';
hud.innerHTML='<strong style="font-size:17px;letter-spacing:1.4px">SKA ADVENTURE</strong><div style="margin-top:5px;color:#d6e2e7">OPEN WORLD · CITY DISTRICT</div>';
app.appendChild(hud);
const hint=document.createElement('div');
hint.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));z-index:4;padding:8px 11px;border-radius:9px;background:#15232bd9;color:#fff;font-size:clamp(10px,2.5vw,12px);border:1px solid #ffffff45;white-space:nowrap;pointer-events:none';
hint.textContent='Move: joystick · Hold RUN to sprint · Drag: 360° camera';
app.appendChild(hint);

const clock=new THREE.Clock();
const desiredCamera=new THREE.Vector3();
const lookTarget=new THREE.Vector3();
let walkTime=0;

// 360-degree camera: drag anywhere on the world view to orbit around the player.
let cameraYaw=0, cameraPitch=0.28, cameraDistance=8.5;
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
 cameraDistance=THREE.MathUtils.clamp(cameraDistance+e.deltaY*.012,6.5,18);
},{passive:true});
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 let x=moveX+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
 let y=moveY+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 const length=Math.hypot(x,y); if(length>1){x/=length;y/=length}
 const moving=Math.hypot(x,y)>.08;

// Detect nearby parked cars so GET IN appears only when useful.
 nearbyVehicle=null;
 if(!isDriving){
  let nearest=5.2;
  for(const vehicle of vehicles){
   const distance=Math.hypot(player.position.x-vehicle.position.x,player.position.z-vehicle.position.z);
   if(distance<nearest){nearest=distance;nearbyVehicle=vehicle;}
  }
 }
 vehicleButton.style.display=nearbyVehicle&&!isDriving?'block':'none';
 exitVehicleButton.style.display=isDriving?'block':'none';
 jumpButton.style.display=isDriving?'none':'block';
 viewButton.style.display='block'; mapButton.style.display='block';
 if(jumpActive&&!isDriving){
  player.position.y+=jumpVelocity*dt;
  jumpVelocity-=15*dt;
  if(player.position.y<=0){player.position.y=0;jumpVelocity=0;jumpActive=false;}
 }
 if (characterMixer) {
  setCharacterAnimation(moving ? ((runHeld || keys.shift) ? 'run' : 'walk') : 'idle');
  characterMixer.update(dt);
 }
 if(moving){
  const sprinting=runHeld||keys.shift;
  if(isDriving&&activeVehicle){
   const driveSpeed=sprinting?13:8;
   const driveX=(x*Math.cos(cameraYaw))+(y*Math.sin(cameraYaw));
   const driveZ=-(x*Math.sin(cameraYaw))-(y*Math.cos(cameraYaw));
   activeVehicle.position.x=THREE.MathUtils.clamp(activeVehicle.position.x+driveX*driveSpeed*dt,-95,95);
   activeVehicle.position.z=THREE.MathUtils.clamp(activeVehicle.position.z+driveZ*driveSpeed*dt,-245,245);
   player.position.copy(activeVehicle.position);
  }else{
  const speed=sprinting?8.2:5.2;
  // Keep the player outside parked vehicles instead of allowing the model to pass through them.
  // Translate joystick input relative to the camera: UP always moves away
  // from the camera's view direction, DOWN moves toward it.
  // Camera-relative controls: joystick up (negative y) always moves
  // away from the camera; joystick down always moves toward the camera.
  const worldX=(x*Math.cos(cameraYaw))+(y*Math.sin(cameraYaw));
  const worldZ=-(x*Math.sin(cameraYaw))-(y*Math.cos(cameraYaw));
  const nextX=THREE.MathUtils.clamp(player.position.x+worldX*speed*dt,-95,95);
  const nextZ=THREE.MathUtils.clamp(player.position.z+worldZ*speed*dt,-245,245);
  const playerRadius=.62;
  let blockedX=false,blockedZ=false;
  for(const vehicle of vehicles){
   const dx=nextX-vehicle.position.x;
   const dz=nextZ-vehicle.position.z;
   const insideX=Math.abs(dx)<1.35+playerRadius;
   const insideZ=Math.abs(dz)<2.25+playerRadius;
   if(insideX&&insideZ){
    if(Math.abs(dx)>Math.abs(dz)) blockedZ=true;
    else blockedX=true;
   }
  }
  if(!blockedX) player.position.x=nextX;
  if(!blockedZ) player.position.z=nextZ;
  player.rotation.y=Math.atan2(worldX,worldZ);
  }
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
 lookTarget.set(player.position.x,firstPerson?1.55:1.25,player.position.z-1.4);
 camera.lookAt(lookTarget);
 renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
