const fs = require('fs');
const ts = require('typescript');
const { createCanvas } = require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const source = fs.readFileSync('app/ruby-star/page.tsx','utf8');
const glyphSource = source.slice(source.indexOf('const PRAYER_GLYPHS'),source.indexOf('function drawPrayerCircle('));
const glyph = new Function(ts.transpileModule(glyphSource,{compilerOptions:{target:ts.ScriptTarget.ES2017}}).outputText+';return drawPrayerGlyph;')();
function rect(ctx,color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function poly(ctx,color,points){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function outline(ctx,color,points,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function diamond(ctx,color,x,y,r){poly(ctx,color,[[x,y-r],[x+r,y],[x,y+r],[x-r,y]]);}
function motes(ctx,color,count,rx,ry){for(let i=0;i<count;i++){const a=i*2.399+0.4;ctx.globalAlpha=.25+(i%3)*.16;rect(ctx,color,Math.round(Math.cos(a)*rx),Math.round(Math.sin(a)*ry),i%3?2:3,i%3?2:3);}ctx.globalAlpha=1;}
function queen(ctx){
 const purple='#bb45ed',light='#efbdff';
 ctx.shadowColor=purple;ctx.shadowBlur=5;
 // A segmented royal mantle, translucent like the live boss's ornaments.
 poly(ctx,'#71349455',[[-23,-19],[-35,-17],[-39,6],[-34,6],[-37,33],[-20,38],[-15,27],[15,27],[20,38],[37,33],[34,6],[39,6],[35,-17],[23,-19]]);
 outline(ctx,'#a753cf99',[[-23,-19],[-35,-17],[-39,6],[-34,6],[-37,33],[-20,38]],1);
 outline(ctx,'#a753cf99',[[23,-19],[35,-17],[39,6],[34,6],[37,33],[20,38]],1);
 ctx.shadowBlur=0;
 rect(ctx,'#8a24ad',-27,-24,54,51);rect(ctx,'#3c1557',-23,-20,46,43);
 // Stepped silver inlay and an uneven veil distinguish the queen from a plain armored box.
 rect(ctx,'#71228b',-21,-18,8,39);rect(ctx,'#622078',15,-17,6,37);
 for(const side of [-1,1]){rect(ctx,light,side*23-1,-22,2,9);rect(ctx,'#9b5db1',side*23-1,10,2,10);diamond(ctx,'#d87dff',side*32,-6,4);}
 // Three alien jewel eyes, triangular placement, unequal sizes.
 rect(ctx,'#1f102e',-18,-13,16,13);rect(ctx,'#1f102e',6,-15,13,15);
 rect(ctx,light,-16,-11,12,9);rect(ctx,light,8,-13,9,11);
 rect(ctx,'#9d20c5',-12,-10,4,7);rect(ctx,'#a62dd1',11,-11,3,8);
 diamond(ctx,light,0,5,7);diamond(ctx,'#c941f0',0,5,4);rect(ctx,'#fff3ff',-1,2,2,3);
 // A long diamond seal instead of a conventional mouth.
 diamond(ctx,'#251034',0,20,8);diamond(ctx,'#d482f6',0,19,5);rect(ctx,'#efbdff',-1,15,2,5);
 // Branching tiara, different from the King's broad crown.
 rect(ctx,'#8642aa',-20,-29,40,5);rect(ctx,light,-17,-32,3,8);rect(ctx,light,13,-34,3,10);
 rect(ctx,'#c66ce8',-4,-40,8,14);diamond(ctx,light,0,-42,5);
 rect(ctx,'#9d4dbb',-26,-35,5,9);rect(ctx,'#9d4dbb',21,-37,5,11);
 for(const [x,y] of [[-28,-42],[26,-45],[-42,16],[40,22]])diamond(ctx,'#e9b1ff',x,y,2);
 for(let i=0;i<5;i++)rect(ctx,i%2?'#71228b':'#ac3bd3',-20+i*8,27,6,4+(i%2)*4);
 motes(ctx,'#cf72f2',12,45,46);
}
function reaper(ctx){
 const mint='#52ffd6';
 // Offset angular blade arms point in opposite directions, framing a split diamond mask.
 poly(ctx,'#0c645b',[[-14,-16],[-32,-38],[-29,-19],[-47,-6],[-25,-9],[-19,7]]);
 poly(ctx,'#0c645b',[[14,16],[32,38],[29,19],[47,6],[25,9],[19,-7]]);
 outline(ctx,'#80ffe0',[[-30,-33],[-28,-17],[-41,-8]],2);
 outline(ctx,'#80ffe0',[[30,33],[28,17],[41,8]],2);
 ctx.shadowColor=mint;ctx.shadowBlur=5;
 diamond(ctx,'#2bd1ad',0,0,30);ctx.shadowBlur=0;diamond(ctx,'#063d38',0,0,24);
 // Split armored face with staggered eyes and a jagged, lightning-like seam.
 poly(ctx,'#126f60',[[-17,-5],[-5,-19],[2,-13],[-6,-4],[2,4],[-7,15],[-18,5]]);
 poly(ctx,'#155a50',[[8,-17],[19,-5],[19,4],[7,18],[0,11],[7,3],[-1,-5]]);
 outline(ctx,'#96ffe2',[[0,-23],[-5,-13],[3,-6],[-3,2],[5,8],[0,18]],2);
 rect(ctx,'#e1fff2',-16,-6,11,5);rect(ctx,'#e1fff2',9,-2,5,10);
 rect(ctx,'#06342e',-13,-5,3,3);rect(ctx,'#06342e',10,2,3,3);
 rect(ctx,'#80fbd5',-8,9,4,3);rect(ctx,'#80fbd5',-3,13,3,3);
 // Broken electrical orbit stays away from the face.
 outline(ctx,'#38b79877',[[-8,-47],[-39,-20],[-46,4],[-33,30],[-9,44]],1);
 outline(ctx,'#38b79877',[[8,47],[39,20],[46,-4],[33,-30],[9,-44]],1);
 for(const [x,y]of [[-37,-18],[35,22],[-15,39],[17,-39]])outline(ctx,'#bdffe9',[[x-3,y-4],[x+2,y],[x-2,y+2],[x+3,y+5]],1.5);
 motes(ctx,mint,8,49,44);
}
function devourer(ctx){
 const purple='#7135a7',green='#b0ea64';
 // An uneven fused block mass, with an offset jaw and swallowed faces trapped in its sides.
 rect(ctx,'#422154',-29,-25,58,54);rect(ctx,'#592773',-38,-12,10,23);rect(ctx,'#592773',27,-19,11,21);
 rect(ctx,'#55245f',22,10,14,22);rect(ctx,'#55245f',-34,21,14,12);
 rect(ctx,purple,-25,-22,50,48);rect(ctx,'#331840',-20,-17,40,38);
 rect(ctx,'#8a47b1',-29,-16,4,25);rect(ctx,'#8a47b1',25,-13,5,18);
 rect(ctx,'#a7d45c',-33,4,3,9);rect(ctx,'#8fbc45',30,-14,3,10);
 // Thick neck of the eye socket rises out of the body rather than a small face decal.
 rect(ctx,'#7135a7',-15,-31,19,12);rect(ctx,'#1a2520',-14,-24,21,23);
 ctx.shadowColor=green;ctx.shadowBlur=4;rect(ctx,green,-11,-21,15,17);ctx.shadowBlur=0;
 rect(ctx,'#223526',-7,-17,7,9);rect(ctx,'#eeffd1',-10,-20,4,4);
 // Wide, uneven maw with individually spaced blunt fangs.
 rect(ctx,'#1a1123',-20,4,43,20);rect(ctx,'#acdb62',-22,2,45,3);
 for(const[x,y,h]of [[-17,5,8],[-8,5,5],[1,5,9],[12,5,6]])rect(ctx,green,x,y,5,h);
 for(const[x,y,h]of [[-13,17,6],[-3,16,7],[9,19,5],[18,14,8]])rect(ctx,'#d5f59b',x,y,4,h);
 rect(ctx,'#613173',-22,25,32,7);rect(ctx,'#8c4ca4',-18,30,17,4);
 // Embedded little eyes belong to absorbed creatures, keeping the corruption theme readable.
 rect(ctx,'#1c1824',28,15,7,7);rect(ctx,'#afdf68',29,16,2,2);rect(ctx,'#afdf68',33,18,2,2);
 rect(ctx,'#1c1824',-35,-7,6,8);rect(ctx,'#b5d77d',-34,-5,2,2);
 rect(ctx,'#6d337f',14,-33,7,12);rect(ctx,'#8c4ca4',18,-36,4,8);
 rect(ctx,'#6d337f',-29,-31,6,12);
 // Tiny square soul motes, not organic tendrils or circular blobs.
 for(const[x,y]of [[-45,-27],[39,-37],[45,35]]){rect(ctx,'#74a33d',x,y,6,7);rect(ctx,'#17231d',x+1,y+2,1,2);rect(ctx,'#17231d',x+4,y+2,1,2);}
 motes(ctx,'#9ed55a',9,47,43);
}
function warden(ctx){
 const ice='#a7ddf4',white='#e7f6ff';
 // Large transparent shoulder crystals, darker facets keep the central face visible.
 poly(ctx,'#88cbe64d',[[-23,-15],[-38,-26],[-41,-7],[-33,10],[-23,14]]);
 poly(ctx,'#bceaff55',[[23,-13],[36,-23],[41,-3],[31,18],[23,14]]);
 outline(ctx,'#c7efff99',[[-23,-15],[-38,-26],[-41,-7],[-33,10]],1);
 outline(ctx,'#c7efff99',[[23,-13],[36,-23],[41,-3],[31,18]],1);
 ctx.shadowColor=ice;ctx.shadowBlur=3;rect(ctx,'#76bfdc',-26,-23,52,49);ctx.shadowBlur=0;
 rect(ctx,'#214659',-22,-19,44,41);
 poly(ctx,'#426b80',[[-22,-19],[-5,-19],[-13,-8],[-22,-4]]);
 poly(ctx,'#34586e',[[22,-19],[22,19],[13,8],[17,-1],[9,-12]]);
 rect(ctx,'#b5e1f0',-26,-23,21,3);rect(ctx,'#d9f5ff',23,-8,3,23);
 // A crystalline spiral eye remains the distinctive face anchor, with a smaller offset frost eye.
 rect(ctx,'#acdcec',-14,-12,21,19);rect(ctx,'#18384b',-11,-9,15,13);
 rect(ctx,'#daf5ff',-8,-6,9,7);rect(ctx,'#275268',-5,-4,5,4);rect(ctx,'#daf5ff',-3,-3,2,2);
 rect(ctx,'#e7f6ff',12,-7,5,9);rect(ctx,'#31556a',13,-4,3,4);
 rect(ctx,'#143548',-12,12,26,7);
 for(const[x,h]of [[-10,6],[-1,9],[8,5]])rect(ctx,white,x,12,4,h);
 // Three icicle horns have distinct heights, with darker inner crystal facets.
 poly(ctx,ice,[[-21,-21],[-20,-36],[-16,-43],[-11,-27],[-8,-21]]);
 poly(ctx,white,[[-6,-23],[-4,-44],[2,-51],[7,-28],[10,-23]]);
 poly(ctx,'#a6d8ee',[[13,-21],[15,-34],[21,-40],[23,-25],[26,-21]]);
 outline(ctx,'#6fb3cd',[[-3,-40],[1,-30],[2,-24]],1);
 // Short stepped ice skirt and restrained orbiting shards.
 poly(ctx,'#9bd4e966',[[-22,25],[-17,37],[-10,30],[-3,40],[5,31],[14,36],[22,25]]);
 for(const[x,y]of [[-43,24],[39,29],[-38,-39],[38,-38]]){diamond(ctx,'#badfed99',x,y,5);outline(ctx,'#e5f8ff',[[x,y-5],[x-2,y],[x,y+5]],1);}
 motes(ctx,'#b8e8fb',9,49,44);
}
function prayer(ctx){
 const gold='#ffdd22';
 // Retain the original oval halo, now with small scripture fragments around its light.
 ctx.shadowColor=gold;ctx.shadowBlur=5;
 rect(ctx,gold,-16,-48,32,3);rect(ctx,gold,-21,-45,7,3);rect(ctx,gold,14,-45,7,3);
 rect(ctx,gold,-21,-42,3,5);rect(ctx,gold,18,-42,3,5);rect(ctx,gold,-18,-37,12,3);rect(ctx,gold,1,-37,17,3);ctx.shadowBlur=0;
 // Translucent border extensions and close horn stubs preserve the established design.
 poly(ctx,'#ffdd2238',[[-14,-32],[14,-32],[14,-26],[24,-26],[24,-20],[-24,-20],[-24,-26],[-14,-26]]);
 outline(ctx,'#ffdd2280',[[-24,-20],[-24,-26],[-14,-26],[-14,-32],[14,-32],[14,-26],[24,-26],[24,-20]],1);
 poly(ctx,'#ffdd2238',[[-24,25],[24,25],[17,32],[8,32],[8,38],[-8,38],[-8,32],[-17,32]]);
 outline(ctx,'#ffdd2280',[[-24,25],[-17,32],[-8,32],[-8,38],[8,38],[8,32],[17,32],[24,25]],1);
 for(const side of [-1,1]){rect(ctx,'#0b0a08',side*25-3,-28,6,12);rect(ctx,'#b89b2a',side*27-2,-33,3,7);}
 rect(ctx,'#bda02f',-28,-21,56,48);rect(ctx,'#37342c',-25,-18,50,42);
 rect(ctx,'#27251e',-22,-15,6,34);rect(ctx,'#27251e',17,-15,5,34);
 // The old language remains bold, central, and white; no replacement mouth or visible pupils.
 for(let i=0;i<3;i++){ctx.save();ctx.translate((i-1)*14,13);ctx.scale(.85,.85);glyph(ctx,i,0,0);ctx.restore();}
 // Single ancient wrap, with faint closed lids, subtle fabric edges and a short loose tail.
 rect(ctx,'#cfb965',-24,-13,48,13);
 for(const x of [-14,0,14]){rect(ctx,'#211b08',x-5,-8,2,2);rect(ctx,'#211b08',x-3,-6,6,2);rect(ctx,'#211b08',x+3,-8,2,2);}
 rect(ctx,'rgba(0,0,0,.85)',-29,-13,58,13);rect(ctx,'#554b2e',-27,-13,54,1);
 rect(ctx,'#15130e',27,-10,7,7);rect(ctx,'#252017',31,-5,5,11);
 // Restrained gold reliquary clasps at the edges, rather than a second bright face border.
 for(const side of [-1,1]){rect(ctx,'#e3c54b',side*25-1,3,2,5);rect(ctx,'#8f7b2b',side*25-1,12,2,4);rect(ctx,gold,side*25-2,22,4,3);}
 rect(ctx,'#9a842b',-14,26,28,2);
 // Black sin fragments under the relic and a sparse yellow aura.
 rect(ctx,'#12110d',-12,41,4,4);rect(ctx,'#12110d',7,43,4,6);
 motes(ctx,gold,14,44,48);
 ctx.globalAlpha=.45;glyph(ctx,1,-35,-36);ctx.globalAlpha=.35;glyph(ctx,2,34,-32);ctx.globalAlpha=1;
}
const canvas=createCanvas(1380,1010),ctx=canvas.getContext('2d');
ctx.fillStyle='#0a1019';ctx.fillRect(0,0,1380,1010);ctx.fillStyle='#dce5ec';ctx.font='24px monospace';ctx.textAlign='center';ctx.fillText('PROPOSED BOSS REMODELS',690,40);ctx.fillStyle='#80909f';ctx.font='14px monospace';ctx.fillText('PREVIEW ONLY — YOUR LIVE DESIGNS ARE UNCHANGED',690,67);
const cards=[['SHADOW QUEEN','#cd6ce9','JEWEL MASK / ROYAL MANTLE',queen,10,90],['STORM REAPER','#52ffd6','SPLIT DIAMOND / ELECTRIC BLADES',reaper,470,90],['SOUL DEVOURER','#b0da70','FUSED SOULS / HUNGRY JAW',devourer,930,90],['FROST WARDEN','#b9eaff','CRYSTAL ARMOR / VISIBLE ICE FACE',warden,240,550],['BLIND PRAYER','#ffdd22','ANCIENT WRAP / WHITE SCRIPTURE',prayer,700,550]];
for(const [name,color,tag,draw,x,y]of cards){ctx.fillStyle='#111923';ctx.fillRect(x,y,440,435);ctx.strokeStyle='#ffffff13';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,439,434);ctx.fillStyle=color;ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(name,x+220,y+35);ctx.save();ctx.translate(x+220,y+236);ctx.scale(2.8,2.8);draw(ctx);ctx.restore();ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.fillStyle='#8494a5';ctx.font='12px monospace';ctx.fillText(tag,x+220,y+406);}
fs.writeFileSync('C:/Users/Natthapol/.codex/visualizations/2026/10/25/01a1710d-8902-7891-8f20-02bf0449228a/proposed-boss-remodels.png',canvas.toBuffer('image/png'));
