const fs=require('node:fs');
const path=require('node:path');
const sources=require('../media/insulation-photo-sources.json');
async function downloadInsulationPhotos(){
 const directory=path.join(__dirname,'..','media','source');fs.mkdirSync(directory,{recursive:true});
 for(const material of sources){
   const file=path.join(directory,material.key+'.source');
   if(fs.existsSync(file))continue;
   const response=await fetch(material.photo,{signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error(`${material.key}: HTTP ${response.status}`);
   if(!response.headers.get('content-type')?.startsWith('image/'))throw new Error('Expected image response');
   fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));console.log('Downloaded '+material.key);
 }
}
downloadInsulationPhotos().catch(e=>{console.error(e.message,e.cause?.code||'');process.exit(1)});
