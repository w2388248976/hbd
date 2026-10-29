import * as THREE from './vendor/three.module.js';

// A small 3D toy inspired by the supplied round-headed monkey reference.
export function createMonkey({ house, sphere, line, interactive }) {
  const group = new THREE.Group();
  group.name = 'walking-monkey';
  house.add(group);
  const fur = '#b3977c', cream = '#ffe4ce', cocoa = '#483224';
  const body = new THREE.Group(); group.add(body);
  sphere(0,.35,0,.21,.28,.15,fur,body);
  sphere(0,.36,.143,.105,.14,.023,cream,body);
  const legs = [], arms = [];
  for (const side of [-1,1]) {
    const leg = new THREE.Group(); leg.position.set(side*.105,.22,0); body.add(leg);
    sphere(0,-.075,.025,.095,.14,.10,fur,leg); legs.push(leg);
    const arm = new THREE.Group(); arm.position.set(side*.19,.48,0); body.add(arm);
    const hand = sphere(side*.035,-.12,0,.075,.16,.08,fur,arm);
    hand.rotation.z=side*.25; arms.push(arm);
  }
  const head = new THREE.Group(); head.position.y=.93; body.add(head);
  for (const side of [-1,1]) {
    sphere(side*.46,0,0,.16,.17,.095,fur,head);
    sphere(side*.465,0,.075,.092,.105,.027,cream,head);
  }
  sphere(0,.025,0,.46,.43,.32,fur,head);
  const face = new THREE.Shape();
  face.moveTo(-.33,.17);face.lineTo(.33,.17);
  face.bezierCurveTo(.39,.02,.37,-.20,.26,-.27);
  face.bezierCurveTo(.12,-.35,-.12,-.35,-.26,-.27);
  face.bezierCurveTo(-.37,-.20,-.39,.02,-.33,.17);
  const mask = new THREE.Mesh(new THREE.ExtrudeGeometry(face,{depth:.035,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:3,steps:1}),new THREE.MeshStandardMaterial({color:cream,roughness:.9}));
  mask.position.z=.27;mask.castShadow=true;head.add(mask);
  // The fringe, thick lashes and mint eye highlights echo the reference.
  for (const x of [-.23,-.13,0,.19,.29]) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(.025,.07,12),new THREE.MeshStandardMaterial({color:fur,roughness:.9}));
    tuft.rotation.z=Math.PI;tuft.position.set(x,.175,.32);head.add(tuft);
  }
  const eyes = [];
  for (const side of [-1,1]) {
    const eye = new THREE.Group();eye.position.set(side*.165,-.065,.335);head.add(eye);
    sphere(0,0,0,.077,.093,.027,cocoa,eye);
    sphere(.016,.03,.026,.027,.027,.009,'#ffffff',eye);
    sphere(-.003,-.037,.027,.023,.018,.008,'#9ee8d7',eye);eyes.push(eye);
    line([[side*.09,.00,.35],[side*.15,.045,.35],[side*.23,.055,.345],[side*.275,.035,.33]],cocoa,.022,head);
    sphere(side*.27,-.17,.325,.065,.037,.012,'#f1b9ae',head);
    sphere(side*.036,-.19,.34,.019,.021,.012,cocoa,head);
  }
  const tail = new THREE.Group();tail.position.set(0,.23,-.1);body.add(tail);
  line([[0,0,0],[.04,-.05,-.19],[.22,-.08,-.31],[.37,.03,-.31],[.4,.14,-.26]],fur,.042,tail);
  interactive(group,'monkey');

  // Stay in the open aisle, clear of the table, sofa and the dogs.
  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(.15,.08,2.72),
    new THREE.Vector3(1.3,.08,2.74),
    new THREE.Vector3(2.6,.08,2.65),
    new THREE.Vector3(2.85,.08,1.6),
    new THREE.Vector3(2.68,.08,.65),
  ],false,'centripetal');
  let travel=0, direction=1, rest=1.4, elapsed=0, greeting=0;
  const duration=route.getLength()/.30;
  group.position.copy(route.getPointAt(0));group.rotation.y=.45;
  const point=new THREE.Vector3(), tangent=new THREE.Vector3();
  return {
    greet(){greeting=2.6;},
    update(delta,reduced){
      if(reduced)return;
      elapsed+=delta;greeting=Math.max(0,greeting-delta);
      const waving=greeting>0;
      if(!waving){
        if(rest>0)rest=Math.max(0,rest-delta);
        else{
          travel+=direction*delta/duration;
          if(travel>=1||travel<=0){travel=THREE.MathUtils.clamp(travel,0,1);direction*=-1;rest=1.8;}
        }
      }
      route.getPointAt(travel,point);group.position.copy(point);
      route.getTangentAt(travel,tangent).multiplyScalar(direction);
      const heading=waving||rest>0?.55:Math.atan2(tangent.x,tangent.z);
      const difference=Math.atan2(Math.sin(heading-group.rotation.y),Math.cos(heading-group.rotation.y));
      group.rotation.y+=difference*Math.min(1,delta*5);
      const stride=!waving&&rest<=0?Math.sin(elapsed*9):0;
      body.position.y=Math.abs(stride)*.025;
      legs[0].rotation.x=stride*.42;legs[1].rotation.x=-stride*.42;
      arms[0].rotation.x=-stride*.32;arms[1].rotation.x=stride*.32;
      arms[1].rotation.z=waving?-1.9+Math.sin(elapsed*14)*.25:0;
      tail.rotation.y=Math.sin(elapsed*3)*.22;
      head.rotation.z=Math.sin(elapsed*2)*.025;
      const blink=elapsed%4.5>4.35;
      eyes.forEach(eye=>eye.scale.y=blink?.12:1);
    }
  };
}
