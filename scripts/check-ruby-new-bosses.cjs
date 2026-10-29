const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('C:/Users/Natthapol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const output = process.argv[2] || '.next/new-boss-checks'; fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const [name, options] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['mobile', { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }]]) {
      const page = await browser.newPage(options), errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:3000/ruby-star/endless?god=1', { waitUntil: 'networkidle', timeout: 60000 });
      await page.getByRole('button', { name: 'Close rules', exact: true }).click({ timeout: 1500 }).catch(() => {});
      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas:not([aria-hidden])'); let fiber = canvas[Object.keys(canvas).find(k => k.startsWith('__reactFiber'))];
        for (; fiber; fiber = fiber.return) for (let hook = fiber.memoizedState; hook; hook = hook.next) if (hook.memoizedState?.current?.gamePhase) {
          window.__encounter = hook.memoizedState.current; return true;
        } return false;
      });
      await page.evaluate(() => Object.assign(window.__encounter, { noMobs: true, noBossSpawns: true, godMode: true, meteoriteTimer: 100000 }));
      const bosses = page.getByRole('group', { name: 'Summon bosses', exact: true }); assert.equal(await bosses.getByRole('button').count(), 10);
      await bosses.getByRole('button', { name: 'Spawn AEGIS SENTINEL', exact: true }).click();
      assert.deepEqual(await page.evaluate(() => window.__encounter.enemies.map(e => e.type)), ['aegis_sentinel', 'aegis_construct', 'aegis_construct']);
      await page.evaluate(() => {
        const s = window.__encounter, boss = s.enemies[0]; s.godMode = false;
        Object.assign(boss, { tileX: 11, tileY: 10, targetTileX: 11, targetTileY: 10, x: 552, y: 504, stepProgress: 0, path: [], pathTimer: 100000, attackTimer: 100000 });
      });
      await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press('k'); await page.waitForFunction(() => window.__encounter.playerHP < 100);
      const hit = await page.evaluate(() => [window.__encounter.enemies[0].hp, window.__encounter.playerHP]);
      assert.ok(hit[0] > 89 && hit[0] < 90); assert.ok(hit[1] >= 96);
      await page.screenshot({ path: path.join(output, `sentinel-shield-${name}.png`) });
      const pylonId = await page.evaluate(() => {
        const s = window.__encounter, pylon = s.enemies[1], other = s.enemies[2]; s.playerHP = 100;
        for (const [enemy,x,y] of [[pylon,2,2],[other,40,40]]) Object.assign(enemy,{tileX:x,tileY:y,targetTileX:x,targetTileY:y,x:(x+.5)*48,y:(y+.5)*48,stepProgress:0});
        pylon.pylon.ageTicks = 1199; return pylon.id;
      });
      await page.waitForFunction(id => window.__encounter.enemies.find(e=>e.id===id)?.pylon.overloadTicks > 0, pylonId);
      await page.screenshot({path:path.join(output,`pylon-overload-warning-${name}.png`)});
      await page.waitForFunction(id => {const p=window.__encounter.enemies.find(e=>e.id===id);return p && (p.tileX!==2 || p.tileY!==2) && p.pylon.overloadTicks===0;},pylonId);
      assert.equal(await page.evaluate(()=>window.__encounter.playerHP),20);assert.equal(await page.evaluate(()=>window.__encounter.rubyHP),100);
      await page.screenshot({path:path.join(output,`pylon-overload-blast-${name}.png`)});

      await page.evaluate(() => { const s = window.__encounter; s.godMode = true; for (const enemy of s.enemies) if (enemy.type === 'aegis_construct') enemy.hp = 0; });
      await page.waitForFunction(() => !window.__encounter.enemies[0].aegis.shielded && window.__encounter.enemies[0].aegis.openAmount >= .99 && window.__encounter.enemies.length === 1);
      await page.screenshot({ path: path.join(output, `sentinel-exposed-${name}.png`) });
      await bosses.getByRole('button', { name: 'Spawn ASTRAL TWINS', exact: true }).click();
      assert.equal(await page.evaluate(() => window.__encounter.enemies.filter(e => e.twin).length), 2);
      await page.evaluate(() => {
        const s=window.__encounter;
        for(let i=1;i<=6;i++){s.map[10+i][10+i]=1;s.map[9+i][10+i]=1;s.map[10+i][9+i]=1;}
        for(const [enemy,x,y] of [[s.enemies[0],11,10],[s.enemies[1],16,16]])Object.assign(enemy,{tileX:x,tileY:y,targetTileX:x,targetTileY:y,x:(x+.5)*48,y:(y+.5)*48,stepProgress:0,path:[],pathTimer:100000,attackTimer:0});
      });
      await page.waitForFunction(()=>window.__encounter.encounterEffects.some(fx=>fx.kind==='melee'));
      await page.screenshot({path:path.join(output,`twin-melee-${name}.png`)});
      await page.waitForFunction(()=>window.__encounter.encounterEffects.some(fx=>fx.kind==='shot'));
      await page.screenshot({path:path.join(output,`twin-ranged-${name}.png`)});

      await page.evaluate(() => {
        const original=CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText=function(text,...args){
          if(this.font.includes('Press Start 2P')&&/^\d+$/.test(String(text)))window.__revivalNumber={text:String(text),font:this.font};
          return original.call(this,text,...args);
        };
      });
      await page.evaluate(() => {
        const s = window.__encounter;
        s.enemies.forEach((e, i) => Object.assign(e, { tileX: 11 + i * 2, tileY: 10, targetTileX: 11 + i * 2, targetTileY: 10,
          x: (11.5 + i * 2) * 48, y: 504, stepProgress: 0, path: [], pathTimer: 100000, attackTimer: 100000 }));
        s.enemies[0].hp = 0;
      });
      await page.waitForFunction(() => window.__encounter.enemies[0].twin.downedTicks > 0);
      assert.equal(await page.evaluate(() => window.__encounter.bossesKilled), 0);
      // The revival timer is the draining HP bar; no countdown number is drawn.
      const firstTicks=await page.evaluate(()=>window.__encounter.enemies[0].twin.downedTicks);
      await page.waitForFunction(t=>window.__encounter.enemies[0].twin.downedTicks < t - 30, firstTicks);
      assert.equal(await page.evaluate(()=>window.__revivalNumber), undefined);
      await page.screenshot({ path: path.join(output, `twins-downed-${name}.png`) });
      await page.evaluate(() => { const s = window.__encounter; s.enemies[1].hp = 1; s.laserCooldown = 0; });
      await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press('k'); await page.waitForFunction(() => window.__encounter.bossesKilled === 1 && window.__encounter.enemies.length === 0);
      await page.getByRole('button', { name: 'RULES', exact: true }).click();
      await page.getByRole('button', { name: 'ALIENS & BOSSES', exact: true }).click();
      assert.equal(await page.getByRole('heading', { name: 'AEGIS SENTINEL', exact: true }).count(), 1);
      assert.equal(await page.getByRole('heading', { name: 'ASTRAL TWINS', exact: true }).count(), 1);
      assert.deepEqual(errors, []); await page.close();
    }
    console.log('New bosses: desktop/mobile summons, reflected laser, shield opening, pylon overload/relocation/player-only damage, exposed core, twin revival timer bar, single completion reward, guide entries and browser errors passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
