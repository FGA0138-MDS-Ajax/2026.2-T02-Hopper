import { expect, test } from '@playwright/test';
import { capturar, criarProfessor, entrarComo } from '../apoio/api';

// C02 — Perfil e disponibilidade do professor (RF04, RF05)

test.describe('C02 — Perfil e disponibilidade', () => {
  test('CT03 — professor publica a grade semanal e os horários aparecem no perfil público', async ({
    page,
  }, testInfo) => {
    const professor = await criarProfessor('Professora Grade', { comGrade: false });
    await entrarComo(page, professor);

    await page.goto('/meu-perfil?aba=grade');
    await page.getByRole('button', { name: 'Adicionar horário na Segunda-feira' }).click();
    await page.getByRole('button', { name: 'Adicionar horário na Quarta-feira' }).click();
    await capturar(page, testInfo, 'grade preenchida');
    await page.getByRole('button', { name: 'Salvar grade' }).click();
    await expect(page.getByRole('status')).toContainText('Grade salva. Os novos horários já aparecem para os alunos.');

    // O perfil público mostra os horários livres derivados da grade.
    await page.goto(`/professores/${professor.professorId}`);
    await expect(page.getByRole('heading', { name: 'Professora Grade' })).toBeVisible();
    const diasComHorario = page.getByRole('list', { name: 'Dias da semana' }).getByRole('button', { disabled: false });
    await expect(diasComHorario.first()).toBeVisible();
    await expect(page.getByRole('list', { name: 'Horários livres' }).getByRole('button').first()).toBeVisible();
    await capturar(page, testInfo, 'horários no perfil público');
  });
});
