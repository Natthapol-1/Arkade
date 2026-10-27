const fs=require('node:fs');
const rate=44100,duration=.28,n=Math.floor(rate*duration),samples=new Float64Array(n);let seed=7259,phase=0,peak=0;
for(let i=0;i<n;i++){
 const t=i/rate;seed=(1664525*seed+1013904223)>>>0;const noise=seed/2147483648-1;
 phase+=Math.PI*2*(145+210*Math.exp(-t*36))/rate;
 const attack=Math.min(1,t/.0018),tail=Math.min(1,(duration-t)/.025);
 const body=Math.sin(phase)*Math.exp(-t*17)*.65;
 const snap=noise*Math.exp(-t*80)*.4;
 const chime=(Math.sin(t*Math.PI*2*880)+.32*Math.sin(t*Math.PI*2*1333))*Math.exp(-t*15)*.32;
 samples[i]=Math.tanh((body+snap+chime)*3.2)*attack*tail;peak=Math.max(peak,Math.abs(samples[i]));
}
const out=Buffer.alloc(44+n*2);out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(n*2,40);
for(let i=0;i<n;i++)out.writeInt16LE(Math.round(samples[i]/peak*.97*32767),44+i*2);
fs.writeFileSync('public/sounds/prayerImpact-v2.wav',out);
