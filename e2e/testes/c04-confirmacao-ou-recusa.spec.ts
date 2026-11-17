import { expect, test } from '@playwright/test';
import {
  capturar,
  criarConta,
  criarProfessor,
  entrarComo,
  horarioLivreComFolga,
  horariosLivres,
  solicitarAula,
} from '../apoio/api';

// C04 — Confirmação ou recusa de aula (RF11, RF12, RF13)

async function continuaLivre(professorId: string, inicio: string): Promise<boolean> {
  const alvo = new Date(inicio).getTime();
  return (await horariosLivres(professorId)).some((livre) => new Date(livre.inicio).getTime() === alvo);
}

test.describe('C04 — Confirmação ou recusa', () => {
  test('CT06 — professor aceita: aula confirmada, horário bloqueado e aluno avisado', async ({ page }, testInfo) => {
    const professor = await criarProfessor('Professora Aceite');
    const aluno = await criarConta('ALUNO', 'Aluno Aceito');
    const horario = await horarioLivreComFolga(professor.professorId);
    await solicitarAula(aluno, professor, horario);

    await entrarComo(page, professor);
    await page.goto('/minhas-aulas');
    await expect(page.getByRole('article', { name: /Aluno: Aluno Aceito/ })).toBeVisible();
    await capturar(page, testInfo, 'pedido para responder');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await expect(page.getByRole('status')).toContainText('Aula com Aluno Aceito confirmada');
    await capturar(page, testInfo, 'aula confirmada');

    // O horário deixa de aparecer como livre.
    expect(await continuaLivre(professor.professorId, horario.inicio)).toBe(false);

    // O aluno vê o aviso e a aula confirmada.
    await entrarComo(page, aluno);
    await page.goto('/notificacoes');
    await expect(page.getByText(/Professora Aceite confirmou a sua aula/)).toBeVisible();
    await page.goto('/minhas-aulas');
    await expect(page.getByRole('article', { name: /com Professora Aceite/ }).getByText('Confirmada')).toBeVisible();
    await capturar(page, testInfo, 'aluno vê a aula confirmada');
  });

  test('CT07 — professor recusa: aula recusada, horário continua livre e aluno avisado', async ({ page }, testInfo) => {
    const professor = await criarProfessor('Professor Recusa');
    const aluno = await criarConta('ALUNO', 'Aluno Recusado');
    const horario = await horarioLivreComFolga(professor.professorId);
    await solicitarAula(aluno, professor, horario);

    await entrarComo(page, professor);
    await page.goto('/minhas-aulas');
    await page.getByRole('button', { name: 'Recusar' }).click();
    await page.getByLabel(/Motivo da recusa/).fill('Neste dia não consigo atender');
    await page.getByRole('button', { name: 'Confirmar recusa' }).click();
    await expect(page.getByRole('status')).toContainText('Pedido de Aluno Recusado recusado');
    await capturar(page, testInfo, 'pedido recusado');

    // O horário continua livre para outros alunos.
    expect(await continuaLivre(professor.professorId, horario.inicio)).toBe(true);

    await entrarComo(page, aluno);
    await page.goto('/notificacoes');
    await expect(page.getByText(/Professor Recusa recusou a sua aula/)).toContainText(
      'Motivo: Neste dia não consigo atender',
    );
    await capturar(page, testInfo, 'aviso de recusa para o aluno');
  });
});
