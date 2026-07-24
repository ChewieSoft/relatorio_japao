/**
 * E2E (Playwright) do status de colaborador desligado — regressão do DJR-177.
 *
 * Reproduz o cenário do chamado: cadastrar um colaborador com o switch
 * "Desligado" ligado e verificar que a coluna de status exibe "Inativo"
 * (e não "Ativo"), pois um colaborador desligado é sempre inativo.
 *
 * Exercita o fluxo real contra o backend (Django): login, criação via Dialog,
 * asserção na tabela e limpeza (soft delete) do registro criado.
 *
 * As credenciais vêm de `.env.local` da raiz (DJR_USERNAME/DJR_PASSWORD),
 * carregado pelo playwright.config.ts. Requer a stack no ar: frontend em
 * :8080 e backend em :8000.
 */
import { test, expect, type Page } from "@playwright/test";

const USERNAME = process.env.DJR_USERNAME;
const PASSWORD = process.env.DJR_PASSWORD;

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
 * resposta de rede porque o React Query pode servir a query do cache.
 *
 * @param page - Página do Playwright.
 * @param term - Termo de busca (nome do colaborador).
 */
async function searchCollaborator(page: Page, term: string): Promise<void> {
  const box = page.getByPlaceholder("Buscar por nome ou domínio...");
  await box.fill("");
  await box.fill(term);
  await expect(
    page
      .getByRole("row", { name: new RegExp(term) })
      .or(page.getByText("Nenhum registro encontrado.")),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Status de colaborador desligado (DJR-177)", () => {
  test.skip(
    !USERNAME || !PASSWORD,
    "Defina DJR_USERNAME e DJR_PASSWORD no .env.local da raiz do repositório",
  );

  test('cadastrar com "Desligado" ligado exibe status "Inativo"', async ({ page }) => {
    // Nome/domínio únicos (o modelo exige unicidade); Date.now() está
    // disponível no runner Node do Playwright.
    const stamp = Date.now();
    const name = `E2E Desligado ${stamp}`;
    const domainUser = `e2e.desligado.${stamp}`;

    await login(page);
    await page.goto("/collaborators");

    // Abre o formulário de criação e preenche os campos obrigatórios.
    await page.getByRole("button", { name: "Novo Colaborador" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Nome Completo").fill(name);
    await dialog.getByLabel("Usuário de Domínio").fill(domainUser);
    await dialog.getByLabel("Departamento").fill("TI");
    await dialog.getByLabel("Data de Contratação").fill("2023-05-10");

    // Liga "Desligado" — o switch "Ativo" deve desligar e desabilitar.
    await dialog.getByLabel("Desligado").click();
    await expect(dialog.getByLabel("Ativo")).not.toBeChecked();
    await expect(dialog.getByLabel("Ativo")).toBeDisabled();

    // Data de Desligamento é obrigatória quando desligado.
    await dialog.getByLabel("Data de Desligamento").fill("2024-02-01");
    await dialog.getByRole("button", { name: "Salvar" }).click();

    // Salvou sem erro de formato de data e o Dialog fechou.
    await expect(page.getByText(/Formato inválido para data/i)).toHaveCount(0);
    await expect(dialog).toBeHidden();

    // Núcleo do DJR-177: a coluna de status mostra "Inativo", não "Ativo".
    await searchCollaborator(page, name);
    const savedRow = page.getByRole("row", { name: new RegExp(name) }).first();
    await expect(savedRow).toContainText("Inativo");

    // Cleanup best-effort: remove o registro criado (soft delete).
    await savedRow.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });
});
