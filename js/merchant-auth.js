import { CATEGORIES, LOCATIONS } from "./catalog.js";
import { getSupabaseClient, testSupabaseConnection } from "./services/supabase-client.js";

const dialog = document.querySelector("#merchant-dialog");
const feedback = document.querySelector("#merchant-feedback");
const panels = [...document.querySelectorAll("[data-auth-panel]")];
const categorySelect = document.querySelector("#merchant-category");
const locationSelect = document.querySelector("#merchant-neighborhood");
let client;
let authListener;

function fillOptions(select, values) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

fillOptions(categorySelect, CATEGORIES);
fillOptions(locationSelect, LOCATIONS);

function setPanel(name) {
  for (const panel of panels) panel.hidden = panel.dataset.authPanel !== name;
  feedback.hidden = true;
  feedback.textContent = "";
}

function showFeedback(message, kind = "info") {
  feedback.textContent = message;
  feedback.dataset.kind = kind;
  feedback.hidden = false;
}

function openDialog() {
  if (!dialog.open && typeof dialog.showModal === "function") dialog.showModal();
  else if (!dialog.open) dialog.setAttribute("open", "");
}

function passwordMatch(form) {
  const password = form.elements.password.value;
  const confirmation = form.elements.password_confirmation.value;
  if (password.length < 8) {
    showFeedback("A senha precisa ter pelo menos 8 caracteres.", "error");
    return false;
  }
  if (password !== confirmation) {
    showFeedback("As senhas não conferem.", "error");
    return false;
  }
  return true;
}

function formatAuthError(error) {
  if (/invalid login credentials/i.test(error.message)) return "E-mail ou senha inválidos.";
  if (/user already registered/i.test(error.message)) return "Este e-mail já possui cadastro. Entre ou recupere sua senha.";
  if (/password should be at least/i.test(error.message)) return "A senha precisa ter pelo menos 8 caracteres.";
  return `Não foi possível concluir a operação: ${error.message}`;
}

async function loadProfile(user) {
  const { data, error } = await client
    .from("merchant_profiles")
    .select("full_name,business_name,category,neighborhood,status")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    showFeedback("Não foi possível carregar o perfil. Confirme se o schema do comerciante foi aplicado no Supabase.", "error");
    return;
  }

  document.querySelector("#merchant-profile-name").textContent = data.full_name;
  document.querySelector("#merchant-profile-business").textContent = data.business_name;
  document.querySelector("#merchant-profile-category").textContent = data.category;
  document.querySelector("#merchant-profile-neighborhood").textContent = data.neighborhood;
  document.querySelector("#merchant-profile-email").textContent = user.email ?? "";
  const statusLabels = {
    pending: "Aguardando análise",
    approved: "Cadastro aprovado",
    rejected: "Cadastro não aprovado"
  };
  document.querySelector("#merchant-profile-status").textContent = statusLabels[data.status] ?? "Status indisponível";
}

async function initializeAuth(initialPanel = "signup") {
  try {
    client = await getSupabaseClient();
    if (!authListener) {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setPanel("new-password");
          showFeedback("Defina uma nova senha para sua conta.", "info");
          openDialog();
        } else if (event === "SIGNED_IN" && session?.user && dialog.open) {
          setPanel("profile");
          showFeedback("Acesso realizado.", "success");
          setTimeout(() => { void loadProfile(session.user); }, 0);
        }
      });
      authListener = data.subscription;
    }

    const { data, error } = await client.auth.getSession();
    if (error) throw error;

    const recoveryLink = new URLSearchParams(location.search).get("auth") === "recovery";
    if (recoveryLink) {
      setPanel("new-password");
      if (data.session) {
        showFeedback("Defina uma nova senha para sua conta.", "info");
      } else {
        showFeedback("O link expirou ou não é válido. Solicite uma nova recuperação de senha.", "error");
      }
    } else if (data.session?.user) {
      setPanel("profile");
      await loadProfile(data.session.user);
    } else {
      setPanel(initialPanel);
    }
  } catch (error) {
    setPanel(initialPanel);
    showFeedback(error.message, "error");
  }
}

export function openMerchantAccount(initialPanel = "signup") {
  openDialog();
  void initializeAuth(initialPanel);
}

function setFormBusy(form, busy, busyText) {
  const button = form.querySelector('[type="submit"]');
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
  button.disabled = busy;
}

document.querySelector("#merchant-signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const password = values.get("password");
  if (!passwordMatch(form)) return;
  const phone = String(values.get("phone")).replace(/\D/g, "");
  const whatsapp = String(values.get("whatsapp")).replace(/\D/g, "");
  if (phone.length < 8 || phone.length > 15 || (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15))) {
    showFeedback("Informe um telefone e, se preenchido, um WhatsApp com 8 a 15 dígitos.", "error");
    return;
  }

  setFormBusy(form, true, "Criando conta…");
  try {
    client ??= await getSupabaseClient();
    const email = String(values.get("email")).trim().toLowerCase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}${location.pathname}`,
        data: {
          account_type: "merchant",
          full_name: String(values.get("full_name")).trim(),
          business_name: String(values.get("business_name")).trim(),
          phone,
          category: values.get("category"),
          neighborhood: values.get("neighborhood"),
          whatsapp: whatsapp || null,
          description: String(values.get("description")).trim() || null
        }
      }
    });
    if (error) throw error;
    if (data.session?.user) {
      setPanel("profile");
      showFeedback("Conta criada. Seu cadastro aguarda análise antes de qualquer publicação.", "success");
      await loadProfile(data.session.user);
    } else {
      setPanel("login");
      showFeedback("Cadastro recebido. Confirme seu e-mail pelo link enviado para ativar a conta e depois entre.", "success");
    }
  } catch (error) {
    showFeedback(formatAuthError(error), "error");
  } finally {
    setFormBusy(form, false);
  }
});

document.querySelector("#merchant-login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setFormBusy(form, true, "Entrando…");
  try {
    client ??= await getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: String(values.get("email")).trim().toLowerCase(),
      password: values.get("password")
    });
    if (error) throw error;
    setPanel("profile");
    showFeedback("Acesso realizado.", "success");
    await loadProfile(data.user);
  } catch (error) {
    showFeedback(formatAuthError(error), "error");
  } finally {
    setFormBusy(form, false);
  }
});

document.querySelector("#merchant-reset-request-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = String(new FormData(form).get("email")).trim().toLowerCase();
  setFormBusy(form, true, "Enviando…");
  try {
    client ??= await getSupabaseClient();
    const redirectUrl = new URL(location.pathname, location.origin);
    redirectUrl.searchParams.set("auth", "recovery");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl.toString() });
    if (error) throw error;
    showFeedback("Se houver uma conta com esse e-mail, enviaremos um link para criar uma nova senha.", "success");
  } catch (error) {
    showFeedback(formatAuthError(error), "error");
  } finally {
    setFormBusy(form, false);
  }
});

document.querySelector("#merchant-new-password-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!passwordMatch(form)) return;
  setFormBusy(form, true, "Salvando…");
  try {
    client ??= await getSupabaseClient();
    const { data, error } = await client.auth.updateUser({ password: form.elements.password.value });
    if (error) throw error;
    setPanel("profile");
    showFeedback("Senha atualizada. Sua conta está pronta para uso.", "success");
    if (data.user) await loadProfile(data.user);
    const cleanUrl = new URL(location.pathname, location.origin);
    history.replaceState(null, "", `${cleanUrl.pathname}${location.hash}`);
  } catch (error) {
    showFeedback(formatAuthError(error), "error");
  } finally {
    setFormBusy(form, false);
  }
});

document.querySelectorAll("[data-show-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const email = document.querySelector("#login-email").value ||
      document.querySelector("#reset-request-email").value ||
      document.querySelector("#merchant-signup-form [name='email']").value;
    setPanel(button.dataset.showPanel);
    const targetId = { login: "login-email", "reset-request": "reset-request-email" }[button.dataset.showPanel];
    const targetEmail = targetId ? document.getElementById(targetId) : null;
    if (targetEmail && email) targetEmail.value = email;
  });
});

document.querySelector("#merchant-signout").addEventListener("click", async () => {
  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setPanel("login");
    showFeedback("Você saiu da sua conta.", "success");
  } catch (error) {
    showFeedback(formatAuthError(error), "error");
  }
});

document.querySelector("#merchant-dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelector("#test-supabase-connection").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const result = document.querySelector("#supabase-test-result");
  button.disabled = true;
  result.textContent = "Testando conexão…";
  result.dataset.kind = "info";
  try {
    result.textContent = await testSupabaseConnection();
    result.dataset.kind = "success";
  } catch (error) {
    result.textContent = error.message;
    result.dataset.kind = "error";
  } finally {
    button.disabled = false;
  }
});

export function initializeMerchantAuth() {
  document.querySelector("#merchant-account-button").addEventListener("click", () => openMerchantAccount("login"));
  document.querySelector("#announce-button").addEventListener("click", () => openMerchantAccount("signup"));

  if (new URLSearchParams(location.search).get("auth") === "recovery") {
    openMerchantAccount("new-password");
  }
}
