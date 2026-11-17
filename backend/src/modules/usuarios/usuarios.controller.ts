import type { Request, Response } from 'express';
import { lerConsulta } from '../../shared/middlewares/validar';
import { exigirUsuario } from '../../shared/types/requisicao';
import { esquemaBuscaProfessores } from './usuarios.schemas';
import type { UsuariosService } from './usuarios.service';

export class UsuariosController {
  constructor(private readonly servico: UsuariosService) {}

  buscarProfessores = async (req: Request, res: Response): Promise<void> => {
    const pagina = await this.servico.buscarProfessores(lerConsulta(req, esquemaBuscaProfessores));
    res.status(200).json(pagina);
  };

  obterProfessor = async (req: Request, res: Response): Promise<void> => {
    const professor = await this.servico.obterProfessorPublico(String(req.params.id));
    res.status(200).json(professor);
  };

  obterPerfilProprio = async (req: Request, res: Response): Promise<void> => {
    const perfil = await this.servico.obterPerfilProprio(exigirUsuario(req).id);
    res.status(200).json(perfil);
  };

  atualizarPerfilProprio = async (req: Request, res: Response): Promise<void> => {
    const perfil = await this.servico.atualizarPerfilProprio(exigirUsuario(req).id, req.body);
    res.status(200).json(perfil);
  };

  listarMaterias = async (_req: Request, res: Response): Promise<void> => {
    const itens = await this.servico.listarMaterias();
    res.status(200).json({ itens });
  };

  atualizarUsuario = async (req: Request, res: Response): Promise<void> => {
    const usuario = await this.servico.atualizarUsuario(exigirUsuario(req).id, req.body);
    res.status(200).json(usuario);
  };
}
