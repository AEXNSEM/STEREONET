/* Stereonet by Nsem: "Ask about my data" toolkit. Loaded after the main script. */
(function(){
'use strict';
const D=Math.PI/180,f0=Math.round,mod=a=>((a%360)+360)%360,pad=n=>String(Math.round(n)%360).padStart(3,'0');
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const nrm=v=>{const m=Math.hypot(v[0],v[1],v[2])||1;return v.map(c=>c/m)};
const vec=(t,p)=>[Math.cos(p*D)*Math.sin(t*D),Math.cos(p*D)*Math.cos(t*D),Math.sin(p*D)];
const pole=(s,d)=>vec(mod(s+270),90-d);
const dn=v=>v[2]<0?v.map(c=>-c):v;
const tp=v=>{v=dn(v);return{t:mod(Math.atan2(v[0],v[1])/D),p:Math.asin(Math.max(-1,Math.min(1,v[2])))/D}};
const cmp=a=>['N','NE','E','SE','S','SW','W','NW'][Math.round(mod(a)/45)%8];
const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b))))/D;
const aax=(a,b)=>{const x=ang(a,b);return Math.min(x,180-x)};
const fl=v=>{const q=tp(v);return pad(q.t)+'/'+f0(q.p)};
const fp=w=>{const q=tp(w);return pad(q.t+90)+'/'+f0(90-q.p)+' '+cmp(q.t+180)};
const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
const sdv=a=>Math.sqrt(avg(a.map(x=>(x-avg(a))**2)));
const med=a=>{const b=[...a].sort((x,y)=>x-y),h=b.length>>1;return b.length%2?b[h]:(b[h-1]+b[h])/2};
const fin=k=>isFinite(k)?k.toFixed(1):'∞';
const esc=s=>String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
const mv=(A,v)=>A.map(r=>dot(r,v));
const mmul=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
function rax(t,p,w){
  const a=vec(t,p),x=a[0],y=a[1],z=-a[2],c=Math.cos(w*D),s=Math.sin(w*D),k=1-c,f=[1,1,-1];
  const R=[[c+x*x*k,x*y*k-z*s,x*z*k+y*s],[y*x*k+z*s,c+y*y*k,y*z*k-x*s],[z*x*k-y*s,z*y*k+x*s,c+z*z*k]];
  return R.map((r,i)=>r.map((e,j)=>e*f[i]*f[j]));
}
function eig(vs){
  const n=vs.length,T=[[0,0,0],[0,0,0],[0,0,0]];
  vs.forEach(v=>{for(let i=0;i<3;i++)for(let j=0;j<3;j++)T[i][j]+=v[i]*v[j]/n});
  const pw=(A,u)=>{for(let k=0;k<200;k++){const w=A.map(r=>dot(r,u)),m=Math.hypot(w[0],w[1],w[2])||1;u=w.map(c=>c/m)}return[dot(A.map(r=>dot(r,u)),u),u]};
  const r1=pw(T,[.57,.58,.59]),l1=r1[0],u1=r1[1];
  const T2=T.map((r,i)=>r.map((x,j)=>x-l1*u1[i]*u1[j]));
  let s=[.3,-.8,.5];const d=dot(s,u1);s=s.map((c,i)=>c-d*u1[i]);
  const r2=pw(T2,s),l2=r2[0],u2=r2[1];
  return{S:[Math.max(l1,1e-6),Math.max(l2,1e-6),Math.max(1-l1-l2,1e-6)],u:[u1,u2,cross(u1,u2)]};
}
const al=(vs,u)=>vs.map(v=>dot(v,u)<0?v.map(c=>-c):v);

// ---------- per-set statistics ----------
function st(nm){
  const P=data.filter(d=>d.s===nm&&d.k==='p'),L=data.filter(d=>d.s===nm&&d.k==='l'),o={nm,P,L,n:P.length,nl:L.length};
  if(o.n){
    const V=o.V=P.map(d=>pole(d.a,d.b)),E=o.E=eig(V),n=o.n,S=o.S=E.S;
    o.u=dn(E.u[0]);o.ds=P.map(d=>d.b);o.mean=avg(o.ds);o.sd=sdv(o.ds);o.med=med(o.ds);o.mn=Math.min.apply(null,o.ds);o.mx=Math.max.apply(null,o.ds);
    const k1=Math.log(S[0]/S[1]),k2=Math.log(S[1]/S[2]),str=Math.log(S[0]/S[2]);
    o.type=n<3?'few':S[0]>.88?'cluster':str<1?'scatter':(k1/(k2||1e-6)>1?'cluster':'girdle');
    o.angs=V.map(v=>aax(v,o.u));o.dev=avg(o.angs);
    const sm=[0,0,0];al(V,o.u).forEach(v=>v.forEach((c,i)=>sm[i]+=c));o.R=Math.hypot(sm[0],sm[1],sm[2]);
    o.k=n>1&&o.R<n-1e-6?(n-1)/(n-o.R):Infinity;
    o.a95=n>2&&o.R>0&&isFinite(o.k)?Math.acos(Math.max(-1,1-(n-o.R)/o.R*(Math.pow(20,1/(n-1))-1)))/D:NaN;
    o.pl=fp(o.u);
  }
  if(o.nl){o.LV=L.map(d=>vec(d.a,d.b));o.lu=dn(eig(o.LV).u[0]);o.ldev=avg(o.LV.map(v=>aax(v,o.lu)))}
  return o;
}
function fg(o){
  if(o.type!=='girdle')return null;
  const u2=o.E.u[1],A=[],B=[],r={axis:dn(o.E.u[2])};r.at=tp(r.axis);
  o.V.forEach((v,i)=>{const w=dot(v,o.u)<0?v.map(c=>-c):v;(dot(w,u2)>=0?A:B).push({w,b:o.ds[i]})});
  const sm=g=>nrm(g.reduce((s,q)=>s.map((c,k)=>c+q.w[k]),[0,0,0]));
  if(A.length&&B.length){const a=sm(A),b=sm(B);r.il=180-ang(a,b);r.dA=avg(A.map(q=>q.b));r.dB=avg(B.map(q=>q.b));r.axn=nrm(a.map((c,k)=>c-b[k]))}
  return r;
}
const plE=p=>p<10?'horizontal':p<30?'gently plunging':p<60?'moderately plunging':p<80?'steeply plunging':'vertical';
const tight=a=>a>120?'gentle':a>70?'open':a>30?'close':a>10?'tight':'isoclinal';
const axc=d=>d>80?'upright':d>60?'steeply inclined':d>30?'moderately inclined':d>10?'gently inclined':'recumbent';
const R=(title,x,s,m,e,extra)=>Object.assign({title,x,s:s||x,m:m||s||x,e:e||[]},extra||{});
const NONE=(nm,what)=>R('No data',`Set “${nm}” has no ${what||'plane'} measurements for this question. Add some (or tap Load sample) and ask again.`);

// ---------- restore matrices ----------
function restore(o){
  const out=[];
  if(o.n){
    const q=tp(o.u),s=mod(q.t+90),d=90-q.p;
    const pick=(t,p,w,f,best)=>{const a=rax(t,p,w),b=rax(t,p,-w);return f(mv(a,best))>=f(mv(b,best))?a:b};
    out.push({l:'Level the mean bedding (tilt correction)',R:pick(s,0,d,v=>tp(v).p,o.u)});
    const g=fg(o);
    if(g)out.push({l:'Make the fold axis horizontal',R:pick(mod(g.at.t+90),0,g.at.p,v=>-tp(v).p,g.axis)});
  }
  return out;
}

// ---------- topics ----------
const T={};
T.summary=o=>{
  if(!o.n&&!o.nl)return NONE(o.nm,'');
  if(!o.n)return R('Overview of set '+o.nm,`${o.nl} lines, mean ${fl(o.lu)}.`);
  const g=fg(o),L=o.nl?`${o.nl} lines, mean ${fl(o.lu)}`:'';
  const pat=o.type==='girdle'?'folded (poles along a band)':o.type==='cluster'?'tilted but not folded (poles in one clump)':o.type==='scatter'?'irregular (poles scattered)':'too few readings to classify';
  const dips=`dips ${f0(o.mn)}–${f0(o.mx)}° (mean ${f0(o.mean)}°)`;
  const x=`${o.n} planes; fabric ${pat}; S1/S2/S3 ${o.S.map(v=>v.toFixed(2)).join('/')}. `+(g?`β-axis ${fl(g.axis)}${g.il!=null?`, interlimb ${f0(g.il)}° (${tight(g.il)})`:''}; `:`mean S0 ${o.pl}, κ≈${fin(o.k)}; `)+dips+(L?`; ${L}.`:'.');
  const s=`${o.n} planes form a pattern that is ${pat}. `+(g?`The fold axis is ${plE(g.at.p)} (${fl(g.axis)}). `:`The average layer is ${o.pl}. `)+`Your ${dips}.`+(L?` Also ${L}.`:'');
  const m=`Your ${o.n} readings suggest the rock layer is ${pat}. `+(o.mean<30?'The layers are fairly flat.':o.mean>60?'The layers are steep.':'The layers are moderately tilted.')+' Ask about folds, dips, sets, stress or uncertainty for more detail.';
  return R('Overview of set '+o.nm,x,s,m,[`${o.n} planes${o.nl?`, ${o.nl} lines`:''}`,`Pattern: ${pat}`]);
};
T.mean=o=>{
  if(!o.n&&!o.nl)return NONE(o.nm,'');
  const e=[];let x='',s='',m='';
  if(o.n){
    const gi=o.type==='girdle';
    x=`Mean S0 (principal pole) ${o.pl}${gi?' (girdle: not representative, use the β-axis)':''}. Fisher κ≈${fin(o.k)}${isNaN(o.a95)?'':`, α95≈${f0(o.a95)}°`}; mean angular deviation ${f0(o.dev)}°; R=${o.R.toFixed(2)} of ${o.n}.`;
    s=`The average layer is ${o.pl} (strike/dip, dip direction)${gi?', but the layer is folded so one average is not typical':''}. Readings spread about ${f0(o.dev)}° around it (concentration κ≈${fin(o.k)}; higher means tighter).`;
    m=`On average the layer runs ${o.pl.split(' ')[0].split('/')[0]}° (strike) and tilts ${f0(90-tp(o.u).p)}° towards ${cmp(tp(o.u).t+180)}. Your readings are ${o.dev<10?'very consistent':o.dev<20?'fairly consistent':'quite variable'}.`;
    e.push(`Mean orientation ${o.pl}`,`Spread ${f0(o.dev)}°`);
  }
  if(o.nl){const l=` Mean line ${fl(o.lu)} (trend/plunge), spread ${f0(o.ldev)}°.`;x+=l;s+=l;m+=l;e.push(`Mean line ${fl(o.lu)}`)}
  return R('Mean orientation of set '+o.nm,x,s,m,e);
};
T.fold=o=>{
  if(!o.n)return NONE(o.nm);
  const g=fg(o);
  if(!g){
    const x=o.type==='cluster'?`No girdle (S1=${o.S[0].toFixed(2)}): no evidence of folding. S0 is a homocline ${o.pl}.`:o.type==='scatter'?'Fabric is dispersed: neither a point maximum nor a girdle. Fold geometry is indeterminate; split the data by outcrop and retry.':'Need at least 3 plane readings to test for folding.';
    return R('Fold geometry',x,x.replace('homocline','uniformly tilted layer'),o.type==='cluster'?'There is no fold here: the layer is just tilted the same way everywhere.':x,[`Pattern: ${o.type}`]);
  }
  const lim=g.il!=null?`${f0(g.dA)}° and ${f0(g.dB)}°`:'',asym=g.il!=null&&Math.abs(g.dA-g.dB)>10;
  const ac=g.axn?`${fp(g.axn)} (${axc(90-tp(g.axn).p)})`:'';
  const x=`β-axis ${fl(g.axis)} (${plE(g.at.p)}); π-girdle plane ${fp(g.axis)}. `+(g.il!=null?`Interlimb ${f0(g.il)}° (${tight(g.il)}); mean limb dips ${lim} (${asym?'asymmetric':'symmetric'}). Axial plane ≈ ${ac}, so ${axc(90-tp(g.axn).p)} ${plE(g.at.p)} fold. `:'Only one limb sampled: interlimb angle and axial plane are unconstrained. ')+`S3=${o.S[2].toFixed(2)} supports cylindrical geometry.`;
  const s=`The poles lie on a band, so the layer is folded about an axis trending/plunging ${fl(g.axis)} (${plE(g.at.p)}). `+(g.il!=null?`The limbs open at about ${f0(g.il)}° (${tight(g.il)} fold) and dip ${lim}. The axial plane (the plane splitting the fold in half) is about ${ac}. `:'')+'Anticline or syncline needs rock ages.';
  const m=`The layer is bent into a fold. The fold line runs towards ${cmp(g.at.t)} and ${g.at.p<10?'is almost level':'tilts down '+f0(g.at.p)+'°'}. `+(g.il!=null?`It is a ${tight(g.il)} fold (the sides open ${f0(g.il)}°) and ${asym?'one side is steeper than the other':'both sides are about equally steep'}.`:'');
  return R('Fold geometry',x,s,m,[`Axis ${fl(g.axis)}`,g.il!=null?`Interlimb ${f0(g.il)}°`:'One limb only',g.axn?`Axial plane ${ac}`:'']);
};
T.profile=o=>{
  if(!o.n)return NONE(o.nm);
  const useX=o.P.every(d=>isFinite(d.x)),n=o.n;
  const q=o.P.map((d,i)=>({x:useX?d.x:i+1,b:d.b,dd:mod(d.a+90),n:data.indexOf(d)+1})).sort((a,b)=>a.x-b.x);
  const jm=q.slice(1).map((r,i)=>({j:Math.abs(r.b-q[i].b),a:q[i].n,b:r.n})),mx=jm.reduce((m,j)=>j.j>m.j?j:m,{j:0,a:0,b:0}),md=jm.length?med(jm.map(j=>j.j)):0;
  const cs=avg(q.map(r=>Math.cos(r.dd*D))),sn=avg(q.map(r=>Math.sin(r.dd*D))),mdir=mod(Math.atan2(sn,cs)/D);
  const opp=q.filter(r=>Math.abs(((r.dd-mdir+540)%360)-180)>90).length,rev=o.mean>=8&&Math.min(opp,n-opp)/n>=.15;
  const jump=mx.j>=25&&mx.j>3*Math.max(md,3),mxs=avg(q.map(r=>r.x)),sxx=q.reduce((s,r)=>s+(r.x-mxs)**2,0),syy=q.reduce((s,r)=>s+(r.b-o.mean)**2,0),sxy=q.reduce((s,r)=>s+(r.x-mxs)*(r.b-o.mean),0);
  const r2=sxx&&syy?sxy*sxy/(sxx*syy):0,ch=sxx?sxy/sxx*(q[n-1].x-q[0].x):0,tr=!jump&&Math.abs(ch)>=10&&r2>=.5;
  const why=[];
  if(rev)why.push(['reversal of dip direction: the traverse crosses a fold hinge','some beds dip the opposite way, so you crossed a fold hinge','the layers tilt one way, then the other way: you crossed the top or bottom of a fold']);
  if(jump)why.push([`Δdip of ${f0(mx.j)}° between #${mx.a} and #${mx.b} (median neighbour ${f0(md)}°): a discontinuity, fault offset or kink hinge`,`a sudden ${f0(mx.j)}° jump between #${mx.a} and #${mx.b}: likely a fault or sharp hinge`,`the tilt suddenly jumps ${f0(mx.j)}° between #${mx.a} and #${mx.b}, like a step: probably a fault or a sharp bend`]);
  if(tr)why.push([`monotonic dip change (${ch>0?'+':'−'}${f0(Math.abs(ch))}°, R²=${r2.toFixed(2)}): curved limb or plunging fold`,`dips ${ch>0?'rise':'fall'} steadily by ${f0(Math.abs(ch))}°: a gentle curve or plunging fold`,`the tilt ${ch>0?'grows':'shrinks'} smoothly: the layer is gently curved`]);
  if(!why.length)why.push(o.sd<8?['σ within measurement error plus surface roughness: planar S0','dips are very consistent: nearly planar layer','the tilt is almost the same everywhere, so small differences are just bumps or reading error']:['unsystematic scatter: small folds, bedding irregularity or error','dips vary with no clear pattern: small folds, uneven surface or reading error','the tilt wobbles without a pattern: small bends or measuring error']);
  return R('Why dips change along the traverse',`Dip σ=${f0(o.sd)}°, range ${f0(o.mn)}–${f0(o.mx)}°; `+why.map(w=>w[0]).join('; ')+'.',why.map(w=>w[1]).join('; ')+'.',why.map(w=>w[2]).join('; ')+'.',[`Largest jump ${f0(mx.j)}°`,`${opp} of ${n} dip the opposite way`]);
};
T.dipstats=o=>{
  if(!o.n)return NONE(o.nm);
  const lo=o.ds.filter(d=>d<30).length,mi=o.ds.filter(d=>d>=30&&d<=60).length,hi=o.ds.filter(d=>d>60).length,pc=c=>f0(100*c/o.n);
  const bins=Array(18).fill(0);o.P.forEach(d=>bins[Math.floor(mod(d.a)%180/10)]++);
  const bm=Math.max.apply(null,bins),bi=bins.indexOf(bm),dom=`${pad(bi*10)}–${pad(bi*10+10)}°`;
  let svg=`<svg viewBox='0 0 160 160' width='160' role='img' aria-label='Strike rose diagram' style='font:10px system-ui;display:block;margin:6px auto'><circle cx='80' cy='80' r='62' fill='none' stroke='currentColor' opacity='.25'/><text x='80' y='11' text-anchor='middle' fill='currentColor'>N</text>`;
  bins.forEach((c,i)=>{if(!c)return;[0,180].forEach(off=>{const a1=(i*10+off)*D,a2=(i*10+10+off)*D,r=62*c/bm,p=(a,rr)=>(80+rr*Math.sin(a)).toFixed(1)+','+(80-rr*Math.cos(a)).toFixed(1);svg+=`<polygon points='80,80 ${p(a1,r)} ${p(a2,r)}' style='fill:var(--acc)' opacity='.8'/>`})});
  svg+='</svg><div class="mute" style="text-align:center">Strike rose (longest petal = most common strike)</div>';
  const sig=lo>=hi&&lo>=mi?'low':hi>=mi?'high':'moderate';
  const tec={low:['shallow dips: weak or distal deformation, broad warping, fold crest/hinge zones or a stable foreland','gentle tilting: weak or distant deformation, a broad fold flank or crest','the rocks are only gently tilted, so they were not squeezed much'],high:['steep dips: high finite rotation, strong shortening, tight/isoclinal folds or proximity to thrusts/faults','steep tilting: strong compression, tight folds or closeness to a fault','the rocks are steeply tilted, so they were squeezed hard'],moderate:['intermediate dips: appreciable tilting from shortening or uplift','clear tilting from compression or uplift, short of extreme','the rocks are noticeably tilted but not extremely']}[sig];
  return R('Dip and strike statistics',`n=${o.n}; dip mean ${f0(o.mean)}°, median ${f0(o.med)}°, σ ${f0(o.sd)}°; <30°: ${pc(lo)}%, 30–60°: ${pc(mi)}%, >60°: ${pc(hi)}%. Dominant strike ${dom}. Mostly ${tec[0]}.`,`Dips average ${f0(o.mean)}° (${pc(lo)}% gentle, ${pc(mi)}% moderate, ${pc(hi)}% steep). Most common strike ${dom}. Mostly ${tec[1]}.`,`Most dips are ${sig}. The most common strike is ${dom}. In simple terms: ${tec[2]}.`,[`Low/moderate/steep: ${lo}/${mi}/${hi}`],{html:svg});
};
T.compare=(o,o2)=>{
  if(!o.n)return NONE(o.nm);
  if(!o2||!o2.n||o2.nm===o.nm)return R('Compare two sets','Choose a different second set (“Set B”) that has plane measurements, then ask again.');
  let n1=o.u,n2=o2.u;if(dot(n1,n2)<0)n2=n2.map(c=>-c);
  const dih=ang(n1,n2),dd=Math.abs(o.mean-o2.mean);
  if(dih<3)return R('Compare sets '+o.nm+' and '+o2.nm,`Mean S0 ${o.pl} vs ${o2.pl}: dihedral ${dih.toFixed(1)}°, i.e. the same orientation within error. Same surface or same set.`,'The two sets have practically the same orientation, so they are probably the same set or surface.',null,[`Angle ${dih.toFixed(1)}°`]);
  const I=nrm(cross(n1,n2)),s1=nrm(cross(I,n1.map((c,k)=>c+n2[k]))),s3=nrm(cross(I,n1.map((c,k)=>c-n2[k])));
  const x=`Mean S0: ${o.nm} ${o.pl}; ${o2.nm} ${o2.pl}. Dihedral angle ${f0(dih)}°, Δdip ${f0(dd)}°. Intersection (β) ${fl(I)}. If bedding either side of a surface: ${f0(dih)}° tilt contrast = angular unconformity (or intervening fold/fault). If conjugate shear/fracture sets: σ1 (acute bisector) ${fl(s1)}, σ2 (intersection) ${fl(I)}, σ3 ${fl(s3)}.`;
  const s=`The two sets differ by ${f0(dih)}° (dips differ by ${f0(dd)}°) and cross along ${fl(I)}. If they are layers above and below a surface, that angle suggests an angular unconformity. If they are fractures or faults, they may be a conjugate pair: the squeeze direction is about ${fl(s1)}, and the intersection ${fl(I)} is the middle stress axis.`;
  const m=`The two sets are tilted differently: ${f0(dih)}° apart. If they are rock layers, an old tilted layer was eroded and new layers were laid on top (an angular unconformity). If they are cracks, they may be a matching pair formed by squeezing from about ${cmp(tp(s1).t)}.`;
  return R('Compare sets '+o.nm+' and '+o2.nm,x,s,m,[`Dihedral ${f0(dih)}°`,`Intersection ${fl(I)}`,`Bisector σ1 ${fl(s1)}`]);
};
T.apparent=(o,o2,num)=>{
  if(!o.n)return NONE(o.nm);
  if(!isFinite(num))return R('Apparent dip','Type a direction in the “direction°” box, or in your question (e.g. “apparent dip towards 120”).');
  const q=tp(o.u),s=mod(q.t+90),d=90-q.p,a=Math.atan(Math.tan(d*D)*Math.sin((num-s)*D))/D,tr=a>=0?mod(num):mod(num+180);
  const x=`Mean plane ${o.pl}. tan(apparent)=tan(true)·sin(β), β=angle between strike and section line. In direction ${pad(num)}°: apparent dip ${f0(Math.abs(a))}° towards ${pad(tr)}° (${cmp(tr)}). True dip ${f0(d)}° towards ${cmp(s+90)}.`;
  return R('Apparent dip',x,`The layer is ${o.pl}. Cutting it along ${pad(num)}° you see a dip of ${f0(Math.abs(a))}° towards ${pad(tr)}°. The true dip (${f0(d)}°) is only seen at right angles to strike; any other direction shows a smaller apparent dip.`,`Along ${pad(num)}° the layer looks like it tilts ${f0(Math.abs(a))}° (towards ${cmp(tr)}). It really tilts ${f0(d)}°, but only when you look straight across the layer.`,[`Apparent ${f0(Math.abs(a))}°`,`True ${f0(d)}°`]);
};
T.lineation=(o,o2)=>{
  if(!o.nl)return R('Lineations','This set has no lines. Add some (type “Line: trend / plunge”) and ask again.');
  const pl=o2&&o2.nm!==o.nm&&o2.n?o2:(o.n?o:null),b=`${o.nl} lines, mean ${fl(o.lu)}, spread ${f0(o.ldev)}°.`;
  if(!pl)return R('Lineations',b,b,b+' Lines are directions in space (for example slickensides, stretching or fold-axis directions).');
  const n=pl.u,inp=Math.asin(Math.min(1,Math.abs(dot(o.lu,n))))/D,sdir=vec(tp(n).t+90,0),pitch=Math.acos(Math.min(1,Math.abs(dot(nrm(o.lu),sdir))))/D;
  const g=fg(pl),pa=g?aax(o.lu,g.axis):null;
  const kin=pitch>70?'down-dip (dip-slip / transport up or down the plane)':pitch<20?'along strike (strike-slip)':'oblique';
  const inT=inp<10,rel=pa==null?'':pa<15?'parallel to the fold axis (hinge or intersection lineation)':pa>75?'perpendicular to the fold axis (stretching/transport lineation)':'oblique to the fold axis';
  const fo=pl.type==='girdle';
  const x=`${b}${fo?' The planes are folded, so there is no single plane to compare with.':` Angle to mean plane ${pl.pl}: ${f0(inp)}° (${inT?`lies in the plane, pitch ${f0(pitch)}° from strike: ${kin}`:'does not lie in the plane'}).`}${rel?` Relative to the β-axis ${fl(g.axis)}: ${rel}.`:''}`;
  const m=`${b} ${fo?'':inT?`The lines sit on the layer and run ${kin}. That shows the direction rocks moved along it (like scratches on a fault).`:'The lines do not lie on the layer, so they are probably fold or crossing-layer lines instead of scratches.'}${rel?` They are ${rel}.`:''}`;
  return R('Lineations',x,x,m,[`Line-to-plane angle ${f0(inp)}°`,`Pitch ${f0(pitch)}°`]);
};
T.stress=o=>{
  if(!o.n)return NONE(o.nm);
  const g=fg(o);
  if(g){const t=mod(g.at.t+90),ax=`${cmp(t)}–${cmp(t+180)}`;
    return R('Shortening / stress direction',`Fold β-axis ${fl(g.axis)}: shortening (σ1) is perpendicular to it, horizontal trend ≈ ${pad(t)}°/${pad(t+180)}° (${ax}), with σ2 along the axis. Exact only for upright, cylindrical, non-refolded folds.`,`Folds form when rocks are squeezed at right angles to the fold axis. Axis ${fl(g.axis)}, so the squeeze was about ${ax}.`,`The rocks were pushed together from about ${ax} (across the fold line, which runs ${cmp(g.at.t)}).`,[`Shortening ${ax}`]);}
  const dd=tp(o.u).t+180;
  return R('Shortening / stress direction',`No folding. The tilt (${o.pl}) records rotation towards ${pad(dd)}° and does not give principal stresses on its own; combine with fold or conjugate-fracture data (Compare sets).`,`The layers just tilt towards ${cmp(dd)} (${o.pl}). Tilt alone does not give the stress direction; use folds or crossing fractures for that.`,`The rocks were tipped towards ${cmp(dd)}. We cannot say the squeeze direction from this alone.`,[`Tilt direction ${cmp(dd)}`]);
};
T.quality=o=>{
  if(!o.n)return NONE(o.nm);
  const out=o.type==='cluster'&&o.n>=5?o.angs.map((a,i)=>({a,n:data.indexOf(o.P[i])+1})).filter(q=>q.a>o.dev+2*sdv(o.angs)&&q.a>10):[];
  const rate=o.n<10?'small (aim for 25+ for stable statistics)':o.n<25?'moderate':'good';
  const x=`n=${o.n} (${rate}). ${o.type==='girdle'?`Girdle: Fisher statistics do not apply; mean distance of poles from the girdle plane is ${f0(avg(o.V.map(v=>Math.asin(Math.min(1,Math.abs(dot(v,o.E.u[2]))))/D)))}°.`:`κ≈${fin(o.k)}${isNaN(o.a95)?'':`, α95≈${f0(o.a95)}° (95% cone for the mean)`}.`} Outliers (>2σ from mean): ${out.length?out.map(q=>'#'+q.n).join(', '):'none'}. Hand readings are good to ±2–5°.`;
  const m=`You have ${o.n} readings, which is ${rate}. ${out.length?`Readings ${out.map(q=>'#'+q.n).join(', ')} look odd; double-check them.`:'No readings look wildly off.'} Hand-reading a net is accurate to about ±2–5°.`;
  return R('Data quality and uncertainty',x,x,m,[`n=${o.n}`,`Outliers: ${out.length}`]);
};
T.sets=o=>{
  if(!o.n)return NONE(o.nm);
  let rem=o.V.map((v,i)=>({v,i})),out=[];
  while(rem.length>=2&&out.length<6){
    let best=null,bc=0;rem.forEach(a=>{const c=rem.filter(b=>aax(a.v,b.v)<=20).length;if(c>bc){bc=c;best=a}});
    if(bc<2)break;
    let mean=best.v,mem=rem.filter(b=>aax(best.v,b.v)<=25);
    for(let k=0;k<3;k++){mean=nrm(al(mem.map(b=>b.v),mean).reduce((s,v)=>s.map((c,j)=>c+v[j]),[0,0,0]));mem=rem.filter(b=>aax(mean,b.v)<=25)}
    out.push({n:mem.length,u:dn(mean)});rem=rem.filter(b=>mem.indexOf(b)<0);
  }
  if(!out.length)return R('How many sets?','No clusters found: orientations are too dispersed or too few.');
  const L=out.map((c,i)=>`Set ${i+1}: ${c.n} readings (${f0(100*c.n/o.n)}%), ${fp(c.u)}`);
  const x=`Clustering (25° cones) found ${out.length} set${out.length>1?'s':''}: ${L.join('; ')}${rem.length?`; ${rem.length} unassigned`:''}.`;
  return R('How many sets?',x,x,`There ${out.length>1?'are':'is'} ${out.length} main direction${out.length>1?'s':''} of ${out.length>1?'layers or cracks':'layers or cracks'}: ${L.join('; ')}. Tip: tick “Contour” on the net to see the same clumps.`,L);
};
T.restore=o=>{
  if(!o.n)return NONE(o.nm);
  const acts=restore(o);
  const x=`Rotations are applied to the 3D view (undo or reset any time). Tilt correction rotates about the mean strike by the mean dip so S0 becomes horizontal (pole plunge 90°). ${fg(o)?'Plunge removal rotates about the horizontal axis perpendicular to the β-axis so the axis becomes horizontal.':''} Use them to restore paleo-orientations of lineations or paleocurrents.`;
  return R('Restore to horizontal',x,x,'These buttons tip your data back to how it was before folding or tilting: flat layers, or a level fold line. Tap a button, then look at the net. Use “Reset view” to go back.',[],{acts});
};
const TOPICS=[['summary','Overview of my data'],['fold','Fold geometry (axis, limbs, axial plane)'],['mean','Mean orientation and spread'],['profile','Why do dips change along the traverse?'],['dipstats','Dip and strike statistics (rose, low/high dips)'],['compare','Compare two sets (angle, intersection, conjugate)'],['apparent','Apparent dip in a given direction'],['lineation','Lineations (rake, relation to folds)'],['stress','Shortening / stress direction'],['quality','Data quality and uncertainty'],['sets','How many joint / fracture sets?'],['restore','Restore to horizontal (rotate the net)']];
const KW=[['restore',/restor|tilt corr|level|flatten|unfold|rotate|rotat|original|pre-?tilt|paleo|palaeo/],['apparent',/apparent|cross.?section|true dip/],['lineation',/lineation|slicken|striation|rake|pitch|stretching|\blines?\b/],['sets',/how many|joint|fractur|cluster|population|famil/],['compare',/compar|between|intersect|conjugate|unconformit|angular|differ|versus|\bvs\b|bisect/],['stress',/stress|shorten|compress|tecton|regional|sigma|σ|vergen|transport|force|squeez/],['quality',/reliab|quality|error|uncertain|outlier|confiden|accura|fisher|alpha|α95|sample size/],['fold',/fold|axis|axes|limb|hinge|anticlin|synclin|interlimb|axial|girdle|beta|β|plunge/],['profile',/jump|fault|offset|discontin|along|traverse|change|vary|variation|reversal|strike length/],['dipstats',/histogram|steep|gentle|low dip|high dip|rose|distribution|range|statist/],['mean',/mean|average|dominant|preferred|attitude|orientation|concentrat|disper|spread|vector/],['summary',/[\s\S]*/]];
function answer(topic,nmA,nmB,num){return T[topic](st(nmA),nmB?st(nmB):null,num)}
if(typeof window!=='undefined')window.__st={answer:answer,st:st,restore:restore,topics:TOPICS};
if(typeof document==='undefined'||!document.getElementById('interp'))return;

// ---------- interface ----------
const $=id=>document.getElementById(id);
let acts=[],lastTxt='';
function names(){return Array.from(new Set(data.map(d=>d.s)))}
function refresh(){
  const nm=names(),sa=$('tSet'),sb=$('tSet2'),va=sa.value,vb=sb.value;
  sa.innerHTML=nm.map(n=>`<option>${esc(n)}</option>`).join('');
  sb.innerHTML='<option value="">Set B: none</option>'+nm.map(n=>`<option>${esc(n)}</option>`).join('');
  if(nm.indexOf(va)>=0)sa.value=va;if(nm.indexOf(vb)>=0)sb.value=vb;
}
function render(r){
  const lv=$('tLevel').value,ks=lv==='all'?['x','s','m']:[lv],nmz={x:'Expert technical',s:'Standard technical',m:'Simple (terms explained)'};
  acts=r.acts||[];
  let h=`<div style='margin:10px 0 4px'><b>${esc(r.title)}</b></div>`,txt=r.title+'\n';
  ks.forEach(k=>{h+=`<div style='margin:6px 0'>${ks.length>1?`<div class='mute' style='font-weight:700;color:var(--acc)'>${nmz[k]}</div>`:''}${esc(r[k])}</div>`;txt+=(ks.length>1?nmz[k]+': ':'')+r[k]+'\n'});
  const ev=r.e.filter(Boolean);
  if(ev.length){h+=`<ul class='mute' style='margin:4px 0;padding-left:18px'>${ev.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`;txt+='Evidence: '+ev.join('; ')+'\n'}
  if(r.html)h+=r.html;
  if(acts.length)h+=`<div class='row'>${acts.map((a,i)=>`<button data-act='${i}'>${esc(a.l)}</button>`).join('')}<button class='s' data-act='reset'>Reset view</button></div>`;
  h+=`<div class='row' style='margin-top:6px'><button class='s' data-act='copy'>Show as text to copy</button></div>`;
  lastTxt=txt;$('tOut').innerHTML=h;
}
function run(topic,nmA,nmB,num){
  if(!nmA){$('tOut').innerHTML="<div class='mute'>Add your measurements first (or tap Load sample).</div>";return}
  try{render(answer(topic,nmA,nmB,num))}catch(e){$('tOut').innerHTML="<div class='mute'>Sorry, that question could not be answered for this set.</div>"}
}
const c=document.createElement('div');c.className='card';c.id='toolsCard';
c.innerHTML=`<h2 style="font-size:16px;margin:0 0 4px">Ask about my data</h2>
<div class="mute" style="margin-bottom:8px">Pick a question or type your own, like “what is the fold axis?”, “how many joint sets?” or “apparent dip towards 120”. Answers come at three levels.</div>
<div class="row"><select id="tSet" aria-label="Set"></select><select id="tSet2" aria-label="Second set"></select><select id="tLevel" aria-label="Level"><option value="s">Standard</option><option value="x">Expert</option><option value="m">Simple</option><option value="all">All three</option></select></div>
<div class="row"><select id="tTopic" style="flex:1;min-width:180px">${TOPICS.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('')}</select><input id="tNum" type="number" inputmode="decimal" placeholder="direction°" style="width:96px"><button class="p" id="tGo">Answer</button></div>
<div class="row"><input id="tQ" placeholder="…or type a question" style="flex:1;min-width:180px"><button id="tAsk">Ask</button></div>
<div id="tOut"></div>`;
$('interp').after(c);refresh();
c.addEventListener('pointerdown',refresh,true);
$('tGo').onclick=()=>{refresh();run($('tTopic').value,$('tSet').value,$('tSet2').value,parseFloat($('tNum').value))};
$('tAsk').onclick=()=>{
  refresh();
  const q=$('tQ').value.toLowerCase(),nm=names(),hit=nm.filter(n=>q.indexOf(n.toLowerCase())>=0);
  const topic=(KW.find(k=>k[1].test(q))||KW[KW.length-1])[0],m=q.match(/\d+(\.\d+)?/);
  const a=hit[0]||$('tSet').value,b=hit[1]||$('tSet2').value||(topic==='compare'?nm.filter(n=>n!==a)[0]:'');
  $('tTopic').value=topic;run(topic,a,b,m?parseFloat(m[0]):parseFloat($('tNum').value));
};
$('tQ').addEventListener('keydown',e=>{if(e.key==='Enter')$('tAsk').click()});
$('tOut').onclick=e=>{
  const a=e.target.dataset&&e.target.dataset.act;if(a===undefined)return;
  if(a==='copy'){overlay("<div class='mute' style='margin-bottom:6px'>Select all and copy.</div><textarea id='ttxt' readonly style='min-height:200px'></textarea>",()=>{const t=$('ttxt');t.value=lastTxt;t.focus();t.select()});return}
  if(a==='reset'){rot=0;M=[[1,0,0],[0,1,0],[0,0,1]];hist=[];draw();return}
  setMode('tum');pushHist();M=mmul(acts[+a].R,M);draw();
};
})();