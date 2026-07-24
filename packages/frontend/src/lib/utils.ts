import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Abreviações de mês em pt-BR (índice 0 = janeiro), usadas por formatDateBR. */
const MONTHS_PT_BR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

/**
 * Formata uma data de calendário ISO (`YYYY-MM-DD`) para exibição em pt-BR
 * no formato `DD/mmm/YYYY` (ex.: "2023-12-01" → "01/dez/2023").
 *
 * À prova de timezone: faz o parse por split em "-", sem usar `new Date()`
 * (que interpretaria a data como meia-noite UTC e, em UTC−3, recuaria um dia —
 * justamente o off-by-one que o DJR-176 corrige). Aceita valores com componente
 * de hora (usa só os 10 primeiros caracteres). Valida mês (01–12) e dia contra
 * o comprimento real do mês (inclui anos bissextos), então datas de calendário
 * impossíveis como "2023-02-30" ou "2023-04-31" também retornam "". Retorna ""
 * para entrada vazia/nula/malformada, deixando a decisão de placeholder para o
 * chamador. A checagem de dia usa `Date.UTC` apenas para cálculo numérico do
 * último dia do mês — nunca para formatar —, portanto não reintroduz o
 * off-by-one de timezone.
 *
 * @param iso - Data ISO `YYYY-MM-DD` (ou `YYYY-MM-DDT…`), ou null/undefined.
 * @returns Data formatada `DD/mmm/YYYY`, ou "" quando não há data válida.
 */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return "";
  const [, year, month, day] = match;
  const monthLabel = MONTHS_PT_BR[Number(month) - 1];
  if (!monthLabel) return "";
  const lastDayOfMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const dayNumber = Number(day);
  if (dayNumber < 1 || dayNumber > lastDayOfMonth) return "";
  return `${day}/${monthLabel}/${year}`;
}
