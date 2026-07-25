import React, { useState, useMemo, useEffect } from "react";

/* ============================================================
   PLAYER DATA — career aggregates spanning IPL 2010–2026.
   Base list (2010–2022) supplied by user reference (ESPNcricinfo /
   IPLT20.com). Extended here with 2023–2026 regulars using the
   same 20+ matches threshold. Figures are approximate career
   totals — treat as close estimates, not official records.
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

const BATSMEN = [
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
  { name: "Priyank Panchal", team: "KXIP", matches: 32, runs: 400, avg: 15.0, sr: 105.0 },
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
  { name: "Marlon Samuels", team: "KXIP/RR", matches: 63, runs: 1333, avg: 25.6, sr: 128.9 },
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
  { name: "Vaibhav Suryavanshi", team: "RR", matches: 20, runs: 830, avg: 44.0, sr: 190.0 }
];

const ALL_ROUNDERS = [
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
  { name: "Vinay Kumar", team: "RCB/KKR", matches: 104, runs: 300, wickets: 90, econ: 8.1 },
  { name: "Yuvraj Singh", team: "KXIP/PWI/RCB/DD/SRH", matches: 132, runs: 2750, wickets: 36, econ: 8.5 },
  { name: "Suresh Raina", team: "CSK/GL", matches: 205, runs: 5528, wickets: 13, econ: 8.7 },
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
  { name: "Manoj Tiwary", team: "KKR/RCB", matches: 121, runs: 2400, wickets: 3, econ: 9.0 },
  { name: "Riyan Parag", team: "RR", matches: 95, runs: 1700, wickets: 12, econ: 8.9 },
  { name: "Venkatesh Iyer", team: "KKR", matches: 60, runs: 1600, wickets: 9, econ: 9.6 },
  { name: "Wanindu Hasaranga", team: "RCB/SRH", matches: 55, runs: 300, wickets: 72, econ: 7.6 },
  { name: "Ravi Bishnoi", team: "LSG", matches: 95, runs: 55, wickets: 118, econ: 7.4 },
  { name: "Marco Jansen", team: "SRH/MI", matches: 40, runs: 320, wickets: 40, econ: 9.2 },
  { name: "Liam Livingstone", team: "RR/PBKS", matches: 45, runs: 1050, wickets: 16, econ: 8.7 },
  { name: "Cameron Green", team: "MI", matches: 25, runs: 550, wickets: 9, econ: 8.9 },
  { name: "Sam Curran", team: "PBKS/CSK", matches: 65, runs: 780, wickets: 60, econ: 8.9 },
  { name: "Romario Shepherd", team: "MI/LSG", matches: 35, runs: 320, wickets: 28, econ: 10.0 },
  { name: "Shardul Thakur", team: "RPS/CSK/DC/KKR", matches: 110, runs: 680, wickets: 92, econ: 9.2 },
  { name: "Nitish Rana", team: "KKR/RR", matches: 145, runs: 3200, wickets: 3, econ: 9.5 },
  { name: "Rachin Ravindra", team: "CSK", matches: 20, runs: 250, wickets: 10, econ: 7.9 }
];

const SPINNERS = [
  { name: "Yuzvendra Chahal", team: "RCB/RR/PBKS", matches: 175, wickets: 220, econ: 7.7, bowlSR: 18.4 },
  { name: "Piyush Chawla", team: "KXIP/CSK/MI/KKR", matches: 192, wickets: 195, econ: 7.6, bowlSR: 20.1 },
  { name: "Amit Mishra", team: "DD/SRH", matches: 160, wickets: 174, econ: 7.4, bowlSR: 18.9 },
  { name: "Ravichandran Ashwin", team: "CSK/KXIP/DC/RR", matches: 215, wickets: 182, econ: 6.9, bowlSR: 21.7 },
  { name: "Harbhajan Singh", team: "MI/CSK", matches: 163, wickets: 150, econ: 6.9, bowlSR: 22.3 },
  { name: "Sunil Narine", team: "KKR", matches: 195, wickets: 195, econ: 6.7, bowlSR: 19.3 },
  { name: "Rashid Khan", team: "SRH/GT", matches: 150, wickets: 200, econ: 6.6, bowlSR: 15.9 },
  { name: "Imran Tahir", team: "PBKS/RR/SRH/CSK", matches: 106, wickets: 130, econ: 7.1, bowlSR: 16.9 },
  { name: "Pragyan Ojha", team: "DC/MI", matches: 114, wickets: 113, econ: 6.9, bowlSR: 21.7 },
  { name: "Anil Kumble", team: "RCB", matches: 43, wickets: 45, econ: 6.5, bowlSR: 19.0 },
  { name: "Shakib Al Hasan", team: "KKR/SRH", matches: 71, wickets: 62, econ: 7.3, bowlSR: 21.0 },
  { name: "Axar Patel", team: "PBKS/DC", matches: 195, wickets: 150, econ: 7.1, bowlSR: 22.0 },
  { name: "Ravindra Jadeja", team: "CSK", matches: 260, wickets: 168, econ: 7.6, bowlSR: 23.0 },
  { name: "Krunal Pandya", team: "MI/LSG", matches: 150, wickets: 72, econ: 7.4, bowlSR: 25.0 },
  { name: "Karn Sharma", team: "MI/SRH/CSK", matches: 89, wickets: 76, econ: 8.0, bowlSR: 22.0 },
  { name: "Ish Sodhi", team: "RR/PBKS", matches: 33, wickets: 28, econ: 8.4, bowlSR: 20.0 },
  { name: "Washington Sundar", team: "RCB/SRH", matches: 100, wickets: 70, econ: 7.0, bowlSR: 24.0 },
  { name: "Shreyas Gopal", team: "RR", matches: 61, wickets: 50, econ: 7.9, bowlSR: 22.0 },
  { name: "Varun Chakravarthy", team: "KKR", matches: 100, wickets: 115, econ: 7.4, bowlSR: 18.5 },
  { name: "Yuvraj Singh", team: "KXIP/PWI/RCB/DD/SRH", matches: 132, wickets: 36, econ: 8.0, bowlSR: 26.0 },
  { name: "Maheesh Theekshana", team: "CSK", matches: 55, wickets: 58, econ: 7.4, bowlSR: 22.0 },
  { name: "Kuldeep Yadav", team: "KKR/DC", matches: 105, wickets: 125, econ: 7.9, bowlSR: 18.5 },
  { name: "Rahul Chahar", team: "MI/PBKS", matches: 70, wickets: 65, econ: 8.0, bowlSR: 24.0 },
  { name: "Adam Zampa", team: "RPS/PBKS", matches: 24, wickets: 22, econ: 8.2, bowlSR: 27.0 },
  { name: "Mujeeb Ur Rahman", team: "SRH/KXIP", matches: 40, wickets: 39, econ: 7.2, bowlSR: 23.0 },
  { name: "Noor Ahmad", team: "GT/CSK", matches: 45, wickets: 55, econ: 7.9, bowlSR: 18.0 },
  { name: "Ravi Bishnoi", team: "LSG", matches: 95, wickets: 118, econ: 7.4, bowlSR: 20.0 }
];

const FAST_BOWLERS = [
  { name: "Bhuvneshwar Kumar", team: "SRH/RCB", matches: 200, wickets: 210, econ: 7.5, bowlSR: 20.5 },
  { name: "Dwayne Bravo", team: "CSK", matches: 161, wickets: 183, econ: 8.4, bowlSR: 16.9 },
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
  { name: "Shardul Thakur", team: "RPS/CSK/DC/KKR", matches: 110, wickets: 92, econ: 9.2, bowlSR: 18.9 },
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
  { name: "Sam Curran", team: "PBKS/CSK", matches: 65, wickets: 60, econ: 8.9, bowlSR: 17.0 },
  { name: "Mohammed Siraj", team: "SRH/RCB/GT", matches: 130, wickets: 135, econ: 8.9, bowlSR: 18.8 },
  { name: "Gerald Coetzee", team: "MI", matches: 20, wickets: 25, econ: 8.6, bowlSR: 18.5 },
  { name: "Jofra Archer", team: "RR", matches: 45, wickets: 55, econ: 7.4, bowlSR: 19.5 },
  { name: "Yash Dayal", team: "GT/RCB", matches: 35, wickets: 36, econ: 9.3, bowlSR: 19.5 },
  { name: "Reece Topley", team: "MI", matches: 22, wickets: 22, econ: 8.5, bowlSR: 24.1 },
  { name: "Josh Hazlewood", team: "CSK/RCB", matches: 33, wickets: 46, econ: 8.1, bowlSR: 19.0 },
  { name: "Nathan Ellis", team: "PBKS/CSK", matches: 25, wickets: 30, econ: 8.9, bowlSR: 18.0 }
];

const CATEGORY_META = {
  batsman:    { label: "Batsman",     data: BATSMEN,      primary: "runs" },
  allrounder: { label: "All-rounder", data: ALL_ROUNDERS, primary: "combo" },
  spinner:    { label: "Spinner",     data: SPINNERS,     primary: "wickets" },
  fastbowler: { label: "Fast Bowler", data: FAST_BOWLERS, primary: "wickets" }
};

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

/* ============ AVATAR ============ */
function Avatar({ name, team, size = 56 }) {
  const color = teamColor(team);
  return (
    <div
      className="rounded-lg flex items-center justify-center font-black text-white flex-shrink-0 relative overflow-hidden"
      style={{ width: size, height: size, background: `linear-gradient(160deg, ${color}, #0b1220)`, fontSize: size * 0.34 }}
      title={name}
    >
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 2px, transparent 2px 8px)"
      }}></div>
      <span className="relative z-10">{initials(name)}</span>
    </div>
  );
}

/* ============ PERSISTED DELETE LIST ============ */
function useDeletedPlayers(catKey) {
  const storageKey = `deleted:${catKey}`;
  const [deleted, setDeleted] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      try {
        const res = await localStorage.getItem(storageKey);
        if (!cancelled) setDeleted(res ? JSON.parse(res.value) : []);
      } catch {
        if (!cancelled) setDeleted([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  async function removePlayer(name) {
    const next = [...new Set([...deleted, name])];
    setDeleted(next);
    try { await localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }
  async function restoreAll() {
    setDeleted([]);
    try { await localStorage.setItem(storageKey, JSON.stringify([])); } catch {}
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

/* ============ GAME FLOW ============ */
function PlayGame() {
  const [stage, setStage] = useState("count");
  const [numPlayers, setNumPlayers] = useState(null);
  const [algos, setAlgos] = useState([]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [category, setCategory] = useState(null);
  const [pickNum, setPickNum] = useState("");
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

  function chooseCount(n) {
    setNumPlayers(n);
    setAlgos(Array(n).fill(""));
    setStage("algos");
  }
  function updateAlgo(i, val) {
    const next = [...algos];
    next[i] = val;
    setAlgos(next);
  }
  function startTurns() {
    setTurnIdx(0);
    setCategory(null);
    setPickNum("");
    setResults([]);
    setStage("turn");
  }
  function submitTurn() {
    const algoNum = parseInt(algos[turnIdx], 10) || 0;
    const pn = parseInt(pickNum, 10) || 0;
    const sum = algoNum + pn;
    if (!category || !pn) return;
    const ranked = rankOf(category, deletedByCat[category].deletedSet);
    if (ranked.length === 0) return;
    const idx = ((sum - 1) % ranked.length + ranked.length) % ranked.length;
    const player = ranked[idx];
    const result = { playerLabel: `Player ${turnIdx + 1}`, algo: algoNum, pickNum: pn, sum, category, player };
    const nextResults = [...results, result];
    setResults(nextResults);
    if (turnIdx + 1 < numPlayers) {
      setTurnIdx(turnIdx + 1);
      setCategory(null);
      setPickNum("");
    } else {
      setStage("done");
    }
  }
  function resetAll() {
    setStage("count"); setNumPlayers(null); setAlgos([]); setTurnIdx(0);
    setResults([]); setCategory(null); setPickNum("");
  }

  return (
    <>
      {stage === "count" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
          <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">Step 1 of 3</div>
          <h2 className="text-xl font-extrabold text-white mb-1.5">How many are playing?</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">Pick a headcount — from 1 to 6 players. Each of you will get your own turn later.</p>
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
          <h2 className="text-xl font-extrabold text-white mb-1.5">Set each player's algorithm number</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">This is your personal number — it gets added to whatever number you pick during your turn.</p>
          {algos.map((a, i) => (
            <div key={i} className="flex items-center gap-3.5 p-3.5 mb-2.5 bg-slate-900 border border-slate-700 rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-extrabold text-white flex-shrink-0">{i + 1}</div>
              <label className="text-sm text-slate-400 flex-1">Player {i + 1} algorithm number</label>
              <input type="number" value={a} min="0" onChange={(e) => updateAlgo(i, e.target.value)} placeholder="e.g. 4"
                className="w-20 p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 font-mono text-base" />
            </div>
          ))}
          <div className="flex gap-2.5 mt-3">
            <button onClick={() => setStage("count")} className="border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-yellow-600 font-semibold text-sm px-4 py-2.5 rounded-lg">Back</button>
            <button disabled={algos.some((a) => a === "")} onClick={startTurns}
              className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105">Start the game</button>
          </div>
        </div>
      )}

      {stage === "turn" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
          <div className="inline-block font-mono text-xs bg-slate-900 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full mb-3.5">Turn {turnIdx + 1} of {numPlayers}</div>
          <h2 className="text-xl font-extrabold text-white mb-1.5">Player {turnIdx + 1}'s turn</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Your algorithm number is <b className="text-yellow-400">{algos[turnIdx]}</b>. Choose a category, then pick a number — the two get added together to reveal your player.
          </p>
          <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2 mt-1.5">Choose category</div>
          <CatGrid active={category} onPick={setCategory} />
          <div className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">Pick a number</div>
          <div className="flex items-center gap-3.5 p-3.5 mb-1 bg-slate-900 border border-slate-700 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center font-extrabold text-white flex-shrink-0">#</div>
            <label className="text-sm text-slate-400 flex-1">Your number (adds to algorithm {algos[turnIdx]})</label>
            <input type="number" value={pickNum} min="1" onChange={(e) => setPickNum(e.target.value)} placeholder="e.g. 2"
              className="w-20 p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 font-mono text-base" />
          </div>
          <div className="flex gap-2.5 mt-3.5">
            <button onClick={resetAll} className="border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-yellow-600 font-semibold text-sm px-4 py-2.5 rounded-lg">Restart</button>
            <button disabled={!category || !pickNum} onClick={submitTurn}
              className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105">
              Reveal player {turnIdx + 1 < numPlayers ? "" : "(final)"}
            </button>
          </div>
        </div>
      )}

      {(stage === "turn" || stage === "done") && results.length > 0 && (
        <>{results.map((r, i) => <ResultCard key={i} r={r} />)}</>
      )}

      {stage === "done" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
          <h2 className="text-xl font-extrabold text-white mb-1.5">Match complete</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            All {numPlayers} player{numPlayers > 1 ? "s" : ""} revealed. Head to the Head to Head tab to compare any two from the same category, or play again.
          </p>
          <button onClick={resetAll} className="bg-yellow-400 text-slate-950 font-bold text-sm px-5 py-3 rounded-lg hover:brightness-105">Play again</button>
        </div>
      )}
    </>
  );
}

function ResultCard({ r }) {
  const p = r.player;
  const meta = CATEGORY_META[r.category];
  return (
    <div className="rounded-2xl border-2 border-green-900 bg-gradient-to-b from-green-950 to-black p-5 text-center mb-4 relative overflow-hidden">
      <div className="font-mono text-xs tracking-widest uppercase text-green-400 relative z-10">{r.playerLabel} · {meta.label} pick</div>
      <div className="font-mono text-xs text-green-400/80 my-2 relative z-10">algorithm {r.algo} + number {r.pickNum} = {r.sum} → rank #{p.rank}</div>
      <div className="flex justify-center mb-2 relative z-10"><Avatar name={p.name} team={p.team} size={72} /></div>
      <div className="font-black text-3xl text-green-300 relative z-10" style={{ textShadow: "0 0 14px rgba(110,231,138,0.55)" }}>#{p.rank}</div>
      <div className="font-bold text-xl text-green-50 relative z-10 mt-1">{p.name}</div>
      <div className="text-xs text-green-600 font-mono mt-0.5 relative z-10">{p.team} · {p.matches} IPL matches</div>
      <div className="flex flex-wrap gap-2.5 justify-center mt-4 relative z-10">
        {meta.primary === "runs" && <><StatPill v={p.runs} k="Runs" /><StatPill v={p.avg} k="Average" /><StatPill v={p.sr} k="Strike Rate" /></>}
        {meta.primary === "combo" && <><StatPill v={p.runs} k="Runs" /><StatPill v={p.wickets} k="Wickets" /><StatPill v={p.econ ?? "—"} k="Economy" /></>}
        {meta.primary === "wickets" && <><StatPill v={p.wickets} k="Wickets" /><StatPill v={p.econ} k="Economy" /><StatPill v={p.bowlSR} k="Bowl SR" /></>}
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
                {meta.primary === "runs" && <><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Runs</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Avg</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">SR</th></>}
                {meta.primary === "combo" && <><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Runs</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Wkts</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Econ</th></>}
                {meta.primary === "wickets" && <><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Wkts</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Econ</th><th className="text-left font-mono text-[10px] tracking-wide uppercase text-slate-400 py-2 px-1.5 border-b border-slate-700">Bowl SR</th></>}
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
                  {meta.primary === "runs" && <><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.runs}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.avg}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.sr}</td></>}
                  {meta.primary === "combo" && <><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.runs}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.wickets}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.econ ?? "—"}</td></>}
                  {meta.primary === "wickets" && <><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.wickets}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.econ}</td><td className="py-2.5 px-1.5 border-b border-white/5 text-sm text-slate-200">{p.bowlSR}</td></>}
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

/* ============ COMPARE TOOL ============ */
function CompareTool() {
  const [cat, setCat] = useState("batsman");
  const { deletedSet } = useDeletedPlayers(cat);
  const ranked = useMemo(() => rankOf(cat, deletedSet), [cat, deletedSet]);
  const [aName, setAName] = useState("");
  const [bName, setBName] = useState("");

  useEffect(() => {
    if (ranked.length === 0) return;
    if (!ranked.find(p => p.name === aName)) setAName(ranked[0]?.name || "");
    if (!ranked.find(p => p.name === bName)) setBName(ranked[1]?.name || ranked[0]?.name || "");
    // eslint-disable-next-line
  }, [cat, ranked.length]);

  const a = ranked.find((p) => p.name === aName);
  const b = ranked.find((p) => p.name === bName);
  const meta = CATEGORY_META[cat];

  function rows() {
    if (meta.primary === "runs") return [["Runs", "runs", (x) => x], ["Average", "avg", (x) => x], ["Strike Rate", "sr", (x) => x], ["Matches", "matches", (x) => x]];
    if (meta.primary === "combo") return [["Runs", "runs", (x) => x], ["Wickets", "wickets", (x) => x], ["Matches", "matches", (x) => x]];
    return [["Wickets", "wickets", (x) => x], ["Economy", "econ", (x) => -x], ["Bowl SR", "bowlSR", (x) => -x], ["Matches", "matches", (x) => x]];
  }

  const scoreInfo = useMemo(() => {
    if (!a || !b) return null;
    let scoreA = 0, scoreB = 0;
    rows().forEach(([label, key, dir]) => {
      const va = a[key], vb = b[key];
      if (va == null || vb == null) return;
      const da = dir(va), db = dir(vb);
      if (da > db) scoreA++;
      else if (db > da) scoreB++;
    });
    return { scoreA, scoreB };
    // eslint-disable-next-line
  }, [a, b, cat]);

  function winner() {
    if (!scoreInfo) return null;
    if (scoreInfo.scoreA === scoreInfo.scoreB) return null;
    return scoreInfo.scoreA > scoreInfo.scoreB ? a : b;
  }

  const w = winner();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-5">
      <h2 className="text-xl font-extrabold text-white mb-1.5">Head to Head</h2>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">Compare two players from the same category, stat for stat.</p>

      <CatGrid active={cat} onPick={setCat} />

      {ranked.length < 2 ? (
        <div className="text-slate-400 text-sm text-center py-6 px-2.5">Not enough players left in this category to compare — restore some from Player Lists.</div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 mb-4">
            <select value={aName} onChange={(e) => setAName(e.target.value)} className="flex-1 p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm">
              {ranked.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <div className="font-black text-yellow-400 text-sm flex-shrink-0">VS</div>
            <select value={bName} onChange={(e) => setBName(e.target.value)} className="flex-1 p-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm">
              {ranked.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          {a && b && aName !== bName && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[a, b].map((p) => (
                  <div key={p.name} className={"flex flex-col items-center p-4 rounded-xl border transition-colors " +
                    (w && w.name === p.name ? "border-yellow-400 bg-yellow-400/10" : "border-slate-700 bg-slate-900")}>
                    <Avatar name={p.name} team={p.team} size={64} />
                    <div className="font-bold text-sm text-slate-100 mt-2 text-center">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.team}</div>
                    {w && w.name === p.name && (
                      <div className="mt-2 font-mono text-[10px] tracking-widest uppercase bg-yellow-400 text-slate-950 px-2 py-1 rounded-full font-bold">Winner</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mt-2.5">
                {rows().map(([label, key, dir]) => {
                  const va = a[key], vb = b[key];
                  const aWins = va != null && vb != null && dir(va) > dir(vb);
                  const bWins = va != null && vb != null && dir(vb) > dir(va);
                  return (
                    <React.Fragment key={key}>
                      <div className={"font-mono text-sm p-2.5 rounded-lg text-center font-bold " + (aWins ? "bg-yellow-400/15 border border-yellow-400 text-yellow-400" : "bg-slate-900 text-slate-100")}>{va ?? "—"}</div>
                      <div className="text-[11px] text-slate-400 text-center uppercase tracking-wide font-mono">{label}</div>
                      <div className={"font-mono text-sm p-2.5 rounded-lg text-center font-bold " + (bWins ? "bg-yellow-400/15 border border-yellow-400 text-yellow-400" : "bg-slate-900 text-slate-100")}>{vb ?? "—"}</div>
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="mt-4.5 p-4 rounded-lg bg-gradient-to-br from-yellow-400/10 to-yellow-400/[0.02] border border-yellow-700 text-sm leading-relaxed text-slate-200">
                {w ? (
                  <><b className="text-yellow-400">Verdict:</b> {w.name} wins this match-up, leading on {Math.max(scoreInfo.scoreA, scoreInfo.scoreB)} of {rows().length} key stats.</>
                ) : (
                  <><b className="text-yellow-400">Verdict:</b> {a.name} and {b.name} are evenly matched across these career numbers — a genuine toss-up.</>
                )}
              </div>
            </>
          )}
          {aName === bName && <div className="text-slate-400 text-sm text-center py-6 px-2.5">Pick two different players to compare.</div>}
        </>
      )}
    </div>
  );
}

/* ============ APP ============ */
export default function App() {
  const [tab, setTab] = useState("play");
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="max-w-3xl mx-auto px-4 py-7 pb-20">
        <div className="relative rounded-2xl overflow-hidden mb-6 p-8 pb-7 border border-white/10" style={{ background: "linear-gradient(180deg, #2f7a4f 0%, #1f5a38 100%)" }}>
          <div className="absolute -top-14 -right-10 w-56 h-56 rounded-full opacity-70" style={{ background: "radial-gradient(circle, rgba(255,210,63,0.35), transparent 65%)", filter: "blur(2px)" }}></div>
          <p className="relative z-10 font-mono text-[11px] tracking-widest uppercase text-green-50/85 mb-2.5">Under the lights · Career stats 2010–2026</p>
          <h1 className="relative z-10 font-black text-4xl sm:text-5xl leading-none text-white mb-3" style={{ textShadow: "0 2px 0 rgba(0,0,0,0.25)" }}>Number 11</h1>
          <p className="relative z-10 max-w-md text-white/90 text-[15px] leading-relaxed">
            Pick your algorithm, call a category, and the scoreboard reveals your player — with a jersey card and career stats. Then settle the debates in Head to Head.
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

        {tab === "play" && <PlayGame />}
        {tab === "browse" && <BrowseLists />}
        {tab === "compare" && <CompareTool />}

        <div className="text-center text-slate-400 text-[11px] mt-6 leading-relaxed">
          {BATSMEN.length} batsmen · {ALL_ROUNDERS.length} all-rounders · {SPINNERS.length} spinners · {FAST_BOWLERS.length} fast bowlers — every real player here has roughly 20+ IPL matches somewhere across 2010–2026.
          Spinner and fast-bowler pools are naturally smaller than batsmen, so those categories fall short of 100 rather than being padded with invented names.
          <br />
          Player cards use team-colored jersey avatars with initials, not photos — real player images aren't something I can pull in here.
          <br />
          Removed players stay hidden across sessions in this portal; use "Restore removed" in Player Lists to bring them back. Stats are approximate career aggregates spanning many seasons — check iplt20.com/stats or espncricinfo.com for exact current numbers.
        </div>
      </div>
    </div>
  );
}
