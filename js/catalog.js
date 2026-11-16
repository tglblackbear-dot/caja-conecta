export const CATEGORIES = [
  "Manutenção e Reformas",
  "Gastronomia e Sabores Locais",
  "Beleza e Estilo",
  "Automotivo",
  "Fretes e Motoboy",
  "Assistência Técnica",
  "Saúde e Bem-Estar",
  "Eventos",
  "Cultura e Educação",
  "Comércio e Utilidades"
];

export const LOCATIONS = [
  "Cajazeiras II",
  "Cajazeiras IV",
  "Cajazeiras V",
  "Cajazeiras VI",
  "Cajazeiras VII",
  "Cajazeiras VIII",
  "Cajazeiras X",
  "Cajazeiras XI",
  "Fazendas Grandes I",
  "Fazendas Grandes II",
  "Fazendas Grandes III",
  "Fazendas Grandes IV",
  "Águas Claras",
  "Boca da Mata",
  "Palestina"
];

export const DEMO_LISTINGS = [
  {
    id: "demo-01",
    title: "Consertos e pequenos reparos",
    businessName: "Oficina do Zé (exemplo fictício)",
    description: "Exemplo de anúncio de manutenção para pequenos reparos residenciais. Este perfil é fictício e serve apenas para demonstrar a plataforma.",
    category: "Manutenção e Reformas",
    neighborhood: "Cajazeiras IV",
    icon: "🛠️",
    color: "#e5f0d7"
  },
  {
    id: "demo-02",
    title: "Bolos caseiros e quitutes",
    businessName: "Sabores da Vó (exemplo fictício)",
    description: "Exemplo de anúncio de bolos e quitutes preparados em casa. Este perfil é fictício e não representa um negócio real.",
    category: "Gastronomia e Sabores Locais",
    neighborhood: "Fazendas Grandes II",
    icon: "🍰",
    color: "#fae5d6"
  },
  {
    id: "demo-03",
    title: "Cuidado e beleza das unhas",
    businessName: "Espaço Bela (exemplo fictício)",
    description: "Exemplo de anúncio para ilustrar um serviço de beleza local. Este perfil é fictício e não representa uma profissional real.",
    category: "Beleza e Estilo",
    neighborhood: "Cajazeiras VII",
    icon: "💅",
    color: "#f6dce7"
  },
  {
    id: "demo-04",
    title: "Aulas de reforço escolar",
    businessName: "Aprender Juntos (exemplo fictício)",
    description: "Exemplo de anúncio de apoio escolar para demonstrar a categoria de educação. Este perfil é fictício.",
    category: "Cultura e Educação",
    neighborhood: "Águas Claras",
    icon: "📚",
    color: "#e0e8fa"
  },
  {
    id: "demo-05",
    title: "Revisão básica de motocicletas",
    businessName: "Garagem da Praça (exemplo fictício)",
    description: "Exemplo de anúncio de serviço automotivo. Este perfil é fictício e serve apenas para demonstrar a plataforma.",
    category: "Automotivo",
    neighborhood: "Cajazeiras X",
    icon: "🛵",
    color: "#f5e8c9"
  },
  {
    id: "demo-06",
    title: "Lanches para compartilhar",
    businessName: "Cantinho do Sabor (exemplo fictício)",
    description: "Exemplo de anúncio gastronômico para demonstrar os filtros e detalhes do Cajá Conecta. Não representa um estabelecimento real.",
    category: "Gastronomia e Sabores Locais",
    neighborhood: "Palestina",
    icon: "🥪",
    color: "#e4eee0"
  }
];

export function filterListings(listings, { query = "", category = "", location = "" } = {}) {
  const search = query.trim().toLocaleLowerCase("pt-BR");
  return listings.filter((listing) => {
    const matchesText = !search || [
      listing.title,
      listing.businessName,
      listing.description,
      listing.category,
      listing.neighborhood
    ].some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(search));
    return matchesText
      && (!category || listing.category === category)
      && (!location || listing.neighborhood === location);
  });
}

export function phoneDigits(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}
