(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const money = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
  const ymd = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = new Date();
  const fmtDate = d => d ? new Date(`${d}T00:00:00`).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—';
  const initials = s => (s||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const safe = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sample = {schema:2,profile:{rentalName:'Rental Saya',phone:'',city:'',address:'',description:''},vehicles:[
    {id:'demo1',name:'Toyota Avanza',brand:'Toyota',type:'Avanza',model:'avanza',year:'2023',photos:['toyota_avanza_2023.png'],cover:'toyota_avanza_2023.png',plate:'D 1234 KA',price:450000,status:'Tersedia',transmission:'Automatic',seats:7},
    {id:'demo2',name:'Honda Brio',brand:'Honda',type:'Brio',model:'brio',year:'2025',photos:['honda_brio_2025.png'],cover:'honda_brio_2025.png',plate:'D 5678 BR',price:350000,status:'Disewa',transmission:'Automatic',seats:5},
    {id:'demo3',name:'Mitsubishi Xpander',brand:'Mitsubishi',type:'Xpander',model:'xpander',year:'2022',photos:[],cover:'',plate:'D 9101 XP',price:600000,status:'Servis',transmission:'Automatic',seats:7}],bookings:[
    {id:'db1',customer:'Andi Pratama',phone:'081234567890',vehicleId:'demo1',vehicle:'Toyota Avanza',plate:'D 1234 KA',start:ymd(),end:ymd(),price:450000,status:'Berjalan'},
    {id:'db2',customer:'Siti Rahma',phone:'081298765432',vehicleId:'demo2',vehicle:'Honda Brio',plate:'D 5678 BR',start:ymd(),end:ymd(),price:350000,status:'Menunggu'}]};
  let db=null, auth=null, user=null, demo=false, data={profile:{rentalName:'Rental Saya',phone:'',city:'',address:'',description:''},vehicles:[],bookings:[]}, registering=false;
  const config=window.KARMADA_FIREBASE_CONFIG||{};
  const firebaseReady=!!(window.firebase&&config.apiKey&&!config.apiKey.startsWith('YOUR_')&&config.projectId&&!config.projectId.startsWith('YOUR_'));
  const alertBox=(title,text,icon='info')=>window.Swal?Swal.fire({title,text,icon,confirmButtonText:'Mengerti'}):alert(`${title}\n${text}`);
  const toast=msg=>{const el=document.createElement('div');el.className='toast';el.textContent=msg;$('#toastArea').append(el);setTimeout(()=>el.remove(),2600)};
  const localGet=()=>{try{return JSON.parse(localStorage.getItem('karmada-demo')||'null')}catch{return null}};
  const localSet=()=>localStorage.setItem('karmada-demo',JSON.stringify(data));
  async function getCollection(name){if(demo)return data[name]||[];const snap=await db.collection('users').doc(user.uid).collection(name).get();return snap.docs.map(d=>({id:d.id,...d.data()}))}
  async function saveDoc(col,obj){let out=obj;if(!demo){const ref=obj.id?db.collection('users').doc(user.uid).collection(col).doc(obj.id):db.collection('users').doc(user.uid).collection(col).doc();out={...obj,id:ref.id};await ref.set(out)}const rows=data[col],i=rows.findIndex(x=>x.id===out.id);if(i<0)rows.unshift(out);else rows[i]=out;if(demo)localSet();return out}
  async function removeDoc(col,id){if(!demo)await db.collection('users').doc(user.uid).collection(col).doc(id).delete();data[col]=data[col].filter(x=>x.id!==id);if(demo)localSet()}
  async function saveProfile(p){data.profile={...data.profile,...p};if(demo)localSet();else await db.collection('users').doc(user.uid).set({profile:data.profile,email:user.email||'',updatedAt:new Date().toISOString()},{merge:true})}
  async function reload(){if(!demo){const doc=await db.collection('users').doc(user.uid).get();data.profile=doc.exists?(doc.data().profile||{}):{};if(doc.exists&&doc.data().profile)data.profile=doc.data().profile;else if(!doc.exists)await db.collection('users').doc(user.uid).set({profile:{rentalName:user.displayName?`Rental ${user.displayName}`:'Rental Saya',phone:'',city:'',address:'',description:''},email:user.email||''},{merge:true});}
    data.vehicles=await getCollection('vehicles');data.bookings=await getCollection('bookings');renderAll();}
  function showAuth(){ $('#authView').classList.remove('hidden');$('#appShell').classList.add('hidden') }
  function showApp(){ $('#authView').classList.add('hidden');$('#appShell').classList.remove('hidden'); }
  function showLogin(){user=null;demo=false;showAuth()}
  async function startDemo(){demo=true;user={uid:'demo',email:'demo@karmada.local',displayName:'Pemilik Rental'};const saved=localGet();data=(saved&&saved.schema===2)?saved:structuredClone(sample);localSet();showApp();renderAll();}
  function renderAll(){const p=data.profile||{};const owner=user?.displayName||user?.email?.split('@')[0]||'Pemilik Rental';$('#welcomeTitle').textContent=`Selamat datang, ${owner.split(' ')[0]}`;$('#sideRental').textContent=p.rentalName||'Rental Saya';$('#sidePlan').textContent=demo?'Mode demo':'Workspace rental';$('#userLabel').textContent=owner;$('#userEmail').textContent=demo?'Mode demo lokal':user?.email||'';$('#userInitial').textContent=initials(owner);$('#topInitial').textContent=initials(owner);$('#todayLabel').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});$('#rentalName').value=p.rentalName||'';$('#rentalPhone').value=p.phone||'';$('#rentalCity').value=p.city||'';$('#rentalAddress').value=p.address||'';$('#rentalDescription').value=p.description||'';renderDashboard();renderBookings();renderFleet();}
  const ACTIVE=['Menunggu','Berjalan'];
  const bookingVehicle=b=>data.vehicles.find(v=>v.id===b.vehicleId)||(b.vehicleId?null:data.vehicles.find(v=>v.name===b.vehicle))||null;
  const bvName=b=>bookingVehicle(b)?.name||b.vehicle||'—';
  const bvPlate=b=>bookingVehicle(b)?.plate||b.plate||'';
  const fmtRange=b=>`${fmtDate(b.start)}${b.end&&b.end!==b.start?` – ${fmtDate(b.end)}`:''}`;
  const addDay=d=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+1);return ymd(x)};
  const rentEnd=(st,en)=>en>st?en:addDay(st); // 16->17 memakai 16 saja; sewa sehari (16->16) memakai 16 saja
  function findConflicts(vehicleId,start,end,ignoreId){if(!vehicleId||!start||!end)return[];const e1=rentEnd(start,end);return data.bookings.filter(b=>b.id!==ignoreId&&ACTIVE.includes(b.status)&&bookingVehicle(b)?.id===vehicleId&&(b.start||'')<rentEnd(b.start||'',b.end||b.start||'')&&(b.start||'')<e1&&start<rentEnd(b.start||'',b.end||b.start||''))}
  const confirmAction=async(title,text,yes='Ya, hapus')=>window.Swal?(await Swal.fire({title,text,icon:'warning',showCancelButton:true,confirmButtonText:yes,cancelButtonText:'Batal'})).isConfirmed:confirm(`${title}\n${text}`);
  function renderDashboard(){const vehicles=data.vehicles,bookings=data.bookings;const active=bookings.filter(b=>b.status==='Berjalan').length,available=vehicles.filter(v=>v.status==='Tersedia').length,rented=vehicles.filter(v=>v.status==='Disewa').length,service=vehicles.filter(v=>v.status==='Servis').length,attention=bookings.filter(b=>b.status==='Menunggu').length;const rev=bookings.filter(b=>{const d=new Date((b.start||'')+'T00:00:00');const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()&&b.status!=='Dibatalkan'}).reduce((a,b)=>a+(Number(b.price)||0),0);
    $('#statActive').textContent=active;$('#statAvailable').innerHTML=`${available} <em>/ ${vehicles.length}</em>`;$('#statRevenue').textContent=money(rev);$('#statAttention').textContent=attention;$('#fleetTotal').textContent=vehicles.length;$('#fleetAvailable').textContent=available;$('#fleetRented').textContent=rented;$('#fleetService').textContent=service;const total=vehicles.length||1, a=available/total*100,r=rented/total*100;$('#fleetDonut').style.background=`conic-gradient(#42a87c 0 ${a}%,#6289c4 ${a}% ${a+r}%,#e8ad55 ${a+r}% 100%)`;
    const t=ymd(),todays=bookings.filter(b=>(b.start||'')<=t&&t<=(b.end||b.start||'')&&b.status!=='Dibatalkan').slice(0,5);$('#dashboardBookings').innerHTML=todays.map(b=>`<tr><td><div class="person-cell"><span class="person-avatar">${safe(initials(b.customer))}</span><span class="cell-main">${safe(b.customer)}</span></div></td><td>${safe(bvName(b))}</td><td>${fmtRange(b)}</td><td><span class="status-pill status-${safe(b.status)}">${safe(b.status)}</span></td><td><button class="icon-btn subtle row-more" data-booking-id="${safe(b.id)}">•••</button></td></tr>`).join('');$('#emptyDash').classList.toggle('hidden',todays.length>0);}
  function renderBookings(){const q=($('#bookingSearch')?.value||'').toLowerCase(),filter=$('#bookingFilter')?.value||'all';const rows=data.bookings.filter(b=>(filter==='all'||b.status===filter)&&`${b.customer} ${bvName(b)} ${bvPlate(b)}`.toLowerCase().includes(q));$('#bookingRows').innerHTML=rows.map(b=>`<tr><td><div class="person-cell"><span class="person-avatar">${safe(initials(b.customer))}</span><span><span class="cell-main">${safe(b.customer)}</span><span class="cell-sub">${safe(b.phone||'')}</span></span></div></td><td><span class="cell-main">${safe(bvName(b))}</span><span class="cell-sub">${safe(bvPlate(b))}</span></td><td>${fmtDate(b.start)} – ${fmtDate(b.end)}</td><td>${money(b.price)}</td><td><span class="status-pill status-${safe(b.status)}">${safe(b.status)}</span></td><td><button class="icon-btn subtle row-more" data-booking-id="${safe(b.id)}">•••</button></td></tr>`).join('');$('#emptyBookings').classList.toggle('hidden',rows.length>0)}
  function slug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
  const carSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 280"><rect width="600" height="280" rx="24" fill="#edf4f0"/><path d="M90 168h31l34-58c8-13 20-20 37-20h200c16 0 30 6 40 19l48 59h29c18 0 30 13 30 31v18H72v-18c0-17 6-31 18-31Z" fill="#c5d9cf" stroke="#6c9683" stroke-width="7"/><path d="m179 110-30 57h126v-64h-77c-8 0-14 2-19 7Zm117-7v64h163l-41-49c-6-9-14-15-26-15H296Z" fill="#dff0e9" stroke="#6c9683" stroke-width="5"/><circle cx="168" cy="213" r="31" fill="#314b42"/><circle cx="168" cy="213" r="13" fill="#d4e0db"/><circle cx="437" cy="213" r="31" fill="#314b42"/><circle cx="437" cy="213" r="13" fill="#d4e0db"/><path d="M78 188h45m360 0h55" stroke="#7baa95" stroke-width="7" stroke-linecap="round"/></svg>`;
  const catalog=Array.isArray(window.KARMADA_CATALOG)?window.KARMADA_CATALOG:[];
  const PLACEHOLDER='assets/icons/car-placeholder.svg';
  const imgPath=f=>'assets/cars/'+encodeURIComponent(f);
  function findCatalog(v){const m=slug(v.model||v.type||v.name),b=slug(v.brand||'');return catalog.find(c=>(!b||c.brandKey===b)&&c.typeKey===m&&String(c.year)===String(v.year))}
  function vehiclePhotos(v){if(Array.isArray(v.photos)&&v.photos.length)return v.photos;const c=findCatalog(v);return c?c.images:[]}
  function vehicleCover(v){const p=vehiclePhotos(v);return p.includes(v.cover)?v.cover:p[0]}
  function carImage(v){const c=vehicleCover(v),n=vehiclePhotos(v).length;return `<img loading="lazy" src="${safe(c?imgPath(c):PLACEHOLDER)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" alt="${safe(v.name)}">${n>1?`<span class="photo-count">${n} foto</span>`:''}`}
  function renderFleet(){const q=($('#fleetSearch')?.value||'').toLowerCase(),filter=$('#fleetFilter')?.value||'all';const rows=data.vehicles.filter(v=>(filter==='all'||v.status===filter)&&`${v.name} ${v.plate} ${v.model}`.toLowerCase().includes(q));$('#vehicleGrid').innerHTML=rows.map(v=>`<article class="vehicle-card"><div class="vehicle-photo" data-detail="${safe(v.id)}">${carImage(v)}<span class="status-pill status-${safe(v.status)}">${safe(v.status)}</span></div><div class="vehicle-body"><h3 data-detail="${safe(v.id)}">${safe(v.name)}</h3><div class="vehicle-meta">${safe(v.plate||'Belum ada plat')} · ${safe(v.transmission||'Manual')} · ${safe(v.seats||5)} kursi</div><div class="vehicle-bottom"><div class="vehicle-price">${money(v.price)} <small>/ hari</small></div><div class="vehicle-actions"><button title="Detail &amp; edit" data-detail="${safe(v.id)}">✎</button><button title="Ubah status" data-status-id="${safe(v.id)}">↻</button><button title="Hapus mobil" data-delete-vehicle="${safe(v.id)}">⌫</button></div></div></div></article>`).join('');$('#emptyFleet').classList.toggle('hidden',rows.length>0)}
  function goPage(name){$$('.page-section').forEach(x=>x.classList.remove('active'));$(`#page-${name}`).classList.add('active');$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===name));const title={dashboard:'Ringkasan',bookings:'Booking',fleet:'Armada',settings:'Pengaturan'}[name];$('#crumbPage').textContent=title;$('.sidebar').classList.remove('open');$('#mobileOverlay').classList.remove('show');window.scrollTo(0,0)}
  function openModal(title,eyebrow,html){$('#modalTitle').textContent=title;$('#modalEyebrow').textContent=eyebrow;$('#modalContent').innerHTML=html;$('#modalLayer').classList.remove('hidden')}
  function closeModal(){$('#modalLayer').classList.add('hidden')}
  function openVehicle(){
    const opt=(v,t=v)=>`<option value="${safe(v)}">${safe(t)}</option>`;
    const brands=[...new Set(catalog.map(c=>c.brand))].sort((x,y)=>x.localeCompare(y,'id'));
    openModal('Tambah mobil','DATA ARMADA',`<form class="modal-form" id="vehicleForm">
      <div class="form-row"><label>Merk<select name="brand" required><option value="">Pilih merk…</option>${brands.map(b=>opt(b)).join('')}<option value="__other">Lainnya (tanpa foto)</option></select></label><label>Tipe<select name="type" required disabled><option value="">Pilih merk dulu</option></select></label></div>
      <div class="form-row"><label>Tahun<select name="year" required disabled><option value="">Pilih tipe dulu</option></select></label><label>Nama di armada<input name="name" required placeholder="Otomatis dari merk &amp; tipe"></label></div>
      <div class="form-row manual-row hidden" id="manualRow"><label>Merk<input name="brandManual" placeholder="Suzuki"></label><label>Tipe<input name="typeManual" placeholder="Ertiga"></label><label>Tahun<input name="yearManual" type="number" min="1990" max="2035" value="${today.getFullYear()}"></label></div>
      <div class="photo-picker hidden" id="photoPicker"><div class="photo-picker-head"><b>Foto tersedia</b><small id="photoCount"></small></div><div class="photo-grid" id="photoGrid"></div><small class="muted">Klik foto untuk menjadikannya foto utama.</small></div>
      <div class="form-row"><label>Nomor polisi<input name="plate" placeholder="D 1234 ABC"></label><label>Tarif per hari (Rp)<input name="price" type="number" min="0" required placeholder="450000"></label></div>
      <div class="form-row"><label>Transmisi<select name="transmission"><option>Automatic</option><option>Manual</option></select></label><label>Kapasitas kursi<input name="seats" type="number" min="1" value="5"></label></div>
      <label>Status<select name="status"><option>Tersedia</option><option>Disewa</option><option>Servis</option></select></label>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" id="cancelModal">Batal</button><button type="submit" class="btn btn-primary">Simpan mobil</button></div></form>`);
    const f=$('#vehicleForm'),el=n=>f.elements[n],grid=$('#photoGrid'),picker=$('#photoPicker'),manual=$('#manualRow');
    let photos=[],cover='',nameTouched=false;
    const fill=(sel,placeholder,items)=>{sel.innerHTML=`<option value="">${placeholder}</option>`+items.map(i=>opt(i.value,i.label)).join('');sel.disabled=!items.length};
    const drawPhotos=()=>{picker.classList.toggle('hidden',!photos.length);$('#photoCount').textContent=`${photos.length} foto`;grid.innerHTML=photos.map(p=>`<button type="button" class="photo-choice${p===cover?' selected':''}" data-photo="${safe(p)}"><img src="${safe(imgPath(p))}" alt="" loading="lazy"><span>Utama</span></button>`).join('')};
    const autoName=()=>{if(nameTouched)return;const b=el('brand').value,t=el('type').selectedOptions[0];el('name').value=(b&&b!=='__other'&&el('type').value)?`${b} ${t.textContent}`:''};
    const refreshPhotos=()=>{const c=catalog.find(c=>c.brand===el('brand').value&&c.typeKey===el('type').value&&String(c.year)===el('year').value);photos=c?c.images.slice():[];cover=photos[0]||'';drawPhotos()};
    el('name').addEventListener('input',()=>{nameTouched=true});
    grid.addEventListener('click',e=>{const b=e.target.closest('[data-photo]');if(!b)return;cover=b.dataset.photo;drawPhotos()});
    el('brand').addEventListener('change',()=>{
      const other=el('brand').value==='__other';manual.classList.toggle('hidden',!other);
      ['brandManual','typeManual','yearManual'].forEach(n=>{el(n).required=other});
      photos=[];cover='';drawPhotos();
      if(other){fill(el('type'),'—',[]);fill(el('year'),'—',[]);el('type').required=el('year').required=false;nameTouched=false;el('name').value='';return}
      el('type').required=el('year').required=true;
      const types=[...new Map(catalog.filter(c=>c.brand===el('brand').value).map(c=>[c.typeKey,c.type])).entries()].map(([value,label])=>({value,label})).sort((x,y)=>x.label.localeCompare(y.label,'id'));
      fill(el('type'),el('brand').value?'Pilih tipe…':'Pilih merk dulu',types);fill(el('year'),'Pilih tipe dulu',[]);autoName()});
    el('type').addEventListener('change',()=>{
      const years=catalog.filter(c=>c.brand===el('brand').value&&c.typeKey===el('type').value).map(c=>c.year).sort((x,y)=>y-x).map(y=>({value:String(y),label:String(y)}));
      fill(el('year'),el('type').value?'Pilih tahun…':'Pilih tipe dulu',years);photos=[];cover='';drawPhotos();autoName()});
    el('year').addEventListener('change',refreshPhotos);
    el('brandManual').addEventListener('input',()=>{if(!nameTouched)el('name').value=`${el('brandManual').value} ${el('typeManual').value}`.trim()});
    el('typeManual').addEventListener('input',()=>{if(!nameTouched)el('name').value=`${el('brandManual').value} ${el('typeManual').value}`.trim()});
    f.addEventListener('submit',async e=>{e.preventDefault();
      const other=el('brand').value==='__other';
      const brand=other?el('brandManual').value.trim():el('brand').value;
      const typeLabel=other?el('typeManual').value.trim():(el('type').selectedOptions[0]?.textContent||'');
      const year=other?el('yearManual').value:el('year').value;
      const v={id:'v_'+Date.now(),name:el('name').value.trim()||`${brand} ${typeLabel}`.trim(),brand,type:typeLabel,model:slug(typeLabel),year:String(year),photos:other?[]:photos,cover:other?'':cover,plate:el('plate').value.trim(),price:Number(el('price').value),transmission:el('transmission').value,seats:Number(el('seats').value),status:el('status').value};
      const submit=f.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Menyimpan…';
      try{await saveDoc('vehicles',v);renderAll();goPage('fleet');closeModal();toast('Mobil berhasil ditambahkan')}catch(err){console.error(err);await alertBox('Mobil belum tersimpan','Periksa koneksi atau Firestore Rules, lalu coba lagi.','error')}finally{submit.disabled=false;submit.textContent='Simpan mobil'}});
    $('#cancelModal').onclick=closeModal;
  }
  async function deleteVehicle(id){
    const v=data.vehicles.find(x=>x.id===id);if(!v)return false;
    const busy=data.bookings.filter(b=>bookingVehicle(b)?.id===v.id&&ACTIVE.includes(b.status)).length;
    const text=busy?`Mobil ini masih punya ${busy} booking aktif/menunggu. Riwayat booking tetap tersimpan.`:'Data kendaraan akan dihapus dari armada.';
    if(!await confirmAction('Hapus mobil ini?',text))return false;
    await removeDoc('vehicles',id);renderAll();toast('Mobil dihapus');return true;
  }
  function openVehicleDetail(id){
    const v=data.vehicles.find(x=>x.id===id);if(!v)return;
    const photos=vehiclePhotos(v);let cover=vehicleCover(v)||'';
    const statuses=['Tersedia','Disewa','Servis'];
    openModal(v.name,'DETAIL MOBIL',`<form class="modal-form" id="detailForm">
      <div class="detail-photo"><img id="detailImg" alt="${safe(v.name)}" src="${safe(cover?imgPath(cover):PLACEHOLDER)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'"></div>
      ${photos.length>1?`<div class="photo-grid" id="detailThumbs"></div><small class="muted">Klik foto untuk menjadikannya foto utama.</small>`:''}
      <div class="detail-meta"><span>${safe([v.brand,v.type].filter(Boolean).join(' ')||v.name)}</span><span>Tahun ${safe(v.year||'—')}</span></div>
      <div class="form-row"><label>Nama di armada<input name="name" required value="${safe(v.name)}"></label><label>Nomor polisi<input name="plate" value="${safe(v.plate||'')}" placeholder="D 1234 ABC"></label></div>
      <div class="form-row"><label>Tarif per hari (Rp)<input name="price" type="number" min="0" required value="${Number(v.price)||0}"></label><label>Kapasitas kursi<input name="seats" type="number" min="1" value="${Number(v.seats)||5}"></label></div>
      <div class="form-row"><label>Transmisi<select name="transmission">${['Automatic','Manual'].map(t=>`<option${t===v.transmission?' selected':''}>${t}</option>`).join('')}</select></label><label>Status<select name="status">${statuses.map(t=>`<option${t===v.status?' selected':''}>${t}</option>`).join('')}</select></label></div>
      <div class="modal-actions split"><button type="button" class="btn btn-danger" id="detailDelete">Hapus mobil</button><span class="grow"></span><button type="button" class="btn btn-ghost" id="cancelModal">Tutup</button><button type="submit" class="btn btn-primary">Simpan perubahan</button></div></form>`);
    const f=$('#detailForm'),el=n=>f.elements[n];
    const drawThumbs=()=>{const g=$('#detailThumbs');if(!g)return;g.innerHTML=photos.map(p=>`<button type="button" class="photo-choice${p===cover?' selected':''}" data-photo="${safe(p)}"><img src="${safe(imgPath(p))}" alt="" loading="lazy"><span>Utama</span></button>`).join('')};
    drawThumbs();
    $('#detailThumbs')?.addEventListener('click',e=>{const b=e.target.closest('[data-photo]');if(!b)return;cover=b.dataset.photo;$('#detailImg').src=imgPath(cover);drawThumbs()});
    $('#cancelModal').onclick=closeModal;
    $('#detailDelete').onclick=async()=>{if(await deleteVehicle(id))closeModal()};
    f.addEventListener('submit',async e=>{e.preventDefault();
      const submit=f.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Menyimpan…';
      try{
        const next={...v,name:el('name').value.trim()||v.name,plate:el('plate').value.trim(),price:Number(el('price').value),seats:Number(el('seats').value),transmission:el('transmission').value,status:el('status').value,cover};
        const linked=data.bookings.filter(b=>bookingVehicle(b)?.id===v.id&&(b.vehicleId!==v.id||b.vehicle!==next.name||(b.plate||'')!==next.plate));
        await saveDoc('vehicles',next);
        for(const b of linked)await saveDoc('bookings',{...b,vehicleId:v.id,vehicle:next.name,plate:next.plate});
        renderAll();closeModal();toast('Perubahan mobil tersimpan');
      }catch(err){console.error(err);await alertBox('Perubahan belum tersimpan','Periksa koneksi atau Firestore Rules, lalu coba lagi.','error');submit.disabled=false;submit.textContent='Simpan perubahan'}
    });
  }
  function openBooking(existing){
    const edit=!!existing,cur=edit?bookingVehicle(existing):null,d0=ymd();
    const opts=data.vehicles.map(v=>`<option value="${safe(v.id)}" data-price="${Number(v.price)||0}"${cur&&cur.id===v.id?' selected':''}>${safe(v.name)}${v.plate?` · ${safe(v.plate)}`:''} — ${money(v.price)}/hari${v.status==='Servis'?' (sedang servis)':''}</option>`).join('');
    const orphan=edit&&!cur?`<option value="" selected>${safe(existing.vehicle||'Mobil')} (sudah dihapus)</option>`:'';
    const statuses=edit?['Menunggu','Berjalan','Selesai','Dibatalkan']:['Menunggu','Berjalan','Selesai'];
    openModal(edit?'Edit booking':'Catat booking',edit?'DETAIL PENYEWAAN':'PENYEWAAN BARU',`<form class="modal-form" id="bookingForm">
      <label>Nama pelanggan<input name="customer" required placeholder="Nama lengkap" value="${safe(existing?.customer||'')}"></label>
      <div class="form-row"><label>Nomor telepon<input name="phone" type="tel" placeholder="08xxxxxxxxxx" value="${safe(existing?.phone||'')}"></label><label>Mobil<select name="vehicleId"${orphan?'':' required'}>${orphan}${opts||'<option value="">Tambahkan mobil dahulu</option>'}</select></label></div>
      <div class="form-row"><label>Tanggal mulai<input name="start" type="date" required value="${safe(existing?.start||d0)}"></label><label>Tanggal selesai<input name="end" type="date" required value="${safe(existing?.end||d0)}"></label></div>
      <div class="conflict-note hidden" id="conflictNote"></div>
      <div class="form-row"><label>Total sewa (Rp)<input name="price" type="number" min="0" required placeholder="Nominal total" value="${edit?Number(existing.price)||0:''}"><small class="price-hint" id="priceHint"></small></label><label>Status<select name="status">${statuses.map(t=>`<option${existing?.status===t?' selected':''}>${t}</option>`).join('')}</select></label></div>
      <label>Catatan<textarea name="notes" rows="2" placeholder="Catatan tambahan (opsional)">${safe(existing?.notes||'')}</textarea></label>
      <div class="modal-actions${edit?' split':''}">${edit?'<button type="button" class="btn btn-danger" id="bookingDelete">Hapus booking</button><span class="grow"></span>':''}<button type="button" class="btn btn-ghost" id="cancelModal">${edit?'Tutup':'Batal'}</button><button type="submit" class="btn btn-primary">${edit?'Simpan perubahan':'Simpan booking'}</button></div></form>`);
    const f=$('#bookingForm'),el=n=>f.elements[n],sel=el('vehicleId'),price=el('price'),startEl=el('start'),endEl=el('end'),statusEl=el('status'),hint=$('#priceHint'),note=$('#conflictNote');
    let priceTouched=edit;
    const countDays=()=>{const a=new Date(startEl.value+'T00:00:00'),b=new Date(endEl.value+'T00:00:00');if(isNaN(a)||isNaN(b))return 1;return Math.max(1,Math.round((b-a)/864e5))};
    const conflicts=()=>ACTIVE.includes(statusEl.value)?findConflicts(sel.value,startEl.value,endEl.value,existing?.id):[];
    const checkConflict=()=>{const c=conflicts();note.classList.toggle('hidden',!c.length);note.innerHTML=c.length?`⚠ Jadwal bentrok dengan ${c.map(b=>`<b>${safe(b.customer)}</b> (${fmtRange(b)})`).join(', ')}.`:''};
    const recalc=()=>{const rate=Number(sel.selectedOptions[0]?.dataset.price||0),n=countDays();hint.textContent=rate?`${n} hari × ${money(rate)}`:'';if(rate&&!priceTouched)price.value=rate*n;checkConflict()};
    startEl.addEventListener('change',()=>{endEl.min=startEl.value;if(endEl.value<startEl.value)endEl.value=startEl.value;recalc()});
    endEl.addEventListener('change',recalc);sel.addEventListener('change',recalc);statusEl.addEventListener('change',checkConflict);
    price.addEventListener('input',()=>{priceTouched=price.value!==''});
    endEl.min=startEl.value;recalc();
    f.addEventListener('submit',async e=>{e.preventDefault();
      const c=conflicts();
      if(c.length){await alertBox('Jadwal bentrok',`${sel.selectedOptions[0]?.textContent.split(' — ')[0]||'Mobil ini'} sudah dibooking oleh ${c.map(b=>`${b.customer} (${fmtRange(b)})`).join(', ')}. Ubah tanggal atau pilih mobil lain.`,'warning');return}
      const veh=data.vehicles.find(x=>x.id===sel.value);
      const rec={...(existing||{}),id:existing?.id||'b_'+Date.now(),customer:el('customer').value.trim(),phone:el('phone').value.trim(),vehicleId:veh?veh.id:(existing?.vehicleId||''),vehicle:veh?veh.name:(existing?.vehicle||''),plate:veh?(veh.plate||''):(existing?.plate||''),start:startEl.value,end:endEl.value,price:Number(price.value),status:statusEl.value,notes:el('notes').value.trim()};
      const submit=f.querySelector('button[type="submit"]');submit.disabled=true;
      try{await saveDoc('bookings',rec);closeModal();renderAll();toast(edit?'Booking diperbarui':'Booking berhasil dicatat')}catch(err){console.error(err);submit.disabled=false;await alertBox('Booking belum tersimpan','Periksa koneksi atau Firestore Rules, lalu coba lagi.','error')}});
    $('#cancelModal').onclick=closeModal;
    if(edit)$('#bookingDelete').onclick=async()=>{if(!await confirmAction('Hapus booking ini?',`Booking ${existing.customer} akan dihapus permanen.`))return;try{await removeDoc('bookings',existing.id);closeModal();renderAll();toast('Booking dihapus')}catch(err){console.error(err);alertBox('Gagal menghapus','Periksa koneksi atau Firestore Rules.','error')}};
  }
  async function handleAuth(e){e.preventDefault();if(!firebaseReady){await alertBox('Firebase belum dikonfigurasi','Isi js/firebase-config.js dengan konfigurasi project Firebase Anda, atau gunakan mode demo.','warning');return}try{const email=$('#authEmail').value.trim(),pass=$('#authPassword').value;if(registering){const cred=await auth.createUserWithEmailAndPassword(email,pass);if($('#authName').value.trim())await cred.user.updateProfile({displayName:$('#authName').value.trim()});await db.collection('users').doc(cred.user.uid).set({profile:{rentalName:'Rental Saya',phone:'',city:'',address:'',description:''},email},{merge:true})}else await auth.signInWithEmailAndPassword(email,pass)}catch(err){alertBox('Tidak dapat masuk',authError(err.code),'error')}}
  function authError(code){return ({'auth/email-already-in-use':'Email ini sudah terdaftar.','auth/invalid-email':'Format email tidak valid.','auth/weak-password':'Kata sandi minimal 6 karakter.','auth/user-not-found':'Akun tidak ditemukan. Periksa email atau daftar dahulu.','auth/wrong-password':'Kata sandi tidak sesuai.','auth/invalid-credential':'Email atau kata sandi tidak sesuai.','auth/popup-closed-by-user':'Jendela Google ditutup sebelum selesai.','auth/unauthorized-domain':'Domain ini belum diizinkan di Firebase Authentication.'})[code]||'Periksa koneksi dan konfigurasi Firebase, lalu coba lagi.'}
  function updateAuthMode(){const card=$('.auth-card');card.classList.toggle('register-mode',registering);$('#authTitle').textContent=registering?'Buat akun KARMADA':'Masuk ke akun';$('#authSubtitle').textContent=registering?'Daftarkan akun untuk mulai mengelola rental.':'Kelola armada dan booking rental Anda.';$('#authSubmit').textContent=registering?'Buat akun':'Masuk';$('#authSwitch').textContent=registering?'Sudah punya akun? Masuk':'Belum punya akun? Daftar';$('#authPassword').autocomplete=registering?'new-password':'current-password'}
  async function init(){const form=$('#authForm');form.addEventListener('submit',handleAuth);$('#authSwitch').onclick=()=>{registering=!registering;updateAuthMode()};$('#demoBtn').onclick=startDemo;$('#googleBtn').onclick=async()=>{if(!firebaseReady)return alertBox('Firebase belum dikonfigurasi','Atur konfigurasi Firebase untuk mengaktifkan Google login.','warning');try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())}catch(e){alertBox('Login Google gagal',authError(e.code),'error')}};
    if(firebaseReady){try{firebase.initializeApp(config);auth=firebase.auth();db=firebase.firestore();auth.onAuthStateChanged(async u=>{if(u){user=u;demo=false;showApp();try{await reload()}catch(e){alertBox('Gagal memuat data','Periksa koneksi dan Firestore Rules.','error')}}else showAuth()})}catch(e){console.error(e);showAuth()}}else showAuth();
    $$('.nav-item').forEach(b=>b.onclick=()=>goPage(b.dataset.page));$$('[data-goto]').forEach(b=>b.onclick=()=>goPage(b.dataset.goto));$$('[data-open-booking]').forEach(b=>b.onclick=()=>openBooking());$('#addVehicleBtn').onclick=openVehicle;$('#emptyAddVehicle').onclick=openVehicle;$('#modalClose').onclick=closeModal;$('#modalLayer').addEventListener('click',e=>{if(e.target.id==='modalLayer')closeModal()});$('#menuToggle').onclick=()=>{$('.sidebar').classList.toggle('open');$('#mobileOverlay').classList.toggle('show')};$('#mobileOverlay').onclick=()=>{$('.sidebar').classList.remove('open');$('#mobileOverlay').classList.remove('show')};$('#bookingSearch').oninput=renderBookings;$('#bookingFilter').onchange=renderBookings;$('#fleetSearch').oninput=renderFleet;$('#fleetFilter').onchange=renderFleet;
    $('#settingsForm').onsubmit=async e=>{e.preventDefault();try{const fd=new FormData(e.currentTarget);await saveProfile({rentalName:fd.get('rentalName').trim(),phone:fd.get('phone').trim(),city:fd.get('city').trim(),address:fd.get('address').trim(),description:fd.get('description').trim()});renderAll();toast('Profil rental tersimpan')}catch(err){alertBox('Gagal menyimpan','Periksa koneksi atau aturan akses Firebase.','error')}};
    $('#vehicleGrid').addEventListener('click',async e=>{const d=e.target.closest('[data-detail]');if(d){openVehicleDetail(d.dataset.detail);return}const del=e.target.closest('[data-delete-vehicle]');if(del){await deleteVehicle(del.dataset.deleteVehicle);return}const st=e.target.closest('[data-status-id]');if(st){const v=data.vehicles.find(x=>x.id===st.dataset.statusId);if(!v)return;const choices=['Tersedia','Disewa','Servis'];const next=choices[(choices.indexOf(v.status)+1)%choices.length];await saveDoc('vehicles',{...v,status:next});renderAll();toast(`Status diperbarui: ${next}`)}});
    document.body.addEventListener('click',e=>{const row=e.target.closest('[data-booking-id]');if(!row)return;const b=data.bookings.find(x=>x.id===row.dataset.bookingId);if(b)openBooking(b)});
    $('#logoutBtn').onclick=async()=>{if(demo){demo=false;user=null;showLogin()}else if(auth)await auth.signOut()};$('#notificationBtn').onclick=()=>alertBox('Notifikasi','Belum ada notifikasi baru.');$('#helpBtn').onclick=()=>alertBox('Panduan singkat','Mulai dengan menambahkan mobil, lalu catat booking dan lengkapi profil rental di Pengaturan.','info');$('#accountTab').onclick=()=>alertBox('Akun & keamanan','Akun Firebase dikelola melalui layanan Firebase Authentication.','info');
  }
  document.addEventListener('DOMContentLoaded',init);
})();
