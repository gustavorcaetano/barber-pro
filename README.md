#  BARBER PRO: Agendamento Inteligente
### *Seu salão 24/7 com inteligência e concorrência zero*
**“A revolução do agendamento digital no setor de beleza.”**

<div align="center">
  <img src="./public/favicon.ico" width="180" alt="Logo Barber Pro">
</div>

---

##  BADGES

###  TECNOLOGIAS & STACK
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

###  CLOUD & SERVICES
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?style=for-for-the-badge&logo=resend&logoColor=white)

###  STATUS DO PROJETO
![STATUS](https://img.shields.io/badge/STATUS-EM%20DEPLOYMENT-007bff?style=for-the-badge)

---

#  SOBRE O PROJETO

O **Barber Pro** é um Sistema de Agendamento como Serviço (SAAS) moderno, focado em barbearias e salões de beleza. Ele resolve o problema clássico de agendamento manual, oferecendo uma experiência de usuário fluida e garantindo a integridade dos dados através de uma lógica robusta de **controle de concorrência**.

Criado como um projeto de **portfólio completo Full Stack**, simula um sistema de produção real com autenticação, persistência de dados e notificações transacionais.

---

#  DESAFIOS E SOLUÇÕES

Este projeto foi construído para enfrentar problemas comuns em sistemas de reserva, demonstrando a capacidade de desenvolvimento de *back-end* seguro e eficiente:

| Desafio | Solução Implementada |
| :--- | :--- |
| **Concorrência de Horários** | Implementação de lógica de **verificação atômica** (*server-side*), que consulta o banco de dados para garantir que a combinação `barber_id`, `appointment_date` e `appointment_time` seja única **antes de qualquer inserção**. |
| **Experiência de Usuário** | Interface limpa e responsiva utilizando **Tailwind CSS** e componentes **Shadcn**, oferecendo navegação intuitiva para seleção de serviço, barbeiro e horário. |
| **Feedback Transacional** | Autenticação e notificações de agendamento em tempo real via **Resend**, garantindo que o cliente receba a confirmação por e-mail imediatamente. |
| **Deploy Rápido e Escalável** | Uso do **Vercel** para deploy contínuo, integrando-se ao **Supabase** para um *backend* sem servidor (*serverless*). |

---

#  FUNCIONALIDADES CHAVE

###  AGENDAMENTO
- Seleção de Barbeiro, Serviço e Horário.
- Lógica de **Controle de Conflitos** (Core) que impede agendamentos duplicados.
- Notificações de confirmação por E-mail (via Resend).

###  AUTENTICAÇÃO
- Cadastro e Login de clientes via e-mail e senha.

###  PAINEL
- **Painel do Cliente:** Área dedicada para visualizar e gerenciar agendamentos futuros.

---

#  TECNOLOGIAS UTILIZADAS (O PODER DO STACK)

| Tecnologia | Função no Projeto | Por que foi escolhida? |
| :--- | :--- | :--- |
| **React + TypeScript** | Desenvolvimento Front-End. | **Tipagem Forte** para reduzir erros e **componentização** para reuso e manutenibilidade. |
| **Vite** | Ferramenta de Build (bundler). | **Inicialização e *Hot Reload*** incrivelmente rápidos, otimizando o desenvolvimento local. |
| **Tailwind CSS / Shadcn** | Estilização e Design System. | **Desenvolvimento rápido** e responsivo, focado em utilitários e componentes prontos. |
| **Supabase** | Banco de Dados (PostgreSQL) e Autenticação. | **Backend como Serviço (BaaS)**, facilitando a **lógica de concorrência** e a persistência de dados. |
| **Vercel** | Hospedagem e Deploy Contínuo. | Plataforma ideal para *front-ends* React, oferecendo **deploy instantâneo** a cada *push* no GitHub. |
| **Resend** | Serviço de Envio de E-mails Transacionais. | **API simples** e confiável, essencial para o *feedback* imediato do cliente após o agendamento. |

---

#  DEMONSTRAÇÃO

🔗 **Site ([Publicado no Vercel](https://barber-pro-five.vercel.app/)):**
`[INSERIR URL DO VERCEL AQUI]`

###  CAPTURAS DE TELA

> *(Substitua pelos caminhos reais quando enviar para o GitHub)*

![[Agendamento](https://barber-pro-five.vercel.app/cliente/login)](./img/agendamento.png)
![[Painel Cliente](https://barber-pro-five.vercel.app/cliente/login)](./img/painel-cliente.png)

---

---

#  OBJETIVO

Este projeto foi desenvolvido para compor o portfólio e demonstrar domínio de:

- **Desenvolvimento Full Stack** (React/Vite e Supabase).
- **Controle de Concorrência** e integridade de dados.
- **Ecossistema Serverless** (BaaS e Hospedagem na Nuvem).
- Integração de **Serviços Externos** (E-mail transacional).

---

#  AUTOR

**Gustavo Ramos Caetano**
Desenvolvedor Web • Estudante do IFSP Guarulhos

* [LinkedIn]
* [GitHub]

---

## ⚖️ Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

Feito com ❤️ por [Gustavo Ramos Caetano] - [[Seu LinkedIn ou Portfólio](https://gustavorcaetano.github.io/meu-portfolio/)]
