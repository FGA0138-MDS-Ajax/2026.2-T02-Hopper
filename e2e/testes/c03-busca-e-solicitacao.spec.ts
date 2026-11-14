import { expect, test } from '@playwright/test';
import { capturar, criarConta, criarProfessor, entrarComo } from '../apoio/api';

// C03 — Busca de professores e solicitação de aula (RF07, RF08, RF09)

test.describe('C03 — Busca e solicitação', () => {
  test('CT04 — aluno solicita aula em horário livre e o professor é avisado', async ({ page }, testInfo) => {
    const professor = await criarProfessor('Professor Solicitado');
    const aluno = await criarConta('ALUNO', 'Aluno Solicitante');
    await entrarComo(page, aluno);

    // Perfil do professor: escolhe um horário livre e segue para a solicitação.
    await page.goto(`/professores/${professor.professorId}`);
    await page.getByRole('list', { name: 'Horários livres' }).getByRole('button').first().click();
    await capturar(page, testInfo, 'horário escolhido no perfil do professor');
    await page.getByRole('link', { name: 'Solicitar aula' }).click();

    // Com uma só matéria e modalidade, o formulário já vem preenchido.
    await expect(page.getByRole('heading', { name: 'Solicitar aula' })).toBeVisible();
    await page.getByLabel(/Objetivo da aula/).fill('Revisão para a prova');
    await page.getByRole('button', { name: 'Enviar solicitação' }).click();

    await expect(page.getByRole('heading', { name: 'Solicitação enviada' })).toBeVisible();
    await expect(page.getByText('Solicitada', { exact: true })).toBeVisible();
    await capturar(page, testInfo, 'solicitação enviada');

    // O professor recebe o aviso na aplicação.
    await entrarComo(page, professor);
    await page.goto('/notificacoes');
    await expect(page.getByText(/Aluno Solicitante solicitou uma aula de/)).toBeVisible();
    await capturar(page, testInfo, 'aviso para o professor');
  });
});
