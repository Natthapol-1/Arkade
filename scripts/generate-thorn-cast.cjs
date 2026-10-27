const fs=require('node:fs');
const rate=44100,duration=.8,n=Math.floor(rate*duration),data=new Float64Array(n);let seed=9713,low=0,phase=0,peak=0;
for(let i=0;i<n;i++){
 const t=i/rate,p=t/duration;seed=(1664525*seed+1013904223)>>>0;const noise=seed/2147483648-1;
 low+=.075*(noise-low);phase+=Math.PI*2*(100+105*p*p)/rate;
 const envelope=Math.sin(Math.PI*p)**.65;
 const rustle=low*(.5+.5*Math.sin(t*44)**2)*.9;
 let cracks=0;for(const onset of [.035,.14,.26,.39,.55]){const age=t-onset;if(age>=0)cracks+=(noise-low)*Math.exp(-age*100)*.22;}
 const hum=Math.sin(phase)*.16*envelope;
 data[i]=(rustle*envelope+cracks+hum)*Math.min(1,t/.008)*Math.min(1,(duration-t)/.05);peak=Math.max(peak,Math.abs(data[i]));
}
const wav=Buffer.alloc(44+n*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);
for(let i=0;i<n;i++)wav.writeInt16LE(Math.round(data[i]/peak*.88*32767),44+i*2);
fs.writeFileSync('public/sounds/thornCast.wav',wav);
