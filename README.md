# SQL Monitor (sql-m)

O **SQL Monitor (sql-m)** é uma aplicação desktop de alta performance desenvolvida para análise de tráfego SQL e monitoramento de desempenho em tempo real. Utilizando um pipeline de ingestão gRPC de baixa latência, ele oferece visibilidade instantânea sobre os padrões de execução de queries, identifica gargalos e auxilia na otimização de bancos de dados.

## 🚀 Sobre o Projeto

Este projeto foi construído para servir como uma interface visual moderna e poderosa para o [sql-tap](https://github.com/mickamy/sql-tap), permitindo que desenvolvedores e DBAs monitorem suas consultas sem esforço.

### Principais Funcionalidades

*   **Monitoramento em Tempo Real**: Fluxo ao vivo de todas as queries SQL sendo executadas.
*   **Detecção de Queries Lentas**: Identificação visual automática de consultas que excedem limites de tempo configurados.
*   **Filtros Avançados**: Pesquisa e filtragem por nome do banco, usuário, tipo de consulta ou padrões Regex.
*   **Interface Premium**: Design moderno com suporte a temas escuros, transições suaves e visualização de dados complexos.
*   **Multi-Pane View**: Organize seu monitoramento em diferentes abas para tabelas ou tipos de tráfego específicos.

## 🛠️ Tecnologias Utilizadas

*   **Electron**: Shell para aplicação desktop cross-platform.
*   **React**: Interface interativa de alta performance.
*   **gRPC / Protocol Buffers**: Comunicação eficiente para streaming de dados.
*   **Node.js**: Backend integrado para gerenciamento do servidor gRPC.

## ⚙️ Pré-requisitos e Instalação

Para o funcionamento pleno do monitoramento, é necessário ter o ambiente configurado corretamente.

### 1. Instalação do Go (Recomendado)
A ferramenta base `sql-tap` é desenvolvida em Go. Por isso, **recomendamos fortemente a instalação do Go** em seu sistema para compilar ou executar as ferramentas de captura de tráfego.

*   [Download Go](https://go.dev/dl/)

### 2. sql-tap
Este monitor depende do `sql-tap` para capturar os dados do banco de dados. Você pode encontrar mais informações sobre como configurar o probe de captura no repositório oficial:
👉 [https://github.com/mickamy/sql-tap](https://github.com/mickamy/sql-tap)

## 📂 Estrutura do Repositório

*   `src/main`: Lógica do processo principal do Electron e servidor gRPC.
*   `src/renderer`: Interface do usuário em React.
*   `src/proto`: Definições de Protocol Buffers para comunicação.

---

Desenvolvido para oferecer a melhor experiência em monitoramento de banco de dados.
