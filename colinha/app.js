const offices=[
  {key:'federal',db:'f',label:'DEPUTADO FEDERAL',count:4,default:'2222'},
  {key:'estadual',db:'e',label:'DEPUTADA ESTADUAL',count:5,fixed:'22032',name:'Roberta Lopes'},
  {key:'senador1',db:'s',label:'SENADOR · 1º VOTO',count:3,default:'222'},
  {key:'senador2',db:'s',label:'SENADOR · 2º VOTO',count:3,default:'300'},
  {key:'governador',db:'g',label:'GOVERNADOR',count:2,default:'22'},
  {key:'presidente',db:'p',label:'PRESIDENTE',count:2,fixed:'22',name:'Flávio Bolsonaro'}
];
const values=Object.fromEntries(offices.map(o=>[o.key,o.fixed||o.default||'']));
const $=id=>document.getElementById(id);
let format='retangular',data=null,imageBlob=null,imageUrl='',imageFile=null,step=0;
const images={};
function showStep(n){step=n;['home-screen','format-screen','candidate-screen','overlay'].forEach((id,i)=>$(id).hidden=i!==n);window.scrollTo(0,0);}
function restoreHash(){const h=new URLSearchParams(location.hash.slice(1));format=h.get('formato')==='vertical'?'vertical':'retangular';for(const o of offices)if(!o.fixed&&h.has(o.key)){const v=h.get(o.key)||'';if(new RegExp('^\\d{0,'+o.count+'}$').test(v))values[o.key]=v}}
function saveHash(){const h=new URLSearchParams();h.set('formato',format);for(const o of offices)if(!o.fixed)h.set(o.key,values[o.key]);history.replaceState(null,'','#'+h.toString())}
function candidate(o){if(!data||values[o.key].length!==o.count)return null;const c=data.candidatos[o.db]?.[values[o.key]];return c?{name:o.name||c[0],party:c[1],tile:c[2],status:c[3],sheet:o.db}:null}
function spriteFor(c){return c&&c.tile>=0?data?.sprites[c.sheet]:null}
function photo(el,o,c){el.textContent='';el.classList.remove('sprite');el.style.backgroundImage='';const sp=spriteFor(c);if(sp){el.classList.add('sprite');el.style.setProperty('--cols',sp.cols);el.style.setProperty('--rows',sp.rows);el.style.setProperty('--tx',c.tile%sp.cols);el.style.setProperty('--ty',Math.floor(c.tile/sp.cols));el.style.backgroundImage=`url("${sp.url}")`;el.setAttribute('aria-label',`Foto de ${c.name}`)}else{el.textContent='?';el.setAttribute('aria-label','Foto não disponível')}}
function refresh(o){const c=candidate(o),n=values[o.key],name=$('name-'+o.key),detail=$('detail-'+o.key);if(!name)return;photo($('photo-'+o.key),o,c);name.classList.toggle('empty',!c&&!o.fixed);if(o.fixed){name.textContent=o.name;detail.textContent='PL · Já está na sua colinha'}else if(!n){name.textContent='Em branco';detail.textContent='Opcional'}else if(n.length<o.count){name.textContent='Complete o número';detail.textContent=`Faltam ${o.count-n.length} dígito(s)`}else if(!data){name.textContent='Buscando candidato…';detail.textContent='Aguarde'}else if(!c){name.textContent='Número não encontrado';detail.textContent='Confira antes de visualizar'}else{name.textContent=c.name;detail.textContent=c.party+(c.status===2?' · Candidatura renunciada':c.status===1?' · Situação pendente':'')+(o.key==='federal'&&n===o.default?' · Já está na sua colinha':'')}if(o.db==='s'&&n&&n===values[o.key==='senador1'?'senador2':'senador1'])detail.textContent='Escolha dois números diferentes para senador'}
function update(o,group){values[o.key]=[...group.children].map(x=>x.value).join('');refresh(o);if(o.db==='s')offices.filter(x=>x.db==='s'&&x!==o).forEach(refresh);saveHash()}
function render(){
  const root=$('rows');root.innerHTML='';
  for(const o of offices){
    const row=document.createElement('div');row.className='row';
    const avatar=document.createElement('div');avatar.className='avatar';avatar.id='photo-'+o.key;
    const info=document.createElement('div');info.className='info';
    info.innerHTML=`<div class="role"></div><div class="candidate" id="name-${o.key}"></div><div class="detail" id="detail-${o.key}"></div>`;
    info.querySelector('.role').textContent=o.label;
    const actions=document.createElement('div');actions.className='row-actions';
    const digits=document.createElement('div');digits.className='digits';
    digits.setAttribute('role','group');digits.setAttribute('aria-label',o.label);
    for(let i=0;i<o.count;i++){
      const input=document.createElement('input');
      input.className='digit'+(o.fixed?' fixed':'');input.type='text';input.inputMode='numeric';input.pattern='[0-9]*';
      input.maxLength=1;input.autocomplete='off';input.readOnly=true;input.tabIndex=-1;
      input.setAttribute('aria-label',`${o.label}, dígito ${i+1} de ${o.count}`);
      input.value=values[o.key][i]||'';
      if(!o.fixed){
        input.addEventListener('focus',()=>input.select());
        input.addEventListener('input',()=>{const v=input.value.replace(/\D/g,'');input.value=v.slice(-1);update(o,digits);if(v&&i<o.count-1)digits.children[i+1].focus()});
        input.addEventListener('keydown',e=>{
          if(e.key==='Backspace'&&!input.value&&i>0){e.preventDefault();digits.children[i-1].value='';update(o,digits);digits.children[i-1].focus()}
          else if(e.key==='ArrowLeft'&&i>0){e.preventDefault();digits.children[i-1].focus()}
          else if(e.key==='ArrowRight'&&i<o.count-1){e.preventDefault();digits.children[i+1].focus()}
        });
        input.addEventListener('paste',e=>{const v=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,o.count-i);if(!v)return;e.preventDefault();[...v].forEach((ch,j)=>digits.children[i+j].value=ch);update(o,digits);digits.children[Math.min(i+v.length,o.count-1)].focus()});
      }
      digits.append(input);
    }
    actions.append(digits);
    if(!o.fixed){
      const alter=document.createElement('button');alter.type='button';alter.className='alter-button';alter.textContent='Alterar';
      alter.setAttribute('aria-label',`Alterar ${o.label.toLowerCase()}`);
      alter.addEventListener('click',()=>{
        const editing=alter.getAttribute('aria-pressed')==='true';
        if(editing){
          const n=values[o.key],c=candidate(o);
          if(n&&(n.length!==o.count||!c||c.status===2)){
            alert(n.length!==o.count?'Complete o número ou deixe todos os dígitos vazios.':!c?'Número não encontrado. Confira antes de concluir.':'Candidatura renunciada na base consultada.');
            digits.querySelector('.digit').focus();return;
          }
        }
        alter.setAttribute('aria-pressed',String(!editing));alter.textContent=editing?'Alterar':'Concluir';
        for(const input of digits.children){input.readOnly=editing;input.tabIndex=editing?-1:0}
        if(!editing)digits.querySelector('.digit').focus();
      });
      actions.append(alter);
    }
    row.append(avatar,info,actions);root.append(row);refresh(o);
  }
}
function validate(){if(!data){alert('Aguarde a lista de candidatos carregar.');return false}for(const o of offices){if(o.fixed)continue;const n=values[o.key];if(!n)continue;let message='';const c=candidate(o);if(n.length<o.count)message=`Complete o número de ${o.label.toLowerCase()} ou deixe todos os dígitos vazios.`;else if(!c)message=`O número ${n} não foi encontrado para ${o.label.toLowerCase()}.`;else if(o.db==='s'&&values.senador1===values.senador2)message='Escolha dois candidatos diferentes para senador.';else if(c.status===2)message=`${c.name} consta como candidatura renunciada na base consultada.`;if(message){alert(message);$('photo-'+o.key).closest('.row').querySelector('.digit').focus();return false}}return true}
function loadImage(src){if(images[src])return images[src];images[src]=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src});return images[src]}
function rr(g,x,y,w,h,r,fill){g.fillStyle=fill;g.beginPath();g.roundRect(x,y,w,h,r);g.fill()}
async function draw(){
  await document.fonts.ready;
  const vertical=format==='vertical',W=1080,H=vertical?1920:1350;
  const header=vertical?240:180,rowH=vertical?210:140,partnerY=header+6*rowH;
  const legalH=vertical?48:35,partnerH=H-partnerY-legalH;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const g=canvas.getContext('2d');
  let background=null;try{background=await loadImage('assets/colinha-campanha-bg.png')}catch{}
  g.fillStyle='#087b37';g.fillRect(0,0,W,H);
  if(background){
    // The open upper area takes text; the lower image retains the partner portraits.
    g.drawImage(background,0,0,1122,820,0,0,W,partnerY);
    g.drawImage(background,0,850,1122,364,0,partnerY,W,partnerH);
  }
  g.fillStyle='#fff';g.font=`900 ${vertical?48:39}px Arial`;
  g.fillText('ROBERTA LOPES',46,vertical?61:47);
  g.fillStyle='#ffdf00';g.font=`900 ${vertical?90:72}px Arial`;
  g.fillText('22032',44,vertical?148:111);
  g.fillStyle='#fff';g.font=`900 ${vertical?33:29}px Arial`;
  g.fillText('DIA 4 DE OUTUBRO, VOTE ASSIM:',48,vertical?206:159);
  const loaded={};await Promise.all(offices.map(async o=>{const sp=spriteFor(candidate(o));if(sp)try{loaded[o.key]=await loadImage(sp.url)}catch{}}));
  offices.forEach((o,i)=>{
    const y=header+i*rowH,c=candidate(o),sp=spriteFor(c),num=values[o.key];
    const inset=vertical?13:8;
    rr(g,24,y+inset,W-48,rowH-inset*2,10,i%2?'#07532ccf':'#064526d9');
    g.fillStyle='#ffdf00';g.fillRect(24,y+inset,7,rowH-inset*2);
    g.fillStyle='#fff';g.font=`900 ${vertical?38:29}px Arial`;
    g.fillText(`${i+1}º`,51,y+(vertical?126:91));
    const px=vertical?125:112,photo=vertical?154:104,py=y+(rowH-photo)/2;
    if(sp&&loaded[o.key]){
      g.save();g.beginPath();g.roundRect(px,py,photo,photo,10);g.clip();
      g.drawImage(loaded[o.key],(c.tile%sp.cols)*96,Math.floor(c.tile/sp.cols)*96,96,96,px,py,photo,photo);g.restore();
    }else{
      rr(g,px,py,photo,photo,10,'#317d53');g.fillStyle='#b3d0ba';
      g.font=`700 ${vertical?73:54}px Arial`;g.fillText('?',px+photo*.28,py+photo*.72);
    }
    const tx=px+photo+(vertical?31:24);
    g.fillStyle='#bedec8';g.font=`900 ${vertical?22:17}px Arial`;
    g.fillText(o.label,tx,y+(vertical?56:37));
    g.fillStyle='#fff';g.font=`900 ${vertical?39:30}px Arial`;
    g.fillText(c?.name||o.name||(num?'Confira o número':'Em branco'),tx,y+(vertical?106:76));
    g.fillStyle=num?'#ffdf00':'#a7c7ad';g.font=`900 ${vertical?70:52}px Arial`;
    g.fillText(num||'—',tx,y+(vertical?174:124));
  });
  // The generated composition contains the three partners; a blue band anchors the campaign line.
  g.fillStyle='#0589c9';g.beginPath();g.moveTo(0,partnerY+5);g.lineTo(W,partnerY-27);g.lineTo(W,partnerY+45);g.lineTo(0,partnerY+81);g.closePath();g.fill();
  g.fillStyle='#fff';g.textAlign='center';g.font=`italic 900 ${vertical?40:33}px Arial`;
  g.fillText('ESSE É O NOSSO TIME!',W/2,partnerY+(vertical?41:43));g.textAlign='left';
  g.fillStyle='#082b1a';g.fillRect(0,H-legalH,W,legalH);
  g.fillStyle='#fff';g.font=`700 ${vertical?17:14}px Arial`;
  g.fillText('ROBERTA LOPES 22032 · DEPUTADA ESTADUAL · PL',24,H-legalH+(vertical?26:24));
  return canvas;
}
async function setImage(canvas){const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Imagem indisponível')),'image/png'));if(imageUrl)URL.revokeObjectURL(imageUrl);imageBlob=blob;imageFile=new File([blob],`colinha-roberta-22032-${format}.png`,{type:'image/png'});imageUrl=URL.createObjectURL(blob);$('result-img').src=imageUrl;$('download').href=imageUrl;$('download').download=imageFile.name}
async function generate(){if(!validate())return;const button=$('generate');button.disabled=true;button.firstChild.textContent='Preparando colinha ';try{await setImage(await draw());showStep(3);saveHash()}catch(e){alert('Não foi possível gerar a imagem. Recarregue a página e tente novamente.')}finally{button.disabled=false;button.firstChild.textContent='Confirmar e visualizar '}}
$('start-flow').addEventListener('click',()=>showStep(1));$('format-next').addEventListener('click',()=>showStep(2));$('format-back').addEventListener('click',()=>showStep(0));$('candidate-back').addEventListener('click',()=>showStep(1));$('generate').addEventListener('click',generate);$('edit').addEventListener('click',()=>showStep(2));$('restart').addEventListener('click',()=>{for(const o of offices)if(!o.fixed)values[o.key]=o.default||'';render();saveHash();showStep(1)});
$('download').addEventListener('click',e=>{if(!imageUrl)e.preventDefault()});
restoreHash();render();document.querySelectorAll('input[name=format]').forEach(r=>{r.checked=r.value===format;r.addEventListener('change',()=>{format=r.value;saveHash()})});fetch('data/candidatos.json').then(r=>{if(!r.ok)throw Error('Base indisponível');return r.json()}).then(d=>{data=d;offices.forEach(refresh)}).catch(()=>{$('candidate-title').textContent='Lista de candidatos indisponível. Recarregue a página.'});showStep(0);
