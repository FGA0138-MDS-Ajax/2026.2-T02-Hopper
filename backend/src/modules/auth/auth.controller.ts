import type { Request, Response } from 'express';
import { exigirUsuario } from '../../shared/types/requisicao';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly servico: AuthService) {}

  cadastrar = async (req: Request, res: Response): Promise<void> => {
    const usuario = await this.servico.cadastrar(req.body);
    res.status(201).json(usuario);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.servico.autenticar(req.body);
    res.status(200).json(resultado);
  };

  usuarioAtual = async (req: Request, res: Response): Promise<void> => {
    const usuario = await this.servico.obterUsuarioAtual(exigirUsuario(req).id);
    res.status(200).json(usuario);
  };

  recuperarSenha = async (req: Request, res: Response): Promise<void> => {
    await this.servico.solicitarRecuperacao(req.body.email);
    res.status(204).send();
  };

  redefinirSenha = async (req: Request, res: Response): Promise<void> => {
    await this.servico.redefinirSenha(req.body);
    res.status(204).send();
  };
}
