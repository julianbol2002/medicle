/**
 * Generates public/diagnosis_master_list.txt — Step 1 / clinical medicine autocomplete bank.
 * Run: node scripts/generate-diagnosis-master-list.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "diagnosis_master_list.txt");

function uniqSorted(items) {
  return [...new Set(items.map((s) => s.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

// ---------------------------------------------------------------------------
// Psychiatry / DSM-5 high-yield
// ---------------------------------------------------------------------------
const psychiatry = [
  "Generalized Anxiety Disorder",
  "Panic Disorder",
  "Panic Attack",
  "Somatic Symptom Disorder",
  "Illness Anxiety Disorder",
  "Conversion Disorder (Functional Neurological Symptom Disorder)",
  "Acute Stress Disorder",
  "Adjustment Disorder",
  "Post-traumatic Stress Disorder (PTSD)",
  "Separation Anxiety Disorder",
  "Social Anxiety Disorder (Social Phobia)",
  "Specific Phobia",
  "Agoraphobia",
  "Anxiety Disorder Due to Another Medical Condition",
  "Substance/Medication-Induced Anxiety Disorder",
  "Other Specified Anxiety Disorder",
  "Unspecified Anxiety Disorder",
  "Major Depressive Disorder",
  "Persistent Depressive Disorder (Dysthymia)",
  "Premenstrual Dysphoric Disorder",
  "Disruptive Mood Dysregulation Disorder",
  "Depressive Disorder Due to Another Medical Condition",
  "Substance/Medication-Induced Depressive Disorder",
  "Bipolar I Disorder",
  "Bipolar II Disorder",
  "Cyclothymic Disorder",
  "Bipolar Disorder Due to Another Medical Condition",
  "Schizophrenia",
  "Schizophreniform Disorder",
  "Schizoaffective Disorder",
  "Delusional Disorder",
  "Brief Psychotic Disorder",
  "Schizotypal Personality Disorder",
  "Attention-Deficit/Hyperactivity Disorder (ADHD)",
  "Autism Spectrum Disorder",
  "Obsessive-Compulsive Disorder (OCD)",
  "Body Dysmorphic Disorder",
  "Hoarding Disorder",
  "Trichotillomania (Hair-Pulling Disorder)",
  "Excoriation (Skin-Picking) Disorder",
  "Postpartum Depression",
  "Postpartum Psychosis",
  "Anorexia Nervosa",
  "Bulimia Nervosa",
  "Binge-Eating Disorder",
  "Avoidant/Restrictive Food Intake Disorder",
  "Insomnia Disorder",
  "Narcolepsy",
  "Obstructive Sleep Apnea Hypopnea",
  "Restless Legs Syndrome",
  "Alcohol Use Disorder",
  "Opioid Use Disorder",
  "Stimulant Use Disorder",
  "Cannabis Use Disorder",
  "Nicotine Use Disorder",
  "Antisocial Personality Disorder",
  "Borderline Personality Disorder",
  "Narcissistic Personality Disorder",
  "Avoidant Personality Disorder",
  "Dependent Personality Disorder",
  "Paranoid Personality Disorder",
  "Dissociative Identity Disorder",
  "Dissociative Amnesia",
  "Depersonalization/Derealization Disorder",
  "Catatonia",
  "Neurocognitive Disorder Due to Alzheimer Disease",
  "Vascular Neurocognitive Disorder",
  "Lewy Body Disease",
  "Frontotemporal Neurocognitive Disorder",
];

// ---------------------------------------------------------------------------
// Cardiology
// ---------------------------------------------------------------------------
const cardiology = [
  "Acute coronary syndrome",
  "Acute pericarditis",
  "Acute rheumatic fever",
  "Angina pectoris",
  "Aortic dissection",
  "Aortic regurgitation",
  "Aortic stenosis",
  "Arrhythmogenic right ventricular cardiomyopathy",
  "Atrial fibrillation (AF)",
  "Atrial flutter",
  "Atrial septal defect (ASD)",
  "Atrioventricular block",
  "Brugada syndrome",
  "Cardiac tamponade",
  "Cardiogenic shock",
  "Coarctation of the aorta",
  "Constrictive pericarditis",
  "Dilated cardiomyopathy",
  "Dressler syndrome",
  "Eisenmenger syndrome",
  "Endocarditis",
  "Heart failure with reduced ejection fraction",
  "Heart failure with preserved ejection fraction",
  "Hypertrophic cardiomyopathy",
  "Infective endocarditis",
  "Kawasaki disease",
  "Long QT syndrome",
  "Mitral regurgitation",
  "Mitral stenosis",
  "Mitral valve prolapse",
  "Myocardial infarction (MI)",
  "Myocarditis",
  "Patent ductus arteriosus (PDA)",
  "Patent foramen ovale (PFO)",
  "Pericardial effusion",
  "Prinzmetal angina",
  "Pulmonary hypertension",
  "Restrictive cardiomyopathy",
  "Stable angina",
  "Subacute bacterial endocarditis",
  "Sudden cardiac death",
  "Supraventricular tachycardia (SVT)",
  "Takotsubo cardiomyopathy",
  "Tetralogy of Fallot",
  "Transposition of the great arteries",
  "Tricuspid regurgitation",
  "Unstable angina",
  "Ventricular fibrillation",
  "Ventricular septal defect (VSD)",
  "Ventricular tachycardia",
  "Wolff-Parkinson-White syndrome",
];

// ---------------------------------------------------------------------------
// Pulmonary
// ---------------------------------------------------------------------------
const pulmonary = [
  "Acute respiratory distress syndrome (ARDS)",
  "Asbestosis",
  "Asthma",
  "Atelectasis",
  "Bronchiectasis",
  "Bronchiolitis",
  "Chronic bronchitis",
  "Chronic obstructive pulmonary disease (COPD)",
  "Community-acquired pneumonia",
  "Cor pulmonale",
  "Cystic fibrosis",
  "Empyema",
  "Eosinophilic pneumonia",
  "Hospital-acquired pneumonia",
  "Hypersensitivity pneumonitis",
  "Idiopathic pulmonary fibrosis",
  "Legionella pneumonia",
  "Lung abscess",
  "Lung cancer",
  "Mesothelioma",
  "Mycoplasma pneumonia",
  "Obstructive sleep apnea",
  "Pleural effusion",
  "Pneumoconiosis",
  "Pneumocystis pneumonia (PCP)",
  "Pneumothorax",
  "Pulmonary embolism (PE)",
  "Pulmonary edema",
  "Pulmonary hypertension",
  "Respiratory acidosis",
  "Respiratory alkalosis",
  "Sarcoidosis",
  "Silicosis",
  "Tuberculosis",
  "Ventilator-associated pneumonia",
  "Whooping cough (Pertussis)",
];

// ---------------------------------------------------------------------------
// GI / Hepatology
// ---------------------------------------------------------------------------
const gi = [
  "Achalasia",
  "Acute cholangitis",
  "Acute pancreatitis",
  "Acute viral hepatitis",
  "Alcoholic hepatitis",
  "Alcoholic liver disease",
  "Appendicitis",
  "Barrett esophagus",
  "Biliary atresia",
  "Boerhaave syndrome",
  "Celiac disease",
  "Cholangiocarcinoma",
  "Choledocholithiasis",
  "Cholecystitis",
  "Cholelithiasis",
  "Chronic pancreatitis",
  "Cirrhosis",
  "Clostridioides difficile infection",
  "Colorectal cancer",
  "Crohn disease",
  "Diverticulitis",
  "Diverticulosis",
  "Duodenal ulcer",
  "Esophageal cancer",
  "Esophageal varices",
  "Failure to thrive",
  "Gastric cancer",
  "Gastric ulcer",
  "Gastritis",
  "Gastroesophageal reflux disease (GERD)",
  "Gilbert syndrome",
  "Hemochromatosis",
  "Hepatic encephalopathy",
  "Hepatitis A",
  "Hepatitis B",
  "Hepatitis C",
  "Hepatitis D",
  "Hepatitis E",
  "Hepatocellular carcinoma",
  "Hiatal hernia",
  "Hirschsprung disease",
  "Inflammatory bowel disease (IBD)",
  "Intussusception",
  "Irritable bowel syndrome (IBS)",
  "Ischemic colitis",
  "Mallory-Weiss tear",
  "Meckel diverticulum",
  "Mesenteric ischemia",
  "Nonalcoholic fatty liver disease (NAFLD)",
  "Nonalcoholic steatohepatitis (NASH)",
  "Pancreatic cancer",
  "Peptic ulcer disease (PUD)",
  "Primary biliary cholangitis",
  "Primary sclerosing cholangitis",
  "Short bowel syndrome",
  "Small intestinal bacterial overgrowth (SIBO)",
  "Spontaneous bacterial peritonitis",
  "Ulcerative colitis",
  "Volvulus",
  "Whipple disease",
  "Wilson disease",
  "Zollinger-Ellison syndrome",
];

// ---------------------------------------------------------------------------
// Neurology
// ---------------------------------------------------------------------------
const neurology = [
  "Alzheimer disease",
  "Amyotrophic lateral sclerosis (ALS)",
  "Anterior spinal artery syndrome",
  "Arteriovenous malformation (AVM)",
  "Bell palsy",
  "Brain abscess",
  "Brain metastasis",
  "Brown-Sequard syndrome",
  "Central pontine myelinolysis",
  "Cerebral palsy",
  "Cerebral venous thrombosis",
  "Cluster headache",
  "Creutzfeldt-Jakob disease",
  "Dementia with Lewy bodies",
  "Diabetic neuropathy",
  "Epidural hematoma",
  "Epilepsy",
  "Essential tremor",
  "Frontotemporal dementia",
  "Guillain-Barré syndrome",
  "Huntington disease",
  "Hydrocephalus",
  "Idiopathic intracranial hypertension",
  "Intracerebral hemorrhage",
  "Ischemic stroke",
  "Lambert-Eaton myasthenic syndrome",
  "Meningitis",
  "Migraine",
  "Multiple sclerosis",
  "Myasthenia gravis",
  "Normal pressure hydrocephalus",
  "Parkinson disease",
  "Peripheral neuropathy",
  "Pseudotumor cerebri",
  "Restless legs syndrome",
  "Seizure disorder",
  "Spinal cord compression",
  "Spinal epidural abscess",
  "Status epilepticus",
  "Subarachnoid hemorrhage",
  "Subdural hematoma",
  "Tension headache",
  "Transient ischemic attack (TIA)",
  "Trigeminal neuralgia",
  "Vertigo",
  "Vestibular neuritis",
];

// ---------------------------------------------------------------------------
// Infectious disease (expanded programmatically below too)
// ---------------------------------------------------------------------------
const infectious = [
  "AIDS (HIV infection)",
  "Actinomycosis",
  "Aspergillosis",
  "Babesiosis",
  "Bacterial meningitis",
  "Bacterial vaginosis",
  "Botulism",
  "Brucellosis",
  "Candidiasis",
  "Cat scratch disease",
  "Cellulitis",
  "Chancroid",
  "Chickenpox (Varicella)",
  "Chlamydia infection",
  "Cholera",
  "Clostridium perfringens infection",
  "Cryptococcosis",
  "Cryptosporidiosis",
  "Cytomegalovirus (CMV) infection",
  "Dengue fever",
  "Diphtheria",
  "Ebola virus disease",
  "Ehrlichiosis",
  "Encephalitis",
  "Endocarditis due to Staphylococcus aureus",
  "Epstein-Barr virus (EBV) infection",
  "Erysipelas",
  "Gas gangrene",
  "Giardiasis",
  "Gonorrhea",
  "Group A streptococcal pharyngitis",
  "Hand-foot-and-mouth disease",
  "Helicobacter pylori infection",
  "Herpes simplex virus infection",
  "Herpes zoster (Shingles)",
  "Histoplasmosis",
  "Human papillomavirus (HPV) infection",
  "Impetigo",
  "Infectious mononucleosis",
  "Influenza",
  "Legionnaires disease",
  "Leishmaniasis",
  "Leprosy (Hansen disease)",
  "Lyme disease",
  "Malaria",
  "Measles",
  "Meningococcal meningitis",
  "Mumps",
  "Necrotizing fasciitis",
  "Norovirus gastroenteritis",
  "Osteomyelitis",
  "Otitis media",
  "Pelvic inflammatory disease",
  "Plague",
  "Pneumococcal pneumonia",
  "Poliomyelitis",
  "Primary syphilis",
  "Rabies",
  "Rocky Mountain spotted fever",
  "Roseola",
  "Rotavirus infection",
  "Rubella",
  "Salmonellosis",
  "Scarlet fever",
  "Sepsis",
  "Septic arthritis",
  "Shigellosis",
  "Smallpox",
  "Staphylococcal scalded skin syndrome",
  "Staphylococcus aureus bacteremia",
  "Tetanus",
  "Toxic shock syndrome",
  "Toxoplasmosis",
  "Trichinosis",
  "Trichomoniasis",
  "Tuberculosis",
  "Tularemia",
  "Typhoid fever",
  "Urinary tract infection (UTI)",
  "Viral hepatitis",
  "Viral meningitis",
  "West Nile virus infection",
  "Yellow fever",
  "Zika virus infection",
];

// ---------------------------------------------------------------------------
// Heme / Onc
// ---------------------------------------------------------------------------
const hemeOnc = [
  "Acute lymphoblastic leukemia (ALL)",
  "Acute myeloid leukemia (AML)",
  "Acute promyelocytic leukemia (APL)",
  "Anemia of chronic disease",
  "Aplastic anemia",
  "Autoimmune hemolytic anemia",
  "Beta-thalassemia",
  "Burkitt lymphoma",
  "Chronic lymphocytic leukemia (CLL)",
  "Chronic myeloid leukemia (CML)",
  "Disseminated intravascular coagulation (DIC)",
  "Essential thrombocythemia",
  "Factor V Leiden thrombophilia",
  "Folate deficiency anemia",
  "G6PD deficiency",
  "Hairy cell leukemia",
  "Hemolytic uremic syndrome (HUS)",
  "Hemophilia A",
  "Hemophilia B",
  "Hodgkin lymphoma",
  "Idiopathic thrombocytopenic purpura (ITP)",
  "Iron deficiency anemia",
  "Megaloblastic anemia",
  "Multiple myeloma",
  "Non-Hodgkin lymphoma",
  "Paroxysmal nocturnal hemoglobinuria (PNH)",
  "Polycythemia vera",
  "Sickle cell disease",
  "Sideroblastic anemia",
  "Thrombotic thrombocytopenic purpura (TTP)",
  "Thalassemia",
  "Tumor lysis syndrome",
  "Vitamin B12 deficiency anemia",
  "von Willebrand disease",
  "Waldenstrom macroglobulinemia",
];

// ---------------------------------------------------------------------------
// Renal / Electrolytes
// ---------------------------------------------------------------------------
const renal = [
  "Acute interstitial nephritis",
  "Acute kidney injury (AKI)",
  "Acute tubular necrosis",
  "Alport syndrome",
  "Autosomal dominant polycystic kidney disease",
  "Berger disease (IgA nephropathy)",
  "Chronic kidney disease (CKD)",
  "Diabetic nephropathy",
  "Fanconi syndrome",
  "Focal segmental glomerulosclerosis",
  "Goodpasture syndrome",
  "Hyperkalemia",
  "Hypernatremia",
  "Hypokalemia",
  "Hyponatremia",
  "Membranous nephropathy",
  "Minimal change disease",
  "Nephritic syndrome",
  "Nephrolithiasis",
  "Nephrotic syndrome",
  "Poststreptococcal glomerulonephritis",
  "Pyelonephritis",
  "Renal artery stenosis",
  "Renal cell carcinoma",
  "Renal tubular acidosis",
  "Rhabdomyolysis",
  "Syndrome of inappropriate ADH (SIADH)",
  "Uremia",
  "Ureteral obstruction",
];

// ---------------------------------------------------------------------------
// Endocrine
// ---------------------------------------------------------------------------
const endocrine = [
  "Acromegaly",
  "Addison disease",
  "Carcinoid syndrome",
  "Conn syndrome (Primary hyperaldosteronism)",
  "Cushing syndrome",
  "Diabetes insipidus",
  "Diabetes mellitus type 1",
  "Diabetes mellitus type 2",
  "Diabetic ketoacidosis (DKA)",
  "Fasting hypoglycemia",
  "Graves disease",
  "Hashimoto thyroiditis",
  "Hypercalcemia",
  "Hyperparathyroidism",
  "Hyperthyroidism",
  "Hypocalcemia",
  "Hypoparathyroidism",
  "Hypopituitarism",
  "Hypothyroidism",
  "Insulinoma",
  "Klinefelter syndrome",
  "Multiple endocrine neoplasia type 1 (MEN 1)",
  "Multiple endocrine neoplasia type 2A (MEN 2A)",
  "Pheochromocytoma",
  "Primary hyperaldosteronism",
  "Sheehan syndrome",
  "Thyroid cancer",
  "Thyroid storm",
  "Toxic multinodular goiter",
  "Turner syndrome",
];

// ---------------------------------------------------------------------------
// Rheumatology / Immunology
// ---------------------------------------------------------------------------
const rheum = [
  "Ankylosing spondylitis",
  "Antiphospholipid syndrome",
  "Behçet disease",
  "Dermatomyositis",
  "Fibromyalgia",
  "Giant cell arteritis",
  "Gout",
  "Granulomatosis with polyangiitis",
  "Henoch-Schönlein purpura",
  "Juvenile idiopathic arthritis",
  "Mixed connective tissue disease",
  "Osteoarthritis",
  "Polymyalgia rheumatica",
  "Polymyositis",
  "Psoriatic arthritis",
  "Reactive arthritis",
  "Rheumatoid arthritis",
  "Scleroderma (Systemic sclerosis)",
  "Sjögren syndrome",
  "Systemic lupus erythematosus (SLE)",
  "Temporal arteritis",
  "Wegener granulomatosis",
];

// ---------------------------------------------------------------------------
// Dermatology
// ---------------------------------------------------------------------------
const derm = [
  "Acne vulgaris",
  "Actinic keratosis",
  "Alopecia areata",
  "Atopic dermatitis",
  "Basal cell carcinoma",
  "Bullous pemphigoid",
  "Contact dermatitis",
  "Dermatitis herpetiformis",
  "Eczema",
  "Erythema multiforme",
  "Erythema nodosum",
  "Hidradenitis suppurativa",
  "Impetigo",
  "Kaposi sarcoma",
  "Lichen planus",
  "Melanoma",
  "Molluscum contagiosum",
  "Pemphigus vulgaris",
  "Pityriasis rosea",
  "Psoriasis",
  "Rosacea",
  "Scabies",
  "Seborrheic dermatitis",
  "Squamous cell carcinoma of the skin",
  "Stevens-Johnson syndrome",
  "Tinea capitis",
  "Tinea corporis",
  "Tinea pedis",
  "Toxic epidermal necrolysis",
  "Urticaria",
  "Varicella-zoster infection",
  "Vitiligo",
];

// ---------------------------------------------------------------------------
// OB/GYN / Reproductive
// ---------------------------------------------------------------------------
const obgyn = [
  "Abruptio placentae",
  "Amenorrhea",
  "Bartholin cyst",
  "Cervical cancer",
  "Choriocarcinoma",
  "Ectopic pregnancy",
  "Endometrial cancer",
  "Endometriosis",
  "Gestational diabetes",
  "Gestational hypertension",
  "HELLP syndrome",
  "Hydatidiform mole",
  "Hyperemesis gravidarum",
  "Ovarian cancer",
  "Ovarian cyst",
  "Pelvic inflammatory disease",
  "Placenta previa",
  "Polycystic ovary syndrome (PCOS)",
  "Preeclampsia",
  "Premature ovarian failure",
  "Preterm labor",
  "Prolactinoma",
  "Uterine fibroids",
  "Vaginal candidiasis",
];

// ---------------------------------------------------------------------------
// Pediatrics
// ---------------------------------------------------------------------------
const peds = [
  "Bronchiolitis",
  "Croup",
  "Failure to thrive",
  "Febrile seizure",
  "Hirschsprung disease",
  "Kawasaki disease",
  "Necrotizing enterocolitis",
  "Neonatal jaundice",
  "Neonatal sepsis",
  "Pyloric stenosis",
  "Respiratory distress syndrome of the newborn",
  "Sudden infant death syndrome (SIDS)",
  "Tetralogy of Fallot",
  "Transient tachypnea of the newborn",
  "Urinary tract infection in children",
];

// ---------------------------------------------------------------------------
// Toxicology / Pharmacology-related
// ---------------------------------------------------------------------------
const tox = [
  "Acetaminophen toxicity",
  "Acute opioid toxicity",
  "Alcohol withdrawal",
  "Anticholinergic toxicity",
  "Arsenic poisoning",
  "Aspirin toxicity",
  "Benzodiazepine overdose",
  "Carbon monoxide poisoning",
  "Cocaine toxicity",
  "Cyanide poisoning",
  "Digoxin toxicity",
  "Ethylene glycol poisoning",
  "Heparin-induced thrombocytopenia",
  "Iron poisoning",
  "Isoniazid toxicity",
  "Lead poisoning",
  "Lithium toxicity",
  "Malignant hyperthermia",
  "Methanol poisoning",
  "Neuroleptic malignant syndrome",
  "Organophosphate poisoning",
  "Salicylate toxicity",
  "Serotonin syndrome",
  "Tricyclic antidepressant overdose",
  "Warfarin toxicity",
];

// ---------------------------------------------------------------------------
// Genetic / Congenital
// ---------------------------------------------------------------------------
const genetic = [
  "22q11 deletion syndrome (DiGeorge syndrome)",
  "Achondroplasia",
  "Adrenoleukodystrophy",
  "Angelman syndrome",
  "Beckwith-Wiedemann syndrome",
  "Charcot-Marie-Tooth disease",
  "Cri du chat syndrome",
  "Cystic fibrosis",
  "Down syndrome (Trisomy 21)",
  "Duchenne muscular dystrophy",
  "Edwards syndrome (Trisomy 18)",
  "Ehlers-Danlos syndrome",
  "Fabry disease",
  "Familial hypercholesterolemia",
  "Fragile X syndrome",
  "Friedreich ataxia",
  "Gaucher disease",
  "Hemophilia A",
  "Huntington disease",
  "Klinefelter syndrome",
  "Lynch syndrome",
  "Marfan syndrome",
  "Neurofibromatosis type 1",
  "Neurofibromatosis type 2",
  "Noonan syndrome",
  "Patau syndrome (Trisomy 13)",
  "Phenylketonuria (PKU)",
  "Prader-Willi syndrome",
  "Rett syndrome",
  "Sickle cell disease",
  "Spinal muscular atrophy",
  "Tay-Sachs disease",
  "Turner syndrome",
  "Williams syndrome",
  "Wilson disease",
];

// ---------------------------------------------------------------------------
// Programmatic expansion — infections, cancers, syndromes
// ---------------------------------------------------------------------------
const bacteria = [
  "Staphylococcus aureus",
  "Streptococcus pyogenes",
  "Streptococcus pneumoniae",
  "Enterococcus faecalis",
  "Escherichia coli",
  "Klebsiella pneumoniae",
  "Pseudomonas aeruginosa",
  "Haemophilus influenzae",
  "Neisseria meningitidis",
  "Neisseria gonorrhoeae",
  "Clostridium difficile",
  "Clostridium tetani",
  "Clostridium botulinum",
  "Mycobacterium tuberculosis",
  "Treponema pallidum",
  "Borrelia burgdorferi",
  "Rickettsia rickettsii",
  "Chlamydia trachomatis",
  "Legionella pneumophila",
  "Salmonella enterica",
  "Shigella dysenteriae",
  "Vibrio cholerae",
  "Campylobacter jejuni",
  "Listeria monocytogenes",
  "Bacteroides fragilis",
  "Bordetella pertussis",
  "Corynebacterium diphtheriae",
  "Helicobacter pylori",
  "Propionibacterium acnes",
  "Group B Streptococcus infection",
];

const viruses = [
  "HIV",
  "HBV",
  "HCV",
  "HDV",
  "HEV",
  "HSV-1",
  "HSV-2",
  "VZV",
  "CMV",
  "EBV",
  "Influenza A",
  "Influenza B",
  "RSV",
  "Adenovirus",
  "Rotavirus",
  "Norovirus",
  "Poliovirus",
  "Rabies virus",
  "Measles virus",
  "Mumps virus",
  "Rubella virus",
  "Dengue virus",
  "Zika virus",
  "Ebola virus",
  "West Nile virus",
  "HPV",
  "JC virus",
  "BK virus",
];

const parasites = [
  "Plasmodium falciparum malaria",
  "Plasmodium vivax malaria",
  "Toxoplasma gondii infection",
  "Giardia lamblia infection",
  "Entamoeba histolytica infection",
  "Cryptosporidium infection",
  "Trichomonas vaginalis infection",
  "Ascariasis",
  "Hookworm infection",
  "Strongyloidiasis",
  "Schistosomiasis",
  "Leishmaniasis",
  "Trypanosomiasis",
  "Echinococcosis",
  "Tapeworm infection",
];

const organs = [
  "lung",
  "liver",
  "kidney",
  "pancreas",
  "colon",
  "rectum",
  "stomach",
  "esophagus",
  "breast",
  "prostate",
  "ovary",
  "cervix",
  "uterus",
  "bladder",
  "brain",
  "thyroid",
  "bone",
  "skin",
  "oral cavity",
  "larynx",
];

const cancerTypes = [
  "Adenocarcinoma",
  "Squamous cell carcinoma",
  "Small cell carcinoma",
  "Large cell carcinoma",
  "Transitional cell carcinoma",
  "Basal cell carcinoma",
  "Melanoma",
  "Lymphoma",
  "Sarcoma",
  "Carcinoma",
];

const generatedCancers = organs.flatMap((organ) =>
  cancerTypes.map((type) => `${type} of the ${organ}`)
);

const infectionPatterns = [
  ...bacteria.flatMap((b) => [
    `${b} bacteremia`,
    `${b} pneumonia`,
    `${b} meningitis`,
    `${b} endocarditis`,
    `${b} skin infection`,
    `${b} urinary tract infection`,
  ]),
  ...viruses.flatMap((v) => [
    `${v} infection`,
    `Acute ${v} infection`,
    `Chronic ${v} infection`,
  ]),
  ...parasites,
];

const syndromePrefixes = [
  "Acute",
  "Chronic",
  "Congenital",
  "Hereditary",
  "Idiopathic",
  "Primary",
  "Secondary",
  "Autoimmune",
  "Drug-induced",
  "Radiation-induced",
];

const syndromeBases = [
  "nephrotic syndrome",
  "nephritic syndrome",
  "hepatic failure",
  "respiratory failure",
  "cardiomyopathy",
  "encephalopathy",
  "neuropathy",
  "myopathy",
  "vasculitis",
  "pericarditis",
  "pneumonitis",
  "colitis",
  "pancreatitis",
  "hepatitis",
  "meningitis",
  "arthritis",
  "anemia",
  "thrombocytopenia",
  "leukopenia",
  "hypercalcemia",
  "hypoglycemia",
];

const generatedSyndromes = syndromePrefixes.flatMap((p) =>
  syndromeBases.map((b) => `${p} ${b}`)
);

const eponyms = [
  "Addison disease",
  "Alport syndrome",
  "Barrett esophagus",
  "Bell palsy",
  "Boerhaave syndrome",
  "Brown-Sequard syndrome",
  "Budd-Chiari syndrome",
  "Burkitt lymphoma",
  "Cushing syndrome",
  "Crohn disease",
  "Conn syndrome",
  "Dressler syndrome",
  "Eisenmenger syndrome",
  "Fabry disease",
  "Goodpasture syndrome",
  "Graves disease",
  "Guillain-Barré syndrome",
  "Hashimoto thyroiditis",
  "Hodgkin lymphoma",
  "Horner syndrome",
  "Kawasaki disease",
  "Klinefelter syndrome",
  "Lambert-Eaton syndrome",
  "Lynch syndrome",
  "Marfan syndrome",
  "Meniere disease",
  "Paget disease of bone",
  "Parkinson disease",
  "Pott disease",
  "Raynaud phenomenon",
  "Reiter syndrome",
  "Sheehan syndrome",
  "Sjögren syndrome",
  "Stevens-Johnson syndrome",
  "Takayasu arteritis",
  "Tay-Sachs disease",
  "Turner syndrome",
  "Wegener granulomatosis",
  "Wilson disease",
  "Wolff-Parkinson-White syndrome",
  "Zollinger-Ellison syndrome",
];

const ophthalmology = [
  "Acute angle-closure glaucoma",
  "Age-related macular degeneration",
  "Cataract",
  "Central retinal artery occlusion",
  "Central retinal vein occlusion",
  "Conjunctivitis",
  "Corneal abrasion",
  "Diabetic retinopathy",
  "Endophthalmitis",
  "Glaucoma",
  "Hordeolum (Stye)",
  "Hypertensive retinopathy",
  "Iritis",
  "Keratitis",
  "Optic neuritis",
  "Papilledema",
  "Presbyopia",
  "Retinal detachment",
  "Uveitis",
];

const ent = [
  "Acute otitis media",
  "Chronic otitis media",
  "Labyrinthitis",
  "Laryngeal cancer",
  "Mastoiditis",
  "Nasal polyps",
  "Otitis externa",
  "Peritonsillar abscess",
  "Pharyngitis",
  "Sinusitis",
  "Tonsillitis",
  "Vestibular schwannoma",
];

const vascular = [
  "Atherosclerosis",
  "Deep vein thrombosis (DVT)",
  "Peripheral artery disease",
  "Raynaud disease",
  "Subclavian steal syndrome",
  "Thoracic outlet syndrome",
  "Varicose veins",
  "Vasculitis",
];

const electrolytes = [
  "Hypermagnesemia",
  "Hypomagnesemia",
  "Hyperphosphatemia",
  "Hypophosphatemia",
  "Metabolic acidosis",
  "Metabolic alkalosis",
  "Respiratory acidosis",
  "Respiratory alkalosis",
  "High anion gap metabolic acidosis",
  "Normal anion gap metabolic acidosis",
  "Lactic acidosis",
  "Diabetic ketoacidosis",
  "Hyperosmolar hyperglycemic state",
];

const autoimmuneExpanded = rheum.flatMap((d) => [
  d,
  `Early ${d}`,
  `Late-stage ${d}`,
]);

const vitaminDef = [
  "Vitamin A deficiency",
  "Vitamin B1 (Thiamine) deficiency",
  "Vitamin B2 (Riboflavin) deficiency",
  "Vitamin B3 (Niacin) deficiency",
  "Vitamin B6 deficiency",
  "Vitamin B12 deficiency",
  "Vitamin C deficiency (Scurvy)",
  "Vitamin D deficiency (Rickets)",
  "Vitamin E deficiency",
  "Vitamin K deficiency",
  "Folate deficiency",
  "Biotin deficiency",
];

// Additional high-yield Step 1 one-liners
const miscHighYield = [
  "Acute compartment syndrome",
  "Acute limb ischemia",
  "Anaphylaxis",
  "Aortic aneurysm",
  "Aortic rupture",
  "Atrial myxoma",
  "Benign prostatic hyperplasia (BPH)",
  "Burn injury",
  "Cardiac contusion",
  "Compartment syndrome",
  "Dehydration",
  "Delirium",
  "Diverticular bleeding",
  "Eclampsia",
  "Fat embolism syndrome",
  "Fatigue",
  "Femoral hernia",
  "Frostbite",
  "Heat stroke",
  "Herniated disc",
  "Hip fracture",
  "Hyperlipidemia",
  "Hypertension",
  "Hypertensive emergency",
  "Hypovolemic shock",
  "Incarcerated hernia",
  "Ingrown toenail",
  "Kaposi sarcoma",
  "Lactic acidosis",
  "Malnutrition",
  "Mitral annular calcification",
  "Obesity",
  "Osteomyelitis",
  "Osteoporosis",
  "Osteoarthritis",
  "Paget disease of bone",
  "Pancreatic pseudocyst",
  "Peptic ulcer perforation",
  "Pneumomediastinum",
  "Pulmonary contusion",
  "Rhabdomyolysis",
  "Sepsis",
  "Septic shock",
  "Spinal stenosis",
  "Stress fracture",
  "Substance withdrawal",
  "Superior vena cava syndrome",
  "Tension pneumothorax",
  "Testicular torsion",
  "Thoracic aortic aneurysm",
  "Thyrotoxicosis",
  "Toxic megacolon",
  "Transfusion reaction",
  "Traumatic brain injury",
  "Unstable angina",
  "Urinary retention",
  "Venous insufficiency",
];

// Psychiatric specifiers and related (expand search for "anx", "panic", etc.)
const psychExpanded = [
  ...psychiatry,
  "Generalized anxiety disorder",
  "Panic disorder",
  "Social anxiety disorder",
  "Agoraphobia with panic disorder",
  "Mixed anxiety and depressive disorder",
  "Unspecified depressive disorder",
  "Major depression with psychotic features",
  "Bipolar disorder with rapid cycling",
  "Schizoaffective disorder bipolar type",
  "Schizoaffective disorder depressive type",
  "Substance-induced psychotic disorder",
  "Alcohol withdrawal delirium (Delirium tremens)",
  "Wernicke encephalopathy",
  "Korsakoff syndrome",
];

// Pharmacology — drug toxicities / adverse effects (Step 1 high-yield)
const drugs = [
  "Acetaminophen", "Aspirin", "Ibuprofen", "Indomethacin", "Phenytoin", "Carbamazepine",
  "Valproic acid", "Lithium", "Digoxin", "Amiodarone", "Procainamide", "Quinidine",
  "Metoclopramide", "Haloperidol", "Chlorpromazine", "Clozapine", "Risperidone",
  "Fluphenazine", "L-Dopa", "Levodopa", "Isoniazid", "Ethambutol", "Pyrazinamide",
  "Rifampin", "Streptomycin", "Gentamicin", "Vancomycin", "Amphotericin B",
  "Cisplatin", "Cyclophosphamide", "Methotrexate", "5-Fluorouracil", "Doxorubicin",
  "Bleomycin", "Vincristine", "Tamoxifen", "Heparin", "Warfarin", "Clopidogrel",
  "Tetracycline", "Chloramphenicol", "Sulfonamides", "Penicillin", "Cephalosporins",
  "Fluoroquinolones", "Metronidazole", "Azithromycin", "Clarithromycin",
  "ACE inhibitors", "ARBs", "Beta blockers", "Calcium channel blockers",
  "Thiazide diuretics", "Loop diuretics", "Spironolactone", "Statins", "Fibrates",
  "Niacin", "Insulin", "Sulfonylureas", "Metformin", "Glucocorticoids",
  "Prednisone", "Dexamethasone", "Cyclosporine", "Tacrolimus", "Azathioprine",
  "Mycophenolate", "Infliximab", "Adalimumab", "Etanercept", "Omalizumab",
  "Oxytocin", "Ergot alkaloids", "Terbutaline", "Albuterol", "Theophylline",
  "Codeine", "Morphine", "Fentanyl", "Methadone", "Buprenorphine", "Naloxone",
  "Benzodiazepines", "Barbiturates", "Ethanol", "Methanol", "Ethylene glycol",
  "Cocaine", "Amphetamines", "MDMA", "Phencyclidine", "Marijuana", "Synthetic cannabinoids",
  "Organophosphates", "Lead", "Mercury", "Arsenic", "Iron", "Copper",
];

const pharmacology = drugs.flatMap((d) => [
  `${d} toxicity`,
  `${d} overdose`,
  `${d}-induced hepatitis`,
  `${d}-induced nephrotoxicity`,
  `${d}-induced thrombocytopenia`,
  `${d} adverse reaction`,
]);

// Anatomic sites + common pathology patterns
const sites = [
  "cervical spine", "thoracic spine", "lumbar spine", "shoulder", "elbow", "wrist",
  "hip", "knee", "ankle", "mandible", "maxilla", "femur", "tibia", "humerus",
  "clavicle", "pelvis", "rib", "skull", "facial bone",
];

const pathPatterns = [
  "fracture", "dislocation", "sprain", "strain", "contusion", "abscess",
  "cellulitis", "osteomyelitis", "bursitis", "tendinitis", "gangrene",
];

const musculoskeletal = sites.flatMap((site) =>
  pathPatterns.map((p) => `${site} ${p}`)
);

// Autoimmune + organ combinations
const organsImmune = [
  "skin", "joints", "kidney", "lung", "liver", "thyroid", "pancreas",
  "nervous system", "muscle", "blood vessels", "heart", "GI tract",
];
const immunePatterns = ["Autoimmune", "Immune-mediated", "IgA-mediated", "IgG-mediated", "Complement-mediated"];
const immuneGenerated = immunePatterns.flatMap((p) =>
  organsImmune.map((o) => `${p} ${o} disease`)
);

// Neoplasm grading / states
const neoplasmStates = [
  "Carcinoma in situ", "Dysplasia", "Hyperplasia", "Metaplasia", "Neoplasia",
  "Benign tumor", "Malignant tumor", "Metastatic disease", "Paraneoplastic syndrome",
  "Cachexia", "Superior vena cava obstruction", "Malignant effusion",
];

const moreCancers = [
  "Glioblastoma", "Astrocytoma", "Oligodendroglioma", "Medulloblastoma",
  "Ependymoma", "Meningioma", "Schwannoma", "Pituitary adenoma",
  "Craniopharyngioma", "Neuroblastoma", "Nephroblastoma (Wilms tumor)",
  "Hepatoblastoma", "Retinoblastoma", "Ewing sarcoma", "Osteosarcoma",
  "Chondrosarcoma", "Rhabdomyosarcoma", "Leiomyosarcoma", "Angiosarcoma",
  "Kaposi sarcoma", "Mesothelioma", "Choriocarcinoma", "Seminoma",
  "Embryonal carcinoma", "Teratoma", "Yolk sac tumor", "Cholangiocarcinoma",
  "Hepatocellular adenoma", "Insulinoma", "Gastrinoma", "Glucagonoma",
  "VIPoma", "Carcinoid tumor", "Pheochromocytoma", "Neuroblastoma",
];

// Extract diagnoses from existing case files (seed only; autocomplete is independent of validation)
function extractCaseDiagnoses() {
  const dirs = [
    path.join(__dirname, "..", "public", "doctordle cases"),
    path.join(__dirname, "..", "public", "psychodle cases"),
    path.join(__dirname, "..", "public", "dentdle cases"),
    path.join(__dirname, "..", "public", "vettle cases"),
    path.join(__dirname, "..", "public", "crimindle cases"),
  ];
  const found = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".txt")) continue;
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      const matches = text.matchAll(/DIAGNOSIS:\s*\n([^\n]+)/g);
      for (const m of matches) found.push(m[1].trim());
    }
  }
  return found;
}

// Additional infectious / microbiology diagnoses
const fungi = [
  "Candida albicans", "Cryptococcus neoformans", "Aspergillus fumigatus",
  "Histoplasma capsulatum", "Blastomyces dermatitidis", "Coccidioides immitis",
  "Pneumocystis jirovecii", "Sporothrix schenckii", "Mucor", "Rhizopus",
];
const fungalDx = fungi.flatMap((f) => [
  `${f} infection`, `Disseminated ${f} infection`, `Pulmonary ${f} infection`,
]);

const protozoa = [
  "Entamoeba histolytica", "Giardia lamblia", "Cryptosporidium parvum",
  "Toxoplasma gondii", "Plasmodium falciparum", "Plasmodium vivax",
  "Trypanosoma cruzi", "Trypanosoma brucei", "Leishmania donovani",
  "Trichomonas vaginalis", "Balantidium coli",
];
const protozoaDx = protozoa.map((p) => `${p} infection`);

// Cardiac / vascular procedures complications as diagnoses
const complications = [
  "Postoperative infection", "Postoperative bleeding", "Anastomotic leak",
  "Wound dehiscence", "Hospital-acquired pneumonia", "Catheter-associated UTI",
  "Central line-associated bloodstream infection", "Ventilator-associated pneumonia",
  "Pressure ulcer", "Deep vein thrombosis prophylaxis failure",
  "Graft rejection", "Hyperacute transplant rejection",
  "Acute cellular transplant rejection", "Chronic transplant rejection",
];

// More psychiatry DSM specifiers
const psychMore = [
  "Agoraphobia without panic disorder", "Specific phobia animal type",
  "Specific phobia situational type", "Other specified depressive disorder",
  "Other specified bipolar disorder", "Other specified schizophrenia spectrum disorder",
  "Substance-induced bipolar disorder", "Substance-induced psychotic disorder",
  "Medication-induced movement disorder", "Tardive dyskinesia",
  "Neuroleptic-induced parkinsonism", "Acute dystonia", "Akathisia",
  "Gambling disorder", "Internet gaming disorder", "Intermittent explosive disorder",
  "Oppositional defiant disorder", "Conduct disorder", "Intellectual disability",
  "Global developmental delay", "Language disorder", "Speech sound disorder",
  "Childhood-onset fluency disorder", "Social communication disorder",
  "Rumination disorder", "Pica", "Gender dysphoria", "Other specified feeding disorder",
];

// Large organ-system condition matrix for search breadth
const prefixes2 = [
  "Acute", "Subacute", "Chronic", "Recurrent", "Fulminant", "Mild", "Severe",
  "Early-onset", "Late-onset", "Familial", "Sporadic", "Bilateral", "Unilateral",
];
const conditions2 = [
  "hepatitis", "nephritis", "pneumonitis", "myocarditis", "pericarditis",
  "endocarditis", "meningitis", "encephalitis", "pancreatitis", "cholecystitis",
  "appendicitis", "colitis", "gastritis", "esophagitis", "sinusitis",
  "otitis", "pharyngitis", "bronchitis", "cellulitis", "osteomyelitis",
  "arthritis", "bursitis", "tenosynovitis", "vasculitis", "nephropathy",
  "neuropathy", "myopathy", "cardiomyopathy", "encephalopathy", "retinopathy",
  "nephrolithiasis", "cholelithiasis", "anemia", "leukopenia", "thrombocytopenia",
  "coagulopathy", "sepsis", "abscess", "effusion", "embolism", "infarction",
  "hemorrhage", "ischemia", "stenosis", "regurgitation", "prolapse", "hernia",
  "obstruction", "perforation", "fistula", "stricture", "atrophy", "hypertrophy",
  "dystrophy", "degeneration", "fibrosis", "cirrhosis", "sclerosis", "edema",
];
const matrixDx = prefixes2.flatMap((p) => conditions2.map((c) => `${p} ${c}`));

// Hematologic malignancies and variants
const hemeMore = [
  "Myelodysplastic syndrome", "Myeloproliferative neoplasm", "Chronic eosinophilic leukemia",
  "Hairy cell leukemia variant", "Plasma cell leukemia", "Mantle cell lymphoma",
  "Follicular lymphoma", "Diffuse large B-cell lymphoma", "Marginal zone lymphoma",
  "MALT lymphoma", "Primary CNS lymphoma", "Cutaneous T-cell lymphoma",
  "Adult T-cell leukemia/lymphoma", "Sezary syndrome", "Mycosis fungoides",
  "Chronic neutrophilic leukemia", "Juvenile myelomonocytic leukemia",
  "Blastic plasmacytoid dendritic cell neoplasm", "Langerhans cell histiocytosis",
];

const all = uniqSorted([
  ...psychExpanded,
  ...psychMore,
  ...cardiology,
  ...pulmonary,
  ...gi,
  ...neurology,
  ...infectious,
  ...hemeOnc,
  ...renal,
  ...endocrine,
  ...rheum,
  ...derm,
  ...obgyn,
  ...peds,
  ...tox,
  ...genetic,
  ...generatedCancers,
  ...infectionPatterns,
  ...generatedSyndromes,
  ...eponyms,
  ...ophthalmology,
  ...ent,
  ...vascular,
  ...electrolytes,
  ...autoimmuneExpanded,
  ...vitaminDef,
  ...miscHighYield,
  ...pharmacology,
  ...musculoskeletal,
  ...immuneGenerated,
  ...neoplasmStates,
  ...moreCancers,
  ...extractCaseDiagnoses(),
  ...fungalDx,
  ...protozoaDx,
  ...complications,
  ...matrixDx,
  ...hemeMore,
]);

const header = `# Medicle master diagnosis list — autocomplete only (not used for answer validation)
# One diagnosis per line. Lines starting with # are ignored.
# Generated by scripts/generate-diagnosis-master-list.mjs
# Total entries: ${all.length}
`;

fs.writeFileSync(OUT, header + all.join("\n") + "\n", "utf8");
console.log(`Wrote ${all.length} diagnoses to ${OUT}`);
