import { expect, test } from '@playwright/test';
import { SENHA, capturar, criarConta, emailUnico } from '../apoio/api';

// C01 — Cadastro e autenticação de usuários (RF01, RF02)

test.describe('C01 — Cadastro e autenticação', () => {
  test('CT01 — aluno se cadastra e vai para a busca de professores', async ({ page }, testInfo) => {
    await page.goto('/cadastro');
    await expect(page.getByRole('radio', { name: /Quero aprender/ })).toBeChecked();
    await page.getByLabel('Nome completo').fill('Aluno de Teste');
    await page.getByLabel('E-mail').fill(emailUnico('ct01.aluno'));
    await page.getByLabel('Telefone (opcional)').fill('61988887777');
    await page.getByLabel('Senha', { exact: true }).fill(SENHA);
    await page.getByRole('checkbox').check();
    await capturar(page, testInfo, 'formulário de cadastro preenchido');

    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL(/\/professores$/);
    await expect(page.getByRole('link', { name: /Olá, Aluno/ })).toBeVisible();
    await capturar(page, testInfo, 'aluno logado na busca de professores');
  });

  test('CT01 — professor se cadastra e vai completar o perfil', async ({ page }, testInfo) => {
    await page.goto('/cadastro?perfil=PROFESSOR');
    await expect(page.getByRole('radio', { name: /Quero dar aulas/ })).toBeChecked();
    await page.getByLabel('Nome completo').fill('Professor de Teste');
    await page.getByLabel('E-mail').fill(emailUnico('ct01.professor'));
    await page.getByLabel('Senha', { exact: true }).fill(SENHA);
    await page.getByRole('checkbox').check();

    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL(/\/meu-perfil\?bem-vindo=1$/);
    await expect(page.getByText('Conta criada! Complete seu perfil')).toBeVisible();
    await capturar(page, testInfo, 'professor na área de perfil');
  });

  test('CT02 — login com senha errada é recusado sem dizer qual dado está errado', async ({ page }, testInfo) => {
    const aluno = await criarConta('ALUNO', 'Aluno Login');
    await page.goto('/entrar');
    await page.getByLabel('E-mail').fill(aluno.email);
    await page.getByLabel('Senha', { exact: true }).fill('SenhaErrada123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos');
    await expect(page).toHaveURL(/\/entrar/);
    await capturar(page, testInfo, 'login recusado');
  });

  test('CT02.2 — usuário entra, sai e perde o acesso às telas protegidas', async ({ page }, testInfo) => {
    const aluno = await criarConta('ALUNO', 'Aluno Sair');
    await page.goto('/entrar');
    await page.getByLabel('E-mail').fill(aluno.email);
    await page.getByLabel('Senha', { exact: true }).fill(SENHA);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('link', { name: /Olá, Aluno/ })).toBeVisible();
    await capturar(page, testInfo, 'logado');

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Entrar' })).toBeVisible();

    await page.goto('/minhas-aulas');
    await expect(page).toHaveURL(/\/entrar\?voltar=%2Fminhas-aulas/);
    await capturar(page, testInfo, 'tela protegida leva ao login');
  });
});
