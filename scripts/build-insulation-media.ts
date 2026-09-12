const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const sharp=require('sharp');
const ffmpeg=require('ffmpeg-static');
const sources=require('../media/insulation-photo-sources.json');

async function buildInsulationMedia(){
 const directory=path.join(__dirname,'..','media','generated');fs.mkdirSync(directory,{recursive:true});
 for(const [index,material] of sources.entries()){
  const source=path.join(__dirname,'..','media','source',material.key+'.source');
  if(!fs.existsSync(source))throw new Error('Download source photo first: '+material.key);
  const trimmed=await sharp(source).flatten({background:'#ffffff'}).trim({threshold:22}).png().toBuffer();
  await sharp(trimmed).resize(800,600,{fit:'contain',background:'#ffffff'}).jpeg({quality:92}).toFile(path.join(directory,material.key+'.jpg'));
  // The portrait frame is filled by the material, without decorative margins.
  const portrait=path.join(directory,material.key+'-portrait.png');
  const product=await sharp(trimmed).resize(680,620,{fit:'inside'}).png().toBuffer();
  const bounds=await sharp(product).metadata();
  await sharp({create:{width:780,height:1544,channels:3,background:'#ffffff'}}).composite([{input:product,left:Math.round((780-bounds.width)/2),top:130+Math.round((620-bounds.height)/2)}]).png().toFile(portrait);
  // Monotonic, subpixel zoom. Playback holds its last frame (no reverse or loop).
  const offset='0.04*(1-cos(PI*in/719))/2';
  const motion=`perspective=x0='-W*(${offset})':y0='-H*(${offset})':x1='W*(1+${offset})':y1='-H*(${offset})':x2='-W*(${offset})':y2='H*(1+${offset})':x3='W*(1+${offset})':y3='H*(1+${offset})':sense=destination:eval=frame:interpolation=cubic,format=yuv420p`;
  const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-loop','1','-framerate','60','-i',portrait,'-vf',motion,'-t','12','-an','-c:v','libx264','-preset','fast','-crf','20','-movflags','+faststart',path.join(directory,material.key+'.mp4')],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr||result.error?.message);
  const poster=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',path.join(directory,material.key+'.mp4'),'-frames:v','1',path.join(directory,material.key+'-poster.jpg')],{encoding:'utf8'});
  if(poster.status!==0)throw new Error(poster.stderr);
  console.log('Built image + 780x1544 MP4: '+material.key);
 }
}
buildInsulationMedia().catch(e=>{console.error(e.message);process.exit(1)});
