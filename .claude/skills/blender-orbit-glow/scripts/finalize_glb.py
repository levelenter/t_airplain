"""Post-process a GLB from create_orbit_glow.py.

  python3 finalize_glb.py INPUT.glb [--clip NAME] [--copy-to DIR_OR_FILE]

- merges per-object animations into one clip (default name Orbit_Glow_Loop) starting at t=0
- flags every material KHR_materials_unlit + BLEND + doubleSided so three.js renders
  pure vertex colours (MeshBasicMaterial) without lighting
- validates loop seamlessness, finite values, index bounds, COLOR_0 alpha range
"""
import json,struct,math,shutil,sys
from pathlib import Path
args=sys.argv[1:];path=Path(args[0]);clip_name='Orbit_Glow_Loop';copy_to=None
for i,a in enumerate(args):
 if a=='--clip':clip_name=args[i+1]
 if a=='--copy-to':copy_to=Path(args[i+1])
blob=path.read_bytes()
assert blob[:4]==b'glTF' and struct.unpack_from('<I',blob,8)[0]==len(blob)
size=struct.unpack_from('<I',blob,12)[0];doc=json.loads(blob[20:20+size]);binary=bytearray(blob[28+size:])
clip={'name':clip_name,'channels':[],'samplers':[]}
for old in doc['animations']:
 offset=len(clip['samplers']);clip['samplers']+=old['samplers']
 for channel in old['channels']:channel['sampler']+=offset;clip['channels'].append(channel)
doc['animations']=[clip]
def values(index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
 code={5121:'B',5123:'H',5125:'I',5126:'f'}[a['componentType']];count={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
 fmt='<'+code*count;sz=struct.calcsize(fmt);start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',sz)
 assert start+(a['count']-1)*stride+sz<=v.get('byteOffset',0)+v['byteLength']<=len(binary)
 return [struct.unpack_from(fmt,binary,start+i*stride) for i in range(a['count'])]
shifted=set();duration=None
for sampler in clip['samplers']:
 index=sampler['input']
 if index in shifted:continue
 shifted.add(index);a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
 vals=values(index);start=v.get('byteOffset',0)+a.get('byteOffset',0)
 for k,row in enumerate(vals):struct.pack_into('<f',binary,start+k*v.get('byteStride',4),row[0]-vals[0][0])
 duration=round(vals[-1][0]-vals[0][0],4);a['min']=[0];a['max']=[duration]
for channel in clip['channels']:
 sampler=clip['samplers'][channel['sampler']];times=values(sampler['input']);track=values(sampler['output'])
 assert abs(times[0][0])<1e-5 and abs(times[-1][0]-duration)<1e-5 and channel['target']['path']=='rotation'
 assert all(abs(x-y)<1e-3 for x,y in zip(track[0],track[-1])) or all(abs(x+y)<1e-3 for x,y in zip(track[0],track[-1])),'loop not seamless'
assert not doc.get('images') and not doc.get('cameras')
doc.setdefault('extensionsUsed',[])
if 'KHR_materials_unlit' not in doc['extensionsUsed']:doc['extensionsUsed'].append('KHR_materials_unlit')
for material in doc['materials']:
 material.pop('emissiveFactor',None)
 material['pbrMetallicRoughness']={'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':1}
 material['alphaMode']='BLEND';material['doubleSided']=True;material['extensions']={'KHR_materials_unlit':{}}
for i in range(len(doc['accessors'])):assert all(math.isfinite(v) for row in values(i) for v in row)
for mesh in doc['meshes']:
 for primitive in mesh['primitives']:
  assert 'COLOR_1' not in primitive['attributes'] and 'COLOR_0' in primitive['attributes']
  assert max(row[0] for row in values(primitive['indices']))<doc['accessors'][primitive['attributes']['POSITION']]['count']
  a=doc['accessors'][primitive['attributes']['COLOR_0']];divisor={5121:255,5123:65535}.get(a['componentType'],1) if a.get('normalized') else 1
  alpha=[r[3]/divisor for r in values(primitive['attributes']['COLOR_0'])];assert min(alpha)==0 and max(alpha)>.5
raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*(-len(raw)%4)
output=struct.pack('<4sII',b'glTF',2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary
path.write_bytes(output)
if copy_to:shutil.copy2(path,copy_to)
report={'bytes':len(output),'meshes':len(doc['meshes']),'animation':clip_name,'duration':duration,'rotating_nodes':len(clip['channels']),'unlit_vertex_glow':'passed','seamless_loop':'passed'}
path.with_name('validation.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
