const MODEL=process.env.OPENAI_MODEL||"gpt-4.1-mini";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json",...corsHeaders}});
function fallback(description){
  const text=description.toLowerCase();
  const types=[];
  if(/scratch|scrape|paint/.test(text))types.push("scratch");
  if(/dent|dented/.test(text))types.push("dent");
  if(/crack|cracked/.test(text))types.push("crack");
  if(/bumper/.test(text))types.push("bumper_damage");
  if(/headlight|head lamp/.test(text))types.push("headlight_damage");
  if(/windshield|windscreen/.test(text))types.push("windshield_damage");
  if(/broken|shatter/.test(text))types.push("broken_part");
  if(!types.length)types.push("multiple_damage");
  const severity=/critical|severe|major|heavy/.test(text)?"high":/moderate|medium/.test(text)?"moderate":/minor|small|low speed|light/.test(text)?"low":"moderate";
  const impactArea=/right/.test(text)&&/front/.test(text)?"front-right":/left/.test(text)&&/front/.test(text)?"front-left":/rear|back/.test(text)?"rear":/front/.test(text)?"front":"not clear";
  const costs={scratch:"₹2,000 – ₹6,000",dent:"₹5,000 – ₹15,000",bumper_damage:"₹8,000 – ₹25,000",headlight_damage:"₹6,000 – ₹30,000",windshield_damage:"₹7,000 – ₹25,000"};
  const range=types.length===1&&costs[types[0]]?costs[types[0]]:severity==="high"?"₹35,000 – ₹80,000+":"₹10,000 – ₹35,000";
  return {analysisMode:"Demo / fallback analysis",severity,confidence:.55,impactArea,damageTypes:types,damageSummary:`The description indicates possible ${types.join(", ").replaceAll("_"," ")} around the ${impactArea} area. Image-specific findings require a configured vision model.`,incident:{accidentType:/rear|back/.test(text)?"rear collision":/hit|collision|crash|accident/.test(text)?"vehicle collision":"incident described by user",impactDirection:impactArea,components:types.map(x=>x.replaceAll("_"," ")),severity},consistency:{level:"PARTIAL CONSISTENCY",explanation:"Fallback mode uses the written description and cannot independently verify image evidence."},repairRange:range,nextStep:"Document the damage from multiple angles and contact your insurer or an authorized repair center for a formal inspection."};
}
function cleanJson(s){const start=s.indexOf("{"),end=s.lastIndexOf("}");return start>=0&&end>start?s.slice(start,end+1):s}
async function openAI(image,description){
  const system=`You are a vehicle damage assessment assistant. Analyze the provided vehicle image and accident description conservatively. Return ONLY valid JSON with keys: severity, confidence (0-1), impactArea, damageTypes (array), repairRange, damageSummary, incident {accidentType, impactDirection, components, severity}, consistency {level, explanation}, nextStep. Do not claim certainty when image is unclear. Do not provide a legally binding insurance decision or exact repair quotation. Separate visible image evidence from information supplied by the user. Use approximate Indian rupee repair ranges only.`;
  const body={model:MODEL,messages:[{role:"system",content:system},{role:"user",content:[{type:"text",text:`Accident description: ${description}`},{type:"image_url",image_url:{url:image}}]}],temperature:.1,max_tokens:1200};
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error("OpenAI request failed");
  const data=await r.json();const raw=data.choices?.[0]?.message?.content||"";
  return JSON.parse(cleanJson(raw));
}
export default async function handler(req){
  if(req.method==="OPTIONS")return new Response("",{status:204,headers:corsHeaders});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const body=await req.json();const {image,description}=body||{};
    if(!image||typeof image!=="string"||!description||typeof description!=="string")return json({error:"Image and accident description are required."},400);
    if(description.length>3000)return json({error:"Description is too long."},400);
    if(!/^data:image\/(jpeg|png|webp);base64,/i.test(image))return json({error:"Unsupported image format."},400);
    let result;
    if(process.env.OPENAI_API_KEY) {
      try{result=await openAI(image,description);result.analysisMode="OpenAI vision analysis"}catch(e){result=fallback(description)}
    } else result=fallback(description);
    return json(result);
  }catch(e){return json({error:"The analysis could not be completed. Please try again."},500)}
}
