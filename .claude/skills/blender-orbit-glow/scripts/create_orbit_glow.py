"""Generate a glowing orbital light-trail effect (tilted luminous rings) as GLB.

Run with Blender in background mode. Options come after `--`:
  Blender -b --python create_orbit_glow.py -- --out /path/model.glb [options]

Options (all optional):
  --out PATH          output GLB path (default ./orbit_glow.glb next to this script)
  --color R,G,B       main glow colour 0..1 (default 0.22,1.0,0.45 = green)
  --core R,G,B        brightest core colour (default 0.88,1.0,0.92)
  --deep R,G,B        outer halo colour (default 0.05,0.75,0.35)
  --radius F          base radius of the main rings in Blender units (default 1.8)
  --center-z F        height of the orbit centre above the origin (default = radius*1.2)
  --main N            number of bright main rings (default 9)
  --faint N           number of faint inner rings (default 5)
  --streak N          number of hair-thin outer rings (default 6)
  --seconds F         loop length (default 4)
  --fps N             (default 30)
  --seed N            random seed (default 7)
  --precession F      whole-group turns per loop, integer keeps the loop seamless (default 1)
  --preview           also render preview.png next to the GLB (lit, reference only)

Output has one animation per object; run finalize_glb.py afterwards to merge them
into a single named clip and flag the material KHR_materials_unlit.
"""
import bpy, math, random, sys
from pathlib import Path

def parse():
 argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
 opt={'out':str(Path(__file__).resolve().parent/'orbit_glow.glb'),'color':'0.22,1.0,0.45','core':'0.88,1.0,0.92','deep':'0.05,0.75,0.35',
      'radius':1.8,'center_z':None,'main':9,'faint':5,'streak':6,'seconds':4.0,'fps':30,'seed':7,'precession':1.0,'preview':False}
 i=0
 while i<len(argv):
  key=argv[i].lstrip('-').replace('-','_')
  if key=='preview':opt[key]=True;i+=1;continue
  val=argv[i+1];cur=opt.get(key)
  opt[key]=int(val) if isinstance(cur,int) and not isinstance(cur,bool) else float(val) if isinstance(cur,float) or cur is None else val
  i+=2
 for k in ('color','core','deep'):opt[k]=tuple(float(x) for x in opt[k].split(','))
 if opt['center_z'] is None:opt['center_z']=opt['radius']*1.2
 return opt
O=parse();OUT=Path(O['out']);OUT.parent.mkdir(parents=True,exist_ok=True)
random.seed(O['seed'])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.fps=O['fps'];FRAMES=int(round(O['seconds']*O['fps']))+1;s.frame_start=1;s.frame_end=FRAMES
CENTER_Z=O['center_z'];GREEN=O['color'];WHITE=O['core'];DEEP=O['deep']

# Principled with vertex colour -> Base Color / Alpha: the only pattern the glTF exporter
# reliably turns into COLOR_0 (RGBA). Emission-shader/unlit patterns export white colours.
m=bpy.data.materials.new('Orbit glow / vertex opacity');m.use_nodes=True
m.surface_render_method='BLENDED';m.use_transparency_overlap=False;m.use_backface_culling=False
nodes=m.node_tree.nodes;links=m.node_tree.links
bs=nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=1;bs.inputs['Specular IOR Level'].default_value=0
vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='GlowColor'
links.new(vc.outputs['Color'],bs.inputs['Base Color'])
links.new(vc.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=1
links.new(vc.outputs['Alpha'],bs.inputs['Alpha'])

def lerp(a,b,t):return tuple(x+(y-x)*t for x,y in zip(a,b))
def pulse_profile(pulses):
 def f(th):
  v=0
  for phase,sigma,power in pulses:
   d=(th-phase+math.pi)%(2*math.pi)-math.pi
   v+=power*math.exp(-d*d/(2*sigma*sigma))
  return min(1,v)
 return f

def ring_mesh(name,a,b,layers,pulse,segments=180):
 """Closed ribbon loop in local XY. layers: (width, opacity, colour_lo, colour_hi, edge_power, cross)."""
 vs=[];fs=[];colors=[];across=[-1,-.6,0,.6,1];n=len(across)
 for width,opacity,clo,chi,edge_pow,cross in layers:
  base=len(vs)
  for k in range(segments):
   th=2*math.pi*k/segments
   c=(a*math.cos(th),b*math.sin(th),0);radial=(math.cos(th),math.sin(th),0);up=(0,0,1)
   p=pulse(th);w=width*(0.45+0.9*p);col=lerp(clo,chi,p);alpha=opacity*(0.18+0.82*p)
   for axis in (radial,up) if cross else (radial,):
    for u in across:
     vs.append(tuple(c[i]+axis[i]*u*w/2 for i in range(3)))
     colors.append((*col,alpha*(1-u*u)**edge_pow))
  strips=2 if cross else 1
  for st in range(strips):
   for k in range(segments):
    r0=base+(k*strips+st)*n;r1=base+(((k+1)%segments)*strips+st)*n
    for j in range(n-1):fs.append((r0+j,r1+j,r1+j+1,r0+j+1))
 d=bpy.data.meshes.new(name);d.from_pydata(vs,[],fs);d.update();d.materials.append(m)
 o=bpy.data.objects.new(name,d);s.collection.objects.link(o)
 attr=d.color_attributes.new(name='GlowColor',type='FLOAT_COLOR',domain='POINT')
 for entry,c in zip(attr.data,colors):entry.color=c
 return o

root=bpy.data.objects.new('Orbit_Root',None);s.collection.objects.link(root);root.location=(0,0,CENTER_Z)
R=O['radius']/1.8  # widths scale with radius so the look is size-independent
def add_ring(i,radius,ecc,tilt,turns,kind):
 pulses=[(random.uniform(0,2*math.pi),random.uniform(.35,.9),random.uniform(.7,1)) for _ in range(random.randint(2,3))]
 a=radius*(1+ecc);b=radius*(1-ecc)
 if kind=='main':layers=[(.40*R,.09,DEEP,GREEN,1.0,True),(.16*R,.22,GREEN,GREEN,1.5,True),(.04*R,.95,GREEN,WHITE,2.0,True)]
 elif kind=='faint':layers=[(.24*R,.07,DEEP,GREEN,1.2,True),(.03*R,.6,GREEN,GREEN,2.0,True)]
 else:layers=[(.018*R,.7,GREEN,WHITE,2.0,True),(.07*R,.14,DEEP,GREEN,1.4,True)]
 tiltE=bpy.data.objects.new('Orbit_Tilt_%02d'%i,None);s.collection.objects.link(tiltE);tiltE.parent=root;tiltE.rotation_euler=tilt
 o=ring_mesh('Orbit_Ring_%02d'%i,a,b,layers,pulse_profile(pulses));o.parent=tiltE;o.rotation_mode='XYZ'
 start=random.uniform(0,2*math.pi)
 for frame in (1,FRAMES):
  o.rotation_euler=(0,0,start+turns*2*math.pi*(frame-1)/(FRAMES-1));o.keyframe_insert(data_path='rotation_euler',frame=frame)

specs=[]
n_main=O['main']
for i in range(n_main):  # fibonacci-sphere normals: evenly spread tilts
 y=1-2*(i+.5)/n_main;r=math.sqrt(1-y*y);phi=i*2.399963;nx,ny,nz=r*math.cos(phi),y,r*math.sin(phi)
 tilt=(math.acos(max(-1,min(1,nz)))+random.uniform(-.15,.15),0,math.atan2(ny,nx)+math.pi/2+random.uniform(-.2,.2))
 specs.append((O['radius']*random.uniform(.86,1.11),random.uniform(0,.12),tilt,random.choice([1,-1,1,-1,2]),'main'))
for i in range(O['faint']):
 specs.append((O['radius']*random.uniform(.67,.89),random.uniform(.05,.2),(random.uniform(0,math.pi),0,random.uniform(0,2*math.pi)),random.choice([1,-1]),'faint'))
for i in range(O['streak']):
 specs.append((O['radius']*random.uniform(1.11,1.39),random.uniform(.15,.35),(random.uniform(0,math.pi),0,random.uniform(0,2*math.pi)),random.choice([1,-1,2,-2]),'streak'))
for i,spec in enumerate(specs):add_ring(i,*spec)
root.rotation_mode='XYZ'
for frame in (1,FRAMES):
 root.rotation_euler=(0,0,O['precession']*2*math.pi*(frame-1)/(FRAMES-1));root.keyframe_insert(data_path='rotation_euler',frame=frame)
for action in bpy.data.actions:
 for layer in action.layers:
  for st in layer.strips:
   for bag in st.channelbags:
    for fc in bag.fcurves:
     for key in fc.keyframe_points:key.interpolation='LINEAR'
s.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
 export_force_sampling=True,export_normals=False,export_texcoords=False,export_vertex_color='MATERIAL',export_all_vertex_colors=False,export_active_vertex_color_when_no_material=False)
print('ORBIT_GLOW_EXPORTED',OUT,'rings',len(specs),'frames',FRAMES)
if O['preview']:
 s.view_settings.view_transform='Standard'
 w=bpy.data.worlds.get('World') or bpy.data.worlds.new('World');s.world=w;w.use_nodes=True
 w.node_tree.nodes['Background'].inputs['Color'].default_value=(0,0,0,1)
 cam=bpy.data.objects.new('Cam',bpy.data.cameras.new('Cam'));s.collection.objects.link(cam)
 cam.location=(0,-O['radius']*5.3,CENTER_Z+O['radius']*.65);cam.rotation_euler=(math.radians(83),0,0);s.camera=cam
 s.render.resolution_x=800;s.render.resolution_y=800;s.frame_set(FRAMES//4);s.render.filepath=str(OUT.with_name('preview.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT.with_suffix('.blend')))
