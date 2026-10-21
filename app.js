/* Browser-only vehicle damage screening. Uses a public ONNX model; results are estimates, not an insurer decision. */
const $ = (s) => document.querySelector(s);
const imageInput=$("#imageInput"), dropzone=$("#dropzone"), preview=$("#previewImage");
const empty=$("#uploadEmpty"), previewWrap=$("#uploadPreview"), fileName=$("#fileName"), fileSize=$("#fileSize");
const analyzeBtn=$("#analyzeBtn"), resetBtn=$("#resetBtn"), loading=$("#loadingState"), results=$("#results");
const reportContent=$("#reportContent"), imageError=$("#imageError"), analysisError=$("#analysisError");
let selectedFile=null, previewUrl=null, currentReport=null, sessionPromise=null;
const MODEL_URL="https://huggingface.co/tommy33355/damagelens-onnx/resolve/main/car_damage_seg.onnx";
const LABELS=["crack","dent","glass shatter","lamp broken","scratch","tire flat"];
const MODEL_INPUT=640, CONF_THRESHOLD=0.28, IOU_THRESHOLD=0.45;
const COSTS={
  "scratch":[2500,12000],"dent":[4000,22000],"crack":[3000,18000],
  "glass shatter":[5000,35000],"lamp broken":[2500,22000],"tire flat":[1500,12000]
};
$("#menuToggle").addEventListener("click",()=>{const n=$("#navLinks"),o=n.classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",String(o))});
$("#navLinks").addEventListener("click",e=>{if(e.target.matches("a"))$("#navLinks").classList.remove("open")});
function setFile(f){
 imageError.textContent=""; if(!f)return;
 if(!["image/jpeg","image/png","image/webp"].includes(f.type)){imageError.textContent="Please upload a JPG, PNG or WEBP image.";return}
 if(f.size>8*1024*1024){imageError.textContent="The image must be 8 MB or smaller.";return}
 if(previewUrl)URL.revokeObjectURL(previewUrl);
 selectedFile=f;previewUrl=URL.createObjectURL(f);preview.src=previewUrl;fileName.textContent=f.name;
 fileSize.textContent=(f.size/1048576).toFixed(2)+" MB";empty.classList.add("hidden");previewWrap.classList.remove("hidden");
 results.classList.add("hidden");analysisError.classList.add("hidden");
}
imageInput.addEventListener("change",e=>setFile(e.target.files[0]));
["dragenter","dragover"].forEach(v=>dropzone.addEventListener(v,e=>{e.preventDefault();dropzone.style.borderColor="#b91c1c"}));
["dragleave","drop"].forEach(v=>dropzone.addEventListener(v,e=>{e.preventDefault();dropzone.style.borderColor=""}));
dropzone.addEventListener("drop",e=>setFile(e.dataTransfer.files[0]));
$("#replaceBtn").addEventListener("click",e=>{e.preventDefault();imageInput.click()});
$("#removeBtn").addEventListener("click",e=>{e.preventDefault();clearFile()});
function clearFile(){selectedFile=null;imageInput.value="";preview.src="";if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;empty.classList.remove("hidden");previewWrap.classList.add("hidden");analysisError.textContent="";analysisError.classList.add("hidden");currentReport=null}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function loadOrt(){
 if(sessionPromise)return sessionPromise;
 sessionPromise=new Promise((resolve,reject)=>{
   if(!window.ort){reject(new Error("The browser AI runtime could not load. Check your internet connection and reload the page."));return}
   window.ort.env.wasm.numThreads=1;
   window.ort.InferenceSession.create(MODEL_URL,{executionProviders:["wasm"],graphOptimizationLevel:"all"}).then(resolve).catch(err=>{sessionPromise=null;reject(new Error("The damage model could not be downloaded or initialized. Please reload and try again. Details: "+(err.message||"model loading failed")))});
 });
 return sessionPromise;
}
function loadImage(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image decoding failed. Try another image."))};img.src=url})}
function prepareTensor(img){
 const scale=Math.min(MODEL_INPUT/img.naturalWidth,MODEL_INPUT/img.naturalHeight);
 const rw=Math.round(img.naturalWidth*scale),rh=Math.round(img.naturalHeight*scale);
 const left=Math.floor((MODEL_INPUT-rw)/2),top=Math.floor((MODEL_INPUT-rh)/2);
 const c=document.createElement("canvas");c.width=MODEL_INPUT;c.height=MODEL_INPUT;
 const ctx=c.getContext("2d",{willReadFrequently:true});ctx.fillStyle="rgb(114,114,114)";ctx.fillRect(0,0,MODEL_INPUT,MODEL_INPUT);
 ctx.drawImage(img,left,top,rw,rh);
 const px=ctx.getImageData(0,0,MODEL_INPUT,MODEL_INPUT).data,plane=MODEL_INPUT*MODEL_INPUT,data=new Float32Array(3*plane);
 for(let i=0;i<plane;i++){data[i]=px[i*4]/255;data[plane+i]=px[i*4+1]/255;data[2*plane+i]=px[i*4+2]/255}
 return {tensor:new window.ort.Tensor("float32",data,[1,3,MODEL_INPUT,MODEL_INPUT]),scale,left,top,width:img.naturalWidth,height:img.naturalHeight};
}
function iou(a,b){const x1=Math.max(a.x1,b.x1),y1=Math.max(a.y1,b.y1),x2=Math.min(a.x2,b.x2),y2=Math.min(a.y2,b.y2);const inter=Math.max(0,x2-x1)*Math.max(0,y2-y1);return inter/Math.max(1,(a.x2-a.x1)*(a.y2-a.y1)+(b.x2-b.x1)*(b.y2-b.y1)-inter)}
function decode(output,prep){
 const dims=output.dims,vals=output.data;
 // YOLO segmentation output: [1, (4 + classes + mask coefficients), candidates].
 const channels=dims[dims.length-2],candidates=dims[dims.length-1];
 if(channels<10||candidates<100)throw new Error("The downloaded model output format was unexpected; no report was generated.");
 const dets=[];
 for(let j=0;j<candidates;j++){
  let best=-1,score=0;
  for(let k=0;k<LABELS.length;k++){const s=vals[(4+k)*candidates+j];if(s>score){score=s;best=k}}
  if(score<CONF_THRESHOLD||best<0)continue;
  const cx=vals[j],cy=vals[candidates+j],w=vals[2*candidates+j],h=vals[3*candidates+j];
  let x1=(cx-w/2-prep.left)/prep.scale,y1=(cy-h/2-prep.top)/prep.scale;
  let x2=(cx+w/2-prep.left)/prep.scale,y2=(cy+h/2-prep.top)/prep.scale;
  x1=Math.max(0,Math.min(prep.width,x1));x2=Math.max(0,Math.min(prep.width,x2));
  y1=Math.max(0,Math.min(prep.height,y1));y2=Math.max(0,Math.min(prep.height,y2));
  if(x2>x1&&y2>y1)dets.push({label:LABELS[best],score,x1,y1,x2,y2});
 }
 dets.sort((a,b)=>b.score-a.score);
 const kept=[];for(const d of dets){if(!kept.some(k=>k.label===d.label&&iou(k,d)>IOU_THRESHOLD))kept.push(d)}
 return kept.slice(0,30);
}
function money(n){return "₹"+Math.round(n).toLocaleString("en-IN")}
function severityFor(d,img){const area=((d.x2-d.x1)*(d.y2-d.y1))/(img.naturalWidth*img.naturalHeight);return area>.18?"Large visible region":area>.06?"Medium visible region":"Small visible region"}
function costRange(d,img){const base=COSTS[d.label]||[2000,15000],area=((d.x2-d.x1)*(d.y2-d.y1))/(img.naturalWidth*img.naturalHeight);const factor=area>.18?1.5:area>.06?1.15:0.8;return [base[0]*factor,base[1]*factor]}
function drawDetections(img,dets){
 const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext("2d");ctx.drawImage(img,0,0);
 const scale=Math.min(1,1400/Math.max(c.width,c.height));if(scale<1){const small=document.createElement("canvas");small.width=Math.round(c.width*scale);small.height=Math.round(c.height*scale);small.getContext("2d").drawImage(c,0,0,small.width,small.height);return drawBoxes(small,dets,scale)}
 return drawBoxes(c,dets,1)
}
function drawBoxes(c,dets,scale){
 const ctx=c.getContext("2d");ctx.lineWidth=Math.max(3,4/scale);ctx.font="bold "+Math.max(18,22/scale)+"px sans-serif";
 dets.forEach((d,i)=>{const x=d.x1*scale,y=d.y1*scale,w=(d.x2-d.x1)*scale,h=(d.y2-d.y1)*scale;ctx.strokeStyle="#dc2626";ctx.strokeRect(x,y,w,h);const label=d.label+" "+Math.round(d.score*100)+"%";const tw=ctx.measureText(label).width;ctx.fillStyle="#b91c1c";ctx.fillRect(x,Math.max(0,y-30),tw+14,28);ctx.fillStyle="#fff";ctx.fillText(label,x+7,Math.max(20,y-10))});
 return c.toDataURL("image/jpeg",.88)
}
function showResults(dets,img,prep){
 const detected=dets.length>0,counts={};dets.forEach(d=>counts[d.label]=(counts[d.label]||0)+1);
 const rows=dets.map((d,i)=>{const r=costRange(d,img);return {d,r,sev:severityFor(d,img)}});const low=rows.reduce((s,x)=>s+x.r[0],0),high=rows.reduce((s,x)=>s+x.r[1],0);
 const annotated=drawDetections(img,dets);const date=new Date().toLocaleString();
 let html='<div class="report-meta">AI model assessment · '+esc(date)+' · Model: YOLO11 vehicle damage segmentation</div>';
 html+='<div class="report-disclaimer"><strong>Assessment note:</strong> Results are generated automatically from the uploaded image. Please review the detected regions before relying on the estimate.</div>';
 html+='<div class="detail-card" style="margin-bottom:14px"><h3>AI detection result</h3><img src="'+annotated+'" alt="Vehicle image with AI detection boxes" style="display:block;width:100%;max-height:560px;object-fit:contain;background:#111;border-radius:12px"><p>'+ (detected?'The model detected '+dets.length+' candidate damage region(s). Review the labelled boxes below.':'No damage regions passed the model confidence threshold. This does not prove the vehicle is undamaged; retake clear photos from multiple angles if needed.')+'</p></div>';
 if(detected){
  html+='<div class="result-grid">'+Object.entries(counts).map(([label,count])=>'<div class="result-card"><small>Detected category</small><strong>'+esc(label)+'</strong><span>'+count+' region(s)</span></div>').join("")+'</div>';
  html+='<div class="detail-card"><h3>Detected regions and estimated costs</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb">Damage type</th><th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb">Model confidence</th><th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb">Visible region</th><th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb">Indicative cost</th></tr></thead><tbody>'+rows.map(x=>'<tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">'+esc(x.d.label)+'</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">'+Math.round(x.d.score*100)+'%</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">'+esc(x.sev)+'</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">'+money(x.r[0])+' – '+money(x.r[1])+'</td></tr>').join("")+'</tbody></table></div><p><strong>Combined indicative range: '+money(low)+' – '+money(high)+'</strong></p><p>May double-count overlapping detections. Confirm part prices, vehicle model, labour and hidden damage with a repair professional.</p></div>';
 }else{
  html+='<div class="result-grid"><div class="result-card"><small>Detected damage regions</small><strong>0</strong></div><div class="result-card"><small>Assessment status</small><strong>Not confirmed</strong></div></div>';
 }
 const samplePolicy={insurer:"SampleShield Motor Cover (fictional)",policyNo:"SAMPLE-MOTOR-2026-001",cover:"Sample comprehensive cover",sumInsured:500000,deductible:2000,coverageRate:0.8};
 const claimLow=detected?Math.min(samplePolicy.sumInsured,Math.max(0,low-samplePolicy.deductible)*samplePolicy.coverageRate):null;
 const claimHigh=detected?Math.min(samplePolicy.sumInsured,Math.max(0,high-samplePolicy.deductible)*samplePolicy.coverageRate):null;
 const customerLow=detected?Math.max(0,low-claimLow):null;
 const customerHigh=detected?Math.max(0,high-claimHigh):null;
 html+='<div class="detail-card" style="margin-top:14px"><h3>Sample insurance and final cost breakdown</h3><p><strong>SAMPLE POLICY DETAILS — fictional information for this academic project only.</strong> This is not a real insurer, policy, coverage promise or claim decision.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><tbody><tr><td style="padding:9px;border-bottom:1px solid #e5e7eb">Sample insurer</td><td style="padding:9px;border-bottom:1px solid #e5e7eb">'+esc(samplePolicy.insurer)+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e5e7eb">Sample policy number</td><td style="padding:9px;border-bottom:1px solid #e5e7eb">'+esc(samplePolicy.policyNo)+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e5e7eb">Illustrative cover</td><td style="padding:9px;border-bottom:1px solid #e5e7eb">'+esc(samplePolicy.cover)+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e5e7eb">Assumed sum insured</td><td style="padding:9px;border-bottom:1px solid #e5e7eb">'+money(samplePolicy.sumInsured)+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e5e7eb">Assumed deductible</td><td style="padding:9px;border-bottom:1px solid #e5e7eb">'+money(samplePolicy.deductible)+'</td></tr><tr><td style="padding:9px;border-bottom:1px solid #e5e7eb">Assumed eligible share after deductible</td><td style="padding:9px;border-bottom:1px solid #e5e7eb">80% (assumed rule)</td></tr></tbody></table></div>'+(detected?'<div class="result-grid" style="margin-top:14px"><div class="result-card"><small>Estimated repair total</small><strong>'+money(low)+' – '+money(high)+'</strong></div><div class="result-card"><small>Sample insurer share</small><strong>'+money(claimLow)+' – '+money(claimHigh)+'</strong></div><div class="result-card"><small>Estimated customer share</small><strong>'+money(customerLow)+' – '+money(customerHigh)+'</strong></div><div class="result-card"><small>Calculation</small><strong>80% after deductible</strong></div></div><p><strong>Estimated final customer cost: '+money(customerLow)+' – '+money(customerHigh)+'</strong></p><p>Calculation is illustrative only: 80% × (repair estimate − deductible), capped at the sample sum insured. Actual policies may use different excesses, exclusions, depreciation, limits, approved labour rates and claim conditions.</p>':'<p>No damage region was detected above the model threshold, so the prototype cannot calculate a meaningful repair or insurance estimate. Try a clearer close-up photo.</p>')+'</div>';
 html+='<div class="detail-card" style="margin-top:14px"><h3>Recommended next steps</h3><ul><li>Photograph the vehicle in daylight, close enough to show the damaged area.</li><li>Capture front, rear, both sides and close-ups of any visible damage.</li><li>Have a qualified repair professional inspect structural, sensor and hidden damage.</li><li>Use your insurer’s official process for any claim.</li></ul></div>';
 reportContent.innerHTML=html;currentReport={dets,rows,low,high,detected};results.classList.remove("hidden");resetBtn.classList.remove("hidden");results.scrollIntoView({behavior:"smooth",block:"start"});
}
analyzeBtn.addEventListener("click",async()=>{
 if(!selectedFile){imageError.textContent="Please upload a vehicle image before starting.";return}
 analysisError.textContent="";analysisError.classList.add("hidden");analyzeBtn.disabled=true;loading.classList.remove("hidden");results.classList.add("hidden");
 try{
  const img=await loadImage(selectedFile);const prep=prepareTensor(img);const session=await loadOrt();
  const inputName=session.inputNames[0];const output=await session.run({[inputName]:prep.tensor});
  const out=output[session.outputNames[0]];const dets=decode(out,prep);showResults(dets,img,prep);
 }catch(e){analysisError.textContent=e.message||"AI image analysis failed. No result report was generated.";analysisError.classList.remove("hidden")}
 finally{loading.classList.add("hidden");analyzeBtn.disabled=false}
});
$("#printBtn").addEventListener("click",()=>window.print());$("#generateBtn").addEventListener("click",()=>window.print());
resetBtn.addEventListener("click",()=>{clearFile();results.classList.add("hidden");resetBtn.classList.add("hidden");window.scrollTo({top:$("#assessment").offsetTop-80,behavior:"smooth"})});
