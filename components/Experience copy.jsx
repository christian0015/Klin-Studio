"use client";
// Parcours : intro (portail drei) → zoom → portail qui s'ouvre → mur de cuir en défilement horizontal (on « marche »).
// Les cadres 3D se calent sur les éléments HTML [data-frame] ; [data-story] pilote les phases au scroll vertical.
import { useMemo, useRef, useState, useEffect, Suspense, Component } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Canvas, useFrame } from "@react-three/fiber";
import { Clouds, Cloud, MeshPortalMaterial, useTexture, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { bands } from "@/lib/audio";

const BG = "#030606", rad = THREE.MathUtils.degToRad, cl = v => Math.min(1, Math.max(0, v));
const cache = new Map(); // éléments DOM mis en cache (évite des querySelector à chaque image)
const q = sel => { let e = cache.get(sel); if (!e || !e.isConnected) { e = document.querySelector(sel); cache.set(sel, e); } return e; };
// Phases (en hauteurs d'écran) : zoom 1.1 → phrases (0.5–1.75) → portail 1.8 → 2.7 → marche horizontale
const PH = { A: 1.1, P1: 1.8, O: 0.9 }, PHR = [[0.5, 1.1], [1.15, 1.75]];
function story() {
  const el = q("[data-story]"); if (!el) return { zoom: 1, open: 1, walk: 1, t: 9 };
  const r = el.getBoundingClientRect(), vh = innerHeight, y = -r.top, L = Math.max(1, r.height - vh), W = (PH.P1 + PH.O) * vh;
  return { zoom: cl(y / (PH.A * vh)), open: cl((y - PH.P1 * vh) / (PH.O * vh)), walk: cl((y - W) / Math.max(1, L - W)), t: y / vh };
}
let S = { zoom: 0, open: 0, walk: 0, t: 0 };
// Dispersion chromatique des nappes (écart d'indice de réfraction R/V/B). Valeur effective = base + wave × sin(temps) → oscille en boucle.
// Avant : base 0.13 / wave 0.06 (oscillation 0.07 → 0.19). Actuel (−20 %) : base 0.104 / wave 0.048 (oscillation 0.056 → 0.152).
// Augmenter = franges colorées plus visibles ; diminuer = plus discret. Pour une dispersion fixe, mettre wave à 0.
const SHEET_DISPERSION = { base: 0.104, wave: 0.048 };
const shared = { uT: { value: 0 }, uBass: { value: 0 }, uMid: { value: 0 }, uPulse: { value: 1 }, uAfter: { value: 1 } };

function place(m, r, z, camera, size, pad = 0) { // plan 1×1 → rectangle DOM (px) à la profondeur z
  const u = (2 * (camera.position.z - z) * Math.tan(rad(camera.fov / 2))) / size.height, w = r.width + pad * 2, h = r.height + pad * 2;
  m.scale.set(w * u, h * u, 1);
  m.position.set(camera.position.x + (r.left - pad + w / 2 - size.width / 2) * u, camera.position.y - (r.top - pad + h / 2 - size.height / 2) * u, z);
}

/* ---------- Shader commun liquide / nappes ---------- */
const GLSL = `
vec3 h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(vec3(p.x*p.y*p.z,p.x+p.y*p.z,p.x*p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 float a=mix(mix(h3(i).x,h3(i+vec3(1,0,0)).x,f.x),mix(h3(i+vec3(0,1,0)).x,h3(i+vec3(1,1,0)).x,f.x),f.y);
 float b=mix(mix(h3(i+vec3(0,0,1)).x,h3(i+vec3(1,0,1)).x,f.x),mix(h3(i+vec3(0,1,1)).x,h3(i+vec3(1,1,1)).x,f.x),f.y);
 return mix(a,b,f.z);}
uniform float uT,uBass,uMid,uAmp,uWob,uPulse; uniform vec2 uOff;
float H(vec2 p,float rn){float r=length(p);
 // nappes : somme de sinus déphasés, amplitude qui varie en boucle, plis plus marqués vers le bord
 float wob=uWob*(1.+.5*sin(uT*.31+uOff.x))*(.5*sin(p.x*1.5+uT*.5+uOff.y)+.35*sin(p.y*2.1-uT*.4+uOff.x*1.7)+.2*sin((p.x+p.y)*2.4+uT*.7))*(.35+.8*rn);
 return (n3(vec3(p*.35,uT*.15))*1.2+n3(vec3(p*.9,uT*.3))*.4-.8)*uAmp+sin(r*1.6-uT*1.4)*.12*uAmp*exp(-r*.08)
  +uBass*.28*sin(r*2.2-uT*3.)*exp(-r*.07)+uMid*.06*n3(vec3(p*2.,uT))+wob;}`;
const VERT = `${GLSL}
varying vec3 vN,vW; varying vec2 vP;
void main(){ float rn=@RN@; vec2 p=position.xy*@SC@+uOff; float h=H(p,rn),e=.1;
 float dx=H(p+vec2(e,0.),rn)-h, dy=H(p+vec2(0.,e),rn)-h; vec3 pos=position; pos.z+=h*@ZK@;
 vN=normalize(mat3(modelMatrix)*(normal+vec3(-dx/e,-dy/e,0.))); vP=p;
 vec4 w=modelMatrix*vec4(pos,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}`;
const FRAG = `${GLSL}
varying vec3 vN,vW; varying vec2 vP;
float envf(vec3 d){ d=normalize(d+1e-4);
 float a=pow(max(dot(d,normalize(vec3(.45,-.15,-1.))),0.),10.)*1.4;   // croissant
 float b=pow(max(dot(d,normalize(vec3(.85,.05,-.5))),0.),34.)*2.6;    // porte lumineuse
 return (a+b+smoothstep(-.2,1.,d.y)*.22+.04)*uPulse;}
void main(){ vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;
 vec3 V=normalize(cameraPosition-vW), L=normalize(vec3(.55,.3,-1.));
 float fr=pow(1.-max(dot(N,V),0.),3.), sp=pow(max(dot(reflect(-L,N),V),0.),@SP@);
 float streak=n3(vec3(vP.x*.5,vP.y*3.,uT*.1)); vec3 warm=vec3(1.,.82,.58);
#ifdef SHEET
 float spread=${SHEET_DISPERSION.base}+${SHEET_DISPERSION.wave}*sin(uT*.45+uOff.x);                              // dispersion : un peu plus marquée, en boucle
 vec3 Vv=-V, env3=vec3(envf(refract(Vv,N,1./(1.45-spread))),envf(refract(Vv,N,1./1.45)),envf(refract(Vv,N,1./(1.45+spread))));
 float cv=clamp(length(fwidth(N))*9.,0.,1.);
 vec3 iri=.5+.5*cos(6.2832*(fr*1.2+uT*.03+vec3(0.,.33,.67)));
 vec3 col=vec3(.5,.48,.45)*(.16+.5*fr+.1*streak)+env3*(.4+1.*fr)+iri*(fr*fr*.5+cv*.3)+warm*sp*1.2; float a=clamp(.42+.5*fr+length(env3)*.12,0.,1.);
#else
 vec3 col=vec3(.003,.007,.008)+warm*(fr*.1+sp*1.2)+vec3(.015)*streak*fr;
 col+=warm*uPulse*.6*exp(-pow((vW.x-12.)*.16,2.))*(.12+fr*1.6)*step(vW.z,-6.); // reflet de la porte lumineuse
 float a=1.;
#endif
 float d=length(cameraPosition-vW); col=mix(col,vec3(.012,.024,.024),1.-exp(-d*d*.0012));
 gl_FragColor=vec4(col,a);}`;
function makeMat(sheet, amp, off = [0, 0]) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uAmp: { value: amp }, uWob: { value: sheet ? 1 : 0 }, uOff: { value: new THREE.Vector2(...off) } },
    vertexShader: VERT.replace("@RN@", sheet ? "length(position.xy/vec2(2.3,1.35))" : "0.").replace("@SC@", sheet ? ".9" : "1.").replace("@ZK@", sheet ? "1.1" : "1."),
    fragmentShader: FRAG.replace("@SP@", sheet ? "60." : "40."),
    defines: sheet ? { SHEET: "" } : {}, transparent: sheet, side: THREE.DoubleSide, depthWrite: !sheet,
  });
}

/* ---------- Lumière cinéma : croissant, porte, mur de bois ---------- */
const BDV = "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const ARC = `uniform float uT,uPulse,uAfter; varying vec2 vUv;
float arcI(vec2 p,float o){                              // o : décalage radial par canal (dispersion)
 float d2=length(p)-9.4+o, d1=length(p-vec2(1.1,-.8))-10.4;
 float lit=smoothstep(.06,-.06,d1), ang=smoothstep(1.,-1.,p.y/9.);
 float I=lit*(.2+exp(-max(d2,0.)*.9)*1.5)*(.4+.9*ang)*uPulse*2.6;
 float halo=exp(-max(d2,0.)*.2)*smoothstep(.8,-1.4,d1)*.24*(.5+ang)*uPulse;
 float ghost=(exp(-pow((d2-1.5)/.07,2.))*.4+exp(-pow((d2-3.3)/.06,2.))*.2)*lit*uAfter;   // résidus : arcs fantômes
 float res=exp(-max(d2,0.)*.11)*smoothstep(1.,-2.,d1)*.5*max(uAfter-uPulse,0.)*3.;          // rémanence
 return I+halo+ghost+res;}
void main(){ vec2 p=(vUv-.5)*34.; float o=.24+.12*sin(uT*.5);
 gl_FragColor=vec4(vec3(1.,.86,.62)*vec3(arcI(p,-o),arcI(p,0.),arcI(p,o)),1.);}`;
const SLAB = `uniform float uT,uPulse; varying vec2 vUv;
float band(float x){return smoothstep(.62,.7,x)*(1.-smoothstep(.93,.97,x))*1.8+exp(-pow((x-.78)/.35,2.))*.5;}
void main(){ float x=vUv.x,y=vUv.y, s=.03+.014*sin(uT*.6);
 float v=mix(1.,.25,smoothstep(0.,1.,y))*smoothstep(1.,.9,y), f=uPulse*(.92+.08*sin(uT*9.+y*3.));
 gl_FragColor=vec4(vec3(1.,.88,.66)*vec3(band(x-s),band(x),band(x+s))*v*f*2.4,1.);}`;
const WOOD = `varying vec2 vUv;
void main(){ float g=sin(vUv.x*170.+sin(vUv.y*5.)*2.)*.5+.5; float s=sin(vUv.x*43.+vUv.y*2.)*.5+.5;
 vec3 c=mix(vec3(.012,.008,.006),vec3(.1,.06,.032),g*s*smoothstep(1.,0.,vUv.x*1.4)); gl_FragColor=vec4(c,1.);}`;
function Backdrop() {
  const m = useMemo(() => ({
    arc: new THREE.ShaderMaterial({ uniforms: shared, vertexShader: BDV, fragmentShader: ARC, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    slab: new THREE.ShaderMaterial({ uniforms: shared, vertexShader: BDV, fragmentShader: SLAB, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    wood: new THREE.ShaderMaterial({ vertexShader: BDV, fragmentShader: WOOD }),
  }), []);
  return (
    <group position={[1, 0.6, -24]}>
      <mesh><sphereGeometry args={[9, 64, 64]} /><meshBasicMaterial color="#010202" /></mesh>
      <mesh position={[0, 0, -0.5]} material={m.arc}><planeGeometry args={[34, 34]} /></mesh>
      <mesh position={[11, 4, -0.2]} material={m.slab}><planeGeometry args={[3.2, 14]} /></mesh>
      <mesh position={[19.4, 4, -0.4]} material={m.wood}><planeGeometry args={[14, 22]} /></mesh>
    </group>
  );
}

/* ---------- Monde 1 : intro ---------- */
function Liquid({ lite }) {
  const mat = useMemo(() => makeMat(false, 1), []), s = lite ? 110 : 220;
  return <mesh rotation-x={-Math.PI / 2} position={[0, -2.4, -8]} material={mat}><planeGeometry args={[70, 70, s, s]} /></mesh>;
}
function Sheet({ pos, rot, scale, seed, lite }) { // nappe épaisse (lentille), horizontale, déformée en boucle
  const ref = useRef(), mat = useMemo(() => makeMat(true, 0.35, [seed * 7, seed * 3]), [seed]);
  const geo = useMemo(() => { const g = new THREE.SphereGeometry(1, lite ? 64 : 112, lite ? 32 : 56); g.scale(2.3, 1.35, 0.22); g.computeVertexNormals(); return g; }, [lite]);
  useFrame(({ clock }) => { const t = clock.elapsedTime + seed * 10, m = ref.current; m.position.y = pos[1] + Math.sin(t * 0.4) * 0.3; m.rotation.z = rot[2] + Math.sin(t * 0.23) * 0.1; m.rotation.x = rot[0] + Math.sin(t * 0.3 + seed) * 0.05; });
  return <mesh ref={ref} geometry={geo} material={mat} position={pos} rotation={rot} scale={scale} frustumCulled={false} />;
}
function RockProc({ lite }) {
  const geo = useMemo(() => {
    let g = new THREE.IcosahedronGeometry(1, lite ? 4 : 6); g.deleteAttribute("normal"); g.deleteAttribute("uv"); g = mergeVertices(g); // normales lisses
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 3.1 + v.y * 2.3) * Math.cos(v.z * 2.7 + v.x * 1.9) * 0.16 + Math.sin(v.x * 7.3 + v.z * 5.1) * Math.cos(v.y * 6.7) * 0.07 + Math.sin(v.x * 17 + v.y * 13) * Math.sin(v.z * 19) * 0.025;
      v.multiplyScalar(1 + n); v.y = Math.max(v.y * 0.7, -0.45); p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  }, [lite]);
  return <mesh geometry={geo} position={[-5.6, -2.2, -1.5]} scale={[3.2, 2.4, 2.6]} rotation-y={0.6}><meshStandardMaterial color="#0e0d0b" roughness={0.38} metalness={0.3} /></mesh>;
}
class Boundary extends Component { // si le .glb est absent ou invalide : rocher procédural
  state = { e: false }; static getDerivedStateFromError() { return { e: true }; }
  render() { return this.state.e ? this.props.fallback : this.props.children; }
}
function GlbRock() {
  const { scene } = useGLTF("/boulder_rock_3d_model_free.glb");
  const o = useMemo(() => {
    const s = scene.clone(true), b = new THREE.Box3().setFromObject(s), sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    s.position.set(-c.x, -b.min.y - sz.y * 0.15, -c.z); // posé, légèrement immergé
    s.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); m.material.envMapIntensity = 0.4; if ("roughness" in m.material) m.material.roughness = Math.max(m.material.roughness, 0.35); } });
    return { s, k: 6.2 / Math.max(sz.x, sz.z) };
  }, [scene]);
  return <group position={[-5.4, -2.3, -1.5]} rotation-y={0.6} scale={o.k}><primitive object={o.s} /></group>;
}
function Rock({ lite }) { return <Boundary fallback={<RockProc lite={lite} />}><Suspense fallback={<RockProc lite={lite} />}><GlbRock /></Suspense></Boundary>; }
function Vapor({ lite }) {
  return (
    <Clouds material={THREE.MeshBasicMaterial} texture="/cloud.png" limit={120}>
      <Cloud seed={3} segments={lite ? 8 : 16} bounds={[14, 2, 3]} volume={6} color="#7d8a88" opacity={0.2} fade={30} speed={0.15} position={[0, 3.5, -16]} />
      {(lite ? [0] : [0, 1]).map(i => <Cloud key={i} seed={10 + i} segments={lite ? 10 : 20} bounds={[16, 0.6, 5]} volume={4} color="#b9b1a2" opacity={0.16} fade={14} speed={0.2} position={[i ? 6 : -4, -1.7, -9 - i * 3]} />)}
    </Clouds>
  );
}
function Intro({ lite }) {
  const g = useRef(), l = useRef();
  useFrame(() => {
    const t = S.zoom, e = t * t * (3 - 2 * t) + S.open * 0.2 + cl((S.t - 1.1) / 0.7) * 0.12; // zoom puis poussée à travers le portail
    g.current.position.set(0, -e * 0.4, e * 7.5); l.current.intensity = 55 + shared.uPulse.value * 60 + shared.uBass.value * 50;
  });
  return (
    <>
      <color attach="background" args={[BG]} /><fog attach="fog" args={[BG, 14, 48]} /><ambientLight intensity={0.06} />
      <pointLight ref={l} color="#ffd9a0" position={[5, 2, -12]} distance={40} decay={1.6} />
      <pointLight color="#ffcf94" position={[-2, 4, -3]} intensity={30} distance={18} decay={2} />
      <group ref={g}>
        <Backdrop /><Liquid lite={lite} /><Rock lite={lite} />
        <Sheet pos={[-6.2, 2.7, -2]} rot={[-1.05, 0.45, 0.18]} scale={1.5} seed={1} lite={lite} />
        <Sheet pos={[8, 3, -5]} rot={[-1.15, -0.5, -0.2]} scale={1.1} seed={2} lite={lite} />
        {!lite && <Sheet pos={[5.6, 0.5, -1.5]} rot={[-0.95, -0.35, 0.12]} scale={1.2} seed={3} lite={false} />}
        <Vapor lite={lite} />
      </group>
    </>
  );
}
function IntroPortal({ lite }) {
  const ref = useRef();
  useFrame(({ camera, size }) => {
    const m = ref.current, h = 2 * (camera.position.z - 0.5) * Math.tan(rad(camera.fov / 2));
    m.scale.set(h * (size.width / size.height) * 1.02, h * 1.02, 1); m.position.set(camera.position.x, camera.position.y, 0.5);
    m.visible = S.open < 0.995; // une fois traversé, l'intro (et l'eau) n'est plus rendue
  });
  return <mesh ref={ref}><planeGeometry args={[1, 1]} /><MeshPortalMaterial worldUnits><Intro lite={lite} /></MeshPortalMaterial></mesh>;
}

/* ---------- Monde 2 : mur de cuir + portail qui s'ouvre ---------- */
const LEATHER = `
uniform vec2 uSize,uPtr; uniform float uOpen,uX; uniform int uN; uniform vec4 uFr[8]; varying vec2 vUv;
float hs(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
float cell(vec2 p){vec2 i=floor(p),f=fract(p);float m=1.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=vec2(hs(i+g),hs(i+g+7.3));m=min(m,length(g+o-f));}return m;}
float sdb(vec2 p,vec4 b){vec2 d=abs(p-b.xy)-b.zw;return length(max(d,0.))+min(max(d.x,d.y),0.);}
void main(){
 vec2 p=vec2(vUv.x,1.-vUv.y)*uSize;
 float R=pow(uOpen,1.15)*length(uSize)*.62, dd=length(p-uSize*.5)-R;           // portail circulaire
 float ring=exp(-pow(dd/(8.+30.*uOpen),2.))*smoothstep(0.,.04,uOpen)*(1.-smoothstep(.8,1.,uOpen));
 if(dd>1.5){gl_FragColor=vec4(vec3(1.,.82,.55)*2.,clamp(ring,0.,1.)*.85);return;}
 vec2 q=p+vec2(uX,0.);                                                          // le cuir défile avec la marche
 float h=cell(q/9.)*.75+vn(q/2.)*.25+vn(q/90.)*.2;
 vec2 g=vec2(dFdx(h),-dFdy(h)); vec3 N=normalize(vec3(-g*7.,1.));
 vec3 Ld=normalize(vec3(uPtr-p,260.)); float lit=exp(-dot(uPtr-p,uPtr-p)/(2.*420.*420.));
 float diff=max(dot(N,Ld),0.), sp=pow(max(dot(reflect(-Ld,N),vec3(0,0,1)),0.),18.);
 vec3 col=vec3(.05,.036,.027)*(.35+.9*diff)*(.25+1.6*lit)+vec3(1.,.8,.55)*sp*.35*lit;
 float sh=0.,st=0.;
 for(int i=0;i<8;i++){ if(i>=uN)break;
  sh=max(sh,1.-smoothstep(0.,52.,sdb(p-vec2(10.,20.),uFr[i])));
  float rg=abs(sdb(p,vec4(uFr[i].xy,uFr[i].zw+26.)))-.6; st=max(st,(1.-smoothstep(0.,1.2,rg))*step(.5,fract((p.x+p.y)/9.))); }
 col*=1.-.78*sh; col+=vec3(.5,.38,.22)*.5*st;
 col*=mix(.45,1.,smoothstep(0.,160.,uSize.y*.5-abs(p.y-uSize.y*.5)+60.));      // fondu haut/bas
 col+=vec3(1.,.82,.55)*ring*1.6;
 gl_FragColor=vec4(col,1.);}`;
function Wall() {
  const ref = useRef();
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uSize: { value: new THREE.Vector2() }, uPtr: { value: new THREE.Vector2() }, uOpen: { value: 0 }, uX: { value: 0 }, uN: { value: 0 }, uFr: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) } },
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}", fragmentShader: LEATHER, transparent: true, depthWrite: false,
  }), []);
  useFrame(({ camera, size, pointer }) => {
    const el = q("[data-wall]"), m = ref.current; if (!el || S.open <= 0.001) { m.visible = false; return; }
    const r = el.getBoundingClientRect(); m.visible = r.bottom > 0 && r.top < size.height; if (!m.visible) return;
    place(m, r, 2, camera, size);
    const u = mat.uniforms, tr = q("[data-track]");
    u.uSize.value.set(r.width, r.height); u.uOpen.value = S.open * S.open * (3 - 2 * S.open);
    u.uX.value = tr ? -(tr.getBoundingClientRect().left - (innerWidth - (tr.offsetWidth || 0)) * 0) : 0;
    u.uPtr.value.set(((pointer.x + 1) / 2) * size.width - r.left, ((1 - pointer.y) / 2) * size.height - r.top);
    let n = 0; for (let i = 0; i < 8; i++) { const f = q(`[data-frame="${i}"]`); if (!f) break; const b = f.getBoundingClientRect(); u.uFr.value[n++].set(b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top, b.width / 2, b.height / 2); }
    u.uN.value = n;
  });
  return <mesh ref={ref} material={mat}><planeGeometry args={[1, 1]} /></mesh>;
}
function Tex({ img, r, ar }) { // image « cover » dans le cadre
  const t = useTexture(img); t.colorSpace = THREE.SRGBColorSpace;
  useFrame(() => { const ia = t.image.width / t.image.height, a = ar.current || 1; if (ia > a) { t.repeat.set(a / ia, 1); t.offset.set((1 - a / ia) / 2, 0); } else { t.repeat.set(1, ia / a); t.offset.set(0, (1 - ia / a) / 2); } });
  return <mesh ref={r}><planeGeometry args={[1, 1]} /><meshBasicMaterial map={t} /></mesh>;
}
function Pic({ img, grp, ar }) {
  const r = useRef();
  useFrame(() => { const u = grp.current?.userData || {}, h = u.h || 0, p = u.p || { x: 0, y: 0 }; if (r.current) { r.current.scale.setScalar(1.12 + h * 0.08); r.current.position.set(p.x * 0.03 * (0.5 + h), p.y * 0.03 * (0.5 + h), -0.05); } });
  return <><color attach="background" args={["#0d0b09"]} />{img ? <Tex img={img} r={r} ar={ar} /> : <mesh ref={r}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#17130f" /></mesh>}</>;
}
function Frame({ i, img }) {
  const g = useRef(), ar = useRef(1), hov = useRef(0);
  useFrame(({ camera, size, pointer }, dt) => {
    const el = q(`[data-frame="${i}"]`), m = g.current; if (!el || S.open < 0.5) { m.visible = false; return; }
    const r = el.getBoundingClientRect(); m.visible = r.right > -50 && r.left < size.width + 50 && r.bottom > -50 && r.top < size.height + 50; if (!m.visible) return;
    place(m.children[0], r, 2.08, camera, size, 9); place(m.children[1], r, 2.12, camera, size);
    hov.current = THREE.MathUtils.damp(hov.current, el.matches(":hover") ? 1 : 0, 5, dt); ar.current = r.width / r.height;
    m.userData.h = hov.current; m.userData.p = pointer;
  });
  return (
    <group ref={g}>
      <mesh><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#3a2c1c" /></mesh>
      <mesh><planeGeometry args={[1, 1]} /><MeshPortalMaterial><Pic img={img} grp={g} ar={ar} /></MeshPortalMaterial></mesh>
    </group>
  );
}

/* ---------- Pilotage : phases lissées (lerp), audio adouci, pulsation néon, parallaxe ---------- */
function applyDom(s) { // le DOM suit les phases lissées → 3D et HTML restent parfaitement synchrones
  const root = q("[data-exp]"), tr = q("[data-track]");
  root?.style.setProperty("--p", s.zoom.toFixed(3)); root?.style.setProperty("--v", s.zoom > 0.5 ? "hidden" : "visible");
  if (tr) {
    const max = Math.max(0, tr.scrollWidth - innerWidth), k = 0.86 + 0.14 * s.open;
    tr.style.transformOrigin = `${innerWidth / 2 + s.walk * max}px 50%`; tr.style.transform = `translate3d(${-s.walk * max}px,0,0) scale(${k})`; tr.style.opacity = cl((s.open - 0.35) / 0.5).toFixed(2);
  }
  const phr = document.querySelectorAll("[data-phr]");
  phr.forEach((el, i) => { const [a, b] = PHR[i] || [9, 10], x = (s.t - a) / (b - a); el.style.setProperty("--u", cl(x / 0.45).toFixed(3)); el.style.setProperty("--o", (cl(x / 0.1) * cl((1 - x) / 0.2)).toFixed(3)); });
}
function Rig({ reduced }) {
  const init = useRef(false);
  useFrame(({ camera, pointer, clock }, dt) => {
    const raw = story(), d = THREE.MathUtils.damp;
    S = init.current ? { zoom: d(S.zoom, raw.zoom, 7, dt), open: d(S.open, raw.open, 7, dt), walk: d(S.walk, raw.walk, 6, dt), t: d(S.t, raw.t, 7, dt) } : { ...raw }; init.current = true;
    applyDom(S);
    const t = clock.elapsedTime, b = bands(), k = (reduced ? 0 : 1) * (1 - S.zoom);
    shared.uT.value += dt * (reduced ? 0.15 : 1);
    shared.uBass.value = d(shared.uBass.value, b.live ? b.bass * 0.55 : 0.1 + 0.06 * Math.sin(t * 0.6), 3, dt); // réaction audio adoucie
    shared.uMid.value = d(shared.uMid.value, b.mid * 0.5, 3, dt);
    const pulse = 0.78 + 0.14 * Math.sin(t * 1.1) + 0.08 * Math.sin(t * 2.9 + 1.3) + 0.05 * Math.sin(t * 6.1 + 0.4) - (Math.sin(t * 0.37) > 0.93 ? 0.28 : 0) + shared.uBass.value * 0.12;
    shared.uPulse.value = d(shared.uPulse.value, pulse, 12, dt);
    shared.uAfter.value = Math.max(shared.uPulse.value, shared.uAfter.value - dt * 0.3);
    camera.position.x = d(camera.position.x, pointer.x * 0.6 * k, 2.5, dt);
    camera.position.y = d(camera.position.y, 0.4 + pointer.y * 0.3 * k, 2.5, dt);
    camera.position.z = 10; camera.lookAt(camera.position.x, camera.position.y, -10);
  });
  return null;
}

function ScrollHint({ hint }) { // indice de scroll : apparaît après 4 s sans défilement, disparaît au premier scroll
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!hint || scrollY > 8) return;
    const t = setTimeout(() => setShow(true), 4000), off = () => { if (scrollY > 8) { setShow(false); clearTimeout(t); removeEventListener("scroll", off); } };
    addEventListener("scroll", off, { passive: true }); return () => { clearTimeout(t); removeEventListener("scroll", off); };
  }, [hint]);
  if (!hint || !show) return null;
  return <div className="cn hint" aria-hidden="true"><span className="hl">{hint.long}</span><span className="hs">{hint.short}</span><i /></div>;
}

export default function Experience({ copy, images = [] }) {
  const c = copy?.corners;
  const env = useMemo(() => ({ lite: matchMedia("(max-width:768px)").matches || (navigator.hardwareConcurrency || 8) <= 4, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches }), []);
  const [on, setOn] = useState(true);
  useEffect(() => { // hors du parcours 3D : plus aucun rendu WebGL (marge de 200 px : reprise avant l'arrivée à l'écran)
    const el = document.querySelector("[data-story]"); if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "200px" }); io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div data-exp style={{ "--p": 0, "--v": "visible" }}>
      <div style={{ position: "fixed", inset: 0, background: BG, zIndex: 0, visibility: on ? "visible" : "hidden" }} aria-hidden="true">
        <Canvas frameloop={on ? "always" : "never"} eventSource={document.body} eventPrefix="client" dpr={[1, env.lite ? 1.25 : 1.75]} camera={{ fov: 42, position: [0, 0.4, 10], near: 0.1, far: 80 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <color attach="background" args={[BG]} />
          <Rig reduced={env.reduced} /><IntroPortal lite={env.lite} /><Wall />
          {images.slice(0, 8).map((img, i) => <Suspense key={i} fallback={null}><Frame i={i} img={img} /></Suspense>)}
          {!env.lite && <EffectComposer multisampling={0}><Bloom intensity={0.9} luminanceThreshold={0.7} mipmapBlur /><Vignette offset={0.3} darkness={0.85} /><Noise opacity={0.035} /></EffectComposer>}
        </Canvas>
      </div>
      <div className="phr">{copy?.story?.map((tx, pi) => { let n = 0; return <p key={pi} data-phr={pi} aria-label={tx}>{tx.split(" ").map((w, wi) => <span className="w" key={wi} aria-hidden="true">{[...w].map((ch, ci) => <span className="ch" key={ci} style={{ "--i": n++ }}>{ch}</span>)}</span>)}</p>; })}</div>
      <header style={{ position: "fixed", inset: 0, zIndex: 6, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none", opacity: "calc(1 - var(--p) * 2.2)", visibility: "var(--v)", color: "#f4efe6" }}>
        {/* Indice de scroll (retardé, disparaît au premier scroll) — pour le retirer : commenter la ligne suivante */}
        <ScrollHint hint={copy?.hint} />
        {c && <><div className="cn tl rv"><i />{c.tl.map(l => <span key={l}>{l}</span>)}</div><div className="cn tr rv"><i />{c.tr.map(l => <span key={l} className="ty" style={{ fontFamily: "var(--display)" }}>{l}</span>)}</div><div className="cn bl rv"><span>{c.bl}</span></div></>}
        <div>
          <h1 className="rv wordmark">KLIN</h1>
          <p className="rv sub" style={{ "--d": ".3s" }}>STUDIO</p>
          <p className="rv tag" style={{ "--d": ".6s" }}>{copy?.tagline}</p>
          <a className="rv cta" data-booking href={copy?.href || "/contact"} style={{ "--d": ".9s" }}>{copy?.cta}</a>
        </div>
      </header>
    </div>
  );
}
