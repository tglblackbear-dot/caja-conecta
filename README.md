# Cajá Conecta

**Quem é daqui, encontra aqui.**

O Cajá Conecta é uma plataforma hiperlocal para encontrar serviços, produtos e atividades em Cajazeiras e regiões adjacentes. Esta primeira versão é um PWA estático, feito com HTML semântico, CSS e JavaScript modular; abre em modo de demonstração sem configuração externa.

## Executar localmente

É necessário Node.js 18 ou superior. Na raiz do projeto:

```sh
npm run dev
```

Abra `http://localhost:4173`. Para executar os testes dos filtros:

```sh
npm test
```

## Demonstração

Os anúncios disponíveis sem backend são **exemplos fictícios**, identificados como demonstração. Não representam profissionais ou negócios reais e não incluem contatos reais. A busca textual, categorias, localidades e visualização de detalhes funcionam localmente. O botão de WhatsApp só é ativado para anúncios publicados que tenham um telefone válido.

## Supabase opcional

Para usar autenticação e ler anúncios publicados, configure `js/runtime-config.js` com a URL do projeto e a **chave publishable/anon pública**. O arquivo começa com valores vazios; `js/runtime-config.example.js` mostra o formato:

```js
window.CAJA_CONECTA_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabaseAnonKey: "SUA_CHAVE_PUBLICA"
};
```

Esses valores são públicos no site. Use somente a chave anon/publishable; nunca coloque uma chave `service_role`, token pessoal ou outro segredo privilegiado no frontend. As políticas RLS em `supabase/schema.sql` restringem a leitura dos perfis ao próprio comerciante.

No GitHub Pages, configure opcionalmente as variáveis de repositório `SUPABASE_URL` e `SUPABASE_ANON_KEY` (chave pública anon/publishable) para gerar essa configuração durante o deploy. Sem as duas variáveis, o site permanece no modo de demonstração.

### Cadastro de comerciantes e recuperação de senha

1. No painel do Supabase, habilite o provedor de e-mail, mantenha a confirmação de e-mail ativada e configure senha mínima de 8 caracteres. Para produção, configure SMTP para que os links de confirmação e recuperação sejam entregues de forma confiável.
2. Execute `supabase/schema.sql` no SQL Editor do projeto. O trigger cria um perfil privado para cada novo usuário; novos cadastros começam como `pending` e não aprovam nem publicam anúncios automaticamente.
3. Em **Authentication → URL Configuration**, configure a URL do site e permita a URL da página com `?auth=recovery`. Inclua também as URLs equivalentes de desenvolvimento local, por exemplo `http://localhost:4173/` e `http://localhost:4173/?auth=recovery`.
4. Configure a URL e a chave pública em `js/runtime-config.js` para desenvolvimento, ou nas variáveis do GitHub Pages para deploy. Acesse **Entrar** ou **Anuncie** para cadastrar, entrar e recuperar a senha.

O botão **Testar conexão com Supabase** verifica o endpoint remoto do Supabase Auth sem mostrar a chave. Também é possível testar do terminal com `npm run test:supabase`, definindo `SUPABASE_URL` e `SUPABASE_ANON_KEY` apenas no ambiente local. Esse teste confirma a conectividade do Auth; a confirmação de e-mail e a redefinição devem ser verificadas com uma conta de teste e o e-mail recebido.

## Identidade local e créditos

A página destaca fotografias reais de Cajazeiras X: o Mercado Municipal, a Rótula da Feirinha e uma agência local, feitas por Ajmcbarreto em 2019. As imagens estão no Wikimedia Commons sob licença [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) e são creditadas na própria página. O mapa é uma incorporação do [OpenStreetMap](https://www.openstreetmap.org/copyright), com a localização geral e aproximada das localidades atendidas; mapa e fotos precisam de conexão à internet.

## Publicação

O workflow `.github/workflows/pages.yml` valida o projeto e publica a raiz no GitHub Pages quando executado na branch `main`. Ative GitHub Pages com **GitHub Actions** nas configurações do repositório. O service worker guarda apenas os arquivos estáticos da interface; respostas da API e dados de anúncios não são armazenados em cache.

## Escopo atual

- Busca, grade de botões de categoria com ícones, filtro de localidade, cartões e detalhes acessíveis.
- Abrir WhatsApp para anúncios reais com telefone publicado.
- Manifest e service worker para uso instalável e interface estática offline.
- Supabase opcional, sem credenciais no repositório, e schema inicial com RLS.
- Cadastro e autenticação de comerciantes, confirmação de e-mail e recuperação de senha via Supabase Auth; aprovação e publicação manual de anúncios ainda não estão incluídas.
- Sem pagamentos ou localização GPS nesta versão.
