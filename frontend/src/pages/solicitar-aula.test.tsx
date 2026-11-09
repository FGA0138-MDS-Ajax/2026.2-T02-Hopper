import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { removerToken, salvarToken } from '../services/api';
import { obterUsuarioAtual, type Usuario } from '../services/auth';
import { solicitarAula, type Aula } from '../services/aulas';
import { buscarProfessor, type ProfessorDetalhe } from '../services/professores';
import { renderizar } from '../test/renderizar';
import { PaginaSolicitarAula } from './solicitar-aula';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  obterUsuarioAtual: vi.fn(),
}));
vi.mock('../services/professores', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/professores')>()),
  buscarProfessor: vi.fn(),
}));
vi.mock('../services/aulas', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/aulas')>()),
  solicitarAula: vi.fn(),
}));

const usuarioMock = vi.mocked(obterUsuarioAtual);
const professorMock = vi.mocked(buscarProfessor);
const solicitarMock = vi.mocked(solicitarAula);

const INICIO = '2026-11-12T14:00:00.000-03:00';
const FIM = '2026-11-12T15:00:00.000-03:00';

const CAIO: Usuario = { id: 'u1', nome: 'Caio Alves', email: 'caio@email.com', telefone: null, perfil: 'ALUNO' };

const ANA: ProfessorDetalhe = {
  id: 'p1',
  nome: 'Ana Souza',
  apresentacao: 'Exatas.',
  valorHora: 90,
  modalidades: ['ONLINE', 'PRESENCIAL'],
  materias: [
    { id: 'm1', nome: 'Física', nivel: 'Ensino Médio' },
    { id: 'm2', nome: 'Matemática', nivel: 'Ensino Médio' },
  ],
  horariosLivres: [{ inicio: INICIO, fim: FIM }],
};

const AULA: Aula = {
  id: 'a1',
  inicio: INICIO,
  fim: FIM,
  modalidade: 'ONLINE',
  objetivo: 'Revisar funções',
  status: 'SOLICITADA',
  serieId: null,
  motivoCancelamento: null,
  criadoEm: '2026-11-09T10:00:00.000-03:00',
  materia: { id: 'm2', nome: 'Matemática', nivel: 'Ensino Médio' },
  aluno: { id: 'u1', nome: 'Caio Alves' },
  professor: { id: 'p1', usuarioId: 'up1', nome: 'Ana Souza' },
};

function erroApi(status: number, codigo: string, mensagem: string): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('falha', 'ERR', config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data: { erro: { codigo, mensagem, detalhes: null } },
  });
}

function abrir(busca = `?inicio=${encodeURIComponent(INICIO)}&fim=${encodeURIComponent(FIM)}`) {
  return renderizar(<PaginaSolicitarAula />, {
    url: `/professores/p1/solicitar${busca}`,
    caminho: '/professores/:id/solicitar',
  });
}

async function escolherEEnviar() {
  await userEvent.click(await screen.findByRole('radio', { name: /Matemática/ }));
  await userEvent.click(screen.getByRole('radio', { name: 'Online' }));
  await userEvent.type(screen.getByLabelText(/Objetivo da aula/), '  Revisar funções  ');
  await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitação' }));
}

describe('PaginaSolicitarAula', () => {
  beforeEach(() => {
    salvarToken('token-do-caio');
    usuarioMock.mockResolvedValue(CAIO);
    professorMock.mockResolvedValue(ANA);
  });

  afterEach(() => removerToken());

  it('mostra o resumo do horário escolhido e o formulário', async () => {
    abrir();

    expect(await screen.findByRole('heading', { name: 'Solicitar aula' })).toBeInTheDocument();
    const resumo = screen.getByRole('complementary', { name: 'Resumo do pedido' });
    expect(within(resumo).getByText('Ana Souza')).toBeInTheDocument();
    expect(within(resumo).getByText('quinta-feira, 12 de novembro')).toBeInTheDocument();
    expect(within(resumo).getByText(/14h às 15h/)).toBeInTheDocument();
    expect(within(resumo).getByRole('link', { name: 'Trocar horário' })).toHaveAttribute('href', '/professores/p1#horarios');
  });

  it('exige matéria e modalidade quando há mais de uma opção', async () => {
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar solicitação' }));

    expect(await screen.findByText('Escolha a matéria e o nível.')).toBeInTheDocument();
    expect(screen.getByText('Escolha a modalidade da aula.')).toBeInTheDocument();
    expect(solicitarMock).not.toHaveBeenCalled();
  });

  it('envia o pedido e mostra a confirmação com o status "Solicitada"', async () => {
    solicitarMock.mockResolvedValue([AULA]);
    abrir();

    await escolherEEnviar();

    expect(solicitarMock).toHaveBeenCalledWith({
      professorId: 'p1',
      materiaId: 'm2',
      modalidade: 'ONLINE',
      inicio: INICIO,
      fim: FIM,
      objetivo: 'Revisar funções',
    });
    expect(await screen.findByRole('heading', { name: 'Solicitação enviada' })).toBeInTheDocument();
    expect(screen.getByText('Solicitada')).toBeInTheDocument();
    expect(screen.getByText('Matemática · Ensino Médio')).toBeInTheDocument();
  });

  it('com uma só matéria e modalidade, elas já vêm marcadas', async () => {
    professorMock.mockResolvedValue({ ...ANA, materias: [ANA.materias[0]], modalidades: ['ONLINE'] });
    solicitarMock.mockResolvedValue([{ ...AULA, materia: ANA.materias[0] }]);
    abrir();

    await userEvent.click(await screen.findByRole('button', { name: 'Enviar solicitação' }));

    expect(solicitarMock).toHaveBeenCalledWith(
      expect.objectContaining({ materiaId: 'm1', modalidade: 'ONLINE', objetivo: undefined }),
    );
  });

  it('se o horário foi ocupado, avisa e oferece escolher outro', async () => {
    solicitarMock.mockRejectedValue(erroApi(409, 'HORARIO_INDISPONIVEL', 'O horário escolhido não está disponível'));
    abrir();

    await escolherEEnviar();

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('O horário escolhido não está disponível');
    expect(within(alerta).getByRole('link', { name: 'Escolher outro horário' })).toHaveAttribute(
      'href',
      '/professores/p1#horarios',
    );
  });

  it('professor logado não pode solicitar', async () => {
    usuarioMock.mockResolvedValue({ ...CAIO, perfil: 'PROFESSOR' });
    abrir();

    expect(await screen.findByRole('heading', { name: 'Só alunos podem solicitar aulas' })).toBeInTheDocument();
  });

  it('sem horário no link, pede para escolher um', async () => {
    abrir('');
    expect(await screen.findByRole('heading', { name: 'Escolha um horário' })).toBeInTheDocument();
  });

  it('horário que não está mais livre não deixa preencher o pedido', async () => {
    professorMock.mockResolvedValue({ ...ANA, horariosLivres: [] });
    abrir();

    expect(await screen.findByRole('heading', { name: 'Este horário não está mais disponível' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar solicitação' })).not.toBeInTheDocument();
  });
});
