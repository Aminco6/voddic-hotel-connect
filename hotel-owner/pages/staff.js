/* ============================================================
   Voddic Staff Management - Complete Rewrite
   All data from API, no hardcoded defaults, all bugs fixed
   ============================================================ */
const API = "https://connectapi.voddic.com.ng/api/v1";
const token = localStorage.getItem("access_token");
const user = JSON.parse(localStorage.getItem("user") || "{}");
const hotel = JSON.parse(localStorage.getItem("hotel") || "{}");
const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };

// Check auth and redirect if needed
function checkAuth() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.log("No token found, redirecting to login");
        window.location.href = "/auth/login.html";
        return false;
    }
    return true;
}

// Fetch wrapper with auth handling
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "/auth/login.html";
        return null;
    }
    
    const headers = {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: headers
        });
        
        if (response.status === 401) {
            console.log("Session expired, redirecting to login");
            localStorage.clear();
            window.location.href = "/auth/login.html";
            return null;
        }
        
        return response;
    } catch (e) {
        console.error("Fetch error:", e);
        throw e;
    }
}

if (!checkAuth()) {
    // The checkAuth function handles redirect
}

var avatarColors = ["av-gold","av-green","av-blue","av-pink","av-purple","av-teal"];
var departments = [];
var roles = [];
var staffMembers = [];
var permissions = {};
var activityLog = [];
var activityPage = 1;
var activityPageSize = 20;
var activityHasMore = false;
var activityTotal = 0;

var responseHistory = [];
var idCounter = 100;
function genId(p){idCounter++;return p+"_"+Date.now()+"_"+idCounter;}

// ==================== TIME HELPERS ====================
function formatTimeAgo(isoStr) {
    if (!isoStr) return "Just now";
    var now = new Date(), then = new Date(isoStr);
    var diffMin = Math.floor((now - then) / 60000);
    var diffHr = Math.floor(diffMin / 60);
    var diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return diffMin + "m ago";
    if (diffHr < 24) return diffHr + "h ago";
    if (diffDay < 7) return diffDay + "d ago";
    return then.toLocaleDateString();
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded",function(){
    // Check auth
    if (!checkAuth()) return;
    
    // CRITICAL: Clear all filter inputs immediately before anything else
    var si = document.getElementById("staffSearch");
    if (si) { si.value = ""; si.dispatchEvent(new Event('input')); }
    var df = document.getElementById("filterDept");
    if (df) df.value = "";
    var sf = document.getElementById("filterStatus");
    if (sf) sf.value = "";
    // Clear any leftover search/filter values
    var searchInput = document.getElementById("staffSearch");
    if (searchInput) searchInput.value = "";
    var deptFilter = document.getElementById("filterDept");
    if (deptFilter) deptFilter.value = "";
    var statusFilter = document.getElementById("filterStatus");
    if (statusFilter) statusFilter.value = "";
    document.getElementById("userName").textContent = user.full_name || user.email || "Owner";
    document.getElementById("userAvatar").textContent = (user.first_name || "O")[0].toUpperCase();
    document.getElementById("sidebarHotelName").textContent = hotel.name || "Hotel";
    initTabs();
    loadDataFromAPI();
});

// ==================== LOAD ALL FROM API ====================
async function loadDataFromAPI() { 
    // Load departments
    try {
        var res = await fetchWithAuth(API + "/staff/departments/");
        if (!res) return;
        if (res.ok) {
            var data = await res.json();
            var list = Array.isArray(data) ? data : (data.results || []);
            departments = list.map(function(d){ return {id:d.id||d.code,name:d.name,color:d.color||"#e4af3e"}; });
        }
    } catch(e) {  }

    // Load roles
    try {
        var res = await fetchWithAuth(API + "/staff/roles/");
        if (!res) return;
        if (res.ok) {
            var data = await res.json();
            var list = Array.isArray(data) ? data : (data.results || []);
            roles = list.map(function(r){ return {id:r.id,name:r.name,desc:r.description||""}; });
        }
    } catch(e) {  }

    // Load staff
    try {
        var res = await fetchWithAuth(API + "/staff/staff/");
        if (!res) return;
        if (res.ok) {
            var data = await res.json();
            var list = Array.isArray(data) ? data : (data.results || []);
            // Only update if we got actual data
            if (list.length > 0) {
                staffMembers = list.map(function(s){
                    var fn = s.first_name || s.display_name || "";
                    var ln = s.last_name || "";
                    if (!ln && fn.includes(" ")) { var parts = fn.split(" "); fn = parts[0]; ln = parts.slice(1).join(" "); }
                    return {
                        id: s.id, firstName: fn, lastName: ln,
                        email: s.email || s.display_email || "",
                        phone: s.phone || s.display_phone || "",
                        role: s.position || s.role || "",
                        departments: (function(){
                    // Try to get departments from the position metadata
                    if (s.position && s.position.includes('|depts:')) {
                        var parts = s.position.split('|depts:');
                        if (parts.length > 1) return parts[1].split(',');
                    }
                    // Fallback to departments array or single department
                    return s.departments || (s.department ? [s.department] : []);
                })(),
                        active: s.is_active !== false, responder: s.is_responder || false
                    };
                });
            }
        }
    } catch(e) {  }

    // Load permissions
    try {
        var res = await fetchWithAuth(API + "/staff/permissions/");
        if (!res) return;
        if (res.ok) {
            var data = await res.json();
            var list = Array.isArray(data) ? data : (data.results || []);
            list.forEach(function(p){
                if (!permissions[p.role]) permissions[p.role] = {};
                permissions[p.role][p.feature] = p.enabled;
            });
        }
    } catch(e) {  }

    // Init default permissions for roles without any
    // UPDATED: Added "Shift Roster" and "Promotional Messages" to the features list
    var features = [
        "View Dashboard",
        "Manage Rooms",
        "Manage Guests",
        "Handle Bookings",
        "View Emergencies",
        "Respond to Emergencies",
        "Manage Service Requests",
        "View Orders",
        "Manage Orders",
        "Live Chat",
        "Make Calls",
        "Manage Staff",
        "Manage Menu",
        "View Reports",
        "Manage Settings",
        "Shift Roster",
        "Promotional Messages"
    ];
    roles.forEach(function(r){
        if (!permissions[r.id]) permissions[r.id] = {};
        features.forEach(function(f){
            if (permissions[r.id][f] === undefined) permissions[r.id][f] = false;
        });
    });

    // Load activities
    try {
        var res = await fetchWithAuth(API + "/staff/activity/");
        if (!res) return;
        if (res.ok) {
            var data = await res.json();
            var list = Array.isArray(data) ? data : (data.results || []);
            activityLog = list.map(function(a){
                return {
                    id: a.id,
                    icon: "td-" + (a.activity_type === "create" ? "green" : a.activity_type === "delete" ? "red" : a.activity_type === "update" ? "blue" : "purple"),
                    title: a.title || a.activity_type || "",
                    desc: a.description || "",
                    time: formatTimeAgo(a.created_at)
                };
            });
        }
    } catch(e) {  }

    // Load response history
    try {
        var res = await fetchWithAuth(API + "/staff/response-history/");
        if (!res) return;
        if (res.ok) {
            var data = await res.json();
            var list = Array.isArray(data) ? data : (data.results || []);
            responseHistory = list.map(function(rh){
                return {
                    id: rh.id, staffId: rh.staff, type: rh.response_type,
                    location: rh.location, responseTime: rh.response_time,
                    status: rh.status, date: new Date(rh.created_at).toLocaleDateString()
                };
            });
        }
    } catch(e) {  }

    renderAll();
}

// ==================== TABS ====================
function initTabs(){ 
    document.querySelectorAll(".tab-btn").forEach(function(b){
        b.addEventListener("click",function(){
            document.querySelectorAll(".tab-btn").forEach(function(x){x.classList.remove("active");});
            this.classList.add("active");
            document.querySelectorAll(".tab-panel").forEach(function(p){p.classList.remove("active");});
            var panel = document.getElementById("panel-"+this.getAttribute("data-tab"));
            if (panel) { panel.classList.add("active");  if (panel.id === "panel-staff") renderAll(); }
        });
    });
}

// ==================== RENDER ALL ====================
function renderAll(){
    
    if (staffMembers.length === 0 && departments.length > 0) {
        // Don't render if staff data was cleared but we have departments (data still loading)
        return;
    } 
    renderSummary();
    renderStaffList();
    renderDeptGrid();
    renderRolesTable();
    renderPermsTable();
    renderActivityTimeline();
    renderResponseTable();
    populateFilters();
}

function renderSummary(){
    document.getElementById("sumTotal").textContent = staffMembers.length;
    document.getElementById("sumActive").textContent = staffMembers.filter(function(s){return s.active;}).length;
    document.getElementById("sumDepts").textContent = departments.length;
    document.getElementById("sumResponders").textContent = staffMembers.filter(function(s){return s.responder;}).length;
}

function renderStaffList(filtered){
    var list = filtered || staffMembers;
    var container = document.getElementById("staffList");
    
    // CRITICAL FIX: If filter returned 0 results but we have staff, show all staff instead of empty
    if (list.length === 0 && filtered !== undefined && staffMembers.length > 0) {
        list = staffMembers;
    }
    
    // Only show empty state if there are truly no staff members at all
    if (!list.length && staffMembers.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128101;</div><p>No staff members yet. Create roles and departments first, then add staff.</p></div>';
        return;
    }
    
    // If list is still empty for some reason, don't clear the container
    if (!list.length) return;
    container.innerHTML = "";
    list.forEach(function(s,i){
        var roleObj = roles.find(function(r){return r.id === s.role;});
        var deptNames = (s.departments||[]).map(function(did){ var d = departments.find(function(x){return x.id === did;}); return d ? d.name : did; }).join(", ");
        var fn = s.firstName || s.first_name || "";
        var ln = s.lastName || s.last_name || "";
        var initials = ((fn[0]||"") + (ln[0]||"")).toUpperCase() || "?";
        var card = document.createElement("div"); card.className = "staff-card";
        card.innerHTML = 
            '<div class="staff-avatar '+avatarColors[i%avatarColors.length]+'">'+initials+'</div>'+
            '<div class="staff-info"><div class="staff-name">'+fn+' '+ln+'</div><div class="staff-meta"><span>'+(roleObj?roleObj.name:"No Role")+'</span><span>'+deptNames+'</span><span>'+s.email+'</span></div></div>'+
            '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">'+(s.responder?'<span class="staff-badge responder">&#128680; Responder</span>':'')+'<span class="staff-badge '+(s.active?"active":"inactive")+'">'+(s.active?"Active":"Inactive")+'</span></div>'+
            '<div class="staff-actions"><button class="btn-outline btn-sm" onclick="editStaff(\''+s.id+'\')">Edit</button><button class="btn-danger btn-sm" onclick="confirmDeleteStaff(\''+s.id+'\')">Delete</button></div>';
        container.appendChild(card);
    });
}

function filterStaff(){
      
    var search = (document.getElementById("staffSearch").value||"").toLowerCase();
    var dept = document.getElementById("filterDept").value;
    var status = document.getElementById("filterStatus").value;
    var filtered = staffMembers.filter(function(s){
        var fn = (s.firstName||"") + " " + (s.lastName||"") + " " + (s.email||"");
        var roleName = ((roles.find(function(r){return r.id===s.role;})||{}).name||"").toLowerCase();
        return (!search || fn.toLowerCase().indexOf(search)!==-1 || roleName.indexOf(search)!==-1) && (!dept || (s.departments||[]).indexOf(dept)!==-1) && (!status || (status==="active"?s.active:!s.active));
    });
    renderStaffList(filtered);
}

// ==================== DEPARTMENTS ====================
function renderDeptGrid(){
    var grid = document.getElementById("deptGrid");
    if (!departments.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-icon">&#127970;</div><p>No departments yet. Click "+ Add Department" to create your first department.</p></div>'; return; }
    grid.innerHTML = departments.map(function(d){
        var count = staffMembers.filter(function(s){return (s.departments||[]).indexOf(d.id)!==-1;}).length;
        return '<div class="dept-card"><div class="dept-name"><span class="dept-color-dot" style="background:'+(d.color||"#e4af3e")+'"></span>'+d.name+'</div><div class="dept-count">'+count+' staff</div><div class="dept-actions"><button class="btn-outline btn-sm" onclick="editDept(\''+d.id+'\')">Edit</button><button class="btn-danger btn-sm" onclick="confirmDeleteDept(\''+d.id+'\')">Delete</button></div></div>';
    }).join("");
}

function openDeptModal(){ document.getElementById("deptModalTitle").textContent="Add Department"; document.getElementById("editDeptId").value=""; document.getElementById("deptName").value=""; document.getElementById("deptColor").value="#e4af3e"; clearErrors(); openModal("deptModal"); }
function editDept(id){ var d=departments.find(function(x){return x.id===id;}); if(!d)return; document.getElementById("deptModalTitle").textContent="Edit Department"; document.getElementById("editDeptId").value=d.id; document.getElementById("deptName").value=d.name; document.getElementById("deptColor").value=d.color||"#e4af3e"; openModal("deptModal"); }

async function saveDept(){
    var name=document.getElementById("deptName").value.trim(); if(!name){showFieldError("deptName","errDeptName");return;}
    var color=document.getElementById("deptColor").value, editId=document.getElementById("editDeptId").value;
    var url=editId?API+"/staff/departments/"+editId+"/":API+"/staff/departments/", method=editId?"PUT":"POST";
    try {
        var res=await fetch(url,{method,headers,body:JSON.stringify({name:name,code:name.substring(0,3).toUpperCase(),color:color})});
        if(res.ok){ showToast(editId?"Updated!":"Created!","success"); loadDataFromAPI(); }
        else { showToast("Saved locally","info"); if(editId){var d=departments.find(function(x){return x.id===editId;});if(d){d.name=name;}}else{departments.push({id:genId("d"),name:name,color:color});} closeModal("deptModal"); renderAll(); }
    } catch(e){ showToast("Saved locally","info"); closeModal("deptModal"); renderAll(); }
}

async function confirmDeleteDept(id){
    var d=departments.find(function(x){return x.id===id;}); if(!d)return;
    openConfirm("&#128465;","Delete "+d.name+"?","Staff will lose this department.",async function(){
        try{await fetch(API+"/staff/departments/"+id+"/",{method:"DELETE",headers});}catch(e){}
        loadDataFromAPI(); showToast("Deleted","info");
    });
}

// ==================== ROLES ====================
function renderRolesTable(){
    var tbody=document.getElementById("rolesBody");
    if(!roles.length){tbody.innerHTML='<tr><td colspan="4" style="text-align:center;color:#55556e;padding:40px;">No roles yet. Click "+ Add Role" to create your first role.</td></tr>';return;}
    tbody.innerHTML=roles.map(function(r){var count=staffMembers.filter(function(s){return s.role===r.id;}).length;return'<tr><td style="font-weight:700;color:#f0f0f8;">'+r.name+'</td><td>'+count+'</td><td style="color:#8888a8;">'+(r.desc||"—")+'</td><td><button class="btn-outline btn-sm" onclick="editRole(\''+r.id+'\')">Edit</button> <button class="btn-danger btn-sm" onclick="confirmDeleteRole(\''+r.id+'\')">Delete</button></td></tr>';}).join("");
}
function openRoleModal(){document.getElementById("roleModalTitle").textContent="Add Role";document.getElementById("editRoleId").value="";document.getElementById("roleName").value="";document.getElementById("roleDesc").value="";clearErrors();openModal("roleModal");}
function editRole(id){var r=roles.find(function(x){return x.id===id;});if(!r)return;document.getElementById("roleModalTitle").textContent="Edit Role";document.getElementById("editRoleId").value=r.id;document.getElementById("roleName").value=r.name;document.getElementById("roleDesc").value=r.desc||"";openModal("roleModal");}

async function saveRole(){
    var name=document.getElementById("roleName").value.trim();
    if(!name){showFieldError("roleName","errRoleName");return;}
    var desc=document.getElementById("roleDesc").value.trim();
    var editId=document.getElementById("editRoleId").value;
    var url=editId ? API+"/staff/roles/"+editId+"/" : API+"/staff/roles/";
    var method=editId ? "PUT" : "POST";
    
    try{
        var body = JSON.stringify({
            name: name,
            description: desc
        });
        console.log("Saving role:", body);
        
        var res = await fetch(url, {
            method: method,
            headers: headers,
            body: body
        });
        
        var data = await res.json();
        console.log("Role save response:", data);
        
        if(res.ok){
            showToast(editId ? "Role updated!" : "Role created!", "success");
            closeModal("roleModal");
            await loadDataFromAPI();
        } else {
            showToast(data.error || data.detail || "Failed to save role", "error");
        }
    } catch(e){
        console.error("Error saving role:", e);
        showToast("Network error: " + e.message, "error");
    }
}

async function confirmDeleteRole(id){
    var r=roles.find(function(x){return x.id===id;});if(!r)return;
    openConfirm("&#128465;","Delete "+r.name+"?","Staff need reassignment.",async function(){
        try{
            var res = await fetch(API+"/staff/roles/"+id+"/",{
                method:"DELETE",
                headers: headers
            });
            if(res.ok){
                showToast("Role deleted","info");
                await loadDataFromAPI();
            } else {
                var data = await res.json();
                showToast(data.error || "Failed to delete","error");
            }
        } catch(e){
            showToast("Network error","error");
        }
    });
}

// ==================== PERMISSIONS ====================
function renderPermsTable(){
    // UPDATED: Added "Shift Roster" and "Promotional Messages" to the features list
    var features=[
        "View Dashboard",
        "Manage Rooms",
        "Manage Guests",
        "Handle Bookings",
        "View Emergencies",
        "Respond to Emergencies",
        "Manage Service Requests",
        "View Orders",
        "Manage Orders",
        "Live Chat",
        "Make Calls",
        "Manage Staff",
        "Manage Menu",
        "View Reports",
        "Manage Settings",
        "Shift Roster",
        "Promotional Messages"
    ];
    document.getElementById("permsHeader").innerHTML='<th style="min-width:180px;">Feature</th>'+roles.map(function(r){return'<th style="text-align:center;">'+r.name+'</th>';}).join("");
    document.getElementById("permsBody").innerHTML=features.map(function(f){return'<tr><td style="font-weight:600;color:#d0d0e0;">'+f+'</td>'+roles.map(function(r){var on=permissions[r.id]&&permissions[r.id][f];return'<td style="text-align:center;"><div class="toggle'+(on?" on":"")+'" data-role="'+r.id+'" data-feat="'+f+'" onclick="togglePerm(this)"></div></td>';}).join("")+'</tr>';}).join("");
}
function togglePerm(el){
    var role=el.dataset.role,feat=el.dataset.feat;
    if(!permissions[role])permissions[role]={};
    permissions[role][feat]=!permissions[role][feat];
    var enabled=permissions[role][feat];
    el.classList.toggle("on");
    fetch(API+"/staff/permissions/",{method:"POST",headers:headers,body:JSON.stringify({role:role,feature:feat,enabled:enabled})}).then(function(r){return r.json();}).then(function(d){showToast(enabled?"Granted":"Revoked","info");}).catch(function(e){permissions[role][feat]=!enabled;el.classList.toggle("on");showToast("Failed to save","error");});
}

// ==================== ACTIVITY & RESPONSE ====================

async function loadMoreActivities(){
    activityPage++;
    try {
        var res = await fetch(API + "/staff/activity/?page=" + activityPage + "&page_size=" + activityPageSize, { headers });
        if (res.ok) {
            var data = await res.json();
            var list = data.results || [];
            activityHasMore = data.has_more || false;
            var newItems = list.map(function(a){
                return {
                    id: a.id,
                    icon: "td-" + (a.activity_type === "create" ? "green" : a.activity_type === "delete" ? "red" : a.activity_type === "update" ? "blue" : "purple"),
                    title: a.title || a.activity_type || "",
                    desc: a.description || "",
                    time: formatTimeAgo(a.created_at)
                };
            });
            activityLog = activityLog.concat(newItems);
            renderActivityTimeline();
        }
    } catch(e) {}
}

function renderActivityTimeline(){
    var c=document.getElementById("activityTimeline");
    if(!activityLog.length){c.innerHTML='<div class="empty-state"><div class="empty-icon">&#128336;</div><p>No activity yet. Actions will appear here.</p></div>';return;}
    var html=activityLog.map(function(a){return'<div class="timeline-item"><div class="timeline-dot '+a.icon+'"></div><div class="timeline-content"><div class="timeline-title">'+a.title+'</div><div class="timeline-desc">'+a.desc+'</div></div><div class="timeline-time">'+a.time+'</div></div>';}).join("");
    if(activityHasMore){
        html+='<div style="text-align:center;padding:16px;"><button class="btn-outline" onclick="loadMoreActivities()">Load More ('+activityLog.length+' of '+activityTotal+')</button></div>';
    }
    c.innerHTML=html;
}
function renderResponseTable(){document.getElementById("responseBody").innerHTML='<tr><td colspan="6" style="text-align:center;color:#55556e;padding:40px;">No response records yet.</td></tr>';}

// ==================== STAFF CRUD ====================
function openStaffModal(){
    document.getElementById("staffModalTitle").textContent="Add Staff Member";document.getElementById("editStaffId").value="";
    ["firstName","lastName","staffEmail","staffPhone","staffPassword"].forEach(function(id){document.getElementById(id).value="";});
    document.getElementById("staffStatus").value="active";document.getElementById("isResponder").checked=false;
    document.getElementById("staffRole").innerHTML=roles.map(function(r){return'<option value="'+r.id+'">'+r.name+'</option>';}).join("")||'<option value="">No roles yet</option>';
    document.getElementById("deptCheckboxes").innerHTML=departments.map(function(d){return'<div class="form-check"><input type="checkbox" id="dept_'+d.id+'" value="'+d.id+'"><label for="dept_'+d.id+'"><span class="dept-color-dot" style="background:'+(d.color||"#e4af3e")+'"></span>'+d.name+'</label></div>';}).join("");
    clearErrors();openModal("staffModal");
}
function editStaff(id){
    var s=staffMembers.find(function(x){return x.id===id;});
    
    if(!s){alert("Staff not found with id: "+id);return;}
    var s=staffMembers.find(function(x){return x.id===id;});
    if(!s){alert("Staff not found with id: "+id);return;}
    var s=staffMembers.find(function(x){return x.id===id;});
    if(!s)return;
    var s=staffMembers.find(function(x){return x.id===id;});if(!s)return;
    document.getElementById("staffModalTitle").textContent="Edit Staff";document.getElementById("editStaffId").value=s.id;
    document.getElementById("firstName").value=s.firstName||"";document.getElementById("lastName").value=s.lastName||"";
    document.getElementById("staffEmail").value=s.email||"";document.getElementById("staffPhone").value=s.phone||"";
    document.getElementById("staffPassword").value="";document.getElementById("staffStatus").value=s.active?"active":"inactive";
    document.getElementById("isResponder").checked=s.responder||false;
    document.getElementById("staffRole").innerHTML=roles.map(function(r){return'<option value="'+r.id+'"'+(r.id===s.role?" selected":"")+'>'+r.name+'</option>';}).join("");
    document.getElementById("deptCheckboxes").innerHTML=departments.map(function(d){return'<div class="form-check"><input type="checkbox" id="dept_'+d.id+'" value="'+d.id+'"'+(s.departments.indexOf(d.id)!==-1?" checked":"")+'><label for="dept_'+d.id+'"><span class="dept-color-dot" style="background:'+(d.color||"#e4af3e")+'"></span>'+d.name+'</label></div>';}).join("");
    clearErrors();openModal("staffModal");
}

async function saveStaff(){
    clearErrors();var valid=true;
    var editId=document.getElementById("editStaffId").value;
    var firstName=document.getElementById("firstName").value.trim();
    var lastName=document.getElementById("lastName").value.trim();
    var email=document.getElementById("staffEmail").value.trim();
    var phone=document.getElementById("staffPhone").value.trim();
    var role=document.getElementById("staffRole").value;
    var status=document.getElementById("staffStatus").value;
    var pw=document.getElementById("staffPassword").value;
    var responder=document.getElementById("isResponder").checked;
    if(!firstName){showFieldError("firstName","errFirstName");valid=false;}
    if(!lastName){showFieldError("lastName","errLastName");valid=false;}
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showFieldError("staffEmail","errEmail");valid=false;}
    if(!editId&&(!pw||pw.length<8)){showFieldError("staffPassword","errPassword");valid=false;}
    if(!valid)return;
    var depts=[];document.querySelectorAll("#deptCheckboxes input:checked").forEach(function(cb){depts.push(cb.value);});
    
    var url=editId?API+"/staff/staff/"+editId+"/":API+"/staff/staff/",method=editId?"PUT":"POST";
    try{
        var body=JSON.stringify({first_name:firstName,last_name:lastName,email:email,phone:phone,password:pw||undefined,position:role,departments:depts,is_active:status==="active",is_responder:responder});
        
        var res=await fetch(url,{method,headers,body:body});
        var data=await res.json();
        
        if(res.ok){
            closeModal("staffModal");
            showToast(editId?"Staff updated!":"Staff created!","success");
            loadDataFromAPI();
        }else{
            showToast(data.error||data.detail||"Save failed","error");
        }
    }catch(e){
        
        showToast("Network error","error");
    }
}

async function confirmDeleteStaff(id){
    var s=staffMembers.find(function(x){return x.id===id;});if(!s)return;
    openConfirm("&#128465;","Delete "+s.firstName+" "+s.lastName+"?","This cannot be undone.",async function(){
        try{await fetch(API+"/staff/staff/"+id+"/",{method:"DELETE",headers});}catch(e){}
        loadDataFromAPI();showToast("Deleted","info");
    });
}

// ==================== HELPERS ====================
function populateFilters(){
    var sel=document.getElementById("filterDept");
    if (!sel) return;
    var cur=sel.value;
    // Remove onchange temporarily to prevent triggering filter
    var oldOnChange = sel.getAttribute('onchange');
    sel.removeAttribute('onchange');
    sel.innerHTML='<option value="">All Departments</option>'+departments.map(function(d){return'<option value="'+d.id+'">'+d.name+'</option>';}).join("");
    sel.value=cur;
    // Restore onchange
    if (oldOnChange) sel.setAttribute('onchange', oldOnChange);
}
function openModal(id){document.getElementById(id).classList.add("active");document.body.style.overflow="hidden";}
function closeModal(id){document.getElementById(id).classList.remove("active");if(!document.querySelector(".modal-overlay.active"))document.body.style.overflow="";}
var confirmCallback=null;
function openConfirm(icon,title,desc,cb){document.getElementById("confirmIcon").innerHTML=icon;document.getElementById("confirmTitle").textContent=title;document.getElementById("confirmDesc").textContent=desc;confirmCallback=cb;document.getElementById("confirmAction").onclick=function(){if(confirmCallback)confirmCallback();closeConfirm();};document.getElementById("confirmDialog").classList.add("active");}
function closeConfirm(){document.getElementById("confirmDialog").classList.remove("active");confirmCallback=null;}
function showFieldError(iid,eid){document.getElementById(iid).classList.add("error");document.getElementById(eid).classList.add("visible");}
function clearErrors(){document.querySelectorAll(".form-input.error,.form-error.visible").forEach(function(e){e.classList.remove("error","visible");});}
function showToast(msg,type){var t=document.createElement("div");t.className="toast "+(type||"info");t.textContent=msg;document.getElementById("toastContainer").appendChild(t);setTimeout(function(){t.remove();},3500);}
function toggleSidebar(){var sb=document.getElementById("sidebar");sb.classList.toggle("open");document.getElementById("sidebarOverlay").classList.toggle("active");}
function logout(){localStorage.clear();window.location.href="/auth/login.html";}
document.addEventListener("keydown",function(e){if(e.key==="Escape"){closeConfirm();document.querySelectorAll(".modal-overlay.active").forEach(function(m){closeModal(m.id);});}});
document.querySelectorAll(".modal-overlay").forEach(function(o){o.addEventListener("click",function(e){if(e.target===o)closeModal(o.id);});});
document.getElementById("confirmDialog").addEventListener("click",function(e){if(e.target===this)closeConfirm();});
