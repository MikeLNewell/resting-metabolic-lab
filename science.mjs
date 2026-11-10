/** Pure, dependency-free science and file functions. Gas volumes are internally mL/min. */
export const CONDITIONS = [
  { key: 'fasted', label: 'Fasted baseline', short: 'FASTED', time: 'Before meal' },
  { key: 'pp20', label: 'Postprandial 20–30 min', short: '20–30 MIN', time: 'After meal' },
  { key: 'pp50', label: 'Postprandial 50–60 min', short: '50–60 MIN', time: 'After meal' }
];
export function asMl(value, unit='ml') {
  if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return Number(value) * (unit === 'l' ? 1000 : 1);
}
export function calculate(vo2, vco2, unit='ml') {
  const o = asMl(vo2,unit), c = asMl(vco2,unit);
  if (o === null || c === null || o <= 0 || c < 0) return null;
  const rer = c/o, fat = 1.67*(o-c), cho = 4.55*c-3.21*o;
  const efat = fat / 1000*9, echo = cho / 1000*4, total = efat + echo;
  const warnings=[];
  if (rer < .7 || rer > 1) warnings.push('RER falls outside the simplified 0.70–1.00 substrate model. Interpret cautiously.');
  if (fat < 0 || cho < 0) warnings.push('A calculated negative oxidation rate is retained; steady-state assumptions or measurement quality may not hold.');
  if (o < 80 || o > 3500) warnings.push('VO₂ value is unusual for a resting practical. Check units and transcription.');
  if (c > 3500) warnings.push('VCO₂ value is unusual for a resting practical. Check units and transcription.');
  return {vo2:o,vco2:c,rer,fat,cho,efat,echo,total,warnings};
}
export function delta(current, baseline) {
  if (!Number.isFinite(current)||!Number.isFinite(baseline)) return null;
  const absolute=current-baseline;
  return { absolute, percent: baseline === 0 ? null : absolute/baseline*100 };
}
export function describeRer(rer) {
  if (!Number.isFinite(rer)) return 'Enter valid respiratory measurements to estimate the RER.';
  if (rer < .7) return 'Below 0.70: outside the simplified non-protein fuel model. Check the data and steady-state conditions.';
  if (rer > 1) return 'Above 1.00: CO₂ output may reflect additional processes. Do not convert this directly to a fuel percentage.';
  if (rer < .8) return 'Relatively lower RER: fat oxidation is prominent under steady-state assumptions.';
  if (rer < .9) return 'Mixed substrate oxidation: both carbohydrate and fat contribute to energy provision.';
  return 'Relatively higher RER: a greater proportional contribution from carbohydrate is plausible.';
}
export function csvEscape(value) {
  const s=String(value ?? '');
  return /[",\n\r]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}
export function toCsv(rows) { return rows.map(row=>row.map(csvEscape).join(',')).join('\r\n'); }
/** RFC4180-style rows; handles quoted multiline fields, commas and CRLF. */
export function parseCsv(text) {
  const out=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const ch=text[i];
    if(ch==='"') { if(quoted&&text[i+1]==='"') {field+='"';i++;} else quoted=!quoted; }
    else if(ch===','&&!quoted) {row.push(field);field='';}
    else if((ch==='\n'||ch==='\r')&&!quoted) { if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field); if(row.some(x=>x!==''))out.push(row);row=[];field=''; }
    else field+=ch;
  }
  if(quoted)throw new Error('CSV contains an unclosed quoted field.');
  row.push(field); if(row.some(x=>x!==''))out.push(row);
  if(out[0]?.[0]?.charCodeAt(0)===0xFEFF)out[0][0]=out[0][0].slice(1);
  return out;
}
export function parseTime(value) {
  if(typeof value==='number'&&Number.isFinite(value))return value;
  const s=String(value??'').trim(); if(!s)return null;
  if(/^\d+(?:\.\d+)?$/.test(s))return Number(s);
  if(/^\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(s)){
    const bits=s.split(':').map(Number);return bits.length===3?bits[0]*3600+bits[1]*60+bits[2]:bits[0]*60+bits[1];
  }
  const d=Date.parse(s);return Number.isFinite(d)?d/1000:null;
}
export function mean(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null; }
export function sd(arr) { if(arr.length<2)return null;const m=mean(arr);return Math.sqrt(arr.reduce((a,b)=>a+(b-m)**2,0)/(arr.length-1)); }
/** timeUnit is seconds/minutes; the final-five-minute window is inclusive at both edges. */
export function lastFive(rows, {timeIndex, oIndex,cIndex,timeUnit='s',gasUnit='ml'}) {
  const records=rows.map((row)=>({t:parseTime(row[timeIndex]),o:asMl(row[oIndex],gasUnit),c:asMl(row[cIndex],gasUnit)}))
    .filter(r=>r.t!==null && Number.isFinite(r.o)&&Number.isFinite(r.c)&&r.o>0&&r.c>=0);
  if(!records.length)throw new Error('No valid rows with time, VO₂ and VCO₂ were found.');
  const factor=timeUnit==='min'?60:1;
  const end=Math.max(...records.map(r=>r.t*factor));
  const sample=records.filter(r=>(r.t*factor >= end-300) && (r.t*factor<=end));
  if(!sample.length)throw new Error('No data in the final five-minute window.');
  const span=(end-Math.min(...records.map(r=>r.t*factor)))/60;
  return {vo2:mean(sample.map(r=>r.o)),vco2:mean(sample.map(r=>r.c)),count:sample.length,valid:records.length,spanMinutes:span,windowMinutes:5,warning:span<5?'The available recording spans fewer than five minutes. Check that the complete recording was imported.':''};
}
export function dataRows(session) {
  return CONDITIONS.map(({key,label})=>{
    const input=session.measurements[key]||{},v=calculate(input.vo2,input.vco2,input.unit||'ml');
    return [session.team||'',session.code||'',label,input.vo2??'',input.vco2??'',input.unit||'ml',v?.vo2??'',v?.vco2??'',v?.rer??'',v?.fat??'',v?.cho??'',v?.efat??'',v?.echo??'',v?.total??'',session.score||0];
  });
}
export const HEADERS=['Team','Participant code','Condition','Input VO2','Input VCO2','Input unit','VO2 (mL/min)','VCO2 (mL/min)','RER','Fat (mg/min)','CHO (mg/min)','Fat energy (kcal/min)','CHO energy (kcal/min)','Total energy (kcal/min)','Team points'];
export function readTeamCsv(text) {
  const rows=parseCsv(text);if(rows.length<2)throw new Error('No measurements found.');
  const head=rows[0];const names=['Team','Condition','RER','Fat (mg/min)','CHO (mg/min)','Total energy (kcal/min)'];
  if(names.some(n=>!head.includes(n)))throw new Error('This CSV does not match the Metabolic Lab results export.');
  return rows.slice(1).map(row=>Object.fromEntries(head.map((h,i)=>[h,row[i]??''])));
}
