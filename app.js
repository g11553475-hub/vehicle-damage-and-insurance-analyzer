const $=s=>document.querySelector(s);
const imageInput=$("#imageInput"),dropzone=$("#dropzone"),preview=$("#previewImage"),empty=$("#uploadEmpty"),previewWrap=$("#uploadPreview"),fileName=$("#fileName"),fileSize=$("#fileSize"),description=$("#description"),analyzeBtn=$("#analyzeBtn"),resetBtn=$("#resetBtn"),loading=$("#loadingState"),results=$("#results"),reportContent=$("#reportContent"),imageError=$("#imageError"),descriptionError=$("#descriptionError");

let selectedFile=null;
$("#menuToggle").addEventListener("click",()=>{const nav=$("#navLinks");const open=nav.classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",open)});
$("#navLinks").addEventListener("click",e=>{if(e.target.matches("a"))$("#navLinks").classList.remove("open")});
description.addEventListener("input",()=>$("#charCount").textContent=`${description.value.length} / 3000`);

function setFile(file){
  imageError.textContent="";
  if(!file)return;
  const valid=["image/jpeg","image/png","image/webp"].includes(file.type);
  if(!valid){imageError.textContent="Please upload a JPG, PNG or WEBP image.";return}
  if(file.size>8*1024*1024){imageError.textContent="The image must be smaller than 8 MB.";return}
  selectedFile=file;
  const url=URL.createObjectURL(file);preview.src=url;preview.alt=`Uploaded vehicle image: ${file.name}`;
  fileName.textContent=file.name;fileSize.textContent=`${(file.size/1024/1024).toFixed(2)} MB`;
  empty.classList.add("hidden");previewWrap.classList.remove("hidden");
}
imageInput.addEventListener("change",e=>setFile(e.target.files[0]));
["dragenter","dragover"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.style.borderColor="#b91c1c"}));
["dragleave","drop"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.style.borderColor=""}));
dropzone.addEventListener("drop",e=>setFile(e.dataTransfer.files[0]));
$("#replaceBtn").addEventListener("click",e=>{e.preventDefault();imageInput.click()});
$("#removeBtn").addEventListener("click",e=>{e.preventDefault();clearFile()});
function clearFile(){selectedFile=null;imageInput.value="";preview.src="";empty.classList.remove("hidden");previewWrap.classList.add("hidden")}

function validate(){
  let ok=true;imageError.textContent="";descriptionError.textContent="";
  if(!selectedFile){imageError.textContent="Please upload a vehicle image before starting the assessment.";ok=false}
  if(!description.value.trim()){descriptionError.textContent="Please describe what happened in the accident.";ok=false}
  return ok
}
function dataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}

analyzeBtn.addEventListener("click",async()=>{
  if(!validate())return;
  analyzeBtn.disabled=true;loading.classList.remove("hidden");results.classList.add("hidden");
  try{
    const image=await dataUrl(selectedFile);
    const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image,description:description.value.trim(),fileName:selectedFile.name})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"The assessment service is temporarily unavailable.");
    renderResults(data);
  }catch(err){
    alert(err.message||"The analysis could not be completed. Please try again.");
  }finally{
    loading.classList.add("hidden");analyzeBtn.disabled=false;
  }
});

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function tags(arr){return (arr||[]).map(x=>`<span class="tag">${esc(x.replaceAll("_"," "))}</span>`).join("")||'<span class="tag">None identified</span>'}
function renderResults(d){
  const confidence=Math.round((Number(d.confidence)||0)*100);
  reportContent.innerHTML=`
    <div class="report-meta">Analysis mode: <strong>${esc(d.analysisMode||"AI-assisted")}</strong> · Assessment date: ${new Date().toLocaleString()}</div>
    <div class="result-grid">
      <div class="result-card severity"><small>Overall Severity</small><strong>${esc(String(d.severity||"Unknown").toUpperCase())}</strong></div>
      <div class="result-card"><small>Confidence</small><strong>${confidence}%</strong></div>
      <div class="result-card"><small>Impact Area</small><strong>${esc(d.impactArea||"Not clear")}</strong></div>
      <div class="result-card"><small>Consistency</small><strong>${esc(d.consistency?.level||"Unknown")}</strong></div>
    </div>
    <div class="detail-grid">
      <div class="detail-card"><h3>Observed Damage</h3><p>${esc(d.damageSummary||"No clear visible damage could be established from the available evidence.")}</p><h3>Damage Types</h3><div class="tag-list">${tags(d.damageTypes)}</div></div>
      <div class="detail-card"><h3>Accident Description Analysis</h3><p><strong>Type:</strong> ${esc(d.incident?.accidentType||"Not clear")}</p><p><strong>Direction:</strong> ${esc(d.incident?.impactDirection||"Not clear")}</p><p><strong>Severity:</strong> ${esc(d.incident?.severity||"Not clear")}</p><p><strong>Components:</strong></p><div class="tag-list">${tags(d.incident?.components)}</div></div>
      <div class="detail-card"><h3>Estimated Repair Range</h3><p style="font-size:26px;font-weight:800;color:#171717">${esc(d.repairRange||"Professional inspection required")}</p><p>This is an approximate educational estimate, not a final quotation.</p></div>
      <div class="detail-card"><h3>Image & Description Consistency</h3><p><strong>${esc(d.consistency?.level||"Unknown")}</strong></p><p>${esc(d.consistency?.explanation||"No consistency explanation available.")}</p></div>
    </div>
    <div class="detail-card" style="margin-top:14px"><h3>Recommended Next Step</h3><p>${esc(d.nextStep||"Document the damage from multiple angles and contact an authorized repair center or insurer for formal inspection.")}</p></div>
    <div class="report-disclaimer"><strong>Disclaimer:</strong> This is an AI-assisted preliminary assessment for academic/demonstration use. It is not a legally binding insurance decision, professional inspection, or exact repair quotation.</div>`;
  results.classList.remove("hidden");resetBtn.classList.remove("hidden");results.scrollIntoView({behavior:"smooth",block:"start"});
}
$("#printBtn").addEventListener("click",()=>window.print());
$("#generateBtn").addEventListener("click",()=>window.print());
resetBtn.addEventListener("click",()=>{clearFile();description.value="";$("#charCount").textContent="0 / 3000";results.classList.add("hidden");resetBtn.classList.add("hidden");window.scrollTo({top:document.querySelector("#assessment").offsetTop-80,behavior:"smooth"})});
