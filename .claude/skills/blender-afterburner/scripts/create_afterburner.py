"""Generate a jet-engine afterburner plume as a GLB for additive-blend AR display.

Run with Blender in background mode. Options come after `--`:
  Blender -b --python create_afterburner.py -- --out /path/model.glb [options]

Look (from a night photo of an afterburning nozzle):
  - amber/orange glow on the nozzle petals inside the exit
  - a white-hot blue core leaving the exit with a row of stationary shock diamonds (Mach discs)
  - a wide translucent blue plume that spreads and fades downstream

Everything is vertex-coloured "+" ribbons (bright thin core + wide soft halo), Unlit + additive
blending at runtime. Default style is straight: static axis-parallel ribbons carry the plume shape and the
stationary shock diamonds, and short bright streaks physically travel downstream (per-frame location keys,
fading at both ends so the wrap is invisible). --style helix swaps in the screw illusion (spinning helices).

Options (all optional). Defaults are the FIXED Marker3 look (2026-09-17): cylinder style, blue-white only, full
afterburner intensity, candle-tapered helix core + streaks, straight shimmer, 0.5-second loop at 60 fps.
Only the engine frame (--axis/--exit/--center/--exit-radius) normally needs changing.
  --out PATH            output GLB (default ./afterburner.glb next to this script)
  --axis X|Y|Z          exhaust axis; flow goes toward the positive direction (default X)
  --exit F              axial coordinate of the nozzle exit plane (default 7.7)
  --center U,V          the other two coordinates of the axis, in axis order Y,Z / X,Z / X,Y (default 0,2)
  --exit-radius F       inner radius of the nozzle at the exit (default 1.22)
  --wall-depth F        how far inside the exit the amber rings reach (default 1.1)
  --wall-taper F        radius increase per unit going back into the nozzle (default 0.175)
  --length F            length of the plume (default 11.5); the haze runs 15% further
  --core-length F       helix/cylinder core length as a fraction of --length (default 0.667)
  --core-taper candle|none  cylinder style: candle (default) narrows the helix core to a point at its end like a
                        candle flame, and the streak zone to a point at the end of the streak run (outer streaks
                        die where the cone gets too narrow for them). none keeps flat-ended cylinders.
                        The shimmer is never tapered
  --tail-length F       cylinder style: streak run and shimmer length as a multiple of --length (default 1.25, so
                        they trail a little past the tip of the helix core)
  --tail-radius F       multiplier on the streak zone and shimmer radii (default 0.9: a slightly slimmer cylinder
                        around the helix core)
  --core-radius F       multiplier on the helix radii (default 1.1: the outermost helices at the root reach ~0.86 of
                        the exit radius and just touch the streak zone). 1.0 leaves a thin dark gap around the core
  --diamonds N          number of shock diamonds (default 5), spaced --diamond-gap apart (default 1.2)
  --core R,G,B --core-hot R,G,B --core-deep R,G,B    core colours (blue / near white / deep blue)
  --amber R,G,B --amber-hot R,G,B --amber-deep R,G,B  nozzle glow colours
  --haze R,G,B --haze-deep R,G,B                    outer plume colours
  --core-count N --haze-count N                     trail counts (default 24 main + 16 faint + 14 streak; 14)
  --turns N             core spin turns per loop, integer (default 4; haze spins 2, nozzle 1)
  --seconds F --fps N   loop length and frame rate (default 0.5 s at 60 fps = 31 frames, full-power feel;
                        2 s at 30 fps for a calmer plume) --seed N
  --scale-widths F      multiply all ribbon widths (default 1.2). Raise if the plume looks thin
                        after the AR scale is applied; lower if it blooms into a blob
  --style cylinder|straight|helix
                        cylinder (default): the bright spinning-helix core of the helix style, but confined to a
                        straight cylinder of the exit radius (no flaring), plus short streaks racing through it
                        and a ring of heat shimmer wavering just outside the cylinder. Strongest centre light.
                        straight: axis-parallel moving puffs/streaks with spreading turbulence (no helices).
                        helix: the original flaring screw-illusion plume
  --streak-count N      moving streaks in straight style (default 44); --haze-streaks N slow wide ones drifting outside the plume (default 0; they read as loose blobs)
  --turb-count N        straight style: wide soft wavy puffs that travel and spread around the core (default 22)
  --shimmer-count N     cylinder/straight: pale wavy ribbons slowly rotating about the axis = heat haze (default 16)
  --body none|soft|lines  straight style body. none (default): nothing static at all; the white-hot mass is made of
                        --core-puffs N (default 28) wide soft puffs racing through the core (2 passes per loop).
                        soft = static halo-only ribbons merged into one mass; lines = thin static ribbons (fixed rods)
  --nozzle-glow 0|1     include the amber nozzle rings/wisps (default 0 = blue-white flame only)
  --intensity F         thrust feel (default 1.7 = full afterburner). Scales layer opacity, how far the
                        white-hot part reaches and the diamond strength; 1 for a mild plume

Output has one animation per spinning group; run finalize_glb.py afterwards to merge them into a
single named clip and flag the material KHR_materials_unlit.
"""
import bpy, math, random, sys
from pathlib import Path

# ----------------------------------------------------------------------------- options
def parse():
 argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
 opt={'out':str(Path(__file__).resolve().parent/'afterburner.glb'),'axis':'X','exit':7.7,'center':'0,2','exit_radius':1.22,
      'wall_depth':1.1,'wall_taper':0.175,'length':11.5,'core_length':0.667,'core_taper':'candle','tail_length':1.25,'core_radius':1.1,'tail_radius':0.9,'diamonds':5,'diamond_gap':1.2,
      'core':'0.45,0.72,1.0','core_hot':'0.92,0.96,1.0','core_deep':'0.15,0.35,1.0',
      'amber':'1.0,0.55,0.15','amber_hot':'1.0,0.88,0.55','amber_deep':'0.9,0.22,0.02',
      'haze':'0.25,0.5,1.0','haze_deep':'0.08,0.2,0.9',
      'core_count':'24,16,14','haze_count':14,'turns':4,'seconds':0.5,'fps':60,'seed':33,'scale_widths':1.2,'nozzle_glow':0,'intensity':1.7,'style':'cylinder','streak_count':44,'haze_streaks':0,'turb_count':22,'shimmer_count':16,'body':'none','core_puffs':28}
 i=0
 while i<len(argv):
  key=argv[i].lstrip('-').replace('-','_');val=argv[i+1];cur=opt.get(key)
  opt[key]=int(val) if isinstance(cur,int) and not isinstance(cur,bool) else float(val) if isinstance(cur,float) else val
  i+=2
 for k in ('core','core_hot','core_deep','amber','amber_hot','amber_deep','haze','haze_deep'):opt[k]=tuple(float(x) for x in opt[k].split(','))
 opt['center']=tuple(float(x) for x in opt['center'].split(','))
 opt['core_count']=tuple(int(x) for x in str(opt['core_count']).split(','))
 opt['axis']=opt['axis'].upper()
 return opt
O=parse();OUT=Path(O['out']);OUT.parent.mkdir(parents=True,exist_ok=True)
random.seed(O['seed'])

# ----------------------------------------------------------------------------- scene / material
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.fps=O['fps'];FRAMES=int(round(O['seconds']*O['fps']))+1;s.frame_start=1;s.frame_end=FRAMES

# Principled with vertex colour -> Base Color / Alpha: the only pattern the glTF exporter reliably
# turns into COLOR_0 (RGBA). Emission-shader / unlit patterns export white colours.
m=bpy.data.materials.new('Afterburner glow / vertex opacity');m.use_nodes=True
m.surface_render_method='BLENDED';m.use_transparency_overlap=False;m.use_backface_culling=False
nodes=m.node_tree.nodes;links=m.node_tree.links
bs=nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=1;bs.inputs['Specular IOR Level'].default_value=0
vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='GlowColor'
links.new(vc.outputs['Color'],bs.inputs['Base Color'])
links.new(vc.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=1
links.new(vc.outputs['Alpha'],bs.inputs['Alpha'])

# ----------------------------------------------------------------------------- geometry helpers
def lerp(a,b,t):return tuple(x+(y-x)*t for x,y in zip(a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def norm(v):
 l=math.sqrt(sum(x*x for x in v)) or 1;return tuple(x/l for x in v)
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])

AXIS_INDEX='XYZ'.index(O['axis'])
def place(along,u,v):
 """Root-local point from (axial distance, radial u, radial v) for the chosen axis."""
 if AXIS_INDEX==0:return (along,u,v)
 if AXIS_INDEX==1:return (v,along,u)
 return (u,v,along)
def root_location(along):
 c=O['center']
 if AXIS_INDEX==0:return (along,c[0],c[1])
 if AXIS_INDEX==1:return (c[0],along,c[1])
 return (c[0],c[1],along)
AX=[0,0,0];AX[AXIS_INDEX]=1

W=O['scale_widths'];I=O['intensity']
def op(v):return min(1,v*I)  # opacity scaled by intensity, clamped
def layers(color,hot,deep,R):
 """(width, opacity, colour_lo, colour_hi, edge_power) stacks: soft halo, body, bright core."""
 R*=W
 return {
  'main':[(.40*R,op(.09),deep,color,1.0),(.16*R,op(.22),color,color,1.5),(.04*R,op(.95),color,hot,2.0)],
  'faint':[(.24*R,op(.07),deep,color,1.2),(.03*R,op(.6),color,color,2.0)],
  'streak':[(.018*R,op(.7),color,hot,2.0),(.07*R,op(.14),deep,color,1.4)],
 }
AMBER=layers(O['amber'],O['amber_hot'],O['amber_deep'],0.7)
CORE=layers(O['core'],O['core_hot'],O['core_deep'],0.9)
hz,hd=O['haze'],O['haze_deep'];hh=lerp(hz,(1,1,1),.45)
# wide soft layers plus a hair-thin bright line (finalize_glb.py requires every mesh to reach alpha > 0.5)
HAZE=[(1.3*W,op(.10),hd,hz,1.2),(.5*W,op(.18),hz,lerp(hz,hh,.6),1.5)]  # halo only: no thin line that would read as a fixed rod
# soft body layers (straight style, --body soft): wide halos that overlap into a single glowing mass
SOFT={
 'main':[(.55*.9*W,op(.14),O['core_deep'],O['core'],1.2),(.26*.9*W,op(.30),O['core'],O['core_hot'],1.6)],
 'faint':[(.40*.9*W,op(.10),O['core_deep'],O['core'],1.3),(.18*.9*W,op(.22),O['core'],O['core_hot'],1.7)],
 'streak':[(.30*.9*W,op(.12),O['core_deep'],O['core'],1.3),(.12*.9*W,op(.26),O['core'],O['core_hot'],1.8)],
}

def comet_profile(pulses):
 """Asymmetric pulses along t: sharp head toward +t (downstream), long fading tail behind."""
 def f(t):
  v=0
  for centre,head,tail,power in pulses:
   d=t-centre;v+=power*math.exp(-d*d/(2*(head if d>0 else tail)**2))
  return min(1,v)
 return f
def periodic_profile(pulses):
 """Pulses on a closed ring (t wraps): (centre, sigma, power)."""
 def f(t):
  v=0
  for centre,sigma,power in pulses:
   d=(t-centre+.5)%1-.5;v+=power*math.exp(-d*d/(2*sigma*sigma))
  return min(1,v)
 return f
def random_pulses():
 return [(random.uniform(.05,.95),random.uniform(.03,.05),random.uniform(.12,.22),random.uniform(.75,1)) for _ in range(random.randint(2,3))]

def ribbon(name,point,stack,pulse,segments,fade=.08,closed=False,modulate=None):
 """'+' cross-section ribbon along point(t). closed joins the ends (use periodic_profile).
 modulate(t) -> (mix_to_hot, alpha_multiplier) shifts colour/opacity along the trail."""
 vs=[];fs=[];colors=[];across=[-1,-.6,0,.6,1];n=len(across);rows=segments if closed else segments+1
 for width,opacity,clo,chi,edge_pow in stack:
  base=len(vs)
  for k in range(rows):
   t=k/segments;c=point(t)
   tangent=norm(sub(point((t+1e-3)%1),point((t-1e-3)%1))) if closed else norm(sub(point(min(1,t+1e-3)),point(max(0,t-1e-3))))
   along=sum(c[i]*AX[i] for i in range(3))
   radial=norm(tuple(c[i]-AX[i]*along for i in range(3)));binormal=norm(cross(tangent,radial))
   p=pulse(t);w=width*(0.45+0.9*p);col=lerp(clo,chi,p)
   ends=1 if closed or fade<=0 else min(1,t/fade,(1-t)/fade)
   alpha=opacity*(0.18+0.82*p)*ends
   if modulate:
    mix,mul=modulate(t);col=lerp(col,chi,mix);alpha*=mul
   for direction in (radial,binormal):
    for u in across:
     vs.append(tuple(c[i]+direction[i]*u*w/2 for i in range(3)))
     colors.append((*col,alpha*(1-u*u)**edge_pow))
  for st in range(2):
   for k in range(segments):
    k1=(k+1)%segments if closed else k+1
    r0=base+(k*2+st)*n;r1=base+(k1*2+st)*n
    for j in range(n-1):fs.append((r0+j,r1+j,r1+j+1,r0+j+1))
 d=bpy.data.meshes.new(name);d.from_pydata(vs,[],fs);d.update();d.materials.append(m)
 o=bpy.data.objects.new(name,d);s.collection.objects.link(o)
 attr=d.color_attributes.new(name='GlowColor',type='FLOAT_COLOR',domain='POINT')
 for entry,c in zip(attr.data,colors):entry.color=c
 return o

def static_root(name,along):
 root=bpy.data.objects.new(name,None);s.collection.objects.link(root);root.location=root_location(along);return root

def travelling(o,offset,span,start,fade_in=.08,fade_out=.12,cycles=1):
 """Move object o along the axis from `start` over `span` once per loop (phase offset), scaling to zero at both
 ends so the wrap is invisible. Keyed every frame; the loop is seamless because phase(FRAMES)==phase(1)."""
 o.rotation_mode='XYZ'
 for frame in range(1,FRAMES+1):
  phase=(cycles*(frame-1)/(FRAMES-1)+offset)%1
  # local to the parent root, which already sits on the axis at the exit: only the axial offset moves
  o.location=place(start+span*phase,0,0)
  fade=min(1,phase/fade_in,(1-phase)/fade_out);o.scale=(fade,fade,fade)
  o.keyframe_insert(data_path='location',frame=frame);o.keyframe_insert(data_path='scale',frame=frame)

def spinning_root(name,along,turns):
 """Empty on the axis at `along` that turns `turns` times per loop (integer keeps the loop seamless)."""
 root=bpy.data.objects.new(name,None);s.collection.objects.link(root);root.location=root_location(along);root.rotation_mode='XYZ'
 for frame in (1,FRAMES):
  rot=[0,0,0];rot[AXIS_INDEX]=turns*2*math.pi*(frame-1)/(FRAMES-1)
  root.rotation_euler=rot;root.keyframe_insert(data_path='rotation_euler',frame=frame)
 return root

# Rotation about an axis by +rho increases the polar angle measured from the first radial coordinate
# toward the second. A helix angle = a0 + k*t with the group spinning by -turns therefore slides the
# pattern toward +t (downstream); see the screw-illusion note in SKILL.md.
EXIT=O['exit'];R_EXIT=O['exit_radius'];LENGTH=O['length'];CORE_LEN=LENGTH*O['core_length'];count=0
def flame_taper(t):
 """Radius multiplier along the core (t 0..1). candle: full at the exit, long taper to a point at the tip."""
 if O['style']!='cylinder' or O['core_taper']!='candle':return 1
 u=1-t;return math.sin(.5*math.pi*u**.85)*(1-.12*u)/.88

# ----------------------------------------------------------------------------- nozzle glow (optional)
nozzle=spinning_root('AB_Nozzle_Glow_Root',EXIT,1) if O['nozzle_glow'] else None
depth=O['wall_depth'];taper=O['wall_taper']
ring_specs=[]
for i in range(4):  # inside the wall, just under the surface
 x=-depth+depth*i/3.6;ring_specs.append((x,R_EXIT+(-x)*taper-.06,'main' if i%2==0 else 'faint'))
ring_specs+=[(.08,R_EXIT-.02,'main'),(.32,R_EXIT-.10,'main')]  # bright lip rings outside
for i,(x,r,kind) in enumerate(ring_specs if nozzle else []):
 def point(t,x=x,r=r):
  a=2*math.pi*t;return place(x,r*math.cos(a),r*math.sin(a))
 pulses=[(random.uniform(0,1),random.uniform(.06,.12),random.uniform(.7,1)) for _ in range(random.randint(3,5))]
 o=ribbon('AB_Nozzle_Ring_%02d'%i,point,AMBER[kind],periodic_profile(pulses),120,closed=True);o.parent=nozzle;count+=1
for i in range(6 if nozzle else 0):  # amber wisps curling out of the exit
 a0=2*math.pi*i/6
 def point(t,a0=a0):
  a=a0-2*math.pi*.35*t;r=R_EXIT-.25*t
  return place(-.6+1.4*t,r*math.cos(a),r*math.sin(a))
 o=ribbon('AB_Nozzle_Wisp_%02d'%i,point,AMBER['streak'],comet_profile([(.25,.08,.2,1)]),40);o.parent=nozzle;count+=1

# ----------------------------------------------------------------------------- core + shock diamonds
DIAMONDS=[(O['diamond_gap']*(k+.75),min(1,max(.3,1-.15*k)*I)) for k in range(O['diamonds'])]
def diamond_profile(extra):
 base=comet_profile(extra)
 def f(t):
  v=base(t)*.5+.35
  for dx,power in DIAMONDS:
   d=t-dx/CORE_LEN;v+=power*math.exp(-d*d/(2*.022**2))
  return min(1,v)
 return f
def core_modulate(t):return (max(0,1-t*2.8/I),max(.08,1-t)**(.9/I))  # white-hot at the exit, blue and thin downstream; intensity stretches both
def haze_modulate(t):return (0,1 if t<.15 else max(.05,(1-t)/.85)**1.6)
n_main,n_faint,n_streak=O['core_count']

if O['style'] in ('helix','cylinder'):
 # Screw illusion: helices wound with +angle, group spun by -turns => pattern slides to +t (downstream).
 core=spinning_root('AB_Core_Root',EXIT,-O['turns']);specs=[];CR=R_EXIT*O['core_radius']
 for j in range(n_main):specs.append((2*math.pi*j/n_main,random.uniform(3.0,3.8),random.uniform(.12,.62)*CR,'main'))
 for j in range(n_faint):specs.append((2*math.pi*(j+.5)/n_faint,random.uniform(2.6,4.2),random.uniform(.16,.5)*CR,'faint'))
 for j in range(n_streak):specs.append((random.uniform(0,2*math.pi),random.uniform(3.5,5),random.uniform(.5,.78)*CR,'streak'))
 flare=0 if O['style']=='cylinder' else .37*R_EXIT  # cylinder: constant radius, the plume stays inside the exit circle
 for a0,windings,r0,kind in specs:
  def point(t,a0=a0,windings=windings,r0=r0):
   a=a0+2*math.pi*windings*t;r=(r0+flare*t)*flame_taper(t)
   return place(CORE_LEN*t,r*math.cos(a),r*math.sin(a))
  o=ribbon('AB_Core_Trail_%02d'%count,point,CORE[kind],diamond_profile(random_pulses()),110,fade=.04,modulate=core_modulate);o.parent=core;count+=1
 if O['style']=='cylinder':
  # short bright streaks racing down the cylinder (same as straight style)
  travel=static_root('AB_Streak_Root',EXIT)
  TAIL=LENGTH*O['tail_length'];TR=O['tail_radius']  # streaks and shimmer run past the core tip, in a slimmer cylinder
  tapered=O['core_taper']=='candle'
  def streak_run(r0):
   # candle: the streak zone is a flame cone over TAIL; a streak at radius r0 stops where the cone narrows below it
   if not tapered:return TAIL
   f=r0/(.85*R_EXIT*TR)
   for k in range(200,-1,-1):
    t=k/200
    if flame_taper(t)>=f:return TAIL*t
   return TAIL*.2
  for j in range(O['streak_count']):
   a0=random.uniform(0,2*math.pi);r0=random.uniform(.08,.85)*R_EXIT*TR;length=random.uniform(1.0,2.2)*R_EXIT
   run=streak_run(r0)+length
   def point(t,a0=a0,r0=r0,length=length):return place(length*t,r0*math.cos(a0),r0*math.sin(a0))
   o=ribbon('AB_Streak_%02d'%j,point,CORE['streak'],comet_profile([(.8,.06,.35,1)]),16,fade=.15)
   o.parent=travel;travelling(o,random.uniform(0,1),run,-length*.5);count+=1
  # heat shimmer: pale wavy ribbons hugging the outside of the cylinder, two groups counter-rotating
  pale=lerp(hh,(1,1,1),.5)
  SHIMMER=[(1.6*W,op(.05),hz,pale,1.4),(.7*W,op(.09),lerp(hz,pale,.5),pale,1.8)]
  for turns,tag in [(1,'A'),(-1,'B')]:
   shim=spinning_root('AB_Shimmer_Root_%s'%tag,EXIT,turns)
   for j in range(O['shimmer_count']//2):
    a0=2*math.pi*j/(O['shimmer_count']//2)+random.uniform(-.2,.2);r0=random.uniform(1.0,1.25)*R_EXIT*TR
    waves=random.uniform(2.5,5);amp=random.uniform(.08,.18)*R_EXIT*TR;phi=random.uniform(0,2*math.pi)
    def point(t,a0=a0,r0=r0,waves=waves,amp=amp,phi=phi):
     r=r0+.12*R_EXIT*TR*t+amp*math.sin(2*math.pi*waves*t+phi);a=a0+.15*math.sin(2*math.pi*waves*t*.7+phi)
     return place(TAIL*t,r*math.cos(a),r*math.sin(a))
    o=ribbon('AB_Shimmer_%s_%02d'%(tag,j),point,SHIMMER,comet_profile([(random.uniform(.15,.45),.2,.3,1),(random.uniform(.55,.85),.15,.25,.7)]),90,fade=.08,modulate=haze_modulate)
    o.parent=shim;count+=1
 haze=spinning_root('AB_Haze_Root',EXIT,-2)
 for j in range(O['haze_count'] if O['style']=='helix' else 0):
  a0=2*math.pi*j/O['haze_count'];windings=random.uniform(1.2,2.0);r0=random.uniform(.65,.98)*R_EXIT
  def point(t,a0=a0,windings=windings,r0=r0):
   a=a0+2*math.pi*windings*t;r=r0+(1.15*t*t+.5*t)*R_EXIT
   return place(LENGTH*1.15*t,r*math.cos(a),r*math.sin(a))
  o=ribbon('AB_Haze_Trail_%02d'%j,point,HAZE,comet_profile([(random.uniform(.03,.12),.12,.25,1),(random.uniform(.3,.6),.15,.3,.8)]),70,fade=.06,modulate=haze_modulate)
  o.parent=haze;count+=1
else:
 # Straight style. Body: static axis-parallel ribbons (slightly diverging) carry the shape, the white-hot
 # region and the shock diamonds. Motion: short bright streaks travel downstream and fade at both ends.
 core=static_root('AB_Core_Root',EXIT);specs=[]
 if O['body']=='none':n_main=n_faint=n_streak=0  # no static geometry: everything in the plume moves
 for j in range(n_main):specs.append((2*math.pi*j/n_main+random.uniform(-.1,.1),random.uniform(.10,.62)*R_EXIT,'main'))
 for j in range(n_faint):specs.append((2*math.pi*(j+.5)/n_faint,random.uniform(.16,.55)*R_EXIT,'faint'))
 for j in range(n_streak):specs.append((random.uniform(0,2*math.pi),random.uniform(.5,.8)*R_EXIT,'streak'))
 for a0,r0,kind in specs:
  def point(t,a0=a0,r0=r0):
   r=r0+.30*R_EXIT*t;return place(LENGTH*t,r*math.cos(a0),r*math.sin(a0))
  body=SOFT if O['body']=='soft' else CORE
  o=ribbon('AB_Core_Trail_%02d'%count,point,body[kind],diamond_profile(random_pulses()),110,fade=.04,modulate=core_modulate);o.parent=core;count+=1
 # white-hot mass that moves: wide soft puffs hugging the axis, two passes per loop, bright near the exit
 PUFF=[(.9*W,op(.16),O['core'],O['core_hot'],1.3),(.42*W,op(.34),lerp(O['core'],O['core_hot'],.5),O['core_hot'],1.7)]
 puffs=static_root('AB_Puff_Root',EXIT)
 for j in range(O['core_puffs'] if O['body']=='none' else 0):
  a0=random.uniform(0,2*math.pi);r0=random.uniform(.05,.55)*R_EXIT;length=random.uniform(1.2,2.4)*R_EXIT;spread=random.uniform(.1,.35)*R_EXIT
  def point(t,a0=a0,r0=r0,length=length,spread=spread):
   r=r0+spread*t;return place(length*t,r*math.cos(a0),r*math.sin(a0))
  o=ribbon('AB_Puff_%02d'%j,point,PUFF,comet_profile([(random.uniform(.35,.65),.2,.3,1)]),20,fade=.18)
  o.parent=puffs;travelling(o,random.uniform(0,1),LENGTH*.75+length,-length*.4,.06,.45,cycles=2);count+=1
 travel=static_root('AB_Streak_Root',EXIT)
 for j in range(O['streak_count']):
  a0=random.uniform(0,2*math.pi);r0=random.uniform(.08,.85)*R_EXIT;length=random.uniform(1.0,2.2)*R_EXIT
  def point(t,a0=a0,r0=r0,length=length):return place(length*t,r0*math.cos(a0),r0*math.sin(a0))
  o=ribbon('AB_Streak_%02d'%j,point,CORE['streak'],comet_profile([(.8,.06,.35,1)]),16,fade=.15)
  o.parent=travel
  # streak starts inside the nozzle and leaves the visible plume before it wraps
  travelling(o,random.uniform(0,1),LENGTH*1.05+length,-length*.5);count+=1
 haze=static_root('AB_Haze_Root',EXIT)
 for j in range(O['haze_count'] if O['body']!='none' else 0):  # static envelope only when a static body is wanted
  a0=2*math.pi*j/O['haze_count']+random.uniform(-.15,.15);r0=random.uniform(.65,.98)*R_EXIT
  def point(t,a0=a0,r0=r0):
   r=r0+(1.15*t*t+.5*t)*R_EXIT;return place(LENGTH*1.15*t,r*math.cos(a0),r*math.sin(a0))
  o=ribbon('AB_Haze_Trail_%02d'%j,point,HAZE,comet_profile([(random.uniform(.03,.12),.12,.25,1),(random.uniform(.3,.6),.15,.3,.8)]),70,fade=.06,modulate=haze_modulate)
  o.parent=haze;count+=1

 # --- turbulent outer flow: wide, soft, wavy puffs that travel downstream while spreading outward ---
 TURB=[(2.4*W,op(.05),hd,hz,1.3),(1.1*W,op(.09),hz,lerp(hz,hh,.5),1.6)]
 turb=static_root('AB_Turb_Root',EXIT)
 for j in range(O['turb_count']):
  a0=random.uniform(0,2*math.pi);r0=random.uniform(.55,1.15)*R_EXIT;length=random.uniform(2.2,4.0)*R_EXIT
  waves=random.uniform(1.0,2.5);amp=random.uniform(.12,.3)*R_EXIT;phi=random.uniform(0,2*math.pi);spread=random.uniform(.5,1.1)*R_EXIT
  def point(t,a0=a0,r0=r0,length=length,waves=waves,amp=amp,phi=phi,spread=spread):
   r=r0+spread*t+amp*math.sin(2*math.pi*waves*t+phi);a=a0+.25*math.sin(2*math.pi*waves*t+phi+1.3)
   return place(length*t,r*math.cos(a),r*math.sin(a))
  o=ribbon('AB_Turb_%02d'%j,point,TURB,comet_profile([(random.uniform(.3,.6),.25,.35,1)]),28,fade=.2)
  o.parent=turb;travelling(o,random.uniform(0,1),LENGTH*1.2+length,-length*.3,.15,.3,cycles=random.choice([1,1,2]));count+=1

 # --- heat haze: pale, faint, wavy ribbons around the plume, two groups slowly counter-rotating so the
 #     outline wavers like hot air (no colour of its own; it borrows the core hue at very low alpha) ---
 pale=lerp(hh,(1,1,1),.5)
 SHIMMER=[(1.6*W,op(.05),hz,pale,1.4),(.7*W,op(.09),lerp(hz,pale,.5),pale,1.8)]
 for g,(turns,tag) in enumerate([(1,'A'),(-1,'B')]):
  shim=spinning_root('AB_Shimmer_Root_%s'%tag,EXIT,turns)
  for j in range(O['shimmer_count']//2):
   a0=2*math.pi*j/(O['shimmer_count']//2)+random.uniform(-.2,.2);r0=random.uniform(.8,1.3)*R_EXIT
   waves=random.uniform(2.5,5);amp=random.uniform(.08,.2)*R_EXIT;phi=random.uniform(0,2*math.pi)
   def point(t,a0=a0,r0=r0,waves=waves,amp=amp,phi=phi):
    r=r0+(1.0*t*t+.4*t)*R_EXIT+amp*math.sin(2*math.pi*waves*t+phi);a=a0+.15*math.sin(2*math.pi*waves*t*.7+phi)
    return place(LENGTH*1.2*t,r*math.cos(a),r*math.sin(a))
   o=ribbon('AB_Shimmer_%s_%02d'%(tag,j),point,SHIMMER,comet_profile([(random.uniform(.15,.45),.2,.3,1),(random.uniform(.55,.85),.15,.25,.7)]),90,fade=.08,modulate=haze_modulate)
   o.parent=shim;count+=1
 for j in range(O['haze_streaks']):  # slow, wide, faint streaks drifting through the outer plume
  a0=random.uniform(0,2*math.pi);r0=random.uniform(.9,1.6)*R_EXIT;length=random.uniform(2.0,3.5)*R_EXIT
  def point(t,a0=a0,r0=r0,length=length):return place(length*t,r0*math.cos(a0),r0*math.sin(a0))
  o=ribbon('AB_Haze_Streak_%02d'%j,point,HAZE,comet_profile([(.6,.15,.4,1)]),20,fade=.2)
  o.parent=haze;travelling(o,random.uniform(0,1),LENGTH*1.15+length,.6*R_EXIT,.15,.25);count+=1

# ----------------------------------------------------------------------------- export
for action in bpy.data.actions:
 for layer in action.layers:
  for st in layer.strips:
   for bag in st.channelbags:
    for fc in bag.fcurves:
     for key in fc.keyframe_points:key.interpolation='LINEAR'
s.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
 export_force_sampling=True,export_normals=False,export_texcoords=False,export_vertex_color='MATERIAL',export_all_vertex_colors=False,export_active_vertex_color_when_no_material=False)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT.with_suffix('.blend')))
print('AFTERBURNER_EXPORTED',OUT,'trails',count,'frames',FRAMES)
