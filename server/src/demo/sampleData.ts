export const SAMPLE_POLICY_TEXT = `================================================================================
CLAIMPILOT SYNTHETIC HEALTH INSURANCE POLICY — NOT A REAL INSURANCE POLICY
POLICY NUMBER: POL-IND-2026-9801
INSURED ENTITY: STANDARD COMPREHENSIVE HEALTHCARE PLAN
================================================================================

SECTION 1: DEFINITIONS & ELIGIBILITY
1.1 Hospitalization: Admission to an accredited medical facility for a minimum continuous period of 24 hours, except for day-care procedures explicitly listed in Schedule B.
1.2 Medically Necessary: Medical treatment or diagnostic test required for the diagnosis or management of a pathological illness or acute bodily injury, prescribed by an authorized medical practitioner.

SECTION 2: INPATIENT HOSPITALIZATION COVERAGE
2.1 Room, Boarding, and Nursing: Room charges are covered up to 2% of the total Sum Insured per day, or up to ₹6,000 per day for standard private rooms. Any charges exceeding this threshold will trigger proportionate deductions across associated room-linked hospital charges.
2.2 Intensive Care Unit (ICU): ICU charges are covered up to 4% of the Sum Insured per day, or maximum ₹12,000 per day.
2.3 Surgeon, Anesthetist, and Specialist Consultation: Professional fees are covered in accordance with the hospital schedule of charges for covered procedures.
2.4 Surgical Implants and Prosthetics: Medically prescribed FDA/CE certified implants used in reconstructive surgeries (e.g. knee arthroscopy anchors, stents) are covered at actual invoice cost.

SECTION 3: SPECIFIC SURGICAL COVERAGES
3.1 Orthopedic & Joint Surgeries: Arthroscopic knee repairs, ACL/PCL reconstructions, and meniscectomy are covered following traumatic injury or acute joint disorder, subject to waiting periods.
3.2 Cardiovascular Care: Angioplasty, coronary bypass (CABG), and pacemaker implantations are covered up to the maximum Sum Insured.
3.3 Oncology: Inpatient chemotherapy, radiation oncology, and oncological surgery are covered up to the maximum Sum Insured without room sub-limit caps.

SECTION 4: WAITING PERIODS
4.1 Initial Waiting Period: A mandatory 30-day waiting period from policy inception date applies to all illnesses, excluding emergency accidental injuries.
4.2 Pre-Existing Diseases (PED): Pre-existing medical conditions and chronic ailments are covered after 24 continuous months of active coverage under this policy.
4.3 Specific Disease Waiting Period: A 24-month waiting period applies to elective joint replacements, cataract surgeries, benign prostatic hypertrophy, and hernia repairs unless arising from acute accidental trauma.

SECTION 5: PERMANENT EXCLUSIONS (STRICT NON-COVERAGE)
5.1 Cosmetic and Aesthetic Surgeries: Pure cosmetic, aesthetic, or plastic surgeries performed primarily for cosmetic alteration or personal appearance enhancement (including rhinoplasty, elective liposuction, breast augmentation, hair transplants) are strictly excluded from coverage.
5.2 Unproven or Experimental Treatments: Treatments, therapies, and clinical trials lacking regulatory clinical validation by medical councils are not covered.
5.3 Substance Abuse & Self-Inflicted Injuries: Treatment arising directly from alcohol dependency, narcotics, or intentional self-harm is excluded.
5.4 Non-Medical Ancillary Items: Surcharges for telephone, television, visitor suites, luxury amenities, and luxury hospital items are non-payable.

SECTION 6: CLAIMS DOCUMENTATION & AUDIT PROVISIONS
6.1 Itemized Billing Requirement: Every claim must be accompanied by a detailed itemized breakdown of pharmacy, diagnostics, and surgical theater fees.
6.2 Clinical Reconciliation: The admission date, discharge date, and diagnosis recorded on the Discharge Summary must precisely align with the final hospital invoice.
6.3 High-Value Threshold: Any claim exceeding ₹500,000 is classified as a High-Value File requiring supervisory executive audit.
================================================================================`;

export interface DemoPreset {
  id: string;
  name: string;
  expectedResult: 'APPROVE' | 'REJECT' | 'ESCALATE';
  description: string;
  patientName: string;
  hospital: string;
  diagnosis: string;
  treatment: string;
  claimAmount: number;
  documents: Array<{
    category: 'HOSPITAL_BILL' | 'DISCHARGE_SUMMARY' | 'PRESCRIPTION' | 'MEDICAL_REPORT' | 'INSURANCE_POLICY';
    filename: string;
    text: string;
  }>;
}

export const DEMO_PRESETS: DemoPreset[] = [
  // ------------------------------------------------------------
  // DEMO CLAIM 1: VALID CLAIM -> APPROVE
  // ------------------------------------------------------------
  {
    id: 'valid-claim',
    name: 'Demo 1: Valid Knee Arthroscopy Claim',
    expectedResult: 'APPROVE',
    description: 'Acute Meniscus Tear with successful arthroscopic repair. All dates, line items, and policy waiting periods match. Within room rent limit.',
    patientName: 'Vikram Sharma (Demo)',
    hospital: 'Apex Specialty Orthopedic Center',
    diagnosis: 'Acute Meniscus Tear & ACL Strain (Right Knee)',
    treatment: 'Arthroscopic Knee Meniscal Repair & Reconstruction',
    claimAmount: 118000,
    documents: [
      {
        category: 'HOSPITAL_BILL',
        filename: 'hospital_bill_clm1.txt',
        text: `APEX SPECIALTY ORTHOPEDIC CENTER
TAX INVOICE / HOSPITAL BILL (SYNTHETIC DEMO DATA)
Invoice No: INV-2026-4401 | Date: 2026-08-15
Patient Name: Vikram Sharma | Age: 36 | Gender: Male
Admission Date: 2026-08-10 09:30 AM | Discharge Date: 2026-08-14 02:00 PM
Room Type: Single Private Room (4 Days @ ₹5,500/day) = ₹22,000

ITEMIZED CHARGES:
1. OT & Surgical Suite Charges: ₹35,000
2. Surgeon & Anesthetist Professional Fee: ₹30,000
3. Surgical Consumables & Bio-Absorbable Anchors: ₹15,000
4. In-hospital Pharmacy & Injectables: ₹8,000
5. Pre-operative Diagnostic Blood Panel & ECG: ₹8,000
TOTAL INVOICE AMOUNT: ₹118,000
Payment Status: Cashless TPA Authorization Pending`,
      },
      {
        category: 'DISCHARGE_SUMMARY',
        filename: 'discharge_summary_clm1.txt',
        text: `APEX SPECIALTY ORTHOPEDIC CENTER - DISCHARGE SUMMARY (SYNTHETIC DEMO)
Patient: Vikram Sharma | UHID: APX-99812
Admission Date: 2026-08-10 | Discharge Date: 2026-08-14
Primary Diagnosis: Acute Right Knee Meniscal Tear following sports trauma.
Surgical Procedure: Right Knee Diagnostic Arthroscopy and Meniscal Anchor Repair.
Operating Surgeon: Dr. R. K. Nair, MS (Ortho)
Clinical Course: Patient tolerated procedure well with no neurovascular deficits. Mobilized on Day 2 with knee brace.
Follow-up: Suture removal after 10 days with gentle physiotherapy.`,
      },
      {
        category: 'MEDICAL_REPORT',
        filename: 'mri_radiology_report_clm1.txt',
        text: `ACCURAD IMAGING SOLUTIONS - MRI REPORT (SYNTHETIC DEMO)
Patient: Vikram Sharma | Date of Scan: 2026-08-08
Investigation: 1.5T MRI of Right Knee Joint
Findings: High-grade radial tear of the posterior horn of the medial meniscus. Intact PCL, Grade 1 sprain of ACL.
Impression: Medically indicated for arthroscopic surgical stabilization.`,
      },
      {
        category: 'INSURANCE_POLICY',
        filename: 'insurance_policy.txt',
        text: SAMPLE_POLICY_TEXT,
      },
    ],
  },

  // ------------------------------------------------------------
  // DEMO CLAIM 2: POLICY EXCLUSION -> REJECT
  // ------------------------------------------------------------
  {
    id: 'exclusion-claim',
    name: 'Demo 2: Cosmetic Rhinoplasty Exclusion',
    expectedResult: 'REJECT',
    description: 'Elective cosmetic nasal reshaping (rhinoplasty). Explicitly excluded under Clause 5.1 (Cosmetic & Aesthetic Surgeries).',
    patientName: 'Priya Mehra (Demo)',
    hospital: 'Aura Aesthetics & Plastic Surgery Clinic',
    diagnosis: 'Nasal Dorsal Hump Correction & Tip Contouring',
    treatment: 'Open Cosmetic Rhinoplasty & Septal Grafting',
    claimAmount: 145000,
    documents: [
      {
        category: 'HOSPITAL_BILL',
        filename: 'hospital_bill_clm2.txt',
        text: `AURA AESTHETICS & PLASTIC SURGERY CLINIC
FINAL INVOICE (SYNTHETIC DEMO DATA)
Invoice No: AUR-9912 | Date: 2026-09-02
Patient: Priya Mehra | Age: 28 | Gender: Female
Admission: 2026-09-01 | Discharge: 2026-09-02
Procedure: Cosmetic Open Rhinoplasty and Tip Sculpting
Total Billed Amount: ₹145,000
Surgeon Fee: ₹85,000 | Theater Charges: ₹40,000 | Anesthesia & Recovery: ₹20,000`,
      },
      {
        category: 'DISCHARGE_SUMMARY',
        filename: 'discharge_summary_clm2.txt',
        text: `AURA AESTHETICS - DISCHARGE CERTIFICATE (SYNTHETIC DEMO)
Patient: Priya Mehra
Date: 2026-09-02
Diagnosis: Elective Aesthetic Rhinoplasty for nasal bridge hump refinement.
Procedure Performed: Cosmetic reduction rhinoplasty with cartilage contouring.
Note: Patient requested aesthetic symmetry enhancement. No airway obstruction or trauma history noted.`,
      },
      {
        category: 'INSURANCE_POLICY',
        filename: 'insurance_policy.txt',
        text: SAMPLE_POLICY_TEXT,
      },
    ],
  },

  // ------------------------------------------------------------
  // DEMO CLAIM 3: DOCUMENT INCONSISTENCY -> ESCALATE
  // ------------------------------------------------------------
  {
    id: 'inconsistency-claim',
    name: 'Demo 3: Date & Billing Mismatch',
    expectedResult: 'ESCALATE',
    description: 'Critical date discrepancy: Discharge summary records discharge 4 days BEFORE admission date, plus line items don’t add up to billed total.',
    patientName: 'Rajesh K. Verma (Demo)',
    hospital: 'Metro City Multispeciality Hospital',
    diagnosis: 'Acute Bacterial Pneumonia & Pleural Effusion',
    treatment: 'IV Antibiotic Therapy & Therapeutic Thoracentesis',
    claimAmount: 92000,
    documents: [
      {
        category: 'HOSPITAL_BILL',
        filename: 'hospital_bill_clm3.txt',
        text: `METRO CITY MULTISPECIALITY HOSPITAL
FINAL IPD BILL (SYNTHETIC DEMO DATA)
Bill No: MC-2026-8821 | Date: 2026-07-28
Patient: Rajesh K. Verma | Age: 52
Admission Date: 2026-07-25 | Discharge Date: 2026-07-20 (CONTRADICTION DETECTED)
Room Charges (General Ward): ₹10,000
Pulmonology Consultation: ₹15,000
Thoracentesis Procedure: ₹22,000
Pharmacy & Consumables: ₹15,000
(Total of line items is ₹62,000)
STATED TOTAL AMOUNT BILLED: ₹92,000 (ARITHMETIC DISCREPANCY OF ₹30,000)`,
      },
      {
        category: 'DISCHARGE_SUMMARY',
        filename: 'discharge_summary_clm3.txt',
        text: `METRO CITY MULTISPECIALITY HOSPITAL
DISCHARGE SUMMARY (SYNTHETIC DEMO)
Patient: Rajesh K. Verma
Admission Date: 2026-07-25
Discharge Date: 2026-07-20 (Recorded discharge is earlier than admission)
Final Diagnosis: Community Acquired Pneumonia
Status on Discharge: Clinically stable`,
      },
      {
        category: 'INSURANCE_POLICY',
        filename: 'insurance_policy.txt',
        text: SAMPLE_POLICY_TEXT,
      },
    ],
  },

  // ------------------------------------------------------------
  // DEMO CLAIM 4: SUSPICIOUS HIGH VALUE / BILLING -> ESCALATE
  // ------------------------------------------------------------
  {
    id: 'suspicious-highvalue-claim',
    name: 'Demo 4: High-Value & Duplicate Billing',
    expectedResult: 'ESCALATE',
    description: 'Total claim exceeds high-value threshold (₹500,000) and contains duplicate ICU bed and robotic surgical kit charges.',
    patientName: 'Ananya Roy (Demo)',
    hospital: 'Global Care Super Specialty Hospital',
    diagnosis: 'Severe Degenerative Lumbar Spine Spondylolisthesis',
    treatment: 'Spinal Decompression & Robotic Lumbar Pedicle Screw Fixation',
    claimAmount: 640000,
    documents: [
      {
        category: 'HOSPITAL_BILL',
        filename: 'hospital_bill_clm4.txt',
        text: `GLOBAL CARE SUPER SPECIALTY HOSPITAL
CONSOLIDATED INPATIENT TAX INVOICE (SYNTHETIC DEMO)
Invoice No: GC-2026-9041 | Date: 2026-08-30
Patient: Ananya Roy | Age: 61
Admission: 2026-08-22 | Discharge: 2026-08-29 (7 Days)
Total Claim Amount: ₹640,000 (Exceeds ₹500,000 High-Value Threshold)

DETAILED LINE ITEMS:
1. Intensive Care Unit (ICU Bed): ₹45,000
2. Intensive Care Unit (ICU Bed) - DUPLICATE LINE: ₹45,000 (Duplicate charge on same date)
3. Robotic Surgical Suite Access Fee: ₹180,000
4. Robotic Surgical Access Consumable Kit - DUPLICATE: ₹180,000 (Identical line item billed twice)
5. Neurosurgeon & Spine Team Fee: ₹110,000
6. Titanium Pedicle Screws & Rods: ₹80,000
TOTAL CLAIMED: ₹640,000`,
      },
      {
        category: 'DISCHARGE_SUMMARY',
        filename: 'discharge_summary_clm4.txt',
        text: `GLOBAL CARE SUPER SPECIALTY HOSPITAL - DISCHARGE REPORT (SYNTHETIC DEMO)
Patient: Ananya Roy
Admission: 2026-08-22 | Discharge: 2026-08-29
Diagnosis: L4-L5 Grade 2 Spondylolisthesis with Radiculopathy
Procedure: L4-L5 Instrument Decompression and Fusion
High value intervention performed. Post-op recovery uneventful.`,
      },
      {
        category: 'INSURANCE_POLICY',
        filename: 'insurance_policy.txt',
        text: SAMPLE_POLICY_TEXT,
      },
    ],
  },
];
