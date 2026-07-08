# Jogo da Memória — Integrado

## Como usar
Basta abrir o arquivo `index.html` (2 cliques) em qualquer navegador (Chrome/Edge de
preferência). Não precisa de servidor, internet ou instalação — tudo roda localmente,
inclusive os leads (ficam salvos no `localStorage` do navegador, naquela máquina).

> O vídeo de repouso (`assets/video/manifesto.mp4`) é versionado via **Git LFS**. Para
> cloná-lo por completo é preciso ter o [Git LFS](https://git-lfs.com) instalado antes do
> `git clone` — sem ele, o arquivo baixado é só um ponteiro de texto, não o vídeo.

Para rodar em modo totem/kiosk no Chrome, um atalho útil:
```
chrome.exe --kiosk "C:\caminho\para\index.html"
```

## Fluxo
1. **Tela inicial** — logo + botão "Toque para Jogar".
2. **Escolha da dificuldade**:
   - **Normal** — 6 pares, sorteados aleatoriamente entre as 10 imagens, 1min30 para completar.
   - **Difícil** — os 10 pares (todas as imagens), 1 minuto para completar. Antes de começar,
     aparece um aviso: *"Atenção, esse modo tem um tempo menor e com mais cartas. Esteja
     preparado!"*
3. **Cadastro (lead)** — nome, telefone e e-mail. Obrigatório antes de **cada partida**,
   inclusive ao clicar em "Jogar novamente"/"Tentar novamente" nas telas de fim de partida
   (elas voltam para a escolha de dificuldade, não direto pro jogo).
4. **Jogo** — tabuleiro com as imagens sorteadas para a dificuldade escolhida.
5. **Vitória / Derrota** — telas de fim de partida com opção de jogar novamente (volta para
   a escolha de dificuldade e pede um novo cadastro) ou voltar ao menu inicial.

## Resultado no lead
Cada lead cadastrado guarda também:
- **Dificuldade** escolhida (Normal/Difícil)
- **Resultado**: Venceu, Perdeu, ou "—" se a pessoa saiu no meio da partida sem terminar.
Como "Jogar novamente"/"Tentar novamente" sempre passam pelo cadastro de novo, cada
tentativa gera um lead novo e independente — nenhum registro é sobrescrito.

## Modo de repouso (vídeo)
Se ninguém interagir com a tela por **40 segundos**, o vídeo `assets/video/manifesto.mp4`
entra em tela cheia, em loop (exibido inteiro, sem cortes, com barras pretas se a proporção
da tela não bater com a do vídeo). Qualquer toque/clique interrompe o vídeo e volta para a
escolha de dificuldade, começando um novo ciclo de lead → jogo.

> Alguns navegadores bloqueiam vídeo com áudio sem interação prévia do usuário. Se isso
> acontecer, o vídeo cai automaticamente para "mudo" e continua tocando normalmente.

## Painel administrativo (leads)
Pressione **F9** a qualquer momento para abrir o painel administrativo:
- Ver quantos leads foram cadastrados e uma tabela com todos eles.
- **Exportar Excel** — baixa um `.xlsx` com Nome, Telefone, E-mail e Data.
- **Limpar leads** — apaga todos os leads salvos (pede confirmação antes).
- Feche com **F9** de novo, **Esc**, ou clicando fora do painel.

## Onde ficam os dados
Os leads ficam salvos **somente no navegador daquela máquina** (localStorage, chave
`integrado_leads`). Isso significa:
- Não depende de internet nem de servidor.
- Se limpar o cache/dados do navegador, os leads somem — exporte com frequência.
- Se trocar de navegador ou de computador, os leads não "seguem" — cada instalação tem os
  seus próprios dados.

## Estrutura de arquivos
```
index.html        → estrutura das telas
style.css         → identidade visual (cores, layout)
game.js           → toda a lógica (jogo, leads, vídeo de repouso, painel admin)
vendor/xlsx.full.min.js → biblioteca para exportar Excel (funciona offline)
assets/logo.png   → logo Integrado usada na tela inicial, cadastro e costas das cartas
assets/cards/1.png…10.png → as 10 imagens do jogo
assets/video/manifesto.mp4 → vídeo do modo de repouso
```

## Personalizações rápidas (no `game.js`, bloco `CONFIG` no topo)
- `DIFFS.normal.time` / `DIFFS.dificil.time` — tempo de jogo em segundos de cada dificuldade
  (hoje: 90 e 60).
- `DIFFS.normal.pairs` / `DIFFS.dificil.pairs` — quantidade de pares de cada dificuldade
  (hoje: 6 e 10).
- `DIFFS.*.cols` — número de colunas do tabuleiro de cada dificuldade.
- `IDLE_MS` — tempo de inatividade até o vídeo entrar (hoje: 40 segundos).

## Identidade visual aplicada
Cores extraídas do manual de marca e do logo enviado:
- Navy `#003355` (principal)
- Azul `#3996d3` (apoio/CTA)
- Laranja `#eb942d` (destaque/ação)
- Vermelho `#ea543d` (ações de risco, ex: limpar leads)

O fundo usa o recurso gráfico de "triângulo diagonal no canto" que aparece no manual da
marca (seção *Padrão de comunicação*), e as costas das cartas usam a marca Integrado.
