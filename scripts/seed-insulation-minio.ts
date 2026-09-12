const { Client } = require('minio');
const fs = require('node:fs');
const path = require('node:path');

async function seedInsulationMinio() {
  const bucket = process.env.MINIO_BUCKET || 'insulation-materials';
  if (!process.env.MINIO_ROOT_PASSWORD) throw new Error('Create .env with MINIO_ROOT_PASSWORD');
  const client = new Client({endPoint:process.env.MINIO_ENDPOINT || '127.0.0.1',port:Number(process.env.MINIO_PORT || 9000),useSSL:false,accessKey:process.env.MINIO_ROOT_USER,secretKey:process.env.MINIO_ROOT_PASSWORD});
  if (!(await client.bucketExists(bucket))) await client.makeBucket(bucket);
  // Only this localhost bucket's public media can be read anonymously, never written.
  await client.setBucketPolicy(bucket,JSON.stringify({Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{AWS:['*']},Action:['s3:GetObject'],Resource:[`arn:aws:s3:::${bucket}/*`]}]}));
  const media = path.join(__dirname,'..','media','generated');
  for (const file of fs.readdirSync(media).filter(file=>/\.(jpg|mp4)$/.test(file))) {
    await client.fPutObject(bucket,file,path.join(media,file),{'Content-Type':file.endsWith('.mp4')?'video/mp4':'image/jpeg'});
    console.log(`Loaded ${bucket}/${file}`);
  }
}
seedInsulationMinio().catch(error=>{console.error(error.message);process.exit(1);});
