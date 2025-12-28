// public/workers/rag_worker.js

console.log("Worker: 🟢 I AM ALIVE! (File loaded)");

// --- 1. LOCAL VARIABLES ---
let pipeline, env, create, insert, search;
let db = null;
let extractor = null;

// --- LEGAL DATA (Ultimate Master Database: Junior + Senior + Serious Crimes) ---
const legalData = [
  // ==========================================
  // 1. SERIOUS CRIMES (Murder, Theft, Kidnapping)
  // ==========================================
  {
    id: "cr1",
    keywords: ["murder", "kill", "death", "homicide", "302"],
    content: "Murder is defined under Section 300 of the IPC (Section 101 BNS). The punishment for murder under Section 302 IPC (Section 103 BNS) is death or imprisonment for life, and a fine."
  },
  {
    id: "cr2",
    keywords: ["culpable homicide", "unintentional killing", "manslaughter", "not murder"],
    content: "Culpable Homicide not amounting to murder (Section 299 IPC / Section 100 BNS) occurs when an act causes death but without the specific intent of murder. Punishment can extend up to 10 years or life imprisonment (Section 304 IPC)."
  },
  {
    id: "cr3",
    keywords: ["kidnapping", "abduction", "child", "ransom", "missing"],
    content: "Kidnapping (taking a minor from lawful guardianship) is punishable under Section 363 IPC (Section 137 BNS) with up to 7 years jail. Kidnapping for ransom (Section 364A IPC) is punishable by death or life imprisonment."
  },
  {
    id: "cr4",
    keywords: ["theft", "steal", "robbery", "dacoity", "snatch"],
    content: "Theft (Section 378 IPC / Section 303 BNS) involves moving movable property without consent. Punishment is up to 3 years. Robbery (theft with force) and Dacoity (robbery by 5+ people) carry much harsher sentences (up to 10 years or life)."
  },
  {
    id: "cr5",
    keywords: ["cheating", "fraud", "scam", "deception", "420"],
    content: "Cheating and dishonestly inducing delivery of property is a crime under Section 420 IPC (Section 318 BNS), punishable with imprisonment up to 7 years and a fine."
  },

  // ==========================================
  // 2. WOMEN'S SAFETY, RAPE & POCSO
  // ==========================================
  {
    id: "sx1",
    keywords: ["rape", "sexual assault", "force", "consent", "376"],
    content: "Rape is defined under Section 375 IPC (Section 63 BNS). Sexual intercourse without consent is rape. Punishment (Section 376 IPC) is rigorous imprisonment for not less than 10 years, extending to life."
  },
  {
    id: "sx2",
    keywords: ["pocso", "child abuse", "minor", "sexual assault", "touching"],
    content: "The POCSO Act, 2012 protects children (<18 years) from sexual assault, harassment, and pornography. Penetrative Sexual Assault (Section 3) carries a minimum sentence of 10-20 years. Police must report such cases immediately, and the child's identity is protected."
  },
  {
    id: "w1",
    keywords: ["domestic violence", "husband", "beat", "hit", "torture", "dowry", "wife", "abuse"],
    content: "Under Section 498A of the IPC (BNS Sec 85), subjecting a woman to cruelty by her husband or relatives is a non-bailable offense (up to 3 years jail). The Protection of Women from Domestic Violence Act, 2005 provides right to residence, protection orders, and monetary relief."
  },
  {
    id: "w2",
    keywords: ["stalking", "follow", "watch", "internet", "message", "harass", "woman"],
    content: "Stalking is a crime under Section 354D of the IPC. Physically following a woman or monitoring her online activity (email, social media) is punishable with up to 3 years imprisonment on first conviction."
  },
  {
    id: "w3",
    keywords: ["night", "arrest", "police", "woman", "sunset", "sunrise"],
    content: "Under Section 46(4) of the CrPC, a woman cannot be arrested after sunset and before sunrise. If necessary, a woman police officer must obtain prior permission from a Judicial Magistrate First Class."
  },
  {
    id: "w4",
    keywords: ["maternity", "leave", "pregnancy", "job", "work", "mother", "fire"],
    content: "The Maternity Benefit Act, 1961 (amended 2017) guarantees 26 weeks of paid leave for women in establishments with 10+ employees. Firing a woman due to pregnancy is illegal."
  },
  {
    id: "w5",
    keywords: ["acid", "attack", "burn", "face", "throw", "scar"],
    content: "Acid attacks are punishable under Section 326A IPC with minimum 10 years to life imprisonment. Victims are entitled to free medical treatment at all hospitals (public and private) and compensation."
  },
  {
    id: "w6",
    keywords: ["workplace", "harassment", "sexual", "boss", "office", "posh", "committee"],
    content: "The POSH Act, 2013 mandates an Internal Complaints Committee (ICC) in any workplace with 10+ employees. It defines sexual harassment broadly, including unwelcome physical contact, demand for sexual favors, or showing pornography."
  },
  {
    id: "w7",
    keywords: ["voyeurism", "watching", "private act", "changing room"],
    content: "Voyeurism (Section 354C IPC) involves watching or capturing images of a woman engaging in a private act. First conviction is punishable with 1-3 years jail."
  },

  // ==========================================
  // 3. PHYSICAL OFFENSES (Assault & Battery)
  // ==========================================
  {
    id: "phy1",
    keywords: ["assault", "threat", "fear", "gesture"],
    content: "Assault (Section 351 IPC / Section 130 BNS) is making a gesture or preparation that causes someone to apprehend use of criminal force. Mere words do not amount to assault, but words + gestures do."
  },
  {
    id: "phy2",
    keywords: ["criminal force", "battery", "hit", "push", "physical contact"],
    content: "Using Criminal Force (often called Battery) is defined under Section 350 IPC (Section 131 BNS). Intentionally using force to cause injury, fear, or annoyance without consent is punishable with up to 3 months jail."
  },
  {
    id: "phy3",
    keywords: ["grievous hurt", "fracture", "permanent damage", "eye", "ear", "bone"],
    content: "Voluntarily causing Grievous Hurt (Section 320 IPC / Section 116 BNS) includes emasculation, loss of sight/hearing, fracture of bone, or disfigurement. Punishment can extend up to 7 years or life imprisonment."
  },

  // ==========================================
  // 4. POLICE POWERS, FIR & ARREST
  // ==========================================
  {
    id: "p1",
    keywords: ["fir", "police station", "complaint", "refuse", "register", "zero fir"],
    content: "Police cannot refuse to register an FIR for a cognizable offense. A 'Zero FIR' can be filed at any station regardless of jurisdiction. If refused, send a written complaint to the Superintendent of Police (SP) or approach a Magistrate under Section 156(3) CrPC."
  },
  {
    id: "p2",
    keywords: ["arrest", "24 hours", "magistrate", "custody", "detention"],
    content: "Article 22 of the Constitution mandates that an arrested person must be produced before a Magistrate within 24 hours (excluding travel time). Detention beyond this without court order is illegal."
  },
  {
    id: "p3",
    keywords: ["bail", "anticipatory", "arrest fear", "court"],
    content: "If you fear arrest for a non-bailable offense, you can apply for 'Anticipatory Bail' under Section 438 CrPC (Section 482 BNSS) before the Sessions Court or High Court. This prevents police from arresting you while the investigation continues."
  },
  {
    id: "p4",
    keywords: ["search", "warrant", "house", "police enter"],
    content: "Police generally need a search warrant to search your house. However, for cognizable offenses where evidence might be destroyed, they can search without a warrant but must record reasons in writing (Section 165 CrPC)."
  },
  {
    id: "p5",
    keywords: ["handcuff", "chain", "humiliation", "arrest rights"],
    content: "The Supreme Court ruled that routine handcuffing is illegal and inhuman. Police can only handcuff if there is a recorded, proven risk of the prisoner escaping or being violent."
  },

  // ==========================================
  // 5. INTELLECTUAL PROPERTY RIGHTS (IPR)
  // ==========================================
  {
    id: "ipr1",
    keywords: ["copyright", "piracy", "movie", "song", "software", "copy"],
    content: "Under the Copyright Act, 1957, copyright infringement (Section 63) is a criminal offense punishable with imprisonment of 6 months to 3 years and a fine of ₹50,000 to ₹2 lakh."
  },
  {
    id: "ipr2",
    keywords: ["trademark", "brand", "fake", "logo", "counterfeit"],
    content: "Falsely applying a trademark or selling goods with a false trademark is punishable under Section 103 of the Trade Marks Act, 1999 with imprisonment of 6 months to 3 years."
  },
  {
    id: "ipr3",
    keywords: ["patent", "invention", "steal idea", "rights"],
    content: "The Patents Act, 1970 grants exclusive rights to an inventor for 20 years. Infringement is usually a civil matter (suit for damages/injunction), but violating secrecy directions regarding defense inventions is criminal."
  },

  // ==========================================
  // 6. TRAFFIC & ROAD SAFETY
  // ==========================================
  {
    id: "t1",
    keywords: ["drunk", "driving", "alcohol", "fine", "challan"],
    content: "Driving with blood alcohol exceeding 30mg/100ml is a crime under Section 185 of the Motor Vehicles Act. Punishment includes fine up to ₹10,000 and/or imprisonment up to 6 months."
  },
  {
    id: "t2",
    keywords: ["helmet", "seatbelt", "fine", "traffic rule"],
    content: "Riding without a helmet (driver and pillion) attracts a fine of ₹1,000 and license suspension for 3 months (Section 129/194D MV Act). Not wearing a seatbelt attracts a fine of ₹1,000."
  },
  {
    id: "t3",
    keywords: ["police", "vehicle", "keys", "snatch", "traffic police"],
    content: "A traffic police officer cannot snatch the keys from your ignition or force you out of the car. Only an officer of rank Assistant Sub-Inspector (ASI) or above can fine you for traffic violations."
  },
  {
    id: "t4",
    keywords: ["accident", "help", "victim", "hospital", "good samaritan"],
    content: "Under the Good Samaritan Law, a bystander who helps a road accident victim cannot be forced to reveal their identity, pay hospital bills, or face police harassment. Hospitals must treat emergency victims immediately."
  },
  {
    id: "t5",
    keywords: ["insurance", "expire", "car", "bike", "fine"],
    content: "Driving a vehicle without valid third-party insurance is punishable with a fine of ₹2,000 and/or imprisonment up to 3 months under Section 196 of the MV Act."
  },

  // ==========================================
  // 7. CYBER CRIME & DIGITAL RIGHTS
  // ==========================================
  {
    id: "cy1",
    keywords: ["hacking", "password", "unauthorized access", "wifi", "data theft"],
    content: "Hacking (Section 66 IT Act) or Identity Theft (Section 66C) involves using someone's password or accessing their computer without permission. Punishment is up to 3 years jail and fine."
  },
  {
    id: "cy2",
    keywords: ["phishing", "otp", "fraud", "bank scam", "link"],
    content: "Phishing and stealing sensitive data (passwords, bank details) is punishable under Section 66C (Identity Theft) and 66D (Cheating by Personation) of the IT Act."
  },
  {
    id: "cy3",
    keywords: ["nude", "photos", "leak", "revenge porn", "privacy"],
    content: "Publishing or transmitting images of private parts of a person without consent is a crime under Section 66E (Violation of Privacy) of the IT Act. Punishment is up to 3 years jail."
  },
  {
    id: "cy4",
    keywords: ["fake profile", "impersonation", "social media", "identity"],
    content: "Creating a fake profile to cheat or damage reputation is punishable under Section 66D of the Information Technology Act (Cheating by Personation)."
  },

  // ==========================================
  // 8. FAMILY, DIVORCE & INHERITANCE
  // ==========================================
  {
    id: "f1",
    keywords: ["maintenance", "alimony", "wife", "parents", "money"],
    content: "Under Section 125 CrPC, a wife, children, and elderly parents who cannot maintain themselves can claim monthly maintenance from the husband/father/son. This applies even if the wife is working but earns significantly less."
  },
  {
    id: "f2",
    keywords: ["divorce", "mutual consent", "separation", "6 months"],
    content: "Divorce by Mutual Consent (Section 13B Hindu Marriage Act) is the fastest way. Both parties agree to separate. The court usually gives a 6-month 'cooling-off' period, which can be waived in exceptional cases."
  },
  {
    id: "f3",
    keywords: ["daughter", "property", "father", "ancestral", "share"],
    content: "Daughters have an equal right to ancestral property as sons by birth, under the Hindu Succession (Amendment) Act, 2005. This applies even if the daughter is married."
  },
  {
    id: "f4",
    keywords: ["live-in", "relationship", "legal", "rights"],
    content: "Live-in relationships are legal in India. Women in live-in relationships are protected under the Domestic Violence Act and children born from such relationships are legitimate and have property rights."
  },
  {
    id: "f5",
    keywords: ["gift deed", "senior citizen", "parents", "maintenance", "revoke"],
    content: "Under the Maintenance and Welfare of Parents and Senior Citizens Act, 2007, if a senior citizen transfers property as a gift on condition of care, and is neglected, the transfer can be cancelled (declared void)."
  },

  // ==========================================
  // 9. EMPLOYMENT & LABOR RIGHTS
  // ==========================================
  {
    id: "e1",
    keywords: ["gratuity", "5 years", "leaving job", "salary"],
    content: "Under the Payment of Gratuity Act, 1972, an employee who has completed 5 continuous years of service is entitled to Gratuity (a lump sum payment) upon resignation, retirement, or termination."
  },
  {
    id: "e2",
    keywords: ["pf", "provident fund", "employer", "deduct"],
    content: "Employers with 20+ employees must register for EPF. Deducting PF from salary but not depositing it into the employee's account is a criminal offense under the EPF Act."
  },
  {
    id: "e3",
    keywords: ["notice period", "fired", "termination", "illegal"],
    content: "An employee cannot be fired instantly without notice or pay in lieu of notice (usually 1 month), as per the Industrial Disputes Act or employment contract."
  },

  // ==========================================
  // 10. PROPERTY & TENANT RIGHTS
  // ==========================================
  {
    id: "pr1",
    keywords: ["landlord", "evict", "rent", "force", "tenant"],
    content: "A landlord cannot forcibly evict a tenant without a court order. Disconnecting essential services like electricity or water to force eviction is illegal."
  },

  // ==========================================
  // 11. CONSUMER & GENERAL CITIZEN RIGHTS
  // ==========================================
  {
    id: "g1",
    keywords: ["consumer", "defective", "refund", "service", "court"],
    content: "The Consumer Protection Act, 2019 allows consumers to file complaints for defective goods, deficiency in service, or unfair trade practices. Complaints can be filed online via E-Daakhil."
  },
  {
    id: "g2",
    keywords: ["mrp", "overcharge", "price", "bottle"],
    content: "Charging more than the MRP (Maximum Retail Price) is illegal. Consumers can complain to the Legal Metrology Department. Restaurants cannot force a 'Service Charge' if the customer does not wish to pay."
  },
  {
    id: "g3",
    keywords: ["rti", "information", "govt", "file", "status"],
    content: "Under the Right to Information (RTI) Act, 2005, any citizen can demand information from public authorities. They must reply within 30 days. It is a powerful tool to check the status of government work/files."
  },
  {
    id: "g4",
    keywords: ["free lawyer", "legal aid", "poor", "court fees"],
    content: "Under Article 39A of the Constitution and the Legal Services Authorities Act, free legal aid is provided to women, children, SC/ST members, and persons with annual income below a specific limit (e.g., ₹3 lakh)."
  },
  {
    id: "g5",
    keywords: ["check bounce", "cheque", "dishonour", "payment"],
    content: "Cheque bounce is a criminal offense under Section 138 of the Negotiable Instruments Act. The issuer can be jailed for up to 2 years or fined double the cheque amount."
  },
  {
    id: "g6",
    keywords: ["defamation", "slander", "libel", "reputation", "insult"],
    content: "Defamation (Section 499 IPC / Section 356 BNS) is harming a person's reputation by spoken or written words. Punishment under Section 500 IPC is simple imprisonment up to 2 years."
  }
];

// --- 3. INITIALIZATION ---
async function initialize() {
  try {
    console.log("Worker: Loading Local Libraries...");

    // IMPORT LOCAL FILES (Bypassing Internet & Next.js)
    const transformers = await import("./transformers.min.js");
    const orama = await import("./orama.min.js");

    // Assign libraries to variables
    pipeline = transformers.pipeline;
    env = transformers.env;
    create = orama.create;
    insert = orama.insert;
    search = orama.search;

    console.log("Worker: Libraries Loaded. Downloading Model...");

    // Configure Environment
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    // Load AI Model (Downloads once, then caches)
    // We use the Multilingual model to support Hindi/Hinglish natively
    extractor = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2");

    // Create Database
    db = await create({
      schema: {
        content: "string",
        keywords: "string[]",
        embedding: "vector[384]"
      }
    });

    console.log("Worker: Indexing Data...");
    for (const item of legalData) {
      const out = await extractor(item.content, { pooling: "mean", normalize: true });
      await insert(db, {
        content: item.content,
        keywords: item.keywords,
        embedding: Array.from(out.data)
      });
    }

    console.log("Worker: ✅ READY");
    self.postMessage({ status: "ready" });

  } catch (err) {
    console.error("❌ Worker Error:", err);
    self.postMessage({ status: "error", message: err.toString() });
  }
}

// --- 4. LISTENER ---
self.onmessage = async (e) => {
  if (e.data.type === "init") initialize();

  if (e.data.type === "search") {
    if (!extractor || !db) return; // Ignore if not ready
    
    const out = await extractor(e.data.query, { pooling: "mean", normalize: true });
    const res = await search(db, {
      mode: "hybrid",
      term: e.data.query,
      vector: { value: Array.from(out.data), property: "embedding" },
      similarity: 0.6,
      limit: 2
    });
    self.postMessage({ status: "results", hits: res.hits });
  }
};