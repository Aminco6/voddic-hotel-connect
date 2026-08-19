#!/bin/bash
# Insert debug logs at key points
sed -i 's|function loadDataFromAPI() {|function loadDataFromAPI() { console.log("🔄 loadDataFromAPI CALLED");|' staff.js
sed -i 's|function renderAll(){|function renderAll(){ console.log("📊 renderAll - staffMembers:", staffMembers.length, "departments:", departments.length, "roles:", roles.length);|' staff.js
sed -i 's|function renderStaffList(filtered){|function renderStaffList(filtered){ console.log("👥 renderStaffList - list param:", filtered ? filtered.length : "undefined", "staffMembers:", staffMembers.length);|' staff.js
sed -i 's|function filterStaff(){|function filterStaff(){ console.log("🔍 filterStaff called");|' staff.js
sed -i 's|function initTabs(){|function initTabs(){ console.log("📑 initTabs called");|' staff.js

# Add tab switch logging
sed -i 's|if (panel) panel.classList.add("active");|if (panel) { panel.classList.add("active"); console.log("📑 Tab switched to:", panel.id); }|' staff.js

echo "✅ Debug logs added. Open browser console (F12) and click between tabs."
echo "Send me what you see in the console."
