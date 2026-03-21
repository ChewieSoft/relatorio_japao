# Design System — JRC Brasil Compliance TI

> Contexto arquitetural e convencoes em [../CLAUDE.md](../CLAUDE.md).
> Implementacao React/TypeScript em [../docs/FRONTEND.md](../docs/FRONTEND.md).

## Direction

**Precision & Density.** Interface corporativa de compliance — informação densa, hierarquia clara, zero ruído visual. Estética flat com bordas, sem sombras. Cores sóbrias com acentos semânticos para status.

## Foundation

- **Base:** Cool slate (`--background: 210 20% 98%`)
- **Surface:** White cards (`--card: 0 0% 100%`)
- **Text:** Dark slate (`--foreground: 220 30% 12%`)
- **Muted:** Slate desaturado (`--muted-foreground: 215 16% 47%`)

## Depth

**Borders-only.** Nenhuma sombra no sistema. Todas as superfícies elevadas usam `border border-border` com `rounded-xl`.

```
Container = bg-card rounded-xl border border-border
```

## Tokens

### Spacing (base 4px)

| Token | Valor | Uso principal |
|-------|-------|---------------|
| `2` | 8px | Espaço mínimo entre ícone e texto |
| `3` | 12px | Gap ícone+label, space-y em skeletons |
| `4` | 16px | Padding de paginação, py de seções |
| `5` | 20px | Padding de cards KPI e relatórios |
| `6` | 24px | Padding de painéis e tabelas (loading) |
| `8` | 32px | Padding do conteúdo principal, mb de PageHeader, estados erro/vazio |

**Regra:** Usar apenas valores da escala Tailwind (2, 3, 4, 5, 6, 8). Evitar valores arbitrários como `text-[10px]`.

### Radius

| Token | Classe | Uso |
|-------|--------|-----|
| xl | `rounded-xl` | Cards, painéis, containers de tabela |
| lg | `rounded-lg` | Caixas de ícone (logo, KPI) |
| md | `rounded-md` | Itens de navegação sidebar |
| full | `rounded-full` | Badges de status, spinners |
| (default) | `rounded` | Botões de paginação |

### Typography

| Nível | Classes | Uso |
|-------|---------|-----|
| Page title | `text-2xl font-bold text-foreground` | PageHeader h1 |
| Section header | `text-sm font-semibold text-card-foreground` | Títulos de seção dentro de cards |
| Body | `text-sm` | Texto padrão, labels, botões |
| Caption | `text-xs text-muted-foreground` | Subtítulos, timestamps, dados secundários |
| Monospace | `font-mono text-xs` | Dados técnicos (IP, hostname, domínio, license key, service tag) |
| Brand title | `text-sm font-bold tracking-wide` | "JRC BRASIL" no sidebar |
| Brand subtitle | `text-xs tracking-widest uppercase` | "Compliance TI" no sidebar |

### Icon Sizes

| Tamanho | Classes | Uso |
|---------|---------|-----|
| sm | `w-3 h-3` | Dentro de badges inline |
| md | `w-4 h-4` | Navegação, tabelas, toggle senha |
| lg | `w-5 h-5` | Ícones primários em cards, sidebar logo |
| xl | `w-8 h-8` | Estados de erro (AlertCircle) |
| 2xl | `w-10 h-10` | Background de ícones KPI |

### Colors

**Semânticas de status (domínio):**

| Status | Background | Text | Uso |
|--------|-----------|------|-----|
| active/sent | `bg-status-active/10` | `text-status-active` | Colaborador ativo, relatório enviado |
| inactive | `bg-status-inactive/10` | `text-status-inactive` | Colaborador inativo |
| pending | `bg-status-warning/10` | `text-status-warning` | Relatório pendente |

**Opacidade padrão para backgrounds de status:** `/10` (10%).

**Cores de UI:**

| Função | Variável | Uso |
|--------|----------|-----|
| Primary | `--primary` | Login background, botões, links, paginação ativa |
| Accent | `--accent` | Destaques sidebar, badges gerados |
| Destructive | `--destructive` | Erros, ícones X, alertas segurança |
| Muted | `--muted` | Hover backgrounds |

**Hover opacity:** `/50` para hover suave (`bg-muted/50`), `/90` para texto hover.

## Patterns

### Card

```
<div className="bg-card rounded-xl border border-border p-{5|6}">
```

- Padding `p-5` para cards compactos (KPI, relatórios)
- Padding `p-6` para painéis maiores (seções dashboard)
- Alerta: `bg-destructive/5 rounded-xl border border-destructive/20 p-6`

### Table Container

```
<div className="bg-card rounded-xl border border-border overflow-hidden">
  <div className="overflow-x-auto">
    <Table>...</Table>
  </div>
  <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
</div>
```

- `overflow-hidden` para respeitar rounded corners
- `overflow-x-auto` no wrapper da tabela para scroll horizontal em mobile
- Componentes compartilhados em `@/components/TableStates`:
  - `<TableSkeleton rows={5} />` — loading state
  - `<TableError message="..." onRetry={fn} />` — erro com retry
  - `<TableEmpty message="..." />` — estado vazio
  - `<TablePagination page={n} totalPages={n} onPageChange={fn} />` — paginação numérica

### Pagination (via TablePagination)

```
<TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
```

### Status Badge

```
<span className={cn(
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  config[status].className
)}>
```

### Sidebar Nav Item

```
<Link className={cn(
  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
  isActive
    ? "bg-sidebar-active text-sidebar-foreground"
    : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground"
)}>
  <Icon className="w-4 h-4" />
  {label}
</Link>
```

### Page Layout

```
<AppLayout>                          {/* responsivo: sidebar + content */}
  <PageHeader title="..." subtitle="..." />  {/* mb-8 */}
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    {/* content */}
  </div>
</AppLayout>
```

- Desktop (md+): sidebar fixa w-64 à esquerda, conteúdo com `p-8`
- Mobile (<md): sidebar oculta, top bar com hamburger + Sheet drawer pela esquerda, conteúdo com `p-4`
- AppSidebar aceita `onNavigate` para fechar drawer após clique em link

### KPI Card (Dashboard)

```
<div className="bg-card rounded-xl border border-border p-5">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-{color}/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-{color}" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
    </div>
  </div>
</div>
```

### Grid Responsivo

| Contexto | Classes |
|----------|---------|
| KPI (4 cards) | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5` |
| Cards relatório | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` |
| Painéis 2-col | `grid grid-cols-1 lg:grid-cols-2 gap-6` |

### Interactive States

| Elemento | Hover | Active |
|----------|-------|--------|
| Table row | `hover:bg-muted/50` | — |
| Nav item | `hover:bg-sidebar-hover hover:text-sidebar-foreground` | `bg-sidebar-active` |
| Pagination | `hover:bg-muted` | `bg-primary text-primary-foreground` |
| Link | `hover:text-primary/90` | — |
| All interactive | `transition-colors` | — |

## Rules

1. **Sem sombras.** Profundidade exclusivamente por bordas.
2. **`cn()` obrigatório** para classNames condicionais. Nunca template literals com ternários.
3. **Sem valores arbitrários** (ex: `text-[10px]`). Usar apenas escala Tailwind.
4. **CSS variables** para todas as cores. Nunca hex/rgb hardcoded.
5. **Status via tokens semânticos** (`status-active`, `status-inactive`, `status-warning`).
6. **Ícones lucide-react** exclusivamente. Tamanhos: sm(3), md(4), lg(5), xl(8).
7. **Mobile-first.** Breakpoints: base → `md:` → `lg:`. Nunca `sm:` como primeira camada.
