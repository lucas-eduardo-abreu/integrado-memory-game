# Jogo da Memória — Integrado

## Como usar
Basta abrir o arquivo `index.html` (2 cliques) em qualquer navegador (Chrome/Edge de
preferência). Não precisa de servidor, internet ou instalação — tudo roda localmente,
inclusive os leads (ficam salvos no `localStorage` do navegador, naquela máquina).

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
3. **Cadastro (lead)** — nome, telefone e e-mail. Obrigatório antes de cada nova sessão
   (jogar de novo/tentar de novo dentro do jogo não pede o formulário de novo — só quando
   volta ao menu inicial, escolhe a dificuldade de novo, ou quando o vídeo de atração é
   interrompido).
4. **Jogo** — tabuleiro com as imagens sorteadas para a dificuldade escolhida.
5. **Vitória / Derrota** — telas de fim de partida com opção de jogar novamente (mesma
   dificuldade) ou voltar ao menu (escolhe tudo de novo).

## Resultado no lead
Cada lead cadastrado guarda também:
- **Dificuldade** escolhida (Normal/Difícil)
- **Resultado**: Venceu, Perdeu, ou "—" se a pessoa saiu no meio da partida sem terminar.
Se a pessoa jogar de novo ("Jogar novamente"/"Tentar novamente") sem voltar ao menu, o
resultado da nova tentativa substitui o da tentativa anterior no mesmo cadastro (mesma
pessoa, mesma sessão). Só é criado um cadastro novo quando ela volta ao menu inicial e
preenche o formulário de novo.

## Modo de repouso (vídeo)
Se ninguém interagir com a tela por **5 minutos**, o vídeo `MANIFESTO_VERTICAL.mp4` entra
em tela cheia, em loop. Qualquer toque/clique interrompe o vídeo e abre direto o formulário
de cadastro, começando um novo ciclo de lead → jogo.

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
assets/logo 31.png   → logo Integrado usada na tela inicial, cadastro e costas das cartas
assets/cards/1.png…10.png → as 10 imagens do jogo
assets/video/manifesto.mp4 → vídeo do modo de repouso
```

## Personalizações rápidas (no `game.js`, bloco `CONFIG` no topo)
- `DIFFS.normal.time` / `DIFFS.dificil.time` — tempo de jogo em segundos de cada dificuldade
  (hoje: 90 e 60).
- `DIFFS.normal.pairs` / `DIFFS.dificil.pairs` — quantidade de pares de cada dificuldade
  (hoje: 6 e 10).
- `DIFFS.*.cols` — número de colunas do tabuleiro de cada dificuldade.
- `IDLE_MS` — tempo de inatividade até o vídeo entrar (hoje: 5 minutos).

## Identidade visual aplicada
Cores extraídas do manual de marca e do logo enviado:
- Navy `#003355` (principal)
- Azul `#3996d3` (apoio/CTA)
- Laranja `#eb942d` (destaque/ação)
- Vermelho `#ea543d` (ações de risco, ex: limpar leads)

O fundo usa o recurso gráfico de "triângulo diagonal no canto" que aparece no manual da
marca (seção *Padrão de comunicação*), e as costas das cartas usam a marca Integrado.
