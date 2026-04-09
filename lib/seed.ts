/**
 * MATILHA OS — Seed Data
 * Pre-populates the DB with real data from the Matilha Equilibrada school.
 * Runs once on first load if DB is empty.
 */

import { DogDB, TutorDB, GroupDB, KEYS } from "@/lib/db";

function isSeeded(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("matilha:seeded") === "1";
}

function markSeeded() {
  localStorage.setItem("matilha:seeded", "1");
}

export function seedIfEmpty() {
  if (isSeeded()) return;
  if (TutorDB.count() > 0 || DogDB.count() > 0) { markSeeded(); return; }

  // ─── Tutors ──────────────────────────────────────────────────────────────────

  const tutorData = [
    { name:"Dinora Cattoni Beyer",              email:"dinora@email.com",    phone:"(51)99001-0001", status:"ativo" as const, source:"Indicação" },
    { name:"Guilherme Luiz Schumacher Rudnick", email:"guilherme@email.com", phone:"(51)99001-0002", status:"ativo" as const, source:"Instagram" },
    { name:"Catharina Luz",                     email:"catharina@email.com", phone:"(51)99001-0003", status:"ativo" as const, source:"Google"    },
    { name:"Márcia Maria da Rosa",              email:"marcia@email.com",    phone:"(51)99001-0004", status:"ativo" as const, source:"Indicação" },
    { name:"Claudine Zattar",                   email:"claudine@email.com",  phone:"(51)99001-0005", status:"ativo" as const, source:"Instagram" },
    { name:"Natasha Zemczak",                   email:"natasha@email.com",   phone:"(51)99001-0006", status:"ativo" as const, source:"Google"    },
    { name:"Juliana Mees",                      email:"juliana@email.com",   phone:"(51)99001-0007", status:"ativo" as const, source:"Indicação" },
    { name:"Ana Carolline Taborda",             email:"ana.carolline@email.com", phone:"(51)99001-0008", status:"ativo" as const, source:"Site" },
    { name:"Ester Bencke",                      email:"ester@email.com",     phone:"(51)99001-0009", status:"ativo" as const, source:"Indicação" },
    { name:"Aurea Raquel Pirmann",              email:"aurea@email.com",     phone:"(51)99001-0010", status:"ativo" as const, source:"Google"    },
    { name:"Luiz Antonio Balesheri Filho",      email:"luiz.balesheri@email.com", phone:"(51)99001-0011", status:"ativo" as const, source:"Indicação" },
    { name:"Fernanda Santaiana",                email:"fernanda.s@email.com",phone:"(51)99001-0012", status:"ativo" as const, source:"Instagram" },
    { name:"Karolyni Santos",                   email:"karolyni@email.com",  phone:"(51)99001-0013", status:"ativo" as const, source:"Indicação" },
    { name:"Paula Ammy",                        email:"paula.ammy@email.com",phone:"(51)99001-0014", status:"ativo" as const, source:"Google"    },
    { name:"Roberto Alves",                     email:"roberto@email.com",   phone:"(51)99001-0015", status:"ativo" as const, source:"Indicação" },
    { name:"Fernanda Lima",                     email:"fernanda.l@email.com",phone:"(51)99001-0016", status:"ativo" as const, source:"Instagram" },
    { name:"Rodrigo Pereira",                   email:"rodrigo@email.com",   phone:"(51)99001-0017", status:"ativo" as const, source:"Google"    },
    { name:"Cristiane Souza",                   email:"cristiane@email.com", phone:"(51)99001-0018", status:"ativo" as const, source:"Indicação" },
    { name:"Ana Paula Nunes",                   email:"anapaula@email.com",  phone:"(51)99001-0019", status:"ativo" as const, source:"Site"      },
    { name:"Marcelo Yamamoto",                  email:"marcelo@email.com",   phone:"(51)99001-0020", status:"ativo" as const, source:"Instagram" },
    { name:"Silvia Costa",                      email:"silvia@email.com",    phone:"(51)99001-0021", status:"ativo" as const, source:"Indicação" },
    { name:"Lucas Fernandes",                   email:"lucas@email.com",     phone:"(51)99001-0022", status:"ativo" as const, source:"Google"    },
    { name:"Clara Ribeiro",                     email:"clara@email.com",     phone:"(51)99001-0023", status:"ativo" as const, source:"Instagram" },
    { name:"Gustavo Martins",                   email:"gustavo@email.com",   phone:"(51)99001-0024", status:"ativo" as const, source:"Indicação" },
    { name:"Camila Rezende",                    email:"camila@email.com",    phone:"(51)99001-0025", status:"ativo" as const, source:"Google"    },
    { name:"Felipe Santos",                     email:"felipe@email.com",    phone:"(51)99001-0026", status:"ativo" as const, source:"Instagram" },
    { name:"Carolina Melo",                     email:"carolina@email.com",  phone:"(51)99001-0027", status:"ativo" as const, source:"Indicação" },
    { name:"Tamiris Gomes",                     email:"tamiris@email.com",   phone:"(51)99001-0028", status:"ativo" as const, source:"Site"      },
    { name:"Ana Tutor",                         email:"ana@email.com",       phone:"(51)99001-0029", status:"ativo" as const, source:"Indicação" },
    { name:"Carlos Tutor",                      email:"carlos@email.com",    phone:"(51)99001-0030", status:"ativo" as const, source:"Instagram" },
    { name:"Jorge Tutor",                       email:"jorge@email.com",     phone:"(51)99001-0031", status:"ativo" as const, source:"Google"    },
    { name:"Viviani Tutor",                     email:"viviani@email.com",   phone:"(51)99001-0032", status:"ativo" as const, source:"Indicação" },
    { name:"Ricardo Tutor",                     email:"ricardo@email.com",   phone:"(51)99001-0033", status:"ativo" as const, source:"Site"      },
    { name:"Paulo Tutor",                       email:"paulo@email.com",     phone:"(51)99001-0034", status:"ativo" as const, source:"Google"    },
    { name:"Sandra Tutor",                      email:"sandra@email.com",    phone:"(51)99001-0035", status:"ativo" as const, source:"Indicação" },
    { name:"Luiza Tutor",                       email:"luiza@email.com",     phone:"(51)99001-0036", status:"ativo" as const, source:"Instagram" },
    { name:"Maria Tutor",                       email:"maria@email.com",     phone:"(51)99001-0037", status:"ativo" as const, source:"Indicação" },
  ];

  const tutorMap: Record<string, string> = {};
  for (const t of tutorData) {
    const created = TutorDB.create({
      ...t, whatsapp: t.phone, preferredContact: "whatsapp",
      dogs: [], activePlans: [], totalSpent: 0, ltv: 0, notes: "",
    });
    tutorMap[t.name] = created.id;
  }

  // ─── Dogs ─────────────────────────────────────────────────────────────────────

  const dogData: Array<{
    name: string; raca: string; tutor: string; sex: "macho"|"femea";
    size: "mini"|"pequeno"|"medio"|"grande"|"gigante"; peso: number;
    energy: "baixa"|"moderada"|"alta"|"muito_alta";
    social: "reservado"|"seletivo"|"sociavel"|"muito_sociavel";
    vip?: boolean;
  }> = [
    // From PRESENCA (lista de presença)
    { name:"Biju",           raca:"SRD",             tutor:"Ana Tutor",        sex:"femea", size:"pequeno", peso:7,    energy:"moderada",  social:"sociavel"      },
    { name:"CECÍLIA",        raca:"SRD",             tutor:"Ana Tutor",        sex:"femea", size:"medio",   peso:12,   energy:"moderada",  social:"sociavel"      },
    { name:"DAVINA",         raca:"Pastor Alemão",   tutor:"Carlos Tutor",     sex:"femea", size:"grande",  peso:26,   energy:"alta",      social:"seletivo"      },
    { name:"Garrincha",      raca:"SRD",             tutor:"Ana Tutor",        sex:"macho", size:"medio",   peso:14,   energy:"alta",      social:"muito_sociavel" },
    { name:"JORGE CARAMELO", raca:"SRD",             tutor:"Jorge Tutor",      sex:"macho", size:"medio",   peso:11,   energy:"moderada",  social:"sociavel"      },
    { name:"Meg",            raca:"Lhasa Apso",      tutor:"Viviani Tutor",    sex:"femea", size:"pequeno", peso:5,    energy:"baixa",     social:"reservado"     },
    { name:"Millie",         raca:"SRD",             tutor:"Luiza Tutor",      sex:"femea", size:"pequeno", peso:8,    energy:"alta",      social:"muito_sociavel", vip:true },
    { name:"Nina",           raca:"Lhasa Apso",      tutor:"Viviani Tutor",    sex:"femea", size:"mini",    peso:4.5,  energy:"moderada",  social:"seletivo"      },
    { name:"Paçoca Fêmea",   raca:"SRD",             tutor:"Ricardo Tutor",    sex:"femea", size:"medio",   peso:13,   energy:"alta",      social:"sociavel",      vip:true },
    { name:"PRETA MARIA",    raca:"SRD",             tutor:"Maria Tutor",      sex:"femea", size:"medio",   peso:15,   energy:"moderada",  social:"sociavel"      },
    { name:"Rex",            raca:"Labrador",        tutor:"Paulo Tutor",      sex:"macho", size:"grande",  peso:30,   energy:"alta",      social:"muito_sociavel" },
    { name:"Toby",           raca:"Golden Retriever",tutor:"Sandra Tutor",     sex:"macho", size:"grande",  peso:32,   energy:"moderada",  social:"muito_sociavel" },
    // From FAMILIAS
    { name:"Aaron",          raca:"SRD",             tutor:"Dinora Cattoni Beyer", sex:"macho", size:"medio", peso:12, energy:"moderada", social:"sociavel" },
    { name:"Aisha",          raca:"Golden Retriever",tutor:"Guilherme Luiz Schumacher Rudnick", sex:"femea", size:"grande", peso:28, energy:"alta", social:"muito_sociavel", vip:true },
    { name:"Akira",          raca:"Border Collie",   tutor:"Catharina Luz",    sex:"femea", size:"medio",   peso:18,   energy:"muito_alta",social:"seletivo"      },
    { name:"Akira",          raca:"Golden Retriever",tutor:"Márcia Maria da Rosa", sex:"macho", size:"grande", peso:30, energy:"alta", social:"sociavel" },
    { name:"Alaska",         raca:"Shetland Sheepdog",tutor:"Claudine Zattar", sex:"femea", size:"medio",   peso:10,   energy:"alta",      social:"sociavel"      },
    { name:"Alecrim",        raca:"SRD",             tutor:"Natasha Zemczak",  sex:"macho", size:"medio",   peso:11,   energy:"moderada",  social:"sociavel"      },
    { name:"Alfie",          raca:"Dachshund",       tutor:"Juliana Mees",     sex:"macho", size:"pequeno", peso:5,    energy:"alta",      social:"muito_sociavel", vip:true },
    { name:"Alfredo",        raca:"SRD",             tutor:"Ana Carolline Taborda", sex:"macho", size:"medio", peso:13, energy:"moderada", social:"sociavel" },
    { name:"Amélie Poulain", raca:"Dachshund",       tutor:"Ester Bencke",     sex:"femea", size:"pequeno", peso:4.5,  energy:"moderada",  social:"sociavel"      },
    { name:"Amaral",         raca:"Pinscher",        tutor:"Aurea Raquel Pirmann", sex:"macho", size:"pequeno", peso:3, energy:"alta", social:"seletivo" },
    { name:"Ambrósio",       raca:"SRD",             tutor:"Luiz Antonio Balesheri Filho", sex:"macho", size:"medio", peso:14, energy:"alta", social:"muito_sociavel", vip:true },
    { name:"Amelia",         raca:"Chihuahua",       tutor:"Fernanda Santaiana", sex:"femea", size:"mini",  peso:2.5,  energy:"alta",      social:"seletivo"      },
    { name:"Amendoim",       raca:"Shih Tzu",        tutor:"Karolyni Santos",  sex:"macho", size:"pequeno", peso:5,    energy:"moderada",  social:"sociavel"      },
    { name:"Ammy",           raca:"Galgo",           tutor:"Paula Ammy",       sex:"femea", size:"grande",  peso:25,   energy:"alta",      social:"sociavel"      },
    { name:"Apolo",          raca:"Boxer",           tutor:"Roberto Alves",    sex:"macho", size:"grande",  peso:28,   energy:"muito_alta",social:"muito_sociavel" },
    { name:"Ariel",          raca:"Golden Retriever",tutor:"Fernanda Lima",    sex:"femea", size:"grande",  peso:27,   energy:"alta",      social:"muito_sociavel", vip:true },
    { name:"Aska",           raca:"Husky Siberiano", tutor:"Rodrigo Pereira",  sex:"femea", size:"grande",  peso:22,   energy:"muito_alta",social:"sociavel"      },
    { name:"Athos",          raca:"Labrador",        tutor:"Cristiane Souza",  sex:"macho", size:"grande",  peso:33,   energy:"moderada",  social:"muito_sociavel" },
    { name:"Bambi",          raca:"SRD",             tutor:"Ana Paula Nunes",  sex:"femea", size:"pequeno", peso:7,    energy:"moderada",  social:"sociavel"      },
    { name:"Banzai",         raca:"Akita",           tutor:"Marcelo Yamamoto", sex:"macho", size:"grande",  peso:35,   energy:"alta",      social:"seletivo"      },
    { name:"Bartolomeu",     raca:"Beagle",          tutor:"Silvia Costa",     sex:"macho", size:"medio",   peso:13,   energy:"alta",      social:"muito_sociavel" },
    { name:"Batman",         raca:"Bulldog",         tutor:"Lucas Fernandes",  sex:"macho", size:"medio",   peso:22,   energy:"baixa",     social:"sociavel"      },
    { name:"Bem-ti-vi",      raca:"SRD",             tutor:"Clara Ribeiro",    sex:"femea", size:"pequeno", peso:6,    energy:"alta",      social:"muito_sociavel" },
    { name:"Bernardo",       raca:"São Bernardo",    tutor:"Gustavo Martins",  sex:"macho", size:"gigante", peso:60,   energy:"baixa",     social:"muito_sociavel", vip:true },
    { name:"Billie",         raca:"Poodle",          tutor:"Camila Rezende",   sex:"femea", size:"pequeno", peso:4,    energy:"alta",      social:"sociavel"      },
    { name:"Bingo",          raca:"SRD",             tutor:"Felipe Santos",    sex:"macho", size:"medio",   peso:10,   energy:"moderada",  social:"sociavel"      },
    { name:"Bob",            raca:"Golden Retriever",tutor:"Carolina Melo",    sex:"macho", size:"grande",  peso:29,   energy:"alta",      social:"muito_sociavel" },
    { name:"Bobby",          raca:"Spitz Alemão",    tutor:"Tamiris Gomes",    sex:"macho", size:"pequeno", peso:5,    energy:"alta",      social:"muito_sociavel" },
  ];

  for (const d of dogData) {
    const tutorId = tutorMap[d.tutor] ?? "";
    DogDB.create({
      name: d.name, breed: d.raca, sex: d.sex, size: d.size,
      weight: d.peso, neutered: false, birthDate: "",
      tutorId, energyLevel: d.energy, socialLevel: d.social,
      vaccines: [], tags: d.vip ? ["vip"] : [],
      foodBrand: "", foodAmount: "",
    });
  }

  // ─── Daycare Groups ───────────────────────────────────────────────────────────

  const groups = [
    { name:"Segunda-feira", sizeRange:["pequeno","medio","grande"] as const, energyRange:["baixa","moderada","alta"] as const, capacity:60, currentCount:51, color:"bg-blue-100" },
    { name:"Terça-feira",   sizeRange:["pequeno","medio","grande"] as const, energyRange:["baixa","moderada","alta","muito_alta"] as const, capacity:60, currentCount:56, color:"bg-green-100" },
    { name:"Quarta-feira",  sizeRange:["pequeno","medio","grande"] as const, energyRange:["baixa","moderada","alta"] as const, capacity:60, currentCount:50, color:"bg-purple-100" },
    { name:"Quinta-feira",  sizeRange:["pequeno","medio","grande"] as const, energyRange:["baixa","moderada","alta","muito_alta"] as const, capacity:60, currentCount:53, color:"bg-amber-100" },
    { name:"Sexta-feira",   sizeRange:["pequeno","medio","grande"] as const, energyRange:["baixa","moderada","alta"] as const, capacity:60, currentCount:44, color:"bg-rose-100" },
  ];

  for (const g of groups) {
    GroupDB.create(g as never);
  }

  markSeeded();
}
