import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const mount=document.querySelector('#world');
const scene=new THREE.Scene();
scene.background=new THREE.Color('#a57668');
scene.fog=new THREE.FogExp2('#a57668',0.0025);
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,600);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;mount.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight('#d8efff','#69524b',2.1));
const sun=new THREE.DirectionalLight('#ffd0a1',3.3);sun.position.set(-65,100,35);scene.add(sun);
const fill=new THREE.DirectionalLight('#88ccda',.7);fill.position.set(45,28,-80);scene.add(fill);
const mat=(color,roughness=.85,metalness=0,emissive=null)=>new THREE.MeshStandardMaterial({color,roughness,metalness,...(emissive?{emissive:new THREE.Color(emissive),emissiveIntensity:.42}:{})});
const groundMat=mat('#66766c'),roadMat=mat('#343b40'),sidewalkMat=mat('#a6a49a'),lineMat=mat('#e6c891',.65),buildingMats=['#c2a48b','#788b90','#bc8771','#d0b596','#6d7980','#d3c3a3','#998b7a'].map(c=>mat(c)),windowMat=mat('#273d4a',.32,.2),litWindowMat=mat('#f3c688',.35,0,'#e6a94f');
const box=(parent,w,h,d,material,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m};
const plane=(parent,w,d,material,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);return m};
plane(scene,600,600,groundMat,0,-.16,0);
// A warm bay at the southern edge gives the streets a clear destination.
const waterMat=new THREE.MeshStandardMaterial({color:'#3c7881',roughness:.36,metalness:.18,transparent:true,opacity:.94});plane(scene,600,500,waterMat,0,-.22,390);
const roadXs=[-100,-60,-20,20,60,100],roadZs=[-100,-60,-20,20,60,100];
for(const z of roadZs){box(scene,250,.08,10,roadMat,0,-.06,z);box(scene,250,.04,.32,lineMat,0,-.005,z);box(scene,250,.07,1.1,sidewalkMat,0,-.02,z-5.7);box(scene,250,.07,1.1,sidewalkMat,0,-.02,z+5.7);}
for(const x of roadXs){box(scene,10,.08,250,roadMat,x,-.06,0);box(scene,.32,.04,250,lineMat,x,-.005,0);box(scene,1.1,.07,250,sidewalkMat,x-5.7,-.02,0);box(scene,1.1,.07,250,sidewalkMat,x+5.7,-.02,0);}
// Block-by-block city with varied low-rise and tower silhouettes.
let seed=82731;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const colliders=[],windowInstances=[];
const windowGeometry=new THREE.BoxGeometry(1,1,.07);
const windowGeometrySide=new THREE.BoxGeometry(.07,1,1);
const instMat=new THREE.InstancedMesh(windowGeometry,windowMat,7000);const instLit=new THREE.InstancedMesh(windowGeometry,litWindowMat,2500);const instSide=new THREE.InstancedMesh(windowGeometrySide,windowMat,7000);const instSideLit=new THREE.InstancedMesh(windowGeometrySide,litWindowMat,2500);let wi=0,li=0,si=0,sli=0;const tmp=new THREE.Object3D();
function addWindow(x,y,z,w,h,depth,side=false,lit=false){tmp.position.set(x,y,z);tmp.rotation.set(0,0,0);tmp.scale.set(w,h,depth);tmp.updateMatrix();const target=side?(lit?instSideLit:instSide):(lit?instLit:instMat);const idx=side?(lit?sli++:si++):(lit?li++:wi++);if(idx<target.count)target.setMatrixAt(idx,tmp.matrix);}
for(let bx=-80;bx<=80;bx+=40)for(let bz=-80;bz<=80;bz+=40){
  const n=2+Math.floor(rand()*2);
  for(let j=0;j<n;j++){
    const w=8+rand()*7,d=8+rand()*7,h=8+rand()*30;const ox=(j===0?-10:j===1?10:0)+(rand()-.5)*4,oz=(j===0?0:j===1?0:10)+(rand()-.5)*9;const x=bx+ox,z=bz+oz;
    if(Math.abs(x)>110||Math.abs(z)>110)continue;
    const base=box(scene,w,h,d,buildingMats[Math.floor(rand()*buildingMats.length)],x,h/2,z);base.userData.building=true;colliders.push({x,z,rx:w/2+1.1,rz:d/2+1.1});
    box(scene,w+.4,.65,d+.4,mat('#586268'),x,h+.32,z);
    // Lit and dark windows face all four streets; shared instances keep mobile rendering light.
    for(let fy=2.1;fy<h-1;fy+=2.6){
      for(let xx=-w/2+1.2;xx<w/2-.4;xx+=2.25){const lit=rand()<.22;addWindow(x+xx,fy,z-d/2-.045,1.05,1.22,.08,false,lit);addWindow(x+xx,fy,z+d/2+.045,1.05,1.22,.08,false,lit);}
      for(let zz=-d/2+1.2;zz<d/2-.4;zz+=2.25){const lit=rand()<.2;addWindow(x-w/2-.045,fy,z+zz,1.05,1.22,.08,true,lit);addWindow(x+w/2+.045,fy,z+zz,1.05,1.22,.08,true,lit);}
    }
    if(h>25){box(scene,w*.72,1.1,d*.72,mat('#8c9591'),x,h+.9,z);}
  }
}
for(const inst of [instMat,instLit,instSide,instSideLit]){inst.instanceMatrix.needsUpdate=true;inst.count=Math.min(inst===instMat?wi:inst===instLit?li:inst===instSide?si:sli,inst.instanceMatrix.count);scene.add(inst);}
// Street trees and lamps add a readable human scale around each block.
const trunkMat=mat('#72574a'),leafMats=['#557c70','#719077','#416d69'].map(c=>mat(c));
function tree(x,z){box(scene,.5,3.2,.5,trunkMat,x,1.6,z);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.7,1),leafMats[Math.floor(rand()*leafMats.length)]);crown.position.set(x,4,z);scene.add(crown);}
const lampMat=mat('#37464a',.55,.3),lampGlow=new THREE.MeshStandardMaterial({color:'#ffe5ac',emissive:'#ffbf69',emissiveIntensity:1.6});
function lamp(x,z){box(scene,.18,5,.18,lampMat,x,2.5,z);box(scene,1.2,.12,.12,lampMat,x+.45,4.9,z);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.15,8,6),lampGlow);bulb.position.set(x+.95,4.85,z);scene.add(bulb);}
for(const a of [-80,-40,0,40,80])for(const b of [-80,-40,0,40,80]){tree(a-14,b-14);tree(a+14,b+14);if(rand()>.36)lamp(a-6,b+6);}
// Distant hillside and landmark towers soften the edge of the playable grid.
for(let i=0;i<18;i++){const h=12+rand()*42,w=8+rand()*15,d=9+rand()*16;const m=box(scene,w,h,d,buildingMats[i%buildingMats.length],-165+i*19,h/2,-125-rand()*50);}
// A simple pier and beach promenade.
box(scene,34,.5,55,mat('#b69d79'),-20,.05,129);for(let x=-32;x<0;x+=4)box(scene,.18,.18,55,mat('#725f4e'),x,.38,129);
for(let i=0;i<6;i++)tree(15+i*11,116+rand()*9);

// A bespoke streetwear courier, built from lightweight primitives and animated on foot.
const player=new THREE.Group();scene.add(player);
const avatar=new THREE.Group();player.add(avatar);
const skin=mat('#d6a17d'),shirt=mat('#1c9e9c'),pants=mat('#293c50'),shoe=mat('#edf0df'),hair=mat('#302b2a'),bagMat=mat('#e3a34f');
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.58,4,8),shirt);torso.position.y=1.08;avatar.add(torso);
const hips=box(avatar,.66,.28,.36,pants,0,.62,0);
const head=new THREE.Mesh(new THREE.SphereGeometry(.29,12,10),skin);head.position.set(0,1.92,.025);avatar.add(head);
const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8,0,Math.PI*2,0,Math.PI*.48),hair);hairCap.position.set(0,2.02,-.005);avatar.add(hairCap);
const face=box(avatar,.08,.07,.025,mat('#362f31'),0,1.92,.29);
const backpack=box(avatar,.48,.54,.2,bagMat,0,1.13,-.39);
function limb(parent,x,y,z,length,radius,material){const pivot=new THREE.Group();pivot.position.set(x,y,z);parent.add(pivot);const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,3,7),material);mesh.position.y=-length*.35;pivot.add(mesh);return pivot;}
const armL=limb(avatar,-.49,1.43,0,.58,.14,shirt),armR=limb(avatar,.49,1.43,0,.58,.14,shirt);
const legL=limb(avatar,-.22,.58,0,.62,.17,pants),legR=limb(avatar,.22,.58,0,.62,.17,pants);
box(avatar,.29,.16,.44,shoe,-.22,.12,.08);box(avatar,.29,.16,.44,shoe,.22,.12,.08);
const avatarParts={armL,armR,legL,legR};

// The compact two-door runabout is the first ride parked by the courier.
function makeCar(color='#e5a84e'){
 const root=new THREE.Group();const paint=mat(color,.35,.3),glass=mat('#233c4b',.25,.25),rubber=mat('#202327'),hub=mat('#bfc9c4',.35,.65);
 box(root,2.05,.68,4.1,paint,0,.72,0);box(root,1.78,.65,2.05,paint,0,1.29,-.18);
 box(root,1.58,.44,1.76,glass,0,1.35,-.18);box(root,1.84,.12,1.0,paint,0,1.63,-.22);
 box(root,.14,.32,.1,lampGlow,-.72,.84,2.06);box(root,.14,.32,.1,lampGlow,.72,.84,2.06);
 box(root,.22,.25,.1,mat('#b74640'),-.72,.84,-2.06);box(root,.22,.25,.1,mat('#b74640'),.72,.84,-2.06);
 const wheels=[];for(const x of [-1.03,1.03])for(const z of [-1.3,1.3]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.2,12),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.43,z);root.add(wheel);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.205,10),hub);cap.rotation.z=Math.PI/2;cap.position.set(x,.43,z);root.add(cap);wheels.push(wheel);}
 return {root,wheels};
}
const carModel=makeCar('#e6aa50'),car=carModel.root;car.position.set(24,0,20);car.rotation.y=.18;scene.add(car);
for(let i=0;i<13;i++){const c=makeCar(['#617d8a','#a45a50','#d1d1be','#536d5b','#84708d'][i%5]);c.root.position.set(i%2?-100+rand()*200:roadXs[Math.floor(rand()*roadXs.length)]+(rand()-.5)*2,0,i%2?roadZs[Math.floor(rand()*roadZs.length)]+(rand()-.5)*2:-100+rand()*200);c.root.rotation.y=i%2?Math.PI/2:0;scene.add(c.root);}

// Five glowing drops lie along the main streets and parkfront.
const pickupSpots=[[-57,-19],[-20,-56],[58,-20],[60,59],[-20,98]];
const pickups=[];
for(let i=0;i<pickupSpots.length;i++){
 const [x,z]=pickupSpots[i],group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.8,.045,8,28),new THREE.MeshBasicMaterial({color:'#69f4de'}));halo.rotation.x=Math.PI/2;halo.position.y=.12;group.add(halo);
 const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.43,0),new THREE.MeshStandardMaterial({color:'#c6fff0',emissive:'#41e8cf',emissiveIntensity:1.6,metalness:.25,roughness:.22}));gem.position.y=1.1;group.add(gem);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.03,.62,2.4,12,1,true),new THREE.MeshBasicMaterial({color:'#55e9d4',transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}));beam.position.y=1.2;group.add(beam);
 pickups.push({group,gem,halo,active:true,index:i});
}
// Soft sun disc and a hazy pastel sky.
const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(7,18,14),new THREE.MeshBasicMaterial({color:'#ffc49a'}));sunDisc.position.set(-95,75,210);scene.add(sunDisc);

const state={x:20,z:20,yaw:0,cameraYaw:0,carMode:false,carSpeed:0,carYaw:.18,keys:{},joyX:0,joyY:0,lookHeld:false,got:0,jump:0};
player.position.set(state.x,0,state.z);
const cameraTarget=new THREE.Vector3();
const clock=new THREE.Clock();
const ui={progressFill:document.querySelector('#progressFill'),progressText:document.querySelector('#progressText'),toast:document.querySelector('#toast'),action:document.querySelector('#actionBtn'),touchInteract:document.querySelector('#touchInteract'),speedPanel:document.querySelector('#speedPanel'),speed:document.querySelector('#speed'),minimap:document.querySelector('#minimap'),coords:document.querySelector('#coords'),mission:document.querySelector('#missionCard')};
let toastTimer;
function toast(message){ui.toast.textContent=message;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),2100);}
function toggleCar(){
 if(state.carMode){state.carMode=false;player.visible=true;const sideX=Math.cos(state.carYaw)*2;const sideZ=-Math.sin(state.carYaw)*2;state.x=car.position.x+sideX;state.z=car.position.z+sideZ;state.yaw=state.carYaw;player.position.set(state.x,0,state.z);state.carSpeed=0;toast('ON FOOT · KEEP EXPLORING');return;}
 const distance=Math.hypot(state.x-car.position.x,state.z-car.position.z);
 if(distance<4.2){state.carMode=true;player.visible=false;state.carSpeed=0;toast('RUNABOUT READY · DRIVE SAFE');}
}
function interact(){if(state.carMode){toggleCar();return;}if(Math.hypot(state.x-car.position.x,state.z-car.position.z)<4.2)toggleCar();}
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();state.keys[key]=true;if(key==='e'&&!e.repeat)interact();if(key===' '&&!e.repeat&&!state.carMode)state.jump=.55;});
window.addEventListener('keyup',e=>state.keys[e.key.toLowerCase()]=false);
window.addEventListener('blur',()=>{state.keys={};state.joyX=0;state.joyY=0;});
let drag=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;state.cameraYaw-=dx*.006;drag.x=e.clientX;drag.y=e.clientY;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(type,()=>drag=null);
const stickZone=document.querySelector('#stickZone'),stickKnob=document.querySelector('#stickKnob');let stickId=null;
stickZone.addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;stickZone.setPointerCapture(e.pointerId);moveStick(e);});
function moveStick(e){const r=stickZone.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const len=Math.hypot(dx,dy),max=39;if(len>max){dx*=max/len;dy*=max/len;}state.joyX=dx/max;state.joyY=-dy/max;stickKnob.style.transform=`translate(${dx}px,${dy}px)`;}
stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickId){e.preventDefault();moveStick(e);}});
function releaseStick(){stickId=null;state.joyX=0;state.joyY=0;stickKnob.style.transform='translate(0,0)';}
for(const type of ['pointerup','pointercancel','lostpointercapture'])stickZone.addEventListener(type,releaseStick);
const actionButton=document.querySelector('#actionBtn');actionButton.addEventListener('click',interact);ui.touchInteract.addEventListener('click',interact);
const jumpButton=document.querySelector('#jumpBtn');jumpButton.addEventListener('pointerdown',e=>{e.preventDefault();if(!state.carMode)state.jump=.55;});
const lookButton=document.querySelector('#lookBtn');let lookId=null,lastLookX=0;
lookButton.addEventListener('pointerdown',e=>{e.preventDefault();lookId=e.pointerId;lastLookX=e.clientX;lookButton.setPointerCapture(e.pointerId);});
lookButton.addEventListener('pointermove',e=>{if(e.pointerId===lookId){state.cameraYaw-=(e.clientX-lastLookX)*.012;lastLookX=e.clientX;}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])lookButton.addEventListener(type,()=>lookId=null);
document.querySelector('#continueBtn').addEventListener('click',()=>document.querySelector('#completeScreen').classList.remove('show'));

function drawMap(){
 const c=ui.minimap,ctx=c.getContext('2d'),w=c.width,h=c.height,scale=w/250;ctx.clearRect(0,0,w,h);ctx.fillStyle='#32423e';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#3d8586';ctx.fillRect(0,h*0.94,w,h*.06);
 ctx.fillStyle='#52595a';for(const z of roadZs)ctx.fillRect(0,(125-z)*scale-3,w,6);for(const x of roadXs)ctx.fillRect((x+125)*scale-3,0,6,h);
 ctx.fillStyle='#8c8c7c';for(let x=-80;x<=80;x+=40)for(let z=-80;z<=80;z+=40){for(let j=0;j<2;j++){const bx=x+(j===0?-10:10),bz=z+(j===0?0:10);ctx.fillRect((bx-5+125)*scale,(125-(bz+5))*scale,10*scale,10*scale);}}
 for(const p of pickups)if(p.active){ctx.fillStyle='#60efda';ctx.beginPath();ctx.arc((p.group.position.x+125)*scale,(125-p.group.position.z)*scale,3.2,0,Math.PI*2);ctx.fill();}
 const px=state.carMode?car.position.x:state.x,pz=state.carMode?car.position.z:state.z,angle=state.carMode?state.carYaw:state.yaw;ctx.save();ctx.translate((px+125)*scale,(125-pz)*scale);ctx.rotate(-angle);ctx.fillStyle='#f7f2dc';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(0,3);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
}

function canOccupy(x,z){if(Math.abs(x)>119||z>129||z< -119)return false;for(const b of colliders)if(Math.abs(x-b.x)<b.rx&&Math.abs(z-b.z)<b.rz)return false;return true;}
function update(dt,time){
 const forward=(state.keys.w||state.keys.arrowup?1:0)-(state.keys.s||state.keys.arrowdown?1:0)+state.joyY;
 const turn=(state.keys.d||state.keys.arrowright?1:0)-(state.keys.a||state.keys.arrowleft?1:0)+state.joyX;
 if(!state.carMode){
  const side=(state.keys.d||state.keys.arrowright?1:0)-(state.keys.a||state.keys.arrowleft?1:0)+state.joyX;
  const fwd=(state.keys.w||state.keys.arrowup?1:0)-(state.keys.s||state.keys.arrowdown?1:0)+state.joyY;
  const magnitude=Math.hypot(side,fwd);let dx=0,dz=0;
  if(magnitude>.08){const sx=side/magnitude,fy=fwd/magnitude;const fx=-Math.sin(state.cameraYaw),fz=Math.cos(state.cameraYaw),rx=Math.cos(state.cameraYaw),rz=Math.sin(state.cameraYaw);dx=(fx*fy+rx*sx);dz=(fz*fy+rz*sx);const speed=(state.keys.shift?8:5.25)*Math.min(1,magnitude);dx*=speed*dt;dz*=speed*dt;const desired=Math.atan2(dx,dz);let delta=((desired-state.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;state.yaw+=delta*Math.min(1,dt*11);}
  if(canOccupy(state.x+dx,state.z+dz)) {state.x+=dx;state.z+=dz;}else {if(canOccupy(state.x+dx,state.z))state.x+=dx;if(canOccupy(state.x,state.z+dz))state.z+=dz;}
  if(state.jump>0)state.jump=Math.max(0,state.jump-dt);const jumpY=state.jump>0?Math.sin((.55-state.jump)/.55*Math.PI)*.82:0;player.position.set(state.x,jumpY,state.z);player.rotation.y=state.yaw;
  const walking=magnitude>.08?Math.sin(time*11)*.58:0;avatarParts.legL.rotation.x=walking;avatarParts.legR.rotation.x=-walking;avatarParts.armL.rotation.x=-walking*.75;avatarParts.armR.rotation.x=walking*.75;torso.position.y=1.08+(magnitude>.08?Math.abs(Math.sin(time*11))*.035:0);
 }else{
  const accel=forward*10;state.carSpeed+=accel*dt;state.carSpeed*=Math.exp(-dt*(Math.abs(forward)>.05?.45:1.9));state.carSpeed=THREE.MathUtils.clamp(state.carSpeed,-5,18);
  state.carYaw+=turn*dt*(.95+Math.min(Math.abs(state.carSpeed)/14,.8))*(state.carSpeed<-.1?-1:1);
  const nextX=car.position.x+Math.sin(state.carYaw)*state.carSpeed*dt,nextZ=car.position.z+Math.cos(state.carYaw)*state.carSpeed*dt;
  if(canOccupy(nextX,nextZ)){car.position.x=nextX;car.position.z=nextZ;}else state.carSpeed*=-.22;
  car.rotation.y=state.carYaw;for(const wheel of carModel.wheels)wheel.rotation.x+=state.carSpeed*dt*1.8;
  player.position.set(car.position.x,-40,car.position.z);
  ui.speed.textContent=String(Math.round(Math.abs(state.carSpeed)*4.2)).padStart(3,'0');
 }
 const target=state.carMode?car.position:player.position;const yaw=state.cameraYaw;const desiredPos=new THREE.Vector3(target.x+Math.sin(yaw)*5.6,target.y+3.5,target.z-Math.cos(yaw)*5.6);
 camera.position.lerp(desiredPos,1-Math.exp(-dt*5.2));cameraTarget.set(target.x,target.y+1.15,target.z);camera.lookAt(cameraTarget);
 const proximity=!state.carMode&&Math.hypot(state.x-car.position.x,state.z-car.position.z)<4.2;actionButton.classList.toggle('show',proximity);ui.touchInteract.classList.toggle('show',proximity||state.carMode);ui.touchInteract.textContent=state.carMode?'EXIT':'GET IN';
 ui.speedPanel.classList.toggle('show',state.carMode);
 for(const p of pickups){if(!p.active)continue;p.group.position.y=Math.sin(time*2.4+p.index)*.18;p.gem.rotation.y=time*1.1;p.gem.rotation.x=Math.sin(time*1.6)*.18;p.halo.rotation.z=time*.55;
  const px=state.carMode?car.position.x:state.x,pz=state.carMode?car.position.z:state.z;
  if(Math.hypot(px-p.group.position.x,pz-p.group.position.z)<(state.carMode?3.5:2.6)){p.active=false;p.group.visible=false;state.got++;ui.progressText.textContent=`${state.got} / 5 DROPS`;ui.progressFill.style.width=`${state.got*20}%`;toast(state.got===5?'ROUTE COMPLETE · +500 REP':`SIGNAL DROP ${String(state.got).padStart(2,'0')} / 05 · +100 REP`);if(state.got===5){document.querySelector('#completeScreen').classList.add('show');ui.mission.querySelector('.mission-status').textContent='COMPLETE';}}
 }
 ui.coords.textContent=state.z>105?'BAYFRONT · 05':state.x< -40?'OLD TOWN · 02':state.x>45?'EAST MARKET · 03':'DOWNTOWN · 01';
}
let mapElapsed=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.045),time=clock.elapsedTime;update(dt,time);mapElapsed+=dt;if(mapElapsed>.12){drawMap();mapElapsed=0;}renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);});
frame();setTimeout(()=>document.querySelector('#loading').classList.add('done'),850);
