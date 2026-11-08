import type { Request, Response } from 'express';
import { exigirUsuario } from '../../shared/types/requisicao';
import type { AgendaService } from './agenda.service';

export class AgendaController {
  constructor(private readonly servico: AgendaService) {}

  obterGrade = async (req: Request, res: Response): Promise<void> => {
    const faixas = await this.servico.obterGrade(exigirUsuario(req).id);
    res.status(200).json({ faixas });
  };

  substituirGrade = async (req: Request, res: Response): Promise<void> => {
    const faixas = await this.servico.substituirGrade(exigirUsuario(req).id, req.body);
    res.status(200).json({ faixas });
  };

  listarBloqueios = async (req: Request, res: Response): Promise<void> => {
    const itens = await this.servico.listarBloqueios(exigirUsuario(req).id);
    res.status(200).json({ itens });
  };

  criarBloqueio = async (req: Request, res: Response): Promise<void> => {
    const bloqueio = await this.servico.criarBloqueio(exigirUsuario(req).id, req.body);
    res.status(201).json(bloqueio);
  };

  removerBloqueio = async (req: Request, res: Response): Promise<void> => {
    await this.servico.removerBloqueio(exigirUsuario(req).id, String(req.params.id));
    res.status(204).send();
  };
}
