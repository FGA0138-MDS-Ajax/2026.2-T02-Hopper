import type { Request, Response } from 'express';
import { exigirUsuario } from '../../shared/types/requisicao';
import type { EntradaListarNotificacoes } from './notificacoes.schemas';
import type { NotificacoesService } from './notificacoes.service';

export class NotificacoesController {
  constructor(private readonly servico: NotificacoesService) {}

  listar = async (req: Request, res: Response): Promise<void> => {
    const listagem = await this.servico.listar(
      exigirUsuario(req).id,
      req.query as unknown as EntradaListarNotificacoes,
    );
    res.status(200).json(listagem);
  };

  marcarComoLidas = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.servico.marcarComoLidas(exigirUsuario(req).id, req.body);
    res.status(200).json(resultado);
  };
}
