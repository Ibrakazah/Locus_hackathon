export interface Persona {
  id: string;
  name: string;
  description: string;
  profile: {
    route: "kz";
    grade: "9" | "10" | "11" | "graduate";
    fields: string[];
    funding: "grant_only" | "grant_or_contract" | "contract_ok";
    exams: Record<string, { status: string; score?: number }>;
    language: "ru";
    interestedInNu: boolean;
    gpa?: number;
  };
}

export const PERSONAS: Persona[] = [
  {
    id: "persona-medicine",
    name: "Айша, 11 класс",
    description: "Медицина, ЕНТ 96, только грант",
    profile: {
      route: "kz",
      grade: "11",
      fields: ["medicine"],
      funding: "grant_only",
      exams: {
        ent: { status: "taken", score: 96 },
      },
      language: "ru",
      interestedInNu: false,
    },
  },
  {
    id: "persona-robotics",
    name: "Диас, 11 класс",
    description: "IT, IELTS 6.5, GPA 4.7, интересует NU",
    profile: {
      route: "kz",
      grade: "11",
      fields: ["it"],
      funding: "grant_or_contract",
      exams: {
        ielts: { status: "taken", score: 6.5 },
      },
      language: "ru",
      interestedInNu: true,
      gpa: 4.7,
    },
  },
  {
    id: "persona-leadership",
    name: "Сания, 10 класс",
    description: "Медицина, ЕНТ не сдавала, село",
    profile: {
      route: "kz",
      grade: "10",
      fields: ["medicine"],
      funding: "grant_only",
      exams: {},
      language: "ru",
      interestedInNu: false,
    },
  },
];
