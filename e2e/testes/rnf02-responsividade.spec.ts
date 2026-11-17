import { expect, test } from '@playwright/test';
import { capturar, criarConta, criarProfessor, entrarComo, horarioLivreComFolga } from '../apoio/api';

// RNF02 — Responsividade: telas utilizáveis a partir de 360 px de largura, sem rolagem horizontal.

test.use({ viewport: { width: 360, height: 740 } });

/** Quantos pixels a página passa da largura da tela (0 = sem rolagem horizontal). */
async function excessoHorizontal(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test('CT12 — telas principais em 360 px, sem rolagem horizontal', async ({ page }, testInfo) => {
  const professor = await criarProfessor('Professora Celular');
  const aluno = await criarConta('ALUNO', 'Aluno Celular');
  const horario = await horarioLivreComFolga(professor.professorId);
  const parametros = new URLSearchParams({ inicio: horario.inicio, fim: horario.fim });
  const solicitar = `/professores/${professor.professorId}/solicitar?${parametros.toString()}`;

  const publicas = ['/', '/professores', `/professores/${professor.professorId}`, '/entrar', '/cadastro'];
  const doAluno = ['/minhas-aulas', '/notificacoes', '/meu-perfil', solicitar];

  for (const caminho of publicas) {
    await test.step(`visitante: ${caminho}`, async () => {
      await page.goto(caminho);
      await expect(page.getByRole('main')).toBeVisible();
      expect.soft(await excessoHorizontal(page), `rolagem horizontal em ${caminho}`).toBeLessThanOrEqual(0);
      await capturar(page, testInfo, `360px ${caminho}`);
    });
  }

  await entrarComo(page, aluno);
  for (const caminho of doAluno) {
    await test.step(`aluno: ${caminho}`, async () => {
      await page.goto(caminho);
      await expect(page.getByRole('main')).toBeVisible();
      expect.soft(await excessoHorizontal(page), `rolagem horizontal em ${caminho}`).toBeLessThanOrEqual(0);
      await capturar(page, testInfo, `360px ${caminho.split('?')[0]}`);
    });
  }
});
