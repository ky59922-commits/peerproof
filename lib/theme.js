// Design tokens
export const N="#1b3358", TE="#2a9d8f", TED="#1e7268", TEL="#eaf6f5", BG="#f2f5f9", W="#ffffff", TX="#111827", MU="#6b7280", BR="#dde4ee";
export const GR="#16a34a", GRL="#f0fdf4", AM="#d97706", AML="#fffbeb", RD="#dc2626", RDL="#fef2f2", BL="#2563eb", BLL="#eff6ff", OR="#ea580c", ORL="#fff7ed";
export const ff="'Inter',sans-serif", ffH="'Syne',sans-serif";

// Scoring definitions
export const KNOWLEDGE={
  A:{label:"Mastery",color:GR,bg:GRL,desc:"Clear command of the field; handled probing questions fluently"},
  B:{label:"Solid",color:BL,bg:BLL,desc:"Strong foundation with minor gaps under deep probing"},
  C:{label:"Surface",color:AM,bg:AML,desc:"Basic awareness; struggled with technical questions"},
  D:{label:"Cannot demonstrate",color:RD,bg:RDL,desc:"Unable to substantiate any knowledge claims from CV"},
};

export const DELTA=[
  {v:3,label:"Significantly exceeded",color:GR,bg:GRL,desc:"Far surpassed CV claims — possible hidden gem"},
  {v:2,label:"Moderately exceeded",color:GR,bg:GRL,desc:"Performed above stated expertise"},
  {v:1,label:"Slightly exceeded",color:BL,bg:BLL,desc:"Modest positive surprise"},
  {v:0,label:"Matched claims",color:MU,bg:BG,desc:"Performance aligned with CV"},
  {v:-1,label:"Slightly below",color:AM,bg:AML,desc:"Minor gap between claims and performance"},
  {v:-2,label:"Moderately below",color:OR,bg:ORL,desc:"Likely exaggeration of qualifications"},
  {v:-3,label:"Significantly below",color:RD,bg:RDL,desc:"Fraud signal — major discrepancy"},
];

// Demo data (will be replaced by Supabase queries later)
export const ASSESSMENTS=[
  {id:"A-001",created:"2025-06-05",status:"completed",
   candidate:{name:"Tanaka Hiroshi",email:"t.hiroshi@mail.com",degree:"Master",field:"Machine Learning / AI",univ:"Osaka University"},
   result:{k:"B",d:-2,notes:"Candidate showed solid familiarity with standard ML pipelines and basic neural network theory. However, when probed on transformer architectures and attention mechanisms in depth, knowledge gaps emerged. Claims of NLP research experience from 2021–2024 could not be substantiated — the candidate was unable to discuss any specific papers or experiments. The discrepancy between claimed PhD-equivalent expertise and demonstrated performance was notable."}},
  {id:"A-002",created:"2025-06-07",status:"in_progress",
   candidate:{name:"Yamamoto Keiko",email:"k.yamamoto@mail.com",degree:"Undergraduate",field:"Molecular Biology",univ:"Keio University"},result:null},
  {id:"A-003",created:"2025-06-08",status:"pending",
   candidate:{name:"Park Junho",email:"j.park@mail.com",degree:"PhD",field:"Behavioral Economics",univ:"Waseda University"},result:null},
];

export const FIELDS=["Machine Learning / AI","Computer Science","Data Science","Electrical Engineering","Mechanical Engineering","Molecular Biology","Biochemistry","Chemistry","Physics","Mathematics","Economics","Behavioral Economics","Finance","Business Administration","International Relations","Linguistics","Other"];
export const DEGREES=["Undergraduate","Master","PhD","PostDoc"];
export const STC={pending:MU,in_progress:BL,completed:GR};
export const STL={pending:"Pending",in_progress:"In progress",completed:"Completed"};
