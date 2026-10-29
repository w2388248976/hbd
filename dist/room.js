import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { createMonkey } from './monkey.js';

export function createRoom(container, onPick) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;
  container.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-5,5,5,-5,.1,100);
  camera.position.set(10,9.5,12);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(0,1.25,0);
  controls.enableDamping=true;
  controls.enableZoom=false;
  controls.enablePan=false;
  controls.minAzimuthAngle=.05;controls.maxAzimuthAngle=1.42;
  controls.minPolarAngle=.65;controls.maxPolarAngle=1.22;
  controls.autoRotate=false;
  const materials=new Map();
  function mat(color,roughness=.8){const key=color+':'+roughness;if(!materials.has(key)) materials.set(key,new THREE.MeshStandardMaterial({color,roughness}));return materials.get(key);}
  const house=new THREE.Group();scene.add(house);
  const clickable=[];const objects={};
  function mesh(geo,color,parent=house){const m=new THREE.Mesh(geo,mat(color));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,color,x,y,z,parent=house){const m=mesh(new THREE.BoxGeometry(w,h,d),color,parent);m.position.set(x,y,z);return m;}
  function sphere(x,y,z,sx,sy,sz,color,parent=house){const m=mesh(new THREE.SphereGeometry(1,24,18),color,parent);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
  function cyl(r1,r2,h,color,x,y,z,parent=house){const m=mesh(new THREE.CylinderGeometry(r1,r2,h,40),color,parent);m.position.set(x,y,z);return m;}
  function line(points,color,r=.015,parent=house){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,24,r,6,false),color,parent);}
  function textPlane(text,w,h,color,bg,x,y,z,parent=house,size=90){
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');
    if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${size}px Georgia, "Microsoft YaHei", serif`;ctx.fillText(text,c.width/2,c.height/2);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;
  }
  function interactive(group,id){group.traverse(o=>{if(o.isMesh){o.userData.object=id;clickable.push(o);}});objects[id]=group;}
  scene.add(new THREE.HemisphereLight('#ffffff','#d5e5e6',2.2));
  const sun=new THREE.DirectionalLight('#ffffff',2.4);sun.position.set(3,9,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;sun.shadow.normalBias=.03;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
  const fill=new THREE.DirectionalLight('#efffff',1.1);fill.position.set(-5,5,-3);scene.add(fill);
  // Open dollhouse, warm parquet and softly colored walls.
  box(7.4,.24,6.4,'#cbb99b',0,-.12,0);
  box(7.35,.08,6.35,'#eee2c8',0,.025,0);
  for(let i=-3.3;i<3.7;i+=.55)box(.012,.008,6.3,'#d9cdb5',i,.07,0);
  for(let row=0;row<13;row++)for(let j=-2;j<3;j++)box(.54,.008,.009,'#d9cdb5',-3.3+row*.55,.071,j*1.5+(row%2)*.7);
  box(7.4,3.9,.16,'#effffa',0,1.95,-3.2);
  box(.16,3.9,6.4,'#c6f2e9',-3.7,1.95,0);
  box(7.45,.1,.22,'#f7fcf4',0,3.92,-3.2);
  box(.22,.1,6.5,'#eafbf6',-3.7,3.92,0);
  box(7.35,.16,.09,'#c2e4db',0,.15,-3.08);
  box(.09,.16,6.3,'#aedbd2',-3.58,.15,0);
  // Back wall arched window with sky and mullions.
  const windowGroup=new THREE.Group();windowGroup.position.set(1.45,2.3,-3.06);house.add(windowGroup);
  const shape=new THREE.Shape();shape.moveTo(-.9,-.9);shape.lineTo(.9,-.9);shape.lineTo(.9,.35);shape.absarc(0,.35,.9,0,Math.PI,false);shape.lineTo(-.9,-.9);
  const windowMesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:'#a9eee5',roughness:.8}));windowGroup.add(windowMesh);
  const framePoints=[[-.94,-.93,.025],[-.94,.35,.025]];for(let a=Math.PI;a>=0;a-=Math.PI/24)framePoints.push([Math.cos(a)*.94,.35+Math.sin(a)*.94,.025]);framePoints.push([.94,-.93,.025]);line(framePoints,'#fbfff8',.07,windowGroup);
  box(1.95,.13,.18,'#f9f4e2',0,-.94,.06,windowGroup);box(.07,1.95,.08,'#fbfff8',0,.04,.05,windowGroup);box(1.8,.07,.08,'#fbfff8',0,.08,.05,windowGroup);
  sphere(-.43,.6,.015,.19,.19,.01,'#fff6cb',windowGroup);
  for(let i=0;i<3;i++)sphere(.23+i*.13,-.35+(i%2)*.08,.02,.2,.1,.01,'#eef9eb',windowGroup);
  // A personal birthday print and a shelf.
  box(1.6,1.22,.055,'#bfa98b',-1.95,2.6,-3.07);
  box(1.48,1.1,.025,'#faf5e4',-1.95,2.6,-3.026);
  textPlane('JACK',1.35,.5,'#39bdb5',null,-1.95,2.78,-3.005,house,220);
  textPlane('11 . 08',1.25,.28,'#a89678',null,-1.95,2.42,-3.002,house,150);
  textPlane('with love, honey',1.3,.2,'#8ca58b',null,-1.95,2.2,-3.0,house,90);
  box(2.05,.1,.48,'#bda989',-.8,1.5,-2.9);
  for(let i=0;i<4;i++){const book=box(.12,.37+Math.sin(i)*.07,.27,['#dcaaa6','#d2dbc4','#88baa9','#ede1bc'][i],-1.5+i*.14,1.75,-2.89);book.rotation.z=i===0?.13:0;}
  cyl(.15,.12,.21,'#f5e9d4',-.12,1.66,-2.88);sphere(-.12,1.92,-2.88,.16,.22,.13,'#91b8a1');
  // Fairy lights along the room's top edges.
  const wire=[];for(let i=0;i<=30;i++)wire.push([-3.5+i*.23,3.52-.22*Math.sin(i/30*Math.PI),-3.02]);line(wire,'#ad9c84',.011);
  for(let i=0;i<=12;i++){const x=-3.35+i*.54,y=3.52-.22*Math.sin(i/12*Math.PI);const bulb=sphere(x,y-.08,-3,.045,.065,.045,'#fff0b8');bulb.material=new THREE.MeshStandardMaterial({color:'#ffedba',emissive:'#ffd780',emissiveIntensity:.7});}
  const wire2=[];for(let i=0;i<=24;i++)wire2.push([-3.55,3.53-.2*Math.sin(i/24*Math.PI),-2.9+i*.23]);line(wire2,'#ad9c84',.01);
  for(let i=0;i<10;i++)sphere(-3.53,3.45-.2*Math.sin(i/9*Math.PI),-2.8+i*.59,.045,.06,.045,'#fff1b9');
  // Comfortable peach sofa on the left side.
  const sofa=new THREE.Group();sofa.position.set(-2.7,0,-.9);house.add(sofa);
  box(1.33,.45,2.5,'#d7b2a7',0,.4,0,sofa);box(.28,1.08,2.6,'#dfbcb1',-.56,.85,0,sofa);
  for(const z of [-1.22,1.22]){box(1.48,.5,.23,'#e8c8b9',.02,.81,z,sofa);for(const x of [-.45,.45])cyl(.045,.035,.25,'#9c8768',x,.13,z*.8,sofa);}
  for(const z of [-.6,.6]){box(1.13,.2,1.05,'#f1d6c5',.11,.73,z,sofa);const pillow=box(.22,.6,.66,z<0?'#bce7df':'#eaf8f2',-.34,1.14,z,sofa);pillow.rotation.z=-.13;}
  const throwBlanket=box(.86,.045,.55,'#e6e8cc',.18,.86,.73,sofa);throwBlanket.rotation.y=.08;
  // Rug, table and a tiny mug.
  const rug=cyl(1.55,1.55,.025,'#e4c6b8',.15,.09,.45);rug.scale.z=.8;
  const innerRug=cyl(1.39,1.39,.026,'#f0d8c8',.15,.105,.45);innerRug.scale.z=.8;
  const table=cyl(.92,.92,.11,'#efe7d3',.12,.7,.2);table.scale.z=.8;
  for(const a of [0,2.1,4.2])cyl(.06,.08,.56,'#bfa886',.12+Math.cos(a)*.56,.38,.2+Math.sin(a)*.43);
  cyl(.1,.085,.16,'#d7e4c7',-.48,.85,.42);const mugHandle=mesh(new THREE.TorusGeometry(.06,.016,8,16),'#d7e4c7');mugHandle.position.set(-.59,.87,.42);
  // Gift sits in the center; the lid lifts and the strawberry cake appears.
  const gift=new THREE.Group();gift.position.set(.24,.77,.12);house.add(gift);
  const giftBase=new THREE.Group();gift.add(giftBase);
  box(.91,.55,.82,'#66d6bb',0,.28,0,giftBase);box(.14,.56,.84,'#f9eed8',0,.28,0,giftBase);box(.93,.56,.12,'#f9eed8',0,.28,0,giftBase);
  const lid=new THREE.Group();lid.position.y=.57;gift.add(lid);
  box(1.02,.13,.92,'#89e4c9',0,0,0,lid);box(.15,.14,.94,'#fff2da',0,0,0,lid);box(1.04,.14,.13,'#fff2da',0,0,0,lid);
  for(const s of [-1,1]){const bow=mesh(new THREE.TorusGeometry(.16,.045,10,24),'#fff1d3',lid);bow.position.set(s*.14,.17,0);bow.rotation.x=Math.PI/2;bow.rotation.y=s*.5;bow.scale.y=.6;}sphere(0,.12,0,.09,.07,.08,'#f4dfbd',lid);
  interactive(gift,'gift');
  const cake=new THREE.Group();cake.position.copy(gift.position);cake.visible=false;house.add(cake);
  cyl(.55,.55,.04,'#f5f2df',0,.03,0,cake);
  cyl(.45,.45,.27,'#edb9bd',0,.19,0,cake);cyl(.45,.45,.075,'#fff0da',0,.14,0,cake);cyl(.47,.47,.08,'#fff6e5',0,.35,0,cake);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2;sphere(Math.cos(a)*.435,.32,Math.sin(a)*.435,.07,.09,.07,'#fff4e3',cake);}
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const berry=sphere(Math.cos(a)*.31,.45,Math.sin(a)*.31,.09,.12,.08,'#d77577',cake);berry.rotation.z=.12;sphere(Math.cos(a)*.31,.56,Math.sin(a)*.31,.07,.025,.06,'#83a47b',cake);}
  cyl(.027,.027,.32,'#a1dcc3',0,.57,0,cake);for(let i=0;i<3;i++)cyl(.029,.029,.024,'#fff6e4',0,.48+i*.08,0,cake);
  const flame=sphere(0,.81,0,.045,.09,.04,'#ffd58b',cake);flame.material=new THREE.MeshStandardMaterial({color:'#ffdc91',emissive:'#ffb648',emissiveIntensity:2});
  interactive(cake,'gift');objects.gift=gift;
  // Plants and record corner.
  function plant(x,z,scale=1){const p=new THREE.Group();p.position.set(x,0,z);p.scale.setScalar(scale);house.add(p);cyl(.24,.18,.48,'#dbd6ba',0,.24,0,p);cyl(.21,.21,.025,'#8e876d',0,.48,0,p);for(let i=0;i<8;i++){const a=i*2.4;const top=1.0+i*.11;line([[0,.48,0],[Math.cos(a)*.16,top*.7,Math.sin(a)*.16],[Math.cos(a)*.32,top,Math.sin(a)*.32]],'#7e9972',.017,p);const leaf=sphere(Math.cos(a)*.32,top,Math.sin(a)*.32,.13,.3,.045,i%2?'#8bb18b':'#aac59b',p);leaf.rotation.z=Math.sin(a)*.8;leaf.rotation.y=a;}return p;}
  plant(2.88,-2.6,1.15);
  box(.96,.62,.68,'#baa788',2.9,.4,-.93);box(.8,.45,.025,'#444b43',2.9,.42,-.575);for(let i=0;i<9;i++)box(.74,.012,.008,'#858673',2.9,.25+i*.04,-.555);for(const x of [2.67,2.91,3.12])sphere(x,.65,-.55,.025,.025,.015,'#dfcfaa');
  // Electric guitar silhouette, neck, strings and tuning pegs.
  const guitar=new THREE.Group();guitar.position.set(2.36,.13,-.1);guitar.rotation.z=-.15;guitar.rotation.y=-.14;house.add(guitar);
  const gs=new THREE.Shape();gs.moveTo(0,.05);gs.bezierCurveTo(-.6,-.08,-.6,.55,-.26,.66);gs.bezierCurveTo(-.16,.73,-.32,1.02,-.08,.87);gs.lineTo(.04,.82);gs.bezierCurveTo(.22,1.03,.4,.94,.24,.65);gs.bezierCurveTo(.67,.4,.45,-.04,0,.05);
  const guitarBody=mesh(new THREE.ExtrudeGeometry(gs,{depth:.13,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.04,curveSegments:24}),'#71b9a7',guitar);
  sphere(.03,.42,.175,.21,.28,.018,'#f7edce',guitar);box(.115,1.2,.09,'#b59a70',.015,1.27,.07,guitar);box(.09,1.06,.025,'#526653',.015,1.26,.13,guitar);box(.17,.31,.09,'#c2aa7d',.015,1.97,.07,guitar);
  for(let i=0;i<11;i++)box(.095,.008,.01,'#d6c5a2',.015,.8+i*.092,.149,guitar);
  for(let i=0;i<5;i++)box(.003,1.59,.005,'#d9d5bb',-.022+i*.019,1.1,.2,guitar);
  box(.18,.08,.04,'#7a7a68',.015,.42,.205,guitar);box(.2,.06,.04,'#e1d9bb',.015,.28,.205,guitar);
  for(let i=0;i<3;i++)for(const s of [-1,1])sphere(s*.115,1.89+i*.09,.07,.045,.025,.025,'#d3cbae',guitar);
  line([[0,.06,-.13],[0,.05,.24],[.33,.05,.3]],'#82775d',.025,guitar);interactive(guitar,'guitar');
  // Hand-built toy-like pets. Each has a separate animated tail.
  function dog(id,color,earColor,position,isLong=false){
    const p=new THREE.Group();p.position.set(...position);house.add(p);
    sphere(0,.47,0,isLong?.62:.46,isLong?.24:.39,.29,color,p);
    for(const x of [isLong?-.43:-.25,isLong?.43:.25])for(const z of [-.2,.2]){sphere(x,.18,z,.1,.2,.11,color,p);sphere(x+.02,.075,z+.025,.13,.075,.13,color,p);}
    const hx=isLong?.54:.31,hy=isLong?.67:.88;
    sphere(hx,hy,0,isLong?.26:.32,isLong?.27:.34,isLong?.23:.28,color,p);
    for(const z of [-1,1]){const e=sphere(hx-.03,hy-.12,z*(isLong?.22:.25),.11,isLong?.25:.28,.1,earColor,p);e.rotation.z=-.15;}
    sphere(hx+.22,hy-.1,.03,isLong?.23:.2,.12,.18,isLong?'#bb8959':'#e9c995',p);
    sphere(hx+.4,hy-.055,.04,.065,.05,.065,'#554937',p);
    for(const z of [-.15,.15]){sphere(hx+.2,hy+.06,z,.035,.04,.035,'#463f33',p);sphere(hx+.215,hy+.073,z+.012,.009,.009,.009,'#fff5df',p);}
    if(!isLong){sphere(hx+.31,hy-.2,.08,.05,.07,.06,'#dc9b96',p);sphere(.15,.66,.08,.35,.36,.29,'#e7c68f',p);}
    const tail=new THREE.Group();tail.position.set(isLong?-.55:-.4,.52,0);p.add(tail);line([[0,0,0],[-.22,.1,0],[-.37,.4,.03]],earColor,isLong?.055:.115,tail);
    const collar=mesh(new THREE.TorusGeometry(isLong?.22:.27,.035,8,30),'#9cbfa5',p);collar.rotation.y=Math.PI/2;collar.position.set(hx-.08,hy-.13,0);
    sphere(hx-.08,hy-.35,.07,.05,.05,.025,'#d6b979',p);interactive(p,id);return {group:p,tail};
  }
  const golden=dog('golden','#d9b16e','#c49b5f',[1.48,.08,1.82]);golden.group.rotation.y=-.4;golden.group.scale.setScalar(1.12);
  const dachshund=dog('dachshund','#ad7850','#805937',[-1.6,.09,2.1],true);dachshund.group.rotation.y=-.35;dachshund.group.scale.setScalar(.8);
  const cat=new THREE.Group();cat.position.set(-2.55,.85,-.63);cat.rotation.y=.4;house.add(cat);
  sphere(0,.19,0,.3,.2,.22,'#9ca5a1',cat);sphere(.19,.4,.01,.21,.21,.18,'#acb4ad',cat);
  for(const z of [-.12,.12]){const ear=mesh(new THREE.ConeGeometry(.095,.19,3),'#a0aaa4',cat);ear.position.set(.2,.62,z);ear.rotation.x=z>0?.22:-.22;}
  for(const z of [-.11,.11])sphere(.365,.42,z,.022,.027,.022,'#465c50',cat);
  sphere(.405,.35,.01,.025,.023,.025,'#c99491',cat);sphere(.17,.06,.2,.11,.065,.09,'#b5beb4',cat);sphere(-.1,.06,.2,.11,.065,.09,'#b5beb4',cat);
  line([[-.24,.18,0],[-.42,.25,.15],[-.36,.4,.25],[-.16,.25,.28]],'#8f9a95',.065,cat);interactive(cat,'cat');
  const monkey=createMonkey({house,sphere,line,interactive});
  // Soft balloons and scattered birthday details.
  const balloons=[];
  for(let i=0;i<2;i++){const b=new THREE.Group();b.position.set(-2.8+i*.65,2.65+i*.3,2.02);house.add(b);sphere(0,0,0,.31,.4,.29,i?'#a1ddc8':'#e9c5be',b);const knot=mesh(new THREE.ConeGeometry(.045,.09,8),i?'#a1ddc8':'#e9c5be',b);knot.position.y=-.4;line([[0,-.43,0],[.1,-1.1,.02],[.02,-2.4,.06]],'#b3a891',.008,b);balloons.push(b);}
  box(.43,.24,.42,'#d4d9b6',-3,.2,2.7);box(.07,.26,.44,'#f9f1d7',-3,.2,2.7);
  box(.31,.35,.32,'#edc9c2',-2.52,.25,2.8);box(.33,.37,.06,'#f7efd7',-2.52,.25,2.8);
  // A shadow-catching floating base keeps the room grounded in the page.
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.055}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.28;shadow.receiveShadow=true;scene.add(shadow);
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let down=null;
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;down=null;
    const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(clickable).filter(hit=>{let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});
    if(hits.length)onPick(hits[0].object.userData.object);
  });
  renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);renderer.domElement.style.cursor=raycaster.intersectObjects(clickable).length?'pointer':'grab';});
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h;const half=Math.max(4.25,5.15/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(container);resize();
  let opened=false,openTime=0,blown=false;let activePet='',petUntil=0;const clock=new THREE.Clock();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible=true;new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;}).observe(container);
  function animate(){requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),.05);if(document.hidden||!visible)return;const t=clock.elapsedTime;controls.update();monkey.update(delta,reduced);
    if(!reduced){balloons.forEach((b,i)=>{b.rotation.z=Math.sin(t*.65+i)*.04;});flame.scale.y=.09+Math.sin(t*8)*.014;}
    if(opened){const progress=Math.min((performance.now()-openTime)/900,1);lid.position.y=.57+progress*1.7;lid.rotation.z=progress*.35;lid.scale.setScalar(1-progress*.5);giftBase.scale.setScalar(1-progress);gift.visible=progress<1;cake.visible=progress>.4;cake.scale.setScalar(Math.max(.001,Math.min(1,(progress-.4)/.6)));}
    const excited=performance.now()<petUntil;
    golden.tail.rotation.x=Math.sin(t*(activePet==='golden'&&excited?16:3))*.4;
    dachshund.tail.rotation.x=Math.sin(t*(activePet==='dachshund'&&excited?20:4))*.5;
    if(!reduced){cat.scale.y=1+Math.sin(t*1.6)*.025;for(const [id,obj]of Object.entries(objects)){if(id!=='gift'&&id!=='cat'&&id!=='monkey')obj.position.y=(id==='guitar'?.13:id==='golden'?.08:.09)+(id===activePet&&excited?Math.abs(Math.sin(t*8))*.08:0);}}
    renderer.render(scene,camera);
  }animate();
  return {
    openGift(){if(opened)return;opened=true;openTime=performance.now();},
    blow(){blown=true;flame.visible=false;},
    reset(){camera.position.set(10,9.5,12);controls.target.set(0,1.25,0);controls.update();},
    excite(id){activePet=id;petUntil=performance.now()+2500;if(id==='monkey')monkey.greet();},
    get opened(){return opened;}
  };
}
