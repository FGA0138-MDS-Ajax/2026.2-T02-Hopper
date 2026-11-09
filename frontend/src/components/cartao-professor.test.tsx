import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProfessorPublico } from '../services/professores';
import { renderizar } from '../test/renderizar';
import { CartaoProfessor } from './cartao-professor';

const BASE: ProfessorPublico = {
  id: 'p9',
  nome: 'Carlos Eduardo Lima',
  apresentacao: 'Aulas de redação para o ENEM.',
  valorHora: null,
  modalidades: ['DOMICILIO'],
  materias: [{ id: 'm1', nome: 'Redação', nivel: 'Ensino Médio' }],
};

describe('CartaoProfessor', () => {
  it('mostra as iniciais do primeiro e do último nome', () => {
    renderizar(<CartaoProfessor professor={BASE} />);
    expect(screen.getByText('CL')).toBeInTheDocument();
  });

  it('mostra "Valor a consultar" quando o professor não informou o valor', () => {
    renderizar(<CartaoProfessor professor={BASE} />);
    expect(screen.getByText('Valor a consultar')).toBeInTheDocument();
  });

  it('não mostra o contador de matérias extras quando cabem todas', () => {
    renderizar(<CartaoProfessor professor={BASE} />);
    expect(screen.getByText('Em domicílio')).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });
});
