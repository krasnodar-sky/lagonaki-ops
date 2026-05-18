import { DateTime } from 'luxon';
const TZ = process.env.REPORT_TZ || 'Europe/Moscow';
const inPeriod = (dateStr, p) => {
  if (!dateStr) return false;
  let d; const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) d = DateTime.fromISO(s, { zone: TZ });
  else d = DateTime.fromFormat(s.slice(0, 10), 'dd.MM.yyyy', { zone: TZ });
  return d.isValid && d >= p.start && d <= p.end;
};
export function buildReport({ objects, goods, ops, income, repair, supply, dashboard }, period, prevPeriod, prevData) {
  const sales = ops.filter(r => r[1] === 'sale' && inPeriod(r[0], period));
  const writeoffs = ops.filter(r => r[1] === 'writeoff' && inPeriod(r[0], period));
  const isQ = sku => String(sku||'').startsWith('Q');
  const isF = sku => String(sku||'').startsWith('F');
  const revenueQUMMY = sumBy(sales.filter(r=>isQ(r[3])), r=>Number(r[7])||0);
  const revenueFOODBOX = sumBy(sales.filter(r=>isF(r[3])), r=>Number(r[7])||0);
  const revenueTotal = revenueQUMMY + revenueFOODBOX;
  const adminSalary = revenueQUMMY*0.10 + revenueFOODBOX*0.20;
  const goodsMap = new Map(goods.map(g=>[g[0],{name:g[1],price:Number(g[4])||0,cost:Number(g[5])||0}]));
  const perItem = new Map();
  for (const s of sales) {
    const sku=s[3],qty=Number(s[5])||0,total=Number(s[7])||0;
    const g=goodsMap.get(sku); if(!g)continue;
    const cur=perItem.get(sku)||{name:g.name,qty:0,revenue:0,margin:0};
    cur.qty+=qty; cur.revenue+=total; cur.margin+=(g.price-g.cost)*qty;
    perItem.set(sku,cur);
  }
  const topByMargin=[...perItem.values()].sort((a,b)=>b.margin-a.margin).slice(0,5);
  const topByQty=[...perItem.values()].sort((a,b)=>b.qty-a.qty).slice(0,5);
  const writeoffTotal=sumBy(writeoffs,r=>Number(r[7])||0);
  const writeoffByPerson=groupSum(writeoffs,r=>r[8]||'n/a',r=>Number(r[7])||0);
  const openRepair=repair.filter(r=>r[7]&&!['done','closed'].includes(String(r[7]).toLowerCase()));
  const repairByObject=groupCount(openRepair,r=>r[2]||'n/a');
  const repairByUrgency=groupCount(openRepair,r=>r[5]||'normal');
  const supplyInPeriod=supply.filter(r=>inPeriod(r[0],period));
  const empty=goods.filter(g=>Number(g[7])===0);
  const low=goods.filter(g=>Number(g[7])>0&&Number(g[7])<=Number(g[8]||0));
  const delta=(cur,prev)=>{
    if(!prev||prev===0)return cur>0?'NEW':'--';
    const pct=((cur-prev)/prev)*100;
    return `${pct>0?'+':''}${pct.toFixed(1)}%`;
  };
  return { period,prevPeriod,revenueQUMMY,revenueFOODBOX,revenueTotal,adminSalary,
    salesCount:sales.length,topByMargin,topByQty,writeoffTotal,writeoffByPerson,
    writeoffCount:writeoffs.length,openRepair:openRepair.length,repairByObject,
    repairByUrgency,supplyCount:supplyInPeriod.length,empty,low,
    deltaRevenue:prevData?delta(revenueTotal,prevData.revenueTotal):null,
    deltaWriteoff:prevData?delta(writeoffTotal,prevData.writeoffTotal):null };
}
const sumBy=(a,fn)=>a.reduce((s,x)=>s+fn(x),0);
const groupSum=(a,k,v)=>{const m=new Map();for(const r of a)m.set(k(r),(m.get(k(r))||0)+v(r));return[...m.entries()]};
const groupCount=(a,k)=>{const m=new Map();for(const r of a)m.set(k(r),(m.get(k(r))||0)+1);return[...m.entries()]};
const f=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:0})+' RUB';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function renderHTML(r) {
  let o=`<b>Report: Lagonaki Glamp</b>\n<i>${esc(r.period.label)}</i>\n\n`;
  o+=`<b>Revenue</b>\n`;
  o+=`QUMMY: <b>${f(r.revenueQUMMY)}</b>\nFOODBOX: <b>${f(r.revenueFOODBOX)}</b>\n`;
  o+=`Total: <b>${f(r.revenueTotal)}</b>`;
  if(r.deltaRevenue)o+=` (${esc(r.deltaRevenue)})`;
  o+=`\nSales: ${r.salesCount}\n\n`;
  o+=`<b>Admin salary</b>\n10%*QUMMY+20%*FOODBOX = <b>${f(r.adminSalary)}</b>\n\n`;
  if(r.topByMargin.length){o+=`<b>Top-5 margin</b>\n`;o+=r.topByMargin.map((x,i)=>`${i+1}. ${esc(x.name)} ${f(x.margin)} (${x.qty})`).join('\n')+'\n\n';}
  if(r.topByQty.length){o+=`<b>Top-5 sales</b>\n`;o+=r.topByQty.map((x,i)=>`${i+1}. ${esc(x.name)} ${x.qty} (${f(x.revenue)})`).join('\n')+'\n\n';}
  o+=`<b>Writeoffs: ${f(r.writeoffTotal)}</b>\n`;
  o+=r.writeoffByPerson.length?r.writeoffByPerson.map(([w,s])=>`- ${esc(w)}: ${f(s)}`).join('\n'):'None';
  o+=`\n\n<b>Open repairs: ${r.openRepair}</b>\n`;
  if(r.openRepair){o+=r.repairByObject.map(([ob,n])=>`- ${esc(ob)}: ${n}`).join('\n');}
  else o+='None';
  o+=`\n\n<b>Supply purchases:</b> ${r.supplyCount}\n\n<b>Stock</b>\n`;
  if(r.empty.length)o+=`OUT (${r.empty.length}): ${r.empty.slice(0,10).map(x=>esc(x[1])).join(', ')}\n`;
  if(r.low.length)o+=`LOW (${r.low.length}): ${r.low.slice(0,10).map(x=>esc(x[1])).join(', ')}\n`;
  if(!r.empty.length&&!r.low.length)o+='All OK\n';
  o+=`\n<i>Generated ${DateTime.now().setZone(TZ).toFormat('dd.MM.yyyy HH:mm')} MSK</i>`;
  return o;
}
