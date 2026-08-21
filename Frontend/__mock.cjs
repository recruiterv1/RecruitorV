// Stub API so the two new pages can be rendered without a login.
const express = require('express');
const app = express();
app.use(express.json());
const areas = [
  { key:'requirement', icon:'🎯', n:'01', title:'Understand the Real Requirement', prompt:'What should recruiters understand beyond the JD?' },
  { key:'sourcing', icon:'🔎', n:'02', title:'Sourcing & Head-hunting Strategy', prompt:'Where should recruiters find the right candidates?' },
  { key:'watchouts', icon:'⚠️', n:'03', title:'Hiring Watch-outs', prompt:'What could make this position difficult to close?' },
  { key:'assess', icon:'✅', n:'04', title:'Assess & Decide', prompt:'How should recruiters decide whether a candidate is worth submitting?' },
  { key:'engage', icon:'🤝', n:'05', title:'Engage & Close', prompt:'How should recruiters keep the candidate interested?' },
];
app.get('/api/briefing/position/:id', (req,res) => res.json({ success:true,
  author:{ type:'coach', name:'Test Coach' },
  position:{ pos_id:req.params.id, position:'Senior Relationship Manager', client:'Tata Capital',
    location:'Gurgaon', experience:'8–15 Years', skill_category:'Wealth Management', openings:'3' },
  briefing:null, areas, progress:{ ready:18, draft:2, pending:7, total:27 } }));
app.get('/api/briefing/my-positions', (_q,res) => res.json({ success:true, author:{type:'coach'},
  stats:{pending:2,draft:1,ready:2,total:5,completion:40},
  positions:[
    { pos_id:'1825', position:'Relationship Manager', client:'Tata Capital', datePosted:'2026-08-20', briefingState:'pending', briefingUpdatedAt:null, durationLabel:null },
    { pos_id:'1826', position:'Branch Manager', client:'Kotak Mahindra', datePosted:'2026-08-17', briefingState:'pending', briefingUpdatedAt:null, durationLabel:null },
    { pos_id:'1827', position:'Investment Product Specialist', client:'Tata Capital', datePosted:'2026-08-20', briefingState:'draft', briefingUpdatedAt:'2026-08-21', durationLabel:null },
    { pos_id:'1828', position:'NRI Relationship Manager', client:'AU Bank', datePosted:'2026-08-19', briefingState:'ready', briefingUpdatedAt:'2026-08-20', durationLabel:'01:24' },
    { pos_id:'1829', position:'Cluster Head', client:'Tata Capital', datePosted:'2026-08-18', briefingState:'ready', briefingUpdatedAt:'2026-08-19', durationLabel:'02:11' },
  ] }));
app.listen(5199, () => console.log('mock on 5199'));
