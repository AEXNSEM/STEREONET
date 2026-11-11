/* Stereonet by Nsem: Geology Q&A + structural interpreter. Load AFTER solver.js. */
(function(){
'use strict';
const D=Math.PI/180,mod=a=>((a%360)+360)%360,pad=n=>String(Math.round(mod(n))%360).padStart(3,'0'),f0=Math.round,f1=x=>(+x).toFixed(1);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],mag=v=>Math.hypot(v[0],v[1],v[2]);
const cl=x=>Math.max(-1,Math.min(1,x));
const vec=(t,p)=>[Math.cos(p*D)*Math.sin(t*D),Math.cos(p*D)*Math.cos(t*D),Math.sin(p*D)];
const tp=v=>{if(v[2]<0)v=v.map(c=>-c);const m=mag(v)||1;return{t:mod(Math.atan2(v[0],v[1])/D),p:Math.asin(cl(v[2]/m))/D}};
const cmp=a=>['N','NE','E','SE','S','SW','W','NW'][Math.round(mod(a)/45)%8];
const esc=s=>String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
const planeFrom=n=>{const q=tp(n),s=mod(q.t+90);return{s,d:90-q.p,dd:mod(s+90)}};

// ---------- knowledge bank: [category, title, keywords, answer, offerDataButton] ----------
const KB=[
['Stereonet & data','Advantages of plotting poles instead of planes',['advantages of plotting','advantage of plotting','plotting in pole','plotting poles','plot poles','plot the poles','advantages of pole','advantage of pole','benefits of plotting pole','why plot pole','why poles'],
`Advantages of plotting poles (points) instead of great circles (arcs):
• Each plane becomes a single point, so tens or hundreds of measurements stay readable. Great circles overlap and clutter quickly.
• Points can be counted and contoured, so clusters (sets) and girdles (folds) show up objectively.
• Patterns are easy to read: a tight cluster means uniformly dipping beds; a girdle means folding, and the pole to the girdle gives the fold axis (π-axis).
• Statistics are possible: mean orientation, Fisher κ and the α95 confidence cone.
• It is faster and less error-prone to plot by hand or by software, and datasets are easy to compare.
• Gentle dips plot near the centre and steep dips near the edge, so the dip range is visible at a glance.
Limitation: poles do not show the dip direction or the intersection of two planes as directly as great circles do, so use great circles for constructions.`],
['Stereonet & data','What is a stereonet?',['what is a stereonet','what is stereonet','stereographic projection','stereonet used for','use of stereonet','uses of stereonet','purpose of stereonet','lower hemisphere','what does a stereonet','importance of stereonet'],
`A stereonet is a circular graph that shows 3-D orientations (planes and lines) on a flat disc. Imagine a sphere around the rock. A plane cuts the sphere as a great circle and a line pierces it as a point. The lower half of the sphere is projected onto the disc: the outer circle (primitive) is horizontal and the centre is vertical.
It is used to find intersections, angles between structures, fold axes, mean orientations, rake and apparent dip, slope stability and sampling bias.
Equal-area (Schmidt) nets keep areas true and are used for counting and contouring. Equal-angle (Wulff) nets keep angles true and suit constructions.`],
['Stereonet & data','What is a pole to a plane? (plane to pole conversion)',['what is a pole','pole to a plane','pole of a plane','define pole','meaning of pole','poles to planes','how to convert plane to pole','convert plane to pole','convert planes into pole','convert the planes','plane to pole'],
`The pole is the line perpendicular (normal) to the plane, plotted where it pierces the lower hemisphere.
Conversion: pole trend = dip direction + 180° (or − 180°), pole plunge = 90° − dip. Strike = pole trend + 90°.
Example: 315°, 60° SW has dip direction 225°, so its pole is trend 045°, plunge 30°.
On the net, the pole lies on the diameter through the dip direction, on the opposite side of the centre from the dip direction. Gentle dips give poles near the centre; steep dips give poles near the edge.`],
['Stereonet & data','Great circles and small circles',['great circle','small circle','cyclographic','trace of a plane','arc on the net'],
`A plane plots as a great circle: the arc where the plane, passing through the centre of the reference sphere, cuts the sphere. A gently dipping plane gives an arc near the edge; a steep plane gives an arc near the centre; a vertical plane is a straight diameter.
A small circle is the trace of a cone that does not pass through the centre. Small circles are used for cones of rotation, friction cones in slope stability, and angular distances around a point.`],
['Stereonet & data','Contouring pole density',['contour','contouring','pole density','kamb','counting net','density contour','maxima','pole concentration'],
`Contouring turns many poles into a density map. A small counting circle (about 1% of the net area) is moved over the net and the number of poles inside is converted to a percentage. Contour lines join equal density.
Maxima mark preferred orientations, such as bedding or joint sets. Contouring needs an equal-area net so that counts are not biased by position. Kamb contouring also shows only statistically significant concentrations.`],
['Stereonet & data','π-diagram and finding a fold axis',['pi diagram','π diagram','pi-diagram','π-diagram','pi axis','π-axis','pi-axis','beta diagram','β diagram','fold axis from','find the fold axis','determine the fold axis','calculate fold axis','how to find fold axis'],
`π-diagram: plot poles to bedding. If the folds are cylindrical the poles fall along a great circle (a π-girdle). The pole to that best-fit girdle (the π-axis) is the fold axis.
β-diagram: plot the bedding planes as great circles. The great circles of different limbs intersect at one point, the β-axis, which is also the fold axis.
The axial plane contains the fold axis and bisects the angle between the limbs. The angular spread of poles along the girdle gives the interlimb angle: interlimb angle ≈ 180° − the angle between the two limb poles.`,true],
['Stereonet & data','Clusters, girdles and random patterns',['cluster','girdle','random pattern','preferred orientation','fabric','woodcock','eigenvalue','pole pattern'],
`Cluster: one dominant orientation, for example uniformly dipping beds or one joint set.
Girdle: poles spread along a great circle, which means cylindrical folding about an axis that is the pole to the girdle.
Two clusters: two joint sets, or two limbs of a fold (then the poles also define a girdle).
Scatter: no preferred orientation, complex or multiple deformation, or mixed sets.
Woodcock (1977) uses the eigenvalues S1 ≥ S2 ≥ S3 of the poles: C = ln(S1/S2) measures clustering, G = ln(S2/S3) measures girdling, and C/G > 1 means a cluster.`,true],
['Stereonet & data','Rose diagram',['rose diagram','rose plot','strike histogram','circular histogram'],
`A rose diagram is a circular histogram of strike or trend. Each petal shows how many measurements fall in a direction class (10° or 15° bins). Because strike has two ends, the diagram is drawn symmetrically about the centre. It shows dominant fracture or fault directions quickly but has no dip information, so use it together with a stereonet.`],

['Folds','Parts of a fold (hinge, limb, axial plane)',['fold terminology','parts of a fold','hinge','limb','axial plane','axial surface','fold axis','crest line','wavelength','amplitude','enveloping surface','what is a fold','definition of fold','define fold'],
`A fold is a bend in layered rock.
• Hinge: the line of maximum curvature in a folded layer.
• Limbs: the flanks either side of the hinge.
• Axial surface (plane): the surface joining the hinge lines of successive layers; it divides the fold into two limbs.
• Fold axis: the line which, moved parallel to itself, generates the fold. For cylindrical folds it is parallel to the hinge.
• Crest and trough: the highest and lowest points of a layer.
• Wavelength and amplitude: distance between adjacent crests, and half the crest-to-trough height.
• Plunge: the inclination of the fold axis from horizontal.`],
['Folds','Anticline, syncline, dome, basin, monocline',['anticline','syncline','antiform','synform','dome and basin','monocline','homocline','types of fold','kinds of fold','antiformal'],
`Anticline: limbs dip away from the axial plane and the oldest beds are in the core. Antiform is the same shape when the ages are not known.
Syncline: limbs dip toward the axial plane and the youngest beds are in the core. Synform is the same shape when the ages are not known.
Dome: a doubly plunging anticline; beds dip away in all directions and the oldest rocks are in the centre.
Basin: beds dip inward and the youngest rocks are in the centre.
Monocline: a single step-like bend in otherwise flat or gently dipping beds, often above a buried fault.
Homocline: beds all dipping the same way. This is tilting, not folding.`],
['Folds','Fold tightness (interlimb angle)',['interlimb','tight fold','open fold','isoclinal','close fold','gentle fold','fold tightness','tightness of fold','fleuty'],
`Fold tightness is classified by the interlimb angle (Fleuty, 1964):
• Gentle: 180°–120°
• Open: 120°–70°
• Close: 70°–30°
• Tight: 30°–0°
• Isoclinal: 0° (limbs parallel)
Tight and isoclinal folds mean strong shortening and are typical of the cores of orogenic belts. Gentle and open folds mean weak shortening, as in foreland or platform cover.`],
['Folds','Fold orientation: plunge, axial plane, upright, recumbent',['recumbent','overturned fold','upright fold','plunging fold','non-plunging','inclined fold','fold attitude','fold orientation','vergence','plunge of fold','plunge of the fold'],
`Fold axis plunge (Fleuty): horizontal 0°–10°, gently plunging 10°–30°, moderately plunging 30°–60°, steeply plunging 60°–80°, subvertical 80°–90°.
Axial plane dip: recumbent 0°–10°, gently inclined 10°–30°, moderately inclined 30°–60°, steeply inclined 60°–80°, upright 80°–90°.
An overturned fold has one limb rotated past vertical. Vergence is the direction in which the fold appears to lean or has been pushed (the direction of tectonic transport). Describe a fold with: tightness, axial plane attitude, plunge, symmetry and whether it is cylindrical.`],
['Folds','Fold shapes: chevron, box, parallel, similar, symmetry',['chevron','box fold','parallel fold','similar fold','ramsay','fold geometry','symmetrical fold','asymmetrical fold','fold shape','fold style','parasitic fold'],
`Chevron: straight limbs and sharp hinges. Box fold: flat top and two steep limbs. Parallel (concentric): layer thickness measured at right angles stays constant; typical of competent beds and dies out with depth. Similar: the same shape in every layer, thickening in the hinge; typical of ductile rocks with cleavage.
Symmetrical folds have limbs of equal length and dip. Asymmetrical folds have unequal limbs, and the asymmetry shows vergence. S-, Z- and M-shaped small (parasitic) folds show your position on a larger fold.`],
['Folds','How and why folds form',['how do folds form','cause of folding','cause of fold','causes of folding','folding mechanism','why do rocks fold','fold formation','buckling','flexural slip','folds form','origin of fold','forms folds'],
`Folds form when rock layers shorten or bend:
• Compression and buckling: layers shortened parallel to bedding buckle (flexural slip in competent beds, flow in ductile ones). This is the main cause in orogenic belts.
• Drag: layers bend next to a fault as they move past each other.
• Fault-related folding: fault-bend and fault-propagation folds above thrusts, and drape or forced folds above buried normal faults (monoclines).
• Differential compaction over buried highs, and gravity slumping or sliding on slopes.
• Doming: intrusions (laccoliths) or salt diapirs push the overlying beds upward.
Rock type, temperature, strain rate and layer thickness control the style: thin competent layers form close folds; thick ones form open folds.`],
['Folds','Is there folding? Describing the nature of a fold',['possibility of folding','is there folding','is there a possibility of folding','describe the nature of fold','nature of the fold','nature of fold','recognise fold','identify fold','evidence of folding','if no give the likely structure','nature of the structural feature','structural feature produced','evidence for folding','describe the structural feature'],
`How to decide from dip and strike data:
• Folding is likely if beds of the same strike dip in opposite directions (two limbs), or if dips change gradually across the area.
• On the stereonet, poles along a great circle (a girdle) mean cylindrical folding, and the pole to the girdle is the fold axis. A single tight cluster means no folding.
If folded, describe: antiform or synform (the oldest rocks in the core mean an anticline), interlimb angle (gentle, open, close, tight, isoclinal), axial plane attitude (upright, inclined, recumbent), axis plunge, symmetry and whether the fold is cylindrical.
If not folded, the likely structure is a homocline (uniformly tilted beds), a monocline or fault block, or one limb of a larger fold whose hinge lies outside the area.
Press the button to get numbers from your own measurements.`,true],
['Folds','Outcrop patterns of plunging folds',['plunging anticline','plunging syncline','fold outcrop','outcrop pattern of fold','nose of fold','fold closure','outcrop pattern of plunging','plunging fold outcrop'],
`A plunging fold gives a zig-zag outcrop pattern on a map. In a plunging anticline the outcrop closes (the V or U shaped nose points) in the direction of plunge, with the oldest beds in the middle. A plunging syncline opens in the direction of plunge and closes against it, with the youngest beds in the middle. Dips on the limbs are away from the nose in an anticline and toward the closure in a syncline. Non-plunging folds give parallel, straight outcrop bands.`],
['Folds','Fold interference and refolding',['interference','refold','superposed fold','multiple fold','boomerang','mushroom','crescent','hook pattern','fold generations'],
`When two fold generations overlap, they give interference patterns (Ramsay): Type 1 is a dome-and-basin pattern (axes at a high angle), Type 2 is a crescent or mushroom pattern, and Type 3 is a hook pattern. Poles to bedding from refolded rocks usually form a small-circle or scattered girdle rather than one great circle, so a single π-axis does not fit.`],

['Faults & structures','Types of fault (normal, reverse, thrust, strike-slip)',['fault type','types of fault','normal fault','reverse fault','thrust fault','thrust','strike-slip','strike slip','oblique slip','hanging wall','footwall','anderson','what is a fault','define fault','dextral','sinistral'],
`Hanging wall = the block above the fault plane; footwall = the block below.
• Normal fault: hanging wall moves down; extension; dips commonly about 60°.
• Reverse fault: hanging wall moves up; compression; dip steeper than about 45°.
• Thrust: a low-angle reverse fault (below about 45°, often 20°–30°), often with large displacement and older rocks pushed over younger.
• Strike-slip fault: horizontal displacement on a near-vertical plane, dextral (right-lateral) or sinistral (left-lateral).
• Oblique-slip fault: both dip-slip and strike-slip movement.
Anderson: the vertical stress is σ1 for normal faults, σ3 for thrusts and σ2 for strike-slip faults.`],
['Faults & structures','How to recognise a fault',['recognise fault','identify fault','evidence of fault','recognize fault','criteria for fault','slickenside','fault breccia','gouge','fault scarp','how to tell fault','recognition of fault','evidence of faulting'],
`Evidence for faulting:
• Offset or truncation of beds, dykes or veins; repeated or missing strata.
• Drag folds next to the fault.
• Fault rocks: breccia, gouge, cataclasite, or mylonite in ductile shear zones.
• Slickensides and slickenlines (striations) on the fault surface.
• Silicification, quartz veining and mineralisation along the plane.
• Topographic signs: linear valleys, scarps, offset streams, aligned springs.
• Straight contacts that cut across topography (steep faults) and abrupt changes in dip or rock type.`],
['Faults & structures','Horst, graben and rifts',['horst','graben','half graben','half-graben','rift valley','rifting'],
`Graben: a block dropped between two normal faults, forming a rift valley. Horst: a raised block between two normal faults. Half-graben: one major bounding fault with a tilted block, giving an asymmetric basin; common in rifts and along passive margins. Dips on tilted blocks are generally gentle to moderate and all in one direction.`],
['Faults & structures','Fault displacement: throw, heave, separation',['throw','heave','net slip','slip vector','displacement','offset of beds','strike separation','dip separation','fault effect on outcrop','stratigraphic omission','repeated beds'],
`Net slip is the actual movement between two once-adjacent points. It splits into strike-slip and dip-slip components. Throw is the vertical and heave the horizontal component of dip separation.
On a map, a normal or reverse fault shifts contacts sideways (more so for gently dipping beds), and strike-slip faults offset vertical contacts directly. In a vertical borehole, normal faults omit section and reverse faults repeat section. The apparent offset on a map depends on the orientation of both the beds and the fault, so it is not always equal to the true slip.`],
['Faults & structures','Shear zones and mylonite',['shear zone','mylonite','ductile shear','brittle ductile','cataclasite','brittle-ductile','s-c fabric'],
`A shear zone is a band where deformation is concentrated. Brittle shear zones (shallow crust) produce breccia, gouge and cataclasite. Ductile shear zones (deeper, hotter rock) produce mylonite with strong foliation and lineation; sigma and delta porphyroclasts and S-C fabrics show the sense of shear. The brittle-ductile transition lies at roughly 10–15 km depth in quartz-rich crust. Shear zones can control gold mineralisation and groundwater flow.`],
['Faults & structures','Joints',['joint','jointing','fracture set','systematic joint','joint set','joints','exfoliation','columnar joint'],
`Joints are fractures with no visible displacement. Systematic joints form parallel sets with regular spacing, often one set per orientation, commonly orthogonal pairs. They form by tectonic stress, tension at fold hinges, unloading (sheeting and exfoliation as erosion removes cover) and cooling (columnar jointing in basalt).
They control rock-mass strength, weathering, groundwater flow and slope stability. Plot poles to joints on a stereonet and contour them to identify the sets.`],
['Faults & structures','Foliation, cleavage and lineation',['foliation','cleavage','lineation','schistosity','slaty cleavage','gneissic banding','axial planar cleavage','stretching lineation','schist','slate'],
`Foliation is a planar fabric from aligned minerals or compositional layering: slaty cleavage (fine, low grade), schistosity (visible micas), and gneissic banding (high grade). Axial planar cleavage forms parallel to the axial plane of folds and refracts across layers of different competence.
Lineation is a linear fabric: mineral or stretching lineation, intersection lineation (bedding × cleavage), and fold axes. Lineations commonly parallel fold axes or the direction of tectonic transport.`],
['Faults & structures','Boudinage',['boudin','boudinage','pinch and swell'],
`Boudinage is the stretching of a competent layer within a weaker one, so that the layer necks and breaks into sausage-shaped segments (boudins). The layer is extended parallel to itself and the weak matrix flows into the gaps. It shows extension along the layer, and it is the extensional counterpart of buckling folds.`],
['Faults & structures','Unconformities',['unconformity','unconformities','angular unconformity','disconformity','nonconformity','paraconformity','hiatus'],
`An unconformity is a surface representing a gap in the rock record (erosion or non-deposition).
• Angular unconformity: younger beds lie on tilted or folded older beds at an angle.
• Disconformity: parallel beds, but an erosion surface separates them.
• Nonconformity: sedimentary rock on igneous or metamorphic basement.
• Paraconformity: parallel beds with no obvious erosion surface; the gap is recognised from fossils.
It shows uplift, erosion and later subsidence, so it separates two geological histories. On a cross-section draw older beds truncated against the younger ones.`],
['Faults & structures','Igneous intrusions: dykes, sills, batholiths',['dyke','dike','sill','batholith','pluton','laccolith','intrusion','intrusive','stock','concordant','discordant','xenolith','contact metamorphism','baked margin'],
`Discordant intrusions cut across layering: dykes (tabular, steep) and batholiths or plutons (large masses, usually granitic). Concordant intrusions follow layering: sills (tabular) and laccoliths (lens-shaped, domed roof).
An intrusion is younger than the rock it cuts (cross-cutting relationship). Signs: chilled margins, baked contacts (contact metamorphism), xenoliths of host rock in the intrusion, and veins cutting the host. Dyke swarms give the direction of regional extension.`],
['Faults & structures','Doming and uplift',['dome','doming','salt dome','diapir','domal','laccolithic','domal uplift'],
`Doming is upward bulging of strata caused by an intrusion (laccolith or pluton), a salt or mud diapir, or large-scale crustal uplift. Beds dip away radially from the centre, the outcrop pattern is circular or elliptical, and the oldest rocks crop out in the middle. Poles to bedding form a ring (small circle) about the vertical rather than a single great-circle girdle. Domes are important structural traps for oil and gas.`],

['Dips & tectonics','Geological significance of low and high dip (tectonics)',['low and high dip','significance of dip','dips tectonic','steep dip','gentle dip','low dip','high dip','geological significance of low','dip significance','significance of low'],
`Low (gentle) dips, below about 30°:
• Weak deformation, for example stable cratons, platform cover and foreland basins.
• Gently tilted beds in extensional basins and over rift shoulders.
• Large, open folds, or low-angle thrust sheets in thin-skinned belts.
• Wide, sinuous outcrop bands on a map.
High (steep to vertical) dips, above about 60°:
• Strong shortening: tight to isoclinal folds, found in the cores of orogenic belts and near major reverse faults and thrusts.
• Strike-slip and transpressional zones, where bedding is steepened or vertical and overturned beds can occur.
• Beds rotated against normal fault blocks or by drag along faults.
• Narrow, straight outcrop bands.
A rapid change from low to high dip over a short distance marks a localised strain feature: monocline, fault drag, fault-propagation fold, basin margin or unconformity.`,true],
['Dips & tectonics','Why dips change along the same strike',['changes in dip','change in dip','dips on the same strike','same strike','varying dip','dip change','dip variation','variation in dip','cause of changes in dip','change of dip'],
`If strike stays the same but the dip changes, the likely causes are:
• Folding: dip steepens or flattens around the hinge, and if the dip direction reverses you are crossing from one limb to the other.
• Plunging folds or domes: the dip changes along the strike as you move round the nose.
• Fault drag or rotation of fault blocks (listric faults tilt beds more with depth).
• Monoclinal flexures or differential compaction over basement highs.
• Intrusions, salt or doming pushing the beds up locally.
• Unconformities, where younger beds dip differently from older beds.
• Original depositional dips (cross-bedding, delta fronts, reef flanks) and local slumping.
• Measurement or weathering error, so check the quality of each measurement.
Use the stereonet: poles along a girdle point to folding; a few isolated outliers point to faulting or errors.`,true],
['Dips & tectonics','Rule of V’s and outcrop patterns',['rule of v','rule of vs','outcrop width','outcrop pattern','v shape','v-shape','horizontal beds outcrop','dendritic','contacts cross valleys','outcrop of dipping beds'],
`Rule of V’s: contacts bend where they cross valleys.
• Horizontal beds: contacts follow the contour lines (dendritic pattern).
• Vertical beds: contacts are straight and cross valleys without bending.
• Dipping beds: the V points in the direction of dip. The exception is beds dipping downstream at an angle gentler than the valley gradient, where the V points upstream.
Gentle dips give wide outcrop bands that are strongly affected by topography; steep dips give narrow, straighter bands.`],
['Dips & tectonics','Bed thickness: true, apparent and vertical',['thickness','true thickness','apparent thickness','bed thickness','width of outcrop','vertical thickness','calculate thickness'],
`On level ground, with the width w measured perpendicular to strike: true thickness t = w × sin(dip).
Vertical thickness v (for example in a borehole) is related by t = v × cos(dip).
If the traverse is oblique to the strike, use w × sin(dip) × sin(angle between traverse and strike). On a sloping ground surface, correct with the slope angle as well. Take care with the sign: when the slope dips the same way as the bed, the relation changes.`],
['Dips & tectonics','Tectonic regimes: compression, extension, strike-slip',['tectonic regime','compression','extension','tension','stress','strain','tectonic setting','convergent','divergent','transform','plate boundary','tectonics','tectonic'],
`Compression (convergent margins): folds, thrusts and reverse faults, cleavage and foliation, shortening and crustal thickening.
Extension (divergent margins, rifts): normal faults, horsts and grabens, half-grabens, dykes, crustal thinning and basin formation.
Strike-slip (transform margins): near-vertical faults, en-echelon folds, pull-apart basins and flower structures.
Stress is force per area (σ1 ≥ σ2 ≥ σ3); strain is the resulting change in shape, volume or position. Deformation ranges from brittle (faults, joints) at shallow depth to ductile (folds, shear zones) at depth.`],
['Dips & tectonics','Orogeny, Wilson cycle and cratons',['orogeny','orogen','mountain building','wilson cycle','craton','shield','collisional','suture','orogenic belt','orogenic'],
`An orogeny is a mountain-building episode, usually caused by collision or subduction, with folding, thrusting, metamorphism and granite intrusion.
The Wilson cycle: continental rifting, ocean opening, ocean closure by subduction, then continental collision (orogeny), and the cycle can start again.
A craton is the old, stable core of a continent, mostly Precambrian, such as the West African Craton. A shield is the exposed part of a craton.`],

['Maps & principles','Principles of stratigraphy and relative dating',['principle','superposition','original horizontality','lateral continuity','cross-cutting','cross cutting','inclusion','faunal succession','uniformitarianism','walther','relative dating','geological principles','principles of stratigraphy','relative age'],
`• Superposition: in undisturbed beds the oldest layer is at the bottom.
• Original horizontality: sediments are deposited nearly horizontally, so tilted or folded beds have been deformed.
• Lateral continuity: a layer extends sideways until it thins out or meets a barrier.
• Cross-cutting relationships: a feature that cuts another (dyke, fault, vein) is younger.
• Inclusions: fragments are older than the rock that contains them.
• Faunal succession: fossils occur in a definite order, so they date and correlate beds.
• Uniformitarianism: present processes explain the past (the present is the key to the past).
• Walther’s law: facies that are side by side also succeed each other vertically.`],
['Maps & principles','Absolute dating (radiometric)',['absolute age','absolute dating','radiometric','half-life','half life','geochronology','u-pb','zircon','radioactive decay'],
`Absolute (radiometric) dating uses the steady decay of radioactive parent isotopes to daughter isotopes. Age = (1/λ) × ln(1 + D/P), where λ is the decay constant, D the daughter and P the parent amount. Common methods: U-Pb in zircon (very old rocks), K-Ar and Ar-Ar (volcanic rocks and micas), Rb-Sr, and C-14 (organic material to about 50 000 years). The date records when the mineral cooled below its closure temperature.`],
['Maps & principles','Geological time scale',['geological time','time scale','timescale','eon','era','epoch','precambrian','paleozoic','palaeozoic','mesozoic','cenozoic','hadean','archean','archaean','proterozoic','phanerozoic'],
`Approximate boundaries:
• Hadean: 4.6–4.0 Ga. Archean: 4.0–2.5 Ga. Proterozoic: 2.5 Ga–539 Ma. (Together: Precambrian.)
• Phanerozoic: 539 Ma to present.
• Paleozoic: 539–252 Ma (Cambrian, Ordovician, Silurian, Devonian, Carboniferous, Permian).
• Mesozoic: 252–66 Ma (Triassic, Jurassic, Cretaceous).
• Cenozoic: 66 Ma to present (Paleogene, Neogene, Quaternary).
In a geological history, always attach each event to an era or period, and describe the oldest events first.`],
['Maps & principles','Reading a geological map',['read a geological map','geological map','map symbol','map legend','contact','strike and dip symbol','what is a geological map','interpret a map','interpret geological map'],
`A geological map shows rock units at the surface with colours and patterns, contacts (boundaries) as lines, faults as thicker lines with ticks, and strike-and-dip symbols. The legend lists units from youngest at the top to oldest at the bottom.
To interpret: find the oldest and youngest units, read the dips to see how beds are tilted, trace contacts to see folds (repeated outcrop patterns on both sides of a line) and faults (offset or truncated units), and use the rule of V’s with topography to estimate dip where no symbol is given.`],
['Maps & principles','Relationships between geological units',['relationship between','relationships between units','contact relationship','conformable','intrusive contact','faulted contact','unconformable contact','relationship between various','relation between units','relationship between various geological units'],
`Units relate by their contacts:
• Conformable (depositional) contact: continuous deposition, the younger unit lies on the older one.
• Unconformable contact: a gap in time (erosion or non-deposition), often with an angular discordance.
• Intrusive contact: igneous rock cuts the host, so it is younger, often with a baked margin.
• Faulted contact: units are juxtaposed by displacement; the ages cannot be read from superposition.
• Gradational or interfingering contact: units change laterally into each other (facies change).
State in your answer, with evidence from your section, which is oldest and youngest, which cut which, and how thick and continuous each unit is.`],
['Maps & principles','Topographic profile',['topographic profile','topography profile','profile line','elevation profile','section line'],
`To construct a topographic profile: draw the section line on the map; lay a strip of paper along it and mark each contour crossing with its elevation; transfer these marks to a graph with the horizontal axis equal to the map scale and a vertical scale of your choice; join the points with a smooth line. Mark where contacts, faults and unconformities cross the section line on the profile. State the vertical exaggeration.`],

['Cross-sections','Steps to construct a geological cross-section',['construct cross','cross section','cross-section','steps to draw','how to draw cross','subsurface interpretation','steps for constructing','geological cross'],
`1. Choose a section line, ideally across the main structures and perpendicular to the strike.
2. Draw the topographic profile along the line.
3. Transfer each contact, fault and unconformity where it crosses the line onto the profile.
4. Project the dips: the apparent dip in the section is tan(apparent) = tan(true) × sin(angle between strike and section line).
5. Draw the contacts downward at the correct dip and join them with lateral continuity.
6. Complete the subsurface: fold shapes, faults with their offset, intrusions and unconformities that cut across older beds.
7. Add title, legend, scale (with vertical exaggeration), orientation of the section ends (for example A–B or NW–SE), your name, ID and the date.
Parallel (constant-thickness) folds and the principle of superposition control how you extend beds at depth.`],
['Cross-sections','Vertical exaggeration and scale',['vertical exaggeration','exaggeration','map scale','bar scale','representative fraction','scale conversion','scale of section'],
`Vertical exaggeration VE = horizontal scale ÷ vertical scale. Example: horizontal 1:10 000 and vertical 1:2 000 give VE = 5.
Exaggerated sections show dips steeper than reality; if you draw the true apparent dip on an exaggerated section, the plotted dip is tan(plotted) = VE × tan(apparent).
A scale such as 1:50 000 means 1 cm = 500 m. Always state the scale and the exaggeration on the section and show how you calculated it.`],
['Cross-sections','Projecting dips onto a section',['project dip','apparent dip on section','apparent dip in section','projection of dip','projecting dip','apparent dip','true dip'],
`Apparent dip on a section line: tan(apparent dip) = tan(true dip) × sin(α), where α is the angle between the strike and the section line. If the section is perpendicular to the strike, the apparent dip equals the true dip; if the section is parallel to the strike, the apparent dip is 0°. Use the Solve box for numbers, for example: apparent dip of plane 045/30 SE towards 120.`],

['Geological history','How to write a geological history of an area',['geological history','geologic history','evolution of the area','geological evolution','write a history','evolution history','history of the area','sequence of events','geological evolution history'],
`Write it oldest to youngest, using the time scale:
1. List the units from oldest to youngest with superposition (and use the intrusive and cross-cutting relationships to place dykes and faults).
2. For each unit give the environment of deposition or emplacement (marine, fluvial, volcanic, intrusive) and its age or era.
3. Describe each deformation event in order: folding, faulting, intrusion, metamorphism, uplift and erosion, unconformity.
4. Link the events to tectonic regimes (compression, extension) and to the regional setting.
5. End with the recent history: weathering, laterite, river erosion and the present landscape.
Use evidence from your section for each statement, and mention the time spans.`],
['Geological history','Geological evolution of Ghana (summary)',['geology of ghana','ghana geology','ghana geological','birimian','tarkwaian','voltaian','dahomeyan','eburnean','pan-african','west african craton','geological history of ghana','geological evolution of ghana','cape coast'],
`A simplified outline of Ghana’s geology (check it against your own map legend):
• Birimian (about 2.2–2.1 Ga): volcanic and sedimentary belts and granitoids of the West African Craton, folded and metamorphosed during the Eburnean orogeny (about 2.1 Ga). They host most of the gold.
• Tarkwaian (about 2.1 Ga): coarse sedimentary rocks, including conglomerates, deposited unconformably on the Birimian as the mountains were eroded. They host paleoplacer gold at Tarkwa.
• Voltaian Basin (Neoproterozoic to Paleozoic): mostly sandstones and shales on the craton.
• Pan-African belt (about 600 Ma): the Dahomeyide or Togo structural unit in the east, formed by collision at the craton margin.
• Mesozoic: Gondwana broke up and the Atlantic opened, forming coastal sedimentary basins (Tano, Saltpond, Keta).
• Cenozoic: erosion, deep tropical weathering (laterite and bauxite) and Quaternary sediments along the coast and rivers.`],

['Economic & applied','Economic significance of the rocks on a map',['economic significance','economic importance','economic geology','economic value','economic mineral','uses of rocks','mineral resources','mineral deposit','ore deposit','ore body','economic significance of geological materials'],
`Typical economic uses, by rock type (match them to your map legend):
• Granite, gneiss and other crystalline rocks: aggregate, dimension and building stone; fractured and weathered zones also give groundwater.
• Sandstone: building stone, aquifers, glass and moulding sand; coarse sandstone and conglomerate may host placer minerals.
• Limestone: cement, lime and agricultural lime.
• Shale and clay: bricks, tiles and ceramics; also seals in petroleum systems.
• Schist, greenstone and metavolcanic belts with quartz veins: gold and other metals.
• Laterite and bauxite: road gravel, aluminium ore; alluvium: sand, gravel, placer gold and diamonds.
• Structures: shear zones and faults control ore veins and groundwater; anticlines and faults make traps for oil and gas.
Also mention engineering value (foundations, dam sites) and the hazards (landslides, unstable slopes).`],
['Economic & applied','Structural control of mineralisation and gold',['mineralisation','mineralization','structural control','vein','quartz vein','saddle reef','shear hosted','orogenic gold','hydrothermal','gold deposit','paleoplacer'],
`Hydrothermal fluids move along permeable structures and deposit metal where conditions change. Controls include: shear zones and faults (the main control for orogenic gold), dilational jogs and fold hinges (saddle reefs, where beds open during folding), contacts between rocks of different competence, and joints and breccia zones. In Ghana, the Birimian gold is mostly in shear zones, while the Tarkwa gold is in paleoplacers (ancient river conglomerates).`],
['Economic & applied','Petroleum traps and hydrocarbons',['trap','petroleum','oil trap','reservoir','source rock','seal','hydrocarbon','anticlinal trap','oil and gas','petroleum system'],
`A petroleum system needs a source rock, reservoir rock (porous and permeable sandstone or limestone), seal (shale, evaporite), a trap and timing of migration.
Structural traps: anticlines and domes, fault traps and salt domes. Stratigraphic traps: pinch-outs, reefs and unconformities. Reading dips on a map or section helps to find closed structures that can hold hydrocarbons.`],
['Economic & applied','Groundwater and engineering geology',['groundwater','aquifer','borehole yield','engineering geology','foundation','tunnel','dam site','geohazard','landslide','water supply'],
`Groundwater in basement rocks is held in weathered zones and fractures, so boreholes should target fault and fracture zones; sandstones and alluvium form porous aquifers.
In engineering, structure matters: dips toward a cut slope favour sliding, joints control rock-mass strength and water flow, weak shear zones are poor foundations, and soluble limestone can have cavities. Use the slope analysis for the kinematic checks.`],
['Economic & applied','Mineral resources of Ghana',['ghana minerals','gold mining ghana','manganese','bauxite','diamond','jubilee','akwatia','awaso','nsuta','obuasi','tarkwa','offshore oil','ghana oil'],
`Gold: Birimian greenstone and sedimentary belts (for example the Ashanti belt at Obuasi) and Tarkwaian paleoplacers at Tarkwa. Manganese: Nsuta. Bauxite: Awaso (lateritic weathering). Diamonds: Akwatia. Oil and gas: offshore Tano and Saltpond basins, including the Jubilee field. Industrial minerals: clay, limestone, salt, sand and aggregate. Weathered and fractured basement and sandstone provide groundwater.`],

['General geology','The rock cycle',['rock cycle','three rock types','types of rock'],
`Igneous rocks form from cooling magma or lava. Weathering and erosion turn them into sediment, which is lithified into sedimentary rock. Heat and pressure change any rock into metamorphic rock. If melted, any rock can become magma again, completing the cycle. Plate tectonics drives it through uplift, burial and melting.`],
['General geology','Igneous rocks: classification and textures',['igneous rock','granite','basalt','gabbro','bowen','reaction series','plutonic','volcanic rock','magma','felsic','mafic','texture of igneous'],
`Classify by composition (felsic, intermediate, mafic, ultramafic) and grain size (coarse = intrusive, fine = extrusive): granite (rhyolite), granodiorite (dacite), diorite (andesite), gabbro (basalt).
Slow cooling gives coarse crystals (phaneritic); fast cooling gives fine crystals or glass (aphanitic); two sizes give porphyritic texture.
Bowen’s reaction series: olivine and Ca-plagioclase crystallise first at high temperature, quartz last. Mafic magma comes from the mantle and felsic magma mainly from partial melting of crust.`],
['General geology','Sedimentary rocks and structures',['sedimentary rock','sandstone','limestone','shale','conglomerate','cross bedding','cross-bedding','ripple','graded bedding','lithification','diagenesis','facies','sedimentary structure','paleocurrent'],
`Clastic rocks (conglomerate, sandstone, shale) are classified by grain size; chemical and biogenic rocks include limestone and evaporites. Lithification involves compaction and cementation. Sedimentary structures show way-up and environment: graded bedding (fines upward), cross-bedding (dips in the current direction), ripple marks and mud cracks. Cross-bedding and ripples give paleocurrent directions; restore beds to horizontal before reading them.`],
['General geology','Metamorphism: grade, facies and rocks',['metamorphism','metamorphic','metamorphic grade','facies','greenschist','amphibolite','granulite','hornfels','gneiss','marble','quartzite','regional metamorphism'],
`Metamorphism changes the minerals and texture of a rock in the solid state by heat, pressure and fluids. Contact metamorphism (around intrusions) gives non-foliated hornfels, marble and quartzite. Regional metamorphism in orogenic belts gives foliated rocks.
Increasing grade for mudrock: slate, phyllite, schist, gneiss, then migmatite. Facies: zeolite, greenschist, amphibolite, granulite (low to high temperature), and blueschist and eclogite (high pressure). The Birimian rocks are mainly greenschist to amphibolite facies.`],
['General geology','Plate tectonics',['plate tectonics','plate boundary','subduction','mid-ocean ridge','continental drift','lithosphere','asthenosphere','continental rift','seafloor spreading'],
`The lithosphere is broken into plates that move over the asthenosphere. At divergent boundaries (mid-ocean ridges, rifts) plates separate and new crust forms; at convergent boundaries one plate subducts or continents collide, forming trenches, volcanic arcs and mountain belts; at transform boundaries plates slide past each other. Evidence: matching continental margins and fossils, seafloor spreading, magnetic stripes, earthquake and volcano distribution, and GPS motions.`],
['General geology','Weathering, laterite and soils',['weathering','laterite','lateritic','bauxite formation','regolith','saprolite','soil profile','chemical weathering','physical weathering','erosion'],
`Physical weathering breaks rock mechanically (frost, thermal stress, unloading). Chemical weathering changes minerals (hydrolysis, oxidation, solution) and is fastest in warm, wet climates such as southern Ghana. Intense tropical weathering leaves laterite, rich in iron and aluminium oxides; where aluminium is enriched, it forms bauxite. A weathering profile grades from fresh rock through saprolite to soil. Weathered basement is also an aquifer.`],
['General geology','Mineral properties and identification',['mohs','hardness','cleavage of mineral','lustre','luster','streak','mineral identification','specific gravity','quartz','feldspar','mica','olivine'],
`Identify minerals by: hardness (Mohs scale 1 talc to 10 diamond), lustre, colour and streak, cleavage and fracture, crystal habit, specific gravity and reactions such as fizzing with acid (calcite). Quartz (hardness 7) has conchoidal fracture and no cleavage; feldspar (6) has two cleavages at about 90°; mica has one perfect cleavage; calcite (3) fizzes in HCl; olivine is green and glassy.`]
];

// ---------- keyword ranking ----------
const RE=KB.map(e=>e[2].map(k=>({r:new RegExp('(^|[^a-z0-9])'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),w:/[\s-]/.test(k.trim())?2:1})));
function rank(low){const out=[];KB.forEach((e,i)=>{let s=0;RE[i].forEach(k=>{if(k.r.test(low))s+=k.w});if(s>0)out.push({i,s})});return out.sort((a,b)=>b.s-a.s||a.i-b.i)}

// ---------- eigen-decomposition (Jacobi) of a symmetric 3×3 ----------
function eig3(T){
  const A=T.map(r=>r.slice()),V=[[1,0,0],[0,1,0],[0,0,1]];
  for(let it=0;it<60;it++){
    let p=0,q=1,mx=Math.abs(A[0][1]);
    if(Math.abs(A[0][2])>mx){p=0;q=2;mx=Math.abs(A[0][2])}
    if(Math.abs(A[1][2])>mx){p=1;q=2;mx=Math.abs(A[1][2])}
    if(mx<1e-13)break;
    const th=0.5*Math.atan2(2*A[p][q],A[q][q]-A[p][p]),c=Math.cos(th),s=Math.sin(th);
    for(let k=0;k<3;k++){const a=A[k][p],b=A[k][q];A[k][p]=c*a-s*b;A[k][q]=s*a+c*b}
    for(let k=0;k<3;k++){const a=A[p][k],b=A[q][k];A[p][k]=c*a-s*b;A[q][k]=s*a+c*b}
    for(let k=0;k<3;k++){const a=V[k][p],b=V[k][q];V[k][p]=c*a-s*b;V[k][q]=s*a+c*b}
  }
  return [0,1,2].map(i=>({l:A[i][i],v:[V[0][i],V[1][i],V[2][i]]})).sort((a,b)=>b.l-a.l);
}

// ---------- structural analysis of a set of planes ----------
const fleutyTight=a=>a>120?'gentle':a>70?'open':a>30?'close':a>0?'tight':'isoclinal';
const axialClass=d=>d>=80?'upright':d>=60?'steeply inclined':d>=30?'moderately inclined':d>=10?'gently inclined':'recumbent';
const plungeClass=p=>p<10?'horizontal':p<30?'gently plunging':p<60?'moderately plunging':p<80?'steeply plunging':'subvertical';
const dipClass=d=>d<30?'gentle':d<60?'moderate':'steep';
function analyse(P){
  const N=P.length;if(N<2)return null;
  const T=[[0,0,0],[0,0,0],[0,0,0]];
  P.forEach(p=>{for(let i=0;i<3;i++)for(let j=0;j<3;j++)T[i][j]+=p.n[i]*p.n[j]/N});
  const ev=eig3(T),S=ev.map(e=>Math.max(e.l,1e-9)),C=Math.log(S[0]/S[1]),G=Math.log(S[1]/S[2]),e1=ev[0].v,e2=ev[1].v,e3=ev[2].v;
  const kind=S[1]<0.05?'cluster':((C+G)<1.2||S[2]>0.07)?'weak':(C>=G?'cluster':'girdle');
  const dips=P.map(p=>p.d),R={dmin:Math.min.apply(null,dips),dmax:Math.max.apply(null,dips),dmean:dips.reduce((a,b)=>a+b,0)/N};
  const out={N,S,C,G,kind,R,P};
  // mean orientation (cluster)
  let sum=[0,0,0];P.forEach(p=>{const s=dot(p.n,e1)>=0?1:-1;sum=sum.map((c,i)=>c+s*p.n[i])});
  const Rr=mag(sum);out.mean=planeFrom(e1);
  out.kappa=N>1&&N-Rr>1e-6?(N-1)/(N-Rr):Infinity;
  out.a95=N>=3&&Rr>0?Math.acos(cl(1-(N-Rr)/Rr*(Math.pow(20,1/(N-1))-1)))/D:null;
  out.disp=P.reduce((a,p)=>a+Math.acos(cl(Math.abs(dot(p.n,e1))))/D,0)/N;
  // girdle / fold geometry
  const ax=tp(e3);out.axis=ax;out.girdleDev=P.reduce((a,p)=>a+Math.abs(Math.asin(cl(dot(p.n,e3))))/D,0)/N;
  const ph=P.map(p=>{let a=Math.atan2(dot(p.n,e2),dot(p.n,e1))/D;a=((a%180)+180)%180;return a}).sort((a,b)=>a-b);
  let m=0,gap=-1;for(let i=0;i<N;i++){const g=i<N-1?ph[i+1]-ph[i]:ph[0]+180-ph[N-1];if(g>gap){gap=g;m=i}}
  const range=180-gap,start=ph[(m+1)%N],pm=(start+range/2)*D,u=e1.map((c,i)=>Math.cos(pm)*c+Math.sin(pm)*e2[i]);
  out.range=range;out.inter=180-range;out.axial=planeFrom(cross(e3,u));
  // same-strike groups with different dips
  const gr=[];P.forEach((p,i)=>{const st=mod(p.s)%180;const g=gr.find(g=>{const x=Math.abs(g.st-st);return Math.min(x,180-x)<=10});if(g)g.m.push(i);else gr.push({st,m:[i]})});
  out.same=gr.filter(g=>g.m.length>1).map(g=>{const d=g.m.map(i=>P[i].d);return{st:g.st,n:g.m.length,lo:Math.min.apply(null,d),hi:Math.max.apply(null,d),dirs:[...new Set(g.m.map(i=>cmp(P[i].dd)))]}}).filter(g=>g.hi-g.lo>=10);
  // mean strike (axial)
  let ss=0,sc=0;P.forEach(p=>{ss+=Math.sin(2*p.s*D);sc+=Math.cos(2*p.s*D)});out.mstrike=mod(Math.atan2(ss,sc)/D/2)%180;
  return out;
}

// ---------- HTML for the interpretation ----------
let lastPlot=[];
const li=x=>`<div style="margin:6px 0">${x}</div>`;
function interpHTML(name){
  if(typeof data==='undefined')return '<div class="mute">No data found.</div>';
  const P=data.filter(d=>d.s===name&&d.k==='p').map(d=>({s:mod(d.a),d:d.b,dd:mod(d.a+90),n:vec(mod(d.a+270),90-d.b)}));
  if(P.length<2)return `<div class="mute">Set “${esc(name)}” needs at least 2 plane measurements (it has ${P.length}). Add planes (strike and dip) and try again.</div>`;
  const A=analyse(P);lastPlot=[];
  const fab=`Pole pattern: <b>${A.kind==='girdle'?'girdle (fold-like)':A.kind==='cluster'?'cluster (planar)':'weak or scattered'}</b>. Eigenvalues S1, S2, S3 = ${A.S.map(x=>x.toFixed(3)).join(', ')}; C = ln(S1/S2) = ${f1(A.C)}, G = ln(S2/S3) = ${f1(A.G)}.`;
  let h=`<div><b>Structural interpretation: set ${esc(name)}</b> (${A.N} planes)</div>`+li(fab);
  h+=li(`Dips range from ${f0(A.R.dmin)}° to ${f0(A.R.dmax)}° (mean ${f0(A.R.dmean)}°, ${dipClass(A.R.dmean)}); mean strike about ${pad(A.mstrike)}°.`);
  let q1,q2,q3,q4;
  if(A.kind==='girdle'){
    const tight=fleutyTight(A.inter),ac=axialClass(A.axial.d),pc=plungeClass(A.axis.p);
    h+=li(`Best-fit fold axis (pole to the girdle): <b>trend ${pad(A.axis.t)}°, plunge ${f1(A.axis.p)}°</b> (${pc}). Mean deviation of poles from the girdle: ${f1(A.girdleDev)}°${A.girdleDev<10?' (the fold is close to cylindrical)':' (not very cylindrical)'}.`);
    h+=li(`Estimated interlimb angle ≈ <b>${f0(A.inter)}°</b> (${tight} fold). Approximate axial plane: <b>${pad(A.axial.s)}/${f0(A.axial.d)} ${cmp(A.axial.dd)}</b> (${ac}).`);
    h+=`<div class="mute">Orientation data alone cannot say whether it is an anticline or a syncline: use the ages (older rocks in the core means an anticline). ${A.N<5?'With only '+A.N+' planes treat these numbers as rough, and assume the planes sample opposite limbs.':''}</div>`;
    lastPlot=[{k:'l',a:A.axis.t,b:A.axis.p},{k:'p',a:A.axial.s,b:A.axial.d}];
    q1=`The poles lie along a girdle, so the beds are folded about an axis trending ${pad(A.axis.t)}° and plunging ${f0(A.axis.p)}°. It is ${/^[aeiou]/.test(tight)?'an':'a'} ${tight} fold (interlimb angle about ${f0(A.inter)}°), ${ac} with a ${pc} axis.`;
    q4=`Yes. Dips of both senses and a girdle of poles are evidence for folding.`;
  }else if(A.kind==='cluster'){
    h+=li(`Mean orientation: <b>${pad(A.mean.s)}/${f0(A.mean.d)} ${cmp(A.mean.dd)}</b> (dip direction ${pad(A.mean.dd)}°). Scatter ≈ ${f1(A.disp)}° about the mean pole${A.a95!=null?', α95 ≈ '+f1(A.a95)+'°':''}, Fisher κ ≈ ${isFinite(A.kappa)?f0(A.kappa):'very high'}.`);
    lastPlot=[{k:'p',a:A.mean.s,b:A.mean.d}];
    q1=`The poles form one cluster (mean ${pad(A.mean.s)}/${f0(A.mean.d)} ${cmp(A.mean.dd)}), so the beds are uniformly tilted: a homocline, not a fold.`;
    q4=`No. The poles do not form a girdle. The likely structure is a homocline (tilted beds), possibly one limb of a larger fold whose hinge lies outside the area, or a tilted fault block.`;
  }else{
    h+=li('The poles are scattered with no strong cluster or girdle. This suggests several sets (for example bedding plus joints or foliation), mixed lithologies, or complex deformation. Analyse the planes in separate sets (bedding, joints, foliation) for a clearer result.');
    q1='The measurements show no single dominant orientation, so the structure is complex or the data mix several planar features.';
    q4='Not clearly. The poles do not define one girdle or one cluster, so separate the data by feature and re-plot.';
  }
  const same=A.same.length?A.same.map(g=>`strike ≈ ${pad(g.st)}°: dips ${f0(g.lo)}°–${f0(g.hi)}° (${g.n} planes, dipping ${g.dirs.join(', ')})`).join('; '):'';
  h+=li(same?`Dip changes along the same strike found: ${esc(same)}.`:'No planes of the same strike with dips differing by 10° or more were found.');
  q2=same?`Dips change on the same strike (${same}). ${A.kind==='girdle'?'In this data it is explained by folding: the beds change dip around the hinge and across the limbs'+(A.axis.p>10?', and because the axis plunges, the dip also changes along the strike':'')+'.':'Possible causes are drag or tilting along faults, local doming, differential compaction, plunging folds, or measurement variation.'}`:'Dips are consistent along each strike, so there is no strong evidence for local structural disturbance.';
  q3=`Mean dip ${f0(A.R.dmean)}° (${dipClass(A.R.dmean)}); range ${f0(A.R.dmin)}°–${f0(A.R.dmax)}°. ${A.R.dmean<30?'Gentle dips suggest weak deformation, for example stable platform or extensional settings.':A.R.dmean<60?'Moderate dips suggest moderate shortening or tilting.':'Steep dips suggest strong shortening, as in orogenic belts or near major faults and thrusts.'}${A.R.dmax-A.R.dmin>25?' A wide dip range points to local strain concentration such as fold limbs and fault drag.':''}`;
  h+=`<div style="margin-top:8px"><b>Draft answers for the interpretation questions (rewrite in your own words):</b></div>`+[['Nature of the structural feature',q1],['Cause of dip changes on the same strike',q2],['Tectonic significance of low and high dip',q3],['Possibility of folding',q4]].map(x=>li(`<b>${esc(x[0])}:</b> ${esc(x[1])}`)).join('');
  if(lastPlot.length)h+=`<div class="row"><button class="p" data-qa="plotres">Plot ${A.kind==='girdle'?'fold axis and axial plane':'mean plane'} on the net</button></div>`;
  return h;
}
function entryHTML(i,rel){
  const e=KB[i];
  return `<div><b>${esc(e[1])}</b></div><div class="mute">${esc(e[0])}</div>`+e[3].split('\n').map(x=>`<div style="margin:5px 0">${esc(x)}</div>`).join('')
   +(e[4]?`<div class="row"><button class="p" data-qa="interp">Analyse my data for this</button></div>`:'')
   +(rel.length?`<div class="mute" style="margin-top:8px">Related:</div><div class="row">${rel.map(r=>`<button class="s" data-qa="t:${r.i}">${esc(KB[r.i][1])}</button>`).join('')}</div>`:'');
}
const setNames=()=>typeof data==='undefined'?[]:[...new Set(data.filter(d=>d.k==='p').map(d=>d.s))];
const dataIntent=low=>/\b(my|this|the)\s+(data|set|measurements?|planes|bedding)\b|\bset\s+["“']?\w+/.test(low)&&/(interpret|analy[sz]e|describe|nature|fold|structure|girdle|cluster|axis|axial|limb|dips? (change|vary))/.test(low);
const re=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function pickSet(low){
  const nm=setNames(),hit=nm.find(n=>String(n).length>1&&new RegExp('(^|[^a-z0-9])'+re(String(n).toLowerCase())+'([^a-z0-9]|$)').test(low));
  if(hit)return hit;
  const g=typeof document!=='undefined'&&document.getElementById('gSet');
  return g&&g.value?g.value:nm[0];
}
const detectEntities=t=>{try{return window.__sv&&window.__sv.parseQ?window.__sv.parseQ(t).E:(/\d{1,3}\s*[\/,]\s*\d{1,2}/.test(t)?[1]:[])}catch(e){return /\d{1,3}\s*[\/,]\s*\d{1,2}/.test(t)?[1]:[]}};
const CONCEPT=/^(what|why|how|define|explain|describe|state|give|list|differentiate|distinguish|importance|significance|advantage|disadvantage|compare|outline|discuss|tell|is there|are there|briefly|mention|indicate)/;
// returns html or null
function answer(text,strict){
  const t=(text||'').trim();if(!t)return null;const low=t.toLowerCase();
  if(detectEntities(t).length)return null;
  if(dataIntent(low)){const nm=pickSet(low);return nm===undefined?'<div class="mute">There are no plane measurements yet. Add some and try again.</div>':interpHTML(nm)}
  const r=rank(low);if(!r.length)return null;
  if(strict&&!(r[0].s>=2||CONCEPT.test(low)))return null;
  return entryHTML(r[0].i,r.slice(1,4));
}
if(typeof window!=='undefined')window.__qa={KB,rank,analyse,interpHTML,answer,eig3};
if(typeof document==='undefined'||!document.getElementById('solverCard'))return;

// ---------- interface ----------
const $=id=>document.getElementById(id);
const card=$('solverCard'),sOut=$('sOut');
const show=h=>{sOut.innerHTML=h;sOut.scrollIntoView({block:'nearest'})};
const cats=[...new Set(KB.map(e=>e[0]))];
const sec=document.createElement('details');
sec.innerHTML=`<summary class="mute" style="cursor:pointer;margin:6px 0">Geology Q&amp;A and structural interpretation</summary>
<div class="mute" style="margin:4px 0">Ask in the box above (for example “advantages of plotting poles”, “significance of low and high dip”, “economic importance of granite”) or pick a topic here.</div>
<div class="row"><select id="gTopic" style="flex:1;min-width:220px">${cats.map(c=>`<optgroup label="${esc(c)}">${KB.map((e,i)=>e[0]===c?`<option value="${i}">${esc(e[1])}</option>`:'').join('')}</optgroup>`).join('')}</select><button class="p" id="gShow">Show answer</button></div>
<div class="mute" style="margin:8px 0 2px">Interpret my measurements (fold axis, tightness, dip changes, draft answers)</div>
<div class="row"><select id="gSet" aria-label="Set"></select><button class="p" id="gInterp">Interpret this set</button></div>`;
sOut.before(sec);

// ---------- "Start here" guide ----------
const ol=x=>`<ol style="margin:4px 0 10px 20px;padding:0;line-height:1.5">${x.map(i=>`<li>${i}</li>`).join('')}</ol>`;
const ex=(t)=>`<button class="s" data-ex="${esc(t)}" style="margin:2px 4px 2px 0">${esc(t)}</button>`;
const guide=document.createElement('details');guide.id='gGuide';guide.open=true;
guide.innerHTML=`<summary style="cursor:pointer;margin:6px 0;font-weight:700">Start here: how to use this card</summary>
<div class="mute" style="margin:2px 0 6px">Pick the job you want to do. Follow the steps in order. You do not need to use every part.</div>
<div><b>Job 1: Turn a plane into a pole</b></div>
${ol(['Tap <b>Step-by-step calculator</b> below.','In the first list, choose <b>Plane → pole</b>.','Type the <b>strike</b> in the first box and the <b>dip</b> in the second box.','In the third box choose the dip side. For 315°, 60° SW choose <b>strike, dips SW</b>.','Tap <b>Calculate</b>.','Tap <b>Plot result on the net</b> to see the pole.'])}
<div><b>Job 2: Find where two planes meet (intersection)</b></div>
${ol(['Tap <b>Step-by-step calculator</b> below.','In the first list, choose <b>Intersection of two planes</b>.','Fill in Plane 1 and Plane 2 the same way as Job 1.','Tap <b>Calculate</b>.'])}
<div><b>Job 3: Learn what something is, or why it matters</b></div>
${ol(['Open <b>Geology Q&amp;A and structural interpretation</b> below.','Choose a topic from the list.','Tap <b>Show answer</b>.','Or type key words in the top box (for example “types of fault”) and tap <b>Solve</b>.'])}
<div><b>Job 4: Check whether my beds are folded</b></div>
${ol(['First add your planes (strike and dip) in the main part of the app, in a set.','Open <b>Geology Q&amp;A and structural interpretation</b> below.','Choose your set in the second list.','Tap <b>Interpret this set</b> and read the answer.','Tap <b>Plot</b> if you want the fold axis on the net.'])}
<div><b>Job 5: Try an example (one tap)</b></div>
<div class="row" style="margin:4px 0">${['pole of 315/60 SW','intersection of 045/60 SE and 120/45 NE','advantages of plotting poles','significance of low and high dip','types of fault','economic importance of granite'].map(ex).join('')}</div>
<div class="mute" style="margin:6px 0">Tips: type planes like <b>045/60 SE</b> (strike / dip and the side it dips to). If the card does not understand a sentence, use the <b>Step-by-step calculator</b>. The answers are study notes: write your final answers in your own words.</div>`;
const h2=card.querySelector('h2');(h2?h2.nextElementSibling||h2:card).after(guide);
function gSets(){const g=$('gSet'),v=g.value,nm=setNames();g.innerHTML=nm.map(n=>`<option>${esc(n)}</option>`).join('');if(nm.indexOf(v)>=0)g.value=v}
gSets();card.addEventListener('pointerdown',gSets,true);
$('gShow').onclick=()=>{const i=+$('gTopic').value,rel=rank(KB[i][1].toLowerCase()).filter(x=>x.i!==i).slice(0,3);show(entryHTML(i,rel))};
$('gInterp').onclick=()=>{gSets();const nm=$('gSet').value;show(nm?interpHTML(nm):'<div class="mute">There are no plane measurements yet. Add some and try again.</div>')};
function qa(code){
  if(code==='interp'){gSets();const nm=pickSet(($('sQ').value||'').toLowerCase());show(nm===undefined?'<div class="mute">There are no plane measurements yet.</div>':interpHTML(nm));return}
  if(code==='plotres'){try{lastPlot.forEach(p=>data.push({k:p.k,a:p.a,b:p.b,s:'Solution'}));if(typeof save==='function')save();if(typeof draw==='function')draw();window.scrollTo({top:0,behavior:'smooth'})}catch(e){}return}
  if(code.indexOf('t:')===0){const i=+code.slice(2);show(entryHTML(i,rank(KB[i][1].toLowerCase()).filter(x=>x.i!==i).slice(0,3)))}
}
const FALLBACK='<div class="mute" style="margin-top:6px">I could not match that to a topic. Pick one from “Geology Q&amp;A and structural interpretation” below, or use key terms, for example: “significance of low and high dip”, “how to write a geological history”, “types of fault”, “economic importance of sandstone”.</div>';
document.addEventListener('click',e=>{
  const el=e.target.closest?e.target.closest('[data-qa]'):null;
  if(el){qa(el.dataset.qa);return}
  const xe=e.target.closest?e.target.closest('[data-ex]'):null;
  if(xe){e.stopPropagation();$('sQ').value=xe.dataset.ex;$('sAsk').click();return}
  if(e.target.id==='sAsk'){const h=answer($('sQ').value,false);if(h){e.stopPropagation();e.preventDefault();show(h)}else setTimeout(()=>{if(/^I can solve:/.test(sOut.textContent)&&!/I could not match/.test(sOut.textContent))sOut.insertAdjacentHTML('beforeend',FALLBACK)},0)}
  else if(e.target.id==='tAsk'){const q=$('tQ')&&$('tQ').value,h=q?answer(q,true):null;if(h){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();$('sQ').value=q;show(h);card.scrollIntoView({block:'start'})}}
},true);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='sQ'){const h=answer(e.target.value,false);if(h){e.stopPropagation();e.preventDefault();show(h)}}},true);
})();
