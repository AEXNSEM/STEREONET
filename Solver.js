/* Stereonet by Nsem: Solver + geotechnical toolkit. Load AFTER tools.js. */
(function(){
'use strict';
const D=Math.PI/180,f0=Math.round,mod=a=>((a%360)+360)%360,pad=n=>String(Math.round(mod(n))%360).padStart(3,'0'),f1=x=>(+x).toFixed(1);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const n180=a=>((a+540)%360)-180,cl=x=>Math.max(-1,Math.min(1,x)),mag=v=>Math.hypot(v[0],v[1],v[2]);
const vec=(t,p)=>[Math.cos(p*D)*Math.sin(t*D),Math.cos(p*D)*Math.cos(t*D),Math.sin(p*D)];
const dn=v=>v[2]<0?v.map(c=>-c):v;
const tp=v=>{v=dn(v);return{t:mod(Math.atan2(v[0],v[1])/D),p:Math.asin(cl(v[2]/(mag(v)||1)))/D}};
const cmp=a=>['N','NE','E','SE','S','SW','W','NW'][Math.round(mod(a)/45)%8];
const ang=(a,b)=>Math.acos(cl(dot(a,b)/((mag(a)*mag(b))||1)))/D;
const mv=(A,v)=>A.map(r=>dot(r,v));
const esc=s=>String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
function rax(t,p,w){
  const a=vec(t,p),x=a[0],y=a[1],z=-a[2],c=Math.cos(w*D),s=Math.sin(w*D),k=1-c,f=[1,1,-1];
  const R=[[c+x*x*k,x*y*k-z*s,x*z*k+y*s],[y*x*k+z*s,c+y*y*k,y*z*k-x*s],[z*x*k-y*s,z*y*k+x*s,c+z*z*k]];
  return R.map((r,i)=>r.map((e,j)=>e*f[i]*f[j]));
}
const QD={N:0,NE:45,E:90,SE:135,S:180,SW:225,W:270,NW:315};
// entities: planes (P) and lines (L)
const mkP=(a,d,m)=>{let s=a;if(m==='DD')s=a-90;else if(QD[m]!=null){const z=QD[m],df=x=>Math.abs(n180(x-z));s=df(mod(a+90))<=df(mod(a-90))?a:a+180}s=mod(s);return{k:'P',s,d,dd:mod(s+90),n:vec(mod(s+270),90-d)}};
const mkL=(t,p)=>({k:'L',t:mod(t),p,v:vec(t,p)});
const lineOf=v=>{const q=tp(v);return mkL(q.t,q.p)},planeOf=n=>{const q=tp(n);return mkP(q.t+90,90-q.p,'RHR')};
const fl=v=>{const q=tp(v);return pad(q.t)+'/'+f0(q.p)};
const fP=p=>`${pad(p.s)}/${f0(p.d)} ${cmp(p.dd)} (dip/dip direction ${f0(p.d)}/${pad(p.dd)})`;
const fL=l=>`trend ${pad(l.t)}°, plunge ${f1(l.p)}°`;
const flat=bed=>{const a=rax(bed.s,0,bed.d),b=rax(bed.s,0,-bed.d);return tp(mv(a,bed.n)).p>=tp(mv(b,bed.n)).p?a:b};
const ent=d=>d.k==='p'?mkP(d.a,d.b,'RHR'):mkL(d.a,d.b);

// ---------- operations: [id,title,fields,run] ----------
const OPS=[
['inter','Intersection of two planes → trend & plunge',['P','P'],([a,b])=>{const c=cross(a.n,b.n);if(mag(c)<1e-6)return{err:'The planes are parallel, so there is no single intersection line.'};const l=lineOf(c),x=ang(a.n,b.n),ac=Math.min(x,180-x);
  return{r:[`Intersection line: ${fL(l)}`,`Angle between the planes: ${f1(ac)}° (acute), ${f1(180-ac)}° (obtuse)`],w:[`Pole 1 ${fl(a.n)}, pole 2 ${fl(b.n)}`,'Line = pole 1 × pole 2. On the net it is the point where the two great circles cross.'],plot:[{k:'l',a:l.t,b:l.p}]}}],
['pole','Plane → pole (trend & plunge)',['P'],([p])=>{const q=tp(p.n);return{r:[`Pole to the plane: trend ${pad(q.t)}°, plunge ${f1(q.p)}°`,`Dip direction ${pad(p.dd)}°, dip ${f1(p.d)}°`],w:['Pole trend = dip direction + 180°; pole plunge = 90° − dip.'],plot:[{k:'l',a:q.t,b:q.p}]}}],
['fpole','Pole (trend & plunge) → plane',['L'],([l])=>{const p=planeOf(l.v);return{r:[`Plane: ${fP(p)}`],w:['Strike = pole trend + 90°; dip = 90° − pole plunge.'],plot:[{k:'p',a:p.s,b:p.d}]}}],
['app','Apparent dip in a given direction',['P',['N','Direction of section / view (°)']],([p,az])=>{const a=Math.atan(Math.tan(p.d*D)*Math.sin((az-p.s)*D))/D,tr=a>=0?mod(az):mod(az+180);
  return{r:[`Apparent dip: ${f1(Math.abs(a))}° towards ${pad(tr)}° (${cmp(tr)})`,`True dip: ${f1(p.d)}° towards ${pad(p.dd)}°`],w:['tan(apparent dip) = tan(true dip) × sin(angle between the strike and the section line).'],plot:[{k:'l',a:tr,b:Math.abs(a)}]}}],
['p2l','Plane from two lines (or two apparent dips)',['L','L'],([a,b])=>{const c=cross(a.v,b.v);if(mag(c)<1e-6)return{err:'The lines are parallel, so they do not define a unique plane.'};const p=planeOf(c);
  return{r:[`Plane: ${fP(p)}`,`Pole to the plane: ${fl(c)}`],w:['Pole = line 1 × line 2. An apparent dip is a line: trend = section direction, plunge = apparent dip.'],plot:[{k:'p',a:p.s,b:p.d}]}}],
['rake','Rake (pitch) in a plane → trend & plunge',['P',['N','Rake from the RHR strike direction (0–180°)']],([p,r])=>{const sv=vec(p.s,0),dv=vec(p.dd,p.d),l=lineOf(sv.map((c,i)=>Math.cos(r*D)*c+Math.sin(r*D)*dv[i]));
  return{r:[`Line: ${fL(l)}`],w:[`Strike direction ${pad(p.s)}°. If your pitch is measured from the other strike end (${pad(p.s+180)}°), use 180° − pitch.`],plot:[{k:'l',a:l.t,b:l.p}]}}],
['lrake','Line in a plane → rake (pitch)',['P','L'],([p,l])=>{const dev=Math.asin(cl(Math.abs(dot(l.v,p.n))))/D,sv=vec(p.s,0),dv=vec(p.dd,p.d),r=Math.atan2(Math.abs(dot(l.v,dv)),dot(l.v,sv))/D;
  return{r:[`Rake from the strike direction ${pad(p.s)}°: ${f1(r)}°`,`Acute pitch: ${f1(Math.min(r,180-r))}° from the ${r<90?pad(p.s):pad(p.s+180)}° end of strike`],w:[dev>5?`Warning: the line is ${f1(dev)}° off the plane, so it does not really lie in it.`:'The line lies in the plane (within 5°).']}}],
['aLL','Angle between two lines',['L','L'],([a,b])=>{const x=ang(a.v,b.v);return{r:[`Angle: ${f1(x)}° (supplement ${f1(180-x)}°)`],w:['cos(angle) = dot product of the two unit vectors.']}}],
['aPP','Angle between two planes',['P','P'],([a,b])=>{const x=ang(a.n,b.n),ac=Math.min(x,180-x);return{r:[`Dihedral angle: ${f1(ac)}° (acute), ${f1(180-ac)}° (obtuse)`],w:['The angle between two planes equals the angle between their poles.']}}],
['aLP','Angle between a line and a plane',['L','P'],([l,p])=>({r:[`Angle between the line and the plane: ${f1(Math.asin(cl(Math.abs(dot(l.v,p.n))))/D)}°`],w:['0° means the line lies in the plane; 90° means it is the pole.']})],
['rotL','Rotate a line about an axis',['L',['A','Rotation axis (trend, plunge)'],['N','Angle (°, clockwise looking down-plunge)']],([l,ax,w])=>{const q=lineOf(mv(rax(ax.t,ax.p,w),l.v));return{r:[`Rotated line: ${fL(q)}`],plot:[{k:'l',a:q.t,b:q.p}]}}],
['rotP','Rotate a plane about an axis',['P',['A','Rotation axis (trend, plunge)'],['N','Angle (°, clockwise looking down-plunge)']],([p,ax,w])=>{const q=planeOf(mv(rax(ax.t,ax.p,w),p.n));return{r:[`Rotated plane: ${fP(q)}`],plot:[{k:'p',a:q.s,b:q.d}]}}],
['tiltL','Restore bedding to horizontal: line (e.g. paleocurrent)',[['P','Bedding'],['L','Line to restore']],([b,l])=>{const q=lineOf(mv(flat(b),l.v));return{r:[`Restored line: ${fL(q)}`],w:[`Rotation about the bedding strike (${pad(b.s)}°) by ${f1(b.d)}° so the bedding becomes horizontal.`],plot:[{k:'l',a:q.t,b:q.p}]}}],
['tiltP','Restore bedding to horizontal: plane',[['P','Bedding'],['P','Plane to restore']],([b,p])=>{const q=planeOf(mv(flat(b),p.n));return{r:[`Restored plane: ${fP(q)}`],w:[`Rotation about the bedding strike (${pad(b.s)}°) by ${f1(b.d)}°.`],plot:[{k:'p',a:q.s,b:q.d}]}}],
['sp','True spacing and Terzaghi weight (borehole / scanline bias)',[['L','Scanline / borehole (trend, plunge)'],['P','Joint set'],['N','Measured spacing along the line (m)']],([l,p,s])=>{const c=Math.abs(dot(l.v,p.n)),th=Math.acos(cl(c))/D;if(c<1e-3)return{err:'The line is parallel to the joints, so it never intersects them.'};
  return{r:[`Angle between the line and the joint pole: ${f1(th)}°`,`True (normal) spacing: ${(s*c).toFixed(3)} m`,`Terzaghi weight: ${(1/c).toFixed(2)}`],w:['True spacing = measured spacing × cos(θ); weight = 1 / cos(θ). Joints at θ > 80° are heavily under-sampled.']}}]
];
const OPI=Object.fromEntries(OPS.map(o=>[o[0],o]));

// ---------- kinematic analysis of rock slopes ----------
function kin(nm,sf,sd,phi,lat){
  const P=data.map((d,i)=>({d,n:i+1})).filter(o=>o.d.s===nm&&o.d.k==='p').map(o=>Object.assign(mkP(o.d.a,o.d.b,'RHR'),{id:o.n}));
  if(!P.length)return null;
  const pl=P.filter(p=>p.d<sf&&p.d>phi&&Math.abs(n180(p.dd-sd))<=lat),tp_=P.filter(p=>Math.abs(n180(p.dd-sd-180))<=10&&p.d>=90-sf+phi),W=[];
  for(let i=0;i<P.length&&i<70;i++)for(let j=i+1;j<P.length&&j<70;j++){const c=cross(P[i].n,P[j].n);if(mag(c)<Math.sin(10*D))continue;const l=lineOf(c),ap=Math.atan(Math.tan(sf*D)*Math.cos((l.t-sd)*D))/D;
    W.push({a:P[i].id,b:P[j].id,l,ok:Math.cos((l.t-sd)*D)>0&&l.p<ap&&l.p>phi})}
  const wf=W.filter(w=>w.ok).sort((a,b)=>b.l.p-a.l.p),pc=(x,n)=>n?f0(100*x/n)+'%':'–';
  const fsP=pl.length?Math.min.apply(null,pl.map(p=>Math.tan(phi*D)/Math.tan(p.d*D))):null;
  const lines=[`Planar sliding: ${pl.length} of ${P.length} planes (${pc(pl.length,P.length)}) can slide${pl.length?': #'+pl.map(p=>p.id).join(', #'):''}`,
   `Wedge sliding: ${wf.length} of ${W.length} plane pairs (${pc(wf.length,W.length)}) form a wedge that daylights${wf.length?'; most critical '+wf.slice(0,5).map(w=>`#${w.a}+#${w.b} → ${pad(w.l.t)}/${f0(w.l.p)}`).join(', '):''}`,
   `Toppling: ${tp_.length} of ${P.length} planes (${pc(tp_.length,P.length)}) are in the toppling zone${tp_.length?': #'+tp_.map(p=>p.id).join(', #'):''}`];
  const sc=[['planar',pl.length/P.length],['wedge',W.length?wf.length/W.length:0],['toppling',tp_.length/P.length]].sort((a,b)=>b[1]-a[1]);
  const extra=[];if(fsP!=null)extra.push(`Simplest dry planar factor of safety on the most critical plane: FS ≈ tan φ / tan ψp = ${fsP.toFixed(2)} (no cohesion or water).`);
  if(wf.length)extra.push(`Wedge approximation on the most critical line: FS ≈ tan φ / tan ψi = ${(Math.tan(phi*D)/Math.tan(wf[0].l.p*D)).toFixed(2)} (ignores wedge geometry, cohesion and water).`);
  return{lines,sum:sc[0][1]>0?`Most likely mode in this data: ${sc[0][0]} failure.`:'No kinematically feasible failure mode was found for these inputs.',extra,wedges:wf.slice(0,5)};
}

// ---------- conceptual answers ----------
const FAQ=[
[/planar (slid|fail)/,'Planar sliding: a block slides on a single discontinuity that daylights in the slope face. The plane must (1) strike within about ±20° of the slope face, (2) dip less than the face (it daylights), and (3) dip more than the friction angle φ. Dry, cohesionless factor of safety: FS = tan φ / tan ψp.'],
[/wedge/,'Wedge sliding: two discontinuities intersect to form a wedge sliding along their line of intersection. The line must plunge out of the face (plunge less than the apparent dip of the face in the line’s trend) and plunge more than φ. In this app, use “Intersection of two planes” or the slope analysis panel.'],
[/toppl/,'Toppling: steeply dipping slabs dipping into the slope rotate forward. Goodman–Bray criterion: strike within about 10° of the face, dip into the face, and dip ψp ≥ (90° − slope dip) + φ so that interlayer slip can occur.'],
[/friction (cone|circle|angle)|\bφ\b|\bphi\b/,'The friction angle φ is the dip below which a plane cannot slide under gravity alone. On a stereonet it appears as a small circle at plunge φ (the “friction cone”): a sliding direction must plunge more steeply than φ, i.e. plot inside that circle.'],
[/daylight/,'A plane or line “daylights” when it emerges in the slope face: its dip (or plunge) in the direction of the face must be less than the face dip in that direction. Otherwise it dives into the slope and cannot slide out.'],
[/lateral limit|20 ?°|±20/,'Lateral limits (typically ±20°) allow for sliding on planes that strike slightly oblique to the slope face, because side constraints are usually minor; widen them for very rough or open joints.'],
[/markland|kinematic/,'Kinematic (Markland) analysis tests whether the geometry of discontinuities relative to the slope permits sliding, using only orientations and the friction angle. It does not give a factor of safety; that needs strength, geometry and water.'],
[/terzaghi|sampling bias|borehole bias|scanline bias/,'Terzaghi correction removes sampling bias: a scanline or borehole under-samples joints nearly parallel to it. Each joint is weighted by 1 / |cos θ|, where θ is the angle between the line and the joint pole. Weights above about 10 (θ > 84°) are usually capped.'],
[/equal.?area|equal.?angle|schmidt|wulff/,'Equal-area (Schmidt) nets keep areas true, so they are used for counting and contouring pole density, which is standard in rock mechanics. Equal-angle (Wulff) nets keep angles true and suit graphical constructions.'],
[/factor of safety|\bfs\b/,'Planar block with cohesion, water and a tension crack: FS = (cA + (W cos ψp − U − V sin ψp) tan φ) / (W sin ψp + V cos ψp). Without cohesion or water it reduces to tan φ / tan ψp.'],
[/apparent dip|true dip/,'True dip is the maximum dip, measured at right angles to strike. In any other vertical section you see a smaller apparent dip: tan(apparent) = tan(true) × sin(angle between strike and the section).'],
[/trend|plunge/,'A line’s trend is the compass bearing of its horizontal projection (the direction it points down); its plunge is the angle below horizontal. Strike/dip uses the right-hand rule; dip/dip direction writes the dip first, then the compass bearing it dips towards.'],
[/rhr|right.?hand rule|dip direction|strike/,'Right-hand rule: with the strike direction in front of you, the plane dips to your right, so dip direction = strike + 90°. Dip/dip direction (for example 60/135) is the usual geotechnical notation.'],
[/fisher|alpha ?95|α95|confidence/,'Fisher κ measures how tightly a cluster of poles is concentrated (higher = tighter). α95 is the half-angle of the cone containing the true mean with 95% confidence. Both apply only to clustered data, not girdles.']
];

// ---------- free-text parsing ----------
const RX=(s,f)=>new RegExp(s.split('NUM').join('(\\d{1,3}(?:\\.\\d+)?)').split('QD').join('(NE|NW|SE|SW|N|S|E|W)'),f||'gi');
function parseQ(t){
  const dd=/dip\s*\/\s*(?:dip\s*dir\w*|dd)|dip\s*,?\s*dip\s*direction/i.test(t),app=/apparent/i.test(t),acc=[],mask=new Array(t.length).fill(0);
  const PL=['line','trend','plunge','axis','slickenline','scanline','borehole','drill','lineation','hole'],PW=['plane','strike','bedding','joint','fault','foliation','fracture','cleavage','slope','face','discontinuity','cut','set'];
  const pats=[
   [String.raw`#(\d+)`,m=>{const d=data[+m[1]-1];return d?ent(d):null}],
   [String.raw`NUM\s*°?\s*[/,\s]\s*NUM\s*°?\s*QD\b`,m=>mkP(+m[1],+m[2],m[3].toUpperCase())],
   [String.raw`strike\s*(?:of\s*|=)?\s*NUM\D{1,14}?dip\s*(?:of\s*|=)?\s*NUM\s*°?\s*(?:QD\b)?`,m=>mkP(+m[1],+m[2],m[3]?m[3].toUpperCase():'RHR')],
   [String.raw`(?:dip\s*dir\w*|dd)\s*(?:of\s*|=)?\s*NUM\D{1,12}?dip\s*(?:of\s*|=)?\s*NUM`,m=>mkP(+m[1],+m[2],'DD')],
   [String.raw`dip\s*(?:of\s*|=)?\s*NUM\s*°?[\s,;]*(?:and\s*|with\s*)?(?:dip\s*dir\w*|dd|direction|towards?|toward|azimuth|bearing)\s*(?:of\s*|=)?\s*NUM`,m=>app?mkL(+m[2],+m[1]):mkP(+m[2],+m[1],'DD')],
   [String.raw`trend\s*(?:of\s*|=)?\s*NUM\D{1,15}?plunge\s*(?:of\s*|=)?\s*NUM`,m=>mkL(+m[1],+m[2])],
   [String.raw`plunge\s*(?:of\s*|=)?\s*NUM\s*°?\s*(?:towards?|toward|on|at|to|trending|trend|bearing)\s*(?:of\s*)?NUM`,m=>mkL(+m[2],+m[1])],
   [String.raw`NUM\s*°?\s*/\s*NUM`,(m,i)=>{const b=t.slice(Math.max(0,i-40),i).toLowerCase(),li=Math.max.apply(null,PL.map(w=>b.lastIndexOf(w))),pi=Math.max.apply(null,PW.map(w=>b.lastIndexOf(w)));
      if(li>pi)return mkL(+m[1],+m[2]);if(/slope|face|cut/.test(b.slice(Math.max(pi,0)))||dd)return mkP(+m[2],+m[1],'DD');return mkP(+m[1],+m[2],'RHR')}]
  ];
  pats.forEach(([s,fn])=>{for(const m of t.matchAll(s[0]==='#'?/#(\d+)/g:RX(s))){const i=m.index,l=m[0].length;let used=false;for(let k=i;k<i+l;k++)if(mask[k])used=true;if(used)continue;const e=fn(m,i);if(!e)continue;for(let k=i;k<i+l;k++)mask[k]=1;acc.push({i,e})}});
  acc.sort((a,b)=>a.i-b.i);
  return{E:acc.map(a=>a.e),blank:t.split('').map((c,i)=>mask[i]?' ':c).join('')};
}
const numIn=(s,re)=>{const m=re.exec(s);return m?+m[1]:null};
function pickSet(low){const nm=[...new Set(data.map(d=>d.s))],re=n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),hit=nm.find(n=>new RegExp('\\bsets?\\s+["“\']?'+re(n.toLowerCase())+'\\b').test(low)||(n.length>2&&new RegExp('\\b'+re(n.toLowerCase())+'\\b').test(low)));
  if(hit)return hit;const sel=typeof document!=='undefined'&&(document.getElementById('tSet')||document.getElementById('isel'));return sel&&sel.value?sel.value:(nm.find(n=>data.some(d=>d.s===n&&d.k==='p'))||nm[0])}

// ---------- rendering ----------
let plotQ=[],hl='';
const box=h=>`<div style="margin:6px 0">${h}</div>`;
function showOp(id,args,note){
  const o=OPI[id],res=o[3](args);let h=`<div><b>${esc(o[1])}</b></div>`+(note?`<div class="mute">I read this as: ${esc(note)}</div>`:'');
  if(res.err)return h+`<div style="color:#dc2626">${esc(res.err)}</div>`;
  plotQ=res.plot||[];h+=res.r.map(x=>`<div style="margin:6px 0;font-weight:600">${esc(x)}</div>`).join('')+(res.w||[]).map(x=>`<div class="mute">${esc(x)}</div>`).join('');
  if(plotQ.length)h+=`<div class="row"><button class="p" data-sv="plot">Plot result on the net</button></div>`;
  return h;
}
let OV=null;
function showKin(nm,sf,sd,phi,lat){
  const r=kin(nm,sf,sd,phi,lat);if(!r)return `<div class="mute">Set “${esc(nm)}” has no plane measurements. Add some and try again.</div>`;
  OV={sf,sd,phi};if(window.draw)window.draw();
  plotQ=r.wedges.map(w=>({k:'l',a:w.l.t,b:w.l.p}));
  return `<div><b>Rock-slope kinematic analysis: set ${esc(nm)}</b></div><div class="mute">Slope ${f0(sf)}/${pad(sd)} (dip/dip direction), friction ${f0(phi)}°, lateral limit ±${f0(lat)}°. The slope face and friction circle are drawn on the net.</div>`
   +r.lines.map(x=>box(esc(x))).join('')+`<div style="margin:6px 0;font-weight:600">${esc(r.sum)}</div>`+r.extra.map(x=>`<div class="mute">${esc(x)}</div>`).join('')
   +(plotQ.length?`<div class="row"><button class="s" data-sv="plot">Plot critical wedge lines</button></div>`:'')
   +`<div class="mute">Tests: planar (Markland), wedge (intersection daylights and plunges more than φ), flexural toppling (Goodman–Bray). Always confirm with strength, water and field checks.</div>`;
}
const CAP='I can solve: intersection of planes, apparent dip, true dip from two apparent dips, pole ↔ plane, rake ↔ trend/plunge, angles, rotations, bedding restoration, true spacing, and rock-slope stability (planar, wedge, toppling). Try: “intersection of 045/60 SE and 120/45 NE”, or “slope 60/135, friction 30”.';
function ask(text){
  const t=text.trim();if(!t)return null;const low=t.toLowerCase(),{E,blank}=parseQ(t),Ps=E.filter(e=>e.k==='P'),Ls=E.filter(e=>e.k==='L'),has=r=>r.test(low);
  const echo=E.map((e,i)=>e.k==='P'?`plane ${pad(e.s)}/${f0(e.d)} ${cmp(e.dd)}`:`line ${pad(e.t)}/${f0(e.p)}`).join('; ');
  if(has(/slope|kinematic|planar|wedge|toppl|daylight|stability|friction/)&&(has(/slope|face|cut/)||has(/friction/))&&!has(/^what|^define|^explain/)){
    const phi=numIn(blank,/friction\D{0,18}?(\d{1,2}(?:\.\d+)?)/i),lat=numIn(blank,/lateral\D{0,18}?(\d{1,2}(?:\.\d+)?)/i)||20;
    let sf=numIn(blank,/slope\s*(?:dip|angle)?\D{0,6}?(\d{1,2}(?:\.\d+)?)/i),sd=numIn(blank,/slope\D{0,30}?(?:dip\s*dir\w*|dd|direction|facing|towards?)\D{0,6}?(\d{1,3}(?:\.\d+)?)/i);
    const sl=Ps[0];if(sl&&(sf==null||sd==null)){sf=sl.d;sd=sl.dd}
    if(phi==null||sf==null||sd==null)return{h:`<div>${esc(CAP)}</div><div class="mute">For slope analysis give the slope and friction like “slope 60/135, friction angle 30” (dip/dip direction), or use the panel below.</div>`};
    return{h:showKin(pickSet(low),sf,sd,phi,lat)};
  }
  const id=(()=>{
    if(has(/intersect|line of intersection/)&&Ps.length>=2)return['inter',[Ps[0],Ps[1]]];
    if(has(/apparent dip/)&&Ps.length>=1){const az=numIn(blank,/(?:direction|towards?|toward|azimuth|bearing|along|section|trending)\s*(?:of\s*|=)?\s*(\d{1,3}(?:\.\d+)?)/i);if(az!=null)return['app',[Ps[0],az]]}
    if(has(/apparent|two lines|two dips|true dip/)&&Ls.length>=2)return['p2l',[Ls[0],Ls[1]]];
    if(has(/restor|unfold|flatten|tilt correct|untilt|rotate back/)&&Ps.length>=2)return['tiltP',[Ps[0],Ps[1]]];
    if(has(/restor|unfold|flatten|tilt correct|untilt|rotate back/)&&Ps.length>=1&&Ls.length>=1)return['tiltL',[Ps[0],Ls[0]]];
    if(has(/spacing|terzaghi/)&&Ps.length>=1&&Ls.length>=1){const s=numIn(blank,/spacing\D{0,14}?(\d+(?:\.\d+)?)/i);if(s!=null)return['sp',[Ls[0],Ps[0],s]]}
    if(has(/rake|pitch/)&&Ps.length>=1){const r=numIn(blank,/(?:rake|pitch)\D{0,14}?(\d{1,3}(?:\.\d+)?)/i);if(r!=null)return['rake',[Ps[0],r]];if(Ls.length)return['lrake',[Ps[0],Ls[0]]]}
    if(has(/angle between|angle of/)){if(Ps.length>=2)return['aPP',[Ps[0],Ps[1]]];if(Ls.length>=2)return['aLL',[Ls[0],Ls[1]]];if(Ls.length&&Ps.length)return['aLP',[Ls[0],Ps[0]]]}
    if(has(/pole/)&&Ps.length>=1)return['pole',[Ps[0]]];
    if(has(/pole/)&&Ls.length>=1&&has(/plane|strike|dip/))return['fpole',[Ls[0]]];
    if(has(/trend|plunge/)&&Ps.length>=2)return['inter',[Ps[0],Ps[1]]];
    return null})();
  if(id)return{h:showOp(id[0],id[1],echo)};
  const f=FAQ.find(x=>x[0].test(low)&&(/^(what|define|explain|how|why|meaning|tell)/.test(low)||low.split(' ').length<5||/planar|wedge|toppl|friction|daylight|terzaghi|markland|lateral/.test(low)));
  if(f)return{h:`<div>${esc(f[1])}</div>`};
  return E.length?{h:`<div>${esc(CAP)}</div><div class="mute">I found: ${esc(echo)}. Say what to compute (e.g. “intersection”, “apparent dip toward 120”, “pole”, “angle between”).</div>`}:null;
}
if(typeof window!=='undefined')window.__sv={OPS,ask,kin,parseQ,mkP,mkL,fl,showOp};
if(typeof document==='undefined'||!document.getElementById('interp'))return;

// ---------- interface ----------
const $=id=>document.getElementById(id);
const MODES=[['RHR','strike (RHR)'],['DD','dip direction'],['N','strike, dips N'],['NE','strike, dips NE'],['E','strike, dips E'],['SE','strike, dips SE'],['S','strike, dips S'],['SW','strike, dips SW'],['W','strike, dips W'],['NW','strike, dips NW']];
let cur=OPS[0];
function fieldsOf(o){let np=0,nl=0;return o[2].map(f=>{const ty=Array.isArray(f)?f[0]:f,lb=Array.isArray(f)?f[1]:null;if(ty==='P'){np++;return{ty,lb:lb||(o[2].filter(x=>x==='P').length>1?'Plane '+np:'Plane')}}if(ty==='L'){nl++;return{ty,lb:lb||(o[2].filter(x=>x==='L').length>1?'Line '+nl:'Line')}}return{ty,lb}})}
function buildFields(){
  $('sF').innerHTML=fieldsOf(cur).map((f,i)=>{const h=`<div style="margin:6px 0"><div class="mute">${esc(f.lb)}</div><div class="row" style="margin:2px 0">`;
    if(f.ty==='P')return h+`<input id="sf${i}a" type="number" inputmode="decimal" placeholder="strike / DD" style="width:92px"><input id="sf${i}b" type="number" inputmode="decimal" placeholder="dip" style="width:64px"><select id="sf${i}m">${MODES.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')}</select><input id="sf${i}n" type="number" placeholder="or #" style="width:64px"></div></div>`;
    if(f.ty==='L'||f.ty==='A')return h+`<input id="sf${i}a" type="number" inputmode="decimal" placeholder="trend" style="width:92px"><input id="sf${i}b" type="number" inputmode="decimal" placeholder="plunge" style="width:84px">${f.ty==='L'?`<input id="sf${i}n" type="number" placeholder="or #" style="width:64px">`:''}</div></div>`;
    return h+`<input id="sf${i}a" type="number" inputmode="decimal" style="width:120px"></div></div>`}).join('')}
function readArgs(){
  const out=[];
  for(const [i,f] of fieldsOf(cur).entries()){
    const v=id=>{const e=$('sf'+i+id);return e?parseFloat(e.value):NaN},nn=v('n');
    if(f.ty==='N'){if(!isFinite(v('a')))throw f.lb+': enter a number.';out.push(v('a'));continue}
    if(isFinite(nn)){const d=data[nn-1];if(!d)throw 'Measurement #'+nn+' does not exist.';const e=ent(d);if((f.ty==='P')!==(e.k==='P'))throw f.lb+': #'+nn+' is a '+(e.k==='P'?'plane':'line')+'.';out.push(e);continue}
    const a=v('a'),b=v('b');if(!isFinite(a)||!isFinite(b))throw f.lb+': fill in both numbers (or give a # from your list).';if(b<0||b>90)throw f.lb+': dip / plunge must be 0–90°.';
    out.push(f.ty==='P'?mkP(a,b,$('sf'+i+'m').value):mkL(a,b));
  }
  return out;
}
const out=h=>{$('sOut').innerHTML=h;$('sOut').scrollIntoView({block:'nearest'})};
const c=document.createElement('div');c.className='card';c.id='solverCard';
c.innerHTML=`<h2 style="font-size:16px;margin:0 0 4px">Solve and geotechnical questions</h2>
<div class="mute" style="margin-bottom:8px">Type a problem in your own words, or pick a calculation below. Examples: “intersection of 045/60 SE and 120/45 NE”, “apparent dip of plane 030/50 SE towards 100”, “slope 60/135 friction 30”, “what is toppling?”.</div>
<div class="row"><input id="sQ" placeholder="Type a problem or question" style="flex:1;min-width:200px"><button class="p" id="sAsk">Solve</button></div>
<details open><summary class="mute" style="cursor:pointer;margin:6px 0">Step-by-step calculator</summary>
<div class="row"><select id="sOp" style="flex:1;min-width:220px">${OPS.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></div>
<div id="sF"></div><div class="row"><button class="p" id="sGo">Calculate</button></div></details>
<details><summary class="mute" style="cursor:pointer;margin:6px 0">Rock-slope stability (kinematic analysis)</summary>
<div class="row"><select id="kSet" aria-label="Set"></select><input id="kSf" type="number" placeholder="slope dip" style="width:96px"><input id="kSd" type="number" placeholder="slope dip dir" style="width:110px"><input id="kPhi" type="number" placeholder="friction φ" style="width:100px"><input id="kLat" type="number" placeholder="lateral ±20" style="width:104px"></div>
<div class="row"><button class="p" id="kGo">Analyse slope</button><label class="chk"><input type="checkbox" id="kOv" checked>Show slope and friction circle on net</label></div></details>
<div id="sOut"></div>`;
($('toolsCard')||$('interp')).after(c);
buildFields();
function kSets(){const nm=[...new Set(data.map(d=>d.s))],k=$('kSet'),v=k.value;k.innerHTML=nm.map(n=>`<option>${esc(n)}</option>`).join('');if(nm.indexOf(v)>=0)k.value=v}
kSets();c.addEventListener('pointerdown',kSets,true);
$('sOp').onchange=()=>{cur=OPI[$('sOp').value];buildFields()};
$('sGo').onclick=()=>{try{out(showOp(cur[0],readArgs()))}catch(e){out(`<div style="color:#dc2626">${esc(e)}</div>`)}};
$('kOv').onchange=()=>{if(window.draw)window.draw()};
$('kGo').onclick=()=>{const sf=parseFloat($('kSf').value),sd=parseFloat($('kSd').value),ph=parseFloat($('kPhi').value),la=parseFloat($('kLat').value);
  if(![sf,sd,ph].every(isFinite)||sf<=0||sf>90)return out('<div style="color:#dc2626">Enter the slope dip (0–90°), slope dip direction and friction angle.</div>');
  kSets();out(showKin($('kSet').value,sf,mod(sd),ph,isFinite(la)?la:20))};
const run=()=>{const r=ask($('sQ').value);out(r?r.h:`<div>${esc(CAP)}</div>`);return !!r};
$('sAsk').onclick=run;$('sQ').addEventListener('keydown',e=>{if(e.key==='Enter')run()});
c.addEventListener('click',e=>{if(e.target.dataset&&e.target.dataset.sv==='plot'){plotQ.forEach(p=>data.push({k:p.k,a:p.a,b:p.b,s:'Solution'}));save();draw();window.scrollTo({top:0,behavior:'smooth'})}});
// send calculation-style questions from the existing "Ask about my data" box here
const tAsk=$('tAsk');if(tAsk)tAsk.addEventListener('click',e=>{const q=$('tQ').value,r=ask(q);if(r){e.stopImmediatePropagation();$('sQ').value=q;out(r.h);c.scrollIntoView({block:'start'})}},true);
// draw the slope face and friction circle on the net
if(window.draw){const d0=window.draw;window.draw=function(){d0.apply(this,arguments);try{
  if(!OV||!$('kOv').checked)return;
  ctx.save();ctx.lineWidth=2.4;ctx.setLineDash([8,4]);ctx.strokeStyle='#dc2626';planeSegs(mod(OV.sd-90),OV.sf,I3()).forEach(stroke);
  ctx.strokeStyle='#ea580c';ctx.lineWidth=2;const ring=[];for(let a=0;a<=360;a+=3)ring.push(proj(vec(a,OV.phi)));stroke(ring);
  ctx.setLineDash([]);ctx.font='700 11px system-ui';ctx.fillStyle='#dc2626';const s=proj(vec(OV.sd+180,90-OV.sf));ctx.beginPath();ctx.moveTo(s[0]-6,s[1]-6);ctx.lineTo(s[0]+6,s[1]+6);ctx.moveTo(s[0]+6,s[1]-6);ctx.lineTo(s[0]-6,s[1]+6);ctx.strokeStyle='#dc2626';ctx.stroke();
  ctx.fillText('slope pole',s[0]+9,s[1]-6);const f=proj(vec(OV.sd+45,OV.phi));ctx.fillStyle='#ea580c';ctx.fillText('φ = '+f0(OV.phi)+'°',f[0]+4,f[1]-4);ctx.restore()}catch(e){}}}
})();
