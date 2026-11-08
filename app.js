const STORAGE_KEY = "qlct_mvp_v2";
const LEGACY_KEY = "qlct_mvp_v1";
const categories = {
  expense: ["Ăn uống","Di chuyển","Mua sắm","Học tập","Giải trí","Hóa đơn","Sức khỏe","Nhà cửa","Khác"],
  income: ["Lương","Làm thêm","Thưởng","Trợ cấp","Được tặng","Đầu tư","Khác"]
};
const icons = {"Ăn uống":"☕","Di chuyển":"🛵","Mua sắm":"🛍","Học tập":"📚","Giải trí":"🎮","Hóa đơn":"🧾","Sức khỏe":"💊","Nhà cửa":"🏠","Lương":"💼","Làm thêm":"🧑‍💻","Thưởng":"🎁","Trợ cấp":"🎓","Được tặng":"💝","Đầu tư":"📈","Khác":"✦"};
const money = n => new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(Number(n)||0);
const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = () => localDate();
const monthKey = d => String(d||"").slice(0,7);
const currentMonth = () => today().slice(0,7);
const monthName = () => new Intl.DateTimeFormat("vi-VN",{month:"long",year:"numeric"}).format(new Date());
const defaultState = {transactions:[],budget:0,categoryBudgets:{},goals:[]};
let state = loadState(), currentFilter = "all", selectedType = "expense";
function normalizeState(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || !["transactions","budget","categoryBudgets","goals"].some(k=>Object.prototype.hasOwnProperty.call(raw,k))) throw new Error("Tệp dữ liệu không đúng định dạng.");
  const transactions = Array.isArray(raw.transactions) ? raw.transactions.map((t,i)=>{
    const amount=Number(t.amount);
    if(!Number.isSafeInteger(amount)||amount<=0) throw new Error(`Số tiền giao dịch thứ ${i+1} không hợp lệ.`);
    if(!["income","expense"].includes(t.type)) throw new Error(`Loại giao dịch thứ ${i+1} không hợp lệ.`);
    if(!isValidDate(t.date)) throw new Error(`Ngày giao dịch thứ ${i+1} không hợp lệ.`);
    return {id:String(t.id||crypto.randomUUID()),type:t.type,amount,category:String(t.category||"Khác"),date:t.date,note:String(t.note||"").slice(0,100),createdAt:Number(t.createdAt)||Date.now()};
  }) : [];
  const goals=Array.isArray(raw.goals)?raw.goals.map(g=>{
    const target=Number(g.target),saved=Number(g.saved)||0;
    if(!String(g.name||"").trim()||!Number.isSafeInteger(target)||target<=0||!Number.isSafeInteger(saved)||saved<0) throw new Error("Dữ liệu mục tiêu tiết kiệm không hợp lệ.");
    return {id:String(g.id||crypto.randomUUID()),name:String(g.name).slice(0,50),target,saved};
  }):[];
  const categoryBudgets={};
  if(raw.categoryBudgets&&typeof raw.categoryBudgets==="object"&&!Array.isArray(raw.categoryBudgets)){
    for(const [k,v] of Object.entries(raw.categoryBudgets)){const n=Number(v);if(!Number.isSafeInteger(n)||n<0)throw new Error("Hạn mức danh mục không hợp lệ.");if(n>0)categoryBudgets[k]=n;}
  }
  const budget=Number(raw.budget)||0;
  if(!Number.isSafeInteger(budget)||budget<0)throw new Error("Ngân sách tổng không hợp lệ.");
  return {transactions,budget,categoryBudgets,goals};
}
function isValidDate(value){if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+"T12:00:00");return !Number.isNaN(d.getTime())&&localDate(d)===value}
function loadState(){
  try {
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved)return normalizeState(JSON.parse(saved));
    const old=localStorage.getItem(LEGACY_KEY);
    if(old){const migrated=normalizeState(JSON.parse(old));localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}
  } catch(e){console.error("Không thể đọc dữ liệu:",e);setTimeout(()=>toast("Dữ liệu lưu cũ có lỗi. Hãy sao lưu hoặc kiểm tra bộ nhớ trình duyệt."),300)}
  return {...defaultState,categoryBudgets:{}};
}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render()}catch(e){toast("Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy.");console.error(e)}}
function sum(list,type){return list.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.amount),0)}
function monthTransactions(){return state.transactions.filter(t=>monthKey(t.date)===currentMonth())}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600)}
function showPage(name){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`));document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===name));window.scrollTo({top:0,behavior:"smooth"});render()}
function txRow(t){const sign=t.type==="income"?"+":"−";return `<div class="transaction-row"><div class="tx-icon">${icons[t.category]||"✦"}</div><div class="tx-info"><strong>${escapeHTML(t.category)}</strong><small>${escapeHTML(t.note||"Không có ghi chú")} · ${new Date(t.date+"T12:00:00").toLocaleDateString("vi-VN")}</small></div><div class="tx-right"><div class="tx-amount ${t.type}">${sign}${money(t.amount)}</div><div class="tx-actions"><button class="mini-btn" data-edit="${escapeHTML(t.id)}">Sửa</button><button class="mini-btn" data-delete="${escapeHTML(t.id)}">Xóa</button></div></div></div>`}
function bars(targetId,data){const el=document.getElementById(targetId);if(!el)return;const max=Math.max(1,...data.flatMap(d=>[d.income,d.expense]));el.innerHTML=data.map(d=>`<div class="bar-group"><div class="bar income" style="height:${Math.max(2,d.income/max*100)}%"></div><div class="bar expense" style="height:${Math.max(2,d.expense/max*100)}%"></div><span class="bar-label">${escapeHTML(d.label)}</span></div>`).join("")}
function selectedReportMonth(){return document.getElementById("reportMonth")?.value||currentMonth()}
function renderReport(){
 const key=selectedReportMonth();
 if(!/^\d{4}-\d{2}$/.test(key))return;
 const list=state.transactions.filter(t=>monthKey(t.date)===key);
 const income=sum(list,"income"),expense=sum(list,"expense"),net=income-expense;
 const date=new Date(key+"-01T12:00:00");
 const label=new Intl.DateTimeFormat("vi-VN",{month:"long",year:"numeric"}).format(date);
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
 set("statsMonth",label);set("reportPeriodCaption",label);
 set("reportIncome",money(income));set("reportExpense",money(expense));set("reportNet",money(net));
 set("reportIncomeCount",list.filter(t=>t.type==="income").length+" giao dịch thu");
 set("reportExpenseCount",list.filter(t=>t.type==="expense").length+" giao dịch chi");
 set("statsIncome",money(income));set("statsExpense",money(expense));
 const netEl=document.getElementById("reportNet");if(netEl)netEl.className=net<0?"negative":"positive";
 const grouped={};
 for(const t of list){if(!grouped[t.date])grouped[t.date]={income:0,expense:0};grouped[t.date][t.type]+=t.amount}
 const rows=Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0])).map(([day,v])=>{
   const dateLabel=new Date(day+"T12:00:00").toLocaleDateString("vi-VN");
   const delta=v.income-v.expense;
   return "<tr><td>"+dateLabel+"</td><td class='report-income-value'>"+money(v.income)+"</td><td class='report-expense-value'>"+money(v.expense)+"</td><td class='"+(delta<0?"report-expense-value":"report-income-value")+"'>"+money(delta)+"</td></tr>";
 }).join("");
 const tbody=document.getElementById("reportDailyRows");if(tbody)tbody.innerHTML=rows;
 const empty=document.getElementById("reportEmpty");if(empty)empty.classList.toggle("hidden",list.length>0);

 const prevDate=new Date(date.getFullYear(),date.getMonth()-1,1);
 const prevKey=localDate(prevDate).slice(0,7);
 const previous=state.transactions.filter(t=>monthKey(t.date)===prevKey);
 const prevIncome=sum(previous,"income"),prevExpense=sum(previous,"expense");
 const change=(current,old)=>old===0?(current===0?"0%":"Mới phát sinh"):`${current>=old?"+":""}${((current-old)/old*100).toFixed(1)}%`;
 set("incomeChange",change(income,prevIncome));set("expenseChange",change(expense,prevExpense));
 const incomeChange=document.getElementById("incomeChange"),expenseChange=document.getElementById("expenseChange");
 if(incomeChange)incomeChange.className=income>=prevIncome?"positive":"negative";
 if(expenseChange)expenseChange.className=expense<=prevExpense?"positive":"negative";

 const byCategory={};
 list.filter(t=>t.type==="expense").forEach(t=>byCategory[t.category]=(byCategory[t.category]||0)+t.amount);
 const categoriesSorted=Object.entries(byCategory).sort((x,y)=>y[1]-x[1]);
 const categoryEl=document.getElementById("categoryStats");
 if(categoryEl)categoryEl.innerHTML=categoriesSorted.length?categoriesSorted.map(([name,value])=>{
   const share=expense?value/expense*100:0;
   return `<div class="category-stat"><div class="category-stat-head"><span>${icons[name]||"✦"} ${escapeHTML(name)}</span><strong>${money(value)} · ${share.toFixed(1)}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${share}%"></div></div></div>`;
 }).join(""):'<div class="empty-hint">Chưa có khoản chi trong tháng này.</div>';

 const year=date.getFullYear(),month=date.getMonth();
 const daysInMonth=new Date(year,month+1,0).getDate();
 const weeks=Array.from({length:Math.ceil(daysInMonth/7)},(_,i)=>({label:"Tuần "+(i+1),income:0,expense:0}));
 list.forEach(t=>{const week=Math.floor((Number(t.date.slice(8,10))-1)/7);if(weeks[week])weeks[week][t.type]+=t.amount});
 bars("statsChart",weeks);
}
function exportReportCSV(){
 const key=selectedReportMonth();
 const list=state.transactions.filter(t=>monthKey(t.date)===key).sort((a,b)=>a.date.localeCompare(b.date));
 const rows=[["Báo cáo tháng",key],[],["Ngày","Loại","Danh mục","Số tiền (VND)","Ghi chú"],...list.map(t=>[t.date,t.type==="income"?"Thu":"Chi",t.category,t.amount,t.note||""]),[],["Tổng thu",sum(list,"income")],["Tổng chi",sum(list,"expense")],["Dòng tiền ròng",sum(list,"income")-sum(list,"expense")]];
 const safe=v=>{let s=String(v??"");if(/^[=+\\-@]/.test(s))s="'"+s;return "\"" + s.replace(/"/g,'""') + "\""};
 const csv="\uFEFF"+rows.map(row=>row.map(safe).join(",")).join("\r\n");
 downloadBlob(new Blob([csv],{type:"text/csv;charset=utf-8"}),"bao-cao-"+key+".csv");
 toast("Đã xuất báo cáo tháng "+key);
}
function render(){
 const m=monthTransactions(), income=sum(m,"income"), expense=sum(m,"expense");
 const balance=state.transactions.reduce((a,t)=>a+(t.type==="income"?1:-1)*Number(t.amount),0);
 document.getElementById("monthLabel").textContent=monthName();document.getElementById("statsMonth").textContent=monthName();
 document.getElementById("balanceValue").textContent=money(balance);document.getElementById("incomeValue").textContent=money(income);document.getElementById("expenseValue").textContent=money(expense);document.getElementById("remainingValue").textContent=money(income-expense);
 const sorted=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
 document.getElementById("recentTransactions").innerHTML=sorted.slice(0,5).map(txRow).join("");
 document.getElementById("homeEmpty").classList.toggle("hidden",state.transactions.length>0);
 const search=(document.getElementById("transactionSearch")?.value||"").trim().toLocaleLowerCase("vi");
 const from=document.getElementById("filterFrom")?.value||"",to=document.getElementById("filterTo")?.value||"";
 const filtered=sorted.filter(t=>(currentFilter==="all"||t.type===currentFilter)&&(!search||`${t.category} ${t.note}`.toLocaleLowerCase("vi").includes(search))&&(!from||t.date>=from)&&(!to||t.date<=to));
 document.getElementById("allTransactions").innerHTML=filtered.map(txRow).join("");document.getElementById("transactionsEmpty").classList.toggle("hidden",filtered.length>0);
 document.getElementById("statsIncome").textContent=money(income);document.getElementById("statsExpense").textContent=money(expense);
 const now=new Date(),prevDate=new Date(now.getFullYear(),now.getMonth()-1,1),prevKey=localDate(prevDate).slice(0,7),prev=state.transactions.filter(t=>monthKey(t.date)===prevKey),prevIncome=sum(prev,"income"),prevExpense=sum(prev,"expense");
 const change=(cur,old)=>old===0?(cur===0?"0%":"Mới phát sinh"):`${cur>=old?"+":""}${((cur-old)/old*100).toFixed(1)}%`;
 document.getElementById("incomeChange").textContent=change(income,prevIncome);document.getElementById("expenseChange").textContent=change(expense,prevExpense);
 document.getElementById("incomeChange").className=income>=prevIncome?"green":"red";document.getElementById("expenseChange").className=expense<=prevExpense?"green":"red";
 const byCat={};m.filter(t=>t.type==="expense").forEach(t=>byCat[t.category]=(byCat[t.category]||0)+Number(t.amount));
 const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);document.getElementById("categoryStats").innerHTML=cats.length?cats.map(([name,value])=>`<div class="category-stat"><div class="category-stat-head"><span>${icons[name]||"✦"} ${escapeHTML(name)}</span><span>${money(value)} · ${expense?(value/expense*100).toFixed(1):0}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${expense?value/expense*100:0}%"></div></div></div>`).join(""):'<div class="empty-hint">Chưa có khoản chi trong tháng này.</div>';
 const last7=Array.from({length:7},(_,i)=>{const dt=new Date();dt.setDate(dt.getDate()-(6-i));const key=localDate(dt);const list=state.transactions.filter(t=>t.date===key);return {label:dt.getDate(),income:sum(list,"income"),expense:sum(list,"expense")}});bars("homeChart",last7);bars("statsChart",last7);
 document.getElementById("budgetAmount").value=state.budget||"";document.getElementById("budgetTotal").textContent=state.budget?money(state.budget):"Chưa thiết lập";
 document.getElementById("budgetSummaryText").textContent=state.budget?`Đã sử dụng ${money(expense)} trong tháng này.`:"Đặt giới hạn để theo dõi chi tiêu.";
 const pct=state.budget?Math.min(100,expense/state.budget*100):0;document.getElementById("budgetProgress").innerHTML=state.budget?`<div class="category-stat-head"><span>Đã sử dụng</span><strong>${(expense/state.budget*100).toFixed(1)}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><p class="small-note">${expense>state.budget?"Bạn đã vượt ngân sách "+money(expense-state.budget):"Còn lại "+money(state.budget-expense)}</p>`:'<div class="empty-hint">Hãy thiết lập ngân sách để xem tiến độ.</div>';
 const budgetSelect=document.getElementById("budgetCategory");if(budgetSelect){const old=budgetSelect.value;budgetSelect.innerHTML=categories.expense.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");if(categories.expense.includes(old))budgetSelect.value=old;renderCategoryBudgets(byCat)}
 document.getElementById("savingsList").innerHTML=state.goals.map(g=>{const p=Math.min(100,g.saved/g.target*100);return `<article class="panel goal-card"><div class="goal-head"><strong>🎯 ${escapeHTML(g.name)}</strong><button data-goal-delete="${escapeHTML(g.id)}" aria-label="Xóa mục tiêu">×</button></div><div class="goal-amounts"><span>Đã tiết kiệm <strong>${money(g.saved)}</strong></span><span>${p.toFixed(1)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p}%"></div></div><div class="goal-amounts"><span>Mục tiêu: ${money(g.target)}</span><span>Còn ${money(Math.max(0,g.target-g.saved))}</span></div><div class="goal-actions"><small>${p>=100?"Đã hoàn thành!":"Tiếp tục từng bước nhỏ"}</small><button data-contribute="${escapeHTML(g.id)}">＋ Đóng góp</button></div></article>`}).join("");
 document.getElementById("savingsEmpty").classList.toggle("hidden",state.goals.length>0);
 renderReport();
}
function renderCategoryBudgets(byCat){const el=document.getElementById("categoryBudgetList");const entries=Object.entries(state.categoryBudgets||{});el.innerHTML=entries.length?entries.map(([name,limit])=>{const spent=byCat[name]||0,pct=spent/limit*100;return `<div class="category-stat"><div class="category-stat-head"><span>${icons[name]||"✦"} ${escapeHTML(name)}</span><strong>${money(spent)} / ${money(limit)}</strong></div><div class="progress-track"><div class="progress-fill ${pct>100?"over-budget":""}" style="width:${Math.min(100,pct)}%"></div></div><div class="budget-row-foot"><small>${pct>100?"Vượt "+money(spent-limit):"Còn "+money(limit-spent)}</small><button class="mini-btn" data-remove-budget="${escapeHTML(name)}">Xóa hạn mức</button></div></div>`}).join(""):'<div class="empty-hint">Chưa thiết lập ngân sách theo danh mục.</div>'}
function openTransaction(type="expense",t=null){selectedType=t?.type||type;document.getElementById("transactionId").value=t?.id||"";document.getElementById("dialogTitle").textContent=t?"Chỉnh sửa giao dịch":"Thêm giao dịch";document.getElementById("amount").value=t?.amount||"";document.getElementById("date").value=t?.date||today();document.getElementById("note").value=t?.note||"";setType(selectedType,t?.category);document.getElementById("transactionDialog").showModal();setTimeout(()=>document.getElementById("amount").focus(),100)}
function setType(type,selected){selectedType=type;document.querySelectorAll(".type-btn").forEach(b=>b.classList.toggle("active",b.dataset.type===type));fillCategories(selected)}
function fillCategories(selected){const select=document.getElementById("category");const previous=selected||select.value;select.innerHTML=categories[selectedType].map(c=>`<option>${escapeHTML(c)}</option>`).join("");if(categories[selectedType].includes(previous))select.value=previous}
function closeDialog(){document.getElementById("transactionDialog").close()}
document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
document.getElementById("quickAdd").addEventListener("click",()=>openTransaction());document.getElementById("addTransactionTop").addEventListener("click",()=>openTransaction());
document.querySelectorAll(".type-btn").forEach(b=>b.addEventListener("click",()=>setType(b.dataset.type)));
["closeDialog","cancelDialog"].forEach(id=>document.getElementById(id).addEventListener("click",closeDialog));
document.getElementById("transactionDialog").addEventListener("click",e=>{if(e.target.id==="transactionDialog")closeDialog()});
document.getElementById("transactionForm").addEventListener("submit",e=>{e.preventDefault();const id=document.getElementById("transactionId").value;const amount=Number(document.getElementById("amount").value),date=document.getElementById("date").value;if(!Number.isSafeInteger(amount)||amount<1){toast("Số tiền phải là số nguyên VNĐ lớn hơn 0.");return}if(!isValidDate(date)){toast("Ngày giao dịch không hợp lệ.");return}const item={id:id||crypto.randomUUID(),type:selectedType,amount,category:document.getElementById("category").value,date,note:document.getElementById("note").value.trim().slice(0,100),createdAt:Date.now()};if(id){const i=state.transactions.findIndex(t=>t.id===id);if(i>=0)state.transactions[i]={...state.transactions[i],...item}}else state.transactions.push(item);closeDialog();saveState();toast(id?"Đã cập nhật giao dịch":"Đã thêm giao dịch")});
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{currentFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render()}));
["transactionSearch","filterFrom","filterTo"].forEach(id=>document.getElementById(id).addEventListener("input",render));
document.getElementById("clearFilters").addEventListener("click",()=>{document.getElementById("transactionSearch").value="";document.getElementById("filterFrom").value="";document.getElementById("filterTo").value="";currentFilter="all";document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));render()});
document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit]");if(edit){const t=state.transactions.find(x=>x.id===edit.dataset.edit);if(t)openTransaction(t.type,t)}const del=e.target.closest("[data-delete]");if(del&&confirm("Bạn có chắc muốn xóa giao dịch này?")){state.transactions=state.transactions.filter(t=>t.id!==del.dataset.delete);saveState();toast("Đã xóa giao dịch")}const contribute=e.target.closest("[data-contribute]");if(contribute){document.getElementById("contributeGoalId").value=contribute.dataset.contribute;document.getElementById("contributeAmount").value="";document.getElementById("contributeDialog").showModal()}const goalDel=e.target.closest("[data-goal-delete]");if(goalDel&&confirm("Xóa mục tiêu tiết kiệm này?")){state.goals=state.goals.filter(g=>g.id!==goalDel.dataset.goalDelete);saveState();toast("Đã xóa mục tiêu")}const removeBudget=e.target.closest("[data-remove-budget]");if(removeBudget&&confirm(`Xóa hạn mức ${removeBudget.dataset.removeBudget}?`)){delete state.categoryBudgets[removeBudget.dataset.removeBudget];saveState();toast("Đã xóa hạn mức")}});
document.getElementById("budgetForm").addEventListener("submit",e=>{e.preventDefault();const n=Number(document.getElementById("budgetAmount").value);if(!Number.isSafeInteger(n)||n<0){toast("Ngân sách phải là số nguyên không âm.");return}state.budget=n;saveState();toast("Đã lưu ngân sách")});
document.getElementById("categoryBudgetForm").addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("budgetCategory").value,n=Number(document.getElementById("categoryBudgetAmount").value);if(!Number.isSafeInteger(n)||n<0){toast("Hạn mức phải là số nguyên không âm.");return}if(n===0)delete state.categoryBudgets[name];else state.categoryBudgets[name]=n;document.getElementById("categoryBudgetAmount").value="";saveState();toast(n?"Đã lưu hạn mức danh mục":"Đã xóa hạn mức")});
document.getElementById("savingsForm").addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("goalName").value.trim(),target=Number(document.getElementById("goalTarget").value);if(!name||!Number.isSafeInteger(target)||target<=0){toast("Vui lòng nhập tên và số tiền mục tiêu hợp lệ.");return}state.goals.push({id:crypto.randomUUID(),name:name.slice(0,50),target,saved:0});e.target.reset();saveState();toast("Đã tạo mục tiêu tiết kiệm")});
["closeContribute","cancelContribute"].forEach(id=>document.getElementById(id).addEventListener("click",()=>document.getElementById("contributeDialog").close()));
document.getElementById("contributeForm").addEventListener("submit",e=>{e.preventDefault();const g=state.goals.find(x=>x.id===document.getElementById("contributeGoalId").value),amount=Number(document.getElementById("contributeAmount").value);if(!g||!Number.isSafeInteger(amount)||amount<=0){toast("Số tiền đóng góp không hợp lệ.");return}if(!Number.isSafeInteger(g.saved+amount)){toast("Số tiền vượt giới hạn lưu trữ.");return}g.saved+=amount;saveState();document.getElementById("contributeDialog").close();toast("Đã ghi nhận khoản tiết kiệm")});
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportCSV(){const rows=[["Ngày","Loại","Danh mục","Số tiền (VND)","Ghi chú"],...state.transactions.map(t=>[t.date,t.type==="income"?"Thu":"Chi",t.category,t.amount,t.note||""])];const safe=v=>{let s=String(v??"");if(/^[=+\-@]/.test(s))s="'"+s;return `"${s.replace(/"/g,'""')}"`};const csv="\uFEFF"+rows.map(r=>r.map(safe).join(",")).join("\r\n");downloadBlob(new Blob([csv],{type:"text/csv;charset=utf-8"}),`giao-dich-${today()}.csv`);toast("Đã xuất file CSV")}
function backupJSON(){const payload={app:"QuanLyChiTieu",version:2,exportedAt:new Date().toISOString(),data:state};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),`sao-luu-chi-tieu-${today()}.json`);toast("Đã tạo bản sao lưu JSON")}
async function restoreJSON(file){try{if(file.size>5*1024*1024)throw new Error("Tệp lớn hơn giới hạn 5 MB.");const raw=JSON.parse(await file.text());const candidate=normalizeState(raw.data||raw);if(!confirm(`Khôi phục ${candidate.transactions.length} giao dịch và ${candidate.goals.length} mục tiêu? Dữ liệu hiện tại sẽ được thay thế.`))return;state=candidate;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render();toast("Đã khôi phục dữ liệu thành công")}catch(e){toast(e.message||"Không thể đọc tệp sao lưu.")}finally{document.getElementById("restoreFile").value=""}}
document.getElementById("exportBtn").addEventListener("click",exportCSV);document.getElementById("backupJson").addEventListener("click",backupJSON);document.getElementById("restoreJson").addEventListener("click",()=>document.getElementById("restoreFile").click());document.getElementById("restoreFile").addEventListener("change",e=>{if(e.target.files[0])restoreJSON(e.target.files[0])});
document.getElementById("todayLabel").textContent=new Intl.DateTimeFormat("vi-VN",{weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase();
const reportMonthInput=document.getElementById("reportMonth");
if(reportMonthInput){reportMonthInput.value=currentMonth();reportMonthInput.addEventListener("change",renderReport)}
document.getElementById("exportReportBtn")?.addEventListener("click",exportReportCSV);
render();
if("serviceWorker" in navigator&&location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
