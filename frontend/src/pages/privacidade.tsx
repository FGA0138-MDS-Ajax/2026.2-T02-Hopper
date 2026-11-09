import type { ReactNode } from 'react';
import { Cabecalho } from '../components/cabecalho';
import { Rodape } from '../components/rodape';

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-tinta">{titulo}</h2>
      <div className="space-y-3 text-suave">{children}</div>
    </section>
  );
}

/** Política de privacidade (RNF06 — LGPD, Lei nº 13.709/2018). */
export function PaginaPrivacidade() {
  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho />
      <main className="conteudo flex-1 py-12 sm:py-16">
        <article className="mx-auto max-w-3xl space-y-10">
          <header className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-tinta sm:text-5xl">Política de privacidade</h1>
            <p className="text-suave">
              Esta política explica quais dados o AulaCerta coleta, por que coleta e como você pode exercer seus direitos
              previstos na Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </header>

          <Secao titulo="Sobre o AulaCerta">
            <p>
              O AulaCerta é um projeto acadêmico desenvolvido pelo Grupo Hopper na disciplina de Métodos de
              Desenvolvimento de Software da UnB/FCTE. A plataforma é usada para demonstração e testes e não realiza
              pagamentos.
            </p>
          </Secao>

          <Secao titulo="Quais dados coletamos">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-tinta">Cadastro:</strong> nome, e-mail, telefone (opcional) e senha. A senha é
                guardada apenas em formato cifrado e ninguém da equipe consegue lê-la.
              </li>
              <li>
                <strong className="text-tinta">Perfil de professor:</strong> apresentação, matérias, níveis, modalidades,
                valor da hora-aula e horários disponíveis.
              </li>
              <li>
                <strong className="text-tinta">Aulas:</strong> solicitações, horários, objetivo informado, mudanças de
                status, anotações e avaliações.
              </li>
            </ul>
            <p>Coletamos só o necessário para agendar e acompanhar as aulas.</p>
          </Secao>

          <Secao titulo="Para que usamos os dados">
            <ul className="list-disc space-y-2 pl-5">
              <li>Criar e proteger sua conta.</li>
              <li>Mostrar professores e horários disponíveis na busca.</li>
              <li>Registrar solicitações, confirmações, remarcações e cancelamentos de aulas.</li>
              <li>Exibir notificações e lembretes dentro da plataforma.</li>
              <li>Enviar o e-mail de recuperação de senha, quando você pedir.</li>
            </ul>
            <p>Não enviamos propaganda e não vendemos ou cedemos seus dados a terceiros.</p>
          </Secao>

          <Secao titulo="Quem vê seus dados">
            <p>
              O perfil público do professor (nome, apresentação, matérias, modalidades, valor e horários livres) pode ser
              visto por qualquer visitante. O telefone e o e-mail de aluno e professor só ficam visíveis para a outra parte
              depois que a aula é confirmada.
            </p>
          </Secao>

          <Secao titulo="Armazenamento e segurança">
            <p>
              Os dados ficam em um banco de dados com conexão protegida, e toda a comunicação com a plataforma usa HTTPS. O
              navegador guarda apenas o token da sua sessão, que é apagado quando você sai da conta.
            </p>
          </Secao>

          <Secao titulo="Seus direitos">
            <p>
              Você pode, a qualquer momento, consultar e corrigir seus dados pelo seu perfil e pedir a exclusão da sua
              conta e dos dados associados. Também pode revogar o consentimento dado no cadastro, o que encerra o uso da
              plataforma.
            </p>
          </Secao>

          <p className="border-t border-slate-200 pt-6 text-sm text-suave">Última atualização: novembro de 2026.</p>
        </article>
      </main>
      <Rodape />
    </div>
  );
}
