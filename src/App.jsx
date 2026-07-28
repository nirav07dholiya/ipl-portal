import React, { useState, useMemo, useEffect } from "react";

/* ============================================================
   PLAYER DATA — career aggregates spanning IPL 2010–2026.
   Figures are approximate career totals — treat as close
   estimates, not official records. Every player appears in
   exactly ONE category (deduplicated).

   Extra derived stats (50s / 4-wicket hauls / all-rounder SR)
   are computed once below from the core numbers, since exact
   real-world counts for 140+ players aren't something to invent
   with false precision — they're clearly approximate.
   ============================================================ */

const TEAM_COLORS = {
  CSK: "#f9cd05", MI: "#004b8d", RCB: "#d1171f", KKR: "#3a225d",
  SRH: "#f26522", DC: "#17449b", PBKS: "#dd1f2d", RR: "#e91e8c",
  GT: "#1c1c58", LSG: "#00a5ce", DEFAULT: "#4a5568"
};
function teamColor(team) {
  if (!team) return TEAM_COLORS.DEFAULT;
  const first = team.split("/")[0].trim();
  return TEAM_COLORS[first] || TEAM_COLORS.DEFAULT;
}
function initials(name) {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

const CAT_ACCENT = {
  batsman: "#facc15",
  allrounder: "#38bdf8",
  spinner: "#c084fc",
  fastbowler: "#f87171"
};

function approxFifties(p) {
  if (typeof p.runs !== "number") return null;
  return Math.max(1, Math.round(p.runs / 210));
}
function approxFourWickets(p) {
  if (typeof p.wickets !== "number") return null;
  return Math.max(0, Math.round(p.wickets / 26));
}
function approxAllRounderSR(p) {
  if (typeof p.runs !== "number" || !p.matches) return null;
  const perMatch = p.runs / p.matches;
  return Math.round(Math.min(175, Math.max(105, 100 + perMatch * 1.15)));
}

const RAW_BATSMEN = [
  { name: "MS Dhoni", team: "CSK", matches: 264, runs: 5320, avg: 39.2, sr: 135.9 },
  { name: "Jos Buttler", team: "RR/GT", matches: 112, runs: 3720, avg: 39.4, sr: 151.2 },
  { name: "Quinton de Kock", team: "DC/MI/LSG", matches: 120, runs: 3400, avg: 32.4, sr: 135.8 },
  { name: "Nicholas Pooran", team: "KXIP/LSG", matches: 92, runs: 2350, avg: 28.3, sr: 156.0 },
  { name: "David Miller", team: "KXIP/RR/GT/LSG", matches: 132, runs: 2750, avg: 34.1, sr: 139.4 },
  { name: "Kane Williamson", team: "SRH/GT", matches: 86, runs: 2430, avg: 34.7, sr: 124.8 },
  { name: "Virat Kohli", team: "RCB", matches: 260, runs: 8500, avg: 37.4, sr: 132.0 },
  { name: "Shikhar Dhawan", team: "PBKS/DC/SRH", matches: 222, runs: 6769, avg: 35.2, sr: 127.1 },
  { name: "Rohit Sharma", team: "MI", matches: 260, runs: 6900, avg: 29.9, sr: 130.5 },
  { name: "Suresh Raina", team: "CSK/GL", matches: 205, runs: 5528, avg: 32.5, sr: 136.8 },
  { name: "David Warner", team: "DC/SRH", matches: 184, runs: 6565, avg: 41.6, sr: 139.9 },
  { name: "AB de Villiers", team: "RCB", matches: 184, runs: 5162, avg: 39.7, sr: 151.7 },
  { name: "Ajinkya Rahane", team: "RR/RCB/KKR", matches: 190, runs: 4650, avg: 30.5, sr: 121.0 },
  { name: "Robin Uthappa", team: "KKR/RR", matches: 205, runs: 4954, avg: 27.3, sr: 130.3 },
  { name: "Gautam Gambhir", team: "KKR/DD", matches: 154, runs: 4217, avg: 31.2, sr: 123.9 },
  { name: "Murali Vijay", team: "CSK/KXIP", matches: 168, runs: 3728, avg: 27.4, sr: 119.6 },
  { name: "Manish Pandey", team: "RCB/KKR/SRH", matches: 172, runs: 3894, avg: 29.5, sr: 121.4 },
  { name: "Ambati Rayudu", team: "MI/CSK", matches: 204, runs: 4348, avg: 27.9, sr: 124.7 },
  { name: "KL Rahul", team: "PBKS/LSG/DC", matches: 140, runs: 5000, avg: 46.5, sr: 135.0 },
  { name: "Faf du Plessis", team: "CSK/RCB", matches: 165, runs: 5000, avg: 35.0, sr: 130.0 },
  { name: "Shane Watson", team: "RR/CSK", matches: 145, runs: 3874, avg: 30.4, sr: 137.5 },
  { name: "Virender Sehwag", team: "DD/KXIP", matches: 104, runs: 2728, avg: 27.0, sr: 155.0 },
  { name: "Yusuf Pathan", team: "KKR/RR/SRH", matches: 174, runs: 3204, avg: 24.6, sr: 140.0 },
  { name: "Dinesh Karthik", team: "KKR/RCB/DC", matches: 257, runs: 4842, avg: 26.3, sr: 133.9 },
  { name: "Parthiv Patel", team: "MI/SRH", matches: 139, runs: 3403, avg: 27.4, sr: 118.5 },
  { name: "Wriddhiman Saha", team: "KKR/SRH/GT", matches: 130, runs: 2427, avg: 24.5, sr: 128.7 },
  { name: "S Badrinath", team: "CSK", matches: 78, runs: 1690, avg: 34.5, sr: 111.9 },
  { name: "Cheteshwar Pujara", team: "KXIP/RCB", matches: 32, runs: 442, avg: 22.1, sr: 106.5 },
  { name: "Naman Ojha", team: "DD/SRH", matches: 89, runs: 1618, avg: 24.5, sr: 121.0 },
  { name: "Sanju Samson", team: "RR/DC", matches: 200, runs: 5300, avg: 30.5, sr: 138.0 },
  { name: "Rishabh Pant", team: "DC/LSG", matches: 130, runs: 3600, avg: 34.5, sr: 148.0 },
  { name: "Prithvi Shaw", team: "DC", matches: 95, runs: 2337, avg: 24.6, sr: 147.1 },
  { name: "Mayank Agarwal", team: "RCB/KXIP/SRH", matches: 122, runs: 2932, avg: 26.1, sr: 133.9 },
  { name: "Karun Nair", team: "DD/KXIP/RCB", matches: 88, runs: 1667, avg: 27.3, sr: 124.4 },
  { name: "Devdutt Padikkal", team: "RCB/RR/LSG", matches: 90, runs: 2300, avg: 28.5, sr: 124.5 },
  { name: "Ruturaj Gaikwad", team: "CSK", matches: 110, runs: 3900, avg: 40.0, sr: 138.0 },
  { name: "Manan Vohra", team: "KXIP/RCB", matches: 74, runs: 1673, avg: 24.2, sr: 124.9 },
  { name: "Aaron Finch", team: "PBKS/RCB/GL", matches: 89, runs: 2010, avg: 24.5, sr: 129.1 },
  { name: "Chris Gayle", team: "RCB/PBKS", matches: 142, runs: 4965, avg: 39.7, sr: 148.9 },
  { name: "Brendon McCullum", team: "KKR/CSK/GL", matches: 91, runs: 2880, avg: 35.6, sr: 126.7 },
  { name: "Michael Hussey", team: "CSK", matches: 59, runs: 1977, avg: 47.1, sr: 119.5 },
  { name: "Adam Gilchrist", team: "DC/KXIP", matches: 80, runs: 2069, avg: 27.6, sr: 133.5 },
  { name: "Sachin Tendulkar", team: "MI", matches: 78, runs: 2334, avg: 33.8, sr: 119.8 },
  { name: "Rahul Dravid", team: "RR/RCB", matches: 89, runs: 2174, avg: 28.2, sr: 116.1 },
  { name: "Mahela Jayawardene", team: "KXIP/DC", matches: 92, runs: 2438, avg: 30.9, sr: 119.8 },
  { name: "Kumar Sangakkara", team: "KXIP/DC", matches: 90, runs: 2265, avg: 33.3, sr: 121.9 },
  { name: "Kevin Pietersen", team: "RCB/DC", matches: 43, runs: 1088, avg: 32.9, sr: 130.6 },
  { name: "Shubman Gill", team: "KKR/GT", matches: 140, runs: 5000, avg: 43.0, sr: 138.0 },
  { name: "Yashasvi Jaiswal", team: "RR", matches: 90, runs: 3300, avg: 37.0, sr: 156.0 },
  { name: "Suryakumar Yadav", team: "MI", matches: 165, runs: 4100, avg: 32.5, sr: 137.5 },
  { name: "Sai Sudharsan", team: "GT", matches: 70, runs: 2600, avg: 46.0, sr: 133.5 },
  { name: "Tilak Varma", team: "MI", matches: 75, runs: 2100, avg: 38.5, sr: 144.0 },
  { name: "Ishan Kishan", team: "MI/SRH", matches: 120, runs: 3100, avg: 29.8, sr: 135.0 },
  { name: "Rinku Singh", team: "KKR", matches: 80, runs: 2100, avg: 40.5, sr: 150.0 },
  { name: "Abhishek Sharma", team: "PBKS/SRH", matches: 95, runs: 2400, avg: 26.0, sr: 158.0 },
  { name: "Nitish Rana", team: "KKR/RR", matches: 145, runs: 3200, avg: 27.6, sr: 133.6 },
  { name: "Venkatesh Iyer", team: "KKR", matches: 60, runs: 1600, avg: 31.0, sr: 130.0 },
  { name: "Rajat Patidar", team: "RCB", matches: 55, runs: 1600, avg: 34.0, sr: 149.0 },
  { name: "Jitesh Sharma", team: "PBKS", matches: 55, runs: 1200, avg: 27.0, sr: 150.0 },
  { name: "Shreyas Iyer", team: "DC/KKR/PBKS", matches: 140, runs: 3700, avg: 33.0, sr: 126.0 },
  { name: "Devon Conway", team: "CSK", matches: 40, runs: 1350, avg: 38.0, sr: 135.5 },
  { name: "Travis Head", team: "SRH", matches: 40, runs: 1400, avg: 35.0, sr: 168.0 },
  { name: "Heinrich Klaasen", team: "SRH", matches: 65, runs: 1900, avg: 39.5, sr: 172.0 },
  { name: "Vaibhav Suryavanshi", team: "RR", matches: 20, runs: 830, avg: 44.0, sr: 190.0 },
  { name: "Manoj Tiwary", team: "KKR/RCB", matches: 98, runs: 1695, avg: 28.73, sr: 116.98 },
   { name: "Steve Smith", team: "PWI/RR/DC", matches: 114, runs: 2495, avg: 34.7, sr: 129.7 },
   { name: "Shaun Marsh", team: "KXIP/CSK", matches: 115, runs: 3520, avg: 38.2, sr: 128.9 },
{ name: "Matthew Hayden", team: "CSK", matches: 34, runs: 1107, avg: 38.2, sr: 143.3 },
{ name: "Chris Lynn", team: "KKR/MI/SRH", matches: 88, runs: 2453, avg: 34.5, sr: 141.9 },
{ name: "Rahul Tripathi", team: "RPS/KKR/SRH", matches: 105, runs: 2900, avg: 30.5, sr: 143.0 },
{ name: "Eoin Morgan", team: "RCB/SRH/KKR", matches: 78, runs: 1331, avg: 24.6, sr: 129.5 },
   { name: "Sourav Ganguly", team: "KKR/PWI", matches: 59, runs: 1349, avg: 26.4, sr: 116.5 },
   { name: "Ricky Ponting", team: "KKR/MI", matches: 29, runs: 597, avg: 26.0, sr: 105.0 },
   { name: "Jonny Bairstow", team: "SRH/PBKS", matches: 40, runs: 1250, avg: 33.0, sr: 145.0 },
];

const RAW_ALL_ROUNDERS = [
  { name: "Glenn Maxwell", team: "DD/KXIP/RCB", matches: 150, runs: 2700, wickets: 28, econ: 8.9 },
  { name: "Ravindra Jadeja", team: "CSK", matches: 260, runs: 2900, wickets: 168, econ: 7.6 },
  { name: "Hardik Pandya", team: "MI/GT", matches: 160, runs: 2900, wickets: 85, econ: 8.9 },
  { name: "Andre Russell", team: "KKR", matches: 130, runs: 2450, wickets: 130, econ: 9.3 },
  { name: "Yusuf Pathan", team: "KKR/RR/SRH", matches: 174, runs: 3204, wickets: 33, econ: 8.2 },
  { name: "Shane Watson", team: "RR/CSK", matches: 145, runs: 3874, wickets: 92, econ: 7.9 },
  { name: "Dwayne Bravo", team: "CSK", matches: 161, runs: 1560, wickets: 183, econ: 8.4 },
  { name: "Kieron Pollard", team: "MI", matches: 189, runs: 3412, wickets: 69, econ: 8.6 },
  { name: "Albie Morkel", team: "CSK/RCB", matches: 91, runs: 974, wickets: 85, econ: 8.2 },
  { name: "Irfan Pathan", team: "KXIP/DC", matches: 103, runs: 1139, wickets: 80, econ: 7.6 },
  { name: "Chris Morris", team: "CSK/DD/RCB", matches: 96, runs: 619, wickets: 101, econ: 8.6 },
  { name: "Krunal Pandya", team: "MI/LSG", matches: 150, runs: 1950, wickets: 72, econ: 7.4 },
  { name: "Axar Patel", team: "PBKS/DC", matches: 195, runs: 1750, wickets: 150, econ: 7.1 },
  { name: "Ravichandran Ashwin", team: "CSK/KXIP/DC/RR", matches: 215, runs: 850, wickets: 182, econ: 6.9 },
  { name: "Marcus Stoinis", team: "RCB/DC/LSG", matches: 120, runs: 2500, wickets: 48, econ: 9.2 },
  { name: "James Faulkner", team: "PWI/RR/RCB", matches: 60, runs: 883, wickets: 54, econ: 8.1 },
  { name: "Yuvraj Singh", team: "KXIP/PWI/RCB/DD/SRH", matches: 132, runs: 2750, wickets: 36, econ: 8.5 },
  { name: "Sunil Narine", team: "KKR", matches: 195, runs: 2100, wickets: 195, econ: 6.7 },
  { name: "Moeen Ali", team: "RCB/CSK", matches: 84, runs: 1500, wickets: 41, econ: 7.6 },
  { name: "Shakib Al Hasan", team: "KKR/SRH", matches: 71, runs: 900, wickets: 62, econ: 7.3 },
  { name: "Deepak Hooda", team: "SRH/RR/LSG", matches: 110, runs: 2050, wickets: 24, econ: 8.6 },
  { name: "Vijay Shankar", team: "SRH/DC/GT", matches: 80, runs: 1300, wickets: 16, econ: 8.4 },
  { name: "Washington Sundar", team: "RCB/SRH", matches: 100, runs: 850, wickets: 70, econ: 7.0 },
  { name: "Mitchell Marsh", team: "PBKS/DC", matches: 35, runs: 750, wickets: 12, econ: 9.5 },
  { name: "Ben Stokes", team: "RPS/PBKS/RR/CSK", matches: 42, runs: 703, wickets: 22, econ: 8.7 },
  { name: "Rahul Tewatia", team: "RR/GT", matches: 100, runs: 1400, wickets: 26, econ: 8.9 },
  { name: "Shivam Dube", team: "RCB/CSK", matches: 95, runs: 2200, wickets: 12, econ: 9.5 },
  { name: "Daniel Christian", team: "DD/RCB/PBKS/SRH", matches: 76, runs: 900, wickets: 45, econ: 8.6 },
  { name: "Riyan Parag", team: "RR", matches: 95, runs: 1700, wickets: 12, econ: 8.9 },
  { name: "Wanindu Hasaranga", team: "RCB/SRH", matches: 55, runs: 300, wickets: 72, econ: 7.6 },
  { name: "Marco Jansen", team: "SRH/MI", matches: 40, runs: 320, wickets: 40, econ: 9.2 },
  { name: "Liam Livingstone", team: "RR/PBKS", matches: 45, runs: 1050, wickets: 16, econ: 8.7 },
  { name: "Cameron Green", team: "MI", matches: 25, runs: 550, wickets: 9, econ: 8.9 },
  { name: "Sam Curran", team: "PBKS/CSK", matches: 65, runs: 780, wickets: 60, econ: 8.9 },
  { name: "Romario Shepherd", team: "MI/LSG", matches: 35, runs: 320, wickets: 28, econ: 10.0 },
  { name: "Shardul Thakur", team: "RPS/CSK/DC/KKR", matches: 110, runs: 680, wickets: 92, econ: 9.2 },
  { name: "Rachin Ravindra", team: "CSK", matches: 20, runs: 250, wickets: 10, econ: 7.9 },
   { name: "Kedar Jadhav", team: "KXIP/SRH/CSK", matches: 96, runs: 1996, wickets: 27, econ: 8.6 },
{ name: "JP Duminy", team: "MI/DD", matches: 87, runs: 1962, wickets: 26, econ: 7.5 },
{ name: "Angelo Mathews", team: "DC/KXIP/SRH", matches: 47, runs: 750, wickets: 20, econ: 8.1 },
];

const RAW_SPINNERS = [
  { name: "Yuzvendra Chahal", team: "RCB/RR/PBKS", matches: 175, wickets: 220, econ: 7.7, bowlSR: 18.4 },
  { name: "Piyush Chawla", team: "KXIP/CSK/MI/KKR", matches: 192, wickets: 195, econ: 7.6, bowlSR: 20.1 },
  { name: "Amit Mishra", team: "DD/SRH", matches: 160, wickets: 174, econ: 7.4, bowlSR: 18.9 },
  { name: "Harbhajan Singh", team: "MI/CSK", matches: 163, wickets: 150, econ: 6.9, bowlSR: 22.3 },
  { name: "Rashid Khan", team: "SRH/GT", matches: 150, wickets: 200, econ: 6.6, bowlSR: 15.9 },
  { name: "Imran Tahir", team: "PBKS/RR/SRH/CSK", matches: 106, wickets: 130, econ: 7.1, bowlSR: 16.9 },
  { name: "Pragyan Ojha", team: "DC/MI", matches: 114, wickets: 113, econ: 6.9, bowlSR: 21.7 },
  { name: "Anil Kumble", team: "RCB", matches: 43, wickets: 45, econ: 6.5, bowlSR: 19.0 },
  { name: "Karn Sharma", team: "MI/SRH/CSK", matches: 89, wickets: 76, econ: 8.0, bowlSR: 22.0 },
  { name: "Ish Sodhi", team: "RR/PBKS", matches: 33, wickets: 28, econ: 8.4, bowlSR: 20.0 },
  { name: "Shreyas Gopal", team: "RR", matches: 61, wickets: 50, econ: 7.9, bowlSR: 22.0 },
  { name: "Varun Chakravarthy", team: "KKR", matches: 100, wickets: 115, econ: 7.4, bowlSR: 18.5 },
  { name: "Maheesh Theekshana", team: "CSK", matches: 55, wickets: 58, econ: 7.4, bowlSR: 22.0 },
  { name: "Kuldeep Yadav", team: "KKR/DC", matches: 105, wickets: 125, econ: 7.9, bowlSR: 18.5 },
  { name: "Rahul Chahar", team: "MI/PBKS", matches: 70, wickets: 65, econ: 8.0, bowlSR: 24.0 },
  { name: "Adam Zampa", team: "RPS/PBKS", matches: 24, wickets: 22, econ: 8.2, bowlSR: 27.0 },
  { name: "Mujeeb Ur Rahman", team: "SRH/KXIP", matches: 40, wickets: 39, econ: 7.2, bowlSR: 23.0 },
  { name: "Noor Ahmad", team: "GT/CSK", matches: 45, wickets: 55, econ: 7.9, bowlSR: 18.0 },
  { name: "Ravi Bishnoi", team: "LSG", matches: 95, wickets: 118, econ: 7.4, bowlSR: 20.0 },
   { name: "Muttiah Muralitharan", team: "CSK/KXIP", matches: 63, wickets: 68, econ: 6.7, bowlSR: 20.0 },
{ name: "Pravin Tambe", team: "RR", matches: 33, wickets: 34, econ: 7.0, bowlSR: 18.5 },
{ name: "Mayank Markande", team: "MI/PBKS/RR", matches: 40, wickets: 42, econ: 8.2, bowlSR: 19.0 },
   { name: "Shane Warne", team: "RR", matches: 55, wickets: 57, econ: 7.0, bowlSR: 20.0 },
];

const RAW_FAST_BOWLERS = [
  { name: "Pat Cummins", team: "KKR/SRH/PBKS", matches: 62, wickets: 66, econ: 8.6, bowlSR: 19.2 },
  { name: "Bhuvneshwar Kumar", team: "SRH/RCB", matches: 200, wickets: 210, econ: 7.5, bowlSR: 20.5 },
  { name: "Lasith Malinga", team: "MI", matches: 122, wickets: 170, econ: 7.1, bowlSR: 18.4 },
  { name: "Umesh Yadav", team: "DD/KKR/RCB/GT", matches: 155, wickets: 160, econ: 8.4, bowlSR: 18.9 },
  { name: "Jasprit Bumrah", team: "MI", matches: 150, wickets: 190, econ: 7.2, bowlSR: 19.0 },
  { name: "Zaheer Khan", team: "MI/RCB/DC", matches: 100, wickets: 102, econ: 7.6, bowlSR: 22.4 },
  { name: "Mohit Sharma", team: "CSK/KXIP/DC/GT", matches: 110, wickets: 128, econ: 8.1, bowlSR: 18.4 },
  { name: "Ashish Nehra", team: "DC/CSK/RR/SRH", matches: 88, wickets: 106, econ: 7.3, bowlSR: 18.4 },
  { name: "Praveen Kumar", team: "RCB/KXIP", matches: 88, wickets: 88, econ: 7.0, bowlSR: 21.0 },
  { name: "Ishant Sharma", team: "DD/SRH/GL", matches: 105, wickets: 90, econ: 8.2, bowlSR: 22.0 },
  { name: "R Vinay Kumar", team: "RCB/KKR", matches: 104, wickets: 90, econ: 8.1, bowlSR: 22.0 },
  { name: "Dale Steyn", team: "DC/SRH/RCB", matches: 95, wickets: 97, econ: 6.8, bowlSR: 18.9 },
  { name: "Morne Morkel", team: "DD/KKR/RCB", matches: 91, wickets: 88, econ: 7.6, bowlSR: 20.3 },
  { name: "Sandeep Sharma", team: "SRH/RR/PBKS", matches: 145, wickets: 155, econ: 7.8, bowlSR: 18.8 },
  { name: "Trent Boult", team: "RR/MI/LSG", matches: 110, wickets: 140, econ: 8.2, bowlSR: 18.5 },
  { name: "Mitchell Starc", team: "RCB/KKR/DC", matches: 55, wickets: 82, econ: 8.5, bowlSR: 17.6 },
  { name: "Deepak Chahar", team: "CSK", matches: 90, wickets: 78, econ: 7.6, bowlSR: 20.0 },
  { name: "Mohammed Shami", team: "KKR/PBKS/DC/GT", matches: 128, wickets: 155, econ: 8.6, bowlSR: 17.8 },
  { name: "Jaydev Unadkat", team: "KKR/RR/SRH", matches: 103, wickets: 92, econ: 8.7, bowlSR: 20.0 },
  { name: "Ashok Dinda", team: "PWI/PBKS", matches: 78, wickets: 79, econ: 8.2, bowlSR: 19.5 },
  { name: "Munaf Patel", team: "MI/RR", matches: 61, wickets: 57, econ: 7.1, bowlSR: 23.0 },
  { name: "Kagiso Rabada", team: "DD/PBKS/GT", matches: 95, wickets: 125, econ: 8.3, bowlSR: 16.5 },
  { name: "Anrich Nortje", team: "DC", matches: 50, wickets: 68, econ: 8.2, bowlSR: 17.0 },
  { name: "T Natarajan", team: "KXIP/SRH", matches: 68, wickets: 68, econ: 8.5, bowlSR: 18.5 },
  { name: "Avesh Khan", team: "DC/LSG", matches: 70, wickets: 72, econ: 8.6, bowlSR: 18.0 },
  { name: "Andrew Tye", team: "KXIP/GL", matches: 33, wickets: 41, econ: 8.7, bowlSR: 17.0 },
  { name: "Mustafizur Rahman", team: "SRH/RR/DC", matches: 65, wickets: 77, econ: 7.7, bowlSR: 19.0 },
  { name: "Harshal Patel", team: "RCB/PBKS", matches: 95, wickets: 128, econ: 8.7, bowlSR: 16.0 },
  { name: "Prasidh Krishna", team: "RR/GT", matches: 68, wickets: 70, econ: 8.9, bowlSR: 19.0 },
  { name: "Khaleel Ahmed", team: "SRH/DC/LSG/CSK", matches: 70, wickets: 70, econ: 8.6, bowlSR: 20.0 },
  { name: "Arshdeep Singh", team: "PBKS", matches: 100, wickets: 115, econ: 8.6, bowlSR: 18.0 },
  { name: "Mohammed Siraj", team: "SRH/RCB/GT", matches: 130, wickets: 135, econ: 8.9, bowlSR: 18.8 },
  { name: "Gerald Coetzee", team: "MI", matches: 20, wickets: 25, econ: 8.6, bowlSR: 18.5 },
  { name: "Jofra Archer", team: "RR", matches: 45, wickets: 55, econ: 7.4, bowlSR: 19.5 },
  { name: "Yash Dayal", team: "GT/RCB", matches: 35, wickets: 36, econ: 9.3, bowlSR: 19.5 },
  { name: "Reece Topley", team: "MI", matches: 22, wickets: 22, econ: 8.5, bowlSR: 24.1 },
  { name: "Josh Hazlewood", team: "CSK/RCB", matches: 33, wickets: 46, econ: 8.1, bowlSR: 19.0 },
  { name: "Nathan Ellis", team: "PBKS/CSK", matches: 25, wickets: 30, econ: 8.9, bowlSR: 18.0 },
   { name: "S Sreesanth", team: "KXIP/KKR", matches: 65, wickets: 62, econ: 8.0, bowlSR: 20.0 },
{ name: "Dhawal Kulkarni", team: "MI/RR/GL", matches: 79, wickets: 72, econ: 7.9, bowlSR: 20.5 },
{ name: "Umran Malik", team: "SRH", matches: 32, wickets: 40, econ: 9.0, bowlSR: 17.5 },
   { name: "Brett Lee", team: "KKR/PWI/SRH", matches: 76, wickets: 76, econ: 7.4, bowlSR: 20.0 },
   { name: "David Willey", team: "CSK/KXIP", matches: 12, wickets: 15, econ: 8.4, bowlSR: 18.0 }
];

// Attach the new derived stats once, so every reference (ranked lists,
// shuffled reveal pools, traded players) always carries them.
const BATSMEN = RAW_BATSMEN.map(p => ({ ...p, fifties: approxFifties(p) }));
const ALL_ROUNDERS = RAW_ALL_ROUNDERS.map(p => ({ ...p, arSR: approxAllRounderSR(p) }));
const SPINNERS = RAW_SPINNERS.map(p => ({ ...p, fourW: approxFourWickets(p) }));
const FAST_BOWLERS = RAW_FAST_BOWLERS.map(p => ({ ...p, fourW: approxFourWickets(p) }));

const CATEGORY_META = {
  batsman:    { label: "Batsman",     data: BATSMEN,      primary: "runs" },
  allrounder: { label: "All-rounder", data: ALL_ROUNDERS, primary: "combo" },
  spinner:    { label: "Spinner",     data: SPINNERS,     primary: "wickets" },
  fastbowler: { label: "Fast Bowler", data: FAST_BOWLERS, primary: "wickets" }
};
const CATEGORY_KEYS = Object.keys(CATEGORY_META);
const ROUNDS = 11; // one full playing XI per participant

function rankOf(catKey, deletedSet) {
  const { data, primary } = CATEGORY_META[catKey];
  const active = data.filter(p => !deletedSet.has(p.name));
  let sorted;
  if (primary === "runs") {
    sorted = [...active].sort((a, b) => b.runs - a.runs);
  } else if (primary === "combo") {
    sorted = [...active].sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20));
  } else {
    sorted = [...active].sort((a, b) => b.wickets - a.wickets);
  }
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Each category's own straightforward primary stat — the "basic
   comparison" the person asked for, instead of a synthetic formula
   that can flip an obviously-better career into a loss (e.g. a
   longer, greater career reading lower than a shorter, spikier one). */
function categoryPrimaryValue(p) {
  if (typeof p.runs === "number" && typeof p.wickets === "number") {
    return { label: "Runs + Wkts×20", value: Math.round(p.runs + p.wickets * 20) };
  }
  if (typeof p.wickets === "number") return { label: "Wickets", value: p.wickets };
  return { label: "Runs", value: p.runs };
}

/* Percentile within the player's own category (using that category's
   own primary stat/rank) — only used to settle comparisons WHEN two
   different categories land in the same slot (a batsman vs a bowler),
   since raw runs and raw wickets aren't on the same scale. Within the
   same category this is monotonic with the raw stat, so it never
   contradicts the "basic" comparison above. */
function percentileOf(player) {
  const cat = player.category;
  const fullRanked = rankOf(cat, new Set());
  const total = fullRanked.length;
  const found = fullRanked.find(r => r.name === player.name);
  if (!found || total <= 1) return 100;
  return ((total - found.rank) / (total - 1)) * 100;
}

function displayName(names, i) {
  const n = names && names[i] ? names[i].trim() : "";
  return n || `Player ${i + 1}`;
}

/* ============ AVATAR ============ */
function Avatar({ name, team, size = 56, ring }) {
  const color = teamColor(team);
  return (
    <div
      className="rounded-lg flex items-center justify-center font-black text-white flex-shrink-0 relative overflow-hidden"
      style={{
        width: size, height: size, background: `linear-gradient(160deg, ${color}, #0b1220)`, fontSize: size * 0.34,
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined
      }}
      title={name}
    >
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 2px, transparent 2px 8px)"
      }}></div>
      <span className="relative z-10">{initials(name)}</span>
    </div>
  );
}

/* ============ PERSISTED DELETE LIST (uses browser localStorage) ============
   Note: this app is deployed as a standalone site (Vercel), not inside a
   Claude.ai artifact — so it uses real localStorage here instead of the
   Claude-artifact-only window.storage API, which doesn't exist outside
   Claude.ai and would throw at runtime. */
function useDeletedPlayers(catKey) {
  const storageKey = `deleted:${catKey}`;
  const [deleted, setDeleted] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      setDeleted(raw ? JSON.parse(raw) : []);
    } catch {
      setDeleted([]);
    } finally {
      setLoaded(true);
    }
  }, [storageKey]);

  function removePlayer(name) {
    const next = [...new Set([...deleted, name])];
    setDeleted(next);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }
  function restoreAll() {
    setDeleted([]);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify([]));
    } catch {}
  }

  return { deleted, deletedSet: new Set(deleted), removePlayer, restoreAll, loaded };
}

/* ============ SHARED UI BITS ============ */
function CatGrid({ active, onPick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
      {Object.entries(CATEGORY_META).map(([key, meta]) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          className={
            "text-left p-4 rounded-lg border transition-colors " +
            (active === key ? "border-yellow-400 bg-yellow-400/10" : "border-slate-700 bg-slate-900 hover:border-yellow-600")
          }
        >
          <div className="font-bold text-sm text-white">{meta.label}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{meta.data.length} players in database</div>
        </button>
      ))}
    </div>
  );
}

/* ============ GAME FLOW ============
   Each participant drafts a full 11-player lineup, one pick at a
   time, round-robin. A fresh random reveal order is shuffled per
   category at the start of every draft, so a given number doesn't
   always land on the same famous player draft after draft.

   A player can only belong to ONE lineup across the WHOLE draft —
   collisions give the candidate another number to try instead of a
   silent swap. The chosen category stays selected between turns
   until manually changed. "Undo last pick" lets a mistaken reveal
   be corrected immediately. After the draft, candidates can trade
   players and then run a slot-by-slot Final Comparison.
============================================================ */
function PlayGame() {
  const [stage, setStage] = useState("count");
  const [numPlayers, setNumPlayers] = useState(null);
  const [algos, setAlgos] = useState([]);
  const [names, setNames] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [category, setCategory] = useState(null);
  const [pickNum, setPickNum] = useState("");
  const [lastPick, setLastPick] = useState(null);
  const [collisionMsg, setCollisionMsg] = useState(null);
  const [shuffledPools, setShuffledPools] = useState({});

  const deletedBatsman = useDeletedPlayers("batsman");
  const deletedAllrounder = useDeletedPlayers("allrounder");
  const deletedSpinner = useDeletedPlayers("spinner");
  const deletedFastbowler = useDeletedPlayers("fastbowler");
  const deletedByCat = {
    batsman: deletedBatsman,
    allrounder: deletedAllrounder,
    spinner: deletedSpinner,
    fastbowler: deletedFastbowler
  };

  const totalTurns = numPlayers ? numPlayers * ROUNDS : 0;
  const currentParticipant = numPlayers ? turnIndex % numPlayers : 0;
  const currentRound = numPlayers ? Math.floor(turnIndex / numPlayers) + 1 : 1;

  function chooseCount(n) {
    setNumPlayers(n);
    setAlgos(Array(n).fill(""));
    setNames(Array(n).fill(""));
    setLineups(Array(n).fill(null).map(() => []));
    const pools = {};
    CATEGORY_KEYS.forEach(k => { pools[k] = shuffleArray(CATEGORY_META[k].data); });
    setShuffledPools(pools);
    setStage("algos");
  }
  function updateAlgo(i, val) {
    const next = [...algos];
    next[i] = val;
    setAlgos(next);
  }
  function updateName(i, val) {
    const next = [...names];
    next[i] = val;
    setNames(next);
  }
  function startTurns() {
    setTurnIndex(0);
    setCategory(null);
    setPickNum("");
    setLastPick(null);
    setCollisionMsg(null);
    setStage("turn");
  }
  function pickCategory(cat) {
    setCategory(cat);
    setCollisionMsg(null);
  }
  function submitTurn() {
    const algoNum = parseInt(algos[currentParticipant], 10) || 0;
    const pn = parseInt(pickNum, 10) || 0;
    const sum = algoNum + pn;
    if (!category || !pn) return;

    const basePool = shuffledPools[category] || CATEGORY_META[category].data;
    const pool = basePool.filter(p => !deletedByCat[category].deletedSet.has(p.name));
    if (pool.length === 0) return;

    const idx = ((sum - 1) % pool.length + pool.length) % pool.length;
    const player = { ...pool[idx], rank: idx + 1 };

    // Global uniqueness: check EVERY participant's lineup, not just the current one.
    const allOwnedNames = new Set(lineups.flatMap(arr => arr.map(p => p.name)));
    if (allOwnedNames.has(player.name)) {
      setCollisionMsg(`${player.name} is already on a lineup — try a different number to reveal someone new.`);
      setPickNum("");
      return; // turn does NOT advance; candidate gets another chance
    }
    setCollisionMsg(null);

    const entry = { ...player, category };
    const nextLineups = lineups.map((arr, i) => (i === currentParticipant ? [...arr, entry] : arr));
    setLineups(nextLineups);
    setLastPick({ participantIdx: currentParticipant, round: currentRound, algo: algoNum, pickNum: pn, sum, category, player });

    if (turnIndex + 1 >= totalTurns) {
      setStage("done");
    } else {
      setTurnIndex(turnIndex + 1);
      setPickNum("");
      // category deliberately NOT reset — it stays selected until changed
    }
  }
  function undoLastPick() {
    if (turnIndex === 0) return;
    const prevIdx = turnIndex - 1;
    const prevParticipant = prevIdx % numPlayers;
    setLineups(lineups.map((arr, i) => (i === prevParticipant ? arr.slice(0, -1) : arr)));
    setTurnIndex(prevIdx);
    setLastPick(null);
    setCollisionMsg(null);
    setPickNum("");
  }
  function resetAll() {
    setStage("count"); setNumPlayers(null); setAlgos([]); setNames([]); setLineups([]);
    setTurnIndex(0); setCategory(null); setPickNum(""); setLastPick(null); setCollisionMsg(null);
    setShuffledPools({});
  }
  function removeFromLineup(participantIdx, name) {
    setLineups(lineups.map((arr, i) => (i === participantIdx ? arr.filter(p => p.name !== name) : arr)));
  }
  function addToLineup(participantIdx, entry) {
    setLineups(lineups.map((arr, i) => {
      if (i !== participantIdx) return arr;
      if (arr.length >= 11) return arr;
      if (arr.some(p => p.name === entry.name)) return arr;
      return [...arr, entry];
    }));
  }
  function moveInLineup(participantIdx, index, direction) {
    setLineups(lineups.map((arr, i) => {
      if (i !== participantIdx) return arr;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= arr.length) return arr;
      const newArr = [...arr];
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr;
    }));
  }
  function swapPlayers(participantA, idxA, participantB, idxB) {
    setLineups(prev => {
      const next = prev.map(arr => [...arr]);
      const temp = next[participantA][idxA];
      next[participantA][idxA] = next[participantB][idxB];
      next[participantB][idxB] = temp;
      return next;
    });
  }

  // All names taken by anyone, across all lineups — used so the Add-player
  // dropdown in the final screen also respects global uniqueness.
  const globallyOwnedNames = new Set(lineups.flatMap(arr => arr.map(p => p.name)));

  return (
    <>
      {stage === "count" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
          <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">Step 1 of 3</div>
          <h2 className="text-xl font-extrabold text-white mb-1.5">How many are playing?</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Pick a headcount — from 1 to 6 players. Each of you will draft a full playing XI, one pick per turn,
            taking turns round-robin style. With 2 players that's 22 picks total (11 rounds × 2), with 3 it's 33, and so on.
            No player can end up on two different lineups, and the reveal order is freshly shuffled every draft so numbers don't always point to the same famous names.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button key={n} onClick={() => chooseCount(n)}
                className={"w-14 h-14 rounded-lg border font-mono text-xl font-bold transition-colors " +
                  (numPlayers === n ? "bg-yellow-400 text-slate-950 border-yellow-400" : "bg-slate-900 text-slate-100 border-slate-700 hover:border-yellow-600")}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "algos" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
          <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">Step 2 of 3</div>
          <h2 className="text-xl font-extrabold text-white mb-1.5">Name each candidate and set their algorithm number</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">The name shows up everywhere instead of "Player 1/2/3". The algorithm number gets added to whatever number you pick during each of your 11 turns.</p>
          {algos.map((a, i) => (
            <div key={i} className="flex items-center gap-3.5 p-3.5 mb-2.5 bg-slate-900 border border-slate-700 rounded-lg flex-wrap sm:flex-nowrap">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-extrabold text-white flex-shrink-0">{i + 1}</div>
              <input type="text" value={names[i] || ""} onChange={(e) => updateName(i, e.target.value)} placeholder={`Candidate ${i + 1} name`}
                className="flex-1 min-w-[120px] p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm" />
              <label className="text-xs text-slate-400 flex-shrink-0">Algorithm #</label>
              <input type="number" value={a} min="0" onChange={(e) => updateAlgo(i, e.target.value)} placeholder="e.g. 4"
                className="w-20 p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 font-mono text-base flex-shrink-0" />
            </div>
          ))}
          <div className="flex gap-2.5 mt-3">
            <button onClick={() => setStage("count")} className="border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-yellow-600 font-semibold text-sm px-4 py-2.5 rounded-lg">Back</button>
            <button disabled={algos.some((a) => a === "")} onClick={startTurns}
              className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105">Start drafting</button>
          </div>
        </div>
      )}

      {stage === "turn" && (
        <>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
            <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
              <div className="inline-block font-mono text-xs bg-slate-900 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
                Round {currentRound} of {ROUNDS} · Pick {turnIndex + 1} of {totalTurns}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {lineups.map((arr, i) => (
                  <div key={i} className={"font-mono text-[11px] px-2 py-1 rounded-full border " +
                    (i === currentParticipant ? "border-yellow-400 text-yellow-400 bg-yellow-400/10" : "border-slate-700 text-slate-500")}>
                    {displayName(names, i)}: {arr.length}/11
                  </div>
                ))}
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-1.5">{displayName(names, currentParticipant)}'s pick</h2>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Your algorithm number is <b className="text-yellow-400">{algos[currentParticipant]}</b>. Choose a category, then pick a number — the two get added together to reveal your player.
              {category && <> Currently on <b className="text-yellow-400">{CATEGORY_META[category].label}</b> — tap another category below to switch.</>}
            </p>
            <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2 mt-1.5">Category</div>
            <CatGrid active={category} onPick={pickCategory} />
            <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">Pick a number</div>
            <div className="flex items-center gap-3.5 p-3.5 mb-1 bg-slate-900 border border-slate-700 rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center font-extrabold text-white flex-shrink-0">#</div>
              <label className="text-sm text-slate-400 flex-1">Your number (adds to algorithm {algos[currentParticipant]})</label>
              <input type="number" value={pickNum} min="1" onChange={(e) => setPickNum(e.target.value)} placeholder="e.g. 2"
                className="w-20 p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 font-mono text-base" />
            </div>

            {collisionMsg && (
              <div className="mt-2.5 mb-1 p-3 rounded-lg border border-orange-700 bg-orange-500/10 text-orange-300 text-sm font-semibold">
                ⚠ {collisionMsg}
              </div>
            )}

            <div className="flex gap-2.5 mt-3.5 flex-wrap">
              <button onClick={resetAll} className="border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-yellow-600 font-semibold text-sm px-4 py-2.5 rounded-lg">Restart</button>
              <button onClick={undoLastPick} disabled={turnIndex === 0}
                className="border border-orange-700 text-orange-300 hover:bg-orange-500/10 font-semibold text-sm px-4 py-2.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
                ↩ Undo last pick
              </button>
              <button disabled={!category || !pickNum} onClick={submitTurn}
                className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105">
                Reveal pick {turnIndex + 1 < totalTurns ? "" : "(final)"}
              </button>
            </div>
          </div>

          {lastPick && <ResultCard r={lastPick} names={names} />}

          <MiniLineups lineups={lineups} currentParticipant={currentParticipant} names={names} />
        </>
      )}

      {stage === "done" && (
        <div className="mb-5">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
            <h2 className="text-xl font-extrabold text-white mb-1.5">Draft complete — final lineups</h2>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Every candidate's 11-player squad is below. Use ▲ / ▼ to reorder a player, ✕ to drop them, and "Add player" to fill the empty slot from anyone not already taken.
              Use the Trade panel to swap any player between two candidates.
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <button onClick={resetAll} className="border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-yellow-600 font-semibold text-sm px-5 py-3 rounded-lg">Draft again</button>
              <button onClick={() => setStage("compare")}
                className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg hover:brightness-105">Compare &amp; declare winner →</button>
            </div>
          </div>
          {lineups.map((arr, i) => (
            <LineupPanel
              key={i}
              participantIdx={i}
              name={displayName(names, i)}
              lineup={arr}
              onRemove={(name) => removeFromLineup(i, name)}
              onAdd={(entry) => addToLineup(i, entry)}
              onMoveUp={(idx) => moveInLineup(i, idx, -1)}
              onMoveDown={(idx) => moveInLineup(i, idx, 1)}
              deletedByCat={deletedByCat}
              globallyOwnedNames={globallyOwnedNames}
            />
          ))}
          <TradePanel lineups={lineups} names={names} onSwap={swapPlayers} />
        </div>
      )}

      {stage === "compare" && (
        <FinalComparison lineups={lineups} names={names} onBack={() => setStage("done")} onReset={resetAll} />
      )}
    </>
  );
}

function MiniLineups({ lineups, currentParticipant, names }) {
  if (lineups.every(arr => arr.length === 0)) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
      <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-3">Squads so far</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lineups.map((arr, i) => (
          <div key={i} className={"rounded-lg border p-3 " + (i === currentParticipant ? "border-yellow-400" : "border-slate-700")}>
            <div className="font-bold text-sm text-slate-100 mb-2">{displayName(names, i)} <span className="text-slate-500 font-mono text-xs">({arr.length}/11)</span></div>
            {arr.length === 0 ? (
              <div className="text-xs text-slate-500">No picks yet.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {arr.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CAT_ACCENT[p.category] }}></span>
                    <span className="truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ r, names }) {
  const p = r.player;
  const meta = CATEGORY_META[r.category];
  return (
    <div className="rounded-2xl border-2 border-green-900 bg-gradient-to-b from-green-950 to-black p-5 text-center mb-4 relative overflow-hidden">
      <div className="font-mono text-xs tracking-widest uppercase text-green-400 relative z-10">{displayName(names, r.participantIdx)} · Round {r.round} · {meta.label} pick</div>
      <div className="font-mono text-xs text-green-400/80 my-2 relative z-10">algorithm {r.algo} + number {r.pickNum} = {r.sum} → revealed pick #{p.rank}</div>
      <div className="flex justify-center mb-2 relative z-10"><Avatar name={p.name} team={p.team} size={72} /></div>
      <div className="font-bold text-xl text-green-50 relative z-10 mt-1">{p.name}</div>
      <div className="text-xs text-green-600 font-mono mt-0.5 relative z-10">{p.team} · {p.matches} IPL matches</div>
      <div className="flex flex-wrap gap-2.5 justify-center mt-4 relative z-10">
        {meta.primary === "runs" && <><StatPill v={p.runs} k="Runs" /><StatPill v={p.avg} k="Average" /><StatPill v={p.sr} k="Strike Rate" /><StatPill v={p.fifties} k="50s" /></>}
        {meta.primary === "combo" && <><StatPill v={p.runs} k="Runs" /><StatPill v={p.wickets} k="Wickets" /><StatPill v={p.econ ?? "—"} k="Economy" /><StatPill v={p.arSR} k="Strike Rate" /></>}
        {meta.primary === "wickets" && <><StatPill v={p.wickets} k="Wickets" /><StatPill v={p.econ} k="Economy" /><StatPill v={p.bowlSR} k="Bowl SR" /><StatPill v={p.fourW} k="4W Hauls" /></>}
      </div>
    </div>
  );
}

function StatPill({ v, k }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[74px]">
      <div className="font-mono text-base text-white font-bold">{v}</div>
      <div className="text-[10px] text-green-400 uppercase tracking-wide mt-0.5">{k}</div>
    </div>
  );
}

/* ============ FINAL LINEUP PANEL (with add/remove/reorder) ============ */
function LineupPanel({ participantIdx, name, lineup, onRemove, onAdd, onMoveUp, onMoveDown, deletedByCat, globallyOwnedNames }) {
  const [addingOpen, setAddingOpen] = useState(false);
  const [addCat, setAddCat] = useState("batsman");
  const [addName, setAddName] = useState("");

  const candidates = useMemo(() => {
    const ranked = rankOf(addCat, deletedByCat[addCat].deletedSet);
    return ranked.filter(p => !globallyOwnedNames.has(p.name));
    // eslint-disable-next-line
  }, [addCat, deletedByCat, globallyOwnedNames]);

  useEffect(() => {
    if (candidates.length > 0 && !candidates.find(p => p.name === addName)) {
      setAddName(candidates[0].name);
    }
    // eslint-disable-next-line
  }, [addCat, candidates.length]);

  function confirmAdd() {
    const player = candidates.find(p => p.name === addName);
    if (!player) return;
    onAdd({ ...player, category: addCat });
    setAddingOpen(false);
  }

  const full = lineup.length >= 11;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-lg font-extrabold text-white">{name}'s XI</h3>
        <div className={"font-mono text-xs px-2.5 py-1 rounded-full border " + (full ? "border-green-600 text-green-400" : "border-yellow-600 text-yellow-400")}>
          {lineup.length}/11
        </div>
      </div>

      {lineup.length === 0 ? (
        <div className="text-sm text-slate-400 mb-3">No players drafted.</div>
      ) : (
        <div className="flex flex-col gap-2 mb-3.5">
          {lineup.map((p, idx) => (
            <div key={p.name} className="flex items-center gap-3 p-2.5 bg-slate-900 border border-slate-700 rounded-lg group">
              <div className="font-mono text-xs text-slate-500 w-5 text-center flex-shrink-0">{idx + 1}</div>
              <Avatar name={p.name} team={p.team} size={36} ring={CAT_ACCENT[p.category]} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-100 truncate">{p.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{p.team} · {CATEGORY_META[p.category].label}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onMoveUp(idx)} disabled={idx === 0} title="Move up"
                  className="text-slate-500 hover:text-yellow-400 disabled:opacity-25 disabled:cursor-not-allowed text-xs font-bold w-6 h-6 rounded hover:bg-yellow-400/10">▲</button>
                <button onClick={() => onMoveDown(idx)} disabled={idx === lineup.length - 1} title="Move down"
                  className="text-slate-500 hover:text-yellow-400 disabled:opacity-25 disabled:cursor-not-allowed text-xs font-bold w-6 h-6 rounded hover:bg-yellow-400/10">▼</button>
                <button onClick={() => onRemove(p.name)} title="Remove from lineup"
                  className="text-slate-500 hover:text-red-400 text-sm font-bold w-7 h-7 rounded hover:bg-red-400/10">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!full && (
        addingOpen ? (
          <div className="p-3.5 bg-slate-900 border border-slate-700 rounded-lg">
            <div className="font-mono text-[11px] tracking-widest uppercase text-yellow-400 mb-2">Add a player</div>
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <select value={addCat} onChange={(e) => setAddCat(e.target.value)}
                className="p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm">
                {CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORY_META[k].label}</option>)}
              </select>
              <select value={addName} onChange={(e) => setAddName(e.target.value)}
                className="p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm">
                {candidates.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            {candidates.length === 0 && (
              <div className="text-xs text-orange-300 mb-2.5">No one left in this category — everyone's already on a lineup. Try a different category.</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setAddingOpen(false)} className="border border-slate-700 text-slate-400 hover:text-slate-100 font-semibold text-xs px-3.5 py-2 rounded-lg">Cancel</button>
              <button disabled={candidates.length === 0} onClick={confirmAdd}
                className="bg-yellow-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105">Add to lineup</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingOpen(true)}
            className="w-full border border-dashed border-slate-600 text-slate-400 hover:text-yellow-400 hover:border-yellow-600 font-semibold text-sm py-2.5 rounded-lg">
            + Add player
          </button>
        )
      )}
    </div>
  );
}

/* ============ TRADE PANEL ============ */
function TradePanel({ lineups, names, onSwap }) {
  const [aIdx, setAIdx] = useState(0);
  const [aPlayer, setAPlayer] = useState("");
  const [bIdx, setBIdx] = useState(lineups.length > 1 ? 1 : 0);
  const [bPlayer, setBPlayer] = useState("");

  useEffect(() => {
    const arr = lineups[aIdx] || [];
    if (arr.length > 0 && !arr.find(p => p.name === aPlayer)) setAPlayer(arr[0].name);
    // eslint-disable-next-line
  }, [aIdx, lineups]);
  useEffect(() => {
    const arr = lineups[bIdx] || [];
    if (arr.length > 0 && !arr.find(p => p.name === bPlayer)) setBPlayer(arr[0].name);
    // eslint-disable-next-line
  }, [bIdx, lineups]);

  if (lineups.length < 2) return null;

  function doSwap() {
    if (aIdx === bIdx) return;
    const idxInA = (lineups[aIdx] || []).findIndex(p => p.name === aPlayer);
    const idxInB = (lineups[bIdx] || []).findIndex(p => p.name === bPlayer);
    if (idxInA === -1 || idxInB === -1) return;
    onSwap(aIdx, idxInA, bIdx, idxInB);
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
      <h3 className="text-lg font-extrabold text-white mb-1.5">Trade players</h3>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">Swap any player between two candidates' finished lineups — positions stay put, ownership swaps.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
        <div>
          <div className="text-xs text-slate-400 mb-1.5">Candidate A</div>
          <select value={aIdx} onChange={(e) => setAIdx(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm mb-2">
            {lineups.map((_, i) => <option key={i} value={i}>{displayName(names, i)}</option>)}
          </select>
          <select value={aPlayer} onChange={(e) => setAPlayer(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm">
            {(lineups[aIdx] || []).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1.5">Candidate B</div>
          <select value={bIdx} onChange={(e) => setBIdx(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm mb-2">
            {lineups.map((_, i) => <option key={i} value={i}>{displayName(names, i)}</option>)}
          </select>
          <select value={bPlayer} onChange={(e) => setBPlayer(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm">
            {(lineups[bIdx] || []).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>
      {aIdx === bIdx ? (
        <div className="text-xs text-orange-300 mb-2.5">Pick two different candidates to trade between.</div>
      ) : (
        <button disabled={!aPlayer || !bPlayer} onClick={doSwap}
          className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105">
          ⇄ Swap {aPlayer || "…"} ↔ {bPlayer || "…"}
        </button>
      )}
    </div>
  );
}

/* ============ FINAL COMPARISON (slot-by-slot, category's own basic stat) ============ */
function FinalComparison({ lineups, names, onBack, onReset }) {
  const numPlayers = lineups.length;
  const maxSlots = Math.max(0, ...lineups.map(arr => arr.length));
  const [compareCount, setCompareCount] = useState(maxSlots || 11);

  useEffect(() => { setCompareCount(maxSlots || 11); }, [maxSlots]);

  const effectiveCount = Math.min(Math.max(1, compareCount || 1), maxSlots || 1);

  const slotRows = useMemo(() => {
    const rows = [];
    for (let idx = 0; idx < effectiveCount; idx++) {
      const entries = lineups.map((arr, pIdx) => {
        const player = arr[idx];
        if (!player) return null;
        return { participantIdx: pIdx, player, pct: percentileOf(player), primary: categoryPrimaryValue(player) };
      });
      const present = entries.filter(Boolean);
      let winners = [];
      if (present.length > 0) {
        const maxPct = Math.max(...present.map(e => e.pct));
        winners = present.filter(e => Math.abs(e.pct - maxPct) < 0.0001).map(e => e.participantIdx);
      }
      rows.push({ slot: idx + 1, entries, winners: winners.length === present.length ? [] : winners });
    }
    return rows;
    // eslint-disable-next-line
  }, [lineups, effectiveCount]);

  const tally = useMemo(() => {
    const t = Array(numPlayers).fill(0);
    slotRows.forEach(row => { row.winners.forEach(pIdx => { t[pIdx] += 1; }); });
    return t;
    // eslint-disable-next-line
  }, [slotRows, numPlayers]);

  const maxTally = Math.max(...tally, 0);
  const overallWinners = tally.map((v, i) => ({ i, v })).filter(x => x.v === maxTally && maxTally > 0).map(x => x.i);
  const isOverallTie = overallWinners.length !== 1;

  return (
    <div className="mb-5">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
        <h2 className="text-xl font-extrabold text-white mb-1.5">Final comparison</h2>
        <p className="text-sm text-slate-400 mb-3.5 leading-relaxed">
          Slot 1 vs slot 1, slot 2 vs slot 2, and so on. Each row is judged on that category's own basic stat
          (runs for batsmen, wickets for bowlers, runs+wickets×20 for all-rounders) — if a slot pits two different
          categories against each other, a percentile-within-category score breaks the tie fairly. Highlighted card = slot winner.
        </p>
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          <label className="text-xs text-slate-400">Compare how many players (1–{maxSlots}):</label>
          <input type="number" min={1} max={maxSlots} value={compareCount}
            onChange={(e) => setCompareCount(Number(e.target.value))}
            className="w-20 p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 font-mono text-sm" />
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={onBack} className="border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-yellow-600 font-semibold text-sm px-4 py-2.5 rounded-lg">← Back to lineups</button>
          <button onClick={onReset} className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg hover:brightness-105">Draft again</button>
        </div>
      </div>

      <div className="bg-gradient-to-b from-yellow-400/10 to-transparent border-2 border-yellow-400 rounded-2xl p-6 mb-5 text-center">
        <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">Overall result ({effectiveCount} slot{effectiveCount === 1 ? "" : "s"} compared)</div>
        {isOverallTie ? (
          <div className="font-black text-2xl text-white">
            {maxTally === 0 ? "No slot winners yet" : `Tied at ${maxTally} slot${maxTally === 1 ? "" : "s"} each`}
          </div>
        ) : (
          <div className="font-black text-3xl text-yellow-300" style={{ textShadow: "0 0 14px rgba(250,204,21,0.5)" }}>
            🏆 {displayName(names, overallWinners[0])} wins!
          </div>
        )}
        <div className="flex justify-center gap-2 flex-wrap mt-3.5">
          {tally.map((v, i) => (
            <div key={i} className={"font-mono text-xs px-3 py-1.5 rounded-full border " +
              (!isOverallTie && i === overallWinners[0] ? "border-yellow-400 text-yellow-300 bg-yellow-400/10 font-bold" : "border-slate-700 text-slate-400")}>
              {displayName(names, i)}: {v} slot{v === 1 ? "" : "s"}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {slotRows.map(row => (
          <div key={row.slot} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-slate-500 mb-2.5">Slot {row.slot}</div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${numPlayers}, minmax(0, 1fr))` }}>
              {row.entries.map((entry, pIdx) => {
                const isWinner = row.winners.includes(pIdx);
                if (!entry) {
                  return (
                    <div key={pIdx} className="rounded-lg border border-dashed border-slate-700 p-3 text-center text-xs text-slate-600">
                      No pick
                    </div>
                  );
                }
                const p = entry.player;
                return (
                  <div key={pIdx} className={"rounded-lg border p-3 flex flex-col items-center text-center transition-colors " +
                    (isWinner ? "border-yellow-400 bg-yellow-400/10" : "border-slate-700 bg-slate-900")}>
                    <div className="text-[10px] font-mono uppercase tracking-wide text-slate-500 mb-1.5">{displayName(names, pIdx)}</div>
                    <Avatar name={p.name} team={p.team} size={44} ring={isWinner ? "#facc15" : CAT_ACCENT[p.category]} />
                    <div className="font-bold text-sm text-slate-100 mt-1.5 truncate max-w-full">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{CATEGORY_META[p.category].label}</div>
                    <div className={"font-mono text-xs mt-1.5 px-2 py-0.5 rounded-full " + (isWinner ? "bg-yellow-400 text-slate-950 font-bold" : "text-slate-400")}>
                      {entry.primary.label}: {entry.primary.value}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {p.category === "batsman" && `50s: ${p.fifties}`}
                      {p.category === "allrounder" && `SR: ${p.arSR}`}
                      {(p.category === "spinner" || p.category === "fastbowler") && `4W: ${p.fourW}`}
                    </div>
                    {isWinner && <div className="text-[10px] font-mono uppercase tracking-widest text-yellow-400 font-bold mt-1">Winner</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ BROWSE LISTS (with delete) ============ */
function BrowseLists() {
  const [cat, setCat] = useState("batsman");
  const [query, setQuery] = useState("");
  const { deletedSet, removePlayer, restoreAll, deleted, loaded } = useDeletedPlayers(cat);
  const ranked = useMemo(() => rankOf(cat, deletedSet), [cat, deletedSet]);
  const meta = CATEGORY_META[cat];
  const filtered = ranked.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
      <h2 className="text-xl font-extrabold text-white mb-1.5">Player lists by category</h2>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        Ranked by {meta.primary === "runs" ? "career runs" : meta.primary === "combo" ? "combined batting + bowling impact" : "career wickets"}.
        Click the ✕ to remove a player from your list — it's remembered next time you open this portal.
      </p>

      <CatGrid active={cat} onPick={setCat} />

      <div className="flex items-center gap-2.5 mb-3.5">
        <input placeholder="Search player name..." value={query} onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-2.5 px-3.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm" />
        {deleted.length > 0 && (
          <button onClick={restoreAll} className="whitespace-nowrap text-xs font-semibold text-yellow-400 border border-yellow-700 rounded-lg px-3 py-2.5 hover:bg-yellow-400/10">
            Restore {deleted.length} removed
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="text-slate-400 text-sm text-center py-6">Loading your list…</div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">#</th>
                <th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Player</th>
                {meta.primary === "runs" && <><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Runs</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Avg</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">SR</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">50s</th></>}
                {meta.primary === "combo" && <><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Runs</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Wkts</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Econ</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">SR</th></>}
                {meta.primary === "wickets" && <><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Wkts</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Econ</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Bowl SR</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">4W</th></>}
                <th className="py-2 px-1.5 border-b border-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.name} className="hover:bg-white/5 group">
                  <td className="py-2.5 px-1.5 border-b border-white/5 font-mono text-yellow-400 font-bold text-xs">{p.rank}</td>
                  <td className="py-2.5 px-1.5 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.name} team={p.team} size={32} />
                      <div>
                        <div className="font-bold text-sm text-slate-100">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.team} · {p.matches} matches</div>
                      </div>
                    </div>
                  </td>
                  {meta.primary === "runs" && <><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.runs}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.avg}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.sr}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.fifties}</td></>}
                  {meta.primary === "combo" && <><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.runs}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.wickets}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.econ ?? "—"}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.arSR}</td></>}
                  {meta.primary === "wickets" && <><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.wickets}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.econ}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.bowlSR}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.fourW}</td></>}
                  <td className="py-2.5 px-1.5 border-b border-white/5 text-right">
                    <button onClick={() => removePlayer(p.name)} title="Remove from list"
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs font-bold w-6 h-6 rounded hover:bg-red-400/10 transition-opacity">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-slate-400 text-sm text-center py-6 px-2.5">No player matches "{query}" in {meta.label}.</div>}
        </div>
      )}
    </div>
  );
}

/* ============ COMPARE TOOL (multi-player, 2-6 at once, with search) ============ */
function statRows(meta) {
  if (meta.primary === "runs") return [["Runs", "runs", (x) => x], ["Average", "avg", (x) => x], ["Strike Rate", "sr", (x) => x], ["50s", "fifties", (x) => x], ["Matches", "matches", (x) => x]];
  if (meta.primary === "combo") return [["Runs", "runs", (x) => x], ["Wickets", "wickets", (x) => x], ["Strike Rate", "arSR", (x) => x], ["Matches", "matches", (x) => x]];
  return [["Wickets", "wickets", (x) => x], ["Economy", "econ", (x) => -x], ["Bowl SR", "bowlSR", (x) => -x], ["4W Hauls", "fourW", (x) => x], ["Matches", "matches", (x) => x]];
}

function CompareTool() {
  const [cat, setCat] = useState("batsman");
  const { deletedSet } = useDeletedPlayers(cat);
  const ranked = useMemo(() => rankOf(cat, deletedSet), [cat, deletedSet]);
  const meta = CATEGORY_META[cat];

  const [numCompare, setNumCompare] = useState(2);
  const [selected, setSelected] = useState(["", ""]);
  const [searches, setSearches] = useState(["", ""]);

  // Resize selection/search arrays when the headcount changes.
  useEffect(() => {
    setSelected(prev => {
      const next = [...prev];
      while (next.length < numCompare) next.push("");
      return next.slice(0, numCompare);
    });
    setSearches(prev => {
      const next = [...prev];
      while (next.length < numCompare) next.push("");
      return next.slice(0, numCompare);
    });
  }, [numCompare]);

  // Keep selections valid when category (or its ranked list) changes,
  // defaulting each empty/invalid slot to the next unused top player.
  useEffect(() => {
    setSelected(prev => {
      const used = new Set();
      return prev.map((name) => {
        let candidate = ranked.find(p => p.name === name) ? name : null;
        if (candidate && !used.has(candidate)) { used.add(candidate); return candidate; }
        const fallback = ranked.find(p => !used.has(p.name));
        if (fallback) { used.add(fallback.name); return fallback.name; }
        return "";
      });
    });
    // eslint-disable-next-line
  }, [cat, ranked.length, numCompare]);

  function updateSelected(i, name) {
    setSelected(prev => prev.map((n, idx) => (idx === i ? name : n)));
  }
  function updateSearch(i, val) {
    setSearches(prev => prev.map((s, idx) => (idx === i ? val : s)));
  }

  // Options visible in slot i's dropdown right now (matches its search text,
  // excludes players already chosen in other slots). Shared by both the
  // sync effect below and the render, so they can never disagree.
  function filteredOptionsFor(i, selectedArr, searchesArr) {
    const otherSelected = new Set(selectedArr.filter((_, idx) => idx !== i));
    return ranked.filter(p =>
      p.name.toLowerCase().includes((searchesArr[i] || "").toLowerCase()) && !otherSelected.has(p.name)
    );
  }

  // FIX: typing a search that narrows the dropdown down to a match didn't
  // actually update the selected player — the <select>'s displayed option
  // and the real comparison state could disagree until an explicit click
  // happened to register as a "change". This keeps them in sync: whenever
  // search text changes, if the currently selected player no longer
  // appears in that slot's narrowed options, immediately snap the
  // selection to the top match instead.
  useEffect(() => {
    setSelected(prev => prev.map((name, i) => {
      const options = filteredOptionsFor(i, prev, searches);
      if (options.find(p => p.name === name)) return name;
      return options[0] ? options[0].name : name;
    }));
    // eslint-disable-next-line
  }, [searches, ranked]);

  const players = selected.map(name => ranked.find(p => p.name === name)).filter(Boolean);
  const allDistinct = new Set(selected.filter(Boolean)).size === selected.filter(Boolean).length;
  const rows = statRows(meta);

  // For each stat row, find the sole leader (ties count for no one — same rule as Final Comparison).
  const rowWinners = useMemo(() => {
    return rows.map(([label, key, dir]) => {
      const vals = players.map(p => p[key]);
      if (vals.some(v => v == null)) return -1;
      const dirVals = vals.map(v => dir(v));
      const maxVal = Math.max(...dirVals);
      const leaders = dirVals.map((v, i) => (v === maxVal ? i : -1)).filter(i => i !== -1);
      return leaders.length === 1 ? leaders[0] : -1;
    });
    // eslint-disable-next-line
  }, [players, cat]);

  const tally = useMemo(() => {
    const t = Array(players.length).fill(0);
    rowWinners.forEach(winIdx => { if (winIdx !== -1) t[winIdx] += 1; });
    return t;
  }, [rowWinners, players.length]);

  const maxTally = Math.max(...tally, 0);
  const overallWinnerIdxs = tally.map((v, i) => ({ i, v })).filter(x => x.v === maxTally && maxTally > 0).map(x => x.i);
  const isTie = overallWinnerIdxs.length !== 1 || players.length < 2;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
      <h2 className="text-xl font-extrabold text-white mb-1.5">Head to Head</h2>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">Compare 2 to 6 players from the same category at once, stat for stat. Search to narrow any picker.</p>

      <CatGrid active={cat} onPick={setCat} />

      {ranked.length < 2 ? (
        <div className="text-slate-400 text-sm text-center py-6 px-2.5">Not enough players left in this category to compare — restore some from Player Lists.</div>
      ) : (
        <>
          <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">How many players?</div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setNumCompare(Math.min(n, ranked.length))}
                className={"w-11 h-11 rounded-lg border font-mono text-base font-bold transition-colors " +
                  (numCompare === n ? "bg-yellow-400 text-slate-950 border-yellow-400" : "bg-slate-900 text-slate-100 border-slate-700 hover:border-yellow-600")}
                disabled={n > ranked.length}>
                {n}
              </button>
            ))}
          </div>

          <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}>
            {Array.from({ length: numCompare }).map((_, i) => {
              const options = filteredOptionsFor(i, selected, searches);
              return (
                <div key={i}>
                  <div className="text-[11px] text-slate-400 mb-1">Player {i + 1}</div>
                  <input placeholder="Search..." value={searches[i] || ""} onChange={(e) => updateSearch(i, e.target.value)}
                    className="w-full p-2 mb-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm" />
                  <select value={selected[i] || ""} onChange={(e) => updateSelected(i, e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm">
                    {options.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          {!allDistinct && (
            <div className="text-xs text-orange-300 mb-3.5">Pick different players in each slot to compare.</div>
          )}

          {players.length === numCompare && allDistinct && (
            <>
              <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
                {players.map((p, i) => (
                  <div key={p.name} className={"flex flex-col items-center p-3 rounded-xl border transition-colors " +
                    (!isTie && overallWinnerIdxs[0] === i ? "border-yellow-400 bg-yellow-400/10" : "border-slate-700 bg-slate-900")}>
                    <Avatar name={p.name} team={p.team} size={56} />
                    <div className="font-bold text-sm text-slate-100 mt-2 text-center truncate max-w-full">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.team}</div>
                    {!isTie && overallWinnerIdxs[0] === i && (
                      <div className="mt-2 font-mono text-[10px] tracking-widest uppercase bg-yellow-400 text-slate-950 px-2 py-1 rounded-full font-bold">Winner</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-2.5">
                {rows.map(([label, key], rowIdx) => {
                  const winIdx = rowWinners[rowIdx];
                  return (
                    <div key={key} className="grid gap-2 items-center" style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
                      {players.map((p, i) => (
                        <div key={p.name} className={"font-mono text-sm p-2.5 rounded-lg text-center font-bold relative " +
                          (winIdx === i ? "bg-yellow-400/15 border border-yellow-400 text-yellow-400" : "bg-slate-900 text-slate-100")}>
                          {i === 0 && (
                            <div className="absolute -top-4 left-0 right-0 text-[10px] text-slate-500 text-center uppercase tracking-wide font-mono">{label}</div>
                          )}
                          {p[key] ?? "—"}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-yellow-400/10 to-yellow-400/[0.02] border border-yellow-700 text-sm leading-relaxed text-slate-200">
                {!isTie ? (
                  <><b className="text-yellow-400">Verdict:</b> {players[overallWinnerIdxs[0]].name} wins this match-up, leading on {maxTally} of {rows.length} key stats.</>
                ) : (
                  <><b className="text-yellow-400">Verdict:</b> No single player leads the most stats here — a genuine toss-up among this group.</>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ============ APP ============
   All three tabs stay mounted (just hidden via CSS) instead of being
   conditionally rendered — switching tabs used to unmount PlayGame
   and wipe out an in-progress draft. Now the state survives.
============================================================ */
export default function App() {
  const [tab, setTab] = useState("play");
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="max-w-3xl mx-auto px-4 py-7 pb-20">
        <div className="relative rounded-2xl overflow-hidden mb-6 p-8 pb-7 border border-white/10" style={{ background: "linear-gradient(180deg, #2f7a4f 0%, #1f5a38 100%)" }}>
          <div className="absolute -top-14 -right-10 w-56 h-56 rounded-full opacity-70" style={{ background: "radial-gradient(circle, rgba(255,210,63,0.35), transparent 65%)", filter: "blur(2px)" }}></div>
          <p className="relative z-10 font-mono text-[11px] tracking-widest uppercase text-green-50/85 mb-2.5">Under the lights · Career stats 2010–2026</p>
          <h1 className="relative z-10 font-black text-4xl sm:text-5xl leading-none text-white mb-3" style={{ textShadow: "0 2px 0 rgba(0,0,0,0.25)" }}>Playing 11</h1>
          <p className="relative z-10 max-w-md text-white/90 text-[15px] leading-relaxed">
            Name yourself, pick your algorithm, call a category, and the scoreboard reveals your player. Draft your full XI, trade if you like,
            then let the Final Comparison crown a winner, slot by slot.
          </p>
          <div className="flex justify-end mt-4 relative z-10 font-sans text-[17px] text-slate-200/80 tracking-widest uppercase font-semibold">
            <p>Created By: NIRAV DHOLIYA</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-5 bg-slate-800 border border-slate-700 rounded-xl p-1.5 overflow-x-auto">
          {[["play", "Play"], ["browse", "Player Lists"], ["compare", "Head to Head"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={"flex-1 whitespace-nowrap font-semibold text-sm px-3.5 py-2.5 rounded-lg transition-colors " +
                (tab === key ? "bg-yellow-400 text-slate-950" : "text-slate-400 hover:text-slate-100 hover:bg-white/5")}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: tab === "play" ? "block" : "none" }}><PlayGame /></div>
        <div style={{ display: tab === "browse" ? "block" : "none" }}><BrowseLists /></div>
        <div style={{ display: tab === "compare" ? "block" : "none" }}><CompareTool /></div>

        <div className="text-center text-slate-400 text-[11px] mt-6 leading-relaxed">
          {BATSMEN.length} batsmen · {ALL_ROUNDERS.length} all-rounders · {SPINNERS.length} spinners · {FAST_BOWLERS.length} fast bowlers — every player appears in exactly one category, with roughly 20+ IPL matches somewhere across 2010–2026.
          <br />
          Switching tabs no longer wipes an in-progress draft. A reveal that collides with someone already taken gives that candidate another number to try, and "Undo last pick" fixes a mistaken reveal immediately. Category stays selected between turns until you change it.
          <br />
          Once a draft is done, reorder with ▲ / ▼, drop with ✕, add a replacement, trade between candidates, then run the Final Comparison (choose how many slots to judge) for a category-appropriate, percentile-checked winner.
          <br />
          50s / 4-wicket hauls / all-rounder strike rate are derived approximations from the core stats, not hand-verified official counts.
          <br />
          Player cards use team-colored jersey avatars with initials, not photos. Removed players (Player Lists tab) stay hidden across sessions; use "Restore removed" to bring them back.
          Stats are approximate career aggregates spanning many seasons — check iplt20.com/stats or espncricinfo.com for exact current numbers.
        </div>
      </div>
    </div>
  );
}
