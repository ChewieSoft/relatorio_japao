# Erro na data de contratação

---

Toda vez que inserimos a data de contratação e salvamos, ao abrir novamente a tela de edição do colaborador, a data sempre aparece como sendo a do dia anterior ao que colocamos.

E se entramos, vemos a data errada e salvamos o sistema joga mais um dia para trás.

[![image.png](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/scaled-1680-/pFWimage.png)](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/pFWimage.png)

[![image.png](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/scaled-1680-/vILimage.png)](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/vILimage.png)

[![image.png](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/scaled-1680-/nSwimage.png)](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/nSwimage.png)

[![image.png](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/scaled-1680-/RQlimage.png)](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/RQlimage.png)

[![image.png](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/scaled-1680-/gNCimage.png)](https://kb.jrcbrasil.com.br/uploads/images/gallery/2026-06/gNCimage.png)

---

## Resolução (DJR-176)

O recuo de um dia foi corrigido na raiz modelando as datas de calendário como
`DateField` e enviando `YYYY-MM-DD` puro (ver
[ADR 0001](../adr/0001-datas-de-calendario-como-datefield.md)).

O erro **"Formato inválido para data. Use um dos formatos a seguir: YYYY-MM-DD."**
que aparecia no datepicker é a validação embutida do `DateField` do DRF quando
recebe uma data com hora — sintoma de um **build antigo do frontend** rodando
contra o backend já migrado. É resolvido reconstruindo o frontend
(`npm run build` ou `docker-compose up --build`). Para não recorrer, o envio foi
blindado com `toApiDate()` (sempre `YYYY-MM-DD` puro).

Na exibição, as datas passam a aparecer em `DD/mmm/YYYY` (ex.: `01/dez/2023`) via
`formatDateBR()`; o campo de edição continua no formato numérico `DD/MM/YYYY` do
seletor nativo (como na foto). Cobertura de regressão de ponta a ponta em
`packages/frontend/tests/collaborator-date.spec.ts` (Playwright).