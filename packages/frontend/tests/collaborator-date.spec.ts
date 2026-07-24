/**
 * E2E (Playwright) da data de contratação — regressão do DJR-176.
 *
 * Exercita o datepicker contra o backend real (DateField): faz login, cria ou
 * edita o colaborador "Leonardo Ribas" com data de contratação 01/dez/2023
 * (ISO 2023-12-01) e verifica que:
 *   1. salvar NÃO dispara o erro do DRF "Formato inválido para data...";
 *   2. a coluna "Contratação" exibe a data em pt-BR abreviado (01/dez/2023);
 *   3. ao reabrir a edição, a data não recua um dia (input mantém o ISO).
 *
 * As credenciais vêm de `.env.local` da raiz (DJR_USERNAME/DJR_PASSWORD),
 * carregado pelo playwright.config.ts. Requer a stack no ar: frontend em
 * :8080 e backend em :8000.
 */
import { test, expect, type Page } from "@playwright/test";

const USERNAME = process.env.DJR_USERNAME;
const PASSWORD = process.env.DJR_PASSWORD;

/** Dados do colaborador de teste. */
const COLLAB = {
  name: "Leonardo Ribas",
  domainUser: "leonardo.ribas",
  office: "TI",
  dateIso: "2023-12-01",
  dateBR: "01/dez/2023",
};

/**
 * Autentica na aplicação com as credenciais do `.env.local`.
 *
 * @param page - Página do Playwright.
 */
async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator("#username").fill(USERNAME as string);
  await page.locator("#password").fill(PASSWORD as string);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
}

/**
 * Filtra a lista de colaboradores por `term` e aguarda o DOM refletir o filtro
 * (linha do termo OU estado vazio). Espera pela condição no DOM em vez da
 * resposta de rede porque o React Query pode servir a query do cache — sem novo
 * request — ao reaplicar um filtro já buscado.
 *
 * @param page - Página do Playwright.
 * @param term - Termo de busca (nome do colaborador).
 */
async function searchCollaborator(page: Page, term: string): Promise<void> {
  const box = page.getByPlaceholder("Buscar por nome ou domínio...");
  await box.fill("");
  await box.fill(term);
  // Debounce de 400ms + fetch/cache: aguarda o resultado estabilizar no DOM.
  await expect(
    page
      .getByRole("row", { name: new RegExp(term) })
      .or(page.getByText("Nenhum registro encontrado.")),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Data de contratação — datepicker (DJR-176)", () => {
  test.skip(
    !USERNAME || !PASSWORD,
    "Defina DJR_USERNAME e DJR_PASSWORD no .env.local da raiz do repositório",
  );

  test("salva sem erro de formato, exibe DD/mmm/YYYY e não recua um dia", async ({ page }) => {
    await login(page);
    await page.goto("/collaborators");

    // Abre o formulário: edita "Leonardo Ribas" se já existir, senão cria.
    await searchCollaborator(page, COLLAB.name);
    const existing = page.getByRole("row", { name: new RegExp(COLLAB.name) });
    if ((await existing.count()) > 0) {
      await existing.first().getByRole("button", { name: "Editar" }).click();
    } else {
      await page.getByRole("button", { name: "Novo Colaborador" }).click();
      await page.getByLabel("Nome Completo").fill(COLLAB.name);
      await page.getByLabel("Usuário de Domínio").fill(COLLAB.domainUser);
      await page.getByLabel("Departamento").fill(COLLAB.office);
    }

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Datepicker nativo: o valor trafega como ISO YYYY-MM-DD.
    await dialog.getByLabel("Data de Contratação").fill(COLLAB.dateIso);
    await dialog.getByRole("button", { name: "Salvar" }).click();

    // Núcleo do DJR-176: nenhuma mensagem de formato inválido do DateField.
    await expect(page.getByText(/Formato inválido para data/i)).toHaveCount(0);

    // Sucesso => o Dialog fecha.
    await expect(dialog).toBeHidden();

    // Visualização: a coluna "Contratação" mostra 01/dez/2023.
    await searchCollaborator(page, COLLAB.name);
    const savedRow = page.getByRole("row", { name: new RegExp(COLLAB.name) }).first();
    await expect(savedRow).toContainText(COLLAB.dateBR);

    // Reabre a edição: a data não recua um dia (input mantém o valor ISO).
    await savedRow.getByRole("button", { name: "Editar" }).click();
    await expect(
      page.getByRole("dialog").getByLabel("Data de Contratação"),
    ).toHaveValue(COLLAB.dateIso);
  });
});
